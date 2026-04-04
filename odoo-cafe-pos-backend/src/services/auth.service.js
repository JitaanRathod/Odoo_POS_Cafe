// src/services/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { ERRORS } = require('../utils/constants');
const { AppError } = require('../utils/response');

const generateToken = (userId) =>
  jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpiresIn });

/**
 * Register a new user
 */
const register = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(ERRORS.EMAIL_IN_USE, 409);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || 'CASHIER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken(user.id);
  return { user, token };
};

/**
 * Login
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);

  const token = generateToken(user.id);

  const { password: _pw, ...safeUser } = user;
  return { user: safeUser, token };
};

/**
 * Get profile by user id
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new AppError(ERRORS.NOT_FOUND('User'), 404);
  return user;
};

module.exports = { register, login, getProfile };
