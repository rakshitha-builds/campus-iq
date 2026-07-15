const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { notifyUser } = require('../utils/notify');

// Get all bookings
router.get('/', verifyToken, async (req, res) => {
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

// Create booking — any logged-in user (User, Admin, or Super Admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { room_name, block, booking_date, start_time, end_time, purpose, department } = req.body;

    // Advance booking only — reject today or any past date, even if the
    // frontend date picker was bypassed (e.g. direct API call).
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!booking_date || booking_date <= todayStr) {
      return res.status(400).json({ message: 'Bookings must be made in advance — same-day or past-date bookings are not allowed.' });
    }

    if (!start_time || !end_time || start_time >= end_time) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Only reject if the requested time actually overlaps an existing
    // booking for the same room + block + date — a room can be booked
    // multiple times in one day as long as the time slots don't clash.
    // Two ranges overlap when start1 < end2 AND start2 < end1.
    const conflict = await pool.query(
      `SELECT * FROM room_bookings
       WHERE room_name = $1 AND block = $2 AND booking_date = $3
       AND start_time < $4 AND $5 < end_time`,
      [room_name, block || null, booking_date, end_time, start_time]
    );
    if (conflict.rows.length > 0) {
      const c = conflict.rows[0];
      return res.status(409).json({ message: `This slot overlaps an existing booking (${c.start_time}–${c.end_time}) for this room. Please pick a different time.` });
    }

    const booking_id = 'BKG' + Math.floor(Math.random() * 9000 + 1000);

    const result = await pool.query(
      `INSERT INTO room_bookings (booking_id, room_name, block, booked_by, booked_by_name, department, booking_date, start_time, end_time, purpose, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Confirmed') RETURNING *`,
      [booking_id, room_name, block || null, req.user.id, req.user.name || 'User', department || 'General', booking_date, start_time, end_time, purpose]
    );

    const booking = result.rows[0];

    // Confirm to the person who booked it
    notifyUser(req.user.id, {
      title: '📅 Room Booked',
      message: `${room_name}${block ? ` (${block})` : ''} confirmed for ${booking_date}, ${start_time}–${end_time}.`,
      link: '/bookings'
    });

    // Let Admin/Super Admin know a new booking came in
    const staffToNotify = await pool.query(`SELECT id FROM users WHERE role IN ('admin', 'super_admin')`);
    for (const s of staffToNotify.rows) {
      if (s.id === req.user.id) continue; // don't double-notify if an Admin booked it themselves
      notifyUser(s.id, {
        title: 'New Room Booking',
        message: `${req.user.name || 'Someone'} booked ${room_name}${block ? ` (${block})` : ''} for ${booking_date}, ${start_time}–${end_time}.`,
        link: '/bookings'
      });
    }

    res.status(201).json(booking);
  } catch (err) {
    console.error('Booking error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an existing booking — any logged-in user
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { room_name, block, booking_date, start_time, end_time, purpose, department } = req.body;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (!booking_date || booking_date <= todayStr) {
      return res.status(400).json({ message: 'Bookings must be made in advance — same-day or past-date bookings are not allowed.' });
    }

    if (!start_time || !end_time || start_time >= end_time) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Same overlap check as creating, but excluding this booking itself
    const conflict = await pool.query(
      `SELECT * FROM room_bookings
       WHERE room_name = $1 AND block = $2 AND booking_date = $3
       AND start_time < $4 AND $5 < end_time
       AND id != $6`,
      [room_name, block || null, booking_date, end_time, start_time, req.params.id]
    );
    if (conflict.rows.length > 0) {
      const c = conflict.rows[0];
      return res.status(409).json({ message: `This slot overlaps an existing booking (${c.start_time}–${c.end_time}) for this room. Please pick a different time.` });
    }

    const result = await pool.query(
      `UPDATE room_bookings SET room_name = $1, block = $2, department = $3,
       booking_date = $4, start_time = $5, end_time = $6, purpose = $7
       WHERE id = $8 RETURNING *`,
      [room_name, block || null, department || 'General', booking_date, start_time, end_time, purpose, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = result.rows[0];
    notifyUser(req.user.id, {
      title: '📅 Booking Updated',
      message: `${room_name}${block ? ` (${block})` : ''} updated to ${booking_date}, ${start_time}–${end_time}.`,
      link: '/bookings'
    });

    res.json(booking);
  } catch (err) {
    console.error('Booking update error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Cancel booking — any logged-in user
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM room_bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;