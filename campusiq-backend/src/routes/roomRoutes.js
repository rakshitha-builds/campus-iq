const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getRooms, addRoom, updateRoom, deleteRoom } = require('../controllers/roomController');

// GET is open to any logged-in user (Staff/User need this to book rooms)
router.get('/', verifyToken, getRooms);
router.post('/', verifyToken, isAdmin, addRoom);
router.put('/:id', verifyToken, isAdmin, updateRoom);
router.delete('/:id', verifyToken, isAdmin, deleteRoom);

module.exports = router;