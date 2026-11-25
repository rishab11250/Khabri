import rateLimit from 'express-rate-limit';
import { fail } from './envelope.js';

export function createRateLimiter({ windowMs, limit, code = 'RATE_LIMITED', message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      return fail(res, 429, code, message ?? 'Too many requests, please try again later');
    },
  });
}

export const globalRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 120,
  message: 'Too many requests from this IP, please slow down',
});
