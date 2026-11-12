const express = require('express');
const router = express.Router();
const { 
  getLiveEmployees, 
  getDashboardStats, 
  getAllUsers, 
  createUser,
  getOverviewChartsAndStats,
  getWfhRequests,
  updateWfhStatus,
  createWfhRequest,
  getReportsAnalytics,
  getEmployeeDetailedProfile
} = require('../controllers/admincontroller');
const { protect, adminOnly } = require('../middleware/authmiddleware');

// Screen 9: Live Employee Tracking & Detail Profile
router.get('/live-employees', protect, adminOnly, getLiveEmployees);
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/employee/:id', protect, adminOnly, getEmployeeDetailedProfile);

// Screen 2: Admin Overview & Real-time Recharts
router.get('/overview-charts', protect, adminOnly, getOverviewChartsAndStats);

// Screen 12: Users & Roles
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);

// Screen 11: Work From Home (WFH) Requests
router.get('/wfh-requests', protect, adminOnly, getWfhRequests);
router.put('/wfh-requests/:id', protect, adminOnly, updateWfhStatus);
router.post('/wfh-requests', protect, createWfhRequest);

// Screen 13: Reports & Analytics
router.get('/reports-analytics', protect, adminOnly, getReportsAnalytics);

module.exports = router;
