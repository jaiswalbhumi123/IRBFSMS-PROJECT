const express = require('express');
const router = express.Router();
const { login, logout, me } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authmiddleware');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

module.exports = router;