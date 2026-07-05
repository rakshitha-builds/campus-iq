const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rb.*, u.name as user_name, u.department as user_department
       FROM room_bookings rb
       LEFT JOIN users u ON rb.booked_by = u.id
       ORDER BY rb.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create booking
router.post('/', async (req, res) => {
  try {
    const { room_name, booking_date, start_time, end_time, purpose, booked_by, booked_by_name, department } = req.body;

    // Advance booking only — reject today or any past date, even if the
    // frontend date picker was bypassed (e.g. direct API call).
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!booking_date || booking_date <= todayStr) {
      return res.status(400).json({ message: 'Bookings must be made in advance — same-day or past-date bookings are not allowed.' });
    }

    const booking_id = 'BKG' + Math.floor(Math.random() * 9000 + 1000);

    const result = await pool.query(
      `INSERT INTO room_bookings (booking_id, room_name, booked_by, booked_by_name, department, booking_date, start_time, end_time, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Confirmed') RETURNING *`,
      [booking_id, room_name, booked_by || 2, booked_by_name || 'Admin', department || 'General', booking_date, start_time, end_time, purpose]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM room_bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;