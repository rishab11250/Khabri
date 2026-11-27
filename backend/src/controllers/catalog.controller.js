import { ok } from '../middleware/envelope.js';
import { listCatalogSources, listTrendingSources } from '../services/catalog.service.js';

export async function getCatalog(req, res) {
  const sources = await listCatalogSources(req.query);
  return ok(res, { sources });
}

export async function getTrending(_req, res) {
  const sources = await listTrendingSources();
  return ok(res, { sources });
}
