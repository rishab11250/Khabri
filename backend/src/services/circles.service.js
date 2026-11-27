import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../middleware/envelope.js';
import { Circle, Source, User, Watch } from '../models/index.js';

const MAX_CIRCLE_MEMBERS = 30;
const MAX_WATCHES_PER_USER = 15;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateInviteCode(length = 6) {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function subscribeUserToSource(userId, source, circleId) {
  const existing = await Watch.findOne({ userId, sourceId: source._id }).lean();
  if (existing) return false;
  const count = await Watch.countDocuments({ userId });
  if (count >= MAX_WATCHES_PER_USER) return false;

  await Watch.create({
    userId,
    sourceId: source._id,
    title: source.name,
    createdVia: 'circle',
    circleId,
  });
  await Source.updateOne({ _id: source._id }, { $inc: { followerCount: 1 } });
  return true;
}

function formatCircleSummary(circle, currentUserId) {
  const myMember = (circle.members || []).find((m) => String(m.userId) === String(currentUserId));
  return {
    id: String(circle._id),
    name: circle.name,
    inviteCode: circle.inviteCode,
    role: myMember?.role ?? 'member',
    memberCount: (circle.members || []).length,
    watchCount: (circle.watchIds || []).length,
  };
}

export async function listUserCircles(userId) {
  const circles = await Circle.find({ 'members.userId': userId }).sort({ createdAt: -1 }).lean();
  return circles.map((c) => formatCircleSummary(c, userId));
}

export async function createCircle(userId, name) {
  let inviteCode = generateInviteCode(6);
  while (await Circle.exists({ inviteCode })) {
    inviteCode = generateInviteCode(6);
  }

  const circle = await Circle.create({
    ownerId: userId,
    name,
    inviteCode,
    members: [{ userId, role: 'owner' }],
    watchIds: [],
  });

  return formatCircleSummary(circle, userId);
}

export async function joinCircle(userId, inviteCode) {
  const code = inviteCode.toUpperCase();
  const circle = await Circle.findOne({ inviteCode: code });
  if (!circle) {
    throw new AppError(404, 'CIRCLE_NOT_FOUND', 'Invite code not found');
  }

  const alreadyMember = circle.members.some((m) => String(m.userId) === String(userId));
  if (!alreadyMember) {
    if (circle.members.length >= MAX_CIRCLE_MEMBERS) {
      throw new AppError(
        400,
        'CIRCLE_FULL',
        `Circle has reached the ${MAX_CIRCLE_MEMBERS}-member limit`,
      );
    }
    circle.members.push({ userId, role: 'member' });
    await circle.save();
  }

  if (circle.watchIds.length > 0) {
    const sources = await Source.find({ _id: { $in: circle.watchIds } }).lean();
    for (const src of sources) {
      await subscribeUserToSource(userId, src, circle._id);
    }
  }

  return formatCircleSummary(circle, userId);
}

export async function getCircleDetail(userId, circleId) {
  if (!mongoose.Types.ObjectId.isValid(circleId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid circle id');
  }

  const circle = await Circle.findOne({
    _id: circleId,
    'members.userId': userId,
  }).lean();
  if (!circle) {
    throw new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found');
  }

  const memberIds = circle.members.map((m) => m.userId);
  const [users, sources] = await Promise.all([
    User.find({ _id: { $in: memberIds } })
      .select('name email')
      .lean(),
    circle.watchIds?.length
      ? Source.find({ _id: { $in: circle.watchIds } })
          .select('name url category state trust')
          .lean()
      : [],
  ]);
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return {
    ...formatCircleSummary(circle, userId),
    members: circle.members.map((m) => {
      const u = userMap.get(String(m.userId));
      return {
        userId: String(m.userId),
        role: m.role,
        name: u?.name || u?.email || 'Member',
        email: u?.email ?? null,
      };
    }),
    watches: sources.map((s) => ({
      id: String(s._id),
      name: s.name,
      url: s.url,
      category: s.category,
      state: s.state,
      trust: s.trust,
    })),
  };
}

export async function addWatchToCircle(userId, circleId, sourceId) {
  if (!mongoose.Types.ObjectId.isValid(circleId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid circle id');
  }

  const circle = await Circle.findOne({
    _id: circleId,
    'members.userId': userId,
  });
  if (!circle) {
    throw new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found');
  }

  const source = await Source.findById(sourceId).lean();
  if (!source) {
    throw new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found');
  }

  if (!circle.watchIds.some((w) => String(w) === String(source._id))) {
    circle.watchIds.push(source._id);
    await circle.save();
  }

  let subscribed = 0;
  for (const member of circle.members) {
    const added = await subscribeUserToSource(member.userId, source, circle._id);
    if (added) subscribed += 1;
  }

  return {
    circle: formatCircleSummary(circle, userId),
    subscribedMembers: subscribed,
  };
}

export async function removeMemberFromCircle(userId, circleId, targetUserId) {
  if (
    !mongoose.Types.ObjectId.isValid(circleId) ||
    !mongoose.Types.ObjectId.isValid(targetUserId)
  ) {
    throw new AppError(400, 'INVALID_ID', 'Invalid identifier');
  }

  const circle = await Circle.findById(circleId);
  if (!circle) {
    throw new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found');
  }

  if (String(circle.ownerId) !== String(userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Only circle owner can remove members');
  }

  if (String(circle.ownerId) === String(targetUserId)) {
    throw new AppError(400, 'CANNOT_REMOVE_OWNER', 'Circle owner cannot be removed');
  }

  const beforeLen = circle.members.length;
  circle.members = circle.members.filter((m) => String(m.userId) !== String(targetUserId));
  if (circle.members.length === beforeLen) {
    throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found in circle');
  }

  await circle.save();
  return { removed: true, memberCount: circle.members.length };
}
