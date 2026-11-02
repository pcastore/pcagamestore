// Minimal service worker for PWA installability (network-first, no caching of API calls).
// If you already have push-notification code in your existing firebase-messaging-sw.js,
// keep it and just add the install/activate/fetch handlers below.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
