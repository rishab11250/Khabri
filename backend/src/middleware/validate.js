export function validate(schemas) {
  return (req, _res, next) => {
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    if (schemas.query) {
      const parsedQuery = schemas.query.parse(req.query);
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
