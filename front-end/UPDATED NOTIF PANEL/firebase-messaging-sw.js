// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBP_EuXqM5sKocTR5y1q-fUkOSer2s8N6A",
  authDomain: "nanoagrisense-38592.firebaseapp.com",
  projectId: "nanoagrisense-38592",
  storageBucket: "nanoagrisense-38592.firebasestorage.app",
  messagingSenderId: "962914436686",
  appId: "1:962914436686:web:5d0a91d3b53e5f1c33a51f",
  measurementId: "G-9GCKR2CJFE"
});

const messaging = firebase.messaging();

// Handle background push messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || '🚨 NanoAgriSense Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'A sensor threshold breach was detected in the field.',
    icon: 'assets/logo.png',
    badge: 'assets/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Focus or open dashboard when user clicks on push notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});