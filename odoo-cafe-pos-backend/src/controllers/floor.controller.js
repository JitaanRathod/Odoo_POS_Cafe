const floorService = require('../services/floor.service');
const { success, created } = require('../utils/response');

const list = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const floors = await floorService.getFloors(branchId);
    return success(res, { floors });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const floor = await floorService.createFloor(req.body);
    return created(res, { floor });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const floor = await floorService.updateFloor(req.params.id, req.body);
    return success(res, { floor });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await floorService.deleteFloor(req.params.id);
    return success(res, { message: 'Floor deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await floorService.getTablesByFloor(req.params.floorId);
    return success(res, { tables });
  } catch (err) {
    next(err);
  }
};

const createTable = async (req, res, next) => {
  try {
    const table = await floorService.createTable(req.params.floorId, req.body);
    return created(res, { table });
  } catch (err) {
    next(err);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const table = await floorService.updateTable(req.params.tableId, req.body);
    return success(res, { table });
  } catch (err) {
    next(err);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    await floorService.deleteTable(req.params.tableId);
    return success(res, { message: 'Table deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  update,
  remove,
  getTables,
  createTable,
  updateTable,
  deleteTable
};