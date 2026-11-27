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

export async function processLinkIntake({ url, category, state, title, fetchOptions = {} }) {
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

  const mime = (fetched.contentType || '').split(';')[0].trim().toLowerCase();
  const raw = fetched.buffer.toString('utf8');
  let type = 'page';
  let detectedTitle = title || new URL(fetched.finalUrl).hostname;
  let unsupported = false;
  let preview = '';

  if (mime.includes('xml') || mime.includes('rss') || mime.includes('atom')) {
    const feed = await parseRssXml(raw, fetched.finalUrl);
    type = 'rss';
    if (!title && feed.feedTitle) detectedTitle = feed.feedTitle;
    preview = feed.textExcerpt;
  } else if (mime.includes('pdf')) {
    type = 'page';
    preview = 'PDF notice document';
  } else {
    const pageParsed = parsePageHtml(raw, fetched.finalUrl);
    if (pageParsed.unsupported) {
      unsupported = true;
      if (!title && pageParsed.title) detectedTitle = pageParsed.title;
    } else {
      const listingParsed = parseListingHtml(raw, fetched.finalUrl);
      if (listingParsed.items.length >= 3) {
        type = 'listing';
        preview = listingParsed.textExcerpt;
      } else {
        type = 'page';
        preview = pageParsed.textExcerpt;
      }
      if (!title && pageParsed.title) detectedTitle = pageParsed.title;
    }
  }

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

export async function processPhotoIntake({ userId, imageBase64, mimeType, aiRouter }) {
  const quota = await consumeUserDailyQuota({ userId, kind: 'photo' });
  if (!quota.allowed) {
    throw new AppError(429, 'PHOTO_QUOTA_EXCEEDED', 'Daily limit of 5 photo scans reached');
  }

  const routerAi = aiRouter ?? createAiRouter();
  let extracted;
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
    extracted = photoExtractSchema.parse(visionOutput);
  } catch (err) {
    throw new AppError(502, 'VISION_FAILED', err?.message || 'Could not read notice photo');
  }

  const proposals = [];
  const seenKeys = new Set();
  const terms = [extracted.examOrScheme, extracted.organization]
    .flatMap((s) => String(s || '').split(/\s+/))
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)
    .slice(0, 5);

  if (terms.length > 0) {
    const regex = new RegExp(terms.map(escapeRegex).join('|'), 'i');
    const catalogMatches = await Source.find({ name: regex, unsupported: { $ne: true } })
      .sort({ followerCount: -1 })
      .limit(3)
      .lean();

    for (const s of catalogMatches) {
      if (proposals.length >= 3) break;
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
  }

  if (proposals.length < 3 && extracted.url && /^https?:\/\//i.test(extracted.url)) {
    proposals.push({
      kind: 'link',
      title: extracted.examOrScheme || extracted.organization || extracted.url,
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
        title: extracted.examOrScheme || extracted.organization || searchQuery,
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
