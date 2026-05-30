'use strict';

const { supabase } = require('./supabase');

/**
 * OneSignal push dispatch (server-side only).
 *
 * PLACEHOLDER: actual HTTP calls to the OneSignal REST API are stubbed until
 * credentials are wired. Player IDs are registered by the frontend via
 * POST /api/v1/device-tokens and stored in device_tokens. These helpers resolve
 * member → player IDs and "send" (currently logs). Swap simulateSend() for a
 * real fetch to https://api.onesignal.com/notifications when ready.
 */

const APP_ID = process.env.ONESIGNAL_APP_ID;
const API_KEY = process.env.ONESIGNAL_API_KEY;

async function playerIdsForMembers(gymId, memberIds) {
  if (!memberIds || memberIds.length === 0) return [];
  const { data, error } = await supabase
    .from('device_tokens')
    .select('player_id')
    .eq('gym_id', gymId)
    .in('member_id', memberIds);
  if (error) throw error;
  return data.map((r) => r.player_id);
}

async function playerIdsForGym(gymId) {
  const { data, error } = await supabase
    .from('device_tokens').select('player_id').eq('gym_id', gymId);
  if (error) throw error;
  return data.map((r) => r.player_id);
}

async function simulateSend(playerIds, title, body) {
  if (!APP_ID || !API_KEY) {
    console.log(`[onesignal:stub] (no creds) -> ${playerIds.length} devices :: ${title}`);
  } else {
    console.log(`[onesignal] dispatch -> ${playerIds.length} devices :: ${title} — ${body}`);
  }
  return { delivered: playerIds.length };
}

/** Send a push to specific members (by their registered player IDs). */
async function sendToMembers(gymId, memberIds, title, body) {
  const playerIds = await playerIdsForMembers(gymId, memberIds);
  if (playerIds.length === 0) return { delivered: 0 };
  return simulateSend(playerIds, title, body);
}

/** Send a push to every device registered for a gym. */
async function sendToGym(gymId, title, body) {
  const playerIds = await playerIdsForGym(gymId);
  if (playerIds.length === 0) return { delivered: 0 };
  return simulateSend(playerIds, title, body);
}

module.exports = { sendToMembers, sendToGym, playerIdsForMembers, playerIdsForGym };
