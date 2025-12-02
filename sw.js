const CACHE_NAME = 'melody-cache-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './assets/css/style.css',
    './assets/js/player.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
];

// Install Service Worker and cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

// Activate SW and clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }))
        )
    );
});

// Fetch - serve cached assets when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(res => res || fetch(event.request))
            .catch(() => {
                if (event.request.mode === 'navigate') return caches.match('./index.html');
            })
    );
});
