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
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('🔔 Notification permission granted.');

      // Fetch FCM Registration Token
      const currentToken = await getToken(messaging, {
        vapidKey: 'BKFevpyfKw50sj17qvCT65n1qa2yo9PUYZicFf_23VB58zcfFmwY--MOaLcLzV7mVG3sEl9Q_PYHY_GxJxxa9qs' // Paste your VAPID key here
      });

      if (currentToken) {
        console.log('📱 FCM Device Token:', currentToken);
        return currentToken;
      } else {
        console.warn('No registration token available.');
      }
    } else {
      console.warn('Permission denied for notifications.');
    }
  } catch (error) {
    console.error('❌ Error getting notification permission/token:', error);
  }
};

// Listen for foreground alerts while the dashboard tab is OPEN
export const listenForForegroundMessages = (onAlertReceived) => {
  return onMessage(messaging, (payload) => {
    console.log('📩 Foreground Notification received:', payload);
    if (onAlertReceived) {
      onAlertReceived(payload);
    }
  });
};