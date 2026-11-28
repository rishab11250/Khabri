/**
 * HTTP controller for watch subscription CRUD and manual single-source refresh triggers.
 */
import { ok } from '../middleware/envelope.js';
import {
  createWatch,
  deleteWatch,
  listWatches,
  refreshWatch,
  updateWatch,
} from '../services/watches.service.js';

/**
 * Handles GET `/v1/watches` returning all caller watches.
 *
 * @param {object} req - Express request with `req.user`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing `watches`.
 */
export async function getWatches(req, res) {
  const watches = await listWatches(req.user._id);
  return ok(res, { watches });
}

/**
 * Handles POST `/v1/watches` subscribing caller to a source or search query.
 *
 * @param {object} req - Express request with `req.user` and validated `req.body`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} 201 JSON envelope containing created `watch`.
 */
export async function postWatch(req, res) {
  const watch = await createWatch(req.user._id, req.body);
  return ok(res, { watch }, 201);
}

/**
 * Handles PATCH `/v1/watches/:id` updating an owned watch.
 *
 * @param {object} req - Express request with `req.user`, `req.params.id`, `req.body`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing updated `watch`.
 */
export async function patchWatch(req, res) {
  const watch = await updateWatch(req.user._id, req.params.id, req.body);
  return ok(res, { watch });
}

/**
 * Handles DELETE `/v1/watches/:id` removing an owned watch.
 *
 * @param {object} req - Express request with `req.user` and `req.params.id`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} Deletion confirmation envelope.
 */
export async function removeWatch(req, res) {
  const result = await deleteWatch(req.user._id, req.params.id);
  return ok(res, result);
}

/**
 * Builds the POST `/v1/watches/:id/refresh` handler forwarding optional `tickOptions`.
 *
 * @param {object} [options] - Optional `{ tickOptions }` forwarded to `refreshWatch`.
 * @returns {Function} Express request handler.
 */
export function createRefreshWatchHandler(options = {}) {
  return async function postRefreshWatch(req, res) {
    const result = await refreshWatch(req.user._id, req.params.id, options.tickOptions || {});
    return ok(res, { result });
  };
}
