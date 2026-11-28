/**
 * Validates discriminated `add`, `update`, and `reset` actions for the Demo Notice Board.
 */
import { z } from 'zod';

// Body schema for POST /demo/board/mutate.
export const demoMutationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add'),
    title: z.string().trim().min(4).max(240),
    dateText: z.string().trim().max(60).optional(),
    href: z.string().trim().max(240).optional(),
  }),
  z.object({
    action: z.literal('update'),
    id: z.string().trim().min(1),
    title: z.string().trim().min(4).max(240).optional(),
    dateText: z.string().trim().max(60).optional(),
    href: z.string().trim().max(240).optional(),
  }),
  z.object({
    action: z.literal('reset'),
  }),
]);
