import 'dotenv/config';
import { z } from 'zod';

const optionalNonEmpty = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().url().optional(),
);

const optionalInt = (fallback) =>
  z.preprocess(
    (v) => (v === undefined || v === null || String(v).trim() === '' ? fallback : Number(v)),
    z.number().int().nonnegative(),
  );

export const envSchema = z.object({
  PORT: z.preprocess(
    (v) => (v === undefined || String(v).trim() === '' ? 4000 : Number(v)),
    z.number().int().positive().max(65535),
  ),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  SUPABASE_JWT_SECRET: optionalNonEmpty,
  SUPABASE_JWKS_URL: optionalUrl,
  SERPAPI_KEY_1: optionalNonEmpty,
  SERPAPI_KEY_2: optionalNonEmpty,
  SERPAPI_MONTHLY_LIMIT_PER_KEY: optionalInt(0),
  GEMINI_API_KEY_1: optionalNonEmpty,
  GEMINI_API_KEY_2: optionalNonEmpty,
  GEMINI_MODEL: optionalNonEmpty,
  GROK_API_KEY: optionalNonEmpty,
  GROK_MODEL: optionalNonEmpty,
  AI_DAILY_LIMIT_PER_KEY: optionalInt(0),
  EXPO_ACCESS_TOKEN: optionalNonEmpty,
  INTERNAL_TICK_SECRET: z.string().min(8, 'INTERNAL_TICK_SECRET must be at least 8 characters'),
  DEMO_MODE: z.preprocess((v) => v === true || v === 'true', z.boolean().default(false)),
  CORS_ORIGIN: optionalNonEmpty,
});

export function parseEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return result.data;
}

let cachedEnv = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = parseEnv(process.env);
  }
  return cachedEnv;
}

export function resetEnvCache() {
  cachedEnv = null;
}
