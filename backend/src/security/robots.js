import robotsParser from 'robots-parser';
import { BOT_USER_AGENT, safeFetch } from './ssrfGuard.js';

const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_HOST_DELAY_MS = 1000;

const robotsCache = new Map();
const hostLastRequestAt = new Map();

export function clearRobotsCache() {
  robotsCache.clear();
  hostLastRequestAt.clear();
}

export async function getRobotsPolicy(targetUrl, options = {}) {
  const origin = new URL(targetUrl).origin;
  const cached = robotsCache.get(origin);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.parser;
  }

  const robotsUrl = `${origin}/robots.txt`;
  let parser = robotsParser(robotsUrl, '');

  try {
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
    // Missing or unreachable robots.txt defaults to allowed with standard host delay
  }

  robotsCache.set(origin, {
    parser,
    expiresAt: Date.now() + ROBOTS_CACHE_TTL_MS,
  });
  return parser;
}

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
    crawlDelayMs:
      typeof crawlDelaySec === 'number' && crawlDelaySec > 0
        ? Math.min(crawlDelaySec * 1000, 10000)
        : (options.minHostDelayMs ?? DEFAULT_HOST_DELAY_MS),
  };
}

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
