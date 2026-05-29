'use strict';

const { supabase, setGymContext } = require('../services/supabase');
const ApiError = require('../utils/ApiError');

/**
 * For unauthenticated tenant-scoped routes (register, login) the gym is not yet
 * known from a JWT. Resolve it from request headers instead:
 *   X-Gym-Id   — gym UUID, or
 *   X-Gym-Slug — gym slug (e.g. derived from subdomain by the edge/proxy)
 * Attaches req.gym = { id, slug, ... } and sets the RLS context.
 */
async function resolveGym(req, res, next) {
  try {
    const gymId = req.headers['x-gym-id'];
    const slug = req.headers['x-gym-slug'];
    if (!gymId && !slug) {
      throw ApiError.badRequest('Missing X-Gym-Id or X-Gym-Slug header', 'NO_GYM');
    }

    const query = supabase.from('gyms').select('*').limit(1);
    const { data, error } = gymId
      ? await query.eq('id', gymId)
      : await query.eq('slug', slug);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw ApiError.notFound('Gym not found', 'GYM_NOT_FOUND');
    }

    req.gym = data[0];
    await setGymContext(req.gym.id);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = resolveGym;
