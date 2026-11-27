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

export function createWatchesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', getWatches);
  router.post('/', validate({ body: createWatchSchema }), postWatch);
  router.patch('/:id', validate({ body: patchWatchSchema }), patchWatch);
  router.delete('/:id', removeWatch);
  router.post('/:id/refresh', createRefreshWatchHandler(options));

  return router;
}
