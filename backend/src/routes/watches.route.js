/**
 * Mounts authenticated user watch subscription CRUD and manual refresh routes.
 */
import { Router } from 'express';

import {
  createRefreshWatchHandler,
  getWatches,
  patchWatch,
  postWatch,
  removeWatch,
} from '../controllers/watches.controller.js';
import { validate } from '../middleware/validate.js';
import { createWatchSchema, patchWatchSchema } from '../validators/watches.validator.js';

/**
 * Builds the `/v1/watches` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @param {object} [options] - Optional tick options forwarded to manual refresh.
 * @returns {Router} Configured Express router.
 */
export function createWatchesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);

  // Lists watches owned by caller with source health (auth: bearer JWT; errors: 401 UNAUTHORIZED).
  router.get('/', getWatches);
  // Subscribes caller to a catalog source or search query (auth: bearer JWT; errors: 400 WATCH_LIMIT_REACHED/SEARCH_WATCH_LIMIT_REACHED/VALIDATION_ERROR, 404 SOURCE_NOT_FOUND, 409 WATCH_EXISTS).
  router.post('/', validate({ body: createWatchSchema }), postWatch);
  // Updates watch title, mute state, priority, or focusTerms (auth: bearer JWT; errors: 400 INVALID_ID/VALIDATION_ERROR, 404 WATCH_NOT_FOUND).
  router.patch('/:id', validate({ body: patchWatchSchema }), patchWatch);
  // Deletes an owned watch and decrements followerCount (auth: bearer JWT; errors: 400 INVALID_ID, 404 WATCH_NOT_FOUND).
  router.delete('/:id', removeWatch);
  // Runs an immediate fetch/diff for a direct watch subject to 1h cooldown (auth: bearer JWT; errors: 400 INVALID_ID/SEARCH_REFRESH_BLOCKED, 404 WATCH_NOT_FOUND/SOURCE_NOT_FOUND, 429 REFRESH_COOLDOWN).
  router.post('/:id/refresh', createRefreshWatchHandler(options));

  return router;
}
