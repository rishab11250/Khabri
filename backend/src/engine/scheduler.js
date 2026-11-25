import { analyzeChangeWithRouter } from '../ai/analyzeChange.js';
import { resolveTrustTag } from '../ai/trust.js';
import { Change, Deadline, JobLock, Snapshot, Source } from '../models/index.js';
import { persistFollowersDataForChange } from './deadlines.js';
import { diffListings, diffPages } from './diff.js';
import { extractSignals } from './extract.js';
import { fetchListing } from './fetchers/listing.js';
import { fetchPage } from './fetchers/page.js';
import { fetchRss } from './fetchers/rss.js';
import { evaluateMateriality } from './materialFilter.js';
import { fetchAndExtractPdf } from './pdfExtract.js';

const CIRCUIT_OPEN_MS = 6 * 60 * 60 * 1000;
const FAILURE_THRESHOLD = 5;
const SNAPSHOT_RETENTION = 10;
const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000;

export async function acquireJobLock(name = 'tick', ttlMs = DEFAULT_LOCK_TTL_MS, now = new Date()) {
  const lockedUntil = new Date(now.getTime() + ttlMs);
  try {
    const lock = await JobLock.findOneAndUpdate(
      {
        name,
        $or: [{ lockedUntil: { $lte: now } }, { lockedUntil: { $exists: false } }],
      },
      { $set: { name, lockedUntil } },
      { upsert: true, returnDocument: 'after' },
    );
    return Boolean(lock);
  } catch (err) {
    if (err?.code === 11000) {
      return false;
    }
    throw err;
  }
}

export async function releaseJobLock(name = 'tick') {
  await JobLock.updateOne({ name }, { $set: { lockedUntil: new Date(0) } });
}

export async function selectDueSources({ now = new Date(), limit = 25 } = {}) {
  const candidates = await Source.find({
    followerCount: { $gt: 0 },
    unsupported: { $ne: true },
    type: { $in: ['listing', 'page', 'rss'] },
    nextDueAt: { $lte: now },
    $or: [{ circuitOpenUntil: null }, { circuitOpenUntil: { $lte: now } }],
  })
    .sort({ followerCount: -1, nextDueAt: 1 })
    .limit(limit * 2)
    .lean();

  if (candidates.length === 0) return [];

  const sourceIds = candidates.map((s) => s._id);
  const deadlines = await Deadline.find({
    sourceId: { $in: sourceIds },
    status: 'active',
    dueAt: { $gte: now },
  })
    .select('sourceId dueAt')
    .sort({ dueAt: 1 })
    .lean();

  const nearestDeadlineBySource = new Map();
  for (const d of deadlines) {
    const key = String(d.sourceId);
    if (!nearestDeadlineBySource.has(key)) {
      nearestDeadlineBySource.set(key, new Date(d.dueAt).getTime());
    }
  }

  candidates.sort((a, b) => {
    const da = nearestDeadlineBySource.get(String(a._id)) ?? Number.POSITIVE_INFINITY;
    const db = nearestDeadlineBySource.get(String(b._id)) ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    if ((b.followerCount ?? 0) !== (a.followerCount ?? 0)) {
      return (b.followerCount ?? 0) - (a.followerCount ?? 0);
    }
    return new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime();
  });

  return candidates.slice(0, limit);
}

export async function pruneSnapshots(sourceId, keep = SNAPSHOT_RETENTION) {
  const stale = await Snapshot.find({ sourceId })
    .sort({ takenAt: -1 })
    .skip(keep)
    .select('_id')
    .lean();

  if (stale.length > 0) {
    await Snapshot.deleteMany({ _id: { $in: stale.map((s) => s._id) } });
  }
}

function computeNextDueAt(intervalMin, now, jitterMs) {
  const baseMs = Math.max(1, intervalMin || 60) * 60 * 1000;
  const maxJitter = Math.min(60_000, Math.floor(baseMs * 0.1));
  const delta =
    typeof jitterMs === 'number' ? jitterMs : Math.floor((Math.random() * 2 - 1) * maxJitter);
  return new Date(now.getTime() + baseMs + delta);
}

async function fetchBySourceType(source, fetchOptions) {
  if (source.type === 'listing') return fetchListing(source, fetchOptions);
  if (source.type === 'rss') return fetchRss(source, fetchOptions);
  return fetchPage(source, fetchOptions);
}

export async function processSource(source, options = {}) {
  const now = options.now ?? new Date();
  const fetchFn = options.fetchSource ?? fetchBySourceType;
  const pdfExtractFn = options.extractPdf ?? fetchAndExtractPdf;

  try {
    const fetched = await fetchFn(source, options.fetchOptions || {});
    const nextDueAt = computeNextDueAt(source.intervalMin, now, options.jitterMs);

    if (fetched.notModified) {
      await Source.updateOne(
        { _id: source._id },
        {
          $set: {
            lastFetchedAt: now,
            nextDueAt,
            failures: 0,
            circuitOpenUntil: null,
            ...(fetched.etag ? { etag: fetched.etag } : {}),
            ...(fetched.lastModified ? { lastModified: fetched.lastModified } : {}),
          },
        },
      );
      return { sourceId: String(source._id), status: 'not_modified', changeCreated: false };
    }

    if (fetched.unsupported) {
      await Source.updateOne(
        { _id: source._id },
        { $set: { unsupported: true, lastFetchedAt: now, failures: 0, circuitOpenUntil: null } },
      );
      return { sourceId: String(source._id), status: 'unsupported', changeCreated: false };
    }

    const prevSnapshot = await Snapshot.findOne({ sourceId: source._id })
      .sort({ takenAt: -1 })
      .lean();

    if (!prevSnapshot) {
      await Snapshot.create({
        sourceId: source._id,
        takenAt: now,
        contentHash: fetched.contentHash,
        items: fetched.items || [],
        textExcerpt: fetched.textExcerpt || '',
      });
      await pruneSnapshots(source._id);
      await Source.updateOne(
        { _id: source._id },
        {
          $set: {
            lastFetchedAt: now,
            lastHash: fetched.contentHash,
            nextDueAt,
            failures: 0,
            circuitOpenUntil: null,
            ...(fetched.etag ? { etag: fetched.etag } : {}),
            ...(fetched.lastModified ? { lastModified: fetched.lastModified } : {}),
          },
        },
      );
      return { sourceId: String(source._id), status: 'baseline_saved', changeCreated: false };
    }

    const isListingLike = source.type === 'listing' || source.type === 'rss';
    const diffResult = isListingLike
      ? diffListings(prevSnapshot.items || [], fetched.items || [])
      : diffPages(prevSnapshot, fetched);

    if (!diffResult.changed) {
      await Source.updateOne(
        { _id: source._id },
        {
          $set: {
            lastFetchedAt: now,
            nextDueAt,
            failures: 0,
            circuitOpenUntil: null,
            ...(fetched.etag ? { etag: fetched.etag } : {}),
            ...(fetched.lastModified ? { lastModified: fetched.lastModified } : {}),
          },
        },
      );
      return { sourceId: String(source._id), status: 'unchanged', changeCreated: false };
    }

    let pdfSupplement = '';
    if (isListingLike && !options.skipPdf) {
      const candidateLinks = [
        ...diffResult.added.map((i) => i.href),
        ...diffResult.updated.map((u) => u.after.href),
      ].filter((href) => /\.pdf(?:$|\?)/i.test(href));

      if (candidateLinks[0]) {
        try {
          const pdfRes = await pdfExtractFn(candidateLinks[0], options.fetchOptions || {});
          pdfSupplement = pdfRes.text.slice(0, 4000);
        } catch {
          // Non-fatal: proceed with listing text if linked PDF fails
        }
      }
    }

    const beforeText = isListingLike
      ? prevSnapshot.textExcerpt || ''
      : prevSnapshot.textExcerpt || '';
    const afterText = isListingLike
      ? `${fetched.textExcerpt || ''}\n${pdfSupplement}`.trim()
      : fetched.text || fetched.textExcerpt || '';

    const beforeSignals = extractSignals(beforeText);
    const afterSignals = extractSignals(afterText);
    const material = evaluateMateriality({ diffResult, beforeSignals, afterSignals });

    await Snapshot.create({
      sourceId: source._id,
      takenAt: now,
      contentHash: fetched.contentHash,
      items: fetched.items || [],
      textExcerpt: fetched.textExcerpt || '',
    });
    await pruneSnapshots(source._id);

    await Source.updateOne(
      { _id: source._id },
      {
        $set: {
          lastFetchedAt: now,
          lastHash: fetched.contentHash,
          nextDueAt,
          failures: 0,
          circuitOpenUntil: null,
          ...(fetched.etag ? { etag: fetched.etag } : {}),
          ...(fetched.lastModified ? { lastModified: fetched.lastModified } : {}),
        },
      },
    );

    if (!material.material) {
      return { sourceId: String(source._id), status: 'filtered_noise', changeCreated: false };
    }

    const analysisContext = {
      source,
      diffResult,
      material,
      beforeSignals,
      afterSignals,
      beforeText,
      afterText,
      pdfSupplement,
    };

    const analysisData = options.analyzeChange
      ? await options.analyzeChange(analysisContext)
      : await analyzeChangeWithRouter(analysisContext, {
          router: options.aiRouter,
          skipCache: options.skipAiCache,
        });

    const evidence = [{ url: source.url, label: source.name }];
    const linked = isListingLike
      ? diffResult.added[0]?.href || diffResult.updated[0]?.after?.href
      : '';
    if (linked && linked !== source.url) {
      evidence.push({ url: linked, label: 'Notice link' });
    }

    const changeDoc = await Change.create({
      sourceId: source._id,
      detectedAt: now,
      kind: analysisData.kind || material.kind,
      impact: analysisData.impact || material.impact,
      before: analysisData.before,
      after: analysisData.after,
      evidence,
      trust: resolveTrustTag({ source }),
      analysis: {
        why: analysisData.whyItMatters ?? analysisData.why ?? '',
        checklist: analysisData.checklist || [],
        dates: analysisData.dates || [],
      },
      confidence: analysisData.confidence ?? 0.6,
    });

    await persistFollowersDataForChange({ change: changeDoc, source });

    if (options.onChangePersisted) {
      await options.onChangePersisted({ change: changeDoc, source });
    }

    return {
      sourceId: String(source._id),
      status: 'changed',
      changeCreated: true,
      changeId: String(changeDoc._id),
    };
  } catch (err) {
    const failures = (source.failures ?? 0) + 1;
    const circuitOpen = failures >= FAILURE_THRESHOLD;
    await Source.updateOne(
      { _id: source._id },
      {
        $set: {
          failures,
          lastFetchedAt: now,
          circuitOpenUntil: circuitOpen ? new Date(now.getTime() + CIRCUIT_OPEN_MS) : null,
        },
      },
    );

    return {
      sourceId: String(source._id),
      status: circuitOpen ? 'circuit_opened' : 'failed',
      changeCreated: false,
      error: err?.message || 'Fetch error',
    };
  }
}

export async function runTick(options = {}) {
  const now = options.now ?? new Date();
  const acquired = await acquireJobLock('tick', options.lockTtlMs ?? DEFAULT_LOCK_TTL_MS, now);
  if (!acquired) {
    return {
      status: 'locked',
      processed: 0,
      changesCreated: 0,
      results: [],
    };
  }

  try {
    const dueSources = await selectDueSources({ now, limit: options.limit ?? 25 });
    const results = [];
    for (const source of dueSources) {
      const res = await processSource(source, { ...options, now });
      results.push(res);
    }

    return {
      status: 'ok',
      processed: results.length,
      changesCreated: results.filter((r) => r.changeCreated).length,
      results,
    };
  } finally {
    await releaseJobLock('tick');
  }
}
