const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getWorkers, addWorker, updateWorker, deleteWorker, getWorkerStats
} = require('../controllers/workerController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', verifyToken, getWorkers);
router.get('/stats', verifyToken, getWorkerStats);
router.post('/', verifyToken, isAdmin, upload.single('photo'), addWorker);
router.put('/:id', verifyToken, isAdmin, upload.single('photo'), updateWorker);
router.delete('/:id', verifyToken, isAdmin, deleteWorker);

module.exports = router;