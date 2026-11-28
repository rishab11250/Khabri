/**
 * Validates feed cursor pagination queries and Samjhao native translation requests/responses.
 */
import { z } from 'zod';

// Body schema for POST /v1/changes/:id/translate.
export const translateBodySchema = z.object({
  lang: z.enum(['en', 'hi', 'gu']),
});

// Runtime validation gate for AI translation responses.
export const translateOutputSchema = z.object({
  why: z.string().trim().min(1).max(800),
  checklist: z.array(z.string().trim().min(1).max(200)).max(6),
});

// Gemini JSON Schema mirror for translation responses.
export const TRANSLATE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    why: { type: 'string' },
    checklist: { type: 'array', items: { type: 'string' } },
  },
  required: ['why', 'checklist'],
};

// Query schema for GET /v1/feed (clamps limit cleanly between 1 and 50).
export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.preprocess((v) => (v ? Number(v) : 20), z.number().int().min(1).max(50)),
});
