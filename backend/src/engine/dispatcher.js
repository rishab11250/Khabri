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

function hasUrgentDeadline24h(change, now = new Date()) {
  const dates = change.analysis?.dates || [];
  const horizon = now.getTime() + 24 * 60 * 60 * 1000;
  return dates.some((d) => {
    const ts = new Date(`${d.iso}T23:59:00.000Z`).getTime();
    return !Number.isNaN(ts) && ts >= now.getTime() && ts <= horizon;
  });
}

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
  const devicesByUser = new Map();
  for (const d of devices) {
    const key = String(d.userId);
    if (!devicesByUser.has(key)) devicesByUser.set(key, []);
    devicesByUser.get(key).push(d);
  }

  const urgent24h = hasUrgentDeadline24h(change, now);
  const burstChangeIds = recentSourceChanges.map((c) => c._id);
  const messages = [];
  const pendingUserRows = [];
  let queued = 0;
  let collapsed = 0;

  for (const watch of watches) {
    const userIdStr = String(watch.userId);
    const user = userMap.get(userIdStr);
    if (!user) continue;

    const wantsImmediate =
      change.impact === 'HIGH' || (change.impact === 'MEDIUM' && watch.priority === 'instant');
    const quiet = isInQuietHours(user.quietHours, now);
    const canBypassQuiet =
      change.impact === 'HIGH' && user.quietHours?.bypassHighUrgent && urgent24h;

    if (!wantsImmediate || (quiet && !canBypassQuiet)) {
      const exists = await Notification.exists({
        userId: user._id,
        changeId: change._id,
        kind: 'digest',
      });
      if (!exists) {
        await Notification.create({
          userId: user._id,
          changeId: change._id,
          kind: 'digest',
          status: 'queued',
        });
        queued += 1;
      }
      continue;
    }

    const alreadyNotified = await Notification.exists({
      userId: user._id,
      changeId: change._id,
      kind: 'push',
    });
    if (alreadyNotified) continue;

    if (burstChangeIds.length > 0) {
      const recentPush = await Notification.exists({
        userId: user._id,
        changeId: { $in: burstChangeIds },
        kind: 'push',
        status: 'sent',
        sentAt: { $gte: new Date(now.getTime() - BURST_WINDOW_MS) },
      });
      if (recentPush) {
        collapsed += 1;
        continue;
      }
    }

    const userDevices = devicesByUser.get(userIdStr) || [];
    if (userDevices.length === 0) continue;

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

  if (messages.length === 0) {
    return { sent: 0, queued, collapsed };
  }

  const { tickets, deadTokens } = await sendExpoPushes(messages, expoClient);
  if (deadTokens.length > 0) {
    await Device.deleteMany({ expoPushToken: { $in: deadTokens } });
  }

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
      changeId: change._id,
      kind: 'push',
      status: isOk ? 'sent' : 'failed',
      sentAt: now,
      ...(ticket?.id ? { expoTicketId: ticket.id } : {}),
    });
    if (isOk) sent += 1;
  }

  return { sent, queued, collapsed };
}

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
