# Banc d'essai — Planning-CHPG

Exécute le **vrai code** (fichiers `.gs`, `cloudflare/worker.js`, `admin.html`)
dans un Google et un Cloudflare simulés. Sert à vérifier une modification
**avant** de la déployer, plutôt qu'en production.

## Lancer

```bash
cd banc && ./lancer.sh        # tout, d'un coup — 95 vérifications
```

ou script par script :

```bash
node banc.js             # statuts, placements, verrous            (19)
node banc_worker.mjs     # le vrai Worker : journal + /read         (17)
node banc_miroir.js      # notes du miroir, éditions manuelles      (13)
node banc_resilience.js  # rafales, crash, panne, concurrence       (16)
node banc_page.js        # la page face aux pannes                  (11)
node e2e.js              # circuit d'écriture de bout en bout        (19)
node interface.js        # L'INTERFACE RÉELLE, pilotée au clic       (18)
```

`interface.js` est le test le plus proche du terrain : il monte un service
fictif complet (`monde.js` : 23 MAR, secteurs, affectations, gardes de
l'année), fait produire le planning par **le vrai générateur** du dépôt, sert
ces données par **le vrai Worker**, charge `admin.html` **telle quelle**, puis
saisit le code, clique le bouton « Accéder », clique une case à pourvoir,
choisit un MAR dans le panneau, publie, « ferme la page », laisse le serveur
appliquer, et vérifie enfin que le classeur ET le planning régénéré
contiennent le placement.

`jeu_donnees.js` fabrique un service **fictif** à l'échelle réelle (23 MAR,
120 jours, 40 placements de départ). Le dépôt est public : **aucune donnée du
classeur ne doit y figurer**, jamais.

Chaque script sort en erreur si une vérification échoue.

## Ce qui est simulé

| Simulé | Réel |
|---|---|
| Feuilles Google (tableaux en mémoire) | les fonctions d'écriture des `.gs` |
| KV Cloudflare (une Map) | `cloudflare/worker.js`, exécuté |
| Transport GAS ↔ Cloudflare dans `e2e.js` | le Worker, dans `banc_worker.mjs` |
| Navigateur (jsdom) | `admin.html`, chargée et cliquée |
| Données du service (`monde.js`, fictives) | `code.gs` + `generateur_gardes.gs`, qui produisent le planning |

## Ce que le banc prouve — et ce qu'il ne prouve pas

**Prouve** : l'ordre des opérations, l'idempotence (un rejeu ne duplique
jamais), l'isolation des échecs, le ciblage des lignes par (date, MAR),
la séparation des verrous, l'absence d'appel Apps Script sur les gestes
du comité.

**Ne prouve pas** : les autorisations Google, les quotas, la latence réelle,
le comportement des déclencheurs installables. Ces points-là ne se vérifient
qu'en production, avec le diagnostic de Maintenance.

## Incidents rejoués (chacun a été observé en production)

| Scénario | Ce qui doit se produire |
|---|---|
| Cloudflare injoignable | la page bascule sur Apps Script, le placement passe |
| Google ET Cloudflare tombés | le travail reste en attente + est écrit sur le poste |
| Panne entre application et purge | rejeu au passage suivant, **sans doublon** |
| Publication refusée | le lot revient en attente, badge rouge |
| Deux membres du comité sur la même case | une seule ligne, le dernier déposé gagne |
| 200 fiches en attente | toutes traitées, miroir noté une seule fois par année |
| Statut posé un jour de garde | refusé (échange ou don obligatoire) |
| MAR inconnu, statut invalide, date hors planning | refusés proprement, file non bloquée |

## Défauts trouvés par ce banc (05/08/2026)

- Verrous imbriqués : l'applicateur du journal prenait le verrou de script,
  que réclament ensuite les fonctions d'écriture → 15 s d'attente par
  écriture. Corrigé (verrou de document).
- Deux faux positifs dans les tests eux-mêmes (mauvais nom de paramètre,
  code d'accès non injecté) : la page retombait silencieusement sur le
  circuit Apps Script sans que rien ne le signale.
