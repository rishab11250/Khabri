/**
 * Validates subscription creation (`sourceId` or `searchQuery` required) and strict watch updates.
 */
import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

// Body schema for POST /v1/watches requiring at least a catalog/link `sourceId` or `searchQuery`.
export const createWatchSchema = z
  .object({
    sourceId: objectIdString.optional(),
    searchQuery: z.string().trim().min(3).max(160).optional(),
    title: z.string().trim().min(1).max(120).optional(),
    category: z
      .enum(['exam', 'recruitment', 'scholarship', 'scheme', 'university'])
      .default('exam'),
    priority: z.enum(['normal', 'instant']).default('normal'),
    createdVia: z
      .enum(['catalog', 'link', 'photo', 'trending', 'circle', 'search'])
      .default('catalog'),
    focusTerms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .refine((v) => Boolean(v.sourceId || v.searchQuery), {
    message: 'Either sourceId or searchQuery is required',
  });

// Strict body schema for PATCH /v1/watches/:id.
export const patchWatchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    priority: z.enum(['normal', 'instant']).optional(),
    muted: z.boolean().optional(),
    focusTerms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  })
  .strict();
