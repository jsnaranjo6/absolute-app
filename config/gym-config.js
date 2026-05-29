'use strict';

/**
 * White-label feature flags per gym.
 *
 * Keyed by gym_id (UUID string). Any gym not present here — or any flag a gym
 * omits — falls back to DEFAULTS. Per-gym flags are merged over the defaults so
 * a gym only needs to declare the flags it overrides.
 *
 * Live overrides written through PUT /api/v1/admin/gym/config are persisted on
 * gyms.feature_flags (JSONB) and take precedence over this file at request time;
 * see services/gymConfigService.js. This file is the build-time fallback.
 */

const DEFAULTS = Object.freeze({
  cycling_enabled: true,
  wallet_enabled: true,
  leaderboard_enabled: true,
  machine_help_enabled: true,
  notifications_enabled: true,
  no_show_fee: 5,
  late_cancel_fee: 3,
  max_freeze_days: 30,
  // Churn detection windows (Phase 8)
  churn_renewal_window_days: 7,
  churn_inactivity_days: 14,
});

const GYM_OVERRIDES = Object.freeze({
  // Example overrides keyed by gym_id:
  // '11111111-1111-1111-1111-111111111111': {
  //   cycling_enabled: false,
  //   no_show_fee: 10,
  // },
});

/**
 * Resolve the effective feature-flag set for a gym.
 * @param {string} gymId
 * @param {object} [dbFlags] - feature_flags JSONB loaded from the gyms row, if any.
 * @returns {object} merged, frozen config
 */
function getGymConfig(gymId, dbFlags) {
  const fileOverride = GYM_OVERRIDES[gymId] || {};
  return Object.freeze({
    ...DEFAULTS,
    ...fileOverride,
    ...(dbFlags && typeof dbFlags === 'object' ? dbFlags : {}),
  });
}

/**
 * Resolve a single flag value for a gym.
 * @param {string} gymId
 * @param {string} flag
 * @param {object} [dbFlags]
 */
function getFlag(gymId, flag, dbFlags) {
  return getGymConfig(gymId, dbFlags)[flag];
}

module.exports = { DEFAULTS, getGymConfig, getFlag };
