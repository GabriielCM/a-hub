// Push notification event handler
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      tag: data.data?.type || 'default',
      renotify: true,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Fechar' },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open with the app
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Navigate to the target URL and focus the window
            return client.navigate(urlToOpen).then(() => client.focus());
          }
        }
        // If no window is open, open a new one
        return clients.openWindow(urlToOpen);
      })
  );
});

// Notification close handler (optional - for analytics)
self.addEventListener('notificationclose', (event) => {
  // You could send analytics here if needed
  console.log('Notification closed:', event.notification.data);
});
