const sessionService = require('../services/session.service');
const { success, created } = require('../utils/response');

const open = async (req, res, next) => {
  try {
    const { terminalId, openingCash } = req.body;
    if (!terminalId) {
      return res.status(400).json({ success: false, message: 'terminalId is required' });
    }
    const session = await sessionService.openSession(terminalId, req.user.id, openingCash);
    return created(res, { session });
  } catch (err) { next(err); }
};

const close = async (req, res, next) => {
  try {
    const { closingCash } = req.body;
    const session = await sessionService.closeSession(req.params.id, closingCash);
    return success(res, { session });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    return success(res, { session });
  } catch (err) { next(err); }
};

const getCurrent = async (req, res, next) => {
  try {
    const { terminalId } = req.query;
    if (!terminalId) {
      return res.status(400).json({ success: false, message: 'terminalId query param required' });
    }
    const session = await sessionService.getCurrentSession(terminalId);
    return success(res, { session });
  } catch (err) { next(err); }
};

const getActive = async (req, res, next) => {
  try {
    const sessions = await sessionService.getActiveSessions();
    return success(res, { sessions });
  } catch (err) { next(err); }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await sessionService.getSessionHistory(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = { open, close, getById, getCurrent, getActive, getHistory };
