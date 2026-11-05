const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { getAllJobs, createJob, updateJobStatus, updateJob, deleteJob } = require('../controllers/jobcontroller');

router.get('/', protect, getAllJobs);
router.post('/', protect, createJob);
router.put('/:id/status', protect, updateJobStatus);
router.put('/:id', protect, updateJob);
router.delete('/:id', protect, deleteJob);

module.exports = router;