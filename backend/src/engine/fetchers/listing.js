import * as cheerio from 'cheerio';
import { collapseWhitespace, normaliseListingItems } from '../normalise.js';
import { fetchWithGuards } from './fetchWithGuards.js';

const DATE_HINT_REGEX =
  /\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})\b/i;

export function parseListingHtml(html, baseUrl, selectorConfig = {}) {
  const $ = cheerio.load(html || '');
  $('script, style, nav, header, footer').remove();

  const rawItems = [];
  const itemSelector =
    selectorConfig.itemSelector ||
    '.notice-list li, .notice-item, ul.notices li, table tbody tr, main li, .news-list li, li';

  $(itemSelector).each((_idx, el) => {
    const node = $(el);
    const linkEl = selectorConfig.linkSelector
      ? node.find(selectorConfig.linkSelector).first()
      : node.find('a[href]').first();
    const titleEl = selectorConfig.titleSelector
      ? node.find(selectorConfig.titleSelector).first()
      : linkEl;
    const dateEl = selectorConfig.dateSelector
      ? node.find(selectorConfig.dateSelector).first()
      : node.find('.notice-date, .date, time, td:last-child').first();

    const title = collapseWhitespace((titleEl.length ? titleEl.text() : node.text()) || '');
    const href = linkEl.attr('href') || '';
    let dateText = collapseWhitespace(dateEl.length ? dateEl.text() : '');
    if (!dateText) {
      const match = node.text().match(DATE_HINT_REGEX);
      if (match) dateText = match[1];
    }

    if (title && (href || selectorConfig.itemSelector)) {
      rawItems.push({ title, href, dateText });
    }
  });

  return normaliseListingItems(rawItems, baseUrl);
}

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
