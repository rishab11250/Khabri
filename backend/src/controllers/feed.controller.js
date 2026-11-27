import { ok } from '../middleware/envelope.js';
import { getChangeCard, getUserFeed, translateChangeCard } from '../services/feed.service.js';

export async function getFeed(req, res) {
  const data = await getUserFeed(req.user._id, req.query);
  return ok(res, data);
}

export async function getChange(req, res) {
  const card = await getChangeCard(req.user._id, req.params.id);
  return ok(res, { card });
}

export function createTranslateChangeHandler(options = {}) {
  return async function postTranslateChange(req, res) {
    const translation = await translateChangeCard(req.params.id, req.body.lang, options.aiRouter);
    return ok(res, translation);
  };
}
