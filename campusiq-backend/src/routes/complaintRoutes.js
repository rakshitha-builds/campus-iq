const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  raiseComplaint, getComplaints, getComplaintById,
  assignComplaint, updateComplaintStatus, deleteComplaint,
  getDashboardStats, getAIRecommendedWorker, rateComplaint,
  getComplaintByToken, rateByToken, getRecurringIssues
} = require('../controllers/complaintController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/dashboard', verifyToken, getDashboardStats);
router.get('/recurring-issues', verifyToken, isAdmin, getRecurringIssues);
router.get('/ai-recommend', verifyToken, getAIRecommendedWorker);
router.get('/', verifyToken, getComplaints);
router.get('/:id', verifyToken, getComplaintById);
router.post('/', verifyToken, upload.single('photo'), raiseComplaint);

// QR-scan guests aren't logged in — this lets them submit with just a typed
// name instead. Deliberately unauthenticated; raiseComplaint() never reads
// req.user, so it's safe to reuse as-is.
router.post('/guest', upload.single('photo'), raiseComplaint);

// Public tracking for guest complaints — no login, matched by a private token
router.get('/track/:token', getComplaintByToken);
router.post('/track/:token/rate', rateByToken);
router.put('/:id/assign', verifyToken, isAdmin, assignComplaint);
router.put('/:id/status', verifyToken, upload.single('after_photo'), updateComplaintStatus);
router.post('/:id/rate', verifyToken, rateComplaint);
router.delete('/:id', verifyToken, isAdmin, deleteComplaint);

module.exports = router;