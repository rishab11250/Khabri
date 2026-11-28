/**
 * Propagates detected deadline dates and action checklist items from a change to active followers.
 * Deliberately skips muted watches and records `previousDueAt` when an existing deadline shifts.
 */
import { ChecklistItem, Deadline, Watch } from '../models/index.js';

async function upsertUserDeadlines({ userId, sourceId, changeId, dates }) {
  let count = 0;

  for (const d of dates) {
    // Store deadline due times at end-of-day UTC so IST/UTC boundary math stays inclusive.
    const dueAt = new Date(`${d.iso}T23:59:00.000Z`);
    if (Number.isNaN(dueAt.getTime())) continue;

    const existing = await Deadline.findOne({
      userId,
      sourceId,
      label: d.label,
      status: 'active',
    }).lean();

    const moved =
      existing && existing.dueAt && new Date(existing.dueAt).getTime() !== dueAt.getTime();

    await Deadline.findOneAndUpdate(
      { userId, sourceId, label: d.label, status: 'active' },
      {
        $set: {
          dueAt,
          changeId,
          // Preserve previousDueAt so mobile UI can highlight rescheduled deadlines.
          ...(moved ? { previousDueAt: existing.dueAt, movedAt: new Date() } : {}),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );
    count += 1;
  }

  return count;
}

async function insertUserChecklist({ userId, changeId, checklist }) {
  if (checklist.length === 0) return 0;
  await ChecklistItem.insertMany(
    checklist.map((text) => ({
      userId,
      changeId,
      text,
      done: false,
    })),
  );
  return checklist.length;
}

/**
 * Upserts deadlines and creates per-user checklist items for non-muted watchers of `source`.
 *
 * @param {object} params - Persisted change and source records.
 * @param {object} params.change - Newly created `Change` document containing `analysis`.
 * @param {object} params.source - Source document associated with the change.
 * @returns {Promise<{ deadlinesUpserted: number, checklistCreated: number }>} Counters written.
 */
export async function persistFollowersDataForChange({ change, source }) {
  const watches = await Watch.find({ sourceId: source._id, muted: { $ne: true } })
    .select('userId')
    .lean();

  if (watches.length === 0) {
    return { deadlinesUpserted: 0, checklistCreated: 0 };
  }

  const userIds = [...new Set(watches.map((w) => String(w.userId)))];
  let deadlinesUpserted = 0;
  let checklistCreated = 0;

  const dates = change.analysis?.dates || [];
  const checklist = change.analysis?.checklist || [];

  for (const userId of userIds) {
    deadlinesUpserted += await upsertUserDeadlines({
      userId,
      sourceId: source._id,
      changeId: change._id,
      dates,
    });
    checklistCreated += await insertUserChecklist({
      userId,
      changeId: change._id,
      checklist,
    });
  }

  return { deadlinesUpserted, checklistCreated };
}
