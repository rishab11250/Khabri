/**
 * Scrapes notice links and dates from notice-board HTML pages into normalized listing items.
 * Deliberately strips nav/header/footer chrome first so menu links are not mistaken for notices.
 */
import * as cheerio from 'cheerio';

import { collapseWhitespace, normaliseListingItems } from '../normalise.js';
import { fetchWithGuards } from './fetchWithGuards.js';

const DATE_HINT_REGEX =
  /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i;

function extractDateText(node, dateSelector) {
  const dateEl = dateSelector
    ? node.find(dateSelector).first()
    : node.find('.notice-date, .date, time, td:last-child').first();
  const explicitDate = dateEl.length ? collapseWhitespace(dateEl.text()) : '';
  if (explicitDate) return explicitDate;
  const match = node.text().match(DATE_HINT_REGEX);
  return match ? match[1] : '';
}

function extractListingItem(node, selectorConfig) {
  const linkEl = node.find(selectorConfig.linkSelector || 'a[href]').first();
  const titleEl = selectorConfig.titleSelector
    ? node.find(selectorConfig.titleSelector).first()
    : linkEl;
  const rawTitle = titleEl.length ? titleEl.text() : node.text();
  const title = collapseWhitespace(rawTitle || '');
  const href = linkEl.attr('href') || '';

  if (!title || (!href && !selectorConfig.itemSelector)) return null;
  return {
    title,
    href,
    dateText: extractDateText(node, selectorConfig.dateSelector),
  };
}

/**
 * Extracts normalized listing items and content hash from notice-board HTML.
 *
 * @param {string} html - Raw HTML response body.
 * @param {string} baseUrl - Final URL used to resolve relative notice links.
 * @param {object} [selectorConfig] - Optional custom CSS selectors (`itemSelector`, `linkSelector`, `titleSelector`, `dateSelector`).
 * @returns {{ items: Array<object>, contentHash: string, textExcerpt: string }} Normalized listing payload.
 */
export function parseListingHtml(html, baseUrl, selectorConfig = {}) {
  const $ = cheerio.load(html || '');
  $('script, style, nav, header, footer').remove();

  const rawItems = [];
  const itemSelector =
    selectorConfig.itemSelector ||
    '.notice-list li, .notice-item, ul.notices li, table tbody tr, main li, .news-list li, li';

  $(itemSelector).each((_idx, el) => {
    const item = extractListingItem($(el), selectorConfig);
    if (item) rawItems.push(item);
  });

  return normaliseListingItems(rawItems, baseUrl);
}

/**
 * Fetches a listing source via guards and parses its HTML notice items.
 *
 * @param {object} source - Monitored `Source` document (`url`, `selectorConfig`).
 * @param {object} [options] - Fetch/guard options forwarded to `fetchWithGuards`.
 * @returns {Promise<object>} `notModified` metadata or parsed listing items with headers.
 * @throws {Error} With `status` property when upstream returns non-2xx HTTP status.
 */
export async function fetchListing(source, options = {}) {
  const res = await fetchWithGuards(source, options);
  if (res.notModified) {
    return { notModified: true, etag: res.etag, lastModified: res.lastModified };
  }
  if (res.status < 200 || res.status >= 300) {
    const err = new Error(`Listing fetch failed with HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const html = res.buffer.toString('utf8');
  const normalised = parseListingHtml(html, res.finalUrl, source.selectorConfig || {});

  return {
    notModified: false,
    status: res.status,
    finalUrl: res.finalUrl,
    etag: res.etag,
    lastModified: res.lastModified,
    ...normalised,
  };
}
