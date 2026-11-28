import { SignJWT } from 'jose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { verifySupabaseJwt } from '../src/config/supabase.js';
import { searchSerpApi } from '../src/integrations/serpapi.js';
import { Quota, SearchCache, Source, User, Watch } from '../src/models/index.js';

const TEST_ENV = {
  PORT: 4000,
  NODE_ENV: 'test',
  MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_JWT_SECRET: 'unit-test-supabase-jwt-secret-32-chars',
  INTERNAL_TICK_SECRET: 'unit-test-tick-secret',
};

async function signTestJwt(sub = 'supa-intake-1') {
  const secret = new TextEncoder().encode(TEST_ENV.SUPABASE_JWT_SECRET);
  return new SignJWT({ email: 'kiran@example.com', role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('Intake (link & photo) and SerpAPI quota guard', () => {
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
      User.deleteMany({}),
      Source.deleteMany({}),
      Watch.deleteMany({}),
      Quota.deleteMany({}),
      SearchCache.deleteMany({}),
    ]);
  });

  it('enforces SerpAPI 90% failover, 95% hard stop, and 6h SearchCache', async () => {
    const httpClient = {
      get: vi.fn(async () => ({
        data: {
          organic_results: [
            { title: 'SSC Notice', link: 'https://ssc.gov.in/', snippet: 'Official' },
          ],
        },
      })),
    };

    const opts = {
      key1: 'k1',
      key2: 'k2',
      monthlyLimitPerKey: 10, // total 20 -> 90% of k1 = 9, 95% total = 19
      httpClient,
      now: new Date('2026-11-25T10:00:00Z'),
    };

    for (let i = 0; i < 9; i += 1) {
      const r = await searchSerpApi(`query ${i}`, opts);
      expect(r.stopped).toBe(false);
      expect(r.keyAlias).toBe('serpapi_1');
    }

    // 10th unique query crosses 90% of key 1 -> moves to key 2
    const r10 = await searchSerpApi('query 10', opts);
    expect(r10.keyAlias).toBe('serpapi_2');

    // Cached query spends zero quota
    const cached = await searchSerpApi('query 10', opts);
    expect(cached.cached).toBe(true);
    expect(httpClient.get).toHaveBeenCalledTimes(10);

    // Exhaust up to 19 (95% of 20)
    for (let i = 11; i < 20; i += 1) {
      await searchSerpApi(`query ${i}`, opts);
    }
    const stopped = await searchSerpApi('query over limit', opts);
    expect(stopped.stopped).toBe(true);
    expect(stopped.resetDate).toBe('2026-12-01');
  });

  it('classifies pasted link with SSRF guard and flags JS shells as unsupported', async () => {
    const token = await signTestJwt();
    const lookupFn = async () => [{ address: '93.184.216.34', family: 4 }];
    const listingHtml = `<html><head><title>Exam Board</title></head><body><ul class="notice-list">
      <li><a href="/1">Notice One</a></li><li><a href="/2">Notice Two</a></li><li><a href="/3">Notice Three</a></li>
    </ul></body></html>`;
    const spaHtml = `<html><body><div id="root"></div><noscript>Enable JavaScript</noscript></body></html>`;

    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
      intakeOptions: {
        fetchOptions: {
          lookupFn,
          skipRobots: true,
          skipHostDelay: true,
          httpClient: {
            request: async ({ url }) => ({
              status: 200,
              headers: { 'content-type': 'text/html' },
              data: Buffer.from(url.includes('spa') ? spaHtml : listingHtml),
            }),
          },
        },
      },
    });

    const ssrfBlocked = await request(app)
      .post('/v1/intake/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'http://127.0.0.1:4000/secret' });
    expect(ssrfBlocked.status).toBe(400);

    const okRes = await request(app)
      .post('/v1/intake/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://portal.gov.in/notices' });
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.supported).toBe(true);
    expect(okRes.body.data.source.type).toBe('listing');
    expect(okRes.body.data.source.trust).toBe('official');

    const spaRes = await request(app)
      .post('/v1/intake/link')
      .set('Authorization', `Bearer ${token}`)
      .send({ url: 'https://spa.example.com/' });
    expect(spaRes.status).toBe(200);
    expect(spaRes.body.data.supported).toBe(false);
    expect(spaRes.body.data.suggestedType).toBe('search');
  });

  it('extracts photo proposals (catalog first + search fallback) and enforces 5/day photo cap', async () => {
    const token = await signTestJwt('supa-photo-1');
    await Source.create({
      name: 'SSC Notices',
      url: 'https://ssc.gov.in/',
      type: 'listing',
      category: 'recruitment',
      trust: 'official',
    });

    const visionMock = vi.fn(async () => ({
      result: {
        organization: 'SSC',
        examOrScheme: 'SSC CGL 2026',
        dates: ['2026-12-20'],
        url: '',
        query: 'SSC CGL 2026 official notification',
      },
    }));

    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
      intakeOptions: {
        aiRouter: { vision: visionMock },
      },
    });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/v1/intake/photo')
        .set('Authorization', `Bearer ${token}`)
        .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
          filename: 'notice.jpg',
          contentType: 'image/jpeg',
        });
      expect(res.status).toBe(200);
      if (i === 0) {
        expect(res.body.data.proposals[0].kind).toBe('catalog');
        expect(res.body.data.proposals.some((p) => p.kind === 'search')).toBe(true);
        expect(res.body.data.proposals.length).toBeLessThanOrEqual(3);
      }
    }

    const capped = await request(app)
      .post('/v1/intake/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'notice.jpg',
        contentType: 'image/jpeg',
      });
    expect(capped.status).toBe(429);
    expect(capped.body.error.code).toBe('PHOTO_QUOTA_EXCEEDED');
  });

  it('rejects non-image uploads on /v1/intake/photo without invoking vision AI', async () => {
    const token = await signTestJwt('supa-bad-mime');
    const visionMock = vi.fn();

    const app = createApp({
      tickSecret: TEST_ENV.INTERNAL_TICK_SECRET,
      verifyJwt: (t) => verifySupabaseJwt(t, TEST_ENV),
      intakeOptions: {
        aiRouter: { vision: visionMock },
      },
    });

    const badMime = await request(app)
      .post('/v1/intake/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('<script>alert(1)</script>', 'utf8'), {
        filename: 'payload.html',
        contentType: 'text/html',
      });

    expect(badMime.status).toBe(400);
    expect(badMime.body.error.code).toBe('INVALID_IMAGE_TYPE');
    expect(visionMock).not.toHaveBeenCalled();
  });
});
