import { timingSafeEqual } from 'node:crypto';
import { getEnv } from '../config/env.js';
import { runDigest } from '../engine/digest.js';
import { runTick } from '../engine/scheduler.js';
import { AppError } from '../middleware/envelope.js';

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

export function assertTickAuthorized(providedSecret, tickSecret) {
  const expectedSecret = tickSecret ?? getEnv().INTERNAL_TICK_SECRET;
  if (!secretsMatch(providedSecret, expectedSecret)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid tick secret');
  }
}

export async function triggerTick(runner = runTick, tickOptions = {}) {
  const summary = await runner(tickOptions);
  return {
    ...summary,
    ranAt: new Date().toISOString(),
  };
}

export async function triggerDigest(runner = runDigest, digestOptions = {}, force = false) {
  const summary = await runner({
    ...digestOptions,
    force,
  });
  return {
    ...summary,
    ranAt: new Date().toISOString(),
  };
}
