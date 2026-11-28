/**
 * Authorizes internal scheduler requests and triggers feed ticks or digest dispatches.
 * Deliberately compares the shared cron secret via `timingSafeEqual` to prevent timing side-channels.
 */
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

/**
 * Verifies the `X-Tick-Secret` header against `INTERNAL_TICK_SECRET` in constant time.
 *
 * @param {string|undefined} providedSecret - Header value from the incoming request.
 * @param {string} [tickSecret] - Explicit secret override injected by tests or `createApp`.
 * @returns {void}
 * @throws {AppError} With 401 `UNAUTHORIZED` if the secret is missing or does not match.
 */
export function assertTickAuthorized(providedSecret, tickSecret) {
  const expectedSecret = tickSecret ?? getEnv().INTERNAL_TICK_SECRET;
  if (!secretsMatch(providedSecret, expectedSecret)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid tick secret');
  }
}

/**
 * Executes a scheduler tick and stamps `ranAt` on the result payload.
 *
 * @param {Function} [runner] - Tick execution function (`runTick` by default).
 * @param {object} [tickOptions] - Options forwarded to `runner`.
 * @returns {Promise<object>} Tick summary with ISO `ranAt`.
 */
export async function triggerTick(runner = runTick, tickOptions = {}) {
  const summary = await runner(tickOptions);
  return {
    ...summary,
    ranAt: new Date().toISOString(),
  };
}

/**
 * Executes a digest dispatch pass and stamps `ranAt` on the result payload.
 *
 * @param {Function} [runner] - Digest execution function (`runDigest` by default).
 * @param {object} [digestOptions] - Options forwarded to `runner`.
 * @param {boolean} [force] - Bypass quiet-hour and digest-time window checks when true.
 * @returns {Promise<object>} Digest dispatch summary with ISO `ranAt`.
 */
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
