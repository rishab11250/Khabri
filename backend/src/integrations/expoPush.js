/**
 * Wraps the `expo-server-sdk` client for token format checks, chunked push sends, and receipt polling.
 * Deliberately extracts `DeviceNotRegistered` tokens/receipts so stale devices get pruned cleanly.
 */
import { Expo } from 'expo-server-sdk';

let defaultClient = null;

/**
 * Returns the lazily initialized singleton `Expo` SDK client configured with `EXPO_ACCESS_TOKEN`.
 *
 * @returns {Expo} Shared Expo push client.
 */
function getExpoClient() {
  if (!defaultClient) {
    defaultClient = new Expo(
      process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : {},
    );
  }
  return defaultClient;
}

/**
 * Validates whether a token string matches Expo's `ExponentPushToken[...]` or `ExpoPushToken[...]` format.
 *
 * @param {string} token - Candidate push token string.
 * @returns {boolean} True when syntactically valid for Expo Push API.
 */
export function isValidExpoToken(token) {
  return typeof token === 'string' && Expo.isExpoPushToken(token);
}

/**
 * Sends batched push notifications via Expo Push API and collects unregistered device tokens.
 *
 * @param {Array<object>} messages - Expo push message objects (`to`, `title`, `body`, `data`).
 * @param {object} [client] - Optional Expo client override for testing.
 * @returns {Promise<{ tickets: Array<object>, deadTokens: string[] }>} Tickets paired with dead tokens.
 */
export async function sendExpoPushes(messages, client = getExpoClient()) {
  if (!messages.length) return { tickets: [], deadTokens: [] };

  const chunks = client.chunkPushNotifications(messages);
  const tickets = [];
  const deadTokens = [];

  for (const chunk of chunks) {
    const ticketChunk = await client.sendPushNotificationsAsync(chunk);
    ticketChunk.forEach((ticket, idx) => {
      const token = chunk[idx]?.to;
      tickets.push({ token, ticket });
      if (ticket?.status === 'error' && ticket?.details?.error === 'DeviceNotRegistered' && token) {
        deadTokens.push(token);
      }
    });
  }

  return { tickets, deadTokens };
}

/**
 * Polls delayed Expo push receipts and collects ticket IDs reporting `DeviceNotRegistered`.
 *
 * @param {string[]} ticketIds - Previously persisted `expoTicketId` strings.
 * @param {object} [client] - Optional Expo client override for testing.
 * @returns {Promise<{ receipts: object, failedIds: string[] }>} Receipt map and failed ticket IDs.
 */
export async function checkExpoReceipts(ticketIds, client = getExpoClient()) {
  if (!ticketIds.length) return { receipts: {}, failedIds: [] };

  const chunks = client.chunkPushNotificationReceiptIds(ticketIds);
  const receipts = {};
  const failedIds = [];

  for (const chunk of chunks) {
    const res = await client.getPushNotificationReceiptsAsync(chunk);
    for (const [id, receipt] of Object.entries(res || {})) {
      receipts[id] = receipt;
      if (receipt?.status === 'error' && receipt?.details?.error === 'DeviceNotRegistered') {
        failedIds.push(id);
      }
    }
  }

  return { receipts, failedIds };
}
