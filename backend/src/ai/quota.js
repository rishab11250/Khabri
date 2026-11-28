/**
 * Manages atomic daily/monthly AI provider and per-user rate quotas in MongoDB.
 * Deliberately uses conditional `$inc` + E11000 upsert retries so concurrent workers never
 * overshoot configured caps.
 */
import { Quota } from '../models/index.js';

export const USER_DAILY_CAPS = {
  photo: 5,
  ask: 10,
};

/**
 * Formats a UTC calendar day key (`YYYY-MM-DD`) for daily quota documents.
 *
 * @param {Date} [now] - Reference timestamp.
 * @returns {string} ISO date prefix (`YYYY-MM-DD`).
 */
export function getDayPeriod(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * Formats a UTC calendar month key (`YYYY-MM`) for monthly quota documents.
 *
 * @param {Date} [now] - Reference timestamp.
 * @returns {string} ISO month prefix (`YYYY-MM`).
 */
export function getMonthPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

/**
 * Atomically consumes one quota unit if `used < limit` for `(provider, keyAlias, period)`.
 *
 * @param {object} params - Quota bucket identifiers and cap.
 * @param {string} params.provider - Provider name (`gemini`, `groq`, `serpapi`).
 * @param {string} params.keyAlias - Key or per-user bucket identifier.
 * @param {string} params.period - Day or month period string.
 * @param {number} params.limit - Maximum units permitted in the period.
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, reason?: string }>} Quota verdict.
 */
export async function consumeQuota({ provider, keyAlias, period, limit }) {
  if (typeof limit !== 'number' || limit <= 0) {
    return { allowed: false, used: 0, limit: limit ?? 0, reason: 'limit_not_configured' };
  }

  // Increment atomically only while used < limit so parallel ticks cannot overrun free-tier caps.
  const doc = await Quota.findOneAndUpdate(
    {
      provider,
      keyAlias,
      period,
      $expr: { $lt: ['$used', limit] },
    },
    {
      $inc: { used: 1 },
      $set: { limit },
    },
    { returnDocument: 'after' },
  );

  if (doc) {
    return { allowed: true, used: doc.used, limit };
  }

  try {
    const created = await Quota.create({
      provider,
      keyAlias,
      period,
      used: 1,
      limit,
    });
    return { allowed: true, used: created.used, limit };
  } catch (err) {
    if (err?.code === 11000) {
      // Lost race inserting the period document: re-try conditional increment before reporting exhaustion.
      const retry = await Quota.findOneAndUpdate(
        {
          provider,
          keyAlias,
          period,
          $expr: { $lt: ['$used', limit] },
        },
        {
          $inc: { used: 1 },
          $set: { limit },
        },
        { returnDocument: 'after' },
      );
      if (retry) {
        return { allowed: true, used: retry.used, limit };
      }
      const existing = await Quota.findOne({ provider, keyAlias, period }).lean();
      return {
        allowed: false,
        used: existing?.used ?? limit,
        limit,
        reason: 'quota_exhausted',
      };
    }
    throw err;
  }
}

/**
 * Enforces per-user daily caps on expensive interactive AI endpoints (`photo` and `ask`).
 *
 * @param {object} params - User identifier, endpoint kind, and optional timestamp.
 * @param {string|object} params.userId - Mongo user ID.
 * @param {'photo'|'ask'} params.kind - Quota category key in `USER_DAILY_CAPS`.
 * @param {Date} [params.now] - Reference timestamp for day rollover.
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, reason?: string }>} Quota verdict.
 * @throws {Error} When `kind` is not defined in `USER_DAILY_CAPS`.
 */
export function consumeUserDailyQuota({ userId, kind, now = new Date() }) {
  const limit = USER_DAILY_CAPS[kind];
  if (!limit) {
    throw new Error(`Unknown user quota kind: ${kind}`);
  }
  return consumeQuota({
    provider: 'gemini',
    keyAlias: `user:${String(userId)}:${kind}`,
    period: getDayPeriod(now),
    limit,
  });
}
