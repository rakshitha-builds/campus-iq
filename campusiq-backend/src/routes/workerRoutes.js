const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getWorkers, addWorker, updateWorker, deleteWorker, getWorkerStats
} = require('../controllers/workerController');

router.get('/', verifyToken, getWorkers);
router.get('/stats', verifyToken, getWorkerStats);
router.post('/', verifyToken, isAdmin, addWorker);
router.put('/:id', verifyToken, isAdmin, updateWorker);
router.delete('/:id', verifyToken, isAdmin, deleteWorker);

module.exports = router;