const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');
const {
  validateCustomerRegister,
  validateCustomerLogin
} = require('../middleware/validationMiddleware');

// Graceful Multer wrapper that returns friendly 400 JSON instead of unhandled 500
const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      console.warn('Customer file upload warning:', err.message);
      return res.status(400).json({
        message: err.message || 'File upload failed. Allowed formats: PDF, DOC, DOCX, JPG, PNG (Max 15MB)'
      });
    }
    next();
  });
};

// 1. Public Routes
router.post('/register', validateCustomerRegister, customerController.register);
router.post('/login', validateCustomerLogin, customerController.login);
router.get('/track/:id', customerController.trackApplication);

// 2. Protected Routes (Customer JWT Required)
router.post('/apply-loan', protect, handleUpload('document'), customerController.applyLoan);
router.post('/apply-card', protect, handleUpload('document'), customerController.applyCreditCard);
router.get('/my-applications', protect, customerController.getMyApplications);

module.exports = router;
