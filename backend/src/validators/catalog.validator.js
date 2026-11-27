import { z } from 'zod';

export const catalogQuerySchema = z.object({
  category: z.enum(['exam', 'recruitment', 'scholarship', 'scheme', 'university']).optional(),
  state: z.string().trim().min(1).max(60).optional(),
  q: z.string().trim().max(100).optional(),
});
