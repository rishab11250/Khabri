/**
 * Fetches, caches, and enforces per-origin robots.txt rules and host crawl delays.
 * Deliberately falls back to open crawling when robots.txt is missing or unreachable
 * so transient portal errors never block user-configured monitors.
 */
import robotsParser from 'robots-parser';

import { BOT_USER_AGENT, safeFetch } from './ssrfGuard.js';

const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_HOST_DELAY_MS = 1000;

const robotsCache = new Map();
const hostLastRequestAt = new Map();

/**
 * Clears in-memory robots.txt parsers and per-host rate timestamps.
 *
 * @returns {void}
 */
export function clearRobotsCache() {
  robotsCache.clear();
  hostLastRequestAt.clear();
}

/**
 * Loads and caches the parsed robots policy for the target URL origin for one hour.
 *
 * @param {string} targetUrl - Candidate URL on the target origin.
 * @param {object} [options] - Fetch and DNS overrides forwarded to `safeFetch`.
 * @returns {Promise<object>} Parsed `robots-parser` instance for the origin.
 */
async function getRobotsPolicy(targetUrl, options = {}) {
  const origin = new URL(targetUrl).origin;
  const cached = robotsCache.get(origin);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.parser;
  }

  const robotsUrl = `${origin}/robots.txt`;
  let parser = robotsParser(robotsUrl, '');

  try {
    // Pass robots.txt through safeFetch so origin redirects cannot bypass SSRF rules.
    const res = await safeFetch(robotsUrl, {
      timeoutMs: options.timeoutMs ?? 4000,
      maxBytes: 256 * 1024,
      skipContentTypeCheck: true,
      httpClient: options.httpClient,
      lookupFn: options.lookupFn,
      allowPrivateHosts: options.allowPrivateHosts,
    });
    if (res.status >= 200 && res.status < 300) {
      parser = robotsParser(robotsUrl, res.buffer.toString('utf8'));
    }
  } catch {
    // Missing or unreachable robots.txt defaults to allowed with standard host delay.
  }

  robotsCache.set(origin, {
    parser,
    expiresAt: Date.now() + ROBOTS_CACHE_TTL_MS,
  });
  return parser;
}

/**
 * Verifies that `targetUrl` is permitted for `KhabriBot` and resolves its crawl delay.
 *
 * @param {string} targetUrl - Full URL about to be requested.
 * @param {object} [options] - Optional delay fallback and `safeFetch` overrides.
 * @returns {Promise<{ allowed: boolean, crawlDelayMs: number }>} Policy decision and delay in ms.
 * @throws {Error} With `code: 'ROBOTS_DISALLOWED'` when `robots.txt` disallows the path.
 */
export async function assertRobotsAllowed(targetUrl, options = {}) {
  const parser = await getRobotsPolicy(targetUrl, options);
  const allowed = parser.isAllowed(targetUrl, BOT_USER_AGENT);
  if (allowed === false) {
    const err = new Error(`Blocked by robots.txt for ${targetUrl}`);
    err.code = 'ROBOTS_DISALLOWED';
    throw err;
  }
  const crawlDelaySec = parser.getCrawlDelay(BOT_USER_AGENT);
  return {
    allowed: true,
    // Cap absurd robots crawl-delay values at 10s so tick workers stay bounded.
    crawlDelayMs:
      typeof crawlDelaySec === 'number' && crawlDelaySec > 0
        ? Math.min(crawlDelaySec * 1000, 10000)
        : (options.minHostDelayMs ?? DEFAULT_HOST_DELAY_MS),
  };
}

/**
 * Sleeps until the target host has respected `delayMs` since the previous request.
 *
 * @param {string} targetUrl - URL whose host slot should be awaited.
 * @param {number} [delayMs] - Minimum spacing between requests to the same host.
 * @returns {Promise<void>} Resolves once the host slot is ready.
 */
export async function waitForHostSlot(targetUrl, delayMs = DEFAULT_HOST_DELAY_MS) {
  if (delayMs <= 0) return;
  const host = new URL(targetUrl).host;
  const lastAt = hostLastRequestAt.get(host) ?? 0;
  const elapsed = Date.now() - lastAt;
  if (elapsed < delayMs) {
    await new Promise((resolve) => setTimeout(resolve, delayMs - elapsed));
  }
  hostLastRequestAt.set(host, Date.now());
}
