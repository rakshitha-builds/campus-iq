const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const masterRoutes = require('./src/routes/masterRoutes');
const workerRoutes = require('./src/routes/workerRoutes');
const complaintRoutes = require('./src/routes/complaintRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const assetRoutes = require('./src/routes/assetRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const noticeRoutes = require('./src/routes/noticeRoutes');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notices', noticeRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CampusIQ Backend Running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});