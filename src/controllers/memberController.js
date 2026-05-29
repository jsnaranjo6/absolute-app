'use strict';

const memberService = require('../services/memberService');

async function getMe(req, res) {
  const member = await memberService.getById(req.user.gym_id, req.user.member_id);
  res.json(member);
}

async function updateMe(req, res) {
  const member = await memberService.updateSelf(req.user.gym_id, req.user.member_id, req.body);
  res.json(member);
}

async function getMyBarcode(req, res) {
  res.json(memberService.getBarcode(req.user.gym_id, req.user.member_id));
}

// --- Admin ---

async function adminList(req, res) {
  const members = await memberService.listWithSubscriptionStatus(req.user.gym_id, { search: req.query.search });
  res.json({ members });
}

async function adminGet(req, res) {
  const member = await memberService.getById(req.user.gym_id, req.params.id);
  res.json(member);
}

async function adminUpdate(req, res) {
  const member = await memberService.adminUpdate(req.user.gym_id, req.params.id, req.body);
  res.json(member);
}

module.exports = { getMe, updateMe, getMyBarcode, adminList, adminGet, adminUpdate };
