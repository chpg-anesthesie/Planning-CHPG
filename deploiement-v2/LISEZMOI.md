# Dossier d'attente — PUSH 2 (la v2.0 du 5 septembre 2026)

Ces deux fichiers sont **FINIS, TESTÉS ET VALIDÉS** (banc complet au vert le 14/08/2026,
les deux états du dépôt vérifiés). Ils attendent ici parce que `sw.js` est GELÉ jusqu'au
staff du 4/09 : le remplacer avant fragiliserait la démonstration des notifications.
Ils ne sont PAS servis tant qu'ils restent dans ce dossier.

## Contenu

- `sw.js` — la v4 : identique à la v3 servie, PLUS la pastille d'icône
  (`navigator.setAppBadge(d.pastille)` dans le gestionnaire push). Toute la chaîne amont
  (compteur GAS → miroir → Worker) est déjà en production depuis le 14/08 ; l'effacement
  (`clearAppBadge`) est déjà dans dashboard.html. Ce fichier est le DERNIER maillon.
- `banc_notif.mjs` — le banc aligné : attend `chpg-sw-v4` et vérifie la pose de la pastille.

## Le 5/09, sur « ok push 2 » d'Arthur — gestes mécaniques, dans l'ordre

1. Repartir du dépôt EN LIGNE (jamais d'une copie de session).
2. Copier `deploiement-v2/sw.js` → `sw.js` (racine) et
   `deploiement-v2/banc_notif.mjs` → `banc/banc_notif.mjs`.
3. Montée **v2.0** : chercher TOUS les marqueurs de version du site dans le dépôt
   (ne pas se fier à une liste écrite — les compter ; au 14/08 : 9 emplacements, 5 fichiers).
4. Lancer le banc complet (`cd banc && bash lancer.sh`) : tout au vert exigé.
5. Push atomique : sw.js + banc/banc_notif.mjs + les fichiers de version
   + **la suppression de ce dossier** (même commit) + ROADMAP/CONTEXTE (consigner l'ouverture).
6. Vérifier après push par les SHA git de l'arbre de `main`.
7. Arthur : exécuter `ouvrirEchanges()` (fichier `echanges` de l'éditeur Apps Script),
   supprimer la propriété `ECHANGES_PILOTES`, annoncer aux 23.

Aucun changement Worker, aucun changement GAS : tout le reste est en production depuis le 14/08.

## Si quelque chose a bougé d'ici là

Si `sw.js` racine n'est plus `chpg-sw-v3` ou si `banc/banc_notif.mjs` a changé entre-temps,
NE PAS écraser aveuglément : comparer, reporter la modification intercalée dans les fichiers
de ce dossier, relancer le banc, puis dérouler les gestes ci-dessus.
