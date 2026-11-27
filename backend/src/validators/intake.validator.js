import { z } from 'zod';

export const linkIntakeSchema = z.object({
  url: z.string().trim().url('Valid http/https URL required'),
  category: z.enum(['exam', 'recruitment', 'scholarship', 'scheme', 'university']).default('exam'),
  state: z.string().trim().min(1).max(60).default('All India'),
  title: z.string().trim().min(1).max(120).optional(),
});

export const photoExtractSchema = z.object({
  organization: z.string().trim().max(120).default(''),
  examOrScheme: z.string().trim().max(160).default(''),
  dates: z.array(z.string().trim().max(60)).max(5).default([]),
  url: z.string().trim().max(240).optional().nullable(),
  query: z.string().trim().max(160).default(''),
});

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
