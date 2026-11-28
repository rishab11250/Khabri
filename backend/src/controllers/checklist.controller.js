/**
 * HTTP controller for toggling change action checklist items.
 */
import { ok } from '../middleware/envelope.js';
import { updateChecklistItem } from '../services/checklist.service.js';

/**
 * Handles PATCH `/v1/checklist/:id` to update an item's completion flag.
 *
 * @param {object} req - Express request with authenticated `req.user`, `req.params.id`, `req.body.done`.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing updated `item`.
 */
export async function patchChecklistItem(req, res) {
  const item = await updateChecklistItem(req.user._id, req.params.id, req.body.done);
  return ok(res, { item });
}
