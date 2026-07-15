// CTG Click Shop — Dubai Finance Hub
// Service Worker v2.0

const CACHE_NAME = 'ctg-dubai-v3.2';
const OFFLINE_URL = '/dubai-finance-hub/';

const CACHE_ASSETS = [
  '/dubai-finance-hub/',
  '/dubai-finance-hub/index.html',
  '/dubai-finance-hub/v3.js',
  '/dubai-finance-hub/manifest.json',
  '/dubai-finance-hub/icon-192.png',
  '/dubai-finance-hub/icon-512.png',
];

// External CDN assets to cache
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap',
];

// ── Install ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app assets...');
      return cache.addAll(CACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch Strategy ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase requests — always network (don't cache Firebase data)
  if (url.hostname.includes('firebase') || url.hostname.includes('google') && url.pathname.includes('firestore')) {
    return; // Let Firebase handle its own requests
  }

  // Navigation requests — network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update cache with fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(OFFLINE_URL).then(cached => {
            if (cached) return cached;
            return new Response('<h1>Offline</h1><p>Please connect to internet.</p>', {
              headers: {'Content-Type': 'text/html'}
            });
          });
        })
    );
    return;
  }

  // Static assets — cache first, then network
  if (url.pathname.match(/\.(css|js|png|jpg|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }).catch(() => new Response('', {status: 404}));
      })
    );
    return;
  }

  // All other requests — network first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── Push Notifications (future) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CTG Dubai', {
      body: data.body || '',
      icon: '/dubai-finance-hub/icon-192.png',
      badge: '/dubai-finance-hub/icon-192.png',
      tag: data.tag || 'ctg-dubai',
      data: data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});

console.log('[SW] CTG Dubai Finance Hub Service Worker loaded ✓');
