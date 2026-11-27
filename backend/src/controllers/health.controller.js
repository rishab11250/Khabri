import { ok } from '../middleware/envelope.js';
import { getHealthStatus } from '../services/health.service.js';

export function getHealth(_req, res) {
  return ok(res, getHealthStatus());
}
