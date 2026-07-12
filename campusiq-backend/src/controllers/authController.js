const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateUserId } = require('../utils/helpers');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    // Self-registration is only ever for the 'user' (Staff/Student) role.
    // Admin and Super Admin accounts are created separately (by Super Admin
    // via Employees, or directly in the database) — never through this
    // public endpoint, regardless of what a client sends.
    const role = 'user';
    if (!name || !email || !password) {
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
      { id: user.id, user_id: user.user_id, name: user.name, role: user.role, designation: user.designation },
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
        department: user.department,
        designation: user.designation
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, user_id, name, email, role, department, designation, phone, date_of_birth, status, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Lets a logged-in user edit their own basic details — name, department,
// phone, date of birth. Email and role are intentionally NOT editable here
// since they're tied to login identity and access control.
const updateProfile = async (req, res) => {
  try {
    const { name, department, phone, date_of_birth } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty.' });
    }
    const result = await pool.query(
      `UPDATE users SET name = $1, department = $2, phone = $3, date_of_birth = $4
       WHERE id = $5
       RETURNING id, user_id, name, email, role, department, designation, phone, date_of_birth, status, created_at`,
      [name.trim(), department || null, phone || null, date_of_birth || null, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile };