// src/routes/report.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET /api/reports/dashboard           - today's stats (orders, revenue, top products)
router.get('/dashboard', ctrl.dashboard);

// GET /api/reports/sales               - daily sales report (?from=&to=&branchId=)
router.get('/sales', authorize('ADMIN', 'MANAGER'), ctrl.sales);

// GET /api/reports/session/:sessionId  - per-session summary
router.get('/session/:sessionId', ctrl.sessionReport);

module.exports = router;
