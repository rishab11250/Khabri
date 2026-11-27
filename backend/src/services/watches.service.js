import mongoose from 'mongoose';
import { processSource } from '../engine/scheduler.js';
import { AppError } from '../middleware/envelope.js';
import { Source, Watch } from '../models/index.js';

const MAX_WATCHES_PER_USER = 15;
const MAX_SEARCH_WATCHES_PER_USER = 3;
const REFRESH_COOLDOWN_MS = 60 * 60 * 1000;

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

export async function listWatches(userId) {
  const watches = await Watch.find({ userId }).sort({ createdAt: -1 }).lean();
  const sourceIds = watches.map((w) => w.sourceId);
  const sources = await Source.find({ _id: { $in: sourceIds } }).lean();
  const sourceMap = new Map(sources.map((s) => [String(s._id), s]));

  return watches.map((w) => formatWatch(w, sourceMap.get(String(w.sourceId))));
}

export async function createWatch(
  userId,
  { sourceId, searchQuery, title, category, priority, createdVia, focusTerms },
) {
  const currentCount = await Watch.countDocuments({ userId });
  if (currentCount >= MAX_WATCHES_PER_USER) {
    throw new AppError(
      400,
      'WATCH_LIMIT_REACHED',
      `Maximum ${MAX_WATCHES_PER_USER} watches allowed per user`,
    );
  }

  let source;
  if (sourceId) {
    source = await Source.findById(sourceId);
    if (!source) {
      throw new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found');
    }
  } else {
    const searchCount = await Watch.countDocuments({
      userId,
      createdVia: 'search',
    });
    if (searchCount >= MAX_SEARCH_WATCHES_PER_USER) {
      throw new AppError(
        400,
        'SEARCH_WATCH_LIMIT_REACHED',
        `Maximum ${MAX_SEARCH_WATCHES_PER_USER} search watches allowed per user`,
      );
    }
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    source = await Source.findOneAndUpdate(
      { url: searchUrl },
      {
        $setOnInsert: {
          name: title || searchQuery,
          url: searchUrl,
          type: 'search',
          category,
          trust: 'reported',
          intervalMin: 1440,
          nextDueAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
  }

  const existing = await Watch.findOne({ userId, sourceId: source._id }).lean();
  if (existing) {
    throw new AppError(409, 'WATCH_EXISTS', 'You already watch this source');
  }

  const watch = await Watch.create({
    userId,
    sourceId: source._id,
    title: title || source.name,
    priority,
    createdVia: source.type === 'search' ? 'search' : createdVia,
    focusTerms: focusTerms ?? [],
  });

  const updatedSource = await Source.findByIdAndUpdate(
    source._id,
    { $inc: { followerCount: 1 } },
    { returnDocument: 'after' },
  ).lean();

  return formatWatch(watch, updatedSource);
}

export async function updateWatch(userId, watchId, body) {
  if (!mongoose.Types.ObjectId.isValid(watchId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid watch id');
  }

  const updated = await Watch.findOneAndUpdate(
    { _id: watchId, userId },
    { $set: body },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) {
    throw new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found');
  }

  const source = await Source.findById(updated.sourceId).lean();
  return formatWatch(updated, source);
}

export async function deleteWatch(userId, watchId) {
  if (!mongoose.Types.ObjectId.isValid(watchId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid watch id');
  }

  const deleted = await Watch.findOneAndDelete({
    _id: watchId,
    userId,
  }).lean();

  if (!deleted) {
    throw new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found');
  }

  await Source.updateOne(
    { _id: deleted.sourceId, followerCount: { $gt: 0 } },
    { $inc: { followerCount: -1 } },
  );

  return { deleted: true };
}

export async function refreshWatch(userId, watchId, tickOptions = {}) {
  if (!mongoose.Types.ObjectId.isValid(watchId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid watch id');
  }

  const watch = await Watch.findOne({ _id: watchId, userId }).lean();
  if (!watch) {
    throw new AppError(404, 'WATCH_NOT_FOUND', 'Watch not found');
  }

  const source = await Source.findById(watch.sourceId).lean();
  if (!source) {
    throw new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found');
  }
  if (source.type === 'search') {
    throw new AppError(400, 'SEARCH_REFRESH_BLOCKED', 'Manual refresh is for direct sources only');
  }

  const lastAt = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;
  if (lastAt && Date.now() - lastAt < REFRESH_COOLDOWN_MS) {
    throw new AppError(429, 'REFRESH_COOLDOWN', 'Please wait 1 hour between manual refreshes');
  }

  return processSource(source, tickOptions);
}
