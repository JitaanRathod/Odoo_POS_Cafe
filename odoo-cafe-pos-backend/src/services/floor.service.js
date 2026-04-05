const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');

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

/**
 * Create a new floor
 */
const createFloor = async (data) => {
  const { name, branchId } = data;

  if (!name) {
    throw new AppError('Floor name is required', 400);
  }

  const floor = await prisma.floor.create({
    data: {
      name,
      branchId: branchId || null,
    },
    include: {
      tables: true,
    },
  });

  return floor;
};

/**
 * Update a floor
 */
const updateFloor = async (floorId, data) => {
  const { name } = data;

  const existing = await prisma.floor.findUnique({ where: { id: floorId } });
  if (!existing) throw new AppError('Floor not found', 404);

  const updateData = {};
  if (name !== undefined) updateData.name = name;

  const floor = await prisma.floor.update({
    where: { id: floorId },
    data: updateData,
    include: {
      tables: true,
    },
  });

  return floor;
};

/**
 * Delete a floor
 */
const deleteFloor = async (floorId) => {
  const existing = await prisma.floor.findUnique({
    where: { id: floorId },
    include: { tables: true }
  });

  if (!existing) throw new AppError('Floor not found', 404);

  if (existing.tables.length > 0) {
    throw new AppError('Cannot delete floor with tables. Delete tables first.', 400);
  }

  await prisma.floor.delete({ where: { id: floorId } });
};

/**
 * Get tables by floor
 */
const getTablesByFloor = async (floorId) => {
  const tables = await prisma.table.findMany({
    where: { floorId },
    orderBy: { tableNumber: 'asc' },
    include: {
      orders: {
        where: {
          status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return tables.map((table) => ({
    ...table,
    activeOrder: table.orders[0] || null,
  }));
};

/**
 * Create a new table
 */
const createTable = async (floorId, data) => {
  const { tableNumber, seats } = data;

  if (!tableNumber) {
    throw new AppError('Table number is required', 400);
  }

  // Check if floor exists
  const floor = await prisma.floor.findUnique({ where: { id: floorId } });
  if (!floor) throw new AppError('Floor not found', 404);

  // Check for duplicate table number on same floor
  const existing = await prisma.table.findFirst({
    where: { floorId, tableNumber: parseInt(tableNumber) },
  });

  if (existing) {
    throw new AppError('Table number already exists on this floor', 409);
  }

  const table = await prisma.table.create({
    data: {
      floorId,
      tableNumber: parseInt(tableNumber),
      seats: seats ? parseInt(seats) : 4,
      status: 'FREE',
    },
  });

  return table;
};

/**
 * Update a table
 */
const updateTable = async (tableId, data) => {
  const { tableNumber, seats, status } = data;

  const existing = await prisma.table.findUnique({ where: { id: tableId } });
  if (!existing) throw new AppError('Table not found', 404);

  const updateData = {};
  if (tableNumber !== undefined) {
    // Check for duplicate
    const duplicate = await prisma.table.findFirst({
      where: {
        floorId: existing.floorId,
        tableNumber: parseInt(tableNumber),
        id: { not: tableId }
      },
    });
    if (duplicate) {
      throw new AppError('Table number already exists on this floor', 409);
    }
    updateData.tableNumber = parseInt(tableNumber);
  }
  if (seats !== undefined) updateData.seats = parseInt(seats);
  if (status !== undefined) updateData.status = status;

  const table = await prisma.table.update({
    where: { id: tableId },
    data: updateData,
  });

  return table;
};

/**
 * Delete a table
 */
const deleteTable = async (tableId) => {
  const existing = await prisma.table.findUnique({
    where: { id: tableId },
    include: {
      orders: {
        where: {
          status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] },
        },
      },
    },
  });

  if (!existing) throw new AppError('Table not found', 404);

  if (existing.orders.length > 0) {
    throw new AppError('Cannot delete table with active orders', 400);
  }

  await prisma.table.delete({ where: { id: tableId } });
};

module.exports = {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  getTablesByFloor,
  createTable,
  updateTable,
  deleteTable
};