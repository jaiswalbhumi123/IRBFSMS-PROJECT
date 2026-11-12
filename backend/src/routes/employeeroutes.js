const express = require('express');
const router = express.Router();
const {
  selectModule,
  getDashboardData,
  startBreak,
  endBreak,
  updateTaskStatus,
  submitDailyReport,
  getWorkLog,
  getMyWfhStatus,
  applyWfh
} = require('../controllers/employeecontroller');
const { protect } = require('../middleware/authmiddleware');
const { addClient } = require('../utils/realtime');

router.use(protect); // All employee routes require JWT login

// Real-Time SSE Stream for millisecond updates
router.get('/live-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('data: {"type":"CONNECTED"}\n\n');
  addClient(res);
});

router.put('/select-module', selectModule);
router.get('/dashboard-data', getDashboardData);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);
router.put('/tasks/:id/status', updateTaskStatus);
router.post('/daily-report', submitDailyReport);
router.get('/work-log', getWorkLog);
router.get('/my-wfh-status', protect, getMyWfhStatus);
router.post('/apply-wfh', protect, applyWfh);


module.exports = router;
