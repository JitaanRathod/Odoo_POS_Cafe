const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return created(res, result);
  } catch (err) {
    next(err);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login({ email, password });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, { user });
  } catch (err) {
    next(err);
  }
};
module.exports = { register, login, getMe };