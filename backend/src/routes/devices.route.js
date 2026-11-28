/**
 * Mounts Expo push notification device registration and removal routes.
 */
import { Router } from 'express';

import { postDevice, removeDevice } from '../controllers/devices.controller.js';
import { validate } from '../middleware/validate.js';
import { registerDeviceSchema } from '../validators/devices.validator.js';

/**
 * Builds the `/v1/devices` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @returns {Router} Configured Express router.
 */
export function createDevicesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  // Registers or reassigns an Expo push token to the caller (auth: bearer JWT; errors: 400 VALIDATION_ERROR, 401 UNAUTHORIZED).
  router.post('/', validate({ body: registerDeviceSchema }), postDevice);
  // Unregisters an Expo push token for the caller (auth: bearer JWT; errors: 401 UNAUTHORIZED).
  router.delete('/:token', removeDevice);

  return router;
}
