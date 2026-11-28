/**
 * Parses Express `params`, `query`, and `body` against Zod schemas before controllers run.
 * Deliberately redefines `req.query` via `Object.defineProperty` because Express 5 makes `req.query` a read-only getter.
 */
/**
 * Builds validation middleware parsing `params`, `query`, and `body` slices via Zod.
 *
 * @param {object} schemas - Optional `{ params, query, body }` Zod schemas.
 * @returns {Function} Express middleware mutating validated request properties cleanly.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
      // Express 5 defines req.query on the prototype as a getter-only property; shadow it explicitly.
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    return next();
  };
}
