/**
 * Queries curated notice sources for catalog browsing and trending discovery.
 * Deliberately excludes `unsupported` SPA sources from trending lists and caps queries cleanly.
 */
import { Source } from '../models/index.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatSource(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    url: doc.url,
    type: doc.type,
    category: doc.category,
    state: doc.state,
    language: doc.language,
    trust: doc.trust,
    isDemo: Boolean(doc.isDemo),
    unsupported: Boolean(doc.unsupported),
    followerCount: doc.followerCount ?? 0,
    lastFetchedAt: doc.lastFetchedAt ?? null,
  };
}

/**
 * Lists up to 50 catalog sources filtered optionally by category, state, and search text.
 *
 * @param {object} params - Catalog query filters.
 * @param {string} [params.category] - Source category filter.
 * @param {string} [params.state] - Indian state or `'All India'` filter.
 * @param {string} [params.q] - Substring search matched against name, state, or category.
 * @returns {Promise<Array<object>>} Formatted catalog sources.
 */
export async function listCatalogSources({ category, state, q }) {
  const filter = {};

  if (category) {
    filter.category = category;
  }
  if (state) {
    filter.state = state;
  }
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { state: regex }, { category: regex }];
  }

  const docs = await Source.find(filter)
    .sort({ isDemo: -1, followerCount: -1, name: 1 })
    .limit(50)
    .lean();

  return docs.map(formatSource);
}

/**
 * Returns the top 10 supported sources ordered by follower count for Discover trending cards.
 *
 * @returns {Promise<Array<object>>} Formatted trending sources.
 */
export async function listTrendingSources() {
  const docs = await Source.find({ unsupported: { $ne: true } })
    .sort({ followerCount: -1, isDemo: -1, name: 1 })
    .limit(10)
    .lean();

  return docs.map(formatSource);
}
