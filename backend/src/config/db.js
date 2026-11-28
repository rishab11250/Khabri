/**
 * Manages the Mongoose connection lifecycle and exposes connection state strings for health checks.
 * Deliberately reuses open connections when `readyState === 1` so repeated worker/test boots stay idempotent.
 */
import mongoose from 'mongoose';

import { logger } from './logger.js';

/**
 * Connects Mongoose to `uri` if not already connected (`strictQuery: true`).
 *
 * @param {string} uri - MongoDB connection URI.
 * @returns {Promise<object>} Active Mongoose connection instance.
 */
export async function connectDb(uri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info('MongoDB connected');
  return mongoose.connection;
}

/**
 * Closes the active Mongoose connection during graceful shutdown or test teardown.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Translates Mongoose's numeric `readyState` into a readable label for `/health`.
 *
 * @returns {'disconnected'|'connected'|'connecting'|'disconnecting'|'unknown'} Connection state label.
 */
export function getDbState() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'unknown';
}
