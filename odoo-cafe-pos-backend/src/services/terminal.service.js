// src/services/terminal.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const { ERRORS } = require('../utils/constants');

const terminalInclude = {
  branch: { select: { id: true, name: true } },
  user: { select: { id: true, name: true, email: true, role: true } },
  paymentSettings: true,
  sessions: {
    where: { closedAt: null },
    take: 1,
    select: { id: true, openedAt: true, totalSales: true },
  },
};

/**
 * Create a new POS terminal
 */
const createTerminal = async ({ name, branchId }) => {
  if (!name) throw new AppError('Terminal name is required', 400);

  if (branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new AppError(ERRORS.NOT_FOUND('Branch'), 404);
  }

  return prisma.posTerminal.create({
    data: { name, branchId },
    include: terminalInclude,
  });
};

/**
 * Get all terminals
 */
const getAllTerminals = async (branchId) => {
  const where = branchId ? { branchId } : {};
  return prisma.posTerminal.findMany({
    where,
    include: terminalInclude,
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Get terminal by ID
 */
const getTerminalById = async (id) => {
  const terminal = await prisma.posTerminal.findUnique({
    where: { id },
    include: terminalInclude,
  });
  if (!terminal) throw new AppError(ERRORS.TERMINAL_NOT_FOUND, 404);
  return terminal;
};

/**
 * Update terminal (name or branchId)
 */
const updateTerminal = async (id, data) => {
  await getTerminalById(id); // existence check
  return prisma.posTerminal.update({
    where: { id },
    data: { name: data.name, branchId: data.branchId },
    include: terminalInclude,
  });
};

/**
 * Delete terminal
 */
const deleteTerminal = async (id) => {
  await getTerminalById(id);
  return prisma.posTerminal.delete({ where: { id } });
};

module.exports = {
  createTerminal,
  getAllTerminals,
  getTerminalById,
  updateTerminal,
  deleteTerminal,
};
