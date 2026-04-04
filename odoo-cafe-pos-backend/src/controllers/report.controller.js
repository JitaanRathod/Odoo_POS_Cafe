const reportService = require('../services/report.service');
const { success } = require('../utils/response');

const dashboard = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const stats = await reportService.getDashboardStats(branchId);
    return success(res, { stats });
  } catch (err) { next(err); }
};

const sales = async (req, res, next) => {
  try {
    const result = await reportService.getSalesReport(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const sessionReport = async (req, res, next) => {
  try {
    const report = await reportService.getSessionReport(req.params.sessionId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    return success(res, { report });
  } catch (err) { next(err); }
};

module.exports = { dashboard, sales, sessionReport };
