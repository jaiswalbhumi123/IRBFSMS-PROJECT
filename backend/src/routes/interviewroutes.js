const express = require('express');
const router = express.Router();
const { scheduleInterview, getInterviews, updateInterviewStatus } = require('../controllers/interviewcontroller');
const { protect } = require('../middleware/authmiddleware');

router.post('/', protect, scheduleInterview);
router.get('/', protect, getInterviews);
router.put('/:id/status', protect, updateInterviewStatus);

module.exports = router;

