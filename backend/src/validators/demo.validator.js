import { z } from 'zod';

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
