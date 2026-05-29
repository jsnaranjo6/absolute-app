'use strict';

const ApiError = require('../utils/ApiError');

/** 404 fallthrough for unmatched routes. */
function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Central error handler. Known ApiErrors surface their message; everything else
 * is a generic 500. In production we never leak stack traces or internal detail.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.statusCode || 500;
  const operational = err.isOperational === true;

  if (status >= 500) {
    console.error('[error]', err.stack || err);
  }

  const body = {
    error: {
      message: operational || !isProd ? err.message : 'Internal server error',
      code: err.code || undefined,
      details: err.details || undefined,
    },
  };

  if (!isProd && status >= 500) {
    body.error.stack = err.stack;
  }

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
