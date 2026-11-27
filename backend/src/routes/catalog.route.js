import { Router } from 'express';
import { getCatalog, getTrending } from '../controllers/catalog.controller.js';
import { validate } from '../middleware/validate.js';
import { catalogQuerySchema } from '../validators/catalog.validator.js';

export function createCatalogRouter() {
  const router = Router();

  router.get('/', validate({ query: catalogQuerySchema }), getCatalog);
  router.get('/trending', getTrending);

  return router;
}
