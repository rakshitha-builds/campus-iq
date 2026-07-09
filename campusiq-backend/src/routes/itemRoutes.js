const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getItems, addItem, updateItem, deleteItem } = require('../controllers/itemController');

// Admin/Super Admin only — this whole section is restricted per the guide's requirement
router.get('/', verifyToken, isAdmin, getItems);
router.post('/', verifyToken, isAdmin, addItem);
router.put('/:id', verifyToken, isAdmin, updateItem);
router.delete('/:id', verifyToken, isAdmin, deleteItem);

module.exports = router;