const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

// Initialize DB
async function init() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "main_EL",
    waitForConnections: true,
    connectionLimit: 10,
  });

  // ✅ Create USERS table (for login/register)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ✅ Create SCHEDULE table (for your scheduleRoute)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      panel_id VARCHAR(100),
      date DATE,
      status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ✅ Test connection
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log("✅ Connected to MySQL Database!");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }

  return pool;
}

// Query function (for routes)
async function query(sql, params) {
  if (!pool) await init();
  return pool.query(sql, params);
}

module.exports = {
  init,
  query,
};
