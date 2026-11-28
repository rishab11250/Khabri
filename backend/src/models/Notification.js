/**
 * Mongoose model recording sent push notifications and queued digest notifications per user/change.
 * Deliberately persists `expoTicketId` so background receipt checks can prune dead device tokens.
 */
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Change', required: true },
  kind: { type: String, enum: ['push', 'digest'], required: true },
  status: { type: String, enum: ['queued', 'sent', 'failed', 'read'], default: 'queued' },
  sentAt: { type: Date },
  readAt: { type: Date },
  expoTicketId: { type: String }, // Receipt handle returned by Expo Push API for delayed error checks.
});

// Supports per-user notification history queries and burst-window recent push checks.
notificationSchema.index({ userId: 1, sentAt: -1 });
// Enforces idempotent deduplication before queueing digest or sending push per change.
notificationSchema.index({ userId: 1, changeId: 1, kind: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
