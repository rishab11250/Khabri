import { Router } from 'express';
import { z } from 'zod';
import { AppError, ok } from '../middleware/envelope.js';
import { validate } from '../middleware/validate.js';
import {
  addDemoNotice,
  getDemoNotices,
  renderDemoBoardHtml,
  resetDemoNotices,
  updateDemoNotice,
} from './demoStore.js';

const demoMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    title: z.string().trim().min(4).max(240),
    dateText: z.string().trim().max(60).optional(),
    href: z.string().trim().max(240).optional(),
  }),
  z.object({
    action: z.literal('update'),
    id: z.string().trim().min(1),
    title: z.string().trim().min(4).max(240).optional(),
    dateText: z.string().trim().max(60).optional(),
    href: z.string().trim().max(240).optional(),
  }),
  z.object({
    action: z.literal('reset'),
  }),
]);

export function createDemoRouter(options = {}) {
  const router = Router();
  const isDemoEnabled = () =>
    options.demoMode !== undefined ? Boolean(options.demoMode) : process.env.DEMO_MODE === 'true';

  router.get('/board', (req, res) => {
    if (req.query.format === 'json') {
      return ok(res, { notices: getDemoNotices() });
    }
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderDemoBoardHtml());
  });

  router.post('/board', validate({ body: demoMutationSchema }), (req, res, next) => {
    if (!isDemoEnabled()) {
      return next(new AppError(403, 'DEMO_DISABLED', 'Demo Notice Board mutations are disabled'));
    }

    const body = req.body;
    if (body.action === 'add') {
      const created = addDemoNotice(body);
      return ok(res, { notice: created, notices: getDemoNotices() }, 201);
    }

    if (body.action === 'update') {
      const updated = updateDemoNotice(body.id, body);
      if (!updated) {
        return next(new AppError(404, 'NOTICE_NOT_FOUND', `Demo notice ${body.id} not found`));
      }
      return ok(res, { notice: updated, notices: getDemoNotices() });
    }

    return ok(res, { notices: resetDemoNotices() });
  });

  return router;
}
