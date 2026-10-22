const mysql = require('mysql2/promise');

if(!process.env.MYSQL_SOCKET_PATH)throw new Error('A dedicated local MySQL Unix socket is required');
const pool = mysql.createPool({
  socketPath: process.env.MYSQL_SOCKET_PATH, // dedicated local instance; no TCP target
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  // Keep setup simple: create the users table if it does not exist yet.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(50) NOT NULL UNIQUE,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = {
  pool,
  initDatabase
};
