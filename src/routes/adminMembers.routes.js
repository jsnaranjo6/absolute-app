'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, gender, role, idParam } = require('../utils/schemas');
const ctrl = require('../controllers/memberController');

const router = express.Router();

const adminUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  photo_url: z.string().url().max(2048).optional(),
  gender: gender.optional(),
  is_active: z.boolean().optional(),
  role: role.optional(),
});

router.use(authenticate, requireStaff());

router.get('/', asyncHandler(ctrl.adminList));
router.get('/:id', validate(idParam, 'params'), asyncHandler(ctrl.adminGet));
router.put('/:id', validate(idParam, 'params'), validate(adminUpdateSchema), asyncHandler(ctrl.adminUpdate));

module.exports = router;
