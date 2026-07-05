const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { askChatbot } = require('../controllers/chatbotController');

router.post('/ask', verifyToken, askChatbot);

module.exports = router;