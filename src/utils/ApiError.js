'use strict';

/**
 * Operational error with an HTTP status. Anything thrown that is an ApiError is
 * treated as a known, client-facing condition; everything else is a 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, code, details) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || undefined;
    this.details = details || undefined;
    this.isOperational = true;
  }

  static badRequest(msg, code) { return new ApiError(400, msg || 'Bad request', code); }
  static unauthorized(msg, code) { return new ApiError(401, msg || 'Unauthorized', code); }
  static forbidden(msg, code) { return new ApiError(403, msg || 'Forbidden', code); }
  static notFound(msg, code) { return new ApiError(404, msg || 'Not found', code); }
  static conflict(msg, code) { return new ApiError(409, msg || 'Conflict', code); }
  static paymentRequired(msg, code) { return new ApiError(402, msg || 'Payment required', code); }
  static unprocessable(msg, code) { return new ApiError(422, msg || 'Unprocessable', code); }
}

module.exports = ApiError;
