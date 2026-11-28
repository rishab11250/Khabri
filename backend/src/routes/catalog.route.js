/**
 * Mounts public read-only catalog search and trending source endpoints.
 */
import { Router } from 'express';

import { getCatalog, getTrending } from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.js';
import { catalogQuerySchema } from '../validators/catalog.validator.js';

/**
 * Builds the `/v1/catalog` Express router.
 *
 * @returns {Router} Configured Express router.
 */
export function createCatalogRouter() {
  const router = Router();

  // Lists filtered notice catalog sources (auth: public; errors: 400 VALIDATION_ERROR).
  router.get('/', validate({ query: catalogQuerySchema }), getCatalog);
  // Returns top 10 supported sources by follower count (auth: public; errors: 500 INTERNAL_ERROR).
  router.get('/trending', getTrending);

  return router;
}
