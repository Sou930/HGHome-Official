/* ═══════════════════════════════════════════════════════
   HGHome Official  —  sw.js
   Service Worker — PWA caching  (Fixed)
═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'hghome-v2';
const SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
];

/* ── Install: cache shell assets ── */
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(SHELL_ASSETS).catch(() => {})
    )
  );
});

/* ── Activate: remove old caches ── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Skip cross-origin Firebase / Google calls — let them go direct
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('firebaseio')
  ) return;

  // ── Cache-first for static assets ──
  if (url.pathname.match(/\.(css|js|png|jpg|jpeg|webp|woff|woff2|svg|ico)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;

        return fetch(e.request).then(res => {
          // Only cache valid responses
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => {
          // FIX: return cached even if undefined — avoids unhandled rejection
          return cached || Response.error();
        });
      })
    );
    return;
  }

  // ── Network-first for HTML pages ──
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.ok && (
        url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')
      )) {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() =>
      // Fallback: try cache, then app shell
      caches.match(e.request).then(cached =>
        cached || caches.match('./index.html')
      )
    )
  );
});

/* ── Push notification handler ── */
self.addEventListener('push', (e) => {
  if (!e.data) return;

  let data = {};
  try {
    data = e.data.json();
  } catch(_) {
    data = { title: 'HGHome', body: e.data.text() };
  }

  e.waitUntil(
    self.registration.showNotification(data.title || 'HGHome', {
      body:  data.body  || '',
      icon:  './icon-192.png',
      badge: './icon-192.png',
      tag:   data.tag   || 'hghome-notif',
      data:  { url: data.url || './' }
    })
  );
});

/* ── Notification click: open / focus the app ── */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const target   = e.notification.data?.url || './';
      const existing = wins.find(w => w.url.includes('hghome') && 'focus' in w);
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});
