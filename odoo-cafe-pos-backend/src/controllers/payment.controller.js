const paymentService = require('../services/payment.service');
const { success, created } = require('../utils/response');
const socketUtil = require('../utils/socket');

const process = async (req, res, next) => {
  try {
    const { orderId, method, amount, reference, upiId, splitPayments } = req.body;
    if (!orderId || !method) {
      return res.status(400).json({ success: false, message: 'orderId and method are required' });
    }
    const result = await paymentService.processPayment({
      orderId, method, amount, reference, upiId, splitPayments,
    });
    // Broadcast to all clients so Dashboard updates in real time
    socketUtil.emit('payment:completed', { orderId, method, amount });
    return created(res, result);
  } catch (err) { next(err); }
};

const getReceipt = async (req, res, next) => {
  try {
    const receipt = await paymentService.getReceipt(req.params.orderId);
    return success(res, { receipt });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const result = await paymentService.listPayments(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = { process, getReceipt, list };
