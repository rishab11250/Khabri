import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { resetDemoNotices } from '../src/demo/demoStore.js';
import { parseListingHtml } from '../src/engine/fetchers/listing.js';
import {
  acquireJobLock,
  processSource,
  releaseJobLock,
  runTick,
  selectDueSources,
} from '../src/engine/scheduler.js';
import { Change, Deadline, JobLock, Snapshot, Source, User } from '../src/models/index.js';

describe('scheduler, circuit breaker, snapshot retention, and tick idempotency', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
  });

  afterAll(async () => {
    await disconnectDb();
    if (mongo) {
      await mongo.stop();
    }
  });

  beforeEach(async () => {
    await Promise.all([
      Source.deleteMany({}),
      Snapshot.deleteMany({}),
      Change.deleteMany({}),
      Deadline.deleteMany({}),
      JobLock.deleteMany({}),
      User.deleteMany({}),
    ]);
    resetDemoNotices();
  });

  it('orders due sources by nearest deadline then followerCount and opens circuit after 5 failures', async () => {
    const now = new Date('2026-11-25T10:00:00Z');
    const user = await User.create({ supabaseId: 'supa-sched' });

    await Source.create({
      name: 'Popular Portal',
      url: 'https://popular.gov.in',
      type: 'listing',
      category: 'recruitment',
      followerCount: 50,
      nextDueAt: new Date(now.getTime() - 1000),
    });

    const urgent = await Source.create({
      name: 'Urgent Exam',
      url: 'https://urgent.gov.in',
      type: 'listing',
      category: 'exam',
      followerCount: 2,
      nextDueAt: new Date(now.getTime() - 1000),
    });

    await Deadline.create({
      userId: user._id,
      sourceId: urgent._id,
      label: 'Exam closes',
      dueAt: new Date(now.getTime() + 2 * 86400_000),
      status: 'active',
    });

    const due = await selectDueSources({ now });
    expect(due.map((s) => s.name)).toEqual(['Urgent Exam', 'Popular Portal']);

    // Simulate 5 consecutive failures on Urgent Exam
    let current = urgent;
    for (let i = 0; i < 5; i += 1) {
      await processSource(current, {
        now,
        fetchSource: async () => {
          throw new Error('Upstream 503');
        },
      });
      current = await Source.findById(urgent._id).lean();
    }

    expect(current.failures).toBe(5);
    expect(current.circuitOpenUntil).toBeTruthy();
    expect(new Date(current.circuitOpenUntil).getTime()).toBe(now.getTime() + 6 * 3600_000);

    const dueAfterCircuit = await selectDueSources({ now: new Date(now.getTime() + 1000) });
    expect(dueAfterCircuit.map((s) => s.name)).toEqual(['Popular Portal']);
  });

  it('retains only the latest 10 snapshots per source', async () => {
    const source = await Source.create({
      name: 'Retention Test',
      url: 'https://retain.gov.in',
      type: 'page',
      category: 'scheme',
      followerCount: 1,
    });

    for (let i = 1; i <= 12; i += 1) {
      await processSource(source, {
        now: new Date(Date.UTC(2026, 10, i)),
        jitterMs: 0,
        fetchSource: async () => ({
          notModified: false,
          unsupported: false,
          contentHash: `hash-${i}`,
          text: `Version ${i} application deadline extended to ${i + 10} December 2026 with new guidelines.`,
          textExcerpt: `Version ${i} application deadline extended to ${i + 10} December 2026.`,
          items: [],
        }),
      });
    }

    const total = await Snapshot.countDocuments({ sourceId: source._id });
    expect(total).toBe(10);
  });

  it('detects a changed Demo Board item once even when /internal/tick is called twice, and blocks concurrent lock', async () => {
    const demoSource = await Source.create({
      name: 'Khabri Demo Notice Board',
      url: 'http://localhost:4000/demo/board',
      type: 'listing',
      category: 'exam',
      trust: 'official',
      isDemo: true,
      followerCount: 1,
      intervalMin: 15,
      nextDueAt: new Date(Date.now() - 60_000),
    });

    const app = createApp({
      tickSecret: 'tick-secret-test',
      demoMode: true,
      tickOptions: {
        jitterMs: 0,
        skipPdf: true,
        fetchSource: async () => {
          const res = await request(app).get('/demo/board');
          return {
            notModified: false,
            unsupported: false,
            ...parseListingHtml(res.text, 'http://localhost:4000/demo/board'),
          };
        },
      },
    });

    // 1. Baseline tick saves initial snapshot with 0 changes
    const firstTick = await request(app)
      .post('/internal/tick')
      .set('x-tick-secret', 'tick-secret-test');
    expect(firstTick.status).toBe(200);
    expect(firstTick.body.data.changesCreated).toBe(0);

    // 2. Edit Demo Board date and advance due time
    await request(app).post('/demo/board').send({
      action: 'update',
      id: 'demo-1',
      dateText: '28 Dec 2026',
    });
    await Source.updateOne(
      { _id: demoSource._id },
      { $set: { nextDueAt: new Date(Date.now() - 1000) } },
    );

    // 3. Call /internal/tick twice sequentially
    const tickA = await request(app)
      .post('/internal/tick')
      .set('x-tick-secret', 'tick-secret-test');
    const tickB = await request(app)
      .post('/internal/tick')
      .set('x-tick-secret', 'tick-secret-test');

    expect(tickA.body.data.changesCreated).toBe(1);
    expect(tickB.body.data.changesCreated).toBe(0);
    expect(await Change.countDocuments({ sourceId: demoSource._id })).toBe(1);

    // 4. Concurrent JobLock test: held lock causes runTick to return status: 'locked'
    const locked = await acquireJobLock('tick', 60_000);
    expect(locked).toBe(true);
    const lockedTick = await runTick();
    expect(lockedTick.status).toBe('locked');
    expect(lockedTick.processed).toBe(0);
    await releaseJobLock('tick');
  });
});
