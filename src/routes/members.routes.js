'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { z, gender } = require('../utils/schemas');
const ctrl = require('../controllers/memberController');
const checkinCtrl = require('../controllers/checkinController');

const router = express.Router();

const updateMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  photo_url: z.string().url().max(2048).optional(),
  gender: gender.optional(),
});

router.use(authenticate);

router.get('/me', asyncHandler(ctrl.getMe));
router.put('/me', validate(updateMeSchema), asyncHandler(ctrl.updateMe));
router.get('/me/barcode', asyncHandler(ctrl.getMyBarcode));
router.get('/me/checkins', asyncHandler(checkinCtrl.listMine));

module.exports = router;
