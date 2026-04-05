const CACHE = 'focusday-v1';
const ASSETS = ['/index.html', '/blog.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// ── INSTALL: cache all assets ──
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: serve from cache, fall back to network ──
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── NOTIFICATION SCHEDULING ──
// Timers are stored in a Map so they can be cancelled
const timers = new Map();

self.addEventListener('message', e => {
  const { type, id, title, body, delay } = e.data;

  if (type === 'SCHEDULE') {
    // Cancel any existing timer for this id
    if (timers.has(id)) clearTimeout(timers.get(id));

    const t = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: id,
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });
      timers.delete(id);
    }, delay);

    timers.set(id, t);
  }

  if (type === 'CANCEL') {
    if (timers.has(id)) {
      clearTimeout(timers.get(id));
      timers.delete(id);
    }
  }

  if (type === 'CANCEL_ALL') {
    timers.forEach(t => clearTimeout(t));
    timers.clear();
  }
});

// ── NOTIFICATION CLICK: open app ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes('focusday') || c.url.includes('index.html'));
      if (existing) return existing.focus();
      return clients.openWindow('/index.html');
    })
  );
});
