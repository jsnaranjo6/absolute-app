'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { requireStaff } = require('../middleware/requireRole');
const { z, uuid, idParam } = require('../utils/schemas');
const ctrl = require('../controllers/machineController');

const instructions = z.array(z.string().max(500)).max(50);

const createSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.string().max(60).optional(),
  zone: z.string().max(60).optional(),
  instructions: instructions.optional(),
  is_active: z.boolean().optional(),
});
const updateSchema = createSchema.partial();
const qrParam = z.object({ qr_code_id: uuid });

// Public (authenticated) — mounted at /machines
const router = express.Router();
router.use(authenticate);
router.get('/', asyncHandler(ctrl.listPublic));
router.get('/:qr_code_id', validate(qrParam, 'params'), asyncHandler(ctrl.getByQr));

// Admin — mounted at /admin/machines
const adminRouter = express.Router();
adminRouter.use(authenticate, requireStaff());
adminRouter.post('/', validate(createSchema), asyncHandler(ctrl.create));
adminRouter.put('/:id', validate(idParam, 'params'), validate(updateSchema), asyncHandler(ctrl.update));
adminRouter.get('/:id/qr', validate(idParam, 'params'), asyncHandler(ctrl.getQr));

module.exports = { router, adminRouter };
