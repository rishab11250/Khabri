/**
 * Integrates Google Search results via SerpAPI with 6h caching and two-key monthly budget guardrails.
 * Deliberately rotates from key 1 to key 2 at 90% utilization and halts all calls at 95% total
 * budget so paid tier overages cannot happen accidentally.
 */
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

/**
 * Hashes normalized search query text into a stable SHA-256 `SearchCache` key.
 *
 * @param {string} query - Raw search query string.
 * @returns {string} 64-character hex digest.
 */
function hashSearchQuery(query) {
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

/**
 * Computes monthly SerpAPI usage across configured keys and checks the 95% hard stop.
 *
 * @param {object} [options] - Optional clock (`now`), key overrides, and monthly limits.
 * @returns {Promise<{ configured: boolean, exhausted: boolean, used: number, limit: number, hardStop?: number, resetDate: string, keys: Array<object> }>} Budget status.
 */
async function getSerpApiBudgetStatus(options = {}) {
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
  // Enforce a 95% ceiling to keep a small headroom buffer against concurrent cron/intake requests.
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

function selectAvailableSerpKey(keys, keyStats) {
  // Switch from key 1 to key 2 at 90% of key 1 so both keys share peak traffic smoothly.
  for (let i = 0; i < keys.length; i += 1) {
    const keyCfg = keys[i];
    const stat = keyStats[i];
    const threshold = i === 0 && keys.length > 1 ? Math.floor(keyCfg.limit * 0.9) : keyCfg.limit;
    if (stat.used < threshold) return keyCfg;
  }
  return null;
}

async function fetchSerpResults({ cleanQuery, chosenKey, httpClient }) {
  const res = await httpClient.get(SERPAPI_URL, {
    timeout: 8000,
    params: {
      q: cleanQuery,
      api_key: chosenKey.apiKey,
      engine: 'google',
      gl: 'in',
      hl: 'en',
      num: 5,
    },
  });

  return (res.data?.organic_results || []).slice(0, 5).map((r) => ({
    title: r.title || '',
    link: r.link || '',
    snippet: r.snippet || '',
  }));
}

/**
 * Searches Google via SerpAPI with `SearchCache` lookup, key rotation, and 95% budget cutoff.
 *
 * @param {string} query - Search query string.
 * @param {object} [options] - Cache bypass (`skipCache`), key/limit overrides, and HTTP client mock.
 * @returns {Promise<{ results: Array<object>, cached: boolean, stopped: boolean, resetDate?: string, keyAlias?: string }>} Search results and budget status.
 */
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
    return { results: [], cached: false, stopped: true, resetDate: budget.resetDate };
  }

  const chosen = selectAvailableSerpKey(keys, budget.keys);
  if (!chosen) {
    return { results: [], cached: false, stopped: true, resetDate: budget.resetDate };
  }

  await Quota.findOneAndUpdate(
    { provider: 'serpapi', keyAlias: chosen.alias, period },
    { $inc: { used: 1 }, $set: { limit: chosen.limit } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  const results = await fetchSerpResults({
    cleanQuery,
    chosenKey: chosen,
    httpClient: options.httpClient ?? axios,
  });

  await SearchCache.findOneAndUpdate(
    { queryHash },
    { $set: { results, createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );

  return { results, cached: false, stopped: false, keyAlias: chosen.alias };
}
