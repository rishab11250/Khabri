import 'dotenv/config';

import { connectDb, disconnectDb } from '../src/config/db.js';
import { getEnv } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import { seedCatalogSources } from '../src/data/catalogSeed.js';

async function run() {
  const env = getEnv();
  await connectDb(env.MONGODB_URI);
  const demoUrl = process.env.DEMO_BOARD_URL || `http://localhost:${env.PORT}/demo/board`;
  const count = await seedCatalogSources(demoUrl);
  logger.info({ count }, 'Catalog seed complete');
  await disconnectDb();
}

run().catch((err) => {
  logger.error({ err }, 'Catalog seed failed');
  process.exit(1);
});
