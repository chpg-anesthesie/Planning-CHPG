# Prompt de démarrage — Planning CHPG Monaco

**Version 5 — Juin 2026 — À coller en début de nouvelle conversation**

---

## Contexte projet

Application web de gestion des gardes anesthésistes-réanimateurs du CHPG Monaco.

- **URL publique** : https://chpg-anesthesie.github.io/Planning-CHPG/
- **API Apps Script** : https://script.google.com/macros/s/AKfycbwSiK_GlpSgw3YNQiecG9-24U2vnzFfCmFXV-6yLbPbjRL1DtGhpfvRsxMjemho0Is/exec
- **GitHub repo** : `chpg-anesthesie/Planning-CHPG`
- **Token GitHub** : `ghp_******************************* (voir CONFIG GSheet)`
- **GSheet** : `planningchpg@gmail.com`
- **Auteur** : DR FROHLICH (AFR), anesthésiste-réanimateur CHPG Monaco

---

## Fichiers du projet

### HTML (GitHub Pages)

| Fichier | Rôle | Auth |
|---|---|---|
| `dashboard.html` | Point d'entrée comité — bannière intelligente état du cycle, 3 cards | Code admin |
| `index.html` | Planning public — vue semaine desktop + vue jour mobile + vue Médecins | Public |
| `admin.html` | Dashboard admin — Accueil, Affectations, Équité, Indispos, Vacances, Diagnostic | Code admin |
| `config.html` | Configuration — Équipe, Vacances, Paramètres, Maintenance + wizards Départ/Accueil | Code admin |
| `indispos.html` | Saisie indispos MARs | Code individuel |

### Apps Script (4 fichiers)

| Fichier | Rôle |
|---|---|
| `code.gs` | `applyRules()`, `generatePlanningFromGardes()`, `generatePlanning()`, push GitHub |
| `indispos.gs` | `doGet()` API web — toutes les actions admin/config/indispos |
| `generateur_gardes.gs` | `generateGardes()` — algorithme scoring + rééquilibrage + R + 18h |
| `setup_annee.gs` | `setupAnnee()`, `archiveYear()` |

### JSON (GitHub Pages)

- `planning_2026.json` — figé (~1.3Mo)
- `affectations_2026.json` — affectations sectorielles 2026
- `planning_2027.json` — vide (gardes 2027 non encore générées)

---

## Architecture

- **Frontend** : HTML/CSS/JS vanilla — ExcelJS pour export (admin uniquement)
- **Backend** : Google Apps Script `doGet()` — une seule URL API
- **Stockage** : Google Sheets (source de vérité) + GitHub Pages (JSON publié)
- **Auth** : sessionStorage partagée dashboard/admin/config — codes individuels pour indispos
- **Trigger** : `onEdit` sur `AFFECTATIONS_YYYY`, `OVERRIDES`, `GARDES_YYYY` → republication auto

---

## État actuel (juin 2026)

### ✅ Opérationnel

- Planning 2026 complet, publié, `GARDES_2026` protégé
- `dashboard.html` — bannière intelligente basée sur `getStatus` (état réel du cycle)
- **5 wizards déployés** :
  - Wizard 1 — Démarrer N+1 (`admin.html`, Étape 1)
  - Wizard 2 — Générer les gardes (`admin.html`, Étape 2) — étape indispos bloquante
  - Wizard 3 — Clôturer l'année (`admin.html`, Étape 3)
  - Wizard 4 — Départ d'un MAR (`config.html` → Maintenance)
  - Wizard 5 — Accueillir un MAR (`config.html` → Maintenance)
- `initYear` crée `INDISPOS_N+1` ET `AFFECTATIONS_N+1` automatiquement
- `getStatus` sans auth — alimente bannière dashboard + widget État du cycle
- `getJoursFeries()` — Fête-Dieu + report Toussaint (patché dans 3 fichiers .gs)
- `isVacancesScolaires()` — dynamique depuis `PERIODES_VAC`
- Champ DECT dans modal MAR + tableau Équipe (config.html)
- Widget "État du cycle" en sidebar admin — données réelles

### ⚠️ Points d'attention

- DR TRAN → désactiver au 01/09/2026 (ACTIF=N dans GSheet MEDECINS)
- DR ARMAND (CA) → activer en octobre 2026
- Emails des MARs non encore saisis dans MEDECINS
- `DOCTORS_LIST` dans `setupAnnee()` encore hardcodée (mineur)

### 📋 TODO Apps Script

1. Colonne DECT — ajouter dans GSheet MEDECINS + `getMedecins`/`saveMedecin`
2. `MEDECINS_LIST` dans `initYear()` — utilise encore la constante hardcodée pour créer les lignes INDISPOS

### 📋 TODO Frontend

- P13 — Guide admin + Guide MAR (en cours)
- P14 — Optimisation perf (minification JSON, lazy loading, dédoublonnage)
- Adapter étape 2 wizard Gardes au vrai format de `getVacValidation`

---

## Onglets GSheet

- `CONFIG` — ANNEE_ACTIVE (2026), ADMIN_CODE, GITHUB_TOKEN
- `MEDECINS` — ID, NOM, INITIALES, ACTIF (O/N), QUOTITE, PCT_GARDES, CODE_ACCES, EMAIL
- `GARDES_2026` — figé, protégé
- `AFFECTATIONS_2026` — secteur par MAR par mois
- `AFFECTATIONS_2027` — créé par initYear, tout VOLANT
- `OVERRIDES` — modifications en cours
- `PERIODES_VAC` — périodes vacances scolaires zone B + seuils
- `GROUPES_VAC` — groupes A/B/C
- `CONFIG_TRANSITION` — garde dernier jour N → RG premier jour N+1
- `LOGS` — historique actions admin

---

## Règles importantes

**ACTIF dans MEDECINS** — lettre "O" (pas le chiffre 0)

**Année planning** — premier lundi de janvier au dimanche précédant le premier lundi de janvier N+1
- 2026 : 5 jan → 4 jan 2027
- 2027 : 4 jan → 3 jan 2028

**Rythme DR TRAN** — 2 semaines présente / 2 semaines absente, ancrage S23 2026 = présente
Départ définitif au 01/09/2026

**Jours fériés Monaco** — 13 calculés dynamiquement (dont Fête-Dieu et report Toussaint)

---

## Calendrier clé

| Date | Action |
|---|---|
| **01/09/2026** | Désactiver TRAN (ACTIF=N dans GSheet) |
| **Octobre 2026** | Lancer wizard Étape 1 → Démarrer 2027 |
| **Octobre 2026** | Activer DR ARMAND (CA) |
| **Sept 2026** | Lancer wizard Étape 2 → Générer gardes 2027 (après indispos reçues) |
| **Déc 2026** | Lancer wizard Étape 3 → Clôturer 2026 |

---

## Actions API disponibles (indispos.gs)

Sans auth : `getActiveYear`, `getStatus`

Avec auth admin : `login`, `getIndispos`, `saveIndispos`, `getAllIndispos`, `applyModification`, `getStats`, `generateGardes`, `getGardes`, `getVacConfig`, `setActiveYear`, `initYear`, `publishPlanning`, `getVacValidation`, `getOverrides`, `deleteOverride`, `getMedecins`, `saveMedecin`, `saveAffectationsMar`, `addMedecinToGroupe`, `sendCodesMar`, `getAffectations`, `saveAffectations`, `getVacancesConfig`, `savePeriodes`, `saveGroupes`, `getConfig`, `saveConfig`, `getLogs`, `sendCodes`, `diagComplet`, `archiveYear`

---

## Instructions pour Claude

- Arthur a des connaissances limitées en code — patches précis avec find/replace
- Nouvelle conversation tous les ~50 échanges
- Toujours lire les fichiers depuis GitHub avant de les modifier
- Token GitHub dans les constantes des fichiers .gs et dans ce prompt
