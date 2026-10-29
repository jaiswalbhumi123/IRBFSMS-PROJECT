const express = require('express');
const router = express.Router();
const { createClient, getClients, updateClientStatus } = require('../controllers/clientcontroller');
const { protect } = require('../middleware/authmiddleware');

router.post('/', protect, createClient);
router.get('/', protect, getClients);
router.put('/:id/status', protect, updateClientStatus);

module.exports = router;

module.exports = router;