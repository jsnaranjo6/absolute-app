'use strict';

const { supabase } = require('./supabase');
const onesignal = require('./onesignal');
const ApiError = require('../utils/ApiError');

/** Resolve the trainer member ids for a gym (active staff with trainer role). */
async function trainerMemberIds(gymId) {
  const { data, error } = await supabase
    .from('staff').select('member_id').eq('gym_id', gymId).eq('role', 'trainer').eq('is_active', true);
  if (error) throw error;
  return data.map((r) => r.member_id);
}

/**
 * Member creates a help request for a machine. On creation we push a real-time
 * OneSignal notification to every trainer in the gym (member name + machine name).
 */
async function create(gymId, memberId, machineId) {
  // Validate machine belongs to this gym.
  const { data: machineRows, error: mErr } = await supabase
    .from('machines').select('id, name').eq('gym_id', gymId).eq('id', machineId).limit(1);
  if (mErr) throw mErr;
  const machine = machineRows && machineRows[0];
  if (!machine) throw ApiError.notFound('Machine not found', 'MACHINE_NOT_FOUND');

  const { data, error } = await supabase
    .from('help_requests')
    .insert({ gym_id: gymId, member_id: memberId, machine_id: machineId, status: 'open' })
    .select('*').single();
  if (error) throw error;

  // Fire-and-await the trainer notification, but don't fail the request if push errors.
  try {
    const { data: memberRows } = await supabase
      .from('members').select('name').eq('gym_id', gymId).eq('id', memberId).limit(1);
    const memberName = memberRows && memberRows[0] ? memberRows[0].name : 'A member';
    const trainers = await trainerMemberIds(gymId);
    if (trainers.length > 0) {
      await onesignal.sendToMembers(
        gymId, trainers,
        'Machine help requested',
        `${memberName} needs help with ${machine.name}`,
      );
    }
  } catch (pushErr) {
    console.error('[help] trainer push failed:', pushErr.message);
  }

  return data;
}

/** Trainer: list open requests for the gym. */
async function listOpen(gymId) {
  const { data, error } = await supabase
    .from('help_requests')
    .select('*, machines(name, zone), members!help_requests_member_id_fkey(name)')
    .eq('gym_id', gymId)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

/** Trainer: mark a request resolved (records resolving trainer). */
async function resolve(gymId, id, trainerId) {
  const { data, error } = await supabase
    .from('help_requests')
    .update({ status: 'resolved', trainer_id: trainerId, resolved_at: new Date().toISOString() })
    .eq('gym_id', gymId).eq('id', id).select('*').single();
  if (error) {
    if (error.code === 'PGRST116') throw ApiError.notFound('Help request not found', 'HELP_NOT_FOUND');
    throw error;
  }
  return data;
}

/** Admin: all requests with optional filters. */
async function adminList(gymId, { status, machineId, memberId } = {}) {
  let q = supabase.from('help_requests').select('*').eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (machineId) q = q.eq('machine_id', machineId);
  if (memberId) q = q.eq('member_id', memberId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

module.exports = { create, listOpen, resolve, adminList, trainerMemberIds };
