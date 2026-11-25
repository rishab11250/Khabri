import { ChecklistItem, Deadline, Watch } from '../models/index.js';

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
    for (const d of dates) {
      const dueAt = new Date(`${d.iso}T23:59:00.000Z`);
      if (Number.isNaN(dueAt.getTime())) continue;

      await Deadline.findOneAndUpdate(
        {
          userId,
          sourceId: source._id,
          label: d.label,
          status: 'active',
        },
        {
          $set: {
            dueAt,
            changeId: change._id,
          },
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      );
      deadlinesUpserted += 1;
    }

    if (checklist.length > 0) {
      await ChecklistItem.insertMany(
        checklist.map((text) => ({
          userId,
          changeId: change._id,
          text,
          done: false,
        })),
      );
      checklistCreated += checklist.length;
    }
  }

  return { deadlinesUpserted, checklistCreated };
}
