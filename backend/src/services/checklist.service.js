/**
 * Toggles completion status on a user's action checklist item attached to a change card.
 * Deliberately scopes updates to `{ _id, userId }` so users cannot mutate another user's checklist.
 */
import mongoose from 'mongoose';

import { AppError } from '../middleware/envelope.js';
import { ChecklistItem } from '../models/index.js';

/**
 * Sets `done` on an owned `ChecklistItem` document and returns the updated item view.
 *
 * @param {string|object} userId - Authenticated owner user ID.
 * @param {string} itemId - Target checklist item ObjectId string.
 * @param {boolean} done - Desired completion state.
 * @returns {Promise<{ id: string, changeId: string, text: string, done: boolean }>} Updated item.
 * @throws {AppError} When `itemId` is invalid (400) or not owned/found (404).
 */
export async function updateChecklistItem(userId, itemId, done) {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid checklist item id');
  }

  const updated = await ChecklistItem.findOneAndUpdate(
    { _id: itemId, userId },
    { $set: { done } },
    { returnDocument: 'after' },
  ).lean();

  if (!updated) {
    throw new AppError(404, 'CHECKLIST_NOT_FOUND', 'Checklist item not found');
  }

  return {
    id: String(updated._id),
    changeId: String(updated.changeId),
    text: updated.text,
    done: Boolean(updated.done),
  };
}
