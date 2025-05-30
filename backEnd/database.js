// database.js
require('dotenv').config();
const mysql = require('mysql2');

// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  multipleStatements: true,
  charset: 'utf8mb4',
  decimalNumbers: true,
});

// Export the pool for use in other modules
module.exports = pool.promise();
