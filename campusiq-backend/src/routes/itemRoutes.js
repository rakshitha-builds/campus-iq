const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getItems, addItem, updateItem, deleteItem } = require('../controllers/itemController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Admin/Super Admin only — this whole section is restricted per the guide's requirement
router.get('/', verifyToken, isAdmin, getItems);
router.post('/', verifyToken, isAdmin, upload.single('invoice'), addItem);
router.put('/:id', verifyToken, isAdmin, updateItem);
router.delete('/:id', verifyToken, isAdmin, deleteItem);

module.exports = router;