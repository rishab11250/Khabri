import { Router } from 'express';
import { createDeleteMe, getMe, patchMe } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/users.validator.js';

export function createUsersRouter(requireAuth, options = {}) {
  const router = Router();

  router.use(requireAuth);
  router.get('/', getMe);
  router.patch('/', validate({ body: updateMeSchema }), patchMe);
  router.delete('/', createDeleteMe(options.deleteAuthUser));

  return router;
}
