import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { fetchListing, parseListingHtml } from '../src/engine/fetchers/listing.js';
import { fetchPage, parsePageHtml } from '../src/engine/fetchers/page.js';
import { fetchRss, parseRssXml } from '../src/engine/fetchers/rss.js';
import { clearRobotsCache } from '../src/security/robots.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function readFixture(name) {
  return fs.readFile(path.join(fixturesDir, name), 'utf8');
}

describe('normalise & fetchers with fixtures', () => {
  beforeEach(() => {
    clearRobotsCache();
  });

  it('normalises listing HTML, strips noise/tracking params, and produces stable hash', async () => {
    const html = await readFixture('notice-listing.html');
    const result = parseListingHtml(html, 'https://exam.gov.in/board');

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      title: 'Download Admit Card for Entrance Exam 2026',
      href: 'https://exam.gov.in/notices/admit-card-2026.pdf',
      dateText: '10 Dec 2026',
    });
    expect(result.items[1].href).toBe('https://exam.gov.in/notices/date-extension');

    const reordered = parseListingHtml(
      html.replace('admit-card-2026.pdf?utm_source=web', 'admit-card-2026.pdf'),
      'https://exam.gov.in/board',
    );
    expect(reordered.contentHash).toBe(result.contentHash);
  });

  it('extracts readable page text, strips visitor counters, and flags JS SPA shells', async () => {
    const html = await readFixture('notice-page.html');
    const parsed = parsePageHtml(html, 'https://scholarships.gov.in/renewal');

    expect(parsed.unsupported).toBe(false);
    expect(parsed.text).toContain('Post-Matric Scholarships until 30 December 2026');
    expect(parsed.text).not.toContain('991234');
    expect(parsed.text).not.toContain('Last updated on');

    const spaHtml = await readFixture('spa-shell.html');
    const spaParsed = parsePageHtml(spaHtml, 'https://spa.example.gov.in/');
    expect(spaParsed.unsupported).toBe(true);
  });

  it('parses RSS XML and strips tracking params', async () => {
    const xml = await readFixture('notice-feed.xml');
    const feed = await parseRssXml(xml, 'https://notices.example.gov.in/rss');

    expect(feed.feedTitle).toBe('Official Exam Feed');
    expect(feed.items).toHaveLength(2);
    expect(feed.items[0].href).toBe('https://notices.example.gov.in/merit-ii');
  });

  it('respects robots.txt disallow and conditional GET in fetchers', async () => {
    const html = await readFixture('notice-listing.html');
    const xml = await readFixture('notice-feed.xml');
    const pageHtml = await readFixture('notice-page.html');
    const lookupFn = async () => [{ address: '93.184.216.34', family: 4 }];

    const disallowClient = {
      request: async ({ url }) => {
        if (url.endsWith('/robots.txt')) {
          return {
            status: 200,
            headers: { 'content-type': 'text/plain' },
            data: Buffer.from('User-agent: *\nDisallow: /private/\n'),
          };
        }
        return { status: 200, headers: { 'content-type': 'text/html' }, data: Buffer.from(html) };
      },
    };

    await expect(
      fetchListing(
        { url: 'https://portal.gov.in/private/notices' },
        { lookupFn, httpClient: disallowClient, minHostDelayMs: 0 },
      ),
    ).rejects.toThrow(/Blocked by robots.txt/);

    const okClient = {
      request: async ({ url, headers }) => {
        if (url.endsWith('/robots.txt')) {
          return { status: 404, headers: { 'content-type': 'text/html' }, data: Buffer.alloc(0) };
        }
        if (headers['If-None-Match'] === '"etag-1"') {
          return { status: 304, headers: { etag: '"etag-1"' }, data: Buffer.alloc(0) };
        }
        if (url.endsWith('/rss')) {
          return {
            status: 200,
            headers: { 'content-type': 'application/rss+xml' },
            data: Buffer.from(xml),
          };
        }
        return {
          status: 200,
          headers: { 'content-type': 'text/html', etag: '"etag-1"' },
          data: Buffer.from(pageHtml),
        };
      },
    };

    const pageRes = await fetchPage(
      { url: 'https://portal.gov.in/scheme' },
      { lookupFn, httpClient: okClient, minHostDelayMs: 0 },
    );
    expect(pageRes.notModified).toBe(false);
    expect(pageRes.etag).toBe('"etag-1"');

    const cachedRes = await fetchPage(
      { url: 'https://portal.gov.in/scheme', etag: '"etag-1"' },
      { lookupFn, httpClient: okClient, minHostDelayMs: 0 },
    );
    expect(cachedRes.notModified).toBe(true);

    const rssRes = await fetchRss(
      { url: 'https://portal.gov.in/rss' },
      { lookupFn, httpClient: okClient, minHostDelayMs: 0 },
    );
    expect(rssRes.items).toHaveLength(2);
  });
});
