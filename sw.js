const CACHE_NAME = 'machere-v2';
const BASE = '/Barcelona';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/PORTADAINICIO.jpg',
  BASE + '/galeria1.png',
  BASE + '/galeria2.png',
  BASE + '/galeria3.png',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (!res.ok && (res.status === 404 || res.status >= 500)) {
            return caches.match(BASE + '/index.html');
          }
          return res;
        })
        .catch(() => caches.match(BASE + '/index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        });
      })
    );
  }
});
