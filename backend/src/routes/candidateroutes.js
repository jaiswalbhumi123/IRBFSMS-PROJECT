const express = require('express');
const router = express.Router();
const { 
  createCandidate, 
  getCandidates, 
  updateCandidateStatus, 
  getRecruitmentStats,
  uploadCandidateResume,
  updateCandidate,
  deleteCandidate,
  getCandidateById
} = require('../controllers/candidatecontroller');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');

// Recruitment Stats
router.get('/stats', protect, getRecruitmentStats);

// Candidates
router.get('/', protect, getCandidates);
router.post('/', protect, upload.single('resume'), createCandidate);
router.post('/:id/resume', protect, upload.single('resume'), uploadCandidateResume);
router.put('/:id/status', protect, updateCandidateStatus);
router.put('/:id', protect, updateCandidate);
router.delete('/:id', protect, deleteCandidate);
router.get('/:id', protect, getCandidateById);

module.exports = router;
