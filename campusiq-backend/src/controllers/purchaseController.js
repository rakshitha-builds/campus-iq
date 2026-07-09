const pool = require('../config/db');

const getPurchases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, si.item_name, si.unit, u.name as purchased_by_name
       FROM stock_purchases sp
       LEFT JOIN stock_items si ON sp.item_id = si.id
       LEFT JOIN users u ON sp.purchased_by = u.id
       ORDER BY sp.purchase_date DESC, sp.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addPurchase = async (req, res) => {
  try {
    const { item_id, quantity, purchase_date, notes } = req.body;
    if (!item_id || !quantity || !purchase_date) {
      return res.status(400).json({ message: 'Item, quantity, and date are required' });
    }

    const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO stock_purchases (item_id, quantity, purchase_date, receipt_url, notes, purchased_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [item_id, parseInt(quantity), purchase_date, receipt_url, notes || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deletePurchase = async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_purchases WHERE id = $1', [req.params.id]);
    res.json({ message: 'Purchase record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getPurchases, addPurchase, deletePurchase };