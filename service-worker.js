const CACHE_NAME = 'v1::installments-manager';
// The import map makes precaching CDN resources tricky. We will cache them on the fly.
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/index.tsx', // This is the main script module
    '/assets/logo.svg' // The new logo
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // For HTML navigation requests, use a network-first strategy.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/'); // Return the cached root page on network failure.
            })
        );
        return;
    }

    // For other requests (CSS, JS, images), use a cache-first strategy.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((response) => {
                // Return response from cache if found.
                if (response) {
                    return response;
                }

                // If not in cache, fetch from the network.
                return fetch(event.request).then((networkResponse) => {
                    // Check if we received a valid response.
                    // This will cache CDN resources on first load.
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        cache.put(event.request, responseToCache);
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('Fetch failed:', error);
                    // The request will fail, which is the expected behavior when offline and not cached.
                });
            });
        })
    );
});