/**
 * Configures and wires the Express application middleware, API routes, and terminal error handlers.
 * Deliberately separates app creation from HTTP listening (`server.js`) so Supertest tests run in-process.
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './config/logger.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { createRoutes } from './routes/index.js';

/**
 * Constructs an Express app instance with security headers, logging, rate limiting, routes, and error handlers.
 *
 * @param {object} [options] - Dependency injections (`verifyJwt`, `corsOrigin`, `tickSecret`, etc.).
 * @returns {import('express').Express} Configured Express application.
 */
export function createApp(options = {}) {
  const app = express();
  const requireAuth = createAuthMiddleware({ verifyJwt: options.verifyJwt });

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: options.corsOrigin ?? process.env.CORS_ORIGIN ?? true,
      credentials: false,
    }),
  );
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimit);
  app.use(express.json({ limit: '1mb' }));

  app.use('/', createRoutes(requireAuth, options));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
