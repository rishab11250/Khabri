import { ok } from '../middleware/envelope.js';
import { answerUserQuestion } from '../services/ask.service.js';

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
