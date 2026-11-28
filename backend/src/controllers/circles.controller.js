/**
 * HTTP controller for Circle membership, invite codes, and shared watch operations.
 */
import { ok } from '../middleware/envelope.js';
import {
  addWatchToCircle,
  createCircle,
  getCircleDetail,
  joinCircle,
  listUserCircles,
  removeMemberFromCircle,
} from '../services/circles.service.js';

/**
 * Handles GET `/v1/circles` returning caller's joined circles.
 *
 * @param {object} req - Express request with `req.user`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing `circles`.
 */
export async function getCircles(req, res) {
  const circles = await listUserCircles(req.user._id);
  return ok(res, { circles });
}

/**
 * Handles POST `/v1/circles` creating a new owned circle.
 *
 * @param {object} req - Express request with `req.user` and `req.body.name`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} 201 JSON envelope containing created `circle`.
 */
export async function postCircle(req, res) {
  const circle = await createCircle(req.user._id, req.body.name);
  return ok(res, { circle }, 201);
}

/**
 * Handles POST `/v1/circles/join` using an invite code.
 *
 * @param {object} req - Express request with `req.user` and `req.body.inviteCode`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing joined `circle`.
 */
export async function postJoinCircle(req, res) {
  const circle = await joinCircle(req.user._id, req.body.inviteCode);
  return ok(res, { circle });
}

/**
 * Handles GET `/v1/circles/:id` returning members and shared watches.
 *
 * @param {object} req - Express request with `req.user` and `req.params.id`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing detailed `circle`.
 */
export async function getCircle(req, res) {
  const circle = await getCircleDetail(req.user._id, req.params.id);
  return ok(res, { circle });
}

/**
 * Handles POST `/v1/circles/:id/watches` sharing a source with all circle members.
 *
 * @param {object} req - Express request with `req.user`, `req.params.id`, `req.body.sourceId`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope with updated `circle` and subscription count.
 */
export async function postCircleWatch(req, res) {
  const data = await addWatchToCircle(req.user._id, req.params.id, req.body.sourceId);
  return ok(res, data);
}

/**
 * Handles DELETE `/v1/circles/:id/members/:userId` for owner-authorized member removal.
 *
 * @param {object} req - Express request with `req.user`, `req.params.id`, `req.params.userId`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope with updated member count.
 */
export async function deleteCircleMember(req, res) {
  const data = await removeMemberFromCircle(req.user._id, req.params.id, req.params.userId);
  return ok(res, data);
}
