const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/register', ctrl.register);

router.post('/login', ctrl.login);

router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
