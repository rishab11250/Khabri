/**
 * HTTP controller for Expo push token registration and removal.
 */
import { ok } from '../middleware/envelope.js';
import { registerDevice, unregisterDevice } from '../services/devices.service.js';

/**
 * Handles POST `/v1/devices` registering a user's Expo push token.
 *
 * @param {object} req - Express request with `req.user` and validated body.
 * @param {object} res - Express response.
 * @returns {Promise<object>} 201 JSON envelope containing registered `device`.
 */
export async function postDevice(req, res) {
  const device = await registerDevice(req.user._id, req.body);
  return ok(res, { device }, 201);
}

/**
 * Handles DELETE `/v1/devices/:token` removing a push token (URL-decoded).
 *
 * @param {object} req - Express request with `req.user` and encoded `req.params.token`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} Deletion confirmation envelope.
 */
export async function removeDevice(req, res) {
  const result = await unregisterDevice(req.user._id, decodeURIComponent(req.params.token));
  return ok(res, result);
}
