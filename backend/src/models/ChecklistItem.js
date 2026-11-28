/**
 * Mongoose model persisting per-user completion state on change-card action checklist items.
 * Deliberately stores one document per `(userId, changeId, item)` instead of embedding on `Change`.
 */
import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Change', required: true },
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Speeds up loading a user's checklist state alongside feed cards and detail views.
checklistItemSchema.index({ userId: 1, changeId: 1 });

export const ChecklistItem = mongoose.model('ChecklistItem', checklistItemSchema);
