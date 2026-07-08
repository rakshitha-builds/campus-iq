const pool = require('../config/db');
const { generateWorkerId } = require('../utils/helpers');

const getWorkers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, d.department_name FROM workers w
       LEFT JOIN departments d ON w.department_id = d.id
       ORDER BY w.id`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addWorker = async (req, res) => {
  try {
    const { name, email, phone, skill, department_id } = req.body;
    const worker_id = generateWorkerId();
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      `INSERT INTO workers (worker_id, name, email, phone, skill, department_id, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [worker_id, name, email, phone, skill, department_id, photo_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateWorker = async (req, res) => {
  try {
    const { name, email, phone, skill, department_id, status } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await pool.query(
      `UPDATE workers SET name=$1, email=$2, phone=$3,
       skill=$4, department_id=$5, status=$6,
       photo_url = COALESCE($7, photo_url)
       WHERE id=$8 RETURNING *`,
      [name, email, phone, skill, department_id, status, photo_url, req.params.id]
    );
    res.json(result.rows[0]);
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
    const result = await pool.query(
      `SELECT w.id, w.worker_id, w.name, w.email, w.phone, w.skill,
        w.department_id, w.status, w.photo_url,
        COUNT(c.id) FILTER (WHERE c.status = 'Pending') as pending_count,
        COUNT(c.id) FILTER (WHERE c.status = 'In Progress') as inprogress_count,
        COUNT(c.id) FILTER (WHERE c.status IN ('Assigned', 'In Progress')) as active_tasks,
        COUNT(c.id) FILTER (WHERE c.status = 'Completed') as total_resolved,
        COALESCE((SELECT AVG(rating) FROM complaint_ratings WHERE worker_id = w.id), 0) as avg_rating
       FROM workers w
       LEFT JOIN complaints c ON c.assigned_to = w.id
       GROUP BY w.id ORDER BY avg_rating DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getWorkers, addWorker, updateWorker, deleteWorker, getWorkerStats };