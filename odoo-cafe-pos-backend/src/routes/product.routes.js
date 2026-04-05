// src/routes/product.routes.js
const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middlewares/auth.middleware');
const { success } = require('../utils/response');

router.use(authenticate);

// GET /api/products — list products with category info
router.get('/', async (req, res, next) => {
  try {
    const { branchId, categoryId, search, limit = 100, offset = 0 } = req.query;
    const where = { isActive: true };
    if (branchId) where.branchId = branchId;
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.product.count({ where }),
    ]);

    return success(res, { products, total });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
