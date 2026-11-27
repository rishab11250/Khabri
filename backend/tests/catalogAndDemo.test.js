import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { resetDemoNotices } from '../src/services/demo.service.js';
import { parseListingHtml } from '../src/engine/fetchers/listing.js';
import { Source } from '../src/models/index.js';
import { seedCatalogSources } from '../src/data/catalogSeed.js';

describe('Catalog API and Demo Notice Board', () => {
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
    await Source.deleteMany({});
    resetDemoNotices();
  });

  it('seeds 15 verified sources + Demo Board and filters via GET /v1/catalog', async () => {
    const count = await seedCatalogSources('http://localhost:4000/demo/board');
    expect(count).toBe(16);

    const app = createApp({ tickSecret: 'test-tick-secret', demoMode: true });

    const allRes = await request(app).get('/v1/catalog');
    expect(allRes.status).toBe(200);
    expect(allRes.body.data.sources).toHaveLength(16);
    expect(allRes.body.data.sources[0].isDemo).toBe(true);

    const examRes = await request(app).get('/v1/catalog?category=exam&q=GATE');
    expect(examRes.status).toBe(200);
    expect(examRes.body.data.sources).toHaveLength(1);
    expect(examRes.body.data.sources[0].name).toContain('GATE');

    const stateRes = await request(app).get('/v1/catalog?state=Maharashtra');
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.data.sources).toHaveLength(1);
    expect(stateRes.body.data.sources[0].name).toContain('MPSC');

    const trendingRes = await request(app).get('/v1/catalog/trending');
    expect(trendingRes.status).toBe(200);
    expect(trendingRes.body.data.sources.length).toBeLessThanOrEqual(10);
  });

  it('serves Demo Notice Board HTML and gates mutations behind DEMO_MODE', async () => {
    const prodApp = createApp({ tickSecret: 'test-tick-secret', demoMode: false });
    const blocked = await request(prodApp)
      .post('/demo/board')
      .send({ action: 'add', title: 'Should fail in prod' });
    expect(blocked.status).toBe(403);

    const devApp = createApp({ tickSecret: 'test-tick-secret', demoMode: true });
    const initialHtml = await request(devApp).get('/demo/board');
    expect(initialHtml.status).toBe(200);
    const before = parseListingHtml(initialHtml.text, 'http://localhost:4000/demo/board');
    expect(before.items).toHaveLength(3);

    const addRes = await request(devApp).post('/demo/board').send({
      action: 'add',
      title: 'UPSC Civil Services Revised Calendar 2026',
      dateText: '12 Jan 2027',
    });
    expect(addRes.status).toBe(201);

    const updatedHtml = await request(devApp).get('/demo/board');
    const after = parseListingHtml(updatedHtml.text, 'http://localhost:4000/demo/board');
    expect(after.items).toHaveLength(4);
    expect(after.items[0].title).toBe('UPSC Civil Services Revised Calendar 2026');
    expect(after.contentHash).not.toBe(before.contentHash);
  });
});
