import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError, ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { ChecklistItem } from '../../models/index.js';

const patchChecklistSchema = z.object({
  done: z.boolean(),
});

export function createChecklistRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.patch('/:id', validate({ body: patchChecklistSchema }), async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError(400, 'INVALID_ID', 'Invalid checklist item id'));
    }

    const updated = await ChecklistItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { done: req.body.done } },
      { returnDocument: 'after' },
    ).lean();

    if (!updated) {
      return next(new AppError(404, 'CHECKLIST_NOT_FOUND', 'Checklist item not found'));
    }

    return ok(res, {
      item: {
        id: String(updated._id),
        changeId: String(updated.changeId),
        text: updated.text,
        done: Boolean(updated.done),
      },
    });
  });

  return router;
}
