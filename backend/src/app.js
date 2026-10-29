const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authroutes');
const adminRoutes = require('./routes/adminroutes');
const employeeRoutes = require('./routes/employeeroutes');
const taskRoutes = require('./routes/taskroutes');
const candidateRoutes = require('./routes/candidateroutes');
const interviewRoutes = require('./routes/interviewroutes');
const clientRoutes = require('./routes/clientroutes');
const leadRoutes = require('./routes/leadroutes');
// ...
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Benefit BBS API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobs', require('./routes/jobroutes'));
app.use('/api/clients', clientRoutes);
app.use('/api/leads', leadRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

module.exports = app;