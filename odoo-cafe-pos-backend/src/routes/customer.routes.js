
const router = require('express').Router();
const ctrl = require('../controllers/customer.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
router.use(authenticate);
router.get('/', ctrl.list);
router.get('/top', ctrl.topCustomers);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), ctrl.remove);
module.exports = router;
