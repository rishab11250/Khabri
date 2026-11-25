import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Change', required: true },
  kind: { type: String, enum: ['push', 'digest'], required: true },
  status: { type: String, enum: ['queued', 'sent', 'failed', 'read'], default: 'queued' },
  sentAt: { type: Date },
  readAt: { type: Date },
  expoTicketId: { type: String },
});

notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ userId: 1, changeId: 1, kind: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
