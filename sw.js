/* ═══════════════════════════════════════════════════════
   HGHome Official  —  sw.js
   Service Worker — PWA caching
═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'hghome-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
];

// Install: cache shell assets
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(SHELL_ASSETS).catch(() => {})
    )
  );
});

// Activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for Firebase/API, cache-first for static assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin Firebase calls
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;

  // Cache-first for static assets
  if (url.pathname.match(/\.(css|js|png|jpg|woff2|svg|ico)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for HTML pages
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && url.pathname.endsWith('.html')) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() =>
      caches.match(e.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});

// Push notification handler (for future FCM integration)
self.addEventListener('push', (e) => {
  if (!e.data) return;
  let data = {};
  try { data = e.data.json(); } catch(_) { data = { title: 'HGHome', body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'HGHome', {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'hghome-notif',
      data: { url: data.url || './' }
    })
  );
});

// Notification click: open/focus the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const target = e.notification.data?.url || './';
      const existing = wins.find(w => w.url.includes('hghome') && 'focus' in w);
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});
