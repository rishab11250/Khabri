/**
 * Validates link-probe intake requests and Gemini Vision photo-extraction JSON outputs.
 */
import { z } from 'zod';

// Body schema for POST /v1/watches/from-link.
export const linkIntakeSchema = z.object({
  url: z.string().trim().url('Valid http/https URL required'),
  category: z.enum(['exam', 'recruitment', 'scholarship', 'scheme', 'university']).default('exam'),
  state: z.string().trim().min(1).max(60).default('All India'),
  title: z.string().trim().min(1).max(120).optional(),
});

// Runtime validation gate for Gemini Vision photo scan extractions.
export const photoExtractSchema = z.object({
  organization: z.string().trim().max(120).default(''),
  examOrScheme: z.string().trim().max(160).default(''),
  dates: z.array(z.string().trim().max(60)).max(5).default([]),
  url: z.string().trim().max(240).optional().nullable(),
  query: z.string().trim().max(160).default(''),
});

// Gemini JSON Schema mirror passed to `router.vision` for notice photos.
export const PHOTO_VISION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    organization: { type: 'string' },
    examOrScheme: { type: 'string' },
    dates: { type: 'array', items: { type: 'string' } },
    url: { type: 'string' },
    query: { type: 'string' },
  },
  required: ['organization', 'examOrScheme', 'dates', 'query'],
};
