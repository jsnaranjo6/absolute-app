'use strict';

const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Fail fast in non-test envs; tests may stub the client.
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
}

// Service-role client. Bypasses RLS by design (see 0013_rls.sql); the app layer
// is responsible for filtering every query by gym_id.
const supabase = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_SERVICE_ROLE_KEY || 'test-key', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Set the per-request tenant context so RLS policies (and any non-service-role
 * path) resolve current_gym_id(). Best-effort: failures here never block the
 * request because the service role already enforces gym_id at the query level.
 * @param {string} gymId
 */
async function setGymContext(gymId) {
  if (!gymId) return;
  try {
    await supabase.rpc('set_gym_context', { p_gym_id: gymId });
  } catch (_err) {
    // RPC is a backstop; query-level gym_id filtering is authoritative.
  }
}

module.exports = { supabase, setGymContext };
