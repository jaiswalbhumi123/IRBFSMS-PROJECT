const pool = require('../config/db');

// 1. Saari jobs fetch karne ka controller (With creator details)
exports.getAllJobs = async (req, res) => {
  try {
    const [jobs] = await pool.query(
      `SELECT j.*, u.name as posted_by_name 
       FROM jobs j 
       LEFT JOIN users u ON j.created_by = u.id 
       ORDER BY j.id DESC`
    );
    res.json(jobs);
  } catch (err) {
    console.error('Fetch jobs error:', err);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
};

// 2. Nayi job create karne ka controller (Full Case Study Specifications)
exports.createJob = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      department, 
      location, 
      openings, 
      qualification, 
      experience_required, 
      salary_range,
      status 
    } = req.body;
    
    if (!title || !department) {
      return res.status(400).json({ message: 'Job title and department are mandatory.' });
    }

    const [result] = await pool.query(
      `INSERT INTO jobs 
       (title, description, department, location, openings, qualification, experience_required, salary_range, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, 
        description || 'Standard corporate job role requirements apply.',
        department, 
        location || 'Pune', 
        parseInt(openings) || 1, 
        qualification || 'Graduate / Professional Degree',
        experience_required || '1-3 Years', 
        salary_range || 'Competitive / Not Disclosed',
        status || 'Active',
        req.user.id
      ]
    );

    res.status(201).json({ message: 'Job vacancy created successfully!', id: result.insertId, jobId: result.insertId });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ message: 'Failed to create job in database' });
  }
};

// 3. Job status update controller (Toggle Active/Closed)
exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Closed', 'Draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    await pool.query('UPDATE jobs SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Job status updated to ${status}` });
  } catch (err) {
    console.error('Update job status error:', err);
    res.status(500).json({ message: 'Failed to update job status' });
  }
};
// 1. Job Update karne ke liye
exports.updateJob = async (req, res) => {
  try {
    const { title, department, description, qualification, experience_required, salary_range, location, openings, status } = req.body;
    await pool.query(
      `UPDATE jobs SET title=?, department=?, description=?, qualification=?, experience_required=?, salary_range=?, location=?, openings=?, status=? WHERE id=?`,
      [title, department, description, qualification, experience_required, salary_range, location, openings, status, req.params.id]
    );
    res.json({ message: 'Job updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Job Delete karne ke liye
exports.deleteJob = async (req, res) => {
  try {
    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};