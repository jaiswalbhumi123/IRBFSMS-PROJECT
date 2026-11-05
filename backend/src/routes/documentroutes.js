const express = require('express');
const router = express.Router();
const { 
  uploadDocument, 
  getDocuments, 
  deleteDocument 
} = require('../controllers/documentcontroller');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');

// Routes
router.get('/', protect, getDocuments);
router.post('/upload', protect, upload.single('file'), uploadDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;

