/**
 * Mongoose model caching hashed AI responses in MongoDB with automatic 30-day TTL expiration.
 * Deliberately avoids in-memory LRU caching so responses survive container restarts on Render.
 */
import mongoose from 'mongoose';

const aiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // SHA-256 of task, language, and bounded input.
  output: { type: mongoose.Schema.Types.Mixed, required: true }, // Validated JSON summary or translation payload.
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 30 }, // TTL index evicts entries after 30 days.
});

export const AiCache = mongoose.model('AiCache', aiCacheSchema);
