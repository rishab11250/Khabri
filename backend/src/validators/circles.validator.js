/**
 * Validates Circle creation, invite joining, and shared watch payloads.
 */
import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

// Body schema for POST /v1/circles.
export const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

// Body schema for POST /v1/circles/join.
export const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(4).max(12),
});

// Body schema for POST /v1/circles/:id/watches.
export const addCircleWatchSchema = z.object({
  sourceId: objectIdString,
});
