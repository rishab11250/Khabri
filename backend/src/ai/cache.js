/**
 * Content-addressed MongoDB cache helpers for AI responses.
 * Deliberately leaves TTL eviction to the `AiCache` Mongoose index rather than pruning inline.
 */
import { createHash } from 'node:crypto';

import { AiCache } from '../models/index.js';

/**
 * Computes a deterministic SHA-256 key from task name, target language, and normalized input.
 *
 * @param {object} params - Cache key components.
 * @param {string} params.task - Logical AI task identifier (for example `change_analysis`).
 * @param {string} [params.language] - Target output language code.
 * @param {*} params.input - Serializable payload hashed into the key.
 * @returns {string} 64-character hex digest.
 */
export function buildAiCacheKey({ task, language = 'en', input }) {
  return createHash('sha256').update(JSON.stringify({ task, language, input })).digest('hex');
}

/**
 * Reads a previously cached AI output by key.
 *
 * @param {string} key - SHA-256 cache key produced by `buildAiCacheKey`.
 * @returns {Promise<*|null>} Cached payload, or `null` on miss/expiry.
 */
export async function getCachedAi(key) {
  const doc = await AiCache.findOne({ key }).lean();
  return doc?.output ?? null;
}

/**
 * Stores or refreshes an AI response payload under `key`.
 *
 * @param {string} key - SHA-256 cache key produced by `buildAiCacheKey`.
 * @param {*} output - JSON-serializable AI result to cache.
 * @returns {Promise<void>}
 */
export async function setCachedAi(key, output) {
  await AiCache.findOneAndUpdate(
    { key },
    { $set: { output, createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
}
