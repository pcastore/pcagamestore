// firebase-messaging-sw.js
//
// MUST be deployed at the SITE ROOT (same level as index.html/store.html),
// e.g. https://yourdomain.com/firebase-messaging-sw.js — not inside a /js
// or /assets subfolder. store.html registers it with a root-relative path
// (navigator.serviceWorker.register('/firebase-messaging-sw.js')), so if
// this file lives anywhere else, that registration silently 404s and push
// notifications never activate (registerFcmToken()'s catch block only
// logs to console — nothing visible to the customer).
//
// Config below matches the firebaseConfig already used in store.html.

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyA2mwdZ2tAoZ3_6HNl43fUSi9t_ZkRita4",
    authDomain: "pca-game-store.firebaseapp.com",
    projectId: "pca-game-store",
    storageBucket: "pca-game-store.firebasestorage.app",
    messagingSenderId: "666629360027",
    appId: "1:666629360027:web:23dcf1dc1f9ebeb86cb93e"
});

const messaging = firebase.messaging();

// Handles a push that arrives while the store tab is closed / in the
// background. (Foreground pushes are instead handled by store.html's own
// onMessage() listener, which shows an in-page toast.)
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'PCA Store';
    const body = payload.notification?.body || payload.data?.body || '';
    self.registration.showNotification(title, {
        body,
        icon: payload.notification?.icon || '/logo.png',
        data: payload.data || {}
    });
});

// Tapping the OS notification focuses/opens the store tab.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
