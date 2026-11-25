import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { AppError, fail } from './envelope.js';

export function notFoundHandler(req, res) {
  return fail(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`);
}

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
