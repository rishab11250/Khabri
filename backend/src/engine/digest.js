/**
 * Compiles and dispatches daily localized digest push bundles from queued digest notifications.
 * Deliberately flushes stale items older than 24h even if `digestTime` did not align with tick.
 */
import { sendExpoPushes } from '../integrations/expoPush.js';
import { Change, Device, Notification, User } from '../models/index.js';
import { isInQuietHours } from './dispatcher.js';

function getIstHHMM(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
}

function groupByUserId(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = String(row.userId);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function shouldDeferUserDigest(user, userNotifs, { currentHHMM, force, now }) {
  if (force) return false;
  if (isInQuietHours(user.quietHours, now)) return true;
  if (user.digestTime && user.digestTime !== currentHHMM) {
    const oldestAgeHours =
      (now.getTime() - new Date(userNotifs[0].createdAt || now).getTime()) / 3600000;
    // Never starve queued notices longer than 24h when tick minutes skip the exact digest HH:MM.
    if (oldestAgeHours < 24) return true;
  }
  return false;
}

function formatDigestMessage(language, changes) {
  const count = changes.length;
  const sourceNames = Array.from(
    new Set(changes.map((c) => c.sourceId?.name).filter(Boolean)),
  ).slice(0, 3);
  const sourcesSummary =
    sourceNames.length > 0
      ? ` (${sourceNames.join(', ')}${sourceNames.length < count ? ' & more' : ''})`
      : '';

  if (language === 'hi') {
    return {
      title: `दैनिक अख़बार: ${count} नए अपडेट`,
      body: `आपके ट्रैक किए गए पोर्टलों पर ${count} नए नोटिस आए हैं${sourcesSummary}।`,
    };
  }
  if (language === 'gu') {
    return {
      title: `દૈનિક અખબાર: ${count} નવા અપડેટ`,
      body: `તમારા ટ્રેક કરેલા પોર્ટલ પર ${count} નવી નોટિસો આવી છે${sourcesSummary}.`,
    };
  }
  return {
    title: `Daily Khabri Digest: ${count} updates`,
    body: `${count} official notices updated on your watch list${sourcesSummary}.`,
  };
}

async function sendUserDigest({ user, userNotifs, userDevices, expoClient }) {
  const changeIds = userNotifs.map((n) => n.changeId);
  const changes = await Change.find({ _id: { $in: changeIds } })
    .populate('sourceId', 'name')
    .lean();

  const { title, body } = formatDigestMessage(user.language, changes);
  const pushes = userDevices.map((d) => ({
    to: d.expoPushToken,
    title,
    body,
    data: { url: 'khabri://today' },
    sound: 'default',
  }));

  await sendExpoPushes(pushes, expoClient);
}

/**
 * Processes queued digest notifications and sends one summary push per eligible user.
 *
 * @param {object} [options] - Execution options (`now` clock override, `force` window bypass, `expoClient`).
 * @returns {Promise<{ digestsSent: number, notificationsProcessed: number }>} Dispatch counts.
 */
export async function runDigest(options = {}) {
  const now = options.now ?? new Date();
  const currentHHMM = getIstHHMM(now);
  const force = Boolean(options.force);

  const pending = await Notification.find({ kind: 'digest', status: 'queued' })
    .sort({ createdAt: 1 })
    .lean();

  if (pending.length === 0) {
    return { digestsSent: 0, notificationsProcessed: 0 };
  }

  const byUser = groupByUserId(pending);
  const userIds = Array.from(byUser.keys());
  const [users, devices] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    Device.find({ userId: { $in: userIds } }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const devicesByUser = groupByUserId(devices);

  let digestsSent = 0;
  let notificationsProcessed = 0;
  const notificationsToUpdate = [];

  for (const [uId, userNotifs] of byUser.entries()) {
    const user = userMap.get(uId);
    if (!user || shouldDeferUserDigest(user, userNotifs, { currentHHMM, force, now })) {
      continue;
    }

    const userDevices = devicesByUser.get(uId) || [];
    if (userDevices.length > 0) {
      await sendUserDigest({ user, userNotifs, userDevices, expoClient: options.expoClient });
      digestsSent += 1;
    }

    notificationsProcessed += userNotifs.length;
    notificationsToUpdate.push(...userNotifs.map((n) => n._id));
  }

  if (notificationsToUpdate.length > 0) {
    await Notification.updateMany(
      { _id: { $in: notificationsToUpdate } },
      { $set: { status: 'sent', sentAt: now } },
    );
  }

  return { digestsSent, notificationsProcessed };
}
