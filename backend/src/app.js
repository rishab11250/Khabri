import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { createInternalRouter } from './jobs/tick.route.js';
import { createDemoRouter } from './demo/demo.route.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { globalRateLimit } from './middleware/rateLimit.js';
import { createCatalogRouter } from './modules/catalog/catalog.route.js';
import { createHealthRouter } from './modules/health/health.route.js';
import { createUsersRouter } from './modules/users/users.route.js';

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

  app.use('/health', createHealthRouter());
  app.use(
    '/internal',
    createInternalRouter({ tickSecret: options.tickSecret, tickOptions: options.tickOptions }),
  );
  app.use('/demo', createDemoRouter({ demoMode: options.demoMode }));
  app.use('/v1/catalog', createCatalogRouter());
  app.use('/v1/me', createUsersRouter(requireAuth, { deleteAuthUser: options.deleteAuthUser }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
