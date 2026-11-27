import { z } from 'zod';

export const translateBodySchema = z.object({
  lang: z.enum(['en', 'hi', 'gu']),
});

export const translateOutputSchema = z.object({
  why: z.string().trim().min(1).max(800),
  checklist: z.array(z.string().trim().min(1).max(200)).max(6),
});

export const TRANSLATE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    why: { type: 'string' },
    checklist: { type: 'array', items: { type: 'string' } },
  },
  required: ['why', 'checklist'],
};

export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.preprocess((v) => (v ? Number(v) : 20), z.number().int().min(1).max(50)),
});
