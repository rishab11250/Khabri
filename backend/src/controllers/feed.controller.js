/**
 * HTTP controller for user change feeds, card details, and native-language translation.
 */
import { ok } from '../middleware/envelope.js';
import { getChangeCard, getUserFeed, translateChangeCard } from '../services/feed.service.js';

/**
 * Handles GET `/v1/feed` returning cursor-paginated change cards.
 *
 * @param {object} req - Express request with `req.user` and validated `req.query`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope with `items` and `nextCursor`.
 */
export async function getFeed(req, res) {
  const data = await getUserFeed(req.user._id, req.query);
  return ok(res, data);
}

/**
 * Handles GET `/v1/changes/:id` returning a single change card with user checklist state.
 *
 * @param {object} req - Express request with `req.user` and `req.params.id`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing `card`.
 */
export async function getChange(req, res) {
  const card = await getChangeCard(req.user._id, req.params.id);
  return ok(res, { card });
}

/**
 * Builds the POST `/v1/changes/:id/translate` handler with optional AI router override.
 *
 * @param {object} [options] - Optional `{ aiRouter }` test injection.
 * @returns {Function} Express request handler.
 */
export function createTranslateChangeHandler(options = {}) {
  return async function postTranslateChange(req, res) {
    const translation = await translateChangeCard(req.params.id, req.body.lang, options.aiRouter);
    return ok(res, translation);
  };
}
