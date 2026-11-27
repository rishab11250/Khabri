import mongoose from 'mongoose';
import { z } from 'zod';

const objectIdString = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid ObjectId');

export const createCircleSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const joinCircleSchema = z.object({
  inviteCode: z.string().trim().min(4).max(12),
});

export const addCircleWatchSchema = z.object({
  sourceId: objectIdString,
});
