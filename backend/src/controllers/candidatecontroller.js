const pool = require('../config/db');

// Naya Candidate add karna
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone, job_id, experience, skills, resume_link } = req.body;
    const [result] = await pool.query(
      `INSERT INTO candidates (name, email, phone, job_id, experience, skills, resume_link) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, job_id, experience, skills, resume_link]
    );
    res.status(201).json({ message: 'Candidate added successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Saare Candidates ki list (Job title ke saath)
exports.getCandidates = async (req, res) => {
  try {
    const [candidates] = await pool.query(
      `SELECT c.*, j.title AS job_title 
       FROM candidates c 
       JOIN jobs j ON c.job_id = j.id 
       ORDER BY c.created_at DESC`
    );
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Candidate ka status update karna (Applied -> Shortlisted etc.)
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};