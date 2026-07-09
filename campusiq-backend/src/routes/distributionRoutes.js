const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { getDistributions, addDistribution, deleteDistribution } = require('../controllers/distributionController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Admin/Super Admin only
router.get('/', verifyToken, isAdmin, getDistributions);
router.post('/', verifyToken, isAdmin, upload.single('receipt'), addDistribution);
router.delete('/:id', verifyToken, isAdmin, deleteDistribution);

module.exports = router;