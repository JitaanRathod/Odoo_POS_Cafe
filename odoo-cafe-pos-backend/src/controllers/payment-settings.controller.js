const settingsService = require('../services/payment-settings.service');
const { success } = require('../utils/response');

const get = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings(req.params.terminalId);
    return success(res, { settings });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.params.terminalId, req.body);
    return success(res, { settings });
  } catch (err) { next(err); }
};

module.exports = { get, update };
