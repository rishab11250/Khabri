import { ok } from '../middleware/envelope.js';
import {
  addWatchToCircle,
  createCircle,
  getCircleDetail,
  joinCircle,
  listUserCircles,
  removeMemberFromCircle,
} from '../services/circles.service.js';

export async function getCircles(req, res) {
  const circles = await listUserCircles(req.user._id);
  return ok(res, { circles });
}

export async function postCircle(req, res) {
  const circle = await createCircle(req.user._id, req.body.name);
  return ok(res, { circle }, 201);
}

export async function postJoinCircle(req, res) {
  const circle = await joinCircle(req.user._id, req.body.inviteCode);
  return ok(res, { circle });
}

export async function getCircle(req, res) {
  const circle = await getCircleDetail(req.user._id, req.params.id);
  return ok(res, { circle });
}

export async function postCircleWatch(req, res) {
  const data = await addWatchToCircle(req.user._id, req.params.id, req.body.sourceId);
  return ok(res, data);
}

export async function deleteCircleMember(req, res) {
  const data = await removeMemberFromCircle(req.user._id, req.params.id, req.params.userId);
  return ok(res, data);
}
