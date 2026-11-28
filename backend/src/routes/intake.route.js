/**
 * Mounts rate-limited URL-probing and photo-upload intake endpoints.
 */
import { Router } from 'express';
import multer from 'multer';

import { createIntakeHandlers } from '../controllers/intake.controller.js';
import { AppError } from '../middleware/envelope.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { linkIntakeSchema } from '../validators/intake.validator.js';

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED_IMAGE_MIMES.has(file.mimetype)
      ? cb(null, true)
      : cb(new AppError(400, 'INVALID_IMAGE_TYPE', 'Only JPEG, PNG, or WebP images allowed')),
});
const intakeLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Too many intake requests, slow down',
});

/**
 * Builds the `/v1/intake` Express router.
 *
 * @param {Function} requireAuth - Bearer JWT authentication middleware.
 * @param {object} [options] - Optional fetch and AI router overrides.
 * @returns {Router} Configured Express router.
 */
export function createIntakeRouter(requireAuth, options = {}) {
  const router = Router();
  const { postLink, postPhoto } = createIntakeHandlers(options);
  router.use(requireAuth, intakeLimiter);
  // Probes and classifies an external notice URL (auth: bearer JWT; errors: 400 SSRF/ROBOTS_DISALLOWED/VALIDATION_ERROR, 422 FETCH_FAILED/UPSTREAM_ERROR, 429 RATE_LIMITED).
  router.post('/link', validate({ body: linkIntakeSchema }), postLink);
  // Extracts notice details via Vision and returns proposals (auth: bearer JWT; errors: 400 PHOTO_REQUIRED/INVALID_IMAGE_TYPE, 429 PHOTO_QUOTA_EXCEEDED/RATE_LIMITED, 502 VISION_FAILED).
  router.post('/photo', upload.single('photo'), postPhoto);
  return router;
}
