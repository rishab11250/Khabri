import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { AiCache, Change, ChecklistItem, Source, User } from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub = 'supa-tr-1') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email: 'kiran@example.com', role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Samjhao translation and Checklist toggle', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongo) await mongo.stop();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Source.deleteMany({}),
      Change.deleteMany({}),
      ChecklistItem.deleteMany({}),
      AiCache.deleteMany({}),
    ]);
  });

  it('translates explanation once per change/language, caches it, and leaves raw before/after untouched', async () => {
    const token = await signTestJwt();
    const source = await Source.create({
      name: 'SSC Notices',
      url: 'https://ssc.gov.in/',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
    });
    const change = await Change.create({
      sourceId: source._id,
      kind: 'date_change',
      impact: 'HIGH',
      before: 'Raw before 15 Dec 2026',
      after: 'Raw after 25 Dec 2026',
      trust: 'official',
      analysis: {
        why: 'Deadline extended by 10 days.',
        checklist: ['Download revised PDF', 'Submit before 25 Dec'],
        dates: [],
      },
    });

    const generateJson = vi.fn(async () => ({
      result: {
        why: 'अंतिम तिथि 10 दिन बढ़ाई गई है।',
        checklist: ['संशोधित PDF डाउनलोड करें', '25 दिसंबर से पहले जमा करें'],
      },
    }));

    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
      changesOptions: { aiRouter: { generateJson } },
    });

    const tr1 = await request(app)
      .post(`/v1/changes/${change._id}/translate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lang: 'hi' });
    expect(tr1.status).toBe(200);
    expect(tr1.body.data.why).toContain('10 दिन');
    expect(generateJson).toHaveBeenCalledTimes(1);

    // Second call uses translation stored on Change without calling AI
    const tr2 = await request(app)
      .post(`/v1/changes/${change._id}/translate`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lang: 'hi' });
    expect(tr2.status).toBe(200);
    expect(tr2.body.data.cached).toBe(true);
    expect(generateJson).toHaveBeenCalledTimes(1);

    // Raw source text stays untouched
    const updatedChange = await Change.findById(change._id).lean();
    expect(updatedChange.before).toBe('Raw before 15 Dec 2026');
    expect(updatedChange.after).toBe('Raw after 25 Dec 2026');
  });

  it('toggles checklist item done state for owning user', async () => {
    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
    });

    const token = await signTestJwt('supa-chk-1');
    const meRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.user.id;

    const item = await ChecklistItem.create({
      userId,
      changeId: '507f1f77bcf86cd799439011',
      text: 'Re-download admit card',
      done: false,
    });

    const res = await request(app)
      .patch(`/v1/checklist/${item._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ done: true });

    expect(res.status).toBe(200);
    expect(res.body.data.item.done).toBe(true);
  });
});
