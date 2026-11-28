/**
 * Normalizes scraped HTML, text, URLs, and notice listings into canonical hashable forms.
 * Deliberately strips tracking query params and volatile footer/visitor noise so hashes change
 * only on real content updates.
 */
import { createHash } from 'node:crypto';

import * as cheerio from 'cheerio';

const NOISE_LINE_PATTERNS = [
  /^\s*(visitors?|hits|page\s*views?)\s*:?\s*\d[\d,]*\s*$/i,
  /^\s*you\s+are\s+visitor\s+(no\.?|number)?\s*:?\s*\d[\d,]*\s*$/i,
  /^\s*last\s+(updated|modified)\s*(on)?\s*:?.*$/i,
  /^\s*(server\s+time|current\s+time)\s*:?.*$/i,
  /^\s*copyright\s*©?.*$/i,
  /^\s*skip\s+to\s+main\s+content\s*$/i,
];

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'ref',
]);

/**
 * Normalizes non-breaking spaces, inline whitespace, and excessive blank lines.
 *
 * @param {string} text - Raw text string.
 * @returns {string} Trimmed text with normalized spacing.
 */
export function collapseWhitespace(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Removes empty lines and dynamic page chrome lines such as visitor counters or timestamps.
 *
 * @param {string} text - Raw multi-line text.
 * @returns {string} Filtered lines joined by newlines.
 */
export function stripNoiseLines(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => collapseWhitespace(line))
    .filter((line) => line.length > 0)
    .filter((line) => !NOISE_LINE_PATTERNS.some((re) => re.test(line)));
  return lines.join('\n');
}

/**
 * Resolves `rawHref` against `baseUrl` and strips URL fragments and tracking query parameters.
 *
 * @param {string} rawHref - Raw `href` attribute value.
 * @param {string} [baseUrl] - Page URL used to resolve relative links.
 * @returns {string} Canonical HTTP(S) URL, or empty string for anchors/`javascript:`/invalid URLs.
 */
function normaliseUrl(rawHref, baseUrl) {
  if (!rawHref) return '';
  const trimmed = String(rawHref).trim();
  if (!trimmed || trimmed.startsWith('#') || /^javascript:/i.test(trimmed)) {
    return '';
  }
  try {
    const resolved = baseUrl ? new URL(trimmed, baseUrl) : new URL(trimmed);
    resolved.hash = '';
    for (const key of [...resolved.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        resolved.searchParams.delete(key);
      }
    }
    return resolved.toString();
  } catch {
    return '';
  }
}

/**
 * Computes a deterministic SHA-256 hex digest of a string or JSON-serializable object.
 *
 * @param {string|object} value - Content payload to hash.
 * @returns {string} 64-character hex digest.
 */
function computeContentHash(value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Loads HTML into Cheerio and strips non-content chrome (scripts, nav, headers, marquees, ads).
 *
 * @param {string} html - Raw HTML document.
 * @returns {Function} Cheerio root query helper `$`.
 */
function stripHtmlChrome(html) {
  const $ = cheerio.load(html || '');
  $(
    'script, style, noscript, iframe, svg, nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .marquee, marquee, .visitor-counter, #visitor-counter, .ads, .advertisement',
  ).remove();
  return $;
}

/**
 * Detects SPA shells (`#root`/`#app`/`#__next` or JS-required notices with near-empty body text).
 *
 * @param {string} html - Raw HTML markup.
 * @param {string} extractedText - Cleaned text extracted from the markup.
 * @returns {boolean} True when server-side HTML scraping cannot monitor this page directly.
 */
function isJsRenderedShell(html, extractedText) {
  const $ = cheerio.load(html || '');
  const hasRootMount =
    $('#root, #app, #__next').length > 0 || /enable\s+javascript/i.test(html || '');
  const cleanTextLen = collapseWhitespace(extractedText).length;
  // Require both a framework mount/warning AND under 120 chars of text to avoid false positives on hybrid SSR pages.
  return hasRootMount && cleanTextLen < 120;
}

/**
 * Builds normalized page text, bounded excerpt, JS-shell flag, and content hash.
 *
 * @param {object} params - Extracted page inputs.
 * @param {string} params.html - Raw HTML string.
 * @param {string} [params.readableText] - Main-article text from Readability.
 * @param {string} params.baseUrl - Canonical final URL of the fetched page.
 * @returns {{ text: string, textExcerpt: string, unsupported: boolean, contentHash: string }} Normalized page summary.
 */
export function normalisePageResult({ html, readableText, baseUrl }) {
  const cleanedFromReadable = stripNoiseLines(readableText || '');
  let text = cleanedFromReadable;

  if (!text) {
    const $ = stripHtmlChrome(html);
    text = stripNoiseLines($('main, article, [role="main"], body').first().text());
  }

  const unsupported = isJsRenderedShell(html, text);
  const excerpt = text.slice(0, 4000);
  const contentHash = computeContentHash({ type: 'page', baseUrl: normaliseUrl(baseUrl), text });

  return {
    text,
    textExcerpt: excerpt,
    unsupported,
    contentHash,
  };
}

/**
 * Deduplicates and normalizes notice listing items and computes an order-independent hash.
 *
 * @param {Array<{ title?: string, href?: string, dateText?: string }>} rawItems - Extracted raw rows.
 * @param {string} baseUrl - Base URL used to resolve relative notice links.
 * @returns {{ items: Array<object>, contentHash: string, textExcerpt: string }} Normalized listing payload.
 */
export function normaliseListingItems(rawItems, baseUrl) {
  const seen = new Set();
  const items = [];

  for (const raw of rawItems || []) {
    const title = collapseWhitespace(stripNoiseLines(raw.title || ''));
    if (title.length < 4) continue;
    const href = normaliseUrl(raw.href, baseUrl);
    const dateText = collapseWhitespace(raw.dateText || '');
    const dedupeKey = `${title.toLowerCase()}|${href}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    items.push({ title, href, dateText });
  }

  const contentHash = computeContentHash({
    type: 'listing',
    items: items.map((i) => `${i.title}|${i.href}|${i.dateText}`).sort(),
  });

  return {
    items,
    contentHash,
    textExcerpt: items
      .slice(0, 15)
      .map((i) => (i.dateText ? `${i.title} (${i.dateText})` : i.title))
      .join('\n'),
  };
}
