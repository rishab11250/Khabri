import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { dispatchChangeNotifications } from '../src/engine/dispatcher.js';
import {
  Change,
  Circle,
  Device,
  Notification,
  Quota,
  Source,
  User,
  Watch,
} from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub, email = 'user@example.com') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Circles and Ask Khabri', () => {
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
      Watch.deleteMany({}),
      Circle.deleteMany({}),
      Change.deleteMany({}),
      Device.deleteMany({}),
      Notification.deleteMany({}),
      Quota.deleteMany({}),
    ]);
  });

  it('creates circle, joins by code, shares watches so both members receive push, and enforces owner removal & 30-member cap', async () => {
    const ownerToken = await signTestJwt('supa-owner', 'owner@example.com');
    const memberToken = await signTestJwt('supa-member', 'member@example.com');
    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
    });

    const source = await Source.create({
      name: 'UPSC Circle Source',
      url: 'https://ssc.gov.in/circle',
      type: 'listing',
      category: 'exam',
      trust: 'official',
    });

    const createRes = await request(app)
      .post('/v1/circles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'CSE 2026 Batch' });
    expect(createRes.status).toBe(201);
    const { id: circleId, inviteCode } = createRes.body.data.circle;
    expect(inviteCode).toHaveLength(6);

    const joinRes = await request(app)
      .post('/v1/circles/join')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ inviteCode });
    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.circle.memberCount).toBe(2);

    const addWatchRes = await request(app)
      .post(`/v1/circles/${circleId}/watches`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ sourceId: String(source._id) });
    expect(addWatchRes.status).toBe(200);
    expect(addWatchRes.body.data.subscribedMembers).toBe(2);

    // Register push tokens for both users and verify dispatch notifies both
    await request(app)
      .post('/v1/devices')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expoPushToken: 'ExponentPushToken[owner1]', platform: 'android' });
    await request(app)
      .post('/v1/devices')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ expoPushToken: 'ExponentPushToken[member1]', platform: 'android' });

    const sendPushNotificationsAsync = vi.fn(async (msgs) =>
      msgs.map((_m, i) => ({ status: 'ok', id: `t-${i}` })),
    );
    const change = await Change.create({
      sourceId: source._id,
      kind: 'new_notice',
      impact: 'HIGH',
      before: 'Prev',
      after: 'Admit card out',
      trust: 'official',
    });
    const pushed = await dispatchChangeNotifications({
      change,
      source,
      expoClient: {
        chunkPushNotifications: (m) => [m],
        sendPushNotificationsAsync,
      },
    });
    expect(pushed.sent).toBe(2);

    const detailRes = await request(app)
      .get(`/v1/circles/${circleId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    const memberObj = detailRes.body.data.circle.members.find((m) => m.role === 'member');

    // Non-owner cannot remove member
    const forbiddenDel = await request(app)
      .delete(`/v1/circles/${circleId}/members/${memberObj.userId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(forbiddenDel.status).toBe(403);

    // Owner removes member
    const ownerDel = await request(app)
      .delete(`/v1/circles/${circleId}/members/${memberObj.userId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(ownerDel.status).toBe(200);
    expect(ownerDel.body.data.memberCount).toBe(1);

    // 30-member cap enforced
    const fakeUsers = await User.insertMany(
      Array.from({ length: 29 }, (_, i) => ({ supabaseId: `supa-cap-${i}` })),
    );
    await Circle.updateOne(
      { _id: circleId },
      { $push: { members: { $each: fakeUsers.map((u) => ({ userId: u._id, role: 'member' })) } } },
    );
    const extraToken = await signTestJwt('supa-extra');
    const fullRes = await request(app)
      .post('/v1/circles/join')
      .set('Authorization', `Bearer ${extraToken}`)
      .send({ inviteCode });
    expect(fullRes.status).toBe(400);
    expect(fullRes.body.error.code).toBe('CIRCLE_FULL');
  });

  it('answers grounded Ask Khabri questions with citations and enforces 10/day cap', async () => {
    const token = await signTestJwt('supa-ask-1');
    const generateJson = vi.fn(async () => ({
      result: {
        found: true,
        answer: 'SSC extended the deadline to 28 Dec 2026.',
        citedChangeIds: [String(change._id), 'nonexistent-id'],
      },
    }));

    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
      askOptions: { aiRouter: { generateJson } },
    });

    const meRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.user.id;
    const source = await Source.create({
      name: 'SSC Notices',
      url: 'https://ssc.gov.in/',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
    });
    await Watch.create({ userId, sourceId: source._id, title: 'SSC', createdVia: 'catalog' });
    const change = await Change.create({
      sourceId: source._id,
      kind: 'date_change',
      impact: 'HIGH',
      before: '15 Dec 2026',
      after: '28 Dec 2026',
      trust: 'official',
    });

    const ask1 = await request(app)
      .post('/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'all', question: 'What changed this week?' });
    expect(ask1.status).toBe(200);
    expect(ask1.body.data.found).toBe(true);
    expect(ask1.body.data.citations).toHaveLength(1);
    expect(ask1.body.data.citations[0].changeId).toBe(String(change._id));

    for (let i = 1; i < 10; i += 1) {
      const r = await request(app)
        .post('/v1/ask')
        .set('Authorization', `Bearer ${token}`)
        .send({ scope: 'all', question: `Question ${i}` });
      expect(r.status).toBe(200);
    }

    const capped = await request(app)
      .post('/v1/ask')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'all', question: 'Over limit' });
    expect(capped.status).toBe(429);
    expect(capped.body.error.code).toBe('ASK_QUOTA_EXCEEDED');
  });
});
