import { Router } from 'express';
import { patchChecklistItem } from '../controllers/checklist.controller.js';
import { validate } from '../middleware/validate.js';
import { patchChecklistSchema } from '../validators/checklist.validator.js';

export function createChecklistRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.patch('/:id', validate({ body: patchChecklistSchema }), patchChecklistItem);

  return router;
}
