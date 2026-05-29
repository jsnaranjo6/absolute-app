'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Validate req[source] against a zod schema. On success replaces req[source]
 * with the parsed (and coerced) value. On failure throws a 422 with field detail.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
