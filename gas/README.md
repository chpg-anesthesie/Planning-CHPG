# Code Google Apps Script — Planning-CHPG (carte du code)

⚠️ La **source vivante** du code GAS est l'**éditeur Apps Script** lié au Google Sheet de prod.
Ce dossier documente la structure ; il n'héberge pas (encore) le code complet.

## Les 4 fichiers de l'éditeur

| Fichier | Rôle |
|---------|------|
| `code.gs` | `generatePlanningFromGardes` (placement secteurs + 3a-bis bascule CI→RI le jeudi matin), overrides (lit `PLANNING_OVERRIDES`), `pushFileToGitHub` (token via `getGithubToken`/CONFIG), `onEdit`, `validerSemaine`, `savePlanningOverride`/`deletePlanningOverride`, `getJoursFeries` (report dim→lun généralisé), reconstruction 2026, `buildStats2026` |
| `indispos.gs` | API web app (`doGet`/`doPost`), `MEDECINS_LIST`, vacances/quotas (`getVacConfig`, `getVacValidation`, `getQuotasConges`), toutes les actions admin (initYear, setActiveYear, generateGardes, archiveYear, sendCodes…) |
| `generateur_gardes.gs` | Algorithme `generateGardes` : sélection MAR + rôles G/G2, équité (samedi/jeudi/VD), dette inter-annuelle via `STATS_GARDES_{N-1}` |
| `setup.gs` | `setupAnnee` (init INDISPOS/AFFECTATIONS N+1), `archiveYear` (push stats/indispos, suppression onglets commentée) |

## Faits clés (utiles pour les patches)
- `savePlanningOverride` écrit dans **PLANNING_OVERRIDES** (retouches comité, indexées par date).
- `setActiveYear` archive/vide **OVERRIDES** (onglet hérité, utilisé seulement par l'ancien `applyModification`) — **ne touche pas** PLANNING_OVERRIDES.
- `archiveYear` a sa propre `getGithubToken()` interne (pas de plantage), suppression d'onglets **commentée** (non destructif).
- `generateGardes(2026)` est **désactivé** côté API (2026 sanctuarisé).

## Synchroniser le code dans ce dossier
- **Recommandé (exact, 2 sens)** : `clasp` — `clasp clone <scriptId>` puis `clasp pull`/`push`.
- **Manuel** : coller le contenu exact de chaque fichier depuis l'éditeur.

Dernière revue de structure : 13/06/2026 (sources complètes fournies par Arthur, conservées dans l'historique de la session).
