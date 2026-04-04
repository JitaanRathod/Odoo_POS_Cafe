const terminalService = require('../services/terminal.service');
const { success, created } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const terminal = await terminalService.createTerminal(req.body);
    return created(res, { terminal });
  } catch (err) { next(err); }
};

const getAll = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const terminals = await terminalService.getAllTerminals(branchId);
    return success(res, { terminals });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const terminal = await terminalService.getTerminalById(req.params.id);
    return success(res, { terminal });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const terminal = await terminalService.updateTerminal(req.params.id, req.body);
    return success(res, { terminal });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await terminalService.deleteTerminal(req.params.id);
    return success(res, { message: 'Terminal deleted successfully' });
  } catch (err) { next(err); }
};

module.exports = { create, getAll, getById, update, remove };
