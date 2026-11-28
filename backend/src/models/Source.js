/**
 * Mongoose model representing curated, user-submitted, or search-backed monitored notice sources.
 * Deliberately tracks HTTP caching validators (`etag`, `lastModified`), circuit breakers, and follower counts.
 */
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
      enum: ['official', 'reported', 'unverified'], // Server-computed domain trust badge.
      default: 'unverified',
    },
    isDemo: { type: Boolean, default: false }, // True for the local Demo Notice Board source.
    unsupported: { type: Boolean, default: false }, // True when JS-rendered SPA cannot be scraped via HTML.
    intervalMin: { type: Number, default: 60 },
    nextDueAt: { type: Date, default: Date.now },
    etag: { type: String }, // Cached HTTP ETag sent on subsequent conditional requests.
    lastModified: { type: String }, // Cached HTTP Last-Modified header for 304 checks.
    lastHash: { type: String },
    lastFetchedAt: { type: Date },
    failures: { type: Number, default: 0 }, // Consecutive fetch error counter (circuit opens at 5).
    circuitOpenUntil: { type: Date }, // Future timestamp until which tick skips failing source.
    followerCount: { type: Number, default: 0, min: 0 }, // Cached watcher count (only > 0 sources are scheduled).
    selectorConfig: { type: mongoose.Schema.Types.Mixed }, // Optional CSS selector overrides for tricky portals.
  },
  { timestamps: true },
);

// Powers due-source scheduling queries (`nextDueAt <= now`) in scheduler ticks.
sourceSchema.index({ nextDueAt: 1 });
// Supports filtered catalog browsing by category and state.
sourceSchema.index({ category: 1, state: 1 });
// Supports trending source discovery and due-source sorting by popularity.
sourceSchema.index({ followerCount: -1 });

export const Source = mongoose.model('Source', sourceSchema);
