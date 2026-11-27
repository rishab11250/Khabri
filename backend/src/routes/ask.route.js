import { Router } from 'express';
import { createAskHandler } from '../controllers/ask.controller.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { askBodySchema } from '../validators/ask.validator.js';

const askLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Too many Ask Khabri requests, please wait',
});

export function createAskRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth, askLimiter);

  router.post('/', validate({ body: askBodySchema }), createAskHandler(options));

  return router;
}
