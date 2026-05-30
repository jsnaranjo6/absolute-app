'use strict';

const helpRequestService = require('../services/helpRequestService');

async function create(req, res) {
  const hr = await helpRequestService.create(req.user.gym_id, req.user.member_id, req.body.machine_id);
  res.status(201).json(hr);
}

async function listOpen(req, res) {
  res.json({ help_requests: await helpRequestService.listOpen(req.user.gym_id) });
}

async function resolve(req, res) {
  const hr = await helpRequestService.resolve(req.user.gym_id, req.params.id, req.user.member_id);
  res.json(hr);
}

async function adminList(req, res) {
  const help_requests = await helpRequestService.adminList(req.user.gym_id, {
    status: req.query.status, machineId: req.query.machine_id, memberId: req.query.member_id,
  });
  res.json({ help_requests });
}

module.exports = { create, listOpen, resolve, adminList };
