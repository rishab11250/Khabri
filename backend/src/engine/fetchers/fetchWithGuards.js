import { assertRobotsAllowed, waitForHostSlot } from '../../security/robots.js';
import { safeFetch } from '../../security/ssrfGuard.js';

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
