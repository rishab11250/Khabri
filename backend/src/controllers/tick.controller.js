/**
 * HTTP controller for secret-authenticated internal tick and digest job triggers.
 */
import { ok } from '../middleware/envelope.js';
import { assertTickAuthorized, triggerDigest, triggerTick } from '../services/tick.service.js';

/**
 * Builds `/internal/tick` and `/internal/digest` handlers with optional runner/secret overrides.
 *
 * @param {object} [options] - Optional secret and scheduler/digest runner injections.
 * @returns {{ postTick: Function, postDigest: Function }} Express handlers.
 */
export function createTickHandlers(options = {}) {
  return {
    postTick: async (req, res) => {
      assertTickAuthorized(req.get('x-tick-secret'), options.tickSecret);
      const summary = await triggerTick(options.runTick, options.tickOptions);
      return ok(res, summary);
    },
    postDigest: async (req, res) => {
      assertTickAuthorized(req.get('x-tick-secret'), options.tickSecret);
      const force = req.body?.force === true || req.body?.force === 'true';
      const summary = await triggerDigest(options.runDigest, options.digestOptions, force);
      return ok(res, summary);
    },
  };
}
