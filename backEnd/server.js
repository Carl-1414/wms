// server.js
const express = require('express');
const app = express();
const pool = require('./database');

// Middleware to parse JSON bodies
app.use(express.json());

// Root route to confirm server is running
app.get('/', (req, res) => {
  res.send('Warehouse Management System API is running');
});

// API endpoint to check database connection
app.get('/api/check-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT CURRENT_TIME() AS `current_time`');
    res.json({ message: 'Database connected successfully', current_time: rows[0].current_time });
  } catch (err) {
    console.error('Database connection failed:', err);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
