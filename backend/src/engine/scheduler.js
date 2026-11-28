/**
 * Orchestrates scheduled monitoring ticks: distributed lock acquisition, due-source priority,
 * fetch -> diff -> PDF supplement -> materiality filter -> AI analysis -> persistence -> push dispatch.
 * Deliberately opens a 6h circuit breaker after 5 consecutive failures so broken portals do not stall ticks.
 */
import { analyzeChangeWithRouter } from '../ai/analyzeChange.js';
import { resolveTrustTag } from '../ai/trust.js';
import { Change, Deadline, JobLock, Snapshot, Source } from '../models/index.js';
import { persistFollowersDataForChange } from './deadlines.js';
import { diffListings, diffPages } from './diff.js';
import { dispatchChangeNotifications, processPushReceipts } from './dispatcher.js';
import { extractSignals } from './extract.js';
import { fetchListing } from './fetchers/listing.js';
import { fetchPage } from './fetchers/page.js';
import { fetchRss } from './fetchers/rss.js';
import { evaluateMateriality } from './materialFilter.js';
import { fetchAndExtractPdf } from './pdfExtract.js';

const CIRCUIT_OPEN_MS = 6 * 60 * 60 * 1000; // Pause broken sources for 6 hours before retrying.
const FAILURE_THRESHOLD = 5; // Consecutive fetch errors required to open a source's circuit breaker.
const SNAPSHOT_RETENTION = 10; // Retain last 10 snapshots per source for auditability without unbounded growth.
const DEFAULT_LOCK_TTL_MS = 10 * 60 * 1000; // Lease TTL ensures crashed workers release `/internal/tick`.

// --- Distributed job locks ---

/**
 * Acquires an exclusive time-bounded lock in MongoDB so overlapping `/internal/tick` cron runs skip cleanly.
 *
 * @param {string} [name] - Logical lock identifier (`tick`).
 * @param {number} [ttlMs] - Lease duration in ms before another worker may steal a stale lock.
 * @param {Date} [now] - Reference timestamp for expiry checks.
 * @returns {Promise<boolean>} True if this caller owns the lock.
 */
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
      // Concurrent upsert race won by another tick instance.
      return false;
    }
    throw err;
  }
}

/**
 * Releases the distributed tick lock immediately when a tick finishes.
 *
 * @param {string} [name] - Logical lock identifier.
 * @returns {Promise<void>}
 */
export async function releaseJobLock(name = 'tick') {
  await JobLock.updateOne({ name }, { $set: { lockedUntil: new Date(0) } });
}

// --- Due-source selection and snapshot housekeeping ---

/**
 * Selects up to `limit` supported, followed, non-circuit-open sources due by `now`.
 * Prioritizes sources with nearest active deadlines first, then follower count, then staleness.
 *
 * @param {object} [params] - Selection window and cap.
 * @param {Date} [params.now] - Current reference timestamp.
 * @param {number} [params.limit] - Maximum sources to return per tick batch.
 * @returns {Promise<Array<object>>} Ordered source documents ready for fetching.
 */
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

/**
 * Deletes older snapshots for `sourceId`, retaining only the newest `keep` records (`10` by default).
 *
 * @param {string|object} sourceId - Mongo source ID.
 * @param {number} [keep] - Number of recent snapshots to preserve.
 * @returns {Promise<void>}
 */
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

function fetchBySourceType(source, fetchOptions) {
  if (source.type === 'listing') return fetchListing(source, fetchOptions);
  if (source.type === 'rss') return fetchRss(source, fetchOptions);
  return fetchPage(source, fetchOptions);
}

async function markSourceSuccess(sourceId, now, nextDueAt, fetched, includeHash = false) {
  await Source.updateOne(
    { _id: sourceId },
    {
      $set: {
        lastFetchedAt: now,
        nextDueAt,
        failures: 0,
        circuitOpenUntil: null,
        ...(includeHash ? { lastHash: fetched.contentHash } : {}),
        ...(fetched.etag ? { etag: fetched.etag } : {}),
        ...(fetched.lastModified ? { lastModified: fetched.lastModified } : {}),
      },
    },
  );
}

async function saveSnapshotAndPrune(sourceId, now, fetched) {
  await Snapshot.create({
    sourceId,
    takenAt: now,
    contentHash: fetched.contentHash,
    items: fetched.items || [],
    textExcerpt: fetched.textExcerpt || '',
  });
  await pruneSnapshots(sourceId);
}

async function loadPdfSupplement({ isListingLike, diffResult, options, pdfExtractFn }) {
  if (!isListingLike || options.skipPdf) return '';
  const candidateLinks = [
    ...diffResult.added.map((i) => i.href),
    ...diffResult.updated.map((u) => u.after.href),
  ].filter((href) => /\.pdf(?:$|\?)/i.test(href));

  if (!candidateLinks[0]) return '';
  try {
    const pdfRes = await pdfExtractFn(candidateLinks[0], options.fetchOptions || {});
    return pdfRes.text.slice(0, 4000);
  } catch {
    return '';
  }
}

function buildEvidence(source, isListingLike, diffResult) {
  const evidence = [{ url: source.url, label: source.name }];
  const linked = isListingLike
    ? diffResult.added[0]?.href || diffResult.updated[0]?.after?.href
    : '';
  if (linked && linked !== source.url) {
    evidence.push({ url: linked, label: 'Notice link' });
  }
  return evidence;
}

async function persistAndNotifyChange({
  source,
  now,
  isListingLike,
  diffResult,
  material,
  analysisData,
  options,
}) {
  const changeDoc = await Change.create({
    sourceId: source._id,
    detectedAt: now,
    kind: analysisData.kind || material.kind,
    impact: analysisData.impact || material.impact,
    before: analysisData.before,
    after: analysisData.after,
    evidence: buildEvidence(source, isListingLike, diffResult),
    trust: resolveTrustTag({ source }),
    analysis: {
      why: analysisData.whyItMatters ?? analysisData.why ?? '',
      checklist: analysisData.checklist || [],
      dates: analysisData.dates || [],
    },
    confidence: analysisData.confidence ?? 0.6,
  });

  await persistFollowersDataForChange({ change: changeDoc, source });

  if (!options.skipPush) {
    try {
      await dispatchChangeNotifications({
        change: changeDoc,
        source,
        now,
        expoClient: options.expoClient,
      });
    } catch {
      // Non-fatal: push failure should not roll back persisted change
    }
  }

  if (options.onChangePersisted) {
    await options.onChangePersisted({ change: changeDoc, source });
  }

  return changeDoc;
}

async function recordSourceFailure(source, now, err) {
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

function analyzeFetchedSource(analysisContext, options) {
  if (options.analyzeChange) {
    return options.analyzeChange(analysisContext);
  }
  return analyzeChangeWithRouter(analysisContext, {
    router: options.aiRouter,
    skipCache: options.skipAiCache,
  });
}

async function processDetectedDiff(
  source,
  fetched,
  prevSnapshot,
  { now, nextDueAt, options, pdfExtractFn },
) {
  const sourceId = String(source._id);
  const isListingLike = source.type === 'listing' || source.type === 'rss';
  const diffResult = isListingLike
    ? diffListings(prevSnapshot.items || [], fetched.items || [])
    : diffPages(prevSnapshot, fetched);

  if (!diffResult.changed) {
    await markSourceSuccess(source._id, now, nextDueAt, fetched);
    return { sourceId, status: 'unchanged', changeCreated: false };
  }

  const pdfSupplement = await loadPdfSupplement({
    isListingLike,
    diffResult,
    options,
    pdfExtractFn,
  });
  const beforeText = prevSnapshot.textExcerpt || '';
  const afterText = isListingLike
    ? `${fetched.textExcerpt || ''}\n${pdfSupplement}`.trim()
    : fetched.text || fetched.textExcerpt || '';

  const beforeSignals = extractSignals(beforeText);
  const afterSignals = extractSignals(afterText);
  const material = evaluateMateriality({ diffResult, beforeSignals, afterSignals });

  await saveSnapshotAndPrune(source._id, now, fetched);
  await markSourceSuccess(source._id, now, nextDueAt, fetched, true);

  if (!material.material) {
    return { sourceId, status: 'filtered_noise', changeCreated: false };
  }

  const analysisData = await analyzeFetchedSource(
    {
      source,
      diffResult,
      material,
      beforeSignals,
      afterSignals,
      beforeText,
      afterText,
      pdfSupplement,
    },
    options,
  );
  const changeDoc = await persistAndNotifyChange({
    source,
    now,
    isListingLike,
    diffResult,
    material,
    analysisData,
    options,
  });

  return {
    sourceId,
    status: 'changed',
    changeCreated: true,
    changeId: String(changeDoc._id),
  };
}

async function handleFetchedSource(source, fetched, { now, options, pdfExtractFn }) {
  const sourceId = String(source._id);
  const nextDueAt = computeNextDueAt(source.intervalMin, now, options.jitterMs);

  if (fetched.notModified) {
    await markSourceSuccess(source._id, now, nextDueAt, fetched);
    return { sourceId, status: 'not_modified', changeCreated: false };
  }

  if (fetched.unsupported) {
    await Source.updateOne(
      { _id: source._id },
      { $set: { unsupported: true, lastFetchedAt: now, failures: 0, circuitOpenUntil: null } },
    );
    return { sourceId, status: 'unsupported', changeCreated: false };
  }

  const prevSnapshot = await Snapshot.findOne({ sourceId: source._id })
    .sort({ takenAt: -1 })
    .lean();

  if (!prevSnapshot) {
    await saveSnapshotAndPrune(source._id, now, fetched);
    await markSourceSuccess(source._id, now, nextDueAt, fetched, true);
    return { sourceId, status: 'baseline_saved', changeCreated: false };
  }

  return processDetectedDiff(source, fetched, prevSnapshot, {
    now,
    nextDueAt,
    options,
    pdfExtractFn,
  });
}

// --- Single-source monitoring pipeline and tick runner ---

/**
 * Runs the full fetch -> diff -> materiality -> AI -> change/push pipeline for one source.
 * Updates source health, next due timestamp with jitter, and circuit-breaker counters.
 *
 * @param {object} source - Due `Source` document.
 * @param {object} [options] - Dependency injections and flags for deterministic testing.
 * @returns {Promise<{ sourceId: string, status: string, changeCreated: boolean, changeId?: string, error?: string }>} Execution status.
 */
export async function processSource(source, options = {}) {
  const now = options.now ?? new Date();
  const fetchFn = options.fetchSource ?? fetchBySourceType;
  const pdfExtractFn = options.extractPdf ?? fetchAndExtractPdf;

  try {
    const fetched = await fetchFn(source, options.fetchOptions || {});
    return await handleFetchedSource(source, fetched, { now, options, pdfExtractFn });
  } catch (err) {
    return recordSourceFailure(source, now, err);
  }
}

/**
 * Executes one locked scheduler tick across due sources and checks Expo push receipts.
 *
 * @param {object} [options] - Batch limit, clock override, lock TTL, and test hooks.
 * @returns {Promise<{ status: string, processed: number, changesCreated: number, results: Array<object> }>} Tick report.
 */
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

    if (!options.skipPush && !options.skipReceipts) {
      try {
        await processPushReceipts(options.expoClient);
      } catch {
        // Non-fatal receipt check
      }
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
