const pool = require('../config/db');

// Helper to get active session
async function getActiveSession(userId, sessionId) {
  if (sessionId) {
    const [sessions] = await pool.query('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [sessionId, userId]);
    if (sessions.length > 0) return sessions[0];
  }
  const [sessions] = await pool.query(
    'SELECT * FROM sessions WHERE user_id = ? AND status != "LoggedOut" ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return sessions[0] || null;
}

// 1. SELECT WORK AREA (Module)
exports.selectModule = async (req, res) => {
  try {
    const { module } = req.body;
    if (!['Recruitment', 'Business', 'Financial', 'IT'].includes(module)) {
      return res.status(400).json({ message: 'Invalid module specified' });
    }

    const session = await getActiveSession(req.user.id, req.headers['x-session-id']);
    if (session) {
      await pool.query('UPDATE sessions SET module = ? WHERE id = ?', [module, session.id]);
    }
    // Also update user's default module
    await pool.query('UPDATE users SET module = ? WHERE id = ?', [module, req.user.id]);

    res.json({ message: 'Module selected successfully', module });
  } catch (err) {
    console.error('selectModule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. GET DASHBOARD DATA
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await getActiveSession(userId, req.headers['x-session-id']);

    let sessionInfo = {
      sessionId: session ? session.id : null,
      status: session ? session.status : 'Working',
      loginTime: session ? session.login_time : new Date(),
      module: session ? session.module : req.user.module,
      breakMinutes: session ? session.break_minutes : 0,
      workingMinutes: 0
    };

    if (session && session.login_time) {
      const [diff] = await pool.query(
        'SELECT TIMESTAMPDIFF(MINUTE, login_time, NOW()) AS working_mins FROM sessions WHERE id = ?',
        [session.id]
      );
      sessionInfo.workingMinutes = Math.max(0, (diff[0]?.working_mins || 0) - sessionInfo.breakMinutes);
    }

    // Tasks for this employee
    const [tasks] = await pool.query(
      `SELECT t.*, u.name as assigned_by_name 
       FROM tasks t 
       JOIN users u ON t.assigned_by = u.id 
       WHERE t.assigned_to = ? 
       ORDER BY t.priority DESC, t.id DESC`,
      [userId]
    );

    // Calculate task summary cards
    const assignedToday = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => t.due_at && new Date(t.due_at) < new Date() && t.status !== 'Completed').length;

    // Build timeline activities
    const timeline = [];
    if (session && session.login_time) {
      timeline.push({
        time: session.login_time,
        text: 'Logged in',
        type: 'login'
      });
    }

    // Add task activities
    const [updates] = await pool.query(
      `SELECT tu.*, t.title 
       FROM task_updates tu 
       JOIN tasks t ON tu.task_id = t.id 
       WHERE tu.user_id = ? AND DATE(tu.created_at) = CURDATE() 
       ORDER BY tu.created_at ASC`,
      [userId]
    );

    updates.forEach(u => {
      timeline.push({
        time: u.created_at,
        text: `${u.new_status === 'In Progress' ? 'Started' : u.new_status}: ${u.title}`,
        type: 'task'
      });
    });

    // Add break activities
    if (session) {
      const [breaks] = await pool.query(
        'SELECT * FROM breaks WHERE session_id = ? ORDER BY start_time ASC',
        [session.id]
      );
      breaks.forEach(b => {
        timeline.push({
          time: b.start_time,
          text: b.end_time ? `Break completed (${b.duration_minutes} min)` : 'Break started',
          type: 'break'
        });
      });
    }

    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        module: sessionInfo.module
      },
      session: sessionInfo,
      stats: {
        assignedToday,
        inProgress,
        completed,
        overdue
      },
      tasks,
      timeline
    });
  } catch (err) {
    console.error('getDashboardData error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. START BREAK
exports.startBreak = async (req, res) => {
  try {
    const session = await getActiveSession(req.user.id, req.headers['x-session-id']);
    if (!session) return res.status(404).json({ message: 'Active session not found' });

    await pool.query('INSERT INTO breaks (session_id, start_time) VALUES (?, NOW())', [session.id]);
    await pool.query('UPDATE sessions SET status = "Break" WHERE id = ?', [session.id]);

    res.json({ message: 'Break started', status: 'Break' });
  } catch (err) {
    console.error('startBreak error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. END BREAK (Resume Work)
exports.endBreak = async (req, res) => {
  try {
    const session = await getActiveSession(req.user.id, req.headers['x-session-id']);
    if (!session) return res.status(404).json({ message: 'Active session not found' });

    // Find active break
    const [breaks] = await pool.query(
      'SELECT id, start_time FROM breaks WHERE session_id = ? AND end_time IS NULL ORDER BY id DESC LIMIT 1',
      [session.id]
    );

    if (breaks.length > 0) {
      const breakId = breaks[0].id;
      await pool.query(
        `UPDATE breaks 
         SET end_time = NOW(), 
             duration_minutes = TIMESTAMPDIFF(MINUTE, start_time, NOW()) 
         WHERE id = ?`,
        [breakId]
      );

      // Re-sum all breaks
      const [sumRes] = await pool.query(
        'SELECT IFNULL(SUM(duration_minutes), 0) AS total_break FROM breaks WHERE session_id = ?',
        [session.id]
      );
      const totalBreak = sumRes[0].total_break;

      await pool.query('UPDATE sessions SET status = "Working", break_minutes = ? WHERE id = ?', [totalBreak, session.id]);
    } else {
      await pool.query('UPDATE sessions SET status = "Working" WHERE id = ?', [session.id]);
    }

    res.json({ message: 'Resumed work', status: 'Working' });
  } catch (err) {
    console.error('endBreak error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. UPDATE TASK STATUS
exports.updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status, remarks } = req.body;
    const userId = req.user.id;

    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ? AND assigned_to = ?', [taskId, userId]);
    if (tasks.length === 0) return res.status(404).json({ message: 'Task not found or not assigned to you' });

    const oldStatus = tasks[0].status;
    let query = 'UPDATE tasks SET status = ?, remarks = IFNULL(?, remarks)';
    const params = [status, remarks];

    if (status === 'In Progress' && !tasks[0].started_at) {
      query += ', started_at = NOW()';
    } else if (status === 'Completed') {
      query += ', completed_at = NOW()';
    }
    query += ' WHERE id = ?';
    params.push(taskId);

    await pool.query(query, params);

    // Log update
    await pool.query(
      'INSERT INTO task_updates (task_id, user_id, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
      [taskId, userId, oldStatus, status, remarks || null]
    );

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('updateTaskStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 6. SUBMIT DAILY REPORT AND LOGOUT
exports.submitDailyReport = async (req, res) => {
  try {
    const { summary, pendingReason } = req.body;
    const userId = req.user.id;
    const session = await getActiveSession(userId, req.headers['x-session-id']);

    if (!summary || summary.trim().length === 0) {
      return res.status(400).json({ message: 'Daily work summary is required before logging out' });
    }

    if (session) {
      // Save report
      await pool.query(
        'INSERT INTO daily_reports (session_id, user_id, summary, pending_reason) VALUES (?, ?, ?, ?)',
        [session.id, userId, summary.trim(), pendingReason ? pendingReason.trim() : null]
      );

      // Close session
      await pool.query(
        `UPDATE sessions 
         SET logout_time = NOW(), 
             total_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW()), 
             status = 'LoggedOut' 
         WHERE id = ?`,
        [session.id]
      );
    }

    res.json({ message: 'Daily report submitted and logged out successfully' });
  } catch (err) {
    console.error('submitDailyReport error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 7. GET WORK LOG (Attendance History)
exports.getWorkLog = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user sessions
    const [sessions] = await pool.query(
      `SELECT s.*, 
              (SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND DATE(created_at) = DATE(s.login_time)) as tasks_total,
              (SELECT COUNT(*) FROM tasks WHERE assigned_to = ? AND status = 'Completed' AND DATE(completed_at) = DATE(s.login_time)) as tasks_done
       FROM sessions s 
       WHERE s.user_id = ? 
       ORDER BY s.login_time DESC LIMIT 10`,
      [userId, userId, userId]
    );

    // Calculate weekly metrics
    let totalMins = 0;
    sessions.forEach(s => {
      totalMins += (s.total_minutes || 0);
    });

    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    res.json({
      weeklyHours: `${hours}h ${mins}m`,
      daysPresent: sessions.length,
      tasksCompleted: sessions.reduce((acc, curr) => acc + (curr.tasks_done || 0), 0),
      sessions
    });
  } catch (err) {
    console.error('getWorkLog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

