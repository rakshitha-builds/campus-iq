const pool = require('../config/db');

const getDistributions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sd.*, si.item_name, si.unit, d.department_name, u.name as distributed_by_name
       FROM stock_distributions sd
       LEFT JOIN stock_items si ON sd.item_id = si.id
       LEFT JOIN departments d ON sd.department_id = d.id
       LEFT JOIN users u ON sd.distributed_by = u.id
       ORDER BY sd.distributed_date DESC, sd.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addDistribution = async (req, res) => {
  try {
    const { item_id, department_id, quantity, distributed_date, notes } = req.body;
    if (!item_id || !quantity || !distributed_date) {
      return res.status(400).json({ message: 'Item, quantity, and date are required' });
    }

    const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO stock_distributions (item_id, department_id, quantity, distributed_date, receipt_url, notes, distributed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [item_id, department_id || null, parseInt(quantity), distributed_date, receipt_url, notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteDistribution = async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_distributions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Distribution record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getDistributions, addDistribution, deleteDistribution };