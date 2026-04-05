const router = require('express').Router();
const floorController = require('../controllers/floor.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Floor routes
router.get('/', floorController.list);
router.post('/', floorController.create);
router.put('/:id', floorController.update);
router.delete('/:id', floorController.remove);

// Table routes
router.get('/:floorId/tables', floorController.getTables);
router.post('/:floorId/tables', floorController.createTable);
router.put('/tables/:tableId', floorController.updateTable);
router.delete('/tables/:tableId', floorController.deleteTable);

module.exports = router;