const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getPurchases, addPurchase, deletePurchase } = require('../controllers/purchaseController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Admin/Super Admin only
router.get('/', verifyToken, isAdmin, getPurchases);
router.post('/', verifyToken, isAdmin, upload.single('receipt'), addPurchase);
router.delete('/:id', verifyToken, isAdmin, deletePurchase);

module.exports = router;