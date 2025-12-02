// File: ./sw.js
const CACHE_NAME = 'melody-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/manifest.json',
    './assets/css/style.css',
    './assets/js/player.js',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
            .catch(err => console.error('SW install: failed to cache', err))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith((async () => {
        const cached = await caches.match(event.request);
        if (cached) {
            // update in background
            event.waitUntil((async () => {
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && networkResponse.status === 200) {
                        const cache = await caches.open(CACHE_NAME);
                        await cache.put(event.request, networkResponse.clone());
                    }
                } catch (e) { /* ignore */ }
            })());
            return cached;
        }

        try {
            const networkResponse = await fetch(event.request);
            const url = new URL(event.request.url);
            if (networkResponse && networkResponse.status === 200 &&
                (url.origin === location.origin || ASSETS_TO_CACHE.includes('./' + url.pathname.replace(/^\//, '')))) {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        } catch (err) {
            if (event.request.mode === 'navigate') {
                const fallback = await caches.match('./index.html');
                if (fallback) return fallback;
            }
            const any = await caches.match(event.request);
            if (any) return any;
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        }
    })());
});


// Registration snippet to put in File: ./index.html (replace existing registration)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.log('Service Worker failed:', err));
}
