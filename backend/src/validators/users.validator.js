import { z } from 'zod';

const timeHHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM 24h format');

export const updateMeSchema = z
  .object({
    name: z.string().trim().max(80).optional(),
    language: z.enum(['en', 'hi', 'gu']).optional(),
    state: z.string().trim().min(1).max(60).optional(),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    digestTime: timeHHMM.optional(),
    onboardingComplete: z.boolean().optional(),
    quietHours: z
      .object({
        enabled: z.boolean().optional(),
        start: timeHHMM.optional(),
        end: timeHHMM.optional(),
        bypassHighUrgent: z.boolean().optional(),
      })
      .optional(),
  })
  .strict();
