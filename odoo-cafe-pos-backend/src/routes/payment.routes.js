// src/routes/payment.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET  /api/payments                    - list payments (filterable by method, status, date)
router.get('/', authorize('ADMIN', 'MANAGER'), ctrl.list);

// POST /api/payments/process            - process payment for an order
router.post('/process', ctrl.process);

// GET  /api/payments/receipt/:orderId   - get receipt data for an order
router.get('/receipt/:orderId', ctrl.getReceipt);

module.exports = router;
