const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');
const {
  validateCustomerRegister,
  validateCustomerLogin
} = require('../middleware/validationMiddleware');

// 1. Public Routes
router.post('/register', validateCustomerRegister, customerController.register);
router.post('/login', validateCustomerLogin, customerController.login);
router.get('/track/:id', customerController.trackApplication);

// 2. Protected Routes (Customer JWT Required)
router.post('/apply-loan', protect, upload.single('document'), customerController.applyLoan);
router.post('/apply-card', protect, upload.single('document'), customerController.applyCreditCard);
router.get('/my-applications', protect, customerController.getMyApplications);

module.exports = router;
