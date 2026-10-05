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

  const notificationTitle = payload.notification?.title || '🚨 NanoAgriSense Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'A sensor threshold breach was detected in the field.',
    icon: '/logo192.png', // Optional icon path
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});