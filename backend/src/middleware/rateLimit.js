/**
 * Configures IP-based Express rate limiters emitting standard `fail` envelopes on HTTP 429.
 * Deliberately uses in-memory stores suitable for single-instance Render deployments.
 */
import rateLimit from 'express-rate-limit';

import { fail } from './envelope.js';

/**
 * Creates a configurable rate-limiting middleware emitting HTTP 429 `RATE_LIMITED` envelopes.
 *
 * @param {object} params - Limiter configuration.
 * @param {number} params.windowMs - Sliding/fixed window duration in ms.
 * @param {number} params.limit - Maximum requests allowed per window.
 * @param {string} [params.code] - Error code emitted on limit exceeded.
 * @param {string} [params.message] - Client-facing retry message.
 * @returns {Function} Express rate-limit middleware.
 */
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
