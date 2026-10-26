const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email address and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email address or password' });
    }

    const user = users[0];

    // If role is explicitly provided and doesn't match, give a clear message
    if (role && user.role !== role) {
      return res.status(401).json({ message: `This account is registered as ${user.role}. Please select ${user.role} to login.` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email address or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact Admin.' });
    }

    // Close any previous open sessions for this user to avoid duplicates
    await pool.query(
      'UPDATE sessions SET logout_time = NOW(), status = "LoggedOut" WHERE user_id = ? AND logout_time IS NULL',
      [user.id]
    );

    // Create session record
    const [sessionResult] = await pool.query(
      'INSERT INTO sessions (user_id, module, login_time, status) VALUES (?, ?, NOW(), "Working")',
      [user.id, user.module || null]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, module: user.module },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        module: user.module
      },
      sessionId: sessionResult.insertId
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error occurred during login' });
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
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
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
