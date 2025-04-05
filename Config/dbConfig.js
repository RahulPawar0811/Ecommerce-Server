const mysql = require('mysql2/promise'); // ✅ Use promise-based MySQL

require('dotenv').config(); // Load environment variables

// Database Configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
};


module.exports = { dbConfig };
