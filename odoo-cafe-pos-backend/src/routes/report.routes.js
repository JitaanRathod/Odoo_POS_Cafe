// src/routes/report.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET /api/reports/dashboard  — ADMIN / MANAGER only
router.get('/dashboard', authorize('ADMIN', 'MANAGER'), ctrl.dashboard);

// GET /api/reports/sales               - daily sales report (?from=&to=&branchId=)
router.get('/sales', authorize('ADMIN', 'MANAGER'), ctrl.sales);

// GET /api/reports/session/:sessionId  - per-session summary
router.get('/session/:sessionId', ctrl.sessionReport);

module.exports = router;
