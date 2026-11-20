const pool = require('./db');
const bcrypt = require('bcryptjs');

async function setup() {
  try {
    console.log('🔄 Updating database schema...');

    // 1. Modify users & sessions to include 'IT'
    await pool.query("ALTER TABLE users MODIFY module ENUM('Recruitment', 'Business', 'Financial', 'IT') DEFAULT NULL");
    await pool.query("ALTER TABLE sessions MODIFY module ENUM('Recruitment', 'Business', 'Financial', 'IT') DEFAULT NULL");
    console.log('✅ Altered module enum in users and sessions to include IT');

    // 2. Create breaks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS breaks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME DEFAULT NULL,
        duration_minutes INT DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ breaks table ready');

    // 3. Create tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        module ENUM('Recruitment', 'Business', 'Financial', 'IT') NOT NULL,
        assigned_by INT NOT NULL,
        assigned_to INT NOT NULL,
        priority ENUM('High', 'Medium', 'Low') DEFAULT 'Medium',
        due_at DATETIME DEFAULT NULL,
        status ENUM('Assigned', 'In Progress', 'Completed') DEFAULT 'Assigned',
        started_at DATETIME DEFAULT NULL,
        completed_at DATETIME DEFAULT NULL,
        remarks TEXT,
        attachment VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ tasks table ready');

    // 4. Create task_updates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_updates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50),
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ task_updates table ready');

    // 5. Create daily_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        user_id INT NOT NULL,
        summary TEXT NOT NULL,
        pending_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ daily_reports table ready');

    // 6. Insert IT Employee if not exists
    const itHash = bcrypt.hashSync('it123', 10);
    const [existingIT] = await pool.query('SELECT * FROM users WHERE email = ?', ['it@benefit.com']);
    if (existingIT.length === 0) {
      await pool.query(
        'INSERT INTO users (name, email, password_hash, role, module, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['Aman Sharma (IT)', 'it@benefit.com', itHash, 'Employee', 'IT', 'Active']
      );
      console.log('✅ Inserted IT employee: it@benefit.com / it123');
    } else {
      console.log('ℹ️ IT employee already exists');
    }

    // 7. Seed sample tasks for employees
    const [adminUser] = await pool.query("SELECT id FROM users WHERE role = 'Admin' LIMIT 1");
    const [priya] = await pool.query('SELECT id FROM users WHERE email = ?', ['priya@benefit.com']);
    const [rahul] = await pool.query('SELECT id FROM users WHERE email = ?', ['rahul@benefit.com']);
    const [itUser] = await pool.query('SELECT id FROM users WHERE email = ?', ['it@benefit.com']);

    const [tasksCount] = await pool.query('SELECT COUNT(*) as c FROM tasks');
    if (tasksCount[0].c === 0 && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      // Priya tasks (Recruitment)
      if (priya.length > 0) {
        await pool.query(
          'INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 2 HOUR, ?)',
          ['Screen 10 resumes for Software Developer', 'Shortlist profiles with Java/React skills', 'Recruitment', adminId, priya[0].id, 'High', 'In Progress']
        );
        await pool.query(
          'INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 4 HOUR, ?)',
          ['Schedule interviews for HR Executive job', 'Coordinate with panel and send invites', 'Recruitment', adminId, priya[0].id, 'High', 'Assigned']
        );
      }
      // Rahul tasks (CRM)
      if (rahul.length > 0) {
        await pool.query(
          'INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 3 HOUR, ?)',
          ['Call 5 new leads from website', 'Follow up regarding ERP software demo', 'Business', adminId, rahul[0].id, 'High', 'In Progress']
        );
      }
      // IT tasks (Aman)
      if (itUser.length > 0) {
        await pool.query(
          'INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 2 HOUR, ?)',
          ['System Health Check & Database Optimization', 'Monitor server response times and verify backups', 'IT', adminId, itUser[0].id, 'High', 'In Progress']
        );
        await pool.query(
          'INSERT INTO tasks (title, description, module, assigned_by, assigned_to, priority, due_at, status) VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL 5 HOUR, ?)',
          ['Deploy Employee Work Tracking Dashboard', 'Implement direct routing and break management APIs', 'IT', adminId, itUser[0].id, 'Medium', 'Assigned']
        );
      }
      console.log('✅ Seeded demo tasks');
    }

    // 8. Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        city VARCHAR(100),
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ customers table ready');

    try {
      await pool.query('ALTER TABLE loan_applications ADD COLUMN customer_id INT NULL');
    } catch (e) { /* Column already exists */ }
    try {
      await pool.query('ALTER TABLE credit_card_applications ADD COLUMN customer_id INT NULL');
    } catch (e) { /* Column already exists */ }

    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

setup();

