/**
 * Formats user profiles, updates user preferences, and cascades full account deletion.
 * Deliberately decrements `Source.followerCount` and strips circle memberships before deleting the user.
 */
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

function formatQuietHours(quietHours) {
  return {
    enabled: quietHours?.enabled ?? true,
    start: quietHours?.start ?? '22:00',
    end: quietHours?.end ?? '07:00',
    bypassHighUrgent: quietHours?.bypassHighUrgent ?? false,
  };
}

/**
 * Serializes a Mongoose `User` record into the API response shape with safe defaults.
 *
 * @param {object} user - Hydrated or lean `User` document.
 * @returns {object} Public user profile object.
 */
export function formatUser(user) {
  return {
    id: String(user._id),
    supabaseId: user.supabaseId,
    email: user.email ?? null,
    name: user.name ?? '',
    language: user.language,
    state: user.state,
    interests: user.interests ?? [],
    quietHours: formatQuietHours(user.quietHours),
    digestTime: user.digestTime ?? '08:00',
    onboardingComplete: Boolean(user.onboardingComplete),
    createdAt: user.createdAt,
  };
}

/**
 * Applies partial profile, onboarding, language, digest, and quiet-hours updates for `userId`.
 *
 * @param {string|object} userId - Authenticated user ID.
 * @param {object} patch - Validated profile update fields.
 * @returns {Promise<object>} Updated formatted user profile.
 */
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

/**
 * Permanently deletes a user's MongoDB data, decrements followed source counts, and deletes Supabase auth user.
 *
 * @param {string|object} userId - Mongo user ID to purge.
 * @param {string} supabaseId - Linked Supabase Auth UUID.
 * @param {Function} [deleteAuthUser] - Auth admin delete callback (`deleteSupabaseUser` by default).
 * @returns {Promise<{ deleted: true, supabaseDeleted: boolean }>} Deletion confirmation.
 */
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
