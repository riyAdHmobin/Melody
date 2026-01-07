const CACHE_NAME = 'melody-v1';
const urlsToCache = [
    '/Melody/',
    '/Melody/index.html',
    '/Melody/assets/css/style.css',
    '/Melody/assets/js/script.js',
    '/Melody/assets/js/music-data.js',
    '/Melody/favicon.svg'
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
