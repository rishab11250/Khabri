/**
 * Converts unknown route hits, validation/database failures, and unexpected exceptions into API envelopes.
 * Deliberately omits stack traces and internal Mongoose error text from HTTP 500 responses.
 */
import { ZodError } from 'zod';

import { logger } from '../config/logger.js';
import { AppError, fail } from './envelope.js';

/**
 * Terminal middleware for unmatched API routes.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {object} 404 JSON error response.
 */
export function notFoundHandler(req, res) {
  return fail(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Global Express error-handling middleware normalizing operational, Zod, and Mongoose errors.
 *
 * @param {Error} err - Thrown or forwarded error instance.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} _next - Unused Express next callback (required 4-arg arity).
 * @returns {object} JSON error envelope.
 */
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return fail(res, err.status, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return fail(
      res,
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    );
  }

  if (err?.name === 'ValidationError') {
    return fail(res, 400, 'VALIDATION_ERROR', 'Database validation failed');
  }

  if (err?.name === 'CastError') {
    return fail(res, 400, 'INVALID_ID', 'Invalid identifier format');
  }

  if (err?.code === 11000) {
    return fail(res, 409, 'CONFLICT', 'Resource already exists');
  }

  if (err?.type === 'entity.parse.failed') {
    return fail(res, 400, 'INVALID_JSON', 'Malformed JSON body');
  }

  logger.error({ err, path: req.originalUrl, method: req.method }, 'Unhandled error');
  return fail(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
