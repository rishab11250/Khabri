import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { wrapUntrustedData } from '../../ai/prompts.js';
import { consumeUserDailyQuota } from '../../ai/quota.js';
import { createAiRouter } from '../../ai/router.js';
import { hasDisallowedUrls } from '../../ai/trust.js';
import { AppError, ok } from '../../middleware/envelope.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { Change, Snapshot, Source, Watch } from '../../models/index.js';

const askBodySchema = z.object({
  scope: z
    .string()
    .trim()
    .refine((v) => v === 'all' || mongoose.Types.ObjectId.isValid(v), 'Invalid scope'),
  question: z.string().trim().min(2).max(400),
});

const askOutputSchema = z.object({
  answer: z.string().trim().min(1).max(1200),
  citedChangeIds: z.array(z.string()).max(10).default([]),
  found: z.boolean(),
});

const ASK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citedChangeIds: { type: 'array', items: { type: 'string' } },
    found: { type: 'boolean' },
  },
  required: ['answer', 'citedChangeIds', 'found'],
};

const askLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 20,
  message: 'Too many Ask Khabri requests, please wait',
});

export function createAskRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth, askLimiter);

  router.post('/', validate({ body: askBodySchema }), async (req, res, next) => {
    const { scope, question } = req.body;

    const quota = await consumeUserDailyQuota({ userId: req.user._id, kind: 'ask' });
    if (!quota.allowed) {
      return next(new AppError(429, 'ASK_QUOTA_EXCEEDED', 'Daily limit of 10 questions reached'));
    }

    const remainingToday = Math.max(0, quota.limit - quota.used);
    const watches = await Watch.find({ userId: req.user._id }).select('sourceId').lean();
    let sourceIds = watches.map((w) => w.sourceId);

    if (scope !== 'all') {
      const requested = sourceIds.filter((id) => String(id) === scope);
      sourceIds = requested;
    }

    if (sourceIds.length === 0) {
      return ok(res, {
        found: false,
        answer: 'No watched sources matched this scope. Add a watch first.',
        citations: [],
        remainingToday,
      });
    }

    const [sources, changes, snapshots] = await Promise.all([
      Source.find({ _id: { $in: sourceIds } })
        .select('name url')
        .lean(),
      Change.find({ sourceId: { $in: sourceIds } })
        .sort({ detectedAt: -1 })
        .limit(15)
        .lean(),
      Snapshot.find({ sourceId: { $in: sourceIds } })
        .sort({ takenAt: -1 })
        .limit(10)
        .lean(),
    ]);

    if (changes.length === 0 && snapshots.length === 0) {
      return ok(res, {
        found: false,
        answer: 'I could not find any stored updates or snapshots for your watched sources yet.',
        citations: [],
        remainingToday,
      });
    }

    const sourceMap = new Map(sources.map((s) => [String(s._id), s]));
    const changeMap = new Map(changes.map((c) => [String(c._id), c]));

    const recordsContext = [
      ...changes.map((c) => ({
        changeId: String(c._id),
        source: sourceMap.get(String(c.sourceId))?.name || 'Source',
        detectedAt: new Date(c.detectedAt).toISOString().slice(0, 10),
        impact: c.impact,
        before: c.before,
        after: c.after,
        why: c.analysis?.why || '',
      })),
      ...snapshots.slice(0, 5).map((s) => ({
        snapshotSource: sourceMap.get(String(s.sourceId))?.name || 'Source',
        takenAt: new Date(s.takenAt).toISOString().slice(0, 10),
        excerpt: String(s.textExcerpt || '').slice(0, 400),
      })),
    ];

    const routerAi = options.aiRouter ?? createAiRouter();
    try {
      const { result } = await routerAi.generateJson({
        role: 'user',
        systemInstruction: [
          'You are Khabri assistant. Answer ONLY using the provided JSON records from the user’s watched sources.',
          'Cite exact changeId values in citedChangeIds. Never invent dates, URLs, or facts.',
          'If the stored data does not contain the answer, set found=false and clearly state that the stored notices do not have that information.',
          'Return JSON only.',
        ].join(' '),
        prompt: [
          `Question: ${question}`,
          wrapUntrustedData('STORED_RECORDS', JSON.stringify(recordsContext)),
        ].join('\n\n'),
        jsonSchema: ASK_JSON_SCHEMA,
      });

      const parsed = askOutputSchema.parse(result);
      const allowedTexts = [
        ...sources.map((s) => s.url),
        ...changes.map((c) => `${c.before} ${c.after}`),
      ];
      if (hasDisallowedUrls(parsed.answer, allowedTexts)) {
        return next(new AppError(502, 'ASK_REJECTED', 'Response contained disallowed URL'));
      }

      const citations = parsed.citedChangeIds
        .filter((cid) => changeMap.has(cid))
        .map((cid) => {
          const c = changeMap.get(cid);
          return {
            changeId: cid,
            sourceName: sourceMap.get(String(c.sourceId))?.name || 'Source',
            detectedAt: c.detectedAt,
            after: c.after,
          };
        });

      return ok(res, {
        found: parsed.found,
        answer: parsed.answer,
        citations,
        remainingToday,
      });
    } catch (err) {
      return next(new AppError(502, 'ASK_FAILED', err?.message || 'Ask Khabri unavailable'));
    }
  });

  return router;
}
