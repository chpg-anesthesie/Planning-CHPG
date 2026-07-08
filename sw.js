/*!
 * sw.js — Service worker du Portail CHPG Monaco (Planning-CHPG).
 * Stratégies :
 *   • HTML (navigation)          → réseau d'abord, cache en secours (offline gracieux).
 *   • Assets same-origin (js/css/img) → stale-while-revalidate (rapide + auto-MAJ).
 *   • Polices Google (gstatic)   → cache d'abord (woff2 immuables).
 *   • API Google Apps Script     → jamais cachée (données fraîches). POST non interceptés.
 * Pour forcer un renouvellement complet du cache : incrémenter VERSION.
 */
var VERSION = 'chpg-sw-v1';
var HTML_CACHE  = VERSION + '-html';
var ASSET_CACHE = VERSION + '-assets';
var FONT_CACHE  = VERSION + '-fonts';

// Shell précaché (fallback offline minimal). Résilient : un échec unitaire n'annule pas le reste.
var PRECACHE = [
  './dashboard.html',
  './assets/vendor/lucide-icons.js',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png'
];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil((async function () {
    var c = await caches.open(ASSET_CACHE);
    await Promise.all(PRECACHE.map(function (u) {
      return fetch(u, { cache: 'no-cache' })
        .then(function (r) { if (r && r.ok) return c.put(u, r); })
        .catch(function () {});
    }));
  })());
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) {
      if (k.indexOf(VERSION) !== 0) return caches.delete(k);
    }));
    await self.clients.claim();
  })());
});

function isFontHost(h) {
  return h.indexOf('fonts.googleapis.com') > -1 || h.indexOf('fonts.gstatic.com') > -1;
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                 // POST vers l'API → réseau direct
  var url;
  try { url = new URL(req.url); } catch (_) { return; }

  // API Apps Script : jamais de cache (planning/gardes toujours frais).
  if (url.hostname.indexOf('script.google') > -1) return;

  // Navigation / HTML same-origin : réseau d'abord.
  var accept = req.headers.get('accept') || '';
  var isHTML = req.mode === 'navigate' || accept.indexOf('text/html') > -1;
  if (isHTML && url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
    return;
  }

  // Polices Google : cache d'abord.
  if (isFontHost(url.hostname)) {
    e.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  // Assets same-origin : stale-while-revalidate.
  if (url.origin === self.location.origin) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  // Autre cross-origin : réseau (non intercepté).
});

async function networkFirst(req) {
  try {
    var res = await fetch(req);
    if (res && res.ok) {
      var c = await caches.open(HTML_CACHE);
      c.put(req, res.clone());
    }
    return res;
  } catch (e) {
    var cached = await caches.match(req);
    if (cached) return cached;
    var fb = await caches.match('./dashboard.html');
    if (fb) return fb;
    return new Response('Hors ligne — reconnectez-vous pour charger la page.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(req, cacheName) {
  var cached = await caches.match(req);
  if (cached) return cached;
  try {
    var res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) {
      var c = await caches.open(cacheName);
      c.put(req, res.clone());
    }
    return res;
  } catch (e) {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(req) {
  var cached = await caches.match(req);
  var network = fetch(req).then(function (res) {
    if (res && res.ok) {
      caches.open(ASSET_CACHE).then(function (c) { c.put(req, res.clone()); });
    }
    return res;
  }).catch(function () { return cached; });
  return cached || network;
}
