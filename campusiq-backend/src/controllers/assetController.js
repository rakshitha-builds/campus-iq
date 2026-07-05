const pool = require('../config/db');
const { generateAssetId } = require('../utils/helpers');

const getAssets = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addAsset = async (req, res) => {
  try {
    const { asset_name, category, location, purchase_date, warranty_expiry, status } = req.body;
    if (!asset_name) {
      return res.status(400).json({ message: 'Asset name is required' });
    }
    const asset_id = generateAssetId();
    const result = await pool.query(
      `INSERT INTO assets (asset_id, asset_name, category, location, purchase_date, warranty_expiry, status, failure_count, risk_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0) RETURNING *`,
      [asset_id, asset_name, category || null, location || null, purchase_date || null, warranty_expiry || null, status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateAsset = async (req, res) => {
  try {
    const { asset_name, category, location, purchase_date, warranty_expiry, status, failure_count, risk_score } = req.body;
    const result = await pool.query(
      `UPDATE assets SET
         asset_name = $1, category = $2, location = $3,
         purchase_date = $4, warranty_expiry = $5, status = $6,
         failure_count = COALESCE($7, failure_count),
         risk_score = COALESCE($8, risk_score)
       WHERE id = $9 RETURNING *`,
      [asset_name, category || null, location || null, purchase_date || null, warranty_expiry || null, status, failure_count, risk_score, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete this asset — it is still referenced by existing complaints.' });
    }
    console.error('Delete asset error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getAssets, addAsset, updateAsset, deleteAsset };