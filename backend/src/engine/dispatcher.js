/**
 * Dispatches immediate push alerts, queues digest entries, collapses burst updates,
 * and cleans up unregistered Expo push tokens after receipt checks.
 * Deliberately evaluates quiet hours in IST (`Asia/Kolkata`) to match Indian user schedules.
 */
import { checkExpoReceipts, sendExpoPushes } from '../integrations/expoPush.js';
import { Change, Device, Notification, User, Watch } from '../models/index.js';

const BURST_WINDOW_MS = 10 * 60 * 1000;

function getIstHHMM(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

/**
 * Checks whether `now` falls inside a user's configured IST quiet-hours window.
 * Supports overnight ranges that wrap past midnight (for example `22:00` to `07:00`).
 *
 * @param {object} [quietHours] - User quiet-hours configuration (`enabled`, `start`, `end`).
 * @param {Date} [now] - Timestamp to test in IST.
 * @returns {boolean} True when non-urgent pushes should defer to digest.
 */
export function isInQuietHours(quietHours, now = new Date()) {
  if (!quietHours?.enabled) return false;
  const start = quietHours.start || '22:00';
  const end = quietHours.end || '07:00';
  const current = getIstHHMM(now);
  if (start === end) return false;
  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

// --- Immediate eligibility and burst protection ---

function hasUrgentDeadline24h(change, now = new Date()) {
  const dates = change.analysis?.dates || [];
  const horizon = now.getTime() + 24 * 60 * 60 * 1000;
  return dates.some((d) => {
    const ts = new Date(`${d.iso}T23:59:00.000Z`).getTime();
    return !Number.isNaN(ts) && ts >= now.getTime() && ts <= horizon;
  });
}

function indexDevicesByUser(devices) {
  const devicesByUser = new Map();
  for (const d of devices) {
    const key = String(d.userId);
    if (!devicesByUser.has(key)) devicesByUser.set(key, []);
    devicesByUser.get(key).push(d);
  }
  return devicesByUser;
}

function shouldSendImmediatePush({ watch, user, change, urgent24h, now }) {
  const wantsImmediate =
    change.impact === 'HIGH' || (change.impact === 'MEDIUM' && watch.priority === 'instant');
  if (!wantsImmediate) return false;
  const quiet = isInQuietHours(user.quietHours, now);
  // Allow opted-in users to break quiet hours when a HIGH notice contains a deadline within 24h.
  const canBypassQuiet = change.impact === 'HIGH' && user.quietHours?.bypassHighUrgent && urgent24h;
  return !quiet || canBypassQuiet;
}

async function queueDigestNotification(userId, changeId) {
  const exists = await Notification.exists({ userId, changeId, kind: 'digest' });
  if (exists) return false;
  await Notification.create({
    userId,
    changeId,
    kind: 'digest',
    status: 'queued',
  });
  return true;
}

async function checkPushEligibility({ userId, changeId, burstChangeIds, now }) {
  const alreadyNotified = await Notification.exists({ userId, changeId, kind: 'push' });
  if (alreadyNotified) return 'duplicate';

  if (burstChangeIds.length > 0) {
    // Collapse repeat pushes for the same flapping source within a 10-minute burst window.
    const recentPush = await Notification.exists({
      userId,
      changeId: { $in: burstChangeIds },
      kind: 'push',
      status: 'sent',
      sentAt: { $gte: new Date(now.getTime() - BURST_WINDOW_MS) },
    });
    if (recentPush) return 'collapsed';
  }

  return 'send';
}

function appendUserPushMessages({ user, userDevices, source, change, messages, pendingUserRows }) {
  for (const dev of userDevices) {
    messages.push({
      to: dev.expoPushToken,
      title: `${source.name} (${change.impact})`,
      body: change.after.slice(0, 140),
      sound: 'default',
      data: {
        changeId: String(change._id),
        url: `khabri://change/${change._id}`,
      },
    });
    pendingUserRows.push({ userId: user._id, token: dev.expoPushToken });
  }
}

async function recordPushTickets(tickets, pendingUserRows, changeId, now) {
  const recordedUsers = new Set();
  let sent = 0;

  for (let i = 0; i < tickets.length; i += 1) {
    const row = pendingUserRows[i];
    const ticket = tickets[i]?.ticket;
    const key = String(row.userId);
    if (recordedUsers.has(key)) continue;
    recordedUsers.add(key);

    const isOk = ticket?.status === 'ok';
    await Notification.create({
      userId: row.userId,
      changeId,
      kind: 'push',
      status: isOk ? 'sent' : 'failed',
      sentAt: now,
      ...(ticket?.id ? { expoTicketId: ticket.id } : {}),
    });
    if (isOk) sent += 1;
  }

  return sent;
}

async function handleSingleWatch({
  watch,
  userMap,
  change,
  source,
  urgent24h,
  burstChangeIds,
  now,
  devicesByUser,
  messages,
  pendingUserRows,
}) {
  const userIdStr = String(watch.userId);
  const user = userMap.get(userIdStr);
  if (!user) return { queued: 0, collapsed: 0 };

  if (!shouldSendImmediatePush({ watch, user, change, urgent24h, now })) {
    const queued = (await queueDigestNotification(user._id, change._id)) ? 1 : 0;
    return { queued, collapsed: 0 };
  }

  const decision = await checkPushEligibility({
    userId: user._id,
    changeId: change._id,
    burstChangeIds,
    now,
  });
  if (decision !== 'send') {
    return { queued: 0, collapsed: decision === 'collapsed' ? 1 : 0 };
  }

  const userDevices = devicesByUser.get(userIdStr) || [];
  if (userDevices.length > 0) {
    appendUserPushMessages({ user, userDevices, source, change, messages, pendingUserRows });
  }
  return { queued: 0, collapsed: 0 };
}

// --- Public dispatch and receipt reconciliation ---

/**
 * Evaluates all active watchers of `source` and dispatches pushes or queues digest items for `change`.
 *
 * @param {object} params - Change, source, timestamp, and optional Expo SDK client.
 * @param {object} params.change - Persisted `Change` document.
 * @param {object} params.source - Persisted `Source` document.
 * @param {Date} [params.now] - Current timestamp used for quiet hours and burst checks.
 * @param {object} [params.expoClient] - Optional Expo client mock.
 * @returns {Promise<{ sent: number, queued: number, collapsed: number }>} Delivery summary.
 */
export async function dispatchChangeNotifications({
  change,
  source,
  now = new Date(),
  expoClient,
}) {
  if (change.impact === 'LOW') {
    return { sent: 0, queued: 0, collapsed: 0 };
  }

  const watches = await Watch.find({ sourceId: source._id, muted: { $ne: true } })
    .select('userId priority')
    .lean();

  if (watches.length === 0) {
    return { sent: 0, queued: 0, collapsed: 0 };
  }

  const userIds = watches.map((w) => w.userId);
  const [users, devices, recentSourceChanges] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    Device.find({ userId: { $in: userIds } }).lean(),
    Change.find({ sourceId: source._id, _id: { $ne: change._id } })
      .select('_id')
      .sort({ detectedAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const devicesByUser = indexDevicesByUser(devices);
  const urgent24h = hasUrgentDeadline24h(change, now);
  const burstChangeIds = recentSourceChanges.map((c) => c._id);

  const messages = [];
  const pendingUserRows = [];
  let queued = 0;
  let collapsed = 0;

  for (const watch of watches) {
    const outcome = await handleSingleWatch({
      watch,
      userMap,
      change,
      source,
      urgent24h,
      burstChangeIds,
      now,
      devicesByUser,
      messages,
      pendingUserRows,
    });
    queued += outcome.queued;
    collapsed += outcome.collapsed;
  }

  if (messages.length === 0) {
    return { sent: 0, queued, collapsed };
  }

  const { tickets, deadTokens } = await sendExpoPushes(messages, expoClient);
  if (deadTokens.length > 0) {
    await Device.deleteMany({ expoPushToken: { $in: deadTokens } });
  }

  const sent = await recordPushTickets(tickets, pendingUserRows, change._id, now);
  return { sent, queued, collapsed };
}

/**
 * Polls Expo push receipts for recently sent alerts and purges unregistered devices.
 *
 * @param {object} [expoClient] - Optional Expo client mock.
 * @returns {Promise<{ checked: number, removedDevices: number }>} Receipt check counts.
 */
export async function processPushReceipts(expoClient) {
  const recent = await Notification.find({
    kind: 'push',
    status: 'sent',
    expoTicketId: { $exists: true, $ne: null },
  })
    .sort({ sentAt: -1 })
    .limit(50)
    .lean();

  if (recent.length === 0) return { checked: 0, removedDevices: 0 };

  const ticketIds = recent.map((n) => n.expoTicketId);
  const { failedIds } = await checkExpoReceipts(ticketIds, expoClient);

  if (failedIds.length > 0) {
    const failedUserIds = recent
      .filter((n) => failedIds.includes(n.expoTicketId))
      .map((n) => n.userId);
    await Notification.updateMany(
      { expoTicketId: { $in: failedIds } },
      { $set: { status: 'failed' } },
    );
    const del = await Device.deleteMany({ userId: { $in: failedUserIds } });
    return { checked: ticketIds.length, removedDevices: del.deletedCount };
  }

  return { checked: ticketIds.length, removedDevices: 0 };
}
