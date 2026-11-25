import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { buildAiCacheKey, getCachedAi, setCachedAi } from '../../ai/cache.js';
import { wrapUntrustedData } from '../../ai/prompts.js';
import { createAiRouter } from '../../ai/router.js';
import { hasDisallowedUrls } from '../../ai/trust.js';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Change, ChecklistItem, Source, Watch } from '../../models/index.js';

const translateBodySchema = z.object({
  lang: z.enum(['en', 'hi', 'gu']),
});

const translateOutputSchema = z.object({
  why: z.string().trim().min(1).max(800),
  checklist: z.array(z.string().trim().min(1).max(200)).max(6),
});

const TRANSLATE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    why: { type: 'string' },
    checklist: { type: 'array', items: { type: 'string' } },
  },
  required: ['why', 'checklist'],
};

const LANG_NAMES = { hi: 'Hindi (Devanagari script)', gu: 'Gujarati (Gujarati script)' };

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.preprocess((v) => (v ? Number(v) : 20), z.number().int().min(1).max(50)),
});

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

export function createFeedRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', validate({ query: feedQuerySchema }), async (req, res, next) => {
    const { cursor, limit } = req.query;
    const watches = await Watch.find({ userId: req.user._id }).select('sourceId').lean();
    const sourceIds = watches.map((w) => w.sourceId);

    if (sourceIds.length === 0) {
      return ok(res, { items: [], nextCursor: null });
    }

    const filter = { sourceId: { $in: sourceIds } };
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (Number.isNaN(cursorDate.getTime())) {
        return next(new AppError(400, 'INVALID_CURSOR', 'Invalid cursor timestamp'));
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
      ChecklistItem.find({ userId: req.user._id, changeId: { $in: changeIds } }).lean(),
    ]);

    const sourceMap = new Map(sources.map((s) => [String(s._id), s]));
    const checklistMap = new Map();
    for (const item of checklist) {
      const key = String(item.changeId);
      if (!checklistMap.has(key)) checklistMap.set(key, []);
      checklistMap.get(key).push(item);
    }

    return ok(res, {
      items: pageDocs.map((c) =>
        formatCard(c, sourceMap.get(String(c.sourceId)), checklistMap.get(String(c._id))),
      ),
      nextCursor,
    });
  });

  return router;
}

export function createChangesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);

  router.get('/:id', async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid change id'));
    }

    const change = await Change.findById(req.params.id).lean();
    if (!change) {
      return next(new AppError(404, 'CHANGE_NOT_FOUND', 'Change card not found'));
    }

    const [source, checklist] = await Promise.all([
      Source.findById(change.sourceId).lean(),
      ChecklistItem.find({ userId: req.user._id, changeId: change._id }).lean(),
    ]);

    return ok(res, { card: formatCard(change, source, checklist) });
  });

  router.post('/:id/translate', validate({ body: translateBodySchema }), async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid change id'));
    }

    const { lang } = req.body;
    const change = await Change.findById(req.params.id).lean();
    if (!change) {
      return next(new AppError(404, 'CHANGE_NOT_FOUND', 'Change card not found'));
    }

    if (lang === 'en') {
      return ok(res, {
        lang: 'en',
        why: change.analysis?.why ?? '',
        checklist: change.analysis?.checklist ?? [],
        cached: true,
      });
    }

    const existing = change.translations?.[lang];
    if (existing?.why) {
      return ok(res, {
        lang,
        why: existing.why,
        checklist: existing.checklist ?? [],
        cached: true,
      });
    }

    const payload = {
      why: change.analysis?.why ?? '',
      checklist: change.analysis?.checklist ?? [],
    };
    const cacheKey = buildAiCacheKey({
      task: 'translate_change',
      language: lang,
      input: payload,
    });

    let translated = await getCachedAi(cacheKey);
    let cached = Boolean(translated);

    if (!translated) {
      const routerAi = options.aiRouter ?? createAiRouter();
      try {
        const { result } = await routerAi.generateJson({
          role: 'user',
          systemInstruction: `Translate only the provided explanation fields into natural native ${LANG_NAMES[lang]} (not transliteration). Preserve any dates and numbers accurately. Never add URLs. Return JSON only.`,
          prompt: wrapUntrustedData('EXPLANATION_FIELDS', JSON.stringify(payload)),
          jsonSchema: TRANSLATE_JSON_SCHEMA,
        });
        const parsed = translateOutputSchema.parse(result);
        if (hasDisallowedUrls(`${parsed.why} ${parsed.checklist.join(' ')}`, [payload.why])) {
          return next(new AppError(502, 'TRANSLATION_REJECTED', 'Invalid URL in translation'));
        }
        translated = parsed;
        await setCachedAi(cacheKey, translated);
      } catch (err) {
        return next(
          new AppError(502, 'TRANSLATION_FAILED', err?.message || 'Translation unavailable'),
        );
      }
    }

    await Change.updateOne({ _id: change._id }, { $set: { [`translations.${lang}`]: translated } });

    return ok(res, {
      lang,
      why: translated.why,
      checklist: translated.checklist,
      cached,
    });
  });

  return router;
}
