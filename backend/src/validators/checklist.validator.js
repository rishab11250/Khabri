/**
 * Validates toggle payloads for change action checklist items.
 */
import { z } from 'zod';

// Body validation for PATCH /v1/checklist/:id.
export const patchChecklistSchema = z.object({
  done: z.boolean(),
});
