import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns ok status in standard envelope', async () => {
    const app = createApp({ tickSecret: 'test-tick-secret' });
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      status: 'ok',
      service: 'khabri-api',
      db: 'disconnected',
    });
  });

  it('returns 404 envelope for unknown routes', async () => {
    const app = createApp({ tickSecret: 'test-tick-secret' });
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found: GET /does-not-exist',
        details: null,
      },
    });
  });
});
