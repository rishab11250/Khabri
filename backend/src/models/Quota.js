/**
 * Mongoose model tracking API provider keys and per-user daily/monthly request counters.
 * Deliberately models `(provider, keyAlias, period)` uniquely for atomic `$inc` quota checks.
 */
import mongoose from 'mongoose';

const quotaSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['serpapi', 'gemini', 'grok'], required: true },
    keyAlias: { type: String, required: true }, // API key alias (`gemini_a`) or `user:<id>:<kind>`.
    period: { type: String, required: true }, // `YYYY-MM-DD` (AI/user) or `YYYY-MM` (SerpAPI).
    used: { type: Number, default: 0, min: 0 },
    limit: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Enforces one counter bucket per provider key per period and powers atomic `$inc` lookups.
quotaSchema.index({ provider: 1, keyAlias: 1, period: 1 }, { unique: true });

export const Quota = mongoose.model('Quota', quotaSchema);
