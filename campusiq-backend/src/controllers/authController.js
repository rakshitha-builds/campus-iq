const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateUserId } = require('../utils/helpers');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateUserId();
    const result = await pool.query(
      `INSERT INTO users (user_id, name, email, password, role, department)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, email, hashedPassword, role, department]
    );
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.rows[0].id,
        user_id: result.rows[0].user_id,
        name: result.rows[0].name,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND role = $2', [email, role]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, user_id: user.user_id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, name, email, role, department, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getProfile };