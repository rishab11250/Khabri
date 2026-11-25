import { createHash } from 'node:crypto';
import { AiCache } from '../models/index.js';

export function buildAiCacheKey({ task, language = 'en', input }) {
  return createHash('sha256').update(JSON.stringify({ task, language, input })).digest('hex');
}

export async function getCachedAi(key) {
  const doc = await AiCache.findOne({ key }).lean();
  return doc?.output ?? null;
}

export async function setCachedAi(key, output) {
  await AiCache.findOneAndUpdate(
    { key },
    { $set: { output, createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
}
