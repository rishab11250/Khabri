import mongoose from 'mongoose';
import { AppError } from '../middleware/envelope.js';
import { ChecklistItem } from '../models/index.js';

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
