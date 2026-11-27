import { deleteSupabaseUser } from '../config/supabase.js';
import {
  ChecklistItem,
  Circle,
  Deadline,
  Device,
  Notification,
  Source,
  User,
  Watch,
} from '../models/index.js';

export function formatUser(user) {
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

export async function updateUserProfile(userId, patch) {
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
    userId,
    { $set: update },
    { returnDocument: 'after', runValidators: true },
  );

  return formatUser(updated);
}

export async function deleteUserAccount(userId, supabaseId, deleteAuthUser = deleteSupabaseUser) {
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

  const supabaseDeletion = await deleteAuthUser(supabaseId);

  return {
    deleted: true,
    supabaseDeleted: supabaseDeletion.deleted,
  };
}
