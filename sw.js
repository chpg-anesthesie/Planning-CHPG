/*!
 * sw.js — NEUTRALISÉ (kill-switch).
 * Ce service worker se désenregistre lui-même, purge tous ses caches
 * et recharge les onglets ouverts pour revenir à un site sans SW.
 * (Le SW précédent cassait le chargement du planning ; on rétablit d'abord.)
 */
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    try { var keys = await caches.keys(); await Promise.all(keys.map(function (k) { return caches.delete(k); })); } catch (_) {}
    try { await self.registration.unregister(); } catch (_) {}
    try { var cs = await self.clients.matchAll({ type: 'window' }); cs.forEach(function (c) { try { c.navigate(c.url); } catch (_) {} }); } catch (_) {}
  })());
});
// Aucune interception de fetch : tout passe directement au réseau.
