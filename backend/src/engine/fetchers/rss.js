import Parser from 'rss-parser';
import { normaliseListingItems } from '../normalise.js';
import { fetchWithGuards } from './fetchWithGuards.js';

const rssParser = new Parser();

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
