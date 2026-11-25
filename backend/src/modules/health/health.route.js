import { Router } from 'express';
import { getDbState } from '../../config/db.js';
import { ok } from '../../middleware/envelope.js';

export function createHealthRouter() {
  const router = Router();

  router.get('/', (_req, res) => {
    return ok(res, {
      status: 'ok',
      service: 'khabri-api',
      db: getDbState(),
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
