/**
 * Mongoose model associating Expo push tokens with user accounts.
 * Deliberately enforces a unique index on `expoPushToken` so shared devices reassign cleanly.
 */
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expoPushToken: { type: String, required: true, unique: true },
    platform: { type: String, enum: ['android', 'ios'], required: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Fast lookup of all active push tokens per user during notification fan-out.
deviceSchema.index({ userId: 1 });

export const Device = mongoose.model('Device', deviceSchema);
