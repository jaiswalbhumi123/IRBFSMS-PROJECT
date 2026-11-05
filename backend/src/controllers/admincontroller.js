const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// GET all employees with real-time status and current tasks
exports.getLiveEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        COALESCE(s.module, u.module) AS module, 
        s.id AS session_id, 
        s.login_time, 
        s.logout_time, 
        s.status AS session_status, 
        COALESCE(s.break_minutes, 0) AS break_minutes, 
        COALESCE(s.total_minutes, 0) AS total_minutes, 
        TIMESTAMPDIFF(MINUTE, s.login_time, IFNULL(s.logout_time, NOW())) AS working_minutes,
        (
          SELECT t.title 
          FROM tasks t 
          WHERE t.assigned_to = u.id 
          ORDER BY (t.status = 'In Progress') DESC, t.id DESC 
          LIMIT 1
        ) AS current_task,
        (
          SELECT COUNT(*) 
          FROM tasks t 
          WHERE t.assigned_to = u.id AND t.status = 'Completed' AND DATE(t.completed_at) = CURDATE()
        ) AS tasks_done,
        (
          SELECT COUNT(*) 
          FROM tasks t 
          WHERE t.assigned_to = u.id AND DATE(t.created_at) = CURDATE()
        ) AS tasks_total,
        (
          SELECT COALESCE(tu.created_at, s.login_time) 
          FROM task_updates tu 
          WHERE tu.user_id = u.id 
          ORDER BY tu.id DESC 
          LIMIT 1
        ) AS last_activity_time
      FROM users u
      LEFT JOIN sessions s ON s.id = (
        SELECT MAX(s2.id) 
        FROM sessions s2 
        WHERE s2.user_id = u.id AND DATE(s2.login_time) = CURDATE() AND s2.status != 'LoggedOut'
      )
      WHERE u.role = 'Employee'
      ORDER BY (s.status = 'Working') DESC, (s.status = 'Break') DESC, u.name ASC
    `);

    res.json(rows);
  } catch (err) {
    console.error('Live employees error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET summary cards for admin dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [working] = await pool.query(`SELECT COUNT(DISTINCT user_id) AS c FROM sessions WHERE status = 'Working' AND logout_time IS NULL AND DATE(login_time) = CURDATE()`);
    const [onBreak] = await pool.query(`SELECT COUNT(DISTINCT user_id) AS c FROM sessions WHERE status = 'Break' AND logout_time IS NULL AND DATE(login_time) = CURDATE()`);
    const [totalEmployees] = await pool.query(`SELECT COUNT(*) AS c FROM users WHERE role = 'Employee' AND status = 'Active'`);
    const loggedOutCount = Math.max(0, totalEmployees[0].c - (working[0].c + onBreak[0].c));
    const [tasksCompleted] = await pool.query(`SELECT COUNT(*) AS c FROM tasks WHERE status = 'Completed' AND DATE(completed_at) = CURDATE()`);

    res.json({
      working: working[0].c,
      onBreak: onBreak[0].c,
      loggedOut: loggedOutCount,
      totalEmployees: totalEmployees[0].c,
      tasksCompletedToday: tasksCompleted[0]?.c || 0
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
// 1. Saare Users ki list nikalna (Password hash nahi bhejenge)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, module, status FROM users ORDER BY id DESC'
    );
    res.json(users);
  } catch (err) { 
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'Server error' }); 
  }
};

// 2. Naya User add karna (Password hash karke)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, module } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, Email and Password are required' });
    }

    // Check karo ki email pehle se toh nahi hai
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Password Hash banao
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Database mein save karo
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, module, status) VALUES (?, ?, ?, ?, ?, 'Active')`,
      [name, email, password_hash, role || 'Employee', module || null]
    );

    res.status(201).json({ message: 'User added successfully' });
  } catch (err) { 
    console.error('createUser error:', err);
    res.status(500).json({ message: err.message || 'Server error' }); 
  }
};