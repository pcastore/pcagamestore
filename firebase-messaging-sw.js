/* PCA Game Store — push service worker (no Firebase SDK needed here).
   Receives FCM web-push, shows a styled app-branded notification. */
const ICON  = '/favicon-192.png';   // colour app icon (big, shown in the notification)
const BADGE = '/badge-96.png';      // white-on-transparent icon (status bar)
const ACCENT_URL = '/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Kept from your old file: network-first fetch handler (helps PWA installability).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then((r) => r || Response.error())));
});

function parsePush(event) {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch (e) {
    try { p = { title: 'PCA Game Store', body: event.data.text() }; } catch (_) {}
  }
  // FCM wraps: { data:{...} } for data-only, { notification:{...} } for console test messages
  const d = Object.assign({}, p.notification || {}, p.data || {});
  if (!d.title && p.title) d.title = p.title;
  if (!d.body && p.body) d.body = p.body;
  return d;
}

self.addEventListener('push', (event) => {
  const d = parsePush(event);
  let title = d.title || 'PCA Game Store';
  const opts = {
    body: d.body || '',
    icon: d.icon || ICON,
    badge: BADGE,
    tag: d.tag || 'pca-general',        // same tag = replaces, no pile-up
    renotify: true,
    lang: 'my',
    dir: 'auto',
    vibrate: [90, 50, 90, 50, 160],
    timestamp: Date.now(),
    silent: false,
    data: { url: d.url || ACCENT_URL, tag: d.tag || '' },
    actions: [{ action: 'open', title: 'ဖွင့်ကြည့်မည်' }]
  };
  if (d.image) opts.image = d.image;     // optional big banner
  event.waitUntil((async () => {
    // Grouped alerts (e.g. several new orders): one notification that keeps a running count
    if (d.group) {
      try {
        const old = await self.registration.getNotifications({ tag: d.group });
        const prev = old.reduce((a, n) => a + ((n.data && n.data.count) || 1), 0);
        const count = prev + 1;
        opts.tag = d.group;
        opts.data.count = count;
        if (count > 1) title = title + ' ×' + count;
      } catch (e) {}
    }
    await self.registration.showNotification(title, opts);
    // App-icon badge = number of notifications still unread (best effort; not every phone shows a number)
    await syncBadge();
  })());
});

// Badge = notifications still sitting in the tray. 0 clears it.
async function syncBadge() {
  try {
    const n = (await self.registration.getNotifications()).length;
    if (!self.navigator) return;
    if (n > 0 && self.navigator.setAppBadge) await self.navigator.setAppBadge(n);
    else if (n === 0 && self.navigator.clearAppBadge) await self.navigator.clearAppBadge();
  } catch (e) {}
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  let url;
  try {
    const u = new URL((event.notification.data && event.notification.data.url) || ACCENT_URL, self.location.origin);
    url = (u.origin === self.location.origin ? u : new URL(ACCENT_URL, self.location.origin)).href; // never leave the site
  } catch (e) { url = new URL(ACCENT_URL, self.location.origin).href; }
  event.waitUntil((async () => {
    await syncBadge();
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        try { c.postMessage({ type: 'pca-notif-click', url }); } catch (e) {}
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
