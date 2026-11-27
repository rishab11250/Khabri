import { z } from 'zod';

export const digestBodySchema = z.object({
  force: z.union([z.boolean(), z.literal('true')]).optional(),
});
