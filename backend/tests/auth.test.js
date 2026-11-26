import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { Device, Source, User, Watch } from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub = 'supa-user-1', email = 'aarav@example.com') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Auth, /v1/me, and /internal/tick', () => {
  let mongo;
  let app;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (token) => verifySupabaseJwt(token, TEST_ENV),
      deleteAuthUser: async () => ({ deleted: true }),
    });
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongo) {
      await mongo.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Source.deleteMany({}),
      Watch.deleteMany({}),
      Device.deleteMany({}),
    ]);
  });

  it('rejects unauthenticated requests to /v1/me', async () => {
    const res = await request(app).get('/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('creates user on first JWT call and updates profile on PATCH /v1/me', async () => {
    const token = await signTestJwt('supa-123', 'kiran@example.com');

    const getRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.user).toMatchObject({
      supabaseId: 'supa-123',
      email: 'kiran@example.com',
      language: 'en',
      onboardingComplete: false,
    });

    const patchRes = await request(app)
      .patch('/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Kiran',
        language: 'hi',
        state: 'Maharashtra',
        interests: ['recruitment', 'exam'],
        onboardingComplete: true,
        quietHours: { start: '23:00', bypassHighUrgent: true },
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.user).toMatchObject({
      name: 'Kiran',
      language: 'hi',
      state: 'Maharashtra',
      interests: ['recruitment', 'exam'],
      onboardingComplete: true,
      quietHours: {
        enabled: true,
        start: '23:00',
        end: '07:00',
        bypassHighUrgent: true,
      },
    });
  });

  it('rejects invalid PATCH /v1/me payload with zod details', async () => {
    const token = await signTestJwt('supa-bad');
    const res = await request(app)
      .patch('/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'fr' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('deletes user and decrements watched source followerCount on DELETE /v1/me', async () => {
    const token = await signTestJwt('supa-del', 'del@example.com');
    const meRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.user.id;

    const source = await Source.create({
      name: 'UPSC Notices',
      url: 'https://upsc.gov.in',
      type: 'listing',
      category: 'exam',
      followerCount: 1,
    });
    await Watch.create({
      userId,
      sourceId: source._id,
      title: 'UPSC',
      createdVia: 'catalog',
    });
    await Device.create({
      userId,
      expoPushToken: 'ExponentPushToken[test-1]',
      platform: 'android',
    });

    const delRes = await request(app).delete('/v1/me').set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(delRes.body.data.deleted).toBe(true);

    const updatedSource = await Source.findById(source._id);
    expect(updatedSource.followerCount).toBe(0);
    expect(await User.countDocuments({ _id: userId })).toBe(0);
    expect(await Watch.countDocuments({ userId })).toBe(0);
    expect(await Device.countDocuments({ userId })).toBe(0);
  });

  it('protects POST /internal/tick with x-tick-secret', async () => {
    const badRes = await request(app).post('/internal/tick').set('x-tick-secret', 'wrong');
    expect(badRes.status).toBe(401);

    const okRes = await request(app)
      .post('/internal/tick')
      .set('x-tick-secret', TEST_ENV.INTERNAL_TICK_SECRET);
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.status).toBe('ok');
  });
});
