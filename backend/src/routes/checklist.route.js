/**
 * Mounts authenticated checklist completion update endpoints.
 */
import { Router } from 'express';

import { patchChecklistItem } from '../controllers/checklist.controller.js';
import { validate } from '../middleware/validate.js';
import { patchChecklistSchema } from '../validators/checklist.validator.js';

/**
 * Builds the `/v1/checklist` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @returns {Router} Configured Express router.
 */
export function createChecklistRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  // Toggles an owned checklist item's `done` flag (auth: bearer JWT; errors: 400 INVALID_ID/VALIDATION_ERROR, 404 CHECKLIST_NOT_FOUND).
  router.patch('/:id', validate({ body: patchChecklistSchema }), patchChecklistItem);

  return router;
}
