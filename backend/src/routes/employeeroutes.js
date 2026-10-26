const express = require('express');
const router = express.Router();
const {
  selectModule,
  getDashboardData,
  startBreak,
  endBreak,
  updateTaskStatus,
  submitDailyReport,
  getWorkLog
} = require('../controllers/employeecontroller');
const { protect } = require('../middleware/authmiddleware');

router.use(protect); // All employee routes require JWT login

router.put('/select-module', selectModule);
router.get('/dashboard-data', getDashboardData);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);
router.put('/tasks/:id/status', updateTaskStatus);
router.post('/daily-report', submitDailyReport);
router.get('/work-log', getWorkLog);

module.exports = router;

