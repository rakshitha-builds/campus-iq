// Runs in the background, separate from your React app. This is what makes
// push notifications work even when the CampusIQ tab is closed or the
// browser is minimized.

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'CampusIQ';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: { url: data.url || '/dashboard' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the OS notification opens (or focuses) the app at the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});