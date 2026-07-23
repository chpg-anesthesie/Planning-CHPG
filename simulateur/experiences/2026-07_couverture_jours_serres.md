# Couverture des jours serrés — TERMINÉ (23/07/2026)

**Objectif d'Arthur : il ne doit JAMAIS y avoir de jour sans binôme.**
Sans réduire le nombre de MAR en vacances, sans autoriser deux gardes d'affilée
(illégal), sans dégrader l'équité.

✅ **LIVRÉ EN PRODUCTION** le 23/07/2026 — `gas/generateur_gardes.gs`,
`GAS_VERSION_GENERATEUR = '2026-07-23.1'`. Le fichier d'expérimentation
`generateur_couverture_v1.gs.txt` a été supprimé : le dépôt fait foi.

---

## Le problème (rappel)

Le placement chronologique est glouton : chaque jour il choisit le meilleur binôme
selon l'équité, et épuise ainsi le vivier du lendemain. Sur la semaine de Noël,
il ne reste plus personne.

La feuille réelle 2026 le confirme : le **27/12/2026, 17 MAR sur 20 étaient
indisponibles**. Le comité s'en est sorti en faisant **alterner deux binômes**.
C'est ce que l'algorithme ne savait pas faire seul.

Contrainte mathématique : pour couvrir N jours consécutifs avec des binômes de 2
sans gardes consécutives, il faut **au moins 4 personnes disponibles**.

---

## Les sept mécanismes livrés

Tous **strictement additifs** : ils ne s'exécutent que là où le code échouait.

1. **Passe « jours critiques » (section 7ter)** — après la rotation de Noël (7bis),
   avant les souhaits (8a). Repère les jours de vivier ≤ 4, les regroupe en séries
   consécutives, résout par backtracking. Ordre de préférence : les MAR les moins
   souvent disponibles dans l'année d'abord. Périmètre : jours SIMPLES uniquement.
   Dernier recours : tolère le combo jeudi↔samedi.
2. **Anticipation d'un jour** dans le placement chronologique : ne pas retenir un
   binôme s'il ne resterait pas ≥ 2 personnes disponibles demain.
3. **Repli VD sur la rotation de Noël (7bis)** : place la date SEULE quand aucun
   binôme ne peut tenir l'unité complète.
4. **Garde-fou dimanche déjà pourvu** — CORRECTION DE BUG. Quand la rotation pose
   un 25/12 dimanche seul en repli, le placement du vendredi refaisait
   `assign(dimDate)` sans vérifier : il ÉCRASAIT l'attribution de Noël et faussait
   les compteurs, silencieusement. Condition ajoutée : `dimExists && !gardes[dimDate]`.
5. **Anticipation du samedi dans le bloc VD** : le binôme vendredi-dimanche est
   bloqué aussi le samedi. Le bloc VD sortait de la fonction (`return`) avant
   l'anticipation du point 2. `A`/`B` passent en `let`.
6. **Rotation de Noël sensible au voisinage** : prend, DANS L'ORDRE DE LA ROTATION,
   la première paire qui laisse ≥ 2 disponibles sur chaque jour voisin non pourvu
   (helpers `bloqueraitSur`, `preserveVoisins`, `choisirPaire`, déclarés APRÈS
   `shiftD` dans le bloc 7bis). Si aucune paire ne convient : choix historique.
7. **Anticipation étendue au samedi pour un jeudi** : placer un jeudi bloque aussi
   le samedi via le combo. Vérification CONJOINTE lendemain + samedi.

**Modification annexe** : `blocked(id, date, _relaxJS)` — 3ᵉ paramètre optionnel
tolérant le combo jeudi↔samedi. Seule la passe 7ter le passe.

---

## Résultats mesurés — 7 tirages × 20 ans = 140 années de planning

| sel | trous RÉF | trous LIVRÉ | autres erreurs RÉF → LIVRÉ | écart max RÉF → LIVRÉ |
|---|---|---|---|---|
| 0 | 3 | **0** | 8 → 7 | 2,30 → 2,50 |
| 1 | 1 | **0** | 3 → 2 | 2,30 → 2,30 |
| 2 | 1 | **0** | 5 → 5 | 1,70 → 1,70 |
| 3 | 2 | **0** | 6 → 7 | 2,20 → 2,30 |
| 4 | 2 | **0** | 5 → 5 | 2,20 → **2,10** |
| 5 | 0 | **0** | 6 → 7 | 2,10 → 2,20 |
| 6 | 0 | **0** | 5 → 6 | 2,30 → 2,30 |
| **total** | **9** | **0** | 38 → 39 | — |

Trous fermés : 2037-12-25 (ven), 2037-12-26 (sam), 2038-12-23, 2039-04-09,
2039-12-29, 2040-02-18 (sam), 2041-12-28 — et 2039-12-25 (dim), le cas visé.

**Composition des « autres erreurs »** (cumul 7 tirages) :

| type | RÉF | LIVRÉ |
|---|---|---|
| couplage samedi→lundi rompu | 21 | **16** |
| couplage jeudi→samedi rompu | 4 | 4 |
| unité vendredi-dimanche rompue | 13 | 17 |
| combo jeudi↔samedi | 0 | 2 |
| **gardes consécutives** | **0** | **0** |

Les 4 unités VD rompues en plus sont le prix direct de la correction : 25/12
dimanche placé seul + vendredi placé seul = deux jours couverts au lieu d'un trou.
En regard, 5 couplages samedi→lundi sont sauvés.

**Autres validations** :
- batterie `simulateur/scenarios.js` (11 scénarios) : **sortie complète strictement
  identique** à la référence, au caractère près
- déterminisme : 3 exécutions rigoureusement identiques ✅
- performance : 709,9 s contre 706,6 s sur les 140 années, soit **+0,5 %**
- `node --check` OK, ancres uniques vérifiées, portée de `shiftD` contrôlée

⚠️ **Mesure d'équivalence** : la métrique « années identiques » donne 0 à 4 sur 20
selon le tirage, PAS les 12/20 annoncés dans la version précédente de cette note.
Ce n'est pas comparable : dès qu'une année diffère, le report de dette fait diverger
toutes les suivantes en cascade. Vérifié : la v1 seule donne le même 4/20. La preuve
de non-régression est la batterie des 11 scénarios, identique au bit près.

⚠️ **Tout ceci est prouvé par simulation.** Seule la génération réelle d'une année
dans le classeur le confirmera.

---

## Documentation mise à jour (23/07/2026)

- `docs/guide-algo-gardes.html` § 14 : « Éprouvé sur 140 années simulées » ;
  § 04 protections : nuance sur le combo jeudi↔samedi en ultime recours
- `docs/Presentation-gardes-staff.html` : slide « La preuve » réécrite sur
  140 années ; carte « Zéro journée sans binôme » dans les garanties

---

## Pièges rencontrés (ne pas les refaire)

- **Portée** : `shiftD` est déclaré en `const` DANS le bloc 7bis. Les helpers de
  la rotation doivent être déclarés APRÈS lui, dans le même bloc.
- **Colonnes MEDECINS** : `pct[id]=medData[r][5]` (% GARDES) et
  `quot[id]=medData[r][4]` (quotité). Ne pas les inverser.
- **Le rythme 2/2 est géré NATIVEMENT** par `estSemaineOff()` (l. 35), ancré sur le
  lundi 01/06/2026. Ne jamais poser de jours `TP` par-dessus.
- **L'espacement à 5 jours n'est PAS une règle dure** : c'est `spacingPenalty`.
  Blocages durs : `rgSet`, `rSet`, `gSet`, combo jeudi-samedi.
- **Deux gardes d'affilée : INTERDIT, c'est illégal.** Jamais proposé, jamais mesuré.
- **Plafonner les vacances de Noël : REFUSÉ.**
- **Un `return` masque une protection** : le bloc VD sortait avant l'anticipation
  du point 2 — d'où le point 5. Lire le chemin réel, pas un chemin analogue.
- **Écraser une case déjà écrite** : `assign()` ne vérifie pas si le jour est déjà
  pourvu. Toujours tester `!gardes[date]` avant de (ré)assigner.
- **Outillage** : `pkill -f "motif"` tue le shell appelant si sa ligne de commande
  contient le motif (elle le contient si le script est écrit par heredoc). Utiliser
  `pkill -x node`. Et `worker.js` fait `process.chdir()` : résoudre les chemins de
  sortie en absolu AVANT le chdir.
