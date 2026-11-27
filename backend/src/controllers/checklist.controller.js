import { ok } from '../middleware/envelope.js';
import { updateChecklistItem } from '../services/checklist.service.js';

export async function patchChecklistItem(req, res) {
  const item = await updateChecklistItem(req.user._id, req.params.id, req.body.done);
  return ok(res, { item });
}
