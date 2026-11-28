/**
 * Mounts secret-protected internal scheduler tick and daily digest trigger routes.
 */
import { Router } from 'express';

import { createTickHandlers } from '../controllers/tick.controller.js';

/**
 * Builds the `/internal` Express router for scheduled background workers.
 *
 * @param {object} [options] - Optional tick secret and worker runner overrides.
 * @returns {Router} Configured Express router.
 */
export function createInternalRouter(options = {}) {
  const router = Router();
  const { postTick, postDigest } = createTickHandlers(options);

  // Runs a locked source-monitoring tick batch (auth: `X-Tick-Secret`; errors: 401 UNAUTHORIZED).
  router.post('/tick', postTick);
  // Dispatches queued digest notifications matching current IST window or `force=true` (auth: `X-Tick-Secret`; errors: 401 UNAUTHORIZED).
  router.post('/digest', postDigest);

  return router;
}
