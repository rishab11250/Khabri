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

export function collapseWhitespace(text) {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripNoiseLines(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => collapseWhitespace(line))
    .filter((line) => line.length > 0)
    .filter((line) => !NOISE_LINE_PATTERNS.some((re) => re.test(line)));
  return lines.join('\n');
}

export function normaliseUrl(rawHref, baseUrl) {
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

export function computeContentHash(value) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return createHash('sha256').update(payload).digest('hex');
}

export function stripHtmlChrome(html) {
  const $ = cheerio.load(html || '');
  $(
    'script, style, noscript, iframe, svg, nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"], .marquee, marquee, .visitor-counter, #visitor-counter, .ads, .advertisement',
  ).remove();
  return $;
}

export function isJsRenderedShell(html, extractedText) {
  const $ = cheerio.load(html || '');
  const hasRootMount =
    $('#root, #app, #__next').length > 0 || /enable\s+javascript/i.test(html || '');
  const cleanTextLen = collapseWhitespace(extractedText).length;
  return hasRootMount && cleanTextLen < 120;
}

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
