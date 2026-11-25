import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Circle, Source, User, Watch } from '../../models/index.js';

const MAX_CIRCLE_MEMBERS = 30;
const MAX_WATCHES_PER_USER = 15;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(4).max(12),
});

const addCircleWatchSchema = z.object({
  sourceId: objectIdString,
});

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

export function createCirclesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.get('/', async (req, res) => {
    const circles = await Circle.find({ 'members.userId': req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, {
      circles: circles.map((c) => formatCircleSummary(c, req.user._id)),
    });
  });

  router.post('/', validate({ body: createCircleSchema }), async (req, res) => {
    let inviteCode = generateInviteCode(6);
    while (await Circle.exists({ inviteCode })) {
      inviteCode = generateInviteCode(6);
    }

    const circle = await Circle.create({
      ownerId: req.user._id,
      name: req.body.name,
      inviteCode,
      members: [{ userId: req.user._id, role: 'owner' }],
      watchIds: [],
    });

    return ok(res, { circle: formatCircleSummary(circle, req.user._id) }, 201);
  });

  router.post('/join', validate({ body: joinCircleSchema }), async (req, res, next) => {
    const code = req.body.inviteCode.toUpperCase();
    const circle = await Circle.findOne({ inviteCode: code });
    if (!circle) {
      return next(new AppError(404, 'CIRCLE_NOT_FOUND', 'Invite code not found'));
    }

    const alreadyMember = circle.members.some((m) => String(m.userId) === String(req.user._id));
    if (!alreadyMember) {
      if (circle.members.length >= MAX_CIRCLE_MEMBERS) {
        return next(
          new AppError(
            400,
            'CIRCLE_FULL',
            `Circle has reached the ${MAX_CIRCLE_MEMBERS}-member limit`,
          ),
        );
      }
      circle.members.push({ userId: req.user._id, role: 'member' });
      await circle.save();
    }

    if (circle.watchIds.length > 0) {
      const sources = await Source.find({ _id: { $in: circle.watchIds } }).lean();
      for (const src of sources) {
        await subscribeUserToSource(req.user._id, src, circle._id);
      }
    }

    return ok(res, { circle: formatCircleSummary(circle, req.user._id) });
  });

  router.get('/:id', async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid circle id'));
    }

    const circle = await Circle.findOne({
      _id: req.params.id,
      'members.userId': req.user._id,
    }).lean();
    if (!circle) {
      return next(new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found'));
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

    return ok(res, {
      circle: {
        ...formatCircleSummary(circle, req.user._id),
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
      },
    });
  });

  router.post('/:id/watches', validate({ body: addCircleWatchSchema }), async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid circle id'));
    }

    const circle = await Circle.findOne({
      _id: req.params.id,
      'members.userId': req.user._id,
    });
    if (!circle) {
      return next(new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found'));
    }

    const source = await Source.findById(req.body.sourceId).lean();
    if (!source) {
      return next(new AppError(404, 'SOURCE_NOT_FOUND', 'Source not found'));
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

    return ok(res, {
      circle: formatCircleSummary(circle, req.user._id),
      subscribedMembers: subscribed,
    });
  });

  router.delete('/:id/members/:userId', async (req, res, next) => {
    if (
      !mongoose.Types.ObjectId.isValid(req.params.id) ||
      !mongoose.Types.ObjectId.isValid(req.params.userId)
    ) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid identifier'));
    }

    const circle = await Circle.findById(req.params.id);
    if (!circle) {
      return next(new AppError(404, 'CIRCLE_NOT_FOUND', 'Circle not found'));
    }

    if (String(circle.ownerId) !== String(req.user._id)) {
      return next(new AppError(403, 'FORBIDDEN', 'Only circle owner can remove members'));
    }

    if (String(circle.ownerId) === String(req.params.userId)) {
      return next(new AppError(400, 'CANNOT_REMOVE_OWNER', 'Circle owner cannot be removed'));
    }

    const beforeLen = circle.members.length;
    circle.members = circle.members.filter((m) => String(m.userId) !== String(req.params.userId));
    if (circle.members.length === beforeLen) {
      return next(new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found in circle'));
    }

    await circle.save();
    return ok(res, { removed: true, memberCount: circle.members.length });
  });

  return router;
}
