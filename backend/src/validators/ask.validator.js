import mongoose from 'mongoose';
import { z } from 'zod';

export const askBodySchema = z.object({
  scope: z
    .string()
    .trim()
    .refine((v) => v === 'all' || mongoose.Types.ObjectId.isValid(v), 'Invalid scope'),
  question: z.string().trim().min(2).max(400),
});

export const askOutputSchema = z.object({
  answer: z.string().trim().min(1).max(1200),
  citedChangeIds: z.array(z.string()).max(10).default([]),
  found: z.boolean(),
});

export const ASK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    citedChangeIds: { type: 'array', items: { type: 'string' } },
    found: { type: 'boolean' },
  },
  required: ['answer', 'citedChangeIds', 'found'],
};
