const pool = require('../config/db');

// List all items — total booked, total distributed, and remaining stock are
// all computed live from the actual purchase/distribution logs, never
// stored or typed in by hand, so they can never drift out of sync.
const getItems = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT si.id, si.item_name, si.unit, si.created_at,
        COALESCE((SELECT SUM(quantity) FROM stock_purchases WHERE item_id = si.id), 0) as total_booked,
        COALESCE((SELECT SUM(quantity) FROM stock_distributions WHERE item_id = si.id), 0) as total_distributed,
        COALESCE((SELECT SUM(quantity) FROM stock_purchases WHERE item_id = si.id), 0)
          - COALESCE((SELECT SUM(quantity) FROM stock_distributions WHERE item_id = si.id), 0) as remaining_stock
       FROM stock_items si
       ORDER BY si.item_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Adding a new item now also logs its initial stock in one step — no need
// to visit a separate "Booked" page just to record the starting quantity.
// Quantity, purchase date, and an invoice/receipt file are all optional —
// if quantity is provided, a matching stock_purchases record is created
// automatically alongside the new item.
const addItem = async (req, res) => {
  try {
    const { item_name, unit, quantity, purchase_date, notes } = req.body;
    if (!item_name) {
      return res.status(400).json({ message: 'Item name is required' });
    }

    const itemResult = await pool.query(
      `INSERT INTO stock_items (item_name, unit) VALUES ($1, $2) RETURNING *`,
      [item_name, unit || 'pcs']
    );
    const newItem = itemResult.rows[0];

    const qty = parseInt(quantity);
    if (qty && qty > 0) {
      const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;
      await pool.query(
        `INSERT INTO stock_purchases (item_id, quantity, purchase_date, receipt_url, notes, purchased_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newItem.id, qty, purchase_date || new Date().toISOString().split('T')[0], receipt_url, notes || null, req.user.id]
      );
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { item_name, unit, quantity, purchase_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE stock_items SET item_name = $1, unit = $2 WHERE id = $3 RETURNING *`,
      [item_name, unit || 'pcs', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });

    // Optionally log additional stock at the same time as an edit — no
    // need to visit a separate page just to top up quantity.
    const qty = parseInt(quantity);
    if (qty && qty > 0) {
      const receipt_url = req.file ? `/uploads/${req.file.filename}` : null;
      await pool.query(
        `INSERT INTO stock_purchases (item_id, quantity, purchase_date, receipt_url, notes, purchased_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.params.id, qty, purchase_date || new Date().toISOString().split('T')[0], receipt_url, notes || null, req.user.id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_items WHERE id = $1', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(409).json({ message: 'Cannot delete — this item has purchase or distribution records. Delete those first.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getItems, addItem, updateItem, deleteItem };