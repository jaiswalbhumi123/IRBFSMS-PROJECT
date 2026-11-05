const express = require('express');
const router = express.Router();
const { 
  createClient, 
  getClients, 
  updateClientStatus, 
  uploadClientDocument, 
  getClientDocuments 
} = require('../controllers/clientcontroller');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');

router.post('/', protect, createClient);
router.get('/', protect, getClients);
router.put('/:id/status', protect, updateClientStatus);

// Client Documents
router.get('/:id/documents', protect, getClientDocuments);
router.post('/:id/documents', protect, upload.single('document'), uploadClientDocument);

// Client Documents
router.get('/:id/documents', protect, getClientDocuments);
router.post('/:id/documents', protect, upload.single('document'), uploadClientDocument);

module.exports = router;