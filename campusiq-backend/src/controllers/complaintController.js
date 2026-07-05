const pool = require('../config/db');
const { generateComplaintId } = require('../utils/helpers');
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
      raised_by, latitude, longitude,
      ai_category, ai_priority, ai_sentiment, ai_confidence
    } = req.body;

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

    const result = await pool.query(
      `INSERT INTO complaints (
        complaint_id, title, description, category, priority,
        building_id, block_id, floor_id, asset_id,
        raised_by, photo_url, latitude, longitude,
        ai_category, ai_priority, ai_sentiment, ai_confidence
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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

    // Notify every Admin and Super Admin so they see it immediately
    const staff = await pool.query(`SELECT id FROM users WHERE role IN ('admin', 'super_admin')`);
    for (const s of staff.rows) {
      notifyUser(s.id, {
        title: 'New Complaint Raised',
        message: `"${newComplaint.title}" was just raised${newComplaint.priority ? ` (${newComplaint.priority} priority)` : ''}.`,
        link: '/complaints'
      });
    }

    res.status(201).json({
      message: 'Complaint raised successfully',
      complaint: newComplaint,
      ai_powered: !!finalAiCategory
    });
  } catch (err) {
    console.error('Complaint error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
        u.name as raised_by_name,
        w.name as assigned_worker_name,
        w.skill as worker_skill,
        b.building_name,
        bl.block_name,
        f.floor_name
       FROM complaints c
       LEFT JOIN users u ON c.raised_by = u.id
       LEFT JOIN workers w ON c.assigned_to = w.id
       LEFT JOIN buildings b ON c.building_id = b.id
       LEFT JOIN blocks bl ON c.block_id = bl.id
       LEFT JOIN floors f ON c.floor_id = f.id
       ORDER BY c.created_at DESC`
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
        u.name as raised_by_name,
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

    // Notify the person who raised this complaint that its status changed
    if (complaint.raised_by) {
      notifyUser(complaint.raised_by, {
        title: `Complaint ${status}`,
        message: `Your complaint "${complaint.title}" is now marked as ${status}.`,
        link: '/complaints/track'
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
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending,
        COUNT(*) FILTER (WHERE status = 'Assigned') as assigned,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed
      FROM complaints
    `);

    const categoryStats = await pool.query(`
      SELECT category, COUNT(*) as count
      FROM complaints
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `);

    const buildingStats = await pool.query(`
      SELECT b.building_name, COUNT(c.id) as complaint_count
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      GROUP BY b.building_name
      ORDER BY complaint_count DESC
    `);

    const monthlyStats = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM complaints
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    const recentComplaints = await pool.query(`
      SELECT c.*, u.name as raised_by_name, b.building_name
      FROM complaints c
      LEFT JOIN users u ON c.raised_by = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      ORDER BY c.created_at DESC LIMIT 5
    `);

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

module.exports = {
  raiseComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  deleteComplaint,
  getDashboardStats,
  getAIRecommendedWorker,
  rateComplaint
};