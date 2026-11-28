/**
 * Combines `robots.txt` enforcement, polite host pacing, conditional HTTP headers, and SSRF fetch.
 * Deliberately sends `If-None-Match` and `If-Modified-Since` to turn unchanged ticks into cheap 304s.
 */
import { assertRobotsAllowed, waitForHostSlot } from '../../security/robots.js';
import { safeFetch } from '../../security/ssrfGuard.js';

/**
 * Fetches a source object or URL string after robots.txt checks and host rate-limit pacing.
 *
 * @param {string|{ url: string, etag?: string, lastModified?: string }} sourceOrUrl - Source document or URL string.
 * @param {object} [options] - Optional overrides (`skipRobots`, `skipHostDelay`, `etag`, `lastModified`, `headers`).
 * @returns {Promise<object>} `safeFetch` response payload.
 * @throws {Error} On `ROBOTS_DISALLOWED` or `SsrfError`.
 */
export async function fetchWithGuards(sourceOrUrl, options = {}) {
  const url = typeof sourceOrUrl === 'string' ? sourceOrUrl : sourceOrUrl.url;
  const etag = typeof sourceOrUrl === 'string' ? options.etag : sourceOrUrl.etag;
  const lastModified =
    typeof sourceOrUrl === 'string' ? options.lastModified : sourceOrUrl.lastModified;

  let delayMs = options.minHostDelayMs ?? 1000;
  if (!options.skipRobots) {
    const policy = await assertRobotsAllowed(url, options);
    delayMs = policy.crawlDelayMs;
  }

  if (!options.skipHostDelay) {
    await waitForHostSlot(url, delayMs);
  }

  const conditionalHeaders = {};
  if (etag) conditionalHeaders['If-None-Match'] = etag;
  if (lastModified) conditionalHeaders['If-Modified-Since'] = lastModified;

  return safeFetch(url, {
    ...options,
    headers: {
      ...conditionalHeaders,
      ...options.headers,
    },
  });
}
