'use strict';

const jwt = require('jsonwebtoken');
const ApiError = require('./ApiError');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function assertSecret() {
  if (!SECRET) throw new Error('JWT_SECRET is not configured');
}

/**
 * Sign an access token. Payload is exactly { member_id, gym_id, role }.
 */
function signToken({ member_id, gym_id, role }) {
  assertSecret();
  return jwt.sign({ member_id, gym_id, role }, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  assertSecret();
  try {
    return jwt.verify(token, SECRET);
  } catch (_err) {
    throw ApiError.unauthorized('Invalid or expired token', 'INVALID_TOKEN');
  }
}

module.exports = { signToken, verifyToken, EXPIRES_IN };
