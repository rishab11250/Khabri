/**
 * Process entrypoint connecting MongoDB, booting the Express HTTP server, and handling SIGINT/SIGTERM.
 * Deliberately keeps route setup in `app.js` and exposes no HTTP handler exports itself.
 */
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { getEnv } from './config/env.js';
import { logger } from './config/logger.js';

async function start() {
  const env = getEnv();
  await connectDb(env.MONGODB_URI);

  const app = createApp({
    corsOrigin: env.CORS_ORIGIN,
    tickSecret: env.INTERNAL_TICK_SECRET,
  });

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'khabri-api listening');
  });

  const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.fatal({ err }, 'Failed to start khabri-api');
  process.exit(1);
});
