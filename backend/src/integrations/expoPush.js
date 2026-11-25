import { Expo } from 'expo-server-sdk';

let defaultClient = null;

export function getExpoClient() {
  if (!defaultClient) {
    defaultClient = new Expo(
      process.env.EXPO_ACCESS_TOKEN ? { accessToken: process.env.EXPO_ACCESS_TOKEN } : {},
    );
  }
  return defaultClient;
}

export function isValidExpoToken(token) {
  return typeof token === 'string' && Expo.isExpoPushToken(token);
}

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
