/**
 * Registers and unregisters Expo push notification tokens per authenticated user.
 * Deliberately upserts by `expoPushToken` so re-logging on another account transfers device ownership.
 */
import { Device } from '../models/index.js';

/**
 * Registers or transfers ownership of an Expo push token for `userId`.
 *
 * @param {string|object} userId - Authenticated user ID.
 * @param {object} params - Device registration fields.
 * @param {string} params.expoPushToken - Valid `ExponentPushToken[...]` token.
 * @param {'android'|'ios'|'web'} params.platform - Client OS platform.
 * @returns {Promise<{ id: string, expoPushToken: string, platform: string }>} Registered device summary.
 */
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

/**
 * Removes an Expo push token belonging to `userId` (typically on sign-out).
 *
 * @param {string|object} userId - Authenticated user ID.
 * @param {string} expoPushToken - Expo push token to unregister.
 * @returns {Promise<{ deleted: true }>} Removal confirmation.
 */
export async function unregisterDevice(userId, expoPushToken) {
  await Device.deleteOne({ userId, expoPushToken });
  return { deleted: true };
}
