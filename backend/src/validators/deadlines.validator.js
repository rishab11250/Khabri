/**
 * Validates deadline listing queries, creation payloads, and strict patch updates.
 */
import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

// Query filter for GET /v1/deadlines.
export const listDeadlinesQuerySchema = z.object({
  status: z.enum(['active', 'done', 'expired']).optional(),
});

// Body schema for POST /v1/deadlines.
export const createDeadlineSchema = z.object({
  label: z.string().trim().min(1).max(120),
  dueAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid dueAt date'),
  sourceId: objectIdString.optional(),
  changeId: objectIdString.optional(),
});

// Strict body schema for PATCH /v1/deadlines/:id rejecting unknown keys.
export const patchDeadlineSchema = z
  .object({
    label: z.string().trim().min(1).max(120).optional(),
    dueAt: z
      .string()
      .refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid dueAt date')
      .optional(),
    status: z.enum(['active', 'done', 'expired']).optional(),
    calendarEventId: z.string().trim().max(120).optional(),
  })
  .strict();
