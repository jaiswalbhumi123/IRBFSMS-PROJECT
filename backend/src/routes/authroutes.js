const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authmiddleware');
const { validateLogin } = require('../middleware/validationMiddleware');

//add validateLogin add
router.post('/login', validateLogin, login);

router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;