const webpush = require('web-push');
const pool = require('../config/db');

webpush.setVapidDetails(
  'mailto:admin@campusiq.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Notifies a single user: saves an in-app notification (for the bell icon)
 * AND sends a real browser push to every device they've subscribed on.
 * Call this from anywhere in the backend when something happens that a
 * specific user should know about (their complaint status changed, their
 * booking was confirmed, etc).
 */
const notifyUser = async (userId, { title, message, link = null }) => {
  try {
    // 1. Save in-app notification (always works, no permission needed)
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, link) VALUES ($1, $2, $3, $4)`,
      [userId, title, message, link]
    );

    // 2. Send real browser push to every subscribed device for this user
    const subs = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);
    const payload = JSON.stringify({ title, body: message, url: link || '/dashboard' });

    for (const sub of subs.rows) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // Subscription expired/invalid (e.g. user cleared browser data) — clean it up
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        } else {
          console.error('Push send error:', err.message);
        }
      }
    }
  } catch (err) {
    console.error('notifyUser error:', err.message);
  }
};

module.exports = { notifyUser };