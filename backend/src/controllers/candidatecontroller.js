const pool = require('../config/db');

// 1. Naya Candidate add karna (Personal Details, Qualification, Experience, Skills, Resume)
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone, qualification, job_id, experience, skills, resume_link } = req.body;
    
    if (!name || !email || !job_id) {
      return res.status(400).json({ message: 'Name, email and applied position are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO candidates (name, email, phone, qualification, job_id, experience, skills, resume_link, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Applied')`,
      [name, email, phone || null, qualification || null, job_id, experience || null, skills || null, resume_link || null]
    );
    res.status(201).json({ message: 'Candidate registered successfully', id: result.insertId });
  } catch (err) {
    console.error('createCandidate error:', err);
    res.status(500).json({ message: 'Server error registering candidate' });
  }
};

// 2. Saare Candidates ki list (Job title ke saath)
exports.getCandidates = async (req, res) => {
  try {
    const [candidates] = await pool.query(
      `SELECT c.*, COALESCE(j.title, 'General / Unassigned') AS job_title 
       FROM candidates c 
       LEFT JOIN jobs j ON c.job_id = j.id 
       ORDER BY c.created_at DESC`
    );
    res.json(candidates);
  } catch (err) {
    console.error('getCandidates error:', err);
    res.status(500).json({ message: 'Server error fetching candidates' });
  }
};

// 3. Candidate ka status update karna (Applied -> Shortlisted -> Interview Scheduled -> Selected -> Rejected)
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Candidate status updated successfully' });
  } catch (err) {
    console.error('updateCandidateStatus error:', err);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

// 4. Recruitment Dashboard ke Stats nikalna
exports.getRecruitmentStats = async (req, res) => {
  try {
    const [[jobsCount]] = await pool.query("SELECT COUNT(*) as total FROM jobs WHERE status = 'Active'");
    const [[totalJobsCount]] = await pool.query('SELECT COUNT(*) as total FROM jobs');
    const [[candidatesCount]] = await pool.query('SELECT COUNT(*) as total FROM candidates');
    const [[interviewsScheduled]] = await pool.query("SELECT COUNT(*) as total FROM interviews WHERE status = 'Scheduled'");
    const [[selectedCandidates]] = await pool.query("SELECT COUNT(*) as total FROM candidates WHERE status = 'Selected'");
    const [[pendingApplications]] = await pool.query("SELECT COUNT(*) as total FROM candidates WHERE status = 'Applied'");

    res.json({
      totalJobs: totalJobsCount.total || 0,
      activeJobs: jobsCount.total || 0,
      totalCandidates: candidatesCount.total || 0,
      interviewsScheduled: interviewsScheduled.total || 0,
      selectedCandidates: selectedCandidates.total || 0,
      pendingApplications: pendingApplications.total || 0
    });
  } catch (err) {
    console.error('getRecruitmentStats error:', err);
    res.status(500).json({ message: 'Server error fetching recruitment stats' });
  }
};
