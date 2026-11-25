import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createDeleteMe, getMe, patchMe, updateMeSchema } from './users.controller.js';

export function createUsersRouter(requireAuth, options = {}) {
  const router = Router();

  router.use(requireAuth);
  router.get('/', getMe);
  router.patch('/', validate({ body: updateMeSchema }), patchMe);
  router.delete('/', createDeleteMe(options.deleteAuthUser));

  return router;
}
