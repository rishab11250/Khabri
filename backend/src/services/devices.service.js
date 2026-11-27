import { Device } from '../models/index.js';

export async function registerDevice(userId, { expoPushToken, platform }) {
  const device = await Device.findOneAndUpdate(
    { expoPushToken },
    {
      $set: {
        userId,
        platform,
        lastSeenAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return {
    id: String(device._id),
    expoPushToken: device.expoPushToken,
    platform: device.platform,
  };
}

export async function unregisterDevice(userId, expoPushToken) {
  await Device.deleteOne({ userId, expoPushToken });
  return { deleted: true };
}
