import { ok } from '../middleware/envelope.js';
import { registerDevice, unregisterDevice } from '../services/devices.service.js';

export async function postDevice(req, res) {
  const device = await registerDevice(req.user._id, req.body);
  return ok(res, { device }, 201);
}

export async function removeDevice(req, res) {
  const result = await unregisterDevice(req.user._id, decodeURIComponent(req.params.token));
  return ok(res, result);
}
