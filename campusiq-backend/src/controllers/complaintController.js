const pool = require('../config/db');
const { generateComplaintId } = require('../utils/helpers');
const crypto = require('crypto');
const axios = require('axios');
const { notifyUser } = require('../utils/notify');

const analyzeWithPythonAI = async (text) => {
  try {
const response = await axios.post('http://localhost:8000/analyze', { text }, { timeout: 10000 });    return response.data;
  } catch (err) {
    console.error('Python AI service error:', err.message);
    return null;
  }
};

const raiseComplaint = async (req, res) => {
  try {
    const {
      title, description, category, priority,
      building_id, block_id, floor_id, asset_id,
      raised_by, guest_name, guest_department, latitude, longitude,
      ai_category, ai_priority, ai_sentiment, ai_confidence
    } = req.body;

    if (!raised_by && !guest_name) {
      return res.status(400).json({ message: 'Please enter your name before submitting.' });
    }
    if (!title && !description) {
      return res.status(400).json({ message: 'Please describe the issue.' });
    }

    let finalAiCategory = ai_category;
    let finalAiPriority = ai_priority;
    let finalAiSentiment = ai_sentiment;
    let finalAiConfidence = ai_confidence;

    if (description) {
      const aiResult = await analyzeWithPythonAI(description);
      if (aiResult) {
        finalAiCategory = aiResult.category;
        finalAiPriority = aiResult.priority;
        finalAiSentiment = aiResult.sentiment;
        finalAiConfidence = aiResult.confidence;
        console.log('Python AI Analysis:', aiResult);
      } else {
        console.log('Python AI unavailable, using frontend AI values');
      }
    }

    const complaint_id = generateComplaintId();
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
    // Guests (no account) get a private tracking token so they can check
    // status and leave feedback later without needing to log in.
    const guest_token = guest_name ? crypto.randomBytes(12).toString('hex') : null;

    const result = await pool.query(
      `INSERT INTO complaints (
        complaint_id, title, description, category, priority,
        building_id, block_id, floor_id, asset_id,
        raised_by, guest_name, guest_department, guest_token, photo_url, latitude, longitude,
        ai_category, ai_priority, ai_sentiment, ai_confidence
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *`,
      [
        complaint_id,
        title || '',
        description || '',
        category || finalAiCategory || '',
        priority || finalAiPriority || 'Medium',
        building_id ? parseInt(building_id) : null,
        block_id ? parseInt(block_id) : null,
        floor_id ? parseInt(floor_id) : null,
        asset_id ? parseInt(asset_id) : null,
        raised_by ? parseInt(raised_by) : null,
        guest_name || null,
        guest_department || null,
        guest_token,
        photo_url,
        latitude || null,
        longitude || null,
        finalAiCategory || null,
        finalAiPriority || null,
        finalAiSentiment || null,
        finalAiConfidence ? parseFloat(finalAiConfidence) : null
      ]
    );

    if (finalAiCategory) {
      await pool.query(
        `INSERT INTO ai_logs (complaint_id, input_text, detected_category,
         detected_priority, detected_sentiment, confidence_score)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [result.rows[0].id, description, finalAiCategory, finalAiPriority, finalAiSentiment, finalAiConfidence ? parseFloat(finalAiConfidence) : null]
      );
    }

    const newComplaint = result.rows[0];

    // Recurring Issue Intelligence: same category + same location repeating
    // within a short window is a real infrastructure pattern, not just N
    // separate low-priority tickets — auto-escalate and alert Super Admin
    // directly so it doesn't get lost in normal queue triage.
    let recurringInfo = null;
    if (newComplaint.category && newComplaint.block_id) {
      const recurringCheck = await pool.query(
        `SELECT COUNT(*) as cnt FROM complaints
         WHERE category = $1 AND block_id = $2
         AND created_at >= NOW() - INTERVAL '7 days'`,
        [newComplaint.category, newComplaint.block_id]
      );
      const occurrenceCount = parseInt(recurringCheck.rows[0].cnt);

      if (occurrenceCount >= 3) {
        await pool.query(
          `UPDATE complaints SET priority = 'Critical' WHERE id = $1`,
          [newComplaint.id]
        );
        newComplaint.priority = 'Critical';
        recurringInfo = { occurrenceCount };

        const superAdmins = await pool.query(`SELECT id FROM users WHERE role = 'super_admin'`);
        for (const sa of superAdmins.rows) {
          notifyUser(sa.id, {
            title: '🔥 Recurring Issue Detected',
            message: `"${newComplaint.category}" complaints in this location have occurred ${occurrenceCount} times in the last 7 days. Priority auto-escalated to Critical.`,
            link: '/complaints'
          });
        }
      }
    }

    // Notify every Admin and Super Admin so they see it immediately
    const staff = await pool.query(`SELECT id FROM users WHERE role IN ('admin', 'super_admin')`);
    for (const s of staff.rows) {
      notifyUser(s.id, {
        title: 'New Complaint Raised',
        message: `"${newComplaint.title}" was just raised${guest_name ? ` by ${guest_name} (via QR)` : ''}${newComplaint.priority ? ` — ${newComplaint.priority} priority` : ''}.`,
        link: '/complaints'
      });
    }

    res.status(201).json({
      message: 'Complaint raised successfully',
      complaint: newComplaint,
      ai_powered: !!finalAiCategory,
      recurring: recurringInfo
    });
  } catch (err) {
    console.error('Complaint error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const scopeDesignation = req.user?.role === 'admin' ? req.user.designation : null;
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(u.name, c.guest_name, 'Guest') as raised_by_name,
        w.name as assigned_worker_name,
        w.skill as worker_skill,
        b.building_name,
        bl.block_name,
        f.floor_name,
        (SELECT COUNT(*) FROM complaint_ratings WHERE complaint_id = c.id) > 0 as already_rated
       FROM complaints c
       LEFT JOIN users u ON c.raised_by = u.id
       LEFT JOIN workers w ON c.assigned_to = w.id
       LEFT JOIN buildings b ON c.building_id = b.id
       LEFT JOIN blocks bl ON c.block_id = bl.id
       LEFT JOIN floors f ON c.floor_id = f.id
       WHERE ($1::text IS NULL OR c.category = $1)
       ORDER BY c.created_at DESC`,
      [scopeDesignation]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(u.name, c.guest_name, 'Guest') as raised_by_name,
        w.name as assigned_worker_name,
        b.building_name,
        bl.block_name,
        f.floor_name
       FROM complaints c
       LEFT JOIN users u ON c.raised_by = u.id
       LEFT JOIN workers w ON c.assigned_to = w.id
       LEFT JOIN buildings b ON c.building_id = b.id
       LEFT JOIN blocks bl ON c.block_id = bl.id
       LEFT JOIN floors f ON c.floor_id = f.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const assignComplaint = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const result = await pool.query(
      `UPDATE complaints SET assigned_to = $1, status = 'Assigned'
       WHERE id = $2 RETURNING *`,
      [worker_id, req.params.id]
    );
    res.json({
      message: 'Complaint assigned successfully',
      complaint: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const VALID_STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed'];

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    const after_photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (status === 'Completed' && !after_photo_url) {
      return res.status(400).json({
        message: 'A proof photo is required to mark a complaint as Completed.'
      });
    }

    let query, params;

    if (status === 'Completed') {
      // Save the after-photo (if provided) and stamp resolved_at
      query = `UPDATE complaints SET status = $1, resolved_at = CURRENT_TIMESTAMP,
               after_photo_url = COALESCE($2, after_photo_url)
               WHERE id = $3 RETURNING *`;
      params = [status, after_photo_url, req.params.id];
    } else {
      query = `UPDATE complaints SET status = $1,
               after_photo_url = COALESCE($2, after_photo_url)
               WHERE id = $3 RETURNING *`;
      params = [status, after_photo_url, req.params.id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const complaint = result.rows[0];

    // Notify the person who raised this complaint that its status changed.
    // If it's now Completed, send them straight to Feedback so they can rate it.
    if (complaint.raised_by) {
      notifyUser(complaint.raised_by, {
        title: `Complaint ${status}`,
        message: status === 'Completed'
          ? `Your complaint "${complaint.title}" has been resolved. Let us know how it went!`
          : `Your complaint "${complaint.title}" is now marked as ${status}.`,
        link: status === 'Completed' ? '/feedback' : '/complaints/track'
      });
    }

    res.json({
      message: 'Status updated successfully',
      complaint: complaint
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    await pool.query('DELETE FROM complaints WHERE id = $1', [req.params.id]);
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const scopeUserId = req.user?.role === 'user' ? req.user.id : null;

    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending,
        COUNT(*) FILTER (WHERE status = 'Assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed
      FROM complaints
      WHERE ($1::int IS NULL OR raised_by = $1)
    `, [scopeUserId]);

    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM complaints
      WHERE category IS NOT NULL AND category != ''
        AND ($1::int IS NULL OR raised_by = $1)
      GROUP BY category
      ORDER BY count DESC
    `, [scopeUserId]);

    const buildingStats = await pool.query(`
      SELECT b.building_name, COUNT(c.id) as complaint_count
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      WHERE ($1::int IS NULL OR c.raised_by = $1)
      GROUP BY b.building_name
      ORDER BY complaint_count DESC
    `, [scopeUserId]);

    const monthlyStats = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM complaints
      WHERE ($1::int IS NULL OR raised_by = $1)
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `, [scopeUserId]);

    const recentComplaints = await pool.query(`
      SELECT c.*, COALESCE(u.name, c.guest_name, 'Guest') as raised_by_name, b.building_name
      FROM complaints c
      LEFT JOIN users u ON c.raised_by = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      WHERE ($1::int IS NULL OR c.raised_by = $1)
      ORDER BY c.created_at DESC LIMIT 5
    `, [scopeUserId]);

    res.json({
      stats: stats.rows[0],
      categoryStats: categoryStats.rows,
      buildingStats: buildingStats.rows,
      monthlyStats: monthlyStats.rows,
      recentComplaints: recentComplaints.rows
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAIRecommendedWorker = async (req, res) => {
  try {
    const { category } = req.query;
    const result = await pool.query(
      `SELECT w.*,
        COUNT(c.id) FILTER (WHERE c.status IN ('Assigned','In Progress')) as active_tasks,
        w.avg_rating,
        w.total_resolved
       FROM workers w
       LEFT JOIN complaints c ON c.assigned_to = w.id
       WHERE w.status = 'Active'
       AND (w.skill ILIKE $1 OR $1 = '')
       GROUP BY w.id
       ORDER BY
         COUNT(c.id) FILTER (WHERE c.status IN ('Assigned','In Progress')) ASC,
         w.avg_rating DESC,
         w.total_resolved DESC
       LIMIT 3`,
      [`%${category || ''}%`]
    );
    res.json({
      recommended_workers: result.rows,
      reason: 'Ranked by: lowest active tasks, highest rating, most experience'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const rateComplaint = async (req, res) => {
  try {
    const { rated_by, worker_id, rating, comment } = req.body;

    await pool.query(
      `INSERT INTO complaint_ratings (complaint_id, rated_by, worker_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, rated_by, worker_id, rating, comment]
    );

    await pool.query(
      `UPDATE workers SET
        avg_rating = (SELECT AVG(rating) FROM complaint_ratings WHERE worker_id = $1),
        total_resolved = total_resolved + 1
       WHERE id = $1`,
      [worker_id]
    );

    res.json({ message: 'Rating submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUBLIC — lets a guest (no login) check their complaint's status using the
// private tracking link they were given right after submitting.
const getComplaintByToken = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        COALESCE(u.name, c.guest_name, 'Guest') as raised_by_name,
        b.building_name, bl.block_name, f.floor_name,
        (SELECT COUNT(*) FROM complaint_ratings WHERE complaint_id = c.id) > 0 as already_rated
       FROM complaints c
       LEFT JOIN users u ON c.raised_by = u.id
       LEFT JOIN buildings b ON c.building_id = b.id
       LEFT JOIN blocks bl ON c.block_id = bl.id
       LEFT JOIN floors f ON c.floor_id = f.id
       WHERE c.guest_token = $1`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tracking link not found or invalid.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUBLIC — lets a guest submit feedback using their tracking token, only
// once the complaint is actually marked Completed.
const rateByToken = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating) {
      return res.status(400).json({ message: 'Please select a rating.' });
    }

    const complaintResult = await pool.query(
      'SELECT * FROM complaints WHERE guest_token = $1',
      [req.params.token]
    );
    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tracking link not found or invalid.' });
    }
    const complaint = complaintResult.rows[0];

    if (complaint.status !== 'Completed') {
      return res.status(400).json({ message: 'Feedback can only be given once the complaint is resolved.' });
    }

    const existing = await pool.query(
      'SELECT id FROM complaint_ratings WHERE complaint_id = $1',
      [complaint.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Feedback has already been submitted for this complaint.' });
    }

    await pool.query(
      `INSERT INTO complaint_ratings (complaint_id, worker_id, rating, comment)
       VALUES ($1, $2, $3, $4)`,
      [complaint.id, complaint.assigned_to || null, rating, comment || '']
    );

    if (complaint.assigned_to) {
      await pool.query(
        `UPDATE workers SET
          avg_rating = (SELECT AVG(rating) FROM complaint_ratings WHERE worker_id = $1),
          total_resolved = total_resolved + 1
         WHERE id = $1`,
        [complaint.assigned_to]
      );
    }

    res.json({ message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUBLIC (Admin/Super Admin) — surfaces clusters of repeated complaints
// (same category + same location within 7 days) so staff can spot real
// infrastructure patterns instead of triaging each ticket in isolation.
const getRecurringIssues = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.category, c.block_id, bl.block_name, b.building_name,
        COUNT(*) as occurrence_count,
        MAX(c.created_at) as latest_complaint_at,
        ARRAY_AGG(c.complaint_id ORDER BY c.created_at DESC) as complaint_ids
       FROM complaints c
       LEFT JOIN blocks bl ON c.block_id = bl.id
       LEFT JOIN buildings b ON bl.building_id = b.id
       WHERE c.created_at >= NOW() - INTERVAL '7 days'
         AND c.category IS NOT NULL AND c.block_id IS NOT NULL
       GROUP BY c.category, c.block_id, bl.block_name, b.building_name
       HAVING COUNT(*) >= 3
       ORDER BY occurrence_count DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  raiseComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getDashboardStats,
  getAIRecommendedWorker,
  rateComplaint,
  getComplaintByToken,
  rateByToken,
  getRecurringIssues
};