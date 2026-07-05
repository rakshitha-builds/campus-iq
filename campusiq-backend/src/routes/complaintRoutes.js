const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  raiseComplaint, getComplaints, getComplaintById,
  assignComplaint, updateComplaintStatus, deleteComplaint,
  getDashboardStats, getAIRecommendedWorker, rateComplaint
} = require('../controllers/complaintController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/dashboard', verifyToken, getDashboardStats);
router.get('/ai-recommend', verifyToken, getAIRecommendedWorker);
router.get('/', verifyToken, getComplaints);
router.get('/:id', verifyToken, getComplaintById);
router.post('/', verifyToken, upload.single('photo'), raiseComplaint);
router.put('/:id/assign', verifyToken, isAdmin, assignComplaint);
router.put('/:id/status', verifyToken, upload.single('after_photo'), updateComplaintStatus);
router.post('/:id/rate', verifyToken, rateComplaint);
router.delete('/:id', verifyToken, isAdmin, deleteComplaint);

module.exports = router;