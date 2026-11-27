import { Router } from 'express';
import { createDemoHandlers } from '../controllers/demo.controller.js';
import { validate } from '../middleware/validate.js';
import { demoMutationSchema } from '../validators/demo.validator.js';

export function createDemoRouter(options = {}) {
  const router = Router();
  const { getBoard, postBoard } = createDemoHandlers(options);

  router.get('/board', getBoard);
  router.post('/board', validate({ body: demoMutationSchema }), postBoard);

  return router;
}
