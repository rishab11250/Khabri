/**
 * Builds cursor-paginated change feeds, single change cards, and cached native translations.
 * Deliberately queries `limit + 1` rows so `nextCursor` is emitted only when more items exist.
 */
import mongoose from 'mongoose';

import { buildAiCacheKey, getCachedAi, setCachedAi } from '../ai/cache.js';
import { wrapUntrustedData } from '../ai/prompts.js';
import { createAiRouter } from '../ai/router.js';
import { hasDisallowedUrls } from '../ai/trust.js';
import { AppError } from '../middleware/envelope.js';
import { Change, ChecklistItem, Source, Watch } from '../models/index.js';
import { TRANSLATE_JSON_SCHEMA, translateOutputSchema } from '../validators/feed.validator.js';

const LANG_NAMES = { hi: 'Hindi (Devanagari script)', gu: 'Gujarati (Gujarati script)' };

function formatCard(change, source, checklistItems = []) {
  return {
    id: String(change._id),
    sourceId: String(change.sourceId),
    detectedAt: change.detectedAt,
    kind: change.kind,
    impact: change.impact,
    trust: change.trust,
    before: change.before,
    after: change.after,
    evidence: change.evidence ?? [],
    analysis: {
      why: change.analysis?.why ?? '',
      checklist: change.analysis?.checklist ?? [],
      dates: change.analysis?.dates ?? [],
    },
    translations: change.translations ?? {},
    confidence: change.confidence ?? 0.5,
    source: source
      ? {
          id: String(source._id),
          name: source.name,
          url: source.url,
          category: source.category,
          state: source.state,
          trust: source.trust,
        }
      : null,
    checklistItems: checklistItems.map((item) => ({
      id: String(item._id),
      text: item.text,
      done: Boolean(item.done),
    })),
  };
}

/**
 * Returns a cursor-paginated feed of changes across `userId`'s currently watched sources.
 *
 * @param {string|object} userId - Authenticated user ID.
 * @param {object} params - Pagination arguments.
 * @param {string} [params.cursor] - ISO timestamp cursor from previous response.
 * @param {number} params.limit - Maximum cards to return per page.
 * @returns {Promise<{ items: Array<object>, nextCursor: string|null }>} Feed slice and next cursor.
 * @throws {AppError} When `cursor` is not a valid date string (400).
 */
export async function getUserFeed(userId, { cursor, limit }) {
  const watches = await Watch.find({ userId }).select('sourceId').lean();
  const sourceIds = watches.map((w) => w.sourceId);

  if (sourceIds.length === 0) {
    return { items: [], nextCursor: null };
  }

  const filter = { sourceId: { $in: sourceIds } };
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (Number.isNaN(cursorDate.getTime())) {
      throw new AppError(400, 'INVALID_CURSOR', 'Invalid cursor timestamp');
    }
    filter.detectedAt = { $lt: cursorDate };
  }

  const docs = await Change.find(filter)
    .sort({ detectedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const pageDocs = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore
    ? new Date(pageDocs[pageDocs.length - 1].detectedAt).toISOString()
    : null;

  const pageSourceIds = [...new Set(pageDocs.map((c) => c.sourceId))];
  const changeIds = pageDocs.map((c) => c._id);
  const [sources, checklist] = await Promise.all([
    Source.find({ _id: { $in: pageSourceIds } }).lean(),
    ChecklistItem.find({ userId, changeId: { $in: changeIds } }).lean(),
  ]);

  const sourceMap = new Map(sources.map((s) => [String(s._id), s]));
  const checklistMap = new Map();
  for (const item of checklist) {
    const key = String(item.changeId);
    if (!checklistMap.has(key)) checklistMap.set(key, []);
    checklistMap.get(key).push(item);
  }

  return {
    items: pageDocs.map((c) =>
      formatCard(c, sourceMap.get(String(c.sourceId)), checklistMap.get(String(c._id))),
    ),
    nextCursor,
  };
}

/**
 * Loads a single change card enriched with source metadata and `userId`'s checklist items.
 *
 * @param {string|object} userId - Authenticated user ID.
 * @param {string} changeId - Target change ObjectId string.
 * @returns {Promise<object>} Formatted change card.
 * @throws {AppError} When `changeId` is invalid (400) or missing (404).
 */
export async function getChangeCard(userId, changeId) {
  if (!mongoose.Types.ObjectId.isValid(changeId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid change id');
  }

  const change = await Change.findById(changeId).lean();
  if (!change) {
    throw new AppError(404, 'CHANGE_NOT_FOUND', 'Change card not found');
  }

  const [source, checklist] = await Promise.all([
    Source.findById(change.sourceId).lean(),
    ChecklistItem.find({ userId, changeId: change._id }).lean(),
  ]);

  return formatCard(change, source, checklist);
}

async function generateAndCacheTranslation({ lang, payload, cacheKey, aiRouter }) {
  const routerAi = aiRouter ?? createAiRouter();
  try {
    const { result: aiTranslation } = await routerAi.generateJson({
      role: 'user',
      systemInstruction: `Translate only the provided explanation fields into natural native ${LANG_NAMES[lang]} (not transliteration). Preserve any dates and numbers accurately. Never add URLs. Return JSON only.`,
      prompt: wrapUntrustedData('EXPLANATION_FIELDS', JSON.stringify(payload)),
      jsonSchema: TRANSLATE_JSON_SCHEMA,
    });
    const parsed = translateOutputSchema.parse(aiTranslation);
    if (hasDisallowedUrls(`${parsed.why} ${parsed.checklist.join(' ')}`, [payload.why])) {
      throw new AppError(502, 'TRANSLATION_REJECTED', 'Invalid URL in translation');
    }
    await setCachedAi(cacheKey, parsed);
    return parsed;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'TRANSLATION_FAILED', err?.message || 'Translation unavailable');
  }
}

function getCachedOrEnglishTranslation(change, lang) {
  const analysis = change.analysis;
  if (lang === 'en') {
    return {
      lang: 'en',
      why: analysis?.why ?? '',
      checklist: analysis?.checklist ?? [],
      cached: true,
    };
  }

  const existing = change.translations?.[lang];
  if (!existing?.why) return null;

  return {
    lang,
    why: existing.why,
    checklist: existing.checklist ?? [],
    cached: true,
  };
}

/**
 * Translates a change card's explanation and checklist into `hi` or `gu` (or returns `en` directly).
 * Checks embedded card translations and `AiCache` before invoking the AI router.
 *
 * @param {string} changeId - Target change ObjectId string.
 * @param {'en'|'hi'|'gu'} lang - Requested target language code.
 * @param {object} [aiRouter] - Optional AI router override for testing.
 * @returns {Promise<{ lang: string, why: string, checklist: string[], cached: boolean }>} Translation payload.
 * @throws {AppError} When ID is invalid (400), change missing (404), or translation fails URL/provider checks (502).
 */
export async function translateChangeCard(changeId, lang, aiRouter) {
  if (!mongoose.Types.ObjectId.isValid(changeId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid change id');
  }

  const change = await Change.findById(changeId).lean();
  if (!change) {
    throw new AppError(404, 'CHANGE_NOT_FOUND', 'Change card not found');
  }

  const ready = getCachedOrEnglishTranslation(change, lang);
  if (ready) return ready;

  const payload = {
    why: change.analysis?.why ?? '',
    checklist: change.analysis?.checklist ?? [],
  };
  const cacheKey = buildAiCacheKey({ task: 'translate_change', language: lang, input: payload });
  let translated = await getCachedAi(cacheKey);
  const cached = Boolean(translated);

  if (!translated) {
    translated = await generateAndCacheTranslation({ lang, payload, cacheKey, aiRouter });
  }

  await Change.updateOne({ _id: change._id }, { $set: { [`translations.${lang}`]: translated } });

  return { lang, why: translated.why, checklist: translated.checklist, cached };
}
