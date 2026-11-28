/**
 * Mounts authenticated personalized feed pagination and single-change detail/translation routes.
 */
import { Router } from 'express';

import {
  createTranslateChangeHandler,
  getChange,
  getFeed,
} from '../controllers/feed.controller.js';
import { validate } from '../middleware/validate.js';
import { feedQuerySchema, translateBodySchema } from '../validators/feed.validator.js';

/**
 * Builds the `/v1/feed` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @returns {Router} Configured Express router.
 */
export function createFeedRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);
  // Lists cursor-paginated changes across watched sources (auth: bearer JWT; errors: 400 INVALID_CURSOR/VALIDATION_ERROR, 401 UNAUTHORIZED).
  router.get('/', validate({ query: feedQuerySchema }), getFeed);
  return router;
}

/**
 * Builds the `/v1/changes` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @param {object} [options] - Optional AI router injection.
 * @returns {Router} Configured Express router.
 */
export function createChangesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);
  // Fetches a single change card and user checklist items (auth: bearer JWT; errors: 400 INVALID_ID, 404 CHANGE_NOT_FOUND).
  router.get('/:id', getChange);
  // Translates explanation and checklist into `en`/`hi`/`gu` (auth: bearer JWT; errors: 400 INVALID_ID/VALIDATION_ERROR, 404 CHANGE_NOT_FOUND, 502 TRANSLATION_REJECTED/TRANSLATION_FAILED).
  router.post(
    '/:id/translate',
    validate({ body: translateBodySchema }),
    createTranslateChangeHandler(options),
  );
  return router;
}
