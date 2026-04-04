// src/services/customer.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const { ERRORS } = require('../utils/constants');

/**
 * Create a customer
 */
const createCustomer = async ({ name, email, phone, address }) => {
  if (!name) throw new AppError('Customer name is required', 400);

  if (phone) {
    const byPhone = await prisma.customer.findUnique({ where: { phone } });
    if (byPhone) throw new AppError(ERRORS.PHONE_IN_USE, 409);
  }

  if (email) {
    const byEmail = await prisma.customer.findUnique({ where: { email } });
    if (byEmail) throw new AppError('Email is already registered', 409);
  }

  return prisma.customer.create({
    data: { name, email: email || null, phone: phone || null, address: address || null },
  });
};

/**
 * Search / list customers
 */
const listCustomers = async ({ search, limit = 30, offset = 0 }) => {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.customer.count({ where }),
  ]);

  return { customers, total, limit: parseInt(limit), offset: parseInt(offset) };
};

/**
 * Get customer by ID with order history
 */
const getCustomerById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          orderType: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });
  if (!customer) throw new AppError(ERRORS.CUSTOMER_NOT_FOUND, 404);
  return customer;
};

/**
 * Update customer details
 */
const updateCustomer = async (id, data) => {
  await getCustomerById(id);

  if (data.phone) {
    const existing = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existing && existing.id !== id) throw new AppError(ERRORS.PHONE_IN_USE, 409);
  }

  return prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    },
  });
};

/**
 * Delete customer
 */
const deleteCustomer = async (id) => {
  await getCustomerById(id);
  return prisma.customer.delete({ where: { id } });
};

/**
 * Get top customers by total spend
 */
const getTopCustomers = async (limit = 10) => {
  return prisma.customer.findMany({
    orderBy: { totalSpent: 'desc' },
    take: parseInt(limit),
    select: {
      id: true,
      name: true,
      phone: true,
      totalSpent: true,
      _count: { select: { orders: true } },
    },
  });
};

module.exports = {
  createCustomer,
  listCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getTopCustomers,
};
