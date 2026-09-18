const CACHE_NAME = 'athar-v1';
const ASSETS = [
    './',
    './pages/index.html',
    './pages/dashboard.html',
    './pages/offline.html',
    './src/css/reset.css',
    './src/css/variables.css',
    './src/css/typography.css',
    './src/css/glass.css',
    './src/css/components.css',
    './src/css/layout.css',
    './src/css/utilities.css',
    './src/css/animations.css',
    './src/js/neon.js',
    './src/js/auth.js',
    './src/js/db.js',
    './src/js/layout.js',
    './src/js/theme.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    // Strategy: Network First, Fallback to Cache
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
