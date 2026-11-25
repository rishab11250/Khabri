import { Quota } from '../models/index.js';

export const USER_DAILY_CAPS = {
  photo: 5,
  ask: 10,
};

export function getDayPeriod(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getMonthPeriod(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

export async function consumeQuota({ provider, keyAlias, period, limit }) {
  if (typeof limit !== 'number' || limit <= 0) {
    return { allowed: false, used: 0, limit: limit ?? 0, reason: 'limit_not_configured' };
  }

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

export async function consumeUserDailyQuota({ userId, kind, now = new Date() }) {
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

export async function getQuotaUsage({ provider, keyAlias, period }) {
  const doc = await Quota.findOne({ provider, keyAlias, period }).lean();
  return doc ? { used: doc.used, limit: doc.limit } : { used: 0, limit: 0 };
}
