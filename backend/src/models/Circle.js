/**
 * Mongoose model for family/study circles sharing monitored notice sources via invite codes.
 * Deliberately embeds member roles and source IDs on the circle for atomic membership checks.
 */
import mongoose from 'mongoose';

const circleMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
  },
  { _id: false },
);

const circleSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true }, // Unique 6-char shareable join code.
    members: { type: [circleMemberSchema], default: [] },
    watchIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }], default: [] }, // Sources synced to new joiners.
  },
  { timestamps: true },
);

// Indexes circle listings and authorization queries filtered by member userId.
circleSchema.index({ 'members.userId': 1 });

export const Circle = mongoose.model('Circle', circleSchema);
