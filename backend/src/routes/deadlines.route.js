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

export function createDeadlinesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', validate({ query: listDeadlinesQuerySchema }), getDeadlines);
  router.post('/', validate({ body: createDeadlineSchema }), postDeadline);
  router.patch('/:id', validate({ body: patchDeadlineSchema }), patchDeadline);
  router.delete('/:id', removeDeadline);

  return router;
}
