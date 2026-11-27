import { Router } from 'express';
import { postDevice, removeDevice } from '../controllers/devices.controller.js';
import { validate } from '../middleware/validate.js';
import { registerDeviceSchema } from '../validators/devices.validator.js';

export function createDevicesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.post('/', validate({ body: registerDeviceSchema }), postDevice);
  router.delete('/:token', removeDevice);

  return router;
}
