'use strict';

const checkinService = require('../services/checkinService');
const { STAFF_ROLES } = require('../middleware/requireRole');
const ApiError = require('../utils/ApiError');

/**
 * POST /checkins — log a check-in.
 * - A member may check themselves in (no body, or their own barcode).
 * - Staff may scan any member's barcode, or pass member_id for a manual check-in.
 */
async function create(req, res) {
  const gymId = req.user.gym_id;
  const isStaff = STAFF_ROLES.includes(req.user.role);
  const { barcode, member_id: bodyMemberId } = req.body;

  // Only staff may check in someone else by explicit member_id.
  if (bodyMemberId && bodyMemberId !== req.user.member_id && !isStaff) {
    throw ApiError.forbidden('Cannot check in another member', 'FORBIDDEN_CHECKIN');
  }

  const { memberId, method } = checkinService.resolveTargetMember({
    gymId,
    barcode,
    memberId: bodyMemberId,
    fallbackMemberId: req.user.member_id,
  });

  // A barcode scanned by a non-staff user must be their own.
  if (method === 'barcode' && !isStaff && memberId !== req.user.member_id) {
    throw ApiError.forbidden('Cannot check in another member', 'FORBIDDEN_CHECKIN');
  }

  const checkin = await checkinService.checkIn({ gymId, targetMemberId: memberId, method });
  res.status(201).json(checkin);
}

async function adminList(req, res) {
  const { start_date, end_date, member_id } = req.query;
  const checkins = await checkinService.list(req.user.gym_id, {
    startDate: start_date, endDate: end_date, memberId: member_id,
  });
  res.json({ checkins });
}

async function listMine(req, res) {
  const checkins = await checkinService.listForMember(req.user.gym_id, req.user.member_id, {});
  res.json({ checkins });
}

module.exports = { create, adminList, listMine };
