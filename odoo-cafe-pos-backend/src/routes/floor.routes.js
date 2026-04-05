// src/routes/floor.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/floor.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET /api/floors?branchId=  — all floors + tables + status
router.get('/', ctrl.getFloors);

module.exports = router;
