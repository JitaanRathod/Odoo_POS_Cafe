// src/controllers/floor.controller.js
const floorService = require('../services/floor.service');
const { success } = require('../utils/response');

const getFloors = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const floors = await floorService.getFloors(branchId);
    return success(res, { floors });
  } catch (err) { next(err); }
};

module.exports = { getFloors };
