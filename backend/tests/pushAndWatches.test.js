import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { dispatchChangeNotifications, processPushReceipts } from '../src/engine/dispatcher.js';
import { Change, Device, Notification, Source, User, Watch } from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub = 'supa-pw-1', email = 'meera@example.com') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email, role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Devices, Expo push dispatcher, Watch CRUD, and Feed APIs', () => {
  let mongo;
  let app;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (token) => verifySupabaseJwt(token, TEST_ENV),
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
      Device.deleteMany({}),
      Source.deleteMany({}),
      Watch.deleteMany({}),
      Change.deleteMany({}),
      Notification.deleteMany({}),
    ]);
  });

  it('registers and deletes Expo push tokens via /v1/devices', async () => {
    const token = await signTestJwt('supa-dev-1');
    const bad = await request(app)
      .post('/v1/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ expoPushToken: 'invalid-token', platform: 'android' });
    expect(bad.status).toBe(400);

    const pushToken = 'ExponentPushToken[abc123def456]';
    const okRes = await request(app)
      .post('/v1/devices')
      .set('Authorization', `Bearer ${token}`)
      .send({ expoPushToken: pushToken, platform: 'android' });
    expect(okRes.status).toBe(201);
    expect(await Device.countDocuments({ expoPushToken: pushToken })).toBe(1);

    const delRes = await request(app)
      .delete(`/v1/devices/${encodeURIComponent(pushToken)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect(await Device.countDocuments({ expoPushToken: pushToken })).toBe(0);
  });

  it('enforces Watch CRUD, 15-watch cap, followerCount, and 1h refresh cooldown', async () => {
    const token = await signTestJwt('supa-w-1');
    const sources = await Source.insertMany(
      Array.from({ length: 16 }, (_, i) => ({
        name: `Source ${i}`,
        url: `https://s${i}.gov.in`,
        type: 'listing',
        category: 'exam',
        lastFetchedAt: i === 0 ? new Date() : null,
      })),
    );

    for (let i = 0; i < 15; i += 1) {
      const res = await request(app)
        .post('/v1/watches')
        .set('Authorization', `Bearer ${token}`)
        .send({ sourceId: String(sources[i]._id) });
      expect(res.status).toBe(201);
    }

    const capRes = await request(app)
      .post('/v1/watches')
      .set('Authorization', `Bearer ${token}`)
      .send({ sourceId: String(sources[15]._id) });
    expect(capRes.status).toBe(400);
    expect(capRes.body.error.code).toBe('WATCH_LIMIT_REACHED');

    const listRes = await request(app).get('/v1/watches').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.watches).toHaveLength(15);
    const firstWatch = listRes.body.data.watches.find((w) => w.sourceId === String(sources[0]._id));

    const patchRes = await request(app)
      .patch(`/v1/watches/${firstWatch.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ muted: true, priority: 'instant' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.watch.muted).toBe(true);
    expect(patchRes.body.data.watch.priority).toBe('instant');

    const cooldownRes = await request(app)
      .post(`/v1/watches/${firstWatch.id}/refresh`)
      .set('Authorization', `Bearer ${token}`);
    expect(cooldownRes.status).toBe(429);

    const delRes = await request(app)
      .delete(`/v1/watches/${firstWatch.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
    expect((await Source.findById(sources[0]._id)).followerCount).toBe(0);
  });

  it('dispatches HIGH pushes with deep link, queues MEDIUM digest, collapses bursts, and removes dead tokens', async () => {
    const user = await User.create({
      supabaseId: 'supa-push-1',
      quietHours: { enabled: false },
    });
    const source = await Source.create({
      name: 'SSC Notices',
      url: 'https://ssc.gov.in/',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
      followerCount: 1,
    });
    await Watch.create({
      userId: user._id,
      sourceId: source._id,
      title: 'SSC',
      createdVia: 'catalog',
    });
    await Device.create({
      userId: user._id,
      expoPushToken: 'ExponentPushToken[live-token]',
      platform: 'android',
    });

    const sendPushNotificationsAsync = vi.fn(async (chunk) =>
      chunk.map((_m, i) => ({ status: 'ok', id: `ticket-${i + 1}` })),
    );
    const getPushNotificationReceiptsAsync = vi.fn(async () => ({
      'ticket-1': { status: 'error', details: { error: 'DeviceNotRegistered' } },
    }));
    const mockExpo = {
      chunkPushNotifications: (msgs) => [msgs],
      sendPushNotificationsAsync,
      chunkPushNotificationReceiptIds: (ids) => [ids],
      getPushNotificationReceiptsAsync,
    };

    const now = new Date('2026-11-25T10:00:00Z');
    const high1 = await Change.create({
      sourceId: source._id,
      detectedAt: now,
      kind: 'date_change',
      impact: 'HIGH',
      before: '10 Dec',
      after: '20 Dec',
      trust: 'official',
    });

    const d1 = await dispatchChangeNotifications({
      change: high1,
      source,
      now,
      expoClient: mockExpo,
    });
    expect(d1.sent).toBe(1);
    expect(sendPushNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(sendPushNotificationsAsync.mock.calls[0][0][0].data.url).toBe(
      `khabri://change/${high1._id}`,
    );

    // Burst collapse within 10 min for same source
    const high2 = await Change.create({
      sourceId: source._id,
      detectedAt: new Date(now.getTime() + 60_000),
      kind: 'new_notice',
      impact: 'HIGH',
      before: 'Prev',
      after: 'Second notice',
      trust: 'official',
    });
    const d2 = await dispatchChangeNotifications({
      change: high2,
      source,
      now: new Date(now.getTime() + 60_000),
      expoClient: mockExpo,
    });
    expect(d2.collapsed).toBe(1);
    expect(sendPushNotificationsAsync).toHaveBeenCalledTimes(1);

    // MEDIUM goes to digest queue when watch priority is normal
    const med = await Change.create({
      sourceId: source._id,
      detectedAt: new Date(now.getTime() + 120_000),
      kind: 'clarification',
      impact: 'MEDIUM',
      before: 'A',
      after: 'B',
      trust: 'official',
    });
    const dMed = await dispatchChangeNotifications({
      change: med,
      source,
      now: new Date(now.getTime() + 120_000),
      expoClient: mockExpo,
    });
    expect(dMed.queued).toBe(1);

    // Receipt check cleans up dead device token
    const receiptRes = await processPushReceipts(mockExpo);
    expect(receiptRes.removedDevices).toBe(1);
    expect(await Device.countDocuments({ userId: user._id })).toBe(0);
  });

  it('serves cursor-paginated feed and change detail', async () => {
    const token = await signTestJwt('supa-feed-1');
    const meRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.user.id;

    const source = await Source.create({
      name: 'CUET',
      url: 'https://cuet.nta.nic.in/',
      type: 'listing',
      category: 'exam',
      trust: 'official',
    });
    await Watch.create({ userId, sourceId: source._id, title: 'CUET', createdVia: 'catalog' });

    const c1 = await Change.create({
      sourceId: source._id,
      detectedAt: new Date('2026-11-25T09:00:00Z'),
      kind: 'new_notice',
      impact: 'HIGH',
      before: 'Old',
      after: 'First card',
      trust: 'official',
    });
    await Change.create({
      sourceId: source._id,
      detectedAt: new Date('2026-11-25T10:00:00Z'),
      kind: 'new_notice',
      impact: 'MEDIUM',
      before: 'Old',
      after: 'Second card',
      trust: 'official',
    });

    const page1 = await request(app)
      .get('/v1/feed?limit=1')
      .set('Authorization', `Bearer ${token}`);
    expect(page1.status).toBe(200);
    expect(page1.body.data.items).toHaveLength(1);
    expect(page1.body.data.items[0].after).toBe('Second card');
    expect(page1.body.data.nextCursor).toBeTruthy();

    const page2 = await request(app)
      .get(`/v1/feed?limit=1&cursor=${encodeURIComponent(page1.body.data.nextCursor)}`)
      .set('Authorization', `Bearer ${token}`);
    expect(page2.body.data.items).toHaveLength(1);
    expect(page2.body.data.items[0].id).toBe(String(c1._id));

    const detail = await request(app)
      .get(`/v1/changes/${c1._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.card.source.name).toBe('CUET');
  });
});
