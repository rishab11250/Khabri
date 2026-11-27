import { getDbState } from '../config/db.js';

export function getHealthStatus() {
  return {
    status: 'ok',
    service: 'khabri-api',
    db: getDbState(),
    uptimeSec: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
