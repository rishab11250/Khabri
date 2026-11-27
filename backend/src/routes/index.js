import { Router } from 'express';
import { createAskRouter } from './ask.route.js';
import { createCatalogRouter } from './catalog.route.js';
import { createChecklistRouter } from './checklist.route.js';
import { createCirclesRouter } from './circles.route.js';
import { createDeadlinesRouter } from './deadlines.route.js';
import { createDemoRouter } from './demo.route.js';
import { createDevicesRouter } from './devices.route.js';
import { createChangesRouter, createFeedRouter } from './feed.route.js';
import { createHealthRouter } from './health.route.js';
import { createIntakeRouter } from './intake.route.js';
import { createInternalRouter } from './tick.route.js';
import { createUsersRouter } from './users.route.js';
import { createWatchesRouter } from './watches.route.js';

const AUTH_CONFIRMED_HTML = `<!doctype html>
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
</html>`;

export function createRoutes(requireAuth, options = {}) {
  const router = Router();

  router.use('/health', createHealthRouter());
  router.get('/auth/confirmed', (_req, res) => {
    res.type('html').send(AUTH_CONFIRMED_HTML);
  });
  router.use(
    '/internal',
    createInternalRouter({ tickSecret: options.tickSecret, tickOptions: options.tickOptions }),
  );
  router.use('/demo', createDemoRouter({ demoMode: options.demoMode }));

  router.use('/v1/catalog', createCatalogRouter());
  router.use('/v1/devices', createDevicesRouter(requireAuth));
  router.use('/v1/intake', createIntakeRouter(requireAuth, options.intakeOptions));
  router.use('/v1/watches', createWatchesRouter(requireAuth, { tickOptions: options.tickOptions }));
  router.use('/v1/feed', createFeedRouter(requireAuth));
  router.use('/v1/changes', createChangesRouter(requireAuth, options.changesOptions));
  router.use('/v1/checklist', createChecklistRouter(requireAuth));
  router.use('/v1/deadlines', createDeadlinesRouter(requireAuth));
  router.use('/v1/circles', createCirclesRouter(requireAuth));
  router.use('/v1/ask', createAskRouter(requireAuth, options.askOptions));
  router.use('/v1/me', createUsersRouter(requireAuth, { deleteAuthUser: options.deleteAuthUser }));

  return router;
}
