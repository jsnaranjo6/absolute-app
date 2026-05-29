'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, uuid } = require('../utils/schemas');
const ctrl = require('../controllers/checkinController');

const router = express.Router();

const createSchema = z.object({
  barcode: z.string().optional(),
  member_id: uuid.optional(),
});

router.use(authenticate);

router.post('/', validate(createSchema), asyncHandler(ctrl.create));
router.get('/', requireStaff(), asyncHandler(ctrl.adminList));

module.exports = router;
