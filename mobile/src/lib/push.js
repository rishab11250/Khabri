/**
 * Configures foreground notification behavior, requests OS push permissions, registers Expo push
 * tokens with the API, and parses deep-link change IDs from tapped notification payloads.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from './api';
import { isApiConfigured } from './env';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
});

async function ensurePushPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('khabri-alerts', {
      name: 'Khabri Alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') {
    return true;
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function resolveEasProjectId() {
  return Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
}

/**
 * Ensures notification permissions, obtains the Expo push token, and registers the device with the backend.
 *
 * @returns {Promise<string|null>} Registered Expo push token or `null` if unavailable/denied.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web' || !isApiConfigured) {
    return null;
  }

  try {
    if (!(await ensurePushPermission())) {
      return null;
    }

    const projectId = resolveEasProjectId();
    const tokenRes = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const expoPushToken = tokenRes?.data;
    if (!expoPushToken) return null;

    await api.registerDevice({
      expoPushToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    return expoPushToken;
  } catch {
    return null;
  }
}

/**
 * Extracts a target `changeId` from an Expo notification response's `data` or deep-link URL.
 *
 * @param {object|null} response - Notification interaction response object.
 * @returns {string|null} Change ID string when present, otherwise `null`.
 */
export function extractChangeIdFromResponse(response) {
  const data = response?.notification?.request?.content?.data;
  if (data?.changeId) return String(data.changeId);
  if (typeof data?.url === 'string') {
    const match = data.url.match(/change\/([^/?#]+)/);
    if (match) return match[1];
  }
  return null;
}
