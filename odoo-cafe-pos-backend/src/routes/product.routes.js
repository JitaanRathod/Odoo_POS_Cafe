const router = require('express').Router();
const productController = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Product routes
router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

// Category routes
router.get('/categories/list', productController.getCategories);
router.post('/categories', productController.createCategory);

module.exports = router;