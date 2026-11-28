/**
 * Mounts rate-limited Ask Khabri Q&A endpoints over authenticated users' monitored notices.
 */
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

/**
 * Builds the `/v1/ask` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @param {object} [options] - Optional AI router injection.
 * @returns {Router} Configured Express router.
 */
export function createAskRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth, askLimiter);

  // Answers grounded user questions (auth: bearer JWT; errors: 400 VALIDATION_ERROR, 429 RATE_LIMITED/ASK_QUOTA_EXCEEDED, 502 ASK_REJECTED/ASK_FAILED).
  router.post('/', validate({ body: askBodySchema }), createAskHandler(options));

  return router;
}
