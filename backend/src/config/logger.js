/**
 * Configures structured Pino logging with automatic secret redaction and silent test mode.
 * Deliberately redacts authorization headers, tick secrets, tokens, and passwords before serialization.
 */
import pino from 'pino';

/**
 * Builds the shared Pino logger instance with secret redaction rules.
 *
 * @param {string} [level] - Log verbosity (`'silent'` under tests, `'info'` otherwise).
 * @returns {object} Configured Pino logger.
 */
function createLogger(level = process.env.NODE_ENV === 'test' ? 'silent' : 'info') {
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
