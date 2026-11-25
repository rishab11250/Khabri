import { Router } from 'express';
import { z } from 'zod';
import { ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Source } from '../../models/index.js';

const catalogQuerySchema = z.object({
  category: z.enum(['exam', 'recruitment', 'scholarship', 'scheme', 'university']).optional(),
  state: z.string().trim().min(1).max(60).optional(),
  q: z.string().trim().max(100).optional(),
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatSource(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    url: doc.url,
    type: doc.type,
    category: doc.category,
    state: doc.state,
    language: doc.language,
    trust: doc.trust,
    isDemo: Boolean(doc.isDemo),
    unsupported: Boolean(doc.unsupported),
    followerCount: doc.followerCount ?? 0,
    lastFetchedAt: doc.lastFetchedAt ?? null,
  };
}

export function createCatalogRouter() {
  const router = Router();

  router.get('/', validate({ query: catalogQuerySchema }), async (req, res) => {
    const { category, state, q } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (state) {
      filter.state = state;
    }
    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ name: regex }, { state: regex }, { category: regex }];
    }

    const docs = await Source.find(filter)
      .sort({ isDemo: -1, followerCount: -1, name: 1 })
      .limit(50)
      .lean();

    return ok(res, { sources: docs.map(formatSource) });
  });

  router.get('/trending', async (_req, res) => {
    const docs = await Source.find({ unsupported: { $ne: true } })
      .sort({ followerCount: -1, isDemo: -1, name: 1 })
      .limit(10)
      .lean();

    return ok(res, { sources: docs.map(formatSource) });
  });

  return router;
}
