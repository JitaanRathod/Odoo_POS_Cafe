// src/routes/terminal.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/terminal.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// GET  /api/terminals
router.get('/', ctrl.getAll);

// GET  /api/terminals/:id
router.get('/:id', ctrl.getById);

// POST /api/terminals  (admin/manager only)
router.post('/', authorize('ADMIN', 'MANAGER'), ctrl.create);

// PUT  /api/terminals/:id
router.put('/:id', authorize('ADMIN', 'MANAGER'), ctrl.update);

// DELETE /api/terminals/:id
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;
