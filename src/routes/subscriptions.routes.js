'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, uuid, planType, idParam } = require('../utils/schemas');
const ctrl = require('../controllers/subscriptionController');

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const createSchema = z.object({
  member_id: uuid,
  plan_type: planType,
  start_date: dateStr.optional(),
  end_date: dateStr.optional(),
  auto_renew: z.boolean().optional(),
});

const updateSchema = z.object({
  plan_type: planType.optional(),
  start_date: dateStr.optional(),
  end_date: dateStr.optional(),
  status: z.enum(['active', 'expired', 'frozen', 'cancelled']).optional(),
  auto_renew: z.boolean().optional(),
});

// Member-facing
const memberRouter = express.Router();
memberRouter.use(authenticate);
memberRouter.get('/me', asyncHandler(ctrl.getMine));

// Admin-facing (mounted at /admin/subscriptions)
const adminRouter = express.Router();
adminRouter.use(authenticate, requireStaff());
adminRouter.get('/', asyncHandler(ctrl.list));
adminRouter.post('/', validate(createSchema), asyncHandler(ctrl.create));
adminRouter.put('/:id', validate(idParam, 'params'), validate(updateSchema), asyncHandler(ctrl.update));
adminRouter.post('/:id/freeze', validate(idParam, 'params'), asyncHandler(ctrl.freeze));
adminRouter.post('/:id/unfreeze', validate(idParam, 'params'), asyncHandler(ctrl.unfreeze));

module.exports = { memberRouter, adminRouter };
