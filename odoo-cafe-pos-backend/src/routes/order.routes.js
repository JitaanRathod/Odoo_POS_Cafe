const router = require('express').Router();
const ctrl = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.list);
router.get('/kitchen', ctrl.kitchen);
router.get('/table/:tableId', ctrl.getByTable);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/:id/items', ctrl.addItems);
router.delete('/:id/items/:itemId', ctrl.removeItem);
router.post('/:id/send-to-kitchen', ctrl.sendToKitchen);
router.patch('/:id/status', ctrl.updateStatus);
module.exports = router;
