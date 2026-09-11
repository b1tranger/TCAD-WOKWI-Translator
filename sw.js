// TCAD-WOKWI-Translator Service Worker
// Provides offline caching for the standalone web application
// Synchronization target: keep version aligned across AGENTS.md, versions.md, README.md
// Cache version identifier
const CACHE_VERSION = 'v0.1.16';
const CACHE_NAME = `tcad-wokwi-cache-${CACHE_VERSION}`;




const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './doc/versions.md',
  './css/style.css',
  './js/app.js',
  './js/schema.js',
  './js/translator.js',
  './js/renderer.js',
  './js/ui.js'
];

// Install Event - Pre-cache core assets & skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event - Clean up stale caches & immediately claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('tcad-wokwi-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First strategy with Cache fallback
// Ensures localhost, development, and live previews always serve the freshest code
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // CRITICAL: Only intercept same-origin requests!
  // Never hijack external requests (CORS proxies, third-party APIs, CDNs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If response is valid, update the cache with fresh version
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache when network fails (offline mode)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html').then((html) => html || new Response('Offline', { status: 503 }));
          }
          return new Response('Offline resource unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});
