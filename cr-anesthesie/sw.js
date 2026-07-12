// Service worker CR d'anesthésie — stratégie RÉSEAU D'ABORD.
// En ligne : on sert toujours la dernière version (et on rafraîchit le cache).
// Hors ligne : on bascule sur le cache. Aucune version périmée servie tant qu'il y a du réseau.
const CACHE = 'cr-anesthesie-v5';
const ASSETS = [
  './', './index.html', './style.css',
  './data.js', './rules.js', './ui.js', './report.js', './app.js',
  './logo-chpg.png', './laryngoscope.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
