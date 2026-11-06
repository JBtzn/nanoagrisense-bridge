// notifications.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";

// Your Firebase Web Config
const firebaseConfig = {
  apiKey: "AIzaSyBP_EuXqM5sKocTR5y1q-fUkOSer2s8N6A",
  authDomain: "nanoagrisense-38592.firebaseapp.com",
  projectId: "nanoagrisense-38592",
  storageBucket: "nanoagrisense-38592.firebasestorage.app",
  messagingSenderId: "962914436686",
  appId: "1:962914436686:web:5d0a91d3b53e5f1c33a51f",
  measurementId: "G-9GCKR2CJFE"
};

const app = initializeApp(firebaseConfig);
let messaging = null;

try {
  messaging = getMessaging(app);
} catch (err) {
  console.warn("FCM messaging initialization failed or unsupported in this browser:", err);
}

const getApiBaseUrl = () => {
  return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : 'https://nanoagrisense-bridge.onrender.com/api';
};

/**
 * Registers the Service Worker, requests notification permission,
 * retrieves the FCM token, and subscribes the token to the 'alerts' topic on the bridge API.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return null;
  }
  if (!('serviceWorker' in navigator)) {
    alert('Service workers are not supported by this browser.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission was denied or dismissed.');
      return null;
    }

    console.log('🔔 Notification permission granted.');

    // 1. Register the Service Worker explicitly
    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    console.log('👷 Service Worker registered for FCM:', registration.scope);

    // 2. Retrieve FCM registration token
    const currentToken = await getToken(messaging, {
      vapidKey: 'BKFevpyfKw50sj17qvCT65n1qa2yo9PUYZicFf_23VB58zcfFmwY--MOaLcLzV7mVG3sEl9Q_PYHY_GxJxxa9qs',
      serviceWorkerRegistration: registration
    });

    if (!currentToken) {
      console.warn('No FCM registration token available.');
      return null;
    }

    console.log('📱 FCM Device Registration Token:', currentToken);

    // 3. Subscribe the device token to the 'alerts' topic on the backend bridge
    try {
      const res = await fetch(`${getApiBaseUrl()}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, topic: 'alerts' })
      });
      const data = await res.json();
      console.log('📡 Device subscribed to alerts topic:', data);
    } catch (err) {
      console.error('❌ Failed to register token with bridge backend:', err);
    }

    return currentToken;
  } catch (error) {
    console.error('❌ Error initializing push notifications/token:', error);
    return null;
  }
};

/**
 * Listen for incoming messages while the application tab is in the foreground.
 */
export const listenForForegroundMessages = (onAlertReceived) => {
  if (!messaging) return;

  return onMessage(messaging, (payload) => {
    console.log('📩 Foreground FCM Notification received:', payload);

    const title = payload.notification?.title || payload.data?.title || '🚨 NanoAgriSense Alert';
    const body = payload.notification?.body || payload.data?.body || 'A sensor threshold breach was detected in the field.';

    // Show native browser notification if granted
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'assets/logo.png',
          badge: 'assets/logo.png'
        });
      } catch (e) {
        console.warn('Could not display native notification banner:', e);
      }
    }

    if (onAlertReceived) {
      onAlertReceived(payload);
    }
  });
};
