'use strict';

const { verifyToken } = require('../utils/jwt');
const { setGymContext } = require('../services/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Validate the Bearer token, attach { member_id, gym_id, role } to req.user,
 * and set the per-request gym RLS context. gym_id is ALWAYS taken from the
 * token here — never from the body or params.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing Bearer token', 'NO_TOKEN');
    }

    const payload = verifyToken(token);
    if (!payload.member_id || !payload.gym_id) {
      throw ApiError.unauthorized('Malformed token payload', 'BAD_TOKEN');
    }

    req.user = {
      member_id: payload.member_id,
      gym_id: payload.gym_id,
      role: payload.role || 'member',
    };

    await setGymContext(payload.gym_id);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
