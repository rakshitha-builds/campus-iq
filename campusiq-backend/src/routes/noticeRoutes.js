const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

// Get all notices — must be logged in
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, u.name as posted_by_name 
       FROM notices n
       LEFT JOIN users u ON n.posted_by = u.id
       ORDER BY n.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Post new notice — Admin/Super Admin only
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, content, target_role, target_department, type } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO notices (title, content, target_role, target_department, type, posted_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, target_role || 'All', target_department || 'All', type || 'General', req.user.id]
    );

    const notice = result.rows[0];

    // Notify the relevant audience
    const recipients = notice.target_role === 'All'
      ? await pool.query(`SELECT id FROM users WHERE role IN ('user','admin','super_admin')`)
      : await pool.query(`SELECT id FROM users WHERE role = $1`, [notice.target_role]);
    for (const r of recipients.rows) {
      notifyUser(r.id, {
        title: 'New Notice Posted',
        message: notice.title,
        link: '/notices'
      });
    }

    res.status(201).json(notice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Edit an existing notice — Admin/Super Admin only
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, content, target_role, target_department, type } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await pool.query(
      `UPDATE notices SET title = $1, content = $2, target_role = $3, target_department = $4, type = $5
       WHERE id = $6 RETURNING *`,
      [title, content, target_role || 'All', target_department || 'All', type || 'General', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete notice — Admin/Super Admin only
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM notices WHERE id = $1', [req.params.id]);
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;