const pool = require('../config/db');
const { broadcastEvent } = require('../utils/realtime');

// Safe optional nodemailer require (will not crash if package is missing)
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

// EMAIL NOTIFICATION HELPER
const sendEmail = async (to, subject, text) => {
  try {
    if (!nodemailer || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[Email Notification Simulation]`);
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Content: ${text.replace(/\n/g, ' ')}`);
      return { simulated: true, success: true };
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    console.log('✅ Email sent to', to);
    return { success: true };
  } catch (error) {
    console.log('❌ Email failed:', error.message);
    return { success: false, error: error.message };
  }
};

// 1. Naya Candidate add karna (Personal Details, Qualification, Experience, Skills, Resume)
exports.createCandidate = async (req, res) => {
  try {
    const { name, email, phone, qualification, job_id, experience, skills } = req.body;
    let resume_link = req.body.resume_link || null;

    // Agar resume file upload hui hai via Multer
    if (req.file) {
      resume_link = `/uploads/${req.file.filename}`;
    }
    
    if (!name || !email || !job_id) {
      return res.status(400).json({ message: 'Name, email and applied position are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO candidates (name, email, phone, qualification, job_id, experience, skills, resume_link, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Applied')`,
      [name, email, phone || null, qualification || null, job_id, experience || null, skills || null, resume_link]
    );

    const candidateId = result.insertId;

    // Document table mein entry add karo agar resume file upload hui hai
    if (req.file) {
      const uploaded_by = req.user ? req.user.id : null;
      await pool.query(
        `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
         VALUES (?, 'Candidate', 'Resume', ?, ?, NOW())`,
        [candidateId, resume_link, uploaded_by]
      );
    }

    broadcastEvent('CANDIDATE_CREATED', { id: candidateId, name });

    res.status(201).json({ 
      message: 'Candidate registered successfully', 
      id: candidateId,
      resume_link 
    });
  } catch (err) {
    console.error('createCandidate error:', err);
    res.status(500).json({ message: 'Server error registering candidate' });
  }
};

// 2. Candidate ka Resume upload / update karna
exports.uploadCandidateResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Koi resume file select nahi hui!' });
    }

    const candidateId = req.params.id;
    const file_path = `/uploads/${req.file.filename}`;
    const uploaded_by = req.user ? req.user.id : null;

    // Candidate update
    await pool.query('UPDATE candidates SET resume_link = ? WHERE id = ?', [file_path, candidateId]);

    // Document table insert
    await pool.query(
      `INSERT INTO documents (reference_id, reference_type, document_type, file_path, uploaded_by, uploaded_at) 
       VALUES (?, 'Candidate', 'Resume', ?, ?, NOW())`,
      [candidateId, file_path, uploaded_by]
    );

    broadcastEvent('CANDIDATE_RESUME_UPLOADED', { id: candidateId, resume_link: file_path });

    res.json({ 
      message: 'Resume uploaded successfully', 
      resume_link: file_path 
    });
  } catch (err) {
    console.error('uploadCandidateResume error:', err);
    res.status(500).json({ message: 'Server error uploading candidate resume' });
  }
};

// 3. Saare Candidates ki list (Job title ke saath)
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

// 4. Candidate ka status update karna & automated email trigger
exports.updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, req.params.id]);

    // Automated Email Notification Trigger
    if (status === 'Interview Scheduled' || status === 'Shortlisted') {
      const [cand] = await pool.query('SELECT name, email FROM candidates WHERE id = ?', [req.params.id]);
      if (cand.length > 0 && cand[0].email) {
        const candidateName = cand[0].name;
        const candidateEmail = cand[0].email;
        const subject = status === 'Interview Scheduled'
          ? 'Interview Scheduled - Benefit Business Solutions'
          : 'Application Shortlisted - Benefit Business Solutions';
        const text = status === 'Interview Scheduled'
          ? `Hello ${candidateName},\n\nYour interview with Benefit Business Solutions has been scheduled. Our HR team will reach out with the meeting details shortly.\n\nBest regards,\nRecruitment Team`
          : `Hello ${candidateName},\n\nCongratulations! Your application has been shortlisted for the next round at Benefit Business Solutions.\n\nBest regards,\nRecruitment Team`;

        // Run email dispatch asynchronously
        sendEmail(candidateEmail, subject, text);
      }
    }

    broadcastEvent('CANDIDATE_STATUS_UPDATED', { id: req.params.id, status });

    res.json({ message: 'Candidate status updated successfully', status });
  } catch (err) {
    console.error('updateCandidateStatus error:', err);
    res.status(500).json({ message: 'Server error updating status' });
  }
};

// 5. Recruitment Dashboard ke Stats nikalna
exports.getRecruitmentStats = async (req, res) => {
  try {
    // 1. KPI Cards Data
    const [jobs] = await pool.query('SELECT COUNT(*) as total FROM jobs');
    const [candidates] = await pool.query('SELECT COUNT(*) as total FROM candidates');
    const [interviews] = await pool.query("SELECT COUNT(*) as total FROM interviews WHERE status = 'Scheduled'");
    const [selected] = await pool.query("SELECT COUNT(*) as total FROM candidates WHERE status = 'Selected'");
    const [pending] = await pool.query("SELECT COUNT(*) as total FROM candidates WHERE status = 'Applied'");

    // 2. Interview Status Chart Data (Donut)
    const [intScheduled] = await pool.query("SELECT COUNT(*) as c FROM interviews WHERE status = 'Scheduled'");
    const [intCompleted] = await pool.query("SELECT COUNT(*) as c FROM interviews WHERE status = 'Completed'");
    const [intRejected] = await pool.query("SELECT COUNT(*) as c FROM interviews WHERE status = 'Rejected'");

    // 3. Pipeline Chart Data
    const [shortlisted] = await pool.query("SELECT COUNT(*) as c FROM candidates WHERE status = 'Shortlisted'");
    
    // 4. Candidates Added This Week (Last 7 days data)
    const [weeklyData] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%a') as day, COUNT(*) as count 
      FROM candidates 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
    `);

    res.json({
      // KPI Cards
      totalJobs: jobs[0].total,
      totalCandidates: candidates[0].total,
      interviewsScheduled: interviews[0].total,
      selectedCandidates: selected[0].total,
      pendingApplications: pending[0].total,
      
      // Charts Data
      pipelineData: [
        { name: 'Candidates', value: candidates[0].total || 0 },
        { name: 'Shortlisted', value: shortlisted[0].c || 0 },
        { name: 'Interviews', value: interviews[0].total || 0 },
        { name: 'Selected', value: selected[0].total || 0 }
      ],
      interviewStatusData: [
        { name: 'Scheduled', value: intScheduled[0].c || 0 },
        { name: 'Completed', value: intCompleted[0].c || 0 },
        { name: 'Rejected', value: intRejected[0].c || 0 }
      ],
      weeklyData: weeklyData.length > 0 ? weeklyData : [
        { day: 'Mon', count: 0 }, { day: 'Tue', count: 0 }, { day: 'Wed', count: 0 }, { day: 'Thu', count: 0 }, { day: 'Fri', count: 0 }
      ]
    });
  } catch (err) {
    console.error('getRecruitmentStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. Candidate Update (Edit details)
exports.updateCandidate = async (req, res) => {
  try {
    const { name, email, phone, qualification, job_id, experience, skills, resume_link, status } = req.body;
    await pool.query(
      `UPDATE candidates 
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           qualification = COALESCE(?, qualification),
           job_id = COALESCE(?, job_id),
           experience = COALESCE(?, experience),
           skills = COALESCE(?, skills),
           resume_link = COALESCE(?, resume_link),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, email, phone, qualification, job_id, experience, skills, resume_link, status, req.params.id]
    );

    broadcastEvent('CANDIDATE_UPDATED', { id: req.params.id });

    res.json({ message: 'Candidate updated successfully' });
  } catch (err) {
    console.error('updateCandidate error:', err);
    res.status(500).json({ message: 'Server error updating candidate' });
  }
};

// 7. Candidate Delete
exports.deleteCandidate = async (req, res) => {
  try {
    // Delete associated interviews and documents first to maintain integrity
    await pool.query('DELETE FROM interviews WHERE candidate_id = ?', [req.params.id]);
    await pool.query('DELETE FROM documents WHERE reference_type = "Candidate" AND reference_id = ?', [req.params.id]);
    await pool.query('DELETE FROM candidates WHERE id = ?', [req.params.id]);

    broadcastEvent('CANDIDATE_DELETED', { id: req.params.id });

    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    console.error('deleteCandidate error:', err);
    res.status(500).json({ message: 'Server error deleting candidate' });
  }
};

// 8. Single Candidate Profile by ID
exports.getCandidateById = async (req, res) => {
  try {
    const [candidate] = await pool.query(
      `SELECT c.*, j.title AS job_title 
       FROM candidates c 
       LEFT JOIN jobs j ON c.job_id = j.id 
       WHERE c.id = ?`, 
      [req.params.id]
    );
    if (candidate.length === 0) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate[0]);
  } catch (err) {
    console.error('getCandidateById error:', err);
    res.status(500).json({ message: 'Server error fetching candidate profile' });
  }
};
