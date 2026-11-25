import mongoose from 'mongoose';

const quotaSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['serpapi', 'gemini', 'grok'], required: true },
    keyAlias: { type: String, required: true },
    period: { type: String, required: true },
    used: { type: Number, default: 0, min: 0 },
    limit: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

quotaSchema.index({ provider: 1, keyAlias: 1, period: 1 }, { unique: true });

export const Quota = mongoose.model('Quota', quotaSchema);
