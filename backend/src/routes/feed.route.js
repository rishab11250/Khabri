import { Router } from 'express';
import {
  createTranslateChangeHandler,
  getChange,
  getFeed,
} from '../controllers/feed.controller.js';
import { validate } from '../middleware/validate.js';
import { feedQuerySchema, translateBodySchema } from '../validators/feed.validator.js';

export function createFeedRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);
  router.get('/', validate({ query: feedQuerySchema }), getFeed);
  return router;
}

export function createChangesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);
  router.get('/:id', getChange);
  router.post(
    '/:id/translate',
    validate({ body: translateBodySchema }),
    createTranslateChangeHandler(options),
  );
  return router;
}
