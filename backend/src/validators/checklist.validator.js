import { z } from 'zod';

export const patchChecklistSchema = z.object({
  done: z.boolean(),
});
