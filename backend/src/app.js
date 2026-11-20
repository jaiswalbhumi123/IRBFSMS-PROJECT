const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes');
const employeeRoutes = require('./routes/employeeroutes');
const taskRoutes = require('./routes/taskroutes');
const candidateRoutes = require('./routes/candidateroutes');
const interviewRoutes = require('./routes/interviewroutes');
const jobRoutes = require('./routes/jobroutes');
const clientRoutes = require('./routes/clientroutes');
const leadRoutes = require('./routes/leadroutes');
const financialRoutes = require('./routes/financialroutes');
const documentRoutes = require('./routes/documentroutes');
const customerRoutes = require('./routes/customerRoutes'); // 👈 Sirf ek baar

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. General Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// 2. Strict Login Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/', (req, res) => res.json({ message: 'Benefit BBS API is running' }));

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/customer', customerRoutes); 

// 404 Catch-all handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;
