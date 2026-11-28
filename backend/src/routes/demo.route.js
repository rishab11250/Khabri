/**
 * Mounts the built-in Demo Notice Board HTML/JSON and mutation endpoints for safe E2E demos.
 */
import { Router } from 'express';

import { createDemoHandlers } from '../controllers/demo.controller.js';
import { validate } from '../middleware/validate.js';
import { demoMutationSchema } from '../validators/demo.validator.js';

/**
 * Builds the `/demo` Express router.
 *
 * @param {object} [options] - Optional `demoMode` boolean override.
 * @returns {Router} Configured Express router.
 */
export function createDemoRouter(options = {}) {
  const router = Router();
  const { getBoard, postBoard } = createDemoHandlers(options);

  // Serves demo notice board as HTML (`text/html`) or JSON (`?format=json`) (auth: public; errors: 500 INTERNAL_ERROR).
  router.get('/board', getBoard);
  // Mutates demo notices when `DEMO_MODE=true` (auth: feature flag; errors: 400 VALIDATION_ERROR, 403 DEMO_DISABLED, 404 NOTICE_NOT_FOUND).
  router.post('/board', validate({ body: demoMutationSchema }), postBoard);

  return router;
}
