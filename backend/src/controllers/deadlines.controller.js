import { ok } from '../middleware/envelope.js';
import {
  createDeadline,
  deleteDeadline,
  listDeadlines,
  updateDeadline,
} from '../services/deadlines.service.js';

export async function getDeadlines(req, res) {
  const deadlines = await listDeadlines(req.user._id, req.query.status);
  return ok(res, { deadlines });
}

export async function postDeadline(req, res) {
  const deadline = await createDeadline(req.user._id, req.body);
  return ok(res, { deadline }, 201);
}

export async function patchDeadline(req, res) {
  const deadline = await updateDeadline(req.user._id, req.params.id, req.body);
  return ok(res, { deadline });
}

export async function removeDeadline(req, res) {
  const result = await deleteDeadline(req.user._id, req.params.id);
  return ok(res, result);
}
