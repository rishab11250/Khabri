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
    inviteCode: { type: String, required: true, unique: true, uppercase: true },
    members: { type: [circleMemberSchema], default: [] },
    watchIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Source' }], default: [] },
  },
  { timestamps: true },
);

circleSchema.index({ 'members.userId': 1 });

export const Circle = mongoose.model('Circle', circleSchema);
