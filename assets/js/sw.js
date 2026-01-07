const CACHE_NAME = 'melody-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/js/script.js',
    '/assets/js/music-data.js',
    '/favicon.svg'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
