/* ─────────────────────────────────────────────────────────────────────────
   SOURCE UNIQUE du numéro de version du site.

   (14/08/2026) Le numéro était recopié à la main dans 11 emplacements de
   5 fichiers. On s'est trompés : une note interne en annonçait 9. Un numéro
   qu'il faut recompter avant chaque publication finit par mentir.

   Désormais : il s'écrit ICI, une fois. Toute page qui veut l'afficher pose
   un élément portant l'attribut data-version — il se remplit tout seul.

   Deux chiffres, pas trois : le troisième ne disait rien à personne dans le
   service et donnait des « v1.34.10 » qui font perdre confiance plus qu'ils
   n'informent.

   (01/09/2026) PASSAGE DE v1.99 À v10.0. La série des v1.x arrivait au bout
   de sa numérotation : la suite aurait été « v1.100 », qui se lit mal. On
   repart donc à 10, et on avance de dixième en dixième — v10.0, v10.1, v10.2.
   Le 1er chiffre reste RÉSERVÉ à ce que l'équipe voit changer pour de bon,
   pas à ce qui change sous le capot : l'ouverture du module libéral en sera
   une, la refonte du portail aussi. Ce lot-ci change beaucoup de choses, mais
   chacune à sa place dans un écran existant — il monte donc le 2e chiffre.
   ───────────────────────────────────────────────────────────────────────── */
window.SITE_VERSION = 'v10.8.1';

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
