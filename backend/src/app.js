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
import { createAskRouter } from './modules/ask/ask.route.js';
import { createCatalogRouter } from './modules/catalog/catalog.route.js';
import { createChecklistRouter } from './modules/checklist/checklist.route.js';
import { createCirclesRouter } from './modules/circles/circles.route.js';
import { createDeadlinesRouter } from './modules/deadlines/deadlines.route.js';
import { createDevicesRouter } from './modules/devices/devices.route.js';
import { createChangesRouter, createFeedRouter } from './modules/feed/feed.route.js';
import { createHealthRouter } from './modules/health/health.route.js';
import { createIntakeRouter } from './modules/intake/intake.route.js';
import { createUsersRouter } from './modules/users/users.route.js';
import { createWatchesRouter } from './modules/watches/watches.route.js';

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
  app.get('/auth/confirmed', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Khabri — Email Confirmed</title>
  <style>
    body { font-family: Georgia, serif; background: #F4ECDD; color: #1B1A17; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: #FBF6EA; border: 2px solid #1B1A17; padding: 28px; max-width: 420px; text-align: center; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { margin: 0 0 20px; color: #6B665C; line-height: 1.5; }
    a { display: inline-block; background: #C8402A; color: #FBF6EA; text-decoration: none; padding: 12px 20px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>KHABRI</h1>
    <p>Your email is confirmed. Open the Khabri app on your phone to sign in.</p>
    <a href="khabri://sign-in">Open Khabri App</a>
  </div>
</body>
</html>`);
  });
  app.use(
    '/internal',
    createInternalRouter({ tickSecret: options.tickSecret, tickOptions: options.tickOptions }),
  );
  app.use('/demo', createDemoRouter({ demoMode: options.demoMode }));
  app.use('/v1/catalog', createCatalogRouter());
  app.use('/v1/devices', createDevicesRouter(requireAuth));
  app.use('/v1/intake', createIntakeRouter(requireAuth, options.intakeOptions));
  app.use('/v1/watches', createWatchesRouter(requireAuth, { tickOptions: options.tickOptions }));
  app.use('/v1/feed', createFeedRouter(requireAuth));
  app.use('/v1/changes', createChangesRouter(requireAuth, options.changesOptions));
  app.use('/v1/checklist', createChecklistRouter(requireAuth));
  app.use('/v1/deadlines', createDeadlinesRouter(requireAuth));
  app.use('/v1/circles', createCirclesRouter(requireAuth));
  app.use('/v1/ask', createAskRouter(requireAuth, options.askOptions));
  app.use('/v1/me', createUsersRouter(requireAuth, { deleteAuthUser: options.deleteAuthUser }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
