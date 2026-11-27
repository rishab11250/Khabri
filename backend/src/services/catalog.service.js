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

export async function listTrendingSources() {
  const docs = await Source.find({ unsupported: { $ne: true } })
    .sort({ followerCount: -1, isDemo: -1, name: 1 })
    .limit(10)
    .lean();

  return docs.map(formatSource);
}
