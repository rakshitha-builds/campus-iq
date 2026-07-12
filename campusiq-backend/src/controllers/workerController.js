const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateWorkerId, generateUserId } = require('../utils/helpers');

const getWorkers = async (req, res) => {
  try {
    const scopeDesignation = req.user?.role === 'admin' ? req.user.designation : null;
    const result = await pool.query(
      `SELECT w.*, d.department_name FROM workers w
       LEFT JOIN departments d ON w.department_id = d.id
       WHERE ($1::text IS NULL OR w.skill = $1)
       ORDER BY w.id`,
      [scopeDesignation]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// If a worker is marked as Team Lead and a password is supplied, create or
// update a matching login in the users table so they can log in as a
// designation-scoped Admin. Safe to call with no password (does nothing).
const syncLeadLogin = async (worker, password) => {
  if (!worker.is_lead || !password) return;
  const existing = await pool.query('SELECT * FROM users WHERE email = $1', [worker.email]);
  const hashedPassword = await bcrypt.hash(password, 10);
  if (existing.rows.length > 0) {
    await pool.query(
      'UPDATE users SET password = $1, role = $2, designation = $3, name = $4 WHERE email = $5',
      [hashedPassword, 'admin', worker.skill, worker.name, worker.email]
    );
  } else {
    const userId = generateUserId();
    await pool.query(
      `INSERT INTO users (user_id, name, email, password, role, designation)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, worker.name, worker.email, hashedPassword, 'admin', worker.skill]
    );
  }
};

const addWorker = async (req, res) => {
  try {
    const { name, email, phone, skill, department_id, is_lead, lead_password } = req.body;
    const worker_id = generateWorkerId();
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const isLeadBool = is_lead === 'true' || is_lead === true;
    const result = await pool.query(
      `INSERT INTO workers (worker_id, name, email, phone, skill, department_id, photo_url, is_lead)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [worker_id, name, email, phone, skill, department_id, photo_url, isLeadBool]
    );
    const worker = result.rows[0];
    if (isLeadBool && lead_password) {
      await syncLeadLogin(worker, lead_password);
    }
    res.status(201).json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateWorker = async (req, res) => {
  try {
    const { name, email, phone, skill, department_id, status, is_lead, lead_password } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const isLeadBool = is_lead === 'true' || is_lead === true;
    const result = await pool.query(
      `UPDATE workers SET name=$1, email=$2, phone=$3,
       skill=$4, department_id=$5, status=$6,
       photo_url = COALESCE($7, photo_url),
       is_lead=$8
       WHERE id=$9 RETURNING *`,
      [name, email, phone, skill, department_id, status, photo_url, isLeadBool, req.params.id]
    );
    const worker = result.rows[0];
    if (isLeadBool && lead_password) {
      await syncLeadLogin(worker, lead_password);
    }
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteWorker = async (req, res) => {
  try {
    await pool.query('DELETE FROM workers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Worker deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getWorkerStats = async (req, res) => {
  try {
    const scopeDesignation = req.user?.role === 'admin' ? req.user.designation : null;
    const result = await pool.query(
      `SELECT w.id, w.worker_id, w.name, w.email, w.phone, w.skill,
        w.department_id, w.status, w.photo_url, w.is_lead,
        COUNT(c.id) FILTER (WHERE c.status = 'Pending') as pending_count,
        COUNT(c.id) FILTER (WHERE c.status = 'In Progress') as inprogress_count,
        COUNT(c.id) FILTER (WHERE c.status IN ('Assigned', 'In Progress')) as active_tasks,
        COUNT(c.id) FILTER (WHERE c.status = 'Completed') as total_resolved,
        COALESCE((SELECT AVG(rating) FROM complaint_ratings WHERE worker_id = w.id), 0) as avg_rating
       FROM workers w
       LEFT JOIN complaints c ON c.assigned_to = w.id
       WHERE ($1::text IS NULL OR w.skill = $1)
       GROUP BY w.id ORDER BY avg_rating DESC`,
      [scopeDesignation]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getWorkers, addWorker, updateWorker, deleteWorker, getWorkerStats };