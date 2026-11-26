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

export async function runDigest(options = {}) {
  const now = options.now ?? new Date();
  const currentHHMM = getIstHHMM(now);
  const force = Boolean(options.force);

  const pending = await Notification.find({
    kind: 'digest',
    status: 'queued',
  })
    .sort({ createdAt: 1 })
    .lean();

  if (pending.length === 0) {
    return { digestsSent: 0, notificationsProcessed: 0 };
  }

  const byUser = new Map();
  for (const n of pending) {
    const uId = String(n.userId);
    if (!byUser.has(uId)) byUser.set(uId, []);
    byUser.get(uId).push(n);
  }

  const userIds = Array.from(byUser.keys());
  const [users, devices] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    Device.find({ userId: { $in: userIds } }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const devicesByUser = new Map();
  for (const d of devices) {
    const uId = String(d.userId);
    if (!devicesByUser.has(uId)) devicesByUser.set(uId, []);
    devicesByUser.get(uId).push(d);
  }

  let digestsSent = 0;
  let notificationsProcessed = 0;
  const notificationsToUpdate = [];

  for (const [uId, userNotifs] of byUser.entries()) {
    const user = userMap.get(uId);
    if (!user) continue;

    if (!force && isInQuietHours(user.quietHours, now)) {
      continue;
    }

    if (!force && user.digestTime && user.digestTime !== currentHHMM) {
      const oldestAgeHours =
        (now.getTime() - new Date(userNotifs[0].createdAt || now).getTime()) / 3600000;
      if (oldestAgeHours < 24) {
        continue;
      }
    }

    const userDevices = devicesByUser.get(uId) || [];
    if (userDevices.length === 0) {
      notificationsToUpdate.push(...userNotifs.map((n) => n._id));
      notificationsProcessed += userNotifs.length;
      continue;
    }

    const changeIds = userNotifs.map((n) => n.changeId);
    const changes = await Change.find({ _id: { $in: changeIds } })
      .populate('sourceId', 'name')
      .lean();

    const count = changes.length;
    const sourceNames = Array.from(
      new Set(changes.map((c) => c.sourceId?.name).filter(Boolean)),
    ).slice(0, 3);
    const sourcesSummary =
      sourceNames.length > 0
        ? ` (${sourceNames.join(', ')}${sourceNames.length < count ? ' & more' : ''})`
        : '';

    const title =
      user.language === 'hi'
        ? `दैनिक अख़बार: ${count} नए अपडेट`
        : user.language === 'gu'
          ? `દૈનિક અખબાર: ${count} નવા અપડેટ`
          : `Daily Khabri Digest: ${count} updates`;

    const body =
      user.language === 'hi'
        ? `आपके ट्रैक किए गए पोर्टलों पर ${count} नए नोटिस आए हैं${sourcesSummary}।`
        : user.language === 'gu'
          ? `તમારા ટ્રેક કરેલા પોર્ટલ પર ${count} નવી નોટિસો આવી છે${sourcesSummary}.`
          : `${count} official notices updated on your watch list${sourcesSummary}.`;

    const pushes = userDevices.map((d) => ({
      to: d.expoPushToken,
      title,
      body,
      data: { url: 'khabri://today' },
      sound: 'default',
    }));

    await sendExpoPushes(pushes, options.expoClient);
    digestsSent += 1;
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
