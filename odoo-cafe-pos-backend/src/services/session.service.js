// src/services/session.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const { ERRORS, SOCKET_EVENTS } = require('../utils/constants');
const socketUtil = require('../utils/socket');

const sessionInclude = {
  terminal: {
    include: {
      branch: { select: { id: true, name: true } },
    },
  },
};

/**
 * Open a new POS session for a terminal
 * - Only one active session per terminal at a time
 */
const openSession = async (terminalId, userId, openingCash = 0) => {
  const terminal = await prisma.posTerminal.findUnique({ where: { id: terminalId } });
  if (!terminal) throw new AppError(ERRORS.TERMINAL_NOT_FOUND, 404);

  const activeSession = await prisma.posSession.findFirst({
    where: { terminalId, closedAt: null },
  });
  if (activeSession) throw new AppError(ERRORS.SESSION_ACTIVE, 409);

  // Open session + link user to terminal in one transaction
  const [session] = await prisma.$transaction([
    prisma.posSession.create({
      data: { terminalId, openingCash },
      include: sessionInclude,
    }),
    prisma.posTerminal.update({
      where: { id: terminalId },
      data: { userId },
    }),
  ]);

  return session;
};

/**
 * Close a POS session
 * - Calculates total sales from all completed orders in session
 * - Unlinks user from terminal
 */
const closeSession = async (sessionId, closingCash) => {
  const session = await prisma.posSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError(ERRORS.SESSION_NOT_FOUND, 404);
  if (session.closedAt) throw new AppError(ERRORS.SESSION_CLOSED, 400);

  // Aggregate completed order totals for this session
  const { _sum } = await prisma.order.aggregate({
    where: { sessionId, status: 'COMPLETED' },
    _sum: { totalAmount: true },
  });

  const totalSales = _sum.totalAmount ?? 0;

  const [closedSession] = await prisma.$transaction([
    prisma.posSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        totalSales,
        ...(closingCash !== undefined && { closingCash }),
      },
      include: sessionInclude,
    }),
    prisma.posTerminal.update({
      where: { id: session.terminalId },
      data: { userId: null },
    }),
  ]);

  socketUtil.emit(SOCKET_EVENTS.SESSION_CLOSED, { sessionId, totalSales });

  return closedSession;
};

/**
 * Get session by ID (with orders summary)
 */
const getSessionById = async (sessionId) => {
  const session = await prisma.posSession.findUnique({
    where: { id: sessionId },
    include: {
      ...sessionInclude,
      orders: {
        select: {
          id: true,
          orderType: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!session) throw new AppError(ERRORS.SESSION_NOT_FOUND, 404);
  return session;
};

/**
 * Get currently open session for a terminal
 */
const getCurrentSession = async (terminalId) => {
  const session = await prisma.posSession.findFirst({
    where: { terminalId, closedAt: null },
    include: sessionInclude,
  });
  if (!session) throw new AppError(ERRORS.NO_ACTIVE_SESSION, 404);
  return session;
};

/**
 * Get all active (open) sessions across terminals
 */
const getActiveSessions = async () => {
  return prisma.posSession.findMany({
    where: { closedAt: null },
    include: sessionInclude,
    orderBy: { openedAt: 'desc' },
  });
};

/**
 * Get session history (closed sessions) with optional filters
 */
const getSessionHistory = async ({ terminalId, from, to, limit = 20, offset = 0 }) => {
  const where = { closedAt: { not: null } };
  if (terminalId) where.terminalId = terminalId;
  if (from || to) {
    where.openedAt = {};
    if (from) where.openedAt.gte = new Date(from);
    if (to) where.openedAt.lte = new Date(to);
  }

  const [sessions, total] = await Promise.all([
    prisma.posSession.findMany({
      where,
      include: sessionInclude,
      orderBy: { openedAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.posSession.count({ where }),
  ]);

  return { sessions, total, limit: parseInt(limit), offset: parseInt(offset) };
};

module.exports = {
  openSession,
  closeSession,
  getSessionById,
  getCurrentSession,
  getActiveSessions,
  getSessionHistory,
};
