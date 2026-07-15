# Code Google Apps Script — Planning-CHPG (carte du code)

⚠️ **Le dépôt fait foi à 100 %** : ce dossier contient le code GAS complet de prod.
Workflow : Claude pousse ici → Arthur recopie dans l'éditeur Apps Script → **nouvelle version de déploiement**.
Ne jamais modifier un `.gs` directement dans Apps Script sans le committer aussitôt : la modif serait écrasée à la prochaine recopie.

## Versionnage (détecteur de dérive, 15/07/2026)
Chaque fichier commence par une constante `GAS_VERSION_*` (format `AAAA-MM-JJ.n`), **à incrémenter à CHAQUE push** du fichier.
Le 🔍 Diagnostic (admin → onglet Maintenance) compare les versions déployées avec celles du dépôt et signale toute recopie oubliée (« DÉRIVE »).

## Sauvegarde automatique (15/07/2026)
`backupHebdo()` (code.gs) copie le classeur maître chaque lundi ~4 h dans le dossier Drive `Planning-CHPG-Backups` (rotation : 8 copies ≈ 2 mois).
Installation une seule fois : exécuter `installBackupTrigger()` dans l'éditeur. Le diagnostic vérifie la présence du déclencheur et la fraîcheur de la dernière copie.

## Les 5 fichiers de l'éditeur

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
