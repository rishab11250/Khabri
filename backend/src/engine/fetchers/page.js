/**
 * Fetches generic HTML pages and extracts primary prose using Mozilla Readability and JSDOM.
 * Deliberately strips navigation/aside/marquee boilerplate before Readability runs.
 */
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

import { normalisePageResult } from '../normalise.js';
import { fetchWithGuards } from './fetchWithGuards.js';

/**
 * Extracts page title and normalized prose content from raw HTML using Readability.
 *
 * @param {string} html - Raw HTML markup.
 * @param {string} [baseUrl] - Canonical page URL for link resolution and hashing.
 * @returns {{ title: string, text: string, textExcerpt: string, unsupported: boolean, contentHash: string }} Parsed page result.
 */
export function parsePageHtml(html, baseUrl) {
  const dom = new JSDOM(html || '', { url: baseUrl || 'https://example.invalid' });
  const document = dom.window.document;
  for (const el of document.querySelectorAll(
    'script, style, nav, header, footer, aside, marquee',
  )) {
    el.remove();
  }
  const reader = new Readability(document);
  const article = reader.parse();
  const readableText = article?.textContent || '';

  return {
    title: article?.title || document.title || '',
    ...normalisePageResult({ html, readableText, baseUrl }),
  };
}

/**
 * Fetches a page source via guards and returns its normalized prose content.
 *
 * @param {object} source - Monitored `Source` document.
 * @param {object} [options] - Fetch/guard options forwarded to `fetchWithGuards`.
 * @returns {Promise<object>} `notModified` metadata or parsed page content with headers.
 * @throws {Error} With `status` property when upstream returns non-2xx HTTP status.
 */
export async function fetchPage(source, options = {}) {
  const res = await fetchWithGuards(source, options);
  if (res.notModified) {
    return { notModified: true, etag: res.etag, lastModified: res.lastModified };
  }
  if (res.status < 200 || res.status >= 300) {
    const err = new Error(`Page fetch failed with HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const html = res.buffer.toString('utf8');
  const normalised = parsePageHtml(html, res.finalUrl);

  return {
    notModified: false,
    status: res.status,
    finalUrl: res.finalUrl,
    etag: res.etag,
    lastModified: res.lastModified,
    ...normalised,
  };
}
