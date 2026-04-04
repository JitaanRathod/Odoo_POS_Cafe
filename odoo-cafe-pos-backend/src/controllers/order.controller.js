const orderService = require('../services/order.service');
const { success, created } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.body, req.user.id);
    return created(res, { order });
  } catch (err) { next(err); }
};

const addItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }
    const result = await orderService.addOrderItems(req.params.id, items);
    return success(res, result);
  } catch (err) { next(err); }
};

const removeItem = async (req, res, next) => {
  try {
    const order = await orderService.removeOrderItem(req.params.id, req.params.itemId);
    return success(res, { order });
  } catch (err) { next(err); }
};

const sendToKitchen = async (req, res, next) => {
  try {
    const order = await orderService.sendToKitchen(req.params.id);
    return success(res, { order });
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const order = await orderService.updateOrderStatus(req.params.id, status);
    return success(res, { order });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return success(res, { order });
  } catch (err) { next(err); }
};

const getByTable = async (req, res, next) => {
  try {
    const order = await orderService.getActiveOrderByTable(req.params.tableId);
    return success(res, { order });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const result = await orderService.listOrders(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const kitchen = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const orders = await orderService.getKitchenOrders(branchId);
    return success(res, { orders });
  } catch (err) { next(err); }
};

module.exports = { create, addItems, removeItem, sendToKitchen, updateStatus, getById, getByTable, list, kitchen };
