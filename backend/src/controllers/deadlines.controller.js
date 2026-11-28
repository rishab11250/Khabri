/**
 * HTTP controller for user deadline CRUD endpoints.
 */
import { ok } from '../middleware/envelope.js';
import {
  createDeadline,
  deleteDeadline,
  listDeadlines,
  updateDeadline,
} from '../services/deadlines.service.js';

/**
 * Handles GET `/v1/deadlines` with optional status filtering.
 *
 * @param {object} req - Express request with `req.user` and `req.query.status`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing `deadlines`.
 */
export async function getDeadlines(req, res) {
  const deadlines = await listDeadlines(req.user._id, req.query.status);
  return ok(res, { deadlines });
}

/**
 * Handles POST `/v1/deadlines` creating a user deadline.
 *
 * @param {object} req - Express request with `req.user` and validated body.
 * @param {object} res - Express response.
 * @returns {Promise<object>} 201 JSON envelope containing created `deadline`.
 */
export async function postDeadline(req, res) {
  const deadline = await createDeadline(req.user._id, req.body);
  return ok(res, { deadline }, 201);
}

/**
 * Handles PATCH `/v1/deadlines/:id` updating an owned deadline.
 *
 * @param {object} req - Express request with `req.user`, `req.params.id`, `req.body`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing updated `deadline`.
 */
export async function patchDeadline(req, res) {
  const deadline = await updateDeadline(req.user._id, req.params.id, req.body);
  return ok(res, { deadline });
}

/**
 * Handles DELETE `/v1/deadlines/:id` deleting an owned deadline.
 *
 * @param {object} req - Express request with `req.user` and `req.params.id`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} Deletion confirmation envelope.
 */
export async function removeDeadline(req, res) {
  const result = await deleteDeadline(req.user._id, req.params.id);
  return ok(res, result);
}
