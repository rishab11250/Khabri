import { z } from 'zod';
import { isValidExpoToken } from '../integrations/expoPush.js';

export const registerDeviceSchema = z.object({
  expoPushToken: z.string().trim().refine(isValidExpoToken, 'Invalid Expo push token format'),
  platform: z.enum(['android', 'ios']),
});
