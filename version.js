/* ─────────────────────────────────────────────────────────────────────────
   SOURCE UNIQUE du numéro de version du site.

   (14/08/2026) Le numéro était recopié à la main dans 11 emplacements de
   5 fichiers. On s'est trompés : une note interne en annonçait 9. Un numéro
   qu'il faut recompter avant chaque publication finit par mentir.

   Désormais : il s'écrit ICI, une fois. Toute page qui veut l'afficher pose
   un élément portant l'attribut data-version — il se remplit tout seul.

   Deux chiffres, pas trois : le troisième ne disait rien à personne dans le
   service et donnait des « v1.34.10 » qui font perdre confiance plus qu'ils
   n'informent. On monte le 2e chiffre à chaque nouveauté visible, le 1er à
   une ouverture majeure.
   ───────────────────────────────────────────────────────────────────────── */
window.SITE_VERSION = 'v1.47';

(function () {
  function poser() {
    var els = document.querySelectorAll('[data-version]');
    for (var i = 0; i < els.length; i++) els[i].textContent = window.SITE_VERSION;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', poser);
  } else {
    poser();
  }
})();
