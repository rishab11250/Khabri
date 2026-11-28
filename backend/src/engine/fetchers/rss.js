/**
 * Fetches and parses RSS/Atom syndication feeds into normalized listing items.
 * Deliberately reuses `normaliseListingItems` so RSS feeds share listing diff semantics cleanly.
 */
import Parser from 'rss-parser';

import { normaliseListingItems } from '../normalise.js';
import { fetchWithGuards } from './fetchWithGuards.js';

const rssParser = new Parser();

/**
 * Parses raw RSS/Atom XML into normalized listing items and feed title.
 *
 * @param {string} xml - Raw XML feed body.
 * @param {string} baseUrl - Base URL used to resolve relative item links.
 * @returns {Promise<{ feedTitle: string, items: Array<object>, contentHash: string, textExcerpt: string }>} Parsed feed payload.
 */
export async function parseRssXml(xml, baseUrl) {
  const feed = await rssParser.parseString(xml || '');
  const rawItems = (feed.items || []).map((item) => ({
    title: item.title || '',
    href: item.link || '',
    dateText: item.isoDate || item.pubDate || '',
  }));

  return {
    feedTitle: feed.title || '',
    ...normaliseListingItems(rawItems, baseUrl),
  };
}

/**
 * Fetches an RSS/Atom source via guards and returns its normalized items.
 *
 * @param {object} source - Monitored `Source` document.
 * @param {object} [options] - Fetch/guard options forwarded to `fetchWithGuards`.
 * @returns {Promise<object>} `notModified` metadata or parsed RSS items with headers.
 * @throws {Error} With `status` property when upstream returns non-2xx HTTP status.
 */
export async function fetchRss(source, options = {}) {
  const res = await fetchWithGuards(source, options);
  if (res.notModified) {
    return { notModified: true, etag: res.etag, lastModified: res.lastModified };
  }
  if (res.status < 200 || res.status >= 300) {
    const err = new Error(`RSS fetch failed with HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const xml = res.buffer.toString('utf8');
  const parsed = await parseRssXml(xml, res.finalUrl);

  return {
    notModified: false,
    status: res.status,
    finalUrl: res.finalUrl,
    etag: res.etag,
    lastModified: res.lastModified,
    ...parsed,
  };
}
