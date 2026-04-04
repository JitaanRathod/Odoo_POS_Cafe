// src/routes/session.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/session.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET  /api/sessions/active
router.get('/active', ctrl.getActive);

// GET  /api/sessions/current?terminalId=xxx
router.get('/current', ctrl.getCurrent);

// GET  /api/sessions/history
router.get('/history', ctrl.getHistory);

// POST /api/sessions/open
router.post('/open', ctrl.open);

// GET  /api/sessions/:id
router.get('/:id', ctrl.getById);

// POST /api/sessions/:id/close
router.post('/:id/close', ctrl.close);

module.exports = router;
