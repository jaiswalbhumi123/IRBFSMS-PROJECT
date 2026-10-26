const pool = require('../config/db');

// 1. Admin naya task assign karega
exports.createTask = async (req, res) => {
  try {
    const { title, description, module, assigned_to, priority, due_date } = req.body;
    const assigned_by = req.user.id; // Admin ki ID token se aayegi

    if (!title || !module || !assigned_to) {
      return res.status(400).json({ message: 'Title, module and assigned employee are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Assigned')`,
      [title, description || null, module, assigned_by, assigned_to, priority || 'Medium', due_date || null]
    );

    // Also log in task_updates
    await pool.query(
      'INSERT INTO task_updates (task_id, user_id, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
      [result.insertId, assigned_to, null, 'Assigned', 'Task assigned by Admin']
    );

    res.status(201).json({ message: 'Task assigned successfully', taskId: result.insertId });
  } catch (err) {
    console.error('createTask error:', err);
    res.status(500).json({ message: 'Server error creating task' });
  }
};

// 2. Employee apne tasks dekhega
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const [tasks] = await pool.query(
      `SELECT t.*, u.name AS assigned_by_name 
       FROM tasks t 
       JOIN users u ON t.assigned_by = u.id 
       WHERE t.assigned_to = ? 
       ORDER BY t.created_at DESC`,
      [userId]
    );
    res.json(tasks);
  } catch (err) {
    console.error('getMyTasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Employee task ka status update karega (Start/Complete)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;
    const userId = req.user.id;

    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?', [taskId, userId]);
    if (task.length === 0) return res.status(403).json({ message: 'Not authorized' });

    let query = 'UPDATE tasks SET status = ?';
    if (status === 'In Progress') query += ', started_at = NOW()';
    if (status === 'Completed') query += ', completed_at = NOW()';
    query += ' WHERE id = ?';

    await pool.query(query, [status, taskId]);

    await pool.query(
      'INSERT INTO task_updates (task_id, user_id, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
      [taskId, userId, task[0].status, status, null]
    );

    res.json({ message: `Task marked as ${status}` });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};