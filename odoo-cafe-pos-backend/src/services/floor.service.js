// src/services/floor.service.js
const prisma = require('../config/prisma');

/**
 * Return all floors (with tables + current status) for a branch.
 * Optionally enrich each OCCUPIED table with its active order info.
 */
const getFloors = async (branchId) => {
  const where = {};
  if (branchId) where.branchId = branchId;

  const floors = await prisma.floor.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      tables: {
        orderBy: { tableNumber: 'asc' },
        include: {
          orders: {
            where: {
              status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              totalAmount: true,
              orderType: true,
              createdAt: true,
              orderItems: {
                select: { id: true, productName: true, quantity: true },
              },
            },
          },
        },
      },
    },
  });

  // Flatten: attach activeOrder to each table for convenience
  return floors.map((floor) => ({
    ...floor,
    tables: floor.tables.map((table) => ({
      id: table.id,
      tableNumber: table.tableNumber,
      seats: table.seats,
      status: table.status,
      floorId: table.floorId,
      activeOrder: table.orders[0] || null,
    })),
  }));
};

module.exports = { getFloors };
