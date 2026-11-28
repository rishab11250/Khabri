/**
 * Mongoose model for user exam/application deadlines synced from official changes or added manually.
 * Deliberately retains `previousDueAt` and `movedAt` to highlight rescheduled dates on mobile.
 */
import mongoose from 'mongoose';

const deadlineSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Change' },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
    label: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true },
    previousDueAt: { type: Date }, // Populated when a notice shifts an active deadline's date.
    movedAt: { type: Date },
    status: { type: String, enum: ['active', 'done', 'expired'], default: 'active' },
    calendarEventId: { type: String }, // Native device calendar ID cached after "Add to Calendar".
  },
  { timestamps: true },
);

// Serves user deadline lists sorted ascending by upcoming dueAt.
deadlineSchema.index({ userId: 1, dueAt: 1 });

export const Deadline = mongoose.model('Deadline', deadlineSchema);
