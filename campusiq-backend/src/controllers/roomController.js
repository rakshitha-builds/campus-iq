const pool = require('../config/db');

const resetSequenceIfEmpty = async (tableName) => {
  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    if (parseInt(countResult.rows[0].count) === 0) {
      await pool.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`);
    }
  } catch (err) {
    console.error(`Sequence reset skipped for ${tableName}:`, err.message);
  }
};

const getRooms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, b.block_name FROM rooms r
       LEFT JOIN blocks b ON r.block_id = b.id
       ORDER BY r.room_name ASC, b.block_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const addRoom = async (req, res) => {
  try {
    const { room_name, block_id } = req.body;
    if (!room_name) {
      return res.status(400).json({ message: 'Room name is required' });
    }
    const result = await pool.query(
      'INSERT INTO rooms (room_name, block_id) VALUES ($1, $2) RETURNING *',
      [room_name, block_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { room_name, block_id } = req.body;
    const result = await pool.query(
      'UPDATE rooms SET room_name = $1, block_id = $2 WHERE id = $3 RETURNING *',
      [room_name, block_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Room not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    await resetSequenceIfEmpty('rooms');
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('Delete room error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getRooms, addRoom, updateRoom, deleteRoom };