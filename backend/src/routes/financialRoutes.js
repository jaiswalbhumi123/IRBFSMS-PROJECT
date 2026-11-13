const express = require('express');
const router = express.Router();
const { 
  createLoanApp, 
  getLoanApps, 
  getLoanAppById,
  updateLoanStatus, 
  createCreditCardApp, 
  getCreditCardApps, 
  getCreditCardAppById,
  updateCreditCardStatus,
  getFinancialStats, 
  uploadDocument,
  getFinancialDocuments
} = require('../controllers/financialcontroller');
const { protect } = require('../middleware/authmiddleware');
const upload = require('../middleware/uploadmiddleware');

// 1. Stats & KPIs
router.get('/stats', protect, getFinancialStats);
router.get('/dashboard-stats', protect, getFinancialStats);

// 2. Loans
router.post('/loans', protect, createLoanApp);
router.get('/loans', protect, getLoanApps);
router.get('/loans/:id', protect, getLoanAppById);
router.put('/loans/:id/status', protect, updateLoanStatus);

// 3. Credit Cards
router.post('/credit-cards', protect, createCreditCardApp);
router.get('/credit-cards', protect, getCreditCardApps);
router.get('/credit-cards/:id', protect, getCreditCardAppById);
router.put('/credit-cards/:id/status', protect, updateCreditCardStatus);

// 4. KYC Documents
router.get('/documents', protect, getFinancialDocuments);
router.post('/documents', protect, upload.single('document'), uploadDocument);

module.exports = router;