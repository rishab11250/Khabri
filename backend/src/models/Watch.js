/**
 * Mongoose model linking users to monitored `Source` records with alert priority and mute flags.
 * Deliberately enforces unique `(userId, sourceId)` pairs to keep per-user 15-watch caps exact.
 */
import mongoose from 'mongoose';

const watchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source', required: true },
    title: { type: String, required: true, trim: true },
    priority: { type: String, enum: ['normal', 'instant'], default: 'normal' }, // `instant` promotes MEDIUM changes to push alerts.
    muted: { type: Boolean, default: false },
    createdVia: {
      type: String,
      enum: ['catalog', 'link', 'photo', 'trending', 'circle', 'search'], // Tracks intake attribution.
      required: true,
    },
    circleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Circle' }, // Set when auto-subscribed via a Circle.
    focusTerms: { type: [String], default: [] },
  },
  { timestamps: true },
);

// Serves user watch-list queries and Watch cap counting.
watchSchema.index({ userId: 1 });
// Powers notification and deadline fan-out lookups per updated source.
watchSchema.index({ sourceId: 1 });
// Prevents duplicate subscriptions to the same source per user.
watchSchema.index({ userId: 1, sourceId: 1 }, { unique: true });

export const Watch = mongoose.model('Watch', watchSchema);
