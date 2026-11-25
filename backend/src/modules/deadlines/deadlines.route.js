import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Deadline, Source } from '../../models/index.js';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

const listQuerySchema = z.object({
  status: z.enum(['active', 'done', 'expired']).optional(),
});

const createDeadlineSchema = z.object({
  label: z.string().trim().min(1).max(120),
  dueAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid dueAt date'),
  sourceId: objectIdString.optional(),
  changeId: objectIdString.optional(),
});

const patchDeadlineSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    dueAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid dueAt date')
      .optional(),
    status: z.enum(['active', 'done', 'expired']).optional(),
    calendarEventId: z.string().trim().max(120).optional(),
  })
  .strict();

function formatDeadline(doc, source) {
  return {
    id: String(doc._id),
    label: doc.label,
    dueAt: doc.dueAt,
    previousDueAt: doc.previousDueAt ?? null,
    movedAt: doc.movedAt ?? null,
    status: doc.status,
    calendarEventId: doc.calendarEventId ?? null,
    sourceId: doc.sourceId ? String(doc.sourceId) : null,
    changeId: doc.changeId ? String(doc.changeId) : null,
    sourceName: source?.name ?? null,
    sourceUrl: source?.url ?? null,
  };
}

export function createDeadlinesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', validate({ query: listQuerySchema }), async (req, res) => {
    const filter = { userId: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const docs = await Deadline.find(filter).sort({ dueAt: 1 }).lean();
    const sourceIds = [...new Set(docs.map((d) => d.sourceId).filter(Boolean))];
    const sources = sourceIds.length
      ? await Source.find({ _id: { $in: sourceIds } })
          .select('name url')
          .lean()
      : [];
    const sourceMap = new Map(sources.map((s) => [String(s._id), s]));

    return ok(res, {
      deadlines: docs.map((d) => formatDeadline(d, sourceMap.get(String(d.sourceId)))),
    });
  });

  router.post('/', validate({ body: createDeadlineSchema }), async (req, res) => {
    const { label, dueAt, sourceId, changeId } = req.body;
    const created = await Deadline.create({
      userId: req.user._id,
      label,
      dueAt: new Date(dueAt),
      ...(sourceId ? { sourceId } : {}),
      ...(changeId ? { changeId } : {}),
    });

    const source = created.sourceId
      ? await Source.findById(created.sourceId).select('name url').lean()
      : null;

    return ok(res, { deadline: formatDeadline(created, source) }, 201);
  });

  router.patch('/:id', validate({ body: patchDeadlineSchema }), async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid deadline id'));
    }

    const existing = await Deadline.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!existing) {
      return next(new AppError(404, 'DEADLINE_NOT_FOUND', 'Deadline not found'));
    }

    const update = { ...req.body };
    if (req.body.dueAt) {
      const nextDue = new Date(req.body.dueAt);
      update.dueAt = nextDue;
      if (existing.dueAt && new Date(existing.dueAt).getTime() !== nextDue.getTime()) {
        update.previousDueAt = existing.dueAt;
        update.movedAt = new Date();
      }
    }

    const updated = await Deadline.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: update },
      { returnDocument: 'after', runValidators: true },
    ).lean();

    const source = updated.sourceId
      ? await Source.findById(updated.sourceId).select('name url').lean()
      : null;

    return ok(res, { deadline: formatDeadline(updated, source) });
  });

  router.delete('/:id', async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid deadline id'));
    }

    const del = await Deadline.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    }).lean();

    if (!del) {
      return next(new AppError(404, 'DEADLINE_NOT_FOUND', 'Deadline not found'));
    }

    return ok(res, { deleted: true });
  });

  return router;
}
