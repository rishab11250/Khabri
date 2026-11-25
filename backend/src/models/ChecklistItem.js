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

checklistItemSchema.index({ userId: 1, changeId: 1 });

export const ChecklistItem = mongoose.model('ChecklistItem', checklistItemSchema);
