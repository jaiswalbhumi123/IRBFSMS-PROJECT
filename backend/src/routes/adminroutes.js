const express = require('express');
const router = express.Router();
const { getLiveEmployees, getDashboardStats } = require('../controllers/admincontroller');
const { protect, adminOnly } = require('../middleware/authmiddleware');

router.get('/live-employees', protect, adminOnly, getLiveEmployees);
router.get('/stats', protect, adminOnly, getDashboardStats);

module.exports = router;