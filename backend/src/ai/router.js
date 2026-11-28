/**
 * Routes AI requests across Gemini keys and Groq with per-key rate-limit cooldowns,
 * circuit breakers, and optional daily quota enforcement.
 * Deliberately isolates background batch traffic (`gemini_a` first) from user-facing
 * requests (`gemini_b` first) so scheduled ticks cannot starve interactive features.
 */
import { createGeminiAdapter } from './gemini.js';
import { createGroqAdapter } from './groq.js';
import { consumeQuota, getDayPeriod } from './quota.js';

const DEFAULT_COOLDOWN_MS = 60 * 1000; // Short pause on HTTP 429 before retrying that key.
const DEFAULT_CIRCUIT_MS = 5 * 60 * 1000; // Longer quarantine when a provider errors repeatedly.
const CIRCUIT_FAIL_THRESHOLD = 3; // Consecutive non-429 failures that open the key's circuit.

const ADAPTER_ORDER_TABLE = {
  vision: {
    background: ['geminiA', 'geminiB'],
    user: ['geminiB', 'geminiA'],
  },
  default: {
    background: ['geminiA', 'geminiB', 'groqA', 'groqB'],
    user: ['geminiB', 'geminiA', 'groqB', 'groqA'],
  },
};

/**
 * Error raised when every configured AI adapter is cooled down, circuit-open, exhausted, or failed.
 */
export class AiUnavailableError extends Error {
  /**
   * Creates an AI availability error preserving per-adapter skip/failure diagnostics.
   *
   * @param {string} [message] - Human-readable error message.
   * @param {Array<object>} [attempts] - Per-adapter failure/skip details recorded during dispatch.
   */
  constructor(message = 'All AI providers unavailable or quota exhausted', attempts = []) {
    super(message);
    this.name = 'AiUnavailableError';
    this.attempts = attempts;
  }
}

// --- Adapter selection and failure tracking ---

function createDefaultAdapters(geminiModel, groqModel) {
  return {
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
    groqA: createGroqAdapter({
      apiKey: process.env.GROQ_API_KEY_1,
      model: groqModel,
      keyAlias: 'groq_a',
    }),
    groqB: createGroqAdapter({
      apiKey: process.env.GROQ_API_KEY_2,
      model: groqModel,
      keyAlias: 'groq_b',
    }),
  };
}

function selectOrderedAdapters(adapters, role, method) {
  const family = method === 'vision' ? ADAPTER_ORDER_TABLE.vision : ADAPTER_ORDER_TABLE.default;
  const order = role === 'background' ? family.background : family.user;
  return order
    .map((key) => adapters[key])
    .filter((a) => a && a.isConfigured() && typeof a[method] === 'function');
}

async function checkAdapterAvailability({
  adapter,
  keyState,
  nowMs,
  period,
  dailyLimit,
  checkQuota,
}) {
  if (keyState.cooldownUntil > nowMs) {
    return { allowed: false, attempt: { keyAlias: adapter.keyAlias, skipped: 'cooldown' } };
  }
  if (keyState.circuitUntil > nowMs) {
    return { allowed: false, attempt: { keyAlias: adapter.keyAlias, skipped: 'circuit_open' } };
  }
  if (dailyLimit > 0) {
    const q = await checkQuota({
      provider: adapter.provider,
      keyAlias: adapter.keyAlias,
      period,
      limit: dailyLimit,
    });
    if (!q.allowed) {
      return {
        allowed: false,
        attempt: { keyAlias: adapter.keyAlias, skipped: q.reason || 'quota_exhausted' },
      };
    }
  }
  return { allowed: true };
}

function recordAdapterFailure(err, adapter, keyState, nowMs, cooldownMs, circuitMs) {
  if (err?.isRateLimit || err?.status === 429) {
    // 429 triggers a cooldown without counting toward circuit opening so burst limits self-heal.
    keyState.cooldownUntil = nowMs + cooldownMs;
    return { keyAlias: adapter.keyAlias, error: 'rate_limited' };
  }
  keyState.failures += 1;
  if (keyState.failures >= CIRCUIT_FAIL_THRESHOLD) {
    keyState.circuitUntil = nowMs + circuitMs;
  }
  return { keyAlias: adapter.keyAlias, error: err?.message || 'error' };
}

// --- Router factory ---

/**
 * Creates an AI router instance maintaining per-key cooldown and circuit-breaker state in memory.
 *
 * @param {object} [options] - Timing thresholds, adapter overrides, quota function, and clock mock.
 * @param {number} [options.cooldownMs] - Cooldown duration in ms after a 429 rate-limit error.
 * @param {number} [options.circuitMs] - Circuit open duration in ms after repeated failures.
 * @param {Function} [options.consumeQuota] - Quota enforcement callback (`consumeQuota` by default).
 * @param {Function} [options.nowFn] - Clock function returning `Date` for deterministic testing.
 * @param {number} [options.dailyLimitPerKey] - Daily per-key limit (`0` disables per-key cap).
 * @param {object} [options.adapters] - Optional map of custom provider adapters.
 * @param {string} [options.geminiModel] - Gemini model name override.
 * @param {string} [options.groqModel] - Groq model name override.
 * @returns {{ getKeyState: Function, generateJson: Function, generateText: Function, vision: Function }} Router API.
 */
export function createAiRouter(options = {}) {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const circuitMs = options.circuitMs ?? DEFAULT_CIRCUIT_MS;
  const checkQuota = options.consumeQuota ?? consumeQuota;
  const nowFn = options.nowFn ?? (() => new Date());
  const dailyLimit = options.dailyLimitPerKey ?? Number(process.env.AI_DAILY_LIMIT_PER_KEY || 0);
  const adapters =
    options.adapters ??
    createDefaultAdapters(
      options.geminiModel ?? process.env.GEMINI_MODEL,
      options.groqModel ?? process.env.GROQ_MODEL,
    );

  const state = new Map();

  function getKeyState(alias) {
    if (!state.has(alias)) {
      state.set(alias, { cooldownUntil: 0, failures: 0, circuitUntil: 0 });
    }
    return state.get(alias);
  }

  async function dispatch(method, { role = 'user', ...payload }) {
    const candidates = selectOrderedAdapters(adapters, role, method);
    if (candidates.length === 0) {
      throw new AiUnavailableError('No configured AI adapters for this operation');
    }

    const attempts = [];
    const period = getDayPeriod(nowFn());

    for (const adapter of candidates) {
      const nowMs = nowFn().getTime();
      const keyState = getKeyState(adapter.keyAlias);
      const check = await checkAdapterAvailability({
        adapter,
        keyState,
        nowMs,
        period,
        dailyLimit,
        checkQuota,
      });
      if (!check.allowed) {
        attempts.push(check.attempt);
        continue;
      }

      try {
        const result = await adapter[method](payload);
        keyState.failures = 0;
        keyState.circuitUntil = 0;
        return { result, provider: adapter.provider, keyAlias: adapter.keyAlias };
      } catch (err) {
        attempts.push(recordAdapterFailure(err, adapter, keyState, nowMs, cooldownMs, circuitMs));
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
