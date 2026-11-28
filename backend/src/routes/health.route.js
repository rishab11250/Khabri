/**
 * Mounts public liveness and database health check route (`/health`).
 */
import { Router } from 'express';

import { getHealth } from '../controllers/health.controller.js';

/**
 * Builds the `/health` Express router.
 *
 * @returns {Router} Configured Express router.
 */
export function createHealthRouter() {
  const router = Router();
  // Returns service, DB state, and uptime (auth: public; errors: 500 INTERNAL_ERROR).
  router.get('/', getHealth);
  return router;
}
