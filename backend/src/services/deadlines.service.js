import mongoose from 'mongoose';
import { AppError } from '../middleware/envelope.js';
import { Deadline, Source } from '../models/index.js';

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

export async function listDeadlines(userId, status) {
  const filter = { userId };
  if (status) {
    filter.status = status;
  }

  const docs = await Deadline.find(filter).sort({ dueAt: 1 }).lean();
  const sourceIds = [...new Set(docs.map((d) => d.sourceId).filter(Boolean))];
  const sources = sourceIds.length
    ? await Source.find({ _id: { $in: sourceIds } })
        .select('name url')
        .lean()
    : [];
  const sourceMap = new Map(sources.map((s) => [String(s._id), s]));

  return docs.map((d) => formatDeadline(d, sourceMap.get(String(d.sourceId))));
}

export async function createDeadline(userId, { label, dueAt, sourceId, changeId }) {
  const created = await Deadline.create({
    userId,
    label,
    dueAt: new Date(dueAt),
    ...(sourceId ? { sourceId } : {}),
    ...(changeId ? { changeId } : {}),
  });

  const source = created.sourceId
    ? await Source.findById(created.sourceId).select('name url').lean()
    : null;

  return formatDeadline(created, source);
}

export async function updateDeadline(userId, deadlineId, body) {
  if (!mongoose.Types.ObjectId.isValid(deadlineId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid deadline id');
  }

  const existing = await Deadline.findOne({ _id: deadlineId, userId }).lean();
  if (!existing) {
    throw new AppError(404, 'DEADLINE_NOT_FOUND', 'Deadline not found');
  }

  const update = { ...body };
  if (body.dueAt) {
    const nextDue = new Date(body.dueAt);
    update.dueAt = nextDue;
    if (existing.dueAt && new Date(existing.dueAt).getTime() !== nextDue.getTime()) {
      update.previousDueAt = existing.dueAt;
      update.movedAt = new Date();
    }
  }

  const updated = await Deadline.findOneAndUpdate(
    { _id: deadlineId, userId },
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  const source = updated.sourceId
    ? await Source.findById(updated.sourceId).select('name url').lean()
    : null;

  return formatDeadline(updated, source);
}

export async function deleteDeadline(userId, deadlineId) {
  if (!mongoose.Types.ObjectId.isValid(deadlineId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid deadline id');
  }

  const removed = await Deadline.findOneAndDelete({
    _id: deadlineId,
    userId,
  }).lean();

  if (!removed) {
    throw new AppError(404, 'DEADLINE_NOT_FOUND', 'Deadline not found');
  }

  return { deleted: true };
}
