import { z } from 'zod';
import { deleteSupabaseUser } from '../../config/supabase.js';
import { ok } from '../../middleware/envelope.js';
import {
  ChecklistItem,
  Circle,
  Deadline,
  Device,
  Notification,
  Source,
  User,
  Watch,
} from '../../models/index.js';

const timeHHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM 24h format');

export const updateMeSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    language: z.enum(['en', 'hi', 'gu']).optional(),
    state: z.string().trim().min(1).max(60).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    digestTime: timeHHMM.optional(),
    onboardingComplete: z.boolean().optional(),
    quietHours: z
      .object({
        enabled: z.boolean().optional(),
        start: timeHHMM.optional(),
        end: timeHHMM.optional(),
        bypassHighUrgent: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();

function formatUser(user) {
  return {
    id: String(user._id),
    supabaseId: user.supabaseId,
    email: user.email ?? null,
    name: user.name ?? '',
    language: user.language,
    state: user.state,
    interests: user.interests ?? [],
    quietHours: {
      enabled: user.quietHours?.enabled ?? true,
      start: user.quietHours?.start ?? '22:00',
      end: user.quietHours?.end ?? '07:00',
      bypassHighUrgent: user.quietHours?.bypassHighUrgent ?? false,
    },
    digestTime: user.digestTime ?? '08:00',
    onboardingComplete: Boolean(user.onboardingComplete),
    createdAt: user.createdAt,
  };
}

export async function getMe(req, res) {
  return ok(res, { user: formatUser(req.user) });
}

export async function patchMe(req, res) {
  const patch = req.body;
  const update = {};

  if (patch.name !== undefined) update.name = patch.name;
  if (patch.language !== undefined) update.language = patch.language;
  if (patch.state !== undefined) update.state = patch.state;
  if (patch.interests !== undefined) update.interests = patch.interests;
  if (patch.digestTime !== undefined) update.digestTime = patch.digestTime;
  if (patch.onboardingComplete !== undefined) update.onboardingComplete = patch.onboardingComplete;

  if (patch.quietHours) {
    for (const [key, val] of Object.entries(patch.quietHours)) {
      if (val !== undefined) {
        update[`quietHours.${key}`] = val;
      }
    }
  }

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  );

  return ok(res, { user: formatUser(updated) });
}

export function createDeleteMe(deleteAuthUser = deleteSupabaseUser) {
  return async function deleteMe(req, res) {
    const userId = req.user._id;
    const supabaseId = req.user.supabaseId;

    const watches = await Watch.find({ userId }).select('sourceId').lean();
    const sourceIds = watches.map((w) => w.sourceId);

    if (sourceIds.length > 0) {
      await Source.updateMany(
        { _id: { $in: sourceIds }, followerCount: { $gt: 0 } },
        { $inc: { followerCount: -1 } },
      );
    }

    await Promise.all([
      Watch.deleteMany({ userId }),
      Device.deleteMany({ userId }),
      Deadline.deleteMany({ userId }),
      ChecklistItem.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Circle.deleteMany({ ownerId: userId }),
      Circle.updateMany({ 'members.userId': userId }, { $pull: { members: { userId } } }),
    ]);

    await User.deleteOne({ _id: userId });

    const supabaseResult = await deleteAuthUser(supabaseId);

    return ok(res, {
      deleted: true,
      supabaseDeleted: supabaseResult.deleted,
    });
  };
}
