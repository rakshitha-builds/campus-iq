const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { subscribe, unsubscribe, getPublicKey } = require('../controllers/pushController');

// In-app notification bell
router.get('/', verifyToken, getMyNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);

// Browser push subscription
router.get('/push/public-key', getPublicKey);
router.post('/push/subscribe', verifyToken, subscribe);
router.post('/push/unsubscribe', verifyToken, unsubscribe);

module.exports = router;