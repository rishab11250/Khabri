import { describe, expect, it } from 'vitest';

import { parseEnv } from '../src/config/env.js';

describe('env validation', () => {
  it('fails fast when required variables are missing', () => {
    expect(() => parseEnv({})).toThrow(/MONGODB_URI/);
    expect(() =>
      parseEnv({
        MONGODB_URI: 'mongodb://localhost:27017/khabri',
        SUPABASE_URL: 'not-a-url',
        INTERNAL_TICK_SECRET: 'short',
      }),
    ).toThrow(/SUPABASE_URL/);
  });

  it('parses valid environment with defaults', () => {
    const parsed = parseEnv({
      MONGODB_URI: 'mongodb://localhost:27017/khabri',
      SUPABASE_URL: 'https://example.supabase.co',
      INTERNAL_TICK_SECRET: 'super-secret-tick-value',
      DEMO_MODE: 'true',
      PORT: '5001',
    });

    expect(parsed.PORT).toBe(5001);
    expect(parsed.DEMO_MODE).toBe(true);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.AI_DAILY_LIMIT_PER_KEY).toBe(0);
  });
});
