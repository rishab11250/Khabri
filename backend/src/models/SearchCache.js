/**
 * Mongoose model caching normalized SerpAPI query results for 6 hours to conserve search quota.
 * Deliberately relies on MongoDB TTL expiry rather than application-level cache sweeping.
 */
import mongoose from 'mongoose';

const searchCacheSchema = new mongoose.Schema({
  queryHash: { type: String, required: true, unique: true }, // SHA-256 of normalized query string.
  results: { type: mongoose.Schema.Types.Mixed, required: true }, // Top 5 organic search items.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 6 }, // TTL index evicts stale search responses after 6h.
});

export const SearchCache = mongoose.model('SearchCache', searchCacheSchema);
