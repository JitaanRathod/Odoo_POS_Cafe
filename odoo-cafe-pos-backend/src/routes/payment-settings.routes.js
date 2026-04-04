// src/routes/payment-settings.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/payment-settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET /api/payment-settings/:terminalId
router.get('/:terminalId', ctrl.get);

// PUT /api/payment-settings/:terminalId  (admin/manager only)
router.put('/:terminalId', authorize('ADMIN', 'MANAGER'), ctrl.update);

module.exports = router;
