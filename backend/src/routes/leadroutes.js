const express = require('express');
const router = express.Router();
const { 
  createLead, 
  getLeads, 
  updateLeadStatus, 
  updateFollowUp, 
  getCrmStats 
} = require('../controllers/leadcontroller');
const { protect } = require('../middleware/authmiddleware');

router.get('/stats', protect, getCrmStats);
router.get('/', protect, getLeads);
router.post('/', protect, createLead);
router.put('/:id/status', protect, updateLeadStatus);
router.put('/:id/follow-up', protect, updateFollowUp);

module.exports = router;

module.exports = router;