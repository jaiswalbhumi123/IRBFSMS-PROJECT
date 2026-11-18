const { body, validationResult } = require('express-validator');

// Login ke liye Rules
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 5 }).withMessage('Password must be at least 5 characters'),
  
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['Admin', 'Employee']).withMessage('Role must be Admin or Employee'),

  // Error check karne ka function
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Sirf pehla error bhejenge taaki frontend pe clean dikhe
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  }
];

// Job add karne ke liye Rules (Tujhe aise hi aur bhi bana sakti hai)
exports.validateJob = [
  body('title').trim().notEmpty().withMessage('Job title is required').escape(),
  body('department').notEmpty().withMessage('Department is required'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    next();
  }
];