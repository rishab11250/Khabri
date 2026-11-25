import { createGeminiAdapter } from './gemini.js';
import { createGrokAdapter } from './grok.js';
import { consumeQuota, getDayPeriod } from './quota.js';

const DEFAULT_COOLDOWN_MS = 60 * 1000;
const DEFAULT_CIRCUIT_MS = 5 * 60 * 1000;
const CIRCUIT_FAIL_THRESHOLD = 3;

export class AiUnavailableError extends Error {
  constructor(message = 'All AI providers unavailable or quota exhausted', attempts = []) {
    super(message);
    this.name = 'AiUnavailableError';
    this.attempts = attempts;
  }
}

export function createAiRouter(options = {}) {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const circuitMs = options.circuitMs ?? DEFAULT_CIRCUIT_MS;
  const checkQuota = options.consumeQuota ?? consumeQuota;
  const nowFn = options.nowFn ?? (() => new Date());

  const dailyLimit = options.dailyLimitPerKey ?? Number(process.env.AI_DAILY_LIMIT_PER_KEY || 0);

  const geminiModel = options.geminiModel ?? process.env.GEMINI_MODEL;
  const grokModel = options.grokModel ?? process.env.GROK_MODEL;

  const adapters = options.adapters ?? {
    geminiA: createGeminiAdapter({
      apiKey: process.env.GEMINI_API_KEY_1,
      model: geminiModel,
      keyAlias: 'gemini_a',
    }),
    geminiB: createGeminiAdapter({
      apiKey: process.env.GEMINI_API_KEY_2,
      model: geminiModel,
      keyAlias: 'gemini_b',
    }),
    grok: createGrokAdapter({
      apiKey: process.env.GROK_API_KEY,
      model: grokModel,
      keyAlias: 'grok_1',
    }),
  };

  const state = new Map();

  function getKeyState(alias) {
    if (!state.has(alias)) {
      state.set(alias, { cooldownUntil: 0, failures: 0, circuitUntil: 0 });
    }
    return state.get(alias);
  }

  function orderedAdapters(role, method) {
    const order =
      method === 'vision'
        ? role === 'background'
          ? ['geminiA', 'geminiB']
          : ['geminiB', 'geminiA']
        : role === 'background'
          ? ['geminiA', 'geminiB', 'grok']
          : ['geminiB', 'geminiA', 'grok'];

    return order
      .map((k) => adapters[k])
      .filter((a) => a && a.isConfigured() && typeof a[method] === 'function');
  }

  async function dispatch(method, { role = 'user', ...payload }) {
    const candidates = orderedAdapters(role, method);
    if (candidates.length === 0) {
      throw new AiUnavailableError('No configured AI adapters for this operation');
    }

    const attempts = [];
    const period = getDayPeriod(nowFn());

    for (const adapter of candidates) {
      const nowMs = nowFn().getTime();
      const keyState = getKeyState(adapter.keyAlias);

      if (keyState.cooldownUntil > nowMs) {
        attempts.push({ keyAlias: adapter.keyAlias, skipped: 'cooldown' });
        continue;
      }
      if (keyState.circuitUntil > nowMs) {
        attempts.push({ keyAlias: adapter.keyAlias, skipped: 'circuit_open' });
        continue;
      }

      if (dailyLimit > 0) {
        const q = await checkQuota({
          provider: adapter.provider,
          keyAlias: adapter.keyAlias,
          period,
          limit: dailyLimit,
        });
        if (!q.allowed) {
          attempts.push({ keyAlias: adapter.keyAlias, skipped: q.reason || 'quota_exhausted' });
          continue;
        }
      }

      try {
        const result = await adapter[method](payload);
        keyState.failures = 0;
        keyState.circuitUntil = 0;
        return {
          result,
          provider: adapter.provider,
          keyAlias: adapter.keyAlias,
        };
      } catch (err) {
        if (err?.isRateLimit || err?.status === 429) {
          keyState.cooldownUntil = nowMs + cooldownMs;
          attempts.push({ keyAlias: adapter.keyAlias, error: 'rate_limited' });
        } else {
          keyState.failures += 1;
          if (keyState.failures >= CIRCUIT_FAIL_THRESHOLD) {
            keyState.circuitUntil = nowMs + circuitMs;
          }
          attempts.push({ keyAlias: adapter.keyAlias, error: err?.message || 'error' });
        }
      }
    }

    throw new AiUnavailableError('All AI providers failed or are unavailable', attempts);
  }

  return {
    getKeyState: (alias) => ({ ...getKeyState(alias) }),
    generateJson: (opts) => dispatch('generateJson', opts),
    generateText: (opts) => dispatch('generateText', opts),
    vision: (opts) => dispatch('vision', opts),
  };
}
