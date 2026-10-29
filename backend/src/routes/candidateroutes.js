const express = require('express');
const router = express.Router();
const { 
  createCandidate, 
  getCandidates, 
  updateCandidateStatus, 
  getRecruitmentStats 
} = require('../controllers/candidatecontroller');
const { protect } = require('../middleware/authmiddleware');

router.get('/stats', protect, getRecruitmentStats);
router.get('/', protect, getCandidates);
router.post('/', protect, createCandidate);
router.put('/:id/status', protect, updateCandidateStatus);

module.exports = router;
