/**
 * Validates device push-token registration requests against Expo token format and supported OS platforms.
 */
import { z } from 'zod';

import { isValidExpoToken } from '../integrations/expoPush.js';

// Body schema for POST and DELETE /v1/devices.
export const registerDeviceSchema = z.object({
  expoPushToken: z.string().trim().refine(isValidExpoToken, 'Invalid Expo push token format'),
  platform: z.enum(['android', 'ios']),
});
