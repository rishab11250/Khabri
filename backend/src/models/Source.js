import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['listing', 'page', 'rss', 'search'], required: true },
    category: {
      type: String,
      enum: ['exam', 'recruitment', 'scholarship', 'scheme', 'university'],
      required: true,
    },
    state: { type: String, default: 'All India', trim: true },
    language: { type: String, enum: ['en', 'hi', 'gu'], default: 'en' },
    trust: {
      type: String,
      enum: ['official', 'reported', 'unverified'],
      default: 'unverified',
    },
    isDemo: { type: Boolean, default: false },
    unsupported: { type: Boolean, default: false },
    intervalMin: { type: Number, default: 60 },
    nextDueAt: { type: Date, default: Date.now },
    etag: { type: String },
    lastModified: { type: String },
    lastHash: { type: String },
    lastFetchedAt: { type: Date },
    failures: { type: Number, default: 0 },
    circuitOpenUntil: { type: Date },
    followerCount: { type: Number, default: 0, min: 0 },
    selectorConfig: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

sourceSchema.index({ nextDueAt: 1 });
sourceSchema.index({ category: 1, state: 1 });
sourceSchema.index({ followerCount: -1 });

export const Source = mongoose.model('Source', sourceSchema);
