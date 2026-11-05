const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected');
    conn.release();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
})();
