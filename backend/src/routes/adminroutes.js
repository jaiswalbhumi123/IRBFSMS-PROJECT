const express = require('express');
const router = express.Router();
const { getLiveEmployees, getDashboardStats,getEmployeeLiveDetails,getAllUsers,createUser } = require('../controllers/admincontroller');
const { protect, adminOnly } = require('../middleware/authmiddleware');

router.get('/live-employees', protect, adminOnly, getLiveEmployees);
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
    
module.exports = router;