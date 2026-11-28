/**
 * Mounts family/study Circle routes for creating circles, joining via code, sharing watches, and membership removal.
 */
import { Router } from 'express';

import {
  deleteCircleMember,
  getCircle,
  getCircles,
  postCircle,
  postCircleWatch,
  postJoinCircle,
} from '../controllers/circles.controller.js';
import { validate } from '../middleware/validate.js';
import {
  addCircleWatchSchema,
  createCircleSchema,
  joinCircleSchema,
} from '../validators/circles.validator.js';

/**
 * Builds the `/v1/circles` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @returns {Router} Configured Express router.
 */
export function createCirclesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  // Lists circles the user belongs to (auth: bearer JWT; errors: 401 UNAUTHORIZED).
  router.get('/', getCircles);
  // Creates a new circle with a unique 6-char invite code (auth: bearer JWT; errors: 400 VALIDATION_ERROR).
  router.post('/', validate({ body: createCircleSchema }), postCircle);
  // Joins an existing circle via invite code and syncs shared watches (auth: bearer JWT; errors: 400 CIRCLE_FULL/VALIDATION_ERROR, 404 CIRCLE_NOT_FOUND).
  router.post('/join', validate({ body: joinCircleSchema }), postJoinCircle);
  // Returns circle details, members, and shared watches (auth: bearer JWT; errors: 400 INVALID_ID, 404 CIRCLE_NOT_FOUND).
  router.get('/:id', getCircle);
  // Shares a source onto a circle and subscribes members within cap (auth: bearer JWT; errors: 400 INVALID_ID/VALIDATION_ERROR, 404 CIRCLE_NOT_FOUND/SOURCE_NOT_FOUND).
  router.post('/:id/watches', validate({ body: addCircleWatchSchema }), postCircleWatch);
  // Removes a member as circle owner (auth: bearer JWT owner; errors: 400 INVALID_ID/CANNOT_REMOVE_OWNER, 403 FORBIDDEN, 404 CIRCLE_NOT_FOUND/MEMBER_NOT_FOUND).
  router.delete('/:id/members/:userId', deleteCircleMember);

  return router;
}
