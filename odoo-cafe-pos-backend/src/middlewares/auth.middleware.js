const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const prisma = require('../config/prisma');
const { ERRORS } = require('../utils/constants');
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: ERRORS.UNAUTHORIZED });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: ERRORS.FORBIDDEN });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
