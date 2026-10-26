const express = require('express');
const router = express.Router();
const { createCandidate, getCandidates, updateCandidateStatus } = require('../controllers/candidateController');
const { protect } = require('../middleware/authmiddleware');

router.post('/', protect, createCandidate);
router.get('/', protect, getCandidates);
router.put('/:id/status', protect, updateCandidateStatus);

module.exports = router;