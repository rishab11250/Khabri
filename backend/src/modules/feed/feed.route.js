import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Change, ChecklistItem, Source, Watch } from '../../models/index.js';

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

export function createChangesRouter(requireAuth) {
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

  return router;
}
