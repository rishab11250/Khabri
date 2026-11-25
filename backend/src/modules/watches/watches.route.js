import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { processSource } from '../../engine/scheduler.js';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Source, Watch } from '../../models/index.js';

const MAX_WATCHES_PER_USER = 15;
const REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

const createWatchSchema = z.object({
  sourceId: objectIdString,
  title: z.string().trim().min(1).max(120).optional(),
  priority: z.enum(['normal', 'instant']).default('normal'),
  createdVia: z
    .enum(['catalog', 'link', 'photo', 'trending', 'circle', 'search'])
    .default('catalog'),
  focusTerms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

const patchWatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    priority: z.enum(['normal', 'instant']).optional(),
    muted: z.boolean().optional(),
    focusTerms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .strict();

function formatWatch(watch, source) {
  return {
    id: String(watch._id),
    sourceId: String(watch.sourceId),
    title: watch.title,
    priority: watch.priority,
    muted: Boolean(watch.muted),
    createdVia: watch.createdVia,
    focusTerms: watch.focusTerms ?? [],
    createdAt: watch.createdAt,
    source: source
      ? {
          id: String(source._id),
          name: source.name,
          url: source.url,
          type: source.type,
          category: source.category,
          state: source.state,
          trust: source.trust,
          isDemo: Boolean(source.isDemo),
          unsupported: Boolean(source.unsupported),
          lastFetchedAt: source.lastFetchedAt ?? null,
          failures: source.failures ?? 0,
          circuitOpenUntil: source.circuitOpenUntil ?? null,
          followerCount: source.followerCount ?? 0,
        }
      : null,
  };
}

export function createWatchesRouter(requireAuth, options = {}) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const watches = await Watch.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
    const sourceIds = watches.map((w) => w.sourceId);
    const sources = await Source.find({ _id: { $in: sourceIds } }).lean();
    const sourceMap = new Map(sources.map((s) => [String(s._id), s]));

    return ok(res, {
      watches: watches.map((w) => formatWatch(w, sourceMap.get(String(w.sourceId)))),
    });
  });

  router.post('/', validate({ body: createWatchSchema }), async (req, res, next) => {
    const { sourceId, title, priority, createdVia, focusTerms } = req.body;

    const currentCount = await Watch.countDocuments({ userId: req.user._id });
    if (currentCount >= MAX_WATCHES_PER_USER) {
      return next(
        new AppError(
          400,
          'WATCH_LIMIT_REACHED',
          `Maximum ${MAX_WATCHES_PER_USER} watches allowed per user`,
        ),
      );
    }

    const source = await Source.findById(sourceId);
    if (!source) {
      return next(new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found'));
    }

    const existing = await Watch.findOne({ userId: req.user._id, sourceId: source._id }).lean();
    if (existing) {
      return next(new AppError(409, 'WATCH_EXISTS', 'You already watch this source'));
    }

    const watch = await Watch.create({
      userId: req.user._id,
      sourceId: source._id,
      title: title || source.name,
      priority,
      createdVia,
      focusTerms: focusTerms ?? [],
    });

    const updatedSource = await Source.findByIdAndUpdate(
      source._id,
      { $inc: { followerCount: 1 } },
      { returnDocument: 'after' },
    ).lean();

    return ok(res, { watch: formatWatch(watch, updatedSource) }, 201);
  });

  router.patch('/:id', validate({ body: patchWatchSchema }), async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid watch id'));
    }

    const updated = await Watch.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true },
    ).lean();

    if (!updated) {
      return next(new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found'));
    }

    const source = await Source.findById(updated.sourceId).lean();
    return ok(res, { watch: formatWatch(updated, source) });
  });

  router.delete('/:id', async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid watch id'));
    }

    const deleted = await Watch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!deleted) {
      return next(new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found'));
    }

    await Source.updateOne(
      { _id: deleted.sourceId, followerCount: { $gt: 0 } },
      { $inc: { followerCount: -1 } },
    );

    return ok(res, { deleted: true });
  });

  router.post('/:id/refresh', async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid watch id'));
    }

    const watch = await Watch.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!watch) {
      return next(new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found'));
    }

    const source = await Source.findById(watch.sourceId).lean();
    if (!source) {
      return next(new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found'));
    }
    if (source.type === 'search') {
      return next(
        new AppError(400, 'SEARCH_REFRESH_BLOCKED', 'Manual refresh is for direct sources only'),
      );
    }

    const lastAt = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;
    if (lastAt && Date.now() - lastAt < REFRESH_COOLDOWN_MS) {
      return next(
        new AppError(429, 'REFRESH_COOLDOWN', 'Please wait 1 hour between manual refreshes'),
      );
    }

    const result = await processSource(source, options.tickOptions || {});
    return ok(res, { result });
  });

  return router;
}
