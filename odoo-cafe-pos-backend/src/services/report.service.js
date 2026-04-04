// src/services/report.service.js
// Sales, session summaries, and dashboard stats — Member 2 domain

const prisma = require('../config/prisma');
const { ORDER_STATUS, PAYMENT_METHOD } = require('../utils/constants');

/**
 * Dashboard summary stats
 */
const getDashboardStats = async (branchId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const where = { createdAt: { gte: today, lt: tomorrow } };
  if (branchId) where.branchId = branchId;

  const [totalOrders, completedOrders, revenue, activeOrders, topProducts] = await Promise.all([
    // Total orders today
    prisma.order.count({ where }),

    // Completed orders today
    prisma.order.count({ where: { ...where, status: ORDER_STATUS.COMPLETED } }),

    // Revenue today
    prisma.order.aggregate({
      where: { ...where, status: ORDER_STATUS.COMPLETED },
      _sum: { totalAmount: true },
    }),

    // Currently active orders
    prisma.order.count({
      where: {
        ...(branchId ? { branchId } : {}),
        status: { in: [ORDER_STATUS.CREATED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.READY] },
      },
    }),

    // Top 5 selling products today
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: { ...where, status: ORDER_STATUS.COMPLETED },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  // Payment method breakdown today
  const paymentBreakdown = await prisma.payment.groupBy({
    by: ['method'],
    where: {
      status: 'COMPLETED',
      order: { ...where, status: ORDER_STATUS.COMPLETED },
    },
    _sum: { amount: true },
    _count: true,
  });

  return {
    today: {
      totalOrders,
      completedOrders,
      activeOrders,
      revenue: Number(revenue._sum.totalAmount ?? 0),
      averageOrderValue:
        completedOrders > 0
          ? Number(revenue._sum.totalAmount ?? 0) / completedOrders
          : 0,
    },
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p.method,
      total: Number(p._sum.amount ?? 0),
      count: p._count,
    })),
    topProducts: topProducts.map((p) => ({
      productId: p.productId,
      name: p.productName,
      quantitySold: p._sum.quantity,
    })),
  };
};

/**
 * Sales report — daily/weekly/monthly
 * Returns daily aggregates within the given date range
 */
const getSalesReport = async ({ branchId, from, to }) => {
  const fromDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d; })();
  const toDate = to ? new Date(to) : new Date();

  const where = {
    status: ORDER_STATUS.COMPLETED,
    createdAt: { gte: fromDate, lte: toDate },
  };
  if (branchId) where.branchId = branchId;

  const orders = await prisma.order.findMany({
    where,
    select: {
      totalAmount: true,
      taxAmount: true,
      orderType: true,
      createdAt: true,
      payments: { select: { method: true, amount: true } },
    },
  });

  // Group by date
  const byDate = {};
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().slice(0, 10);
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        date: dateKey,
        orders: 0,
        revenue: 0,
        tax: 0,
        dineIn: 0,
        takeaway: 0,
        cash: 0,
        card: 0,
        upi: 0,
      };
    }
    const day = byDate[dateKey];
    day.orders += 1;
    day.revenue += Number(order.totalAmount);
    day.tax += Number(order.taxAmount);
    if (order.orderType === 'DINE_IN') day.dineIn += 1;
    else day.takeaway += 1;

    for (const p of order.payments) {
      if (p.method === PAYMENT_METHOD.CASH) day.cash += Number(p.amount);
      else if (p.method === PAYMENT_METHOD.CARD) day.card += Number(p.amount);
      else if (p.method === PAYMENT_METHOD.UPI) day.upi += Number(p.amount);
    }
  }

  const dailyData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  const totals = dailyData.reduce(
    (acc, day) => {
      acc.orders += day.orders;
      acc.revenue += day.revenue;
      acc.tax += day.tax;
      return acc;
    },
    { orders: 0, revenue: 0, tax: 0 }
  );

  return { from: fromDate, to: toDate, totals, dailyData };
};

/**
 * Session summary report
 */
const getSessionReport = async (sessionId) => {
  const session = await prisma.posSession.findUnique({
    where: { id: sessionId },
    include: {
      terminal: { include: { branch: { select: { name: true } } } },
      orders: {
        include: {
          payments: true,
          orderItems: { include: { product: { select: { name: true } } } },
        },
      },
    },
  });

  if (!session) return null;

  const completedOrders = session.orders.filter((o) => o.status === ORDER_STATUS.COMPLETED);

  const paymentBreakdown = { CASH: 0, CARD: 0, UPI: 0 };
  let totalRevenue = 0;

  for (const order of completedOrders) {
    totalRevenue += Number(order.totalAmount);
    for (const p of order.payments) {
      paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + Number(p.amount);
    }
  }

  return {
    session: {
      id: session.id,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openingCash: Number(session.openingCash),
      closingCash: session.closingCash ? Number(session.closingCash) : null,
      terminal: session.terminal?.name,
      branch: session.terminal?.branch?.name,
    },
    summary: {
      totalOrders: session.orders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: session.orders.filter((o) => o.status === 'CANCELLED').length,
      totalRevenue,
      paymentBreakdown,
    },
  };
};

module.exports = { getDashboardStats, getSalesReport, getSessionReport };
