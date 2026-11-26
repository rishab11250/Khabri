import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { runDigest } from '../src/engine/digest.js';
import { dispatchChangeNotifications, isInQuietHours } from '../src/engine/dispatcher.js';
import { Change, Device, Notification, Source, User, Watch } from '../src/models/index.js';

describe('F12 Digest and Quiet Hours', () => {
  let mongoServer;
  let app;
  const tickSecret = 'test_secret_digest_12345';

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    app = createApp({
      tickSecret,
      env: {
        INTERNAL_TICK_SECRET: tickSecret,
        NODE_ENV: 'test',
        SUPABASE_URL: 'https://example.supabase.co',
        MONGODB_URI: mongoServer.getUri(),
      },
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
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

  it('evaluates isInQuietHours correctly for day and overnight windows', () => {
    expect(isInQuietHours({ enabled: false })).toBe(false);

    // 23:00 IST is in 22:00-07:00
    const lateNightUtc = new Date('2026-11-26T17:30:00.000Z'); // 23:00 IST
    expect(isInQuietHours({ enabled: true, start: '22:00', end: '07:00' }, lateNightUtc)).toBe(
      true,
    );

    // 12:00 IST is outside 22:00-07:00
    const noonUtc = new Date('2026-11-26T06:30:00.000Z'); // 12:00 IST
    expect(isInQuietHours({ enabled: true, start: '22:00', end: '07:00' }, noonUtc)).toBe(false);
  });

  it('queues notification as digest during quiet hours and bypasses when urgent deadline is within 24h', async () => {
    const user = await User.create({
      supabaseId: 'sub_quiet_user_1',
      email: 'quiet@test.com',
      name: 'Quiet User',
      language: 'en',
      quietHours: { enabled: true, start: '22:00', end: '07:00', bypassHighUrgent: true },
    });

    await Device.create({
      userId: user._id,
      expoPushToken: 'ExponentPushToken[quiet-token-1]',
      platform: 'android',
    });

    const source = await Source.create({
      name: 'UPSC Portal',
      url: 'https://upsc.gov.in',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
    });

    await Watch.create({
      userId: user._id,
      sourceId: source._id,
      title: 'UPSC Watch',
      priority: 'normal',
      createdVia: 'catalog',
    });

    // 1. HIGH impact change during quiet hours WITHOUT urgent deadline -> queued as digest
    const lateNight = new Date('2026-11-26T17:30:00.000Z'); // 23:00 IST
    const nonUrgentChange = await Change.create({
      sourceId: source._id,
      detectedAt: lateNight,
      kind: 'added',
      impact: 'HIGH',
      before: '',
      after: 'UPSC Prelims notification released',
      analysis: { why: 'Important exam', checklist: [], dates: [] },
      trust: 'official',
    });

    const fakeExpo = {
      chunkPushNotifications: (msgs) => [msgs],
      sendPushNotificationsAsync: async () => [{ status: 'ok', id: 'ticket-1' }],
    };

    const res1 = await dispatchChangeNotifications({
      change: nonUrgentChange,
      source,
      now: lateNight,
      expoClient: fakeExpo,
    });

    expect(res1.sent).toBe(0);
    expect(res1.queued).toBe(1);

    const queuedNotif = await Notification.findOne({
      userId: user._id,
      changeId: nonUrgentChange._id,
    });
    expect(queuedNotif).toBeTruthy();
    expect(queuedNotif.kind).toBe('digest');
    expect(queuedNotif.status).toBe('queued');

    // 2. HIGH impact change during quiet hours WITH urgent deadline <= 24h -> bypasses quiet hours and sends push
    const urgentIso = '2026-11-26'; // tonight 23:59 UTC, within 6.5 hours of 17:30 UTC
    const urgentChange = await Change.create({
      sourceId: source._id,
      detectedAt: lateNight,
      kind: 'updated',
      impact: 'HIGH',
      before: 'Apply by 28 Nov',
      after: 'Apply tonight',
      analysis: {
        why: 'Last day tonight',
        checklist: [],
        dates: [{ label: 'Last date', iso: urgentIso, confidence: 1 }],
      },
      trust: 'official',
    });

    const res2 = await dispatchChangeNotifications({
      change: urgentChange,
      source,
      now: lateNight,
      expoClient: fakeExpo,
    });

    expect(res2.sent).toBe(1);
    expect(res2.queued).toBe(0);
  });

  it('runs digest job, aggregates queued notices into single push per user, and responds to POST /internal/digest', async () => {
    const user = await User.create({
      supabaseId: 'sub_digest_user_2',
      email: 'digest@test.com',
      name: 'Digest User',
      language: 'hi',
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
      digestTime: '08:00',
    });

    await Device.create({
      userId: user._id,
      expoPushToken: 'ExponentPushToken[digest-token-2]',
      platform: 'android',
    });

    const source = await Source.create({
      name: 'SSC Official',
      url: 'https://ssc.gov.in',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
    });

    const changeA = await Change.create({
      sourceId: source._id,
      detectedAt: new Date(),
      kind: 'added',
      impact: 'MEDIUM',
      before: '',
      after: 'SSC CGL Tier 1 dates announced',
      trust: 'official',
    });

    const changeB = await Change.create({
      sourceId: source._id,
      detectedAt: new Date(),
      kind: 'added',
      impact: 'MEDIUM',
      before: '',
      after: 'SSC CHSL Admit cards out',
      trust: 'official',
    });

    await Notification.create([
      { userId: user._id, changeId: changeA._id, kind: 'digest', status: 'queued' },
      { userId: user._id, changeId: changeB._id, kind: 'digest', status: 'queued' },
    ]);

    const sentPushes = [];
    const fakeExpo = {
      chunkPushNotifications: (msgs) => [msgs],
      sendPushNotificationsAsync: async (chunks) => {
        sentPushes.push(...chunks);
        return chunks.map((_c) => ({ status: 'ok', id: 'ticket-digest' }));
      },
    };

    // Run digest with force: true
    const summary = await runDigest({
      expoClient: fakeExpo,
      force: true,
      now: new Date(),
    });

    expect(summary.digestsSent).toBe(1);
    expect(summary.notificationsProcessed).toBe(2);
    expect(sentPushes).toHaveLength(1);
    expect(sentPushes[0].to).toBe('ExponentPushToken[digest-token-2]');
    expect(sentPushes[0].title).toContain('दैनिक अख़बार');

    const updatedNotifs = await Notification.find({ userId: user._id });
    expect(updatedNotifs.every((n) => n.status === 'sent')).toBe(true);

    // Call POST /internal/digest endpoint with auth
    const unauth = await request(app).post('/internal/digest');
    expect(unauth.status).toBe(401);

    const res = await request(app)
      .post('/internal/digest')
      .set('x-tick-secret', tickSecret)
      .send({ force: true });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.digestsSent).toBe(0); // already processed
  });
});
