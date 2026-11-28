/**
 * Mounts authenticated deadline tracking and calendar-sync metadata endpoints.
 */
import { Router } from 'express';

import {
  getDeadlines,
  patchDeadline,
  postDeadline,
  removeDeadline,
} from '../controllers/deadlines.controller.js';
import { validate } from '../middleware/validate.js';
import {
  createDeadlineSchema,
  listDeadlinesQuerySchema,
  patchDeadlineSchema,
} from '../validators/deadlines.validator.js';

/**
 * Builds the `/v1/deadlines` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @returns {Router} Configured Express router.
 */
export function createDeadlinesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  // Lists user deadlines sorted by dueAt (auth: bearer JWT; errors: 400 VALIDATION_ERROR).
  router.get('/', validate({ query: listDeadlinesQuerySchema }), getDeadlines);
  // Creates a manual user deadline (auth: bearer JWT; errors: 400 VALIDATION_ERROR).
  router.post('/', validate({ body: createDeadlineSchema }), postDeadline);
  // Updates deadline status, date, or calendarEventId (auth: bearer JWT; errors: 400 INVALID_ID/VALIDATION_ERROR, 404 DEADLINE_NOT_FOUND).
  router.patch('/:id', validate({ body: patchDeadlineSchema }), patchDeadline);
  // Deletes an owned deadline (auth: bearer JWT; errors: 400 INVALID_ID, 404 DEADLINE_NOT_FOUND).
  router.delete('/:id', removeDeadline);

  return router;
}
