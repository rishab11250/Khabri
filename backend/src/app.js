import express from 'express';

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        service: 'khabri-api',
        timestamp: new Date().toISOString(),
      },
      error: null,
    });
  });

  return app;
}
