/**
 * IGNIS Service Worker
 * Enables offline support and caching for better performance
 */

const CACHE_NAME = 'ignis-v1';
const STATIC_CACHE = 'ignis-static-v1';
const DYNAMIC_CACHE = 'ignis-dynamic-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/app/swap',
  '/manifest.json',
  '/ignis-icon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls and external requests - always go to network
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('api.') ||
    url.hostname.includes('thegraph.com') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('defillama.com') ||
    url.hostname.includes('basescan.org') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // For app routes, use network-first then cache
  if (url.pathname.startsWith('/app')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // For static assets (JS, CSS, images), use cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first strategy
 * Best for static assets that don't change often
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first strategy
 * Best for dynamic content that should be fresh
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return the cached index for app routes
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
