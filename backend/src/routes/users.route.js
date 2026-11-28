/**
 * Mounts authenticated `/v1/me` profile retrieval, update, and account-deletion routes.
 */
import { Router } from 'express';

import { createDeleteMe, getMe, patchMe } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/users.validator.js';

/**
 * Builds the `/v1/me` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @param {object} [options] - Optional Supabase admin delete hook.
 * @returns {Router} Configured Express router.
 */
export function createUsersRouter(requireAuth, options = {}) {
  const router = Router();

  router.use(requireAuth);
  // Returns the caller's formatted profile (auth: bearer JWT; errors: 401 UNAUTHORIZED).
  router.get('/', getMe);
  // Updates profile fields, language, digestTime, and quietHours (auth: bearer JWT; errors: 400 VALIDATION_ERROR, 401 UNAUTHORIZED).
  router.patch('/', validate({ body: updateMeSchema }), patchMe);
  // Deletes all Mongo user data and removes Supabase Auth user (auth: bearer JWT; errors: 401 UNAUTHORIZED).
  router.delete('/', createDeleteMe(options.deleteAuthUser));

  return router;
}
