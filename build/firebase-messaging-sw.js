// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');
import logo from './logo.png'

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyB9G3EjE2A4Xv22qXAi2xj-nwJKH-JNk7I",
  authDomain: "wave-755af.firebaseapp.com",
  projectId: "wave-755af",
  storageBucket: "wave-755af.appspot.com",
  messagingSenderId: "610594970194",
  appId: "1:610594970194:web:2b3391f0b988d51e86dd8b",
  measurementId: "G-RKCG85MS6M"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: logo // Your app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// // Optional: Add click handler for notifications
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   // Handle notification click
//   event.waitUntil(
//     clients.openWindow('/') // Open your app when notification is clicked
//   );
// });