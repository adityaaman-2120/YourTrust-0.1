importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyCH2HwkqYHtNnLD9zw5_H05_8C0loDcack",
    authDomain: "yourtrust-b715e.firebaseapp.com",
    projectId: "yourtrust-b715e",
    storageBucket: "yourtrust-b715e.firebasestorage.app",
    messagingSenderId: "280713371064",
    appId: "1:280713371064:web:355b9b448459b49ecf834d",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
    );
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png', // TrustFirst logo
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
