const prisma = require('../config/prisma');
const { success, created } = require('../utils/response');
const { AppError } = require('../utils/response');

// GET /api/products
const list = async (req, res, next) => {
    try {
        const { branchId, categoryId, search, limit = 100, offset = 0 } = req.query;
        const where = { isActive: true };
        if (branchId) where.branchId = branchId;
        if (categoryId) where.categoryId = categoryId;
        if (search) where.name = { contains: search, mode: 'insensitive' };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    category: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } }
                },
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
};

// GET /api/products/:id
const getById = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: {
                category: true,
                branch: true
            },
        });
        if (!product) throw new AppError('Product not found', 404);
        return success(res, { product });
    } catch (err) {
        next(err);
    }
};

// POST /api/products
const create = async (req, res, next) => {
    try {
        const { name, description, price, categoryId, branchId, taxRate, barcode, imageUrl } = req.body;

        if (!name || !price) {
            throw new AppError('Name and price are required', 400);
        }

        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
                price: parseFloat(price),
                categoryId: categoryId || null,
                branchId: branchId || null,
                taxRate: taxRate ? parseFloat(taxRate) : 0,
                barcode: barcode || null,
                imageUrl: imageUrl || null,
                isActive: true,
            },
            include: { category: true, branch: true },
        });

        return created(res, { product });
    } catch (err) {
        next(err);
    }
};

// PUT /api/products/:id
const update = async (req, res, next) => {
    try {
        const { name, description, price, categoryId, taxRate, barcode, imageUrl, isActive } = req.body;

        const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!existing) throw new AppError('Product not found', 404);

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate);
        if (barcode !== undefined) updateData.barcode = barcode;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (isActive !== undefined) updateData.isActive = isActive;

        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: updateData,
            include: { category: true, branch: true },
        });

        return success(res, { product });
    } catch (err) {
        next(err);
    }
};

// DELETE /api/products/:id
const remove = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product) throw new AppError('Product not found', 404);

        // Soft delete
        await prisma.product.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });

        return success(res, { message: 'Product deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// GET /api/products/categories
const getCategories = async (req, res, next) => {
    try {
        const { branchId } = req.query;
        const where = {};
        if (branchId) where.branchId = branchId;

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { name: 'asc' },
        });

        return success(res, { categories });
    } catch (err) {
        next(err);
    }
};

// POST /api/products/categories
const createCategory = async (req, res, next) => {
    try {
        const { name, branchId, imageUrl } = req.body;

        if (!name) {
            throw new AppError('Category name is required', 400);
        }

        const category = await prisma.category.create({
            data: {
                name,
                branchId: branchId || null,
                imageUrl: imageUrl || null,
            },
        });

        return created(res, { category });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove,
    getCategories,
    createCategory
};