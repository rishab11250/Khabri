import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { persistFollowersDataForChange } from '../src/engine/deadlines.js';
import { Change, ChecklistItem, Deadline, Source, User, Watch } from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub = 'supa-dl-1') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email: 'aarav@example.com', role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Deadlines CRUD and moved-date tracking', () => {
  let mongo;
  let app;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await connectDb(mongo.getUri());
    app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
    });
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
      Change.deleteMany({}),
      Deadline.deleteMany({}),
      ChecklistItem.deleteMany({}),
    ]);
  });

  it('creates, lists, updates with previousDueAt on move, and deletes deadlines', async () => {
    const token = await signTestJwt();

    const createRes = await request(app)
      .post('/v1/deadlines')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'GATE Registration', dueAt: '2026-12-10T23:59:00.000Z' });
    expect(createRes.status).toBe(201);
    const id = createRes.body.data.deadline.id;

    const patchRes = await request(app)
      .patch(`/v1/deadlines/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dueAt: '2026-12-22T23:59:00.000Z', calendarEventId: 'cal-99' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.deadline.previousDueAt.slice(0, 10)).toBe('2026-12-10');
    expect(patchRes.body.data.deadline.dueAt.slice(0, 10)).toBe('2026-12-22');
    expect(patchRes.body.data.deadline.calendarEventId).toBe('cal-99');

    const listRes = await request(app).get('/v1/deadlines').set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.deadlines).toHaveLength(1);

    const delRes = await request(app)
      .delete(`/v1/deadlines/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRes.status).toBe(200);
  });

  it('records previousDueAt when a source change moves an extracted deadline date', async () => {
    const token = await signTestJwt('supa-dl-move');
    const meRes = await request(app).get('/v1/me').set('Authorization', `Bearer ${token}`);
    const userId = meRes.body.data.user.id;

    const source = await Source.create({
      name: 'NSP Scholarships',
      url: 'https://scholarships.gov.in/',
      type: 'page',
      category: 'scholarship',
      trust: 'official',
    });
    await Watch.create({ userId, sourceId: source._id, title: 'NSP', createdVia: 'catalog' });

    const c1 = await Change.create({
      sourceId: source._id,
      kind: 'date_change',
      impact: 'HIGH',
      before: 'Old',
      after: 'Deadline 15 Dec 2026',
      trust: 'official',
      analysis: {
        why: 'Deadline set',
        checklist: ['Apply online'],
        dates: [{ label: 'Application deadline', iso: '2026-12-15', confidence: 0.9 }],
      },
    });
    await persistFollowersDataForChange({ change: c1, source });

    const c2 = await Change.create({
      sourceId: source._id,
      kind: 'date_change',
      impact: 'HIGH',
      before: '15 Dec 2026',
      after: '30 Dec 2026',
      trust: 'official',
      analysis: {
        why: 'Deadline moved',
        checklist: ['Verify documents'],
        dates: [{ label: 'Application deadline', iso: '2026-12-30', confidence: 0.95 }],
      },
    });
    await persistFollowersDataForChange({ change: c2, source });

    const listRes = await request(app).get('/v1/deadlines').set('Authorization', `Bearer ${token}`);
    expect(listRes.body.data.deadlines).toHaveLength(1);
    expect(listRes.body.data.deadlines[0].dueAt.slice(0, 10)).toBe('2026-12-30');
    expect(listRes.body.data.deadlines[0].previousDueAt.slice(0, 10)).toBe('2026-12-15');
  });
});
