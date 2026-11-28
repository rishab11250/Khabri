/**
 * HTTP controller handling grounded Ask Khabri Q&A requests.
 * Deliberately keeps quota/AI logic inside `ask.service`.
 */
import { ok } from '../middleware/envelope.js';
import { answerUserQuestion } from '../services/ask.service.js';

/**
 * Creates the POST `/v1/ask` controller handler with optional injected dependencies.
 *
 * @param {object} [options] - Optional AI router override.
 * @returns {Function} Express request handler.
 */
export function createAskHandler(options = {}) {
  return async function postAsk(req, res) {
    const result = await answerUserQuestion({
      userId: req.user._id,
      scope: req.body.scope,
      question: req.body.question,
      aiRouter: options.aiRouter,
    });
    return ok(res, result);
  };
}
