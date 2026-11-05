const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.login = async (req, res) => {
  try {
    let { email, password, role } = req.body;

    email = email ? email.trim().toLowerCase() : '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is not a ${role} account` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const [sessionResult] = await pool.query(
      'INSERT INTO sessions (user_id, login_time, status) VALUES (?, NOW(), "Working")',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, module: user.module },
      sessionId: sessionResult.insertId
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await pool.query(
        `UPDATE sessions SET logout_time = NOW(), total_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW()), status = 'LoggedOut' WHERE id = ?`,
        [sessionId]
      );
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.me = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, module, status FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};