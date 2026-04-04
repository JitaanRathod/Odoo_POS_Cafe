// src/services/payment.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const {
  ERRORS,
  ORDER_STATUS,
  ORDER_TYPE,
  TABLE_STATUS,
  PAYMENT_STATUS,
  SOCKET_EVENTS,
} = require('../utils/constants');
const socketUtil = require('../utils/socket');

// ─────────────────────────────────────────────────────────────
// RECEIPT NUMBER GENERATION
// ─────────────────────────────────────────────────────────────
const generateReceiptNumber = () => {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCPT-${yyyymmdd}-${rand}`;
};

// ─────────────────────────────────────────────────────────────
// PROCESS PAYMENT
// ─────────────────────────────────────────────────────────────

/**
 * Process a payment for an order
 *
 * Supports:
 *  - Single payment (CASH / CARD / UPI)
 *  - Split payment: pass method = 'SPLIT' and splitPayments: [{ method, amount }]
 *
 * On success:
 *  - Marks order COMPLETED
 *  - Frees table (if DINE_IN and no other active orders)
 *  - Updates customer totalSpent
 *  - Generates a receipt
 *  - Emits socket events
 */
const processPayment = async ({ orderId, method, amount, reference, upiId, splitPayments }) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: true },
  });

  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);
  if (order.status === ORDER_STATUS.COMPLETED) throw new AppError(ERRORS.ORDER_ALREADY_PAID, 400);
  if (order.status === ORDER_STATUS.CANCELLED) throw new AppError(ERRORS.ORDER_CANCELLED, 400);
  if (order.orderItems.length === 0) throw new AppError(ERRORS.ORDER_EMPTY, 400);

  const isSplit = method === 'SPLIT';

  if (isSplit) {
    if (!splitPayments || splitPayments.length < 2) {
      throw new AppError('Split payment requires at least 2 payment entries', 400);
    }
    const splitTotal = splitPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const orderTotal = Number(order.totalAmount);
    if (Math.abs(splitTotal - orderTotal) > 0.01) {
      throw new AppError(
        `Split total (${splitTotal}) does not match order total (${orderTotal})`,
        400
      );
    }
  } else {
    if (Number(amount) < Number(order.totalAmount)) {
      throw new AppError('Payment amount is less than order total', 400);
    }
  }

  // Build payment records to create
  const paymentsToCreate = isSplit
    ? splitPayments.map((p) => ({
        orderId,
        method: p.method,
        amount: p.amount,
        status: PAYMENT_STATUS.COMPLETED,
        reference: p.reference || null,
        upiId: p.upiId || null,
      }))
    : [
        {
          orderId,
          method,
          amount,
          status: PAYMENT_STATUS.COMPLETED,
          reference: reference || null,
          upiId: upiId || null,
        },
      ];

  const receiptNumber = generateReceiptNumber();

  const result = await prisma.$transaction(async (tx) => {
    // Create all payment records
    const payments = await Promise.all(
      paymentsToCreate.map((p) => tx.payment.create({ data: p }))
    );

    // Mark order completed
    await tx.order.update({
      where: { id: orderId },
      data: { status: ORDER_STATUS.COMPLETED },
    });

    // Generate receipt
    const receipt = await tx.receipt.create({
      data: { orderId, receiptNumber },
    });

    let tableFreed = false;

    // Free table if applicable
    if (order.orderType === ORDER_TYPE.DINE_IN && order.tableId) {
      const activeCount = await tx.order.count({
        where: {
          tableId: order.tableId,
          id: { not: orderId },
          status: { in: [ORDER_STATUS.CREATED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.READY] },
        },
      });
      if (activeCount === 0) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: TABLE_STATUS.FREE },
        });
        tableFreed = true;
      }
    }

    // Update customer total spent
    if (order.customerId) {
      await tx.customer.update({
        where: { id: order.customerId },
        data: { totalSpent: { increment: order.totalAmount } },
      });
    }

    return { payments, receipt, tableFreed };
  });

  // Socket events
  socketUtil.emit(SOCKET_EVENTS.PAYMENT_RECEIVED, {
    orderId,
    receiptNumber,
    totalAmount: order.totalAmount,
  });

  if (result.tableFreed && order.tableId) {
    socketUtil.emit(SOCKET_EVENTS.TABLE_STATUS_CHANGE, {
      tableId: order.tableId,
      status: TABLE_STATUS.FREE,
    });
  }

  return { payments: result.payments, receipt: result.receipt };
};

// ─────────────────────────────────────────────────────────────
// RECEIPT
// ─────────────────────────────────────────────────────────────

/**
 * Generate / fetch receipt data for an order
 */
const getReceipt = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      branch: true,
      table: { select: { tableNumber: true } },
      customer: { select: { name: true, phone: true, email: true } },
      cashier: { select: { name: true } },
      orderItems: { include: { product: { select: { name: true } } } },
      payments: true,
      receipts: true,
    },
  });

  if (!order) throw new AppError(ERRORS.ORDER_NOT_FOUND, 404);

  // Reuse existing receipt number or generate a new one
  const receiptNumber =
    order.receipts[0]?.receiptNumber || generateReceiptNumber();

  if (!order.receipts[0]) {
    await prisma.receipt.create({ data: { orderId, receiptNumber } });
  }

  return {
    receiptNumber,
    generatedAt: order.receipts[0]?.generatedAt || new Date(),
    branch: order.branch ? { id: order.branch.id, name: order.branch.name } : null,
    table: order.table ? { number: order.table.tableNumber } : null,
    orderType: order.orderType,
    cashier: order.cashier?.name || 'N/A',
    customer: order.customer || null,
    items: order.orderItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      taxRate: Number(item.taxRate),
      lineTotal: Number(item.unitPrice) * item.quantity,
    })),
    subtotal: Number(order.totalAmount) - Number(order.taxAmount),
    taxAmount: Number(order.taxAmount),
    totalAmount: Number(order.totalAmount),
    payments: order.payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
      reference: p.reference,
    })),
    notes: order.notes,
  };
};

// ─────────────────────────────────────────────────────────────
// PAYMENT QUERIES
// ─────────────────────────────────────────────────────────────

/**
 * List payments with filters
 */
const listPayments = async ({ method, status, from, to, limit = 50, offset = 0 }) => {
  const where = {};
  if (method && method !== 'ALL') where.method = method;
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderType: true,
            totalAmount: true,
            table: { select: { tableNumber: true } },
            receipts: { select: { receiptNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total, limit: parseInt(limit), offset: parseInt(offset) };
};

module.exports = { processPayment, getReceipt, listPayments };
