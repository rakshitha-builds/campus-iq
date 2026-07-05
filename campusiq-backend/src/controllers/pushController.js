const pool = require('../config/db');

const subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription data' });
    }
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, keys_p256dh = $3, keys_auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.status(201).json({ message: 'Subscribed to push notifications' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    res.json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getPublicKey = (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

module.exports = { subscribe, unsubscribe, getPublicKey };