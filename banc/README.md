# Banc d'essai — Planning-CHPG

Exécute le **vrai code** (fichiers `.gs`, `cloudflare/worker.js`, `admin.html`)
dans un Google et un Cloudflare simulés. Sert à vérifier une modification
**avant** de la déployer, plutôt qu'en production.

## Lancer

```bash
cd banc && npm install jsdom
node banc.js          # statuts, placements, verrous          (19 vérifications)
node banc_worker.mjs  # le vrai Worker : journal + /read       (17)
node banc_miroir.js   # notes du miroir, éditions manuelles    (13)
node e2e.js           # la vraie page admin, clics simulés     (19)
```

Chaque script sort en erreur si une vérification échoue.

## Ce qui est simulé

| Simulé | Réel |
|---|---|
| Feuilles Google (tableaux en mémoire) | les fonctions d'écriture des `.gs` |
| KV Cloudflare (une Map) | `cloudflare/worker.js`, exécuté |
| Transport GAS ↔ Cloudflare dans `e2e.js` | le Worker, dans `banc_worker.mjs` |
| Navigateur (jsdom) | `admin.html`, chargée et cliquée |

## Ce que le banc prouve — et ce qu'il ne prouve pas

**Prouve** : l'ordre des opérations, l'idempotence (un rejeu ne duplique
jamais), l'isolation des échecs, le ciblage des lignes par (date, MAR),
la séparation des verrous, l'absence d'appel Apps Script sur les gestes
du comité.

**Ne prouve pas** : les autorisations Google, les quotas, la latence réelle,
le comportement des déclencheurs installables. Ces points-là ne se vérifient
qu'en production, avec le diagnostic de Maintenance.

## Défauts trouvés par ce banc (05/08/2026)

- Verrous imbriqués : l'applicateur du journal prenait le verrou de script,
  que réclament ensuite les fonctions d'écriture → 15 s d'attente par
  écriture. Corrigé (verrou de document).
- Deux faux positifs dans les tests eux-mêmes (mauvais nom de paramètre,
  code d'accès non injecté) : la page retombait silencieusement sur le
  circuit Apps Script sans que rien ne le signale.
