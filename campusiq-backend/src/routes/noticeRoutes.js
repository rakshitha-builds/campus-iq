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
    const { title, content, target_role, target_department } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const result = await pool.query(
      `INSERT INTO notices (title, content, target_role, target_department, posted_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, content, target_role || 'All', target_department || 'All', req.user.id]
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