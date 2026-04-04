// src/services/payment-settings.service.js
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const { ERRORS } = require('../utils/constants');

/**
 * Get payment settings for a terminal.
 * Auto-creates defaults if none exist.
 */
const getSettings = async (terminalId) => {
  const terminal = await prisma.posTerminal.findUnique({ where: { id: terminalId } });
  if (!terminal) throw new AppError(ERRORS.TERMINAL_NOT_FOUND, 404);

  let settings = await prisma.paymentSettings.findUnique({ where: { terminalId } });

  if (!settings) {
    settings = await prisma.paymentSettings.create({
      data: {
        terminalId,
        enableCash: true,
        enableCard: false,
        enableUpi: false,
      },
    });
  }

  return settings;
};

/**
 * Update (upsert) payment settings for a terminal.
 */
const updateSettings = async (terminalId, data) => {
  const terminal = await prisma.posTerminal.findUnique({ where: { id: terminalId } });
  if (!terminal) throw new AppError(ERRORS.TERMINAL_NOT_FOUND, 404);

  // Enforce at least one payment method enabled
  if (!data.enableCash && !data.enableCard && !data.enableUpi) {
    throw new AppError('At least one payment method must be enabled', 400);
  }

  // UPI fields required if UPI is enabled
  if (data.enableUpi && !data.upiId) {
    throw new AppError('UPI ID is required when UPI is enabled', 400);
  }

  return prisma.paymentSettings.upsert({
    where: { terminalId },
    update: {
      enableCash: data.enableCash ?? true,
      enableCard: data.enableCard ?? false,
      enableUpi: data.enableUpi ?? false,
      upiId: data.upiId || null,
      upiName: data.upiName || null,
      merchantCode: data.merchantCode || null,
    },
    create: {
      terminalId,
      enableCash: data.enableCash ?? true,
      enableCard: data.enableCard ?? false,
      enableUpi: data.enableUpi ?? false,
      upiId: data.upiId || null,
      upiName: data.upiName || null,
      merchantCode: data.merchantCode || null,
    },
  });
};

module.exports = { getSettings, updateSettings };
