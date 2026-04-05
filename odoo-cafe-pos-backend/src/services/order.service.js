// src/services/order.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const {
  ERRORS,
  ORDER_STATUS,
  ORDER_TYPE,
  TABLE_STATUS,
  VALID_TRANSITIONS,
  SOCKET_EVENTS,
} = require('../utils/constants');
const socketUtil = require('../utils/socket');

// Reusable include for full order detail
const fullOrderInclude = {
  table: { select: { id: true, tableNumber: true, seats: true, status: true } },
  customer: { select: { id: true, name: true, phone: true, email: true } },
  cashier: { select: { id: true, name: true } },
  branch: { select: { id: true, name: true } },
  orderItems: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
    orderBy: { id: 'asc' },
  },
  payments: { orderBy: { createdAt: 'desc' } },
  receipts: true,
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Build order items create data by fetching product prices.
 * Returns { itemsData, subtotal, taxAmount }
 */
const buildItemsData = async (items) => {
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let taxAmount = 0;
  const itemsData = [];

  for (const item of items) {
    const product = productMap[item.productId];
    if (!product) throw new AppError(`Product "${item.productId}" not found or inactive`, 404);
    if (item.quantity <= 0) throw new AppError('Quantity must be greater than 0', 400);

    const lineSubtotal = Number(product.price) * item.quantity;
    const lineTax = lineSubtotal * (Number(product.taxRate) / 100);

    subtotal += lineSubtotal;
    taxAmount += lineTax;

    itemsData.push({
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      taxRate: product.taxRate,
      notes: item.notes || null,
    });
  }

  return { itemsData, subtotal, taxAmount, totalAmount: subtotal + taxAmount };
};

// ─────────────────────────────────────────────────────────────
// CORE ORDER OPERATIONS
// ─────────────────────────────────────────────────────────────

/**
 * Create a new order (DINE_IN or TAKEAWAY)
 * Optionally accepts initial items array
 */
const createOrder = async (data, cashierId) => {
  const { branchId, sessionId, tableId, orderType, customerId, notes, items } = data;

  // 1. Validate session
  const session = await prisma.posSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError(ERRORS.SESSION_NOT_FOUND, 404);
  if (session.closedAt) throw new AppError(ERRORS.SESSION_CLOSED, 400);

  // 2. Validate DINE_IN specifics
  if (orderType === ORDER_TYPE.DINE_IN) {
    if (!tableId) throw new AppError(ERRORS.TABLE_REQUIRED, 400);

    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) throw new AppError(ERRORS.TABLE_NOT_FOUND, 404);
    if (table.status === TABLE_STATUS.OCCUPIED) throw new AppError(ERRORS.TABLE_OCCUPIED, 409);
  }

  // 3. Validate customer if provided
  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new AppError(ERRORS.CUSTOMER_NOT_FOUND, 404);
  }

  // 4. Build items if provided
  let itemsData = [];
  let totalAmount = 0;
  let taxAmount = 0;

  if (items && items.length > 0) {
    const built = await buildItemsData(items);
    itemsData = built.itemsData;
    totalAmount = built.totalAmount;
    taxAmount = built.taxAmount;
  }

  const finalTableId = orderType === ORDER_TYPE.DINE_IN ? tableId : null;

  // 5. Create order (+ mark table occupied) in a transaction
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        branchId,
        sessionId,
        tableId: finalTableId,
        customerId: customerId || null,
        cashierId,
        orderType,
        status: ORDER_STATUS.CREATED,
        notes: notes || null,
        totalAmount,
        taxAmount,
        orderItems: { create: itemsData },
      },
      include: fullOrderInclude,
    });

    if (orderType === ORDER_TYPE.DINE_IN && finalTableId) {
      await tx.table.update({
        where: { id: finalTableId },
        data: { status: TABLE_STATUS.OCCUPIED },
      });
    }

    return newOrder;
  });

  // Notify floor map of status change
  if (orderType === ORDER_TYPE.DINE_IN && finalTableId) {
    socketUtil.emit(SOCKET_EVENTS.TABLE_STATUS_CHANGE, {
      tableId: finalTableId,
      status: TABLE_STATUS.OCCUPIED,
    });
  }

  return order;
};

/**
 * Add/update items to an existing order
 * Increments total; does NOT reset existing items
 */
const addOrderItems = async (orderId, items) => {
  if (!items || items.length === 0) throw new AppError(ERRORS.ORDER_EMPTY, 400);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);
  if (order.status === ORDER_STATUS.COMPLETED) throw new AppError(ERRORS.ORDER_ALREADY_PAID, 400);
  if (order.status === ORDER_STATUS.CANCELLED) throw new AppError(ERRORS.ORDER_CANCELLED, 400);

  const { itemsData, totalAmount, taxAmount } = await buildItemsData(items);

  return prisma.$transaction(async (tx) => {
    const created = await tx.orderItem.createMany({
      data: itemsData.map((i) => ({ ...i, orderId })),
    });

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount: { increment: totalAmount },
        taxAmount: { increment: taxAmount },
      },
      include: fullOrderInclude,
    });

    return { addedCount: created.count, order: updatedOrder };
  });
};

/**
 * Remove a single order item by its ID
 */
const removeOrderItem = async (orderId, itemId) => {
  const item = await prisma.orderItem.findFirst({
    where: { id: itemId, orderId },
    include: { order: true },
  });
  if (!item) throw new AppError(ERRORS.NOT_FOUND('Order item'), 404);

  const { order } = item;
  if ([ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED].includes(order.status)) {
    throw new AppError('Cannot modify a completed or cancelled order', 400);
  }

  const lineTotal = Number(item.unitPrice) * item.quantity;
  const lineTax = lineTotal * (Number(item.taxRate) / 100);

  return prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: itemId } });
    return tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount: { decrement: lineTotal + lineTax },
        taxAmount: { decrement: lineTax },
      },
      include: fullOrderInclude,
    });
  });
};

/**
 * Send order to kitchen — changes status to IN_PROGRESS
 * and emits a socket event for the kitchen display
 */
const sendToKitchen = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: true } }, table: true },
  });
  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);
  if (order.orderItems.length === 0) throw new AppError(ERRORS.ORDER_EMPTY, 400);

  if (!VALID_TRANSITIONS[order.status]?.includes(ORDER_STATUS.IN_PROGRESS)) {
    throw new AppError(`Order in "${order.status}" cannot be sent to kitchen`, 400);
  }

  const pendingItems = order.orderItems.filter((i) => !i.kitchenSent);
  if (pendingItems.length === 0) {
    throw new AppError('All items have already been sent to kitchen', 400);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Mark all unsent items as sent
    await tx.orderItem.updateMany({
      where: { orderId, kitchenSent: false },
      data: { kitchenSent: true },
    });

    return tx.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.IN_PROGRESS },
      include: fullOrderInclude,
    });
  });

  // Notify kitchen display via socket
  socketUtil.emit(SOCKET_EVENTS.KITCHEN_NEW_ORDER, {
    order: updatedOrder,
    items: pendingItems,
  });

  return updatedOrder;
};

/**
 * Update order status (e.g. READY, CANCELLED)
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);

  if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
    throw new AppError(
      `Cannot transition from "${order.status}" to "${newStatus}"`,
      400
    );
  }

  const updateData = { status: newStatus };

  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Free table if order is cancelled and was DINE_IN
    if (newStatus === ORDER_STATUS.CANCELLED && order.tableId) {
      const otherActive = await tx.order.count({
        where: {
          tableId: order.tableId,
          id: { not: orderId },
          status: { in: [ORDER_STATUS.CREATED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.READY] },
        },
      });
      if (otherActive === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: TABLE_STATUS.FREE },
        });
        socketUtil.emit(SOCKET_EVENTS.TABLE_STATUS_CHANGE, {
          tableId: order.tableId,
          status: TABLE_STATUS.FREE,
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: fullOrderInclude,
    });
  });

  socketUtil.emit(SOCKET_EVENTS.KITCHEN_ORDER_UPDATE, {
    orderId,
    status: newStatus,
  });

  return updatedOrder;
};

/**
 * Get a single order by ID
 */
const getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: fullOrderInclude,
  });
  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);
  return order;
};

/**
 * Get active (non-completed) order for a dine-in table
 */
const getActiveOrderByTable = async (tableId) => {
  const order = await prisma.order.findFirst({
    where: {
      tableId,
      orderType: ORDER_TYPE.DINE_IN,
      status: { notIn: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED] },
    },
    include: fullOrderInclude,
    orderBy: { createdAt: 'desc' },
  });
  if (!order) throw new AppError('No active order for this table', 404);
  return order;
};

/**
 * List orders with optional filters
 */
const listOrders = async ({ branchId, sessionId, status, orderType, from, to, limit = 10, offset = 0 }) => {
  const where = {};
  if (branchId) where.branchId = branchId;
  if (sessionId) where.sessionId = sessionId;
  if (status) where.status = status;
  if (orderType) where.orderType = orderType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: fullOrderInclude,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, limit: parseInt(limit), offset: parseInt(offset) };
};

/**
 * Kitchen view — orders with status IN_PROGRESS or READY
 */
const getKitchenOrders = async (branchId) => {
  const where = {
    status: { in: [ORDER_STATUS.CREATED, ORDER_STATUS.IN_PROGRESS] },
  };
  if (branchId) where.branchId = branchId;

  return prisma.order.findMany({
    where,
    include: {
      table: { select: { tableNumber: true } },
      orderItems: {
        where: { kitchenSent: true },
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

module.exports = {
  createOrder,
  addOrderItems,
  removeOrderItem,
  sendToKitchen,
  updateOrderStatus,
  getOrderById,
  getActiveOrderByTable,
  listOrders,
  getKitchenOrders,
};
