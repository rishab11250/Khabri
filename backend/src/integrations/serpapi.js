import { createHash } from 'node:crypto';
import axios from 'axios';
import { getMonthPeriod } from '../ai/quota.js';
import { Quota, SearchCache } from '../models/index.js';

const SERPAPI_URL = 'https://serpapi.com/search.json';

function nextMonthResetIso(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return new Date(Date.UTC(y, m + 1, 1)).toISOString().slice(0, 10);
}

export function hashSearchQuery(query) {
  return createHash('sha256')
    .update(
      String(query || '')
        .trim()
        .toLowerCase(),
    )
    .digest('hex');
}

function getConfiguredKeys(options = {}) {
  const limit = Number(
    options.monthlyLimitPerKey ?? process.env.SERPAPI_MONTHLY_LIMIT_PER_KEY ?? 0,
  );
  const keys = [];
  const k1 = options.key1 ?? process.env.SERPAPI_KEY_1;
  const k2 = options.key2 ?? process.env.SERPAPI_KEY_2;
  if (k1) keys.push({ alias: 'serpapi_1', apiKey: k1, limit });
  if (k2) keys.push({ alias: 'serpapi_2', apiKey: k2, limit });
  return keys;
}

export async function getSerpApiBudgetStatus(options = {}) {
  const now = options.now ?? new Date();
  const period = getMonthPeriod(now);
  const keys = getConfiguredKeys(options);

  if (keys.length === 0 || keys.every((k) => k.limit <= 0)) {
    return {
      configured: false,
      exhausted: true,
      used: 0,
      limit: 0,
      resetDate: nextMonthResetIso(now),
      keys: [],
    };
  }

  const docs = await Quota.find({
    provider: 'serpapi',
    keyAlias: { $in: keys.map((k) => k.alias) },
    period,
  }).lean();
  const docMap = new Map(docs.map((d) => [d.keyAlias, d.used]));

  const keyStats = keys.map((k) => ({
    alias: k.alias,
    used: docMap.get(k.alias) ?? 0,
    limit: k.limit,
  }));

  const totalUsed = keyStats.reduce((sum, k) => sum + k.used, 0);
  const totalLimit = keyStats.reduce((sum, k) => sum + k.limit, 0);
  const hardStop = Math.floor(totalLimit * 0.95);

  return {
    configured: true,
    exhausted: totalUsed >= hardStop,
    used: totalUsed,
    limit: totalLimit,
    hardStop,
    resetDate: nextMonthResetIso(now),
    keys: keyStats,
  };
}

export async function searchSerpApi(query, options = {}) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return { results: [], cached: false, stopped: false };

  const queryHash = hashSearchQuery(cleanQuery);
  if (!options.skipCache) {
    const cached = await SearchCache.findOne({ queryHash }).lean();
    if (cached) {
      return { results: cached.results || [], cached: true, stopped: false };
    }
  }

  const now = options.now ?? new Date();
  const period = getMonthPeriod(now);
  const keys = getConfiguredKeys(options);
  const budget = await getSerpApiBudgetStatus(options);

  if (!budget.configured || budget.exhausted) {
    return {
      results: [],
      cached: false,
      stopped: true,
      resetDate: budget.resetDate,
    };
  }

  // Switch from key 1 to key 2 at 90% of key 1
  let chosen = null;
  for (let i = 0; i < keys.length; i += 1) {
    const keyCfg = keys[i];
    const stat = budget.keys[i];
    const threshold = i === 0 && keys.length > 1 ? Math.floor(keyCfg.limit * 0.9) : keyCfg.limit;
    if (stat.used < threshold) {
      chosen = keyCfg;
      break;
    }
  }

  if (!chosen) {
    return { results: [], cached: false, stopped: true, resetDate: budget.resetDate };
  }

  await Quota.findOneAndUpdate(
    { provider: 'serpapi', keyAlias: chosen.alias, period },
    { $inc: { used: 1 }, $set: { limit: chosen.limit } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const httpClient = options.httpClient ?? axios;
  const res = await httpClient.get(SERPAPI_URL, {
    timeout: 8000,
    params: {
      q: cleanQuery,
      api_key: chosen.apiKey,
      engine: 'google',
      gl: 'in',
      hl: 'en',
      num: 5,
    },
  });

  const results = (res.data?.organic_results || []).slice(0, 5).map((r) => ({
    title: r.title || '',
    link: r.link || '',
    snippet: r.snippet || '',
  }));

  await SearchCache.findOneAndUpdate(
    { queryHash },
    { $set: { results, createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );

  return { results, cached: false, stopped: false, keyAlias: chosen.alias };
}
