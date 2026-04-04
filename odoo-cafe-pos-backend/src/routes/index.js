const router = require('express').Router();
const authRoutes = require('./auth.routes');
const terminalRoutes = require('./terminal.routes');
const sessionRoutes = require('./session.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const paymentSettingsRoutes = require('./payment-settings.routes');
const customerRoutes = require('./customer.routes');
const reportRoutes = require('./report.routes');
router.use('/auth', authRoutes);
router.use('/terminals', terminalRoutes);
router.use('/sessions', sessionRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/payment-settings', paymentSettingsRoutes);
router.use('/customers', customerRoutes);
router.use('/reports', reportRoutes);
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Odoo Cafe POS API is running',
    timestamp: new Date().toISOString(),
  });
});
module.exports = router;