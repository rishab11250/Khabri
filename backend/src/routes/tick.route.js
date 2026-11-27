import { Router } from 'express';
import { createTickHandlers } from '../controllers/tick.controller.js';

export function createInternalRouter(options = {}) {
  const router = Router();
  const { postTick, postDigest } = createTickHandlers(options);

  router.post('/tick', postTick);
  router.post('/digest', postDigest);

  return router;
}
