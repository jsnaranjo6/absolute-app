'use strict';

const { supabase } = require('./supabase');
const { decodeBarcode } = require('../utils/barcode');
const ApiError = require('../utils/ApiError');

/** Resolve the member being checked in, from a barcode or an explicit id. */
function resolveTargetMember({ gymId, barcode, memberId, fallbackMemberId }) {
  if (barcode) {
    let decoded;
    try {
      decoded = decodeBarcode(barcode);
    } catch (_e) {
      throw ApiError.badRequest('Invalid barcode', 'BAD_BARCODE');
    }
    if (decoded.gymId !== gymId) {
      throw ApiError.forbidden('Barcode belongs to another gym', 'CROSS_GYM_BARCODE');
    }
    return { memberId: decoded.memberId, method: 'barcode' };
  }
  if (memberId) return { memberId, method: 'manual' };
  return { memberId: fallbackMemberId, method: 'manual' };
}

/** True if the member has a subscription that is active and not past end_date. */
async function hasActiveSubscription(gymId, memberId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, end_date')
    .eq('gym_id', gymId)
    .eq('member_id', memberId)
    .in('status', ['active', 'frozen'])
    .gte('end_date', today)
    .limit(1);
  if (error) throw error;
  // Frozen still counts as "has a subscription" but a gym may bar entry while
  // frozen; spec only requires rejecting expired / missing. Treat active as pass.
  return !!(data && data.find((s) => s.status === 'active'));
}

/** Bump denormalized stats: total_visits and current/longest streak. */
async function bumpStats(gymId, memberId, checkedInAt) {
  const { data } = await supabase
    .from('member_stats')
    .select('*')
    .eq('gym_id', gymId)
    .eq('member_id', memberId)
    .limit(1);
  const stats = data && data[0];
  const day = checkedInAt.slice(0, 10);

  if (!stats) {
    await supabase.from('member_stats').insert({
      gym_id: gymId, member_id: memberId, current_streak: 1, longest_streak: 1, total_visits: 1,
    });
    return;
  }

  const lastDay = stats.updated_at ? stats.updated_at.slice(0, 10) : null;
  let current = stats.current_streak || 0;
  if (lastDay === day) {
    // already counted today; visits still increments for raw visit count
  } else {
    const yesterday = new Date(new Date(day).getTime() - 86400000).toISOString().slice(0, 10);
    current = lastDay === yesterday ? current + 1 : 1;
  }
  const longest = Math.max(stats.longest_streak || 0, current);

  await supabase
    .from('member_stats')
    .update({ current_streak: current, longest_streak: longest, total_visits: (stats.total_visits || 0) + 1 })
    .eq('gym_id', gymId)
    .eq('member_id', memberId);
}

/** Log a check-in after validating an active subscription. */
async function checkIn({ gymId, targetMemberId, method }) {
  const active = await hasActiveSubscription(gymId, targetMemberId);
  if (!active) {
    throw ApiError.forbidden('No active subscription', 'NO_ACTIVE_SUBSCRIPTION');
  }

  const checkedInAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('check_ins')
    .insert({ gym_id: gymId, member_id: targetMemberId, checked_in_at: checkedInAt, method })
    .select('*')
    .single();
  if (error) throw error;

  await bumpStats(gymId, targetMemberId, checkedInAt);
  return data;
}

/** Admin: list check-ins with optional date-range / member filters. */
async function list(gymId, { startDate, endDate, memberId, limit = 100 } = {}) {
  let q = supabase
    .from('check_ins')
    .select('*')
    .eq('gym_id', gymId)
    .order('checked_in_at', { ascending: false })
    .limit(Math.min(limit, 500));
  if (memberId) q = q.eq('member_id', memberId);
  if (startDate) q = q.gte('checked_in_at', startDate);
  if (endDate) q = q.lte('checked_in_at', endDate);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

async function listForMember(gymId, memberId, { limit = 100 } = {}) {
  return list(gymId, { memberId, limit });
}

module.exports = { resolveTargetMember, checkIn, list, listForMember, hasActiveSubscription };
