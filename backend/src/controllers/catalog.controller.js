/**
 * HTTP controller for curated catalog browsing and trending discovery endpoints.
 */
import { ok } from '../middleware/envelope.js';
import { listCatalogSources, listTrendingSources } from '../services/catalog.service.js';

/**
 * Handles GET `/v1/catalog` using validated query filters.
 *
 * @param {object} req - Express request (`req.query.category`, `state`, `q`).
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing filtered `sources`.
 */
export async function getCatalog(req, res) {
  const sources = await listCatalogSources(req.query);
  return ok(res, { sources });
}

/**
 * Handles GET `/v1/catalog/trending` returning top supported sources by follower count.
 *
 * @param {object} _req - Unused Express request.
 * @param {object} res - Express response.
 * @returns {Promise<object>} JSON envelope containing trending `sources`.
 */
export async function getTrending(_req, res) {
  const sources = await listTrendingSources();
  return ok(res, { sources });
}
