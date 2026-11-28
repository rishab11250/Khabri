/**
 * Aggregates API liveness, Mongoose connection state, and process uptime for `/health`.
 * Deliberately exposes no secrets or internal environment details.
 */
import { getDbState } from '../config/db.js';

/**
 * Returns the health status snapshot rendered on `/health` and `/v1/health`.
 *
 * @returns {{ status: 'ok', service: string, db: string, uptimeSec: number, timestamp: string }} Health payload.
 */
export function getHealthStatus() {
  return {
    status: 'ok',
    service: 'khabri-api',
    db: getDbState(),
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
