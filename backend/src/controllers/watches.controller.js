import { ok } from '../middleware/envelope.js';
import {
  createWatch,
  deleteWatch,
  listWatches,
  refreshWatch,
  updateWatch,
} from '../services/watches.service.js';

export async function getWatches(req, res) {
  const watches = await listWatches(req.user._id);
  return ok(res, { watches });
}

export async function postWatch(req, res) {
  const watch = await createWatch(req.user._id, req.body);
  return ok(res, { watch }, 201);
}

export async function patchWatch(req, res) {
  const watch = await updateWatch(req.user._id, req.params.id, req.body);
  return ok(res, { watch });
}

export async function removeWatch(req, res) {
  const result = await deleteWatch(req.user._id, req.params.id);
  return ok(res, result);
}

export function createRefreshWatchHandler(options = {}) {
  return async function postRefreshWatch(req, res) {
    const result = await refreshWatch(req.user._id, req.params.id, options.tickOptions || {});
    return ok(res, { result });
  };
}
