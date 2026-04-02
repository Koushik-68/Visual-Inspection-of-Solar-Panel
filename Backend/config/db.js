const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

// Initialize DB
async function init() {
  if (pool) return pool;

  const host = process.env.DB_HOST || "127.0.0.1";
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASS || "";
  const dbName = process.env.DB_NAME || "main_EL";

  // Ensure the database exists (equivalent to CREATE DATABASE main_EL)
  const bootstrapConn = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });
  await bootstrapConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await bootstrapConn.end();

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: dbName,
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

  // ✅ Create GRID_CONFIG table (per-user grid rows/columns)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grid_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNIQUE,
      row_count INT NOT NULL,
      col_count INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // ✅ Create PANELS table (per-panel details for each grid cell)
  // Use an auto-increment primary key and a per-user unique panel_id
  await pool.query(`
    CREATE TABLE IF NOT EXISTS panels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      panel_id VARCHAR(100),
      user_id INT NOT NULL,
      row_index INT NOT NULL,
      col_index INT NOT NULL,
      company_name VARCHAR(255),
      model VARCHAR(255),
      size_width FLOAT,
      size_height FLOAT,
      installation_date DATE,
      max_output FLOAT,
      current_output FLOAT,
      priority VARCHAR(20),
      maintenance_suggestion TEXT,
      current_fault_description TEXT,
      current_fault_level VARCHAR(20),
      image LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_panel (user_id, panel_id)
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
