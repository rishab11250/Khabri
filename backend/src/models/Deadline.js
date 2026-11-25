import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Change' },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
    label: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ['active', 'done', 'expired'], default: 'active' },
    calendarEventId: { type: String },
  },
  { timestamps: true },
);

deadlineSchema.index({ userId: 1, dueAt: 1 });

export const Deadline = mongoose.model('Deadline', deadlineSchema);
