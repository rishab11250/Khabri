/**
 * HTTP controller serving service and database health status.
 */
import { ok } from '../middleware/envelope.js';
import { getHealthStatus } from '../services/health.service.js';

/**
 * Handles GET `/health` returning API status, DB connection state, and uptime.
 *
 * @param {object} _req - Unused Express request.
 * @param {object} res - Express response.
 * @returns {object} JSON envelope containing health metrics.
 */
export function getHealth(_req, res) {
  return ok(res, getHealthStatus());
}
