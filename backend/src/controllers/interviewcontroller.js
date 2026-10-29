const pool = require('../config/db');

// 1. Naya Interview Schedule karna
exports.scheduleInterview = async (req, res) => {
  try {
    const { candidate_id, job_id, interview_date, interviewer_name } = req.body;
    
    if (!candidate_id || !interview_date || !interviewer_name) {
      return res.status(400).json({ message: 'Candidate, interview date/time, and interviewer name are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO interviews (candidate_id, job_id, interview_date, interviewer_name, status) 
       VALUES (?, ?, ?, ?, 'Scheduled')`,
      [candidate_id, job_id || null, interview_date, interviewer_name]
    );

    // Auto update candidate status to 'Interview Scheduled'
    await pool.query(
      "UPDATE candidates SET status = 'Interview Scheduled' WHERE id = ? AND status IN ('Applied', 'Shortlisted')",
      [candidate_id]
    );

    res.status(201).json({ message: 'Interview scheduled successfully', id: result.insertId });
  } catch (err) {
    console.error('scheduleInterview error:', err);
    res.status(500).json({ message: 'Server error scheduling interview' });
  }
};

// 2. Saare Interviews ki list dekhna
exports.getInterviews = async (req, res) => {
  try {
    const [interviews] = await pool.query(
      `SELECT i.*, 
              COALESCE(c.name, 'Unknown Candidate') AS candidate_name,
              c.email AS candidate_email,
              c.phone AS candidate_phone,
              COALESCE(j.title, 'General Position') AS job_title 
       FROM interviews i 
       LEFT JOIN candidates c ON i.candidate_id = c.id 
       LEFT JOIN jobs j ON i.job_id = j.id 
       ORDER BY i.interview_date DESC`
    );
    res.json(interviews);
  } catch (err) {
    console.error('getInterviews error:', err);
    res.status(500).json({ message: 'Server error fetching interviews' });
  }
};

// 3. Interview ka status update karna ('Scheduled', 'Completed', 'Selected', 'Rejected', 'On Hold')
exports.updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE interviews SET status = ? WHERE id = ?', [status, req.params.id]);

    // If decision made, sync candidate status as well
    if (['Selected', 'Rejected'].includes(status)) {
      const [[interview]] = await pool.query('SELECT candidate_id FROM interviews WHERE id = ?', [req.params.id]);
      if (interview && interview.candidate_id) {
        await pool.query('UPDATE candidates SET status = ? WHERE id = ?', [status, interview.candidate_id]);
      }
    }

    res.json({ message: 'Interview status updated successfully' });
  } catch (err) {
    console.error('updateInterviewStatus error:', err);
    res.status(500).json({ message: 'Server error updating interview status' });
  }
};
