const customerService = require('../services/customer.service');
const { success, created } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    return created(res, { customer });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const result = await customerService.listCustomers(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return success(res, { customer });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    return success(res, { customer });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.params.id);
    return success(res, { message: 'Customer deleted successfully' });
  } catch (err) { next(err); }
};

const topCustomers = async (req, res, next) => {
  try {
    const customers = await customerService.getTopCustomers(req.query.limit);
    return success(res, { customers });
  } catch (err) { next(err); }
};

module.exports = { create, list, getById, update, remove, topCustomers };
