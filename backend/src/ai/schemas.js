import { z } from 'zod';

export const extractedDateSchema = z.object({
  label: z.string().trim().min(1).max(80),
  iso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date'),
  confidence: z.number().min(0).max(1),
});

export const changeAnalysisSchema = z.object({
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  kind: z.string().trim().min(1).max(60),
  before: z.string().trim().min(1).max(600),
  after: z.string().trim().min(1).max(600),
  whyItMatters: z.string().trim().min(1).max(600),
  checklist: z.array(z.string().trim().min(1).max(180)).min(2).max(5),
  dates: z.array(extractedDateSchema).max(10),
  confidence: z.number().min(0).max(1),
});

export const CHANGE_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    impact: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
    kind: { type: 'string' },
    before: { type: 'string' },
    after: { type: 'string' },
    whyItMatters: { type: 'string' },
    checklist: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 5,
    },
    dates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          iso: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['label', 'iso', 'confidence'],
      },
    },
    confidence: { type: 'number' },
  },
  required: [
    'impact',
    'kind',
    'before',
    'after',
    'whyItMatters',
    'checklist',
    'dates',
    'confidence',
  ],
};
