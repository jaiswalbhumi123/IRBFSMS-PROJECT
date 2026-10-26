const express = require('express');
const router = express.Router();
const { createTask, getMyTasks, updateTaskStatus } = require('../controllers/taskcontroller');
const { protect, adminOnly } = require('../middleware/authmiddleware');

router.post('/', protect, adminOnly, createTask);
router.get('/my', protect, getMyTasks);
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;

