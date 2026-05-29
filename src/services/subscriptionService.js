'use strict';

const { supabase } = require('./supabase');
const { getGymConfig } = require('../../config/gym-config');
const { computeEndDate, addDays, PLAN_DAYS } = require('../utils/planDuration');
const wawa = require('./wawaTickets');
const ApiError = require('../utils/ApiError');

const today = () => new Date().toISOString().slice(0, 10);

async function gymFlags(gymId) {
  const { data } = await supabase.from('gyms').select('feature_flags').eq('id', gymId).single();
  return getGymConfig(gymId, data && data.feature_flags);
}

/** Member: current (most recent active, else most recent) subscription. */
async function getMine(gymId, memberId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('gym_id', gymId)
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const active = data.find((s) => s.status === 'active');
  return active || data[0] || null;
}

/** Admin: assign a subscription to a member. */
async function create(gymId, { member_id, plan_type, start_date, end_date, auto_renew }) {
  const start = start_date || today();
  let end = end_date;
  if (!end) {
    if (!PLAN_DAYS[plan_type]) {
      throw ApiError.badRequest("end_date required for plan_type 'special'", 'END_DATE_REQUIRED');
    }
    end = computeEndDate(plan_type, start);
  }
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      gym_id: gymId, member_id, plan_type, start_date: start, end_date: end,
      status: 'active', auto_renew: auto_renew !== false,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function getOrThrow(gymId, id) {
  const { data, error } = await supabase
    .from('subscriptions').select('*').eq('gym_id', gymId).eq('id', id).limit(1);
  if (error) throw error;
  if (!data || !data[0]) throw ApiError.notFound('Subscription not found', 'SUB_NOT_FOUND');
  return data[0];
}

async function update(gymId, id, patch) {
  await getOrThrow(gymId, id);
  const allowed = {};
  for (const k of ['plan_type', 'start_date', 'end_date', 'status', 'auto_renew']) {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  }
  const { data, error } = await supabase
    .from('subscriptions').update(allowed).eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

/** Freeze: pause the clock. Blocked once the yearly freeze allowance is spent. */
async function freeze(gymId, id) {
  const sub = await getOrThrow(gymId, id);
  if (sub.status === 'frozen') throw ApiError.conflict('Already frozen', 'ALREADY_FROZEN');
  if (sub.status !== 'active') throw ApiError.badRequest('Only active subscriptions can be frozen', 'NOT_ACTIVE');

  const flags = await gymFlags(gymId);
  if ((sub.freeze_days_used || 0) >= flags.max_freeze_days) {
    throw ApiError.forbidden('Freeze allowance exhausted', 'FREEZE_LIMIT');
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'frozen', frozen_at: new Date().toISOString() })
    .eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

/**
 * Unfreeze: count days spent frozen, add to freeze_days_used, and push end_date
 * forward by that many days so the member loses no paid time.
 */
async function unfreeze(gymId, id) {
  const sub = await getOrThrow(gymId, id);
  if (sub.status !== 'frozen') throw ApiError.badRequest('Subscription is not frozen', 'NOT_FROZEN');

  const frozenAt = sub.frozen_at ? new Date(sub.frozen_at) : new Date();
  const daysFrozen = Math.max(0, Math.floor((Date.now() - frozenAt.getTime()) / 86400000));
  const newEnd = addDays(sub.end_date, daysFrozen);

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      frozen_at: null,
      freeze_days_used: (sub.freeze_days_used || 0) + daysFrozen,
      end_date: newEnd,
    })
    .eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

async function list(gymId, { status, memberId, planType } = {}) {
  let q = supabase.from('subscriptions').select('*').eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (memberId) q = q.eq('member_id', memberId);
  if (planType) q = q.eq('plan_type', planType);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

/**
 * Renew a single subscription via Wawa. Used by the renewals cron.
 * Flat $1 placeholder fee; real pricing comes with Wawa docs.
 * @returns {{ renewed: boolean, status: string }}
 */
async function renewOne(sub) {
  const amount = 1; // placeholder flat fee
  const result = await wawa.chargeSubscriptionRenewal(sub.gym_id, sub.member_id, amount, sub.plan_type);

  if (result.success) {
    const base = sub.end_date < today() ? today() : sub.end_date;
    const newEnd = PLAN_DAYS[sub.plan_type] ? addDays(base, PLAN_DAYS[sub.plan_type]) : base;
    await supabase.from('subscriptions')
      .update({ status: 'active', start_date: today(), end_date: newEnd })
      .eq('id', sub.id);
    return { renewed: true, status: 'active' };
  }

  await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);
  return { renewed: false, status: 'expired' };
}

/** Find subscriptions due for renewal today. */
async function findDueForRenewal() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .lte('end_date', today())
    .eq('auto_renew', true)
    .eq('status', 'active');
  if (error) throw error;
  return data;
}

module.exports = {
  getMine, create, update, freeze, unfreeze, list, renewOne, findDueForRenewal, getOrThrow,
};
