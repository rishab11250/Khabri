/**
 * Handles custom watch intake via direct URL probing and camera/gallery notice photo extraction.
 * Deliberately classifies JS-rendered SPAs as `unsupported` and suggests a web search fallback
 * instead of silently registering broken monitors.
 */
import { consumeUserDailyQuota } from '../ai/quota.js';
import { createAiRouter } from '../ai/router.js';
import { resolveTrustTag } from '../ai/trust.js';
import { fetchWithGuards } from '../engine/fetchers/fetchWithGuards.js';
import { parseListingHtml } from '../engine/fetchers/listing.js';
import { parsePageHtml } from '../engine/fetchers/page.js';
import { parseRssXml } from '../engine/fetchers/rss.js';
import { AppError } from '../middleware/envelope.js';
import { Source } from '../models/index.js';
import { SsrfError } from '../security/ssrfGuard.js';
import { PHOTO_VISION_JSON_SCHEMA, photoExtractSchema } from '../validators/intake.validator.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function classifyHtmlSource(raw, finalUrl, explicitTitle, fallbackTitle) {
  const pageParsed = parsePageHtml(raw, finalUrl);
  const detectedTitle = explicitTitle || pageParsed.title || fallbackTitle;
  if (pageParsed.unsupported) {
    return { type: 'page', detectedTitle, unsupported: true, preview: '' };
  }

  const listingParsed = parseListingHtml(raw, finalUrl);
  // Treat pages with 3+ extracted notice links as listings so diffing tracks individual entries.
  const isListing = listingParsed.items.length >= 3;
  return {
    type: isListing ? 'listing' : 'page',
    detectedTitle,
    unsupported: false,
    preview: isListing ? listingParsed.textExcerpt : pageParsed.textExcerpt,
  };
}

async function classifyFetchedSource(fetched, explicitTitle) {
  const mime = (fetched.contentType || '').split(';')[0].trim().toLowerCase();
  const raw = fetched.buffer.toString('utf8');
  const fallbackTitle = explicitTitle || new URL(fetched.finalUrl).hostname;

  if (mime.includes('xml') || mime.includes('rss') || mime.includes('atom')) {
    const feed = await parseRssXml(raw, fetched.finalUrl);
    return {
      type: 'rss',
      detectedTitle: explicitTitle || feed.feedTitle || fallbackTitle,
      unsupported: false,
      preview: feed.textExcerpt,
    };
  }

  if (mime.includes('pdf')) {
    return {
      type: 'page',
      detectedTitle: fallbackTitle,
      unsupported: false,
      preview: 'PDF notice document',
    };
  }

  return classifyHtmlSource(raw, fetched.finalUrl, explicitTitle, fallbackTitle);
}

async function fetchSourceSafely(url, fetchOptions) {
  let fetched;
  try {
    fetched = await fetchWithGuards(url, fetchOptions);
  } catch (err) {
    if (err instanceof SsrfError || err?.code === 'ROBOTS_DISALLOWED') {
      throw new AppError(400, err.code || 'FETCH_BLOCKED', err.message);
    }
    throw new AppError(422, 'FETCH_FAILED', err?.message || 'Could not fetch URL');
  }

  if (fetched.status < 200 || fetched.status >= 300) {
    throw new AppError(422, 'UPSTREAM_ERROR', `Source returned HTTP ${fetched.status}`);
  }
  return fetched;
}

/**
 * Fetches, classifies, and upserts a candidate URL into `Source`, returning a preview and monitor support verdict.
 *
 * @param {object} params - Link intake payload and fetch test overrides.
 * @param {string} params.url - Candidate external URL submitted by the user.
 * @param {string} params.category - Initial source category.
 * @param {string} params.state - Initial region/state tag.
 * @param {string} [params.title] - Optional user-supplied display name.
 * @param {object} [params.fetchOptions] - SSRF/mock HTTP options forwarded to `fetchWithGuards`.
 * @returns {Promise<object>} Support flag, suggested fallback query if SPA, preview snippet, and upserted source.
 * @throws {AppError} When blocked by SSRF/robots (400) or upstream fetch fails (422).
 */
export async function processLinkIntake({ url, category, state, title, fetchOptions = {} }) {
  const fetched = await fetchSourceSafely(url, fetchOptions);
  const { type, detectedTitle, unsupported, preview } = await classifyFetchedSource(fetched, title);
  const trust = resolveTrustTag({ url: fetched.finalUrl });
  const source = await Source.findOneAndUpdate(
    { url: fetched.finalUrl },
    {
      $setOnInsert: {
        name: detectedTitle.slice(0, 120),
        url: fetched.finalUrl,
        type,
        category,
        state,
        trust,
        nextDueAt: new Date(),
      },
      $set: { unsupported },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  return {
    supported: !unsupported,
    suggestedType: unsupported ? 'search' : type,
    suggestedQuery: unsupported ? `${detectedTitle} official notice` : null,
    preview: preview.slice(0, 400),
    source: {
      id: String(source._id),
      name: source.name,
      url: source.url,
      type: source.type,
      category: source.category,
      state: source.state,
      trust: source.trust,
      unsupported: Boolean(source.unsupported),
    },
  };
}

async function extractPhotoNotice({ imageBase64, mimeType, aiRouter }) {
  const routerAi = aiRouter ?? createAiRouter();
  try {
    const { result: visionOutput } = await routerAi.vision({
      role: 'user',
      imageBase64,
      mimeType,
      systemInstruction:
        'Extract the Indian exam, recruitment, scholarship, or scheme notice details from this photo. Return JSON only.',
      prompt:
        'Identify organization, examOrScheme name, any dates, any printed URL (empty string if none), and a concise Google search query to find its official notice page.',
      jsonSchema: PHOTO_VISION_JSON_SCHEMA,
    });
    return photoExtractSchema.parse(visionOutput);
  } catch (err) {
    throw new AppError(502, 'VISION_FAILED', err?.message || 'Could not read notice photo');
  }
}

async function findMatchingCatalogProposals(extracted) {
  const terms = [extracted.examOrScheme, extracted.organization]
    .flatMap((s) => String(s || '').split(/\s+/))
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  if (terms.length === 0) return [];

  const regex = new RegExp(terms.map(escapeRegex).join('|'), 'i');
  const catalogMatches = await Source.find({ name: regex, unsupported: { $ne: true } })
    .sort({ followerCount: -1 })
    .limit(3)
    .lean();

  const seenKeys = new Set();
  const proposals = [];
  for (const s of catalogMatches) {
    const key = String(s._id);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    proposals.push({
      kind: 'catalog',
      sourceId: key,
      title: s.name,
      url: s.url,
      category: s.category,
      trust: s.trust,
    });
  }
  return proposals;
}

/**
 * Extracts exam/scheme fields from a notice photograph and returns up to 3 actionable watch proposals.
 * Enforces the per-user daily photo scan cap (`USER_DAILY_CAPS.photo = 5`).
 *
 * @param {object} params - Photo payload and caller context.
 * @param {string|object} params.userId - Authenticated user ID.
 * @param {string} params.imageBase64 - Base64-encoded image bytes.
 * @param {string} params.mimeType - Image MIME type (`image/jpeg`, `image/png`, `image/webp`).
 * @param {object} [params.aiRouter] - Optional AI router override for testing.
 * @returns {Promise<{ extracted: object, proposals: Array<object>, remainingToday: number }>} Scan output.
 * @throws {AppError} When daily photo quota is exhausted (429) or vision extraction fails (502).
 */
export async function processPhotoIntake({ userId, imageBase64, mimeType, aiRouter }) {
  const quota = await consumeUserDailyQuota({ userId, kind: 'photo' });
  if (!quota.allowed) {
    throw new AppError(429, 'PHOTO_QUOTA_EXCEEDED', 'Daily limit of 5 photo scans reached');
  }

  const extracted = await extractPhotoNotice({ imageBase64, mimeType, aiRouter });
  const proposals = await findMatchingCatalogProposals(extracted);
  const fallbackTitle = extracted.examOrScheme || extracted.organization;

  if (proposals.length < 3 && extracted.url && /^https?:\/\//i.test(extracted.url)) {
    proposals.push({
      kind: 'link',
      title: fallbackTitle || extracted.url,
      url: extracted.url,
      category: 'exam',
      trust: resolveTrustTag({ url: extracted.url }),
    });
  }

  if (proposals.length < 3) {
    const searchQuery =
      extracted.query ||
      `${extracted.organization} ${extracted.examOrScheme} official notice`.trim();
    if (searchQuery) {
      proposals.push({
        kind: 'search',
        title: fallbackTitle || searchQuery,
        query: searchQuery,
        category: 'exam',
        trust: 'reported',
      });
    }
  }

  return {
    extracted,
    proposals: proposals.slice(0, 3),
    remainingToday: Math.max(0, quota.limit - quota.used),
  };
}
