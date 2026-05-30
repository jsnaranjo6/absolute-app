'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireRole, requireStaff } = require('../middleware/requireRole');
const { z, uuid, idParam } = require('../utils/schemas');
const ctrl = require('../controllers/helpRequestController');

const createSchema = z.object({ machine_id: uuid });

// Member + trainer — mounted at /help-requests
const router = express.Router();
router.use(authenticate);
router.post('/', validate(createSchema), asyncHandler(ctrl.create));
router.get('/open', requireRole('trainer', 'manager', 'owner'), asyncHandler(ctrl.listOpen));
router.put('/:id/resolve', requireRole('trainer', 'manager', 'owner'),
  validate(idParam, 'params'), asyncHandler(ctrl.resolve));

// Admin — mounted at /admin/help-requests
const adminRouter = express.Router();
adminRouter.use(authenticate, requireStaff());
adminRouter.get('/', asyncHandler(ctrl.adminList));

module.exports = { router, adminRouter };
