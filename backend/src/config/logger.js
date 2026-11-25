import pino from 'pino';

export function createLogger(level = process.env.NODE_ENV === 'test' ? 'silent' : 'info') {
  return pino({
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers["x-tick-secret"]',
        '*.password',
        '*.token',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },
  });
}

export const logger = createLogger();
