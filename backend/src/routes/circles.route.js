import { Router } from 'express';
import {
  deleteCircleMember,
  getCircle,
  getCircles,
  postCircle,
  postCircleWatch,
  postJoinCircle,
} from '../controllers/circles.controller.js';
import { validate } from '../middleware/validate.js';
import {
  addCircleWatchSchema,
  createCircleSchema,
  joinCircleSchema,
} from '../validators/circles.validator.js';

export function createCirclesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', getCircles);
  router.post('/', validate({ body: createCircleSchema }), postCircle);
  router.post('/join', validate({ body: joinCircleSchema }), postJoinCircle);
  router.get('/:id', getCircle);
  router.post('/:id/watches', validate({ body: addCircleWatchSchema }), postCircleWatch);
  router.delete('/:id/members/:userId', deleteCircleMember);

  return router;
}
