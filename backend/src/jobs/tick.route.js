import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { getEnv } from '../config/env.js';
import { runTick } from '../engine/scheduler.js';
import { AppError, ok } from '../middleware/envelope.js';

function secretsMatch(provided, expected) {
  if (typeof provided !== 'string' || !expected) {
    return false;
  }
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function createInternalRouter(options = {}) {
  const router = Router();
  const executeTick = options.runTick ?? runTick;

  router.post('/tick', async (req, res, next) => {
    const expectedSecret = options.tickSecret ?? getEnv().INTERNAL_TICK_SECRET;
    const provided = req.get('x-tick-secret');

    if (!secretsMatch(provided, expectedSecret)) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Invalid tick secret'));
    }

    const summary = await executeTick(options.tickOptions ?? {});
    return ok(res, {
      ...summary,
      ranAt: new Date().toISOString(),
    });
  });

  return router;
}
