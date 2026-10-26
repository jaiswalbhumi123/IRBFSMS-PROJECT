const express = require('express');
const router = express.Router();
const { getAllJobs, createJob, updateJobStatus } = require('../controllers/jobcontroller');
const { protect } = require('../middleware/authmiddleware');

router.get('/', protect, getAllJobs);
router.post('/', protect, createJob);
router.put('/:id/status', protect, updateJobStatus);

module.exports = router;

module.exports = router;