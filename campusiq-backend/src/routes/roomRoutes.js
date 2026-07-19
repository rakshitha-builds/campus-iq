const express = require('express');
const router = express.Router();
const { verifyToken, isSuperAdmin } = require('../middleware/auth');
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController');

// GET is open to any logged-in user (Staff/User need this to book rooms)
router.get('/', verifyToken, getRooms);
router.post('/', verifyToken, isSuperAdmin, addRoom);
router.put('/:id', verifyToken, isSuperAdmin, updateRoom);
router.delete('/:id', verifyToken, isSuperAdmin, deleteRoom);

module.exports = router;