import { useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

// Converts the VAPID public key (base64) into the byte format the
// browser's Push API expects.
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the service worker on load (harmless, no permission needed for
 * this part). Returns the current permission state and an `enablePush()`
 * function you should call directly from a button's onClick — browsers
 * silently block permission popups that aren't triggered by a real click,
 * so we never call requestPermission() automatically.
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service worker registration failed:', err);
      });
    }
  }, []);

  const enablePush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) return; // already subscribed on this browser

      const { data } = await API.get('/notifications/push/public-key');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });

      const subJSON = subscription.toJSON();
      await API.post('/notifications/push/subscribe', {
        endpoint: subJSON.endpoint,
        keys: subJSON.keys,
      });
    } catch (err) {
      console.error('Push subscription setup failed:', err);
    }
  }, []);

  return { permission, enablePush };
};