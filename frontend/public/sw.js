// ── INCREMENT THIS VERSION ON EVERY DEPLOY to bust the cache ──
const CACHE_VERSION = 'v13';
const CACHE_NAME = 'vitalssaathi-' + CACHE_VERSION;

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: open new cache
self.addEventListener('install', event => {
  console.log('[SW] Installing', CACHE_NAME);
  // Skip waiting IMMEDIATELY so new SW takes over right away
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[SW] Cache error (non-fatal):', err);
      });
    })
  );
});

// Activate: DELETE ALL OLD CACHES immediately
self.addEventListener('activate', event => {
  console.log('[SW] Activating', CACHE_NAME, '- clearing old caches');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    ).then(() => {
      // Take control of all open tabs immediately
      return self.clients.claim();
    }).then(() => {
      // Tell all clients to reload so they get fresh JS/CSS
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
});

// Fetch: NETWORK FIRST always — never serve stale JS/CSS from cache
self.addEventListener('fetch', event => {
  // Skip API calls
  if (event.request.url.includes('/api/')) return;
  // Skip non-GET
  if (event.request.method !== 'GET') return;

  // For JS and CSS files: NETWORK ONLY, never cache (always get fresh code)
  const url = new URL(event.request.url);
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For everything else: network first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        if (event.request.mode === 'navigate') return caches.match('/index.html');
      }))
  );
});