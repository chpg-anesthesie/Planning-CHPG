# Roadmap — Planning CHPG Monaco

**Dernière mise à jour : juin 2026**

---

## ✅ Réalisé

### Architecture & Infrastructure
- Google Sheets backend + Apps Script API + GitHub Pages frontend
- Comptes dédiés : GitHub `chpg-anesthesie`, repo `Planning-CHPG`, GSheet `planningchpg@gmail.com`
- URL publique : https://chpg-anesthesie.github.io/Planning-CHPG/
- Auth sessionStorage partagée dashboard/admin/config
- Trigger `onEdit` → republication automatique

### Planning 2026
- Génération complète, publication GitHub Pages
- `GARDES_2026` figé et protégé
- Algorithme scoring + rééquilibrage + R + 18h
- Rythme DR TRAN 2/2 implémenté
- Jours fériés Monaco : 13 jours (Fête-Dieu + report Toussaint ajoutés)
- `isVacancesScolaires()` dynamique depuis `PERIODES_VAC`

### Interface
- `dashboard.html` — bannière intelligente état du cycle (via `getStatus`)
- `index.html` — vue semaine desktop, vue jour mobile swipe, vue Médecins
- `admin.html` — 6 onglets, accueil restructuré (actions quotidiennes + opérations annuelles)
- `config.html` — 4 onglets, champ DECT, wizards Départ/Accueil dans Maintenance
- `indispos.html` — saisie par drag

### Wizards (5 déployés)
- ✅ Étape 1 — Démarrer N+1 (initYear + AFFECTATIONS_N+1 auto)
- ✅ Étape 2 — Générer les gardes (étape indispos bloquante)
- ✅ Étape 3 — Clôturer l'année
- ✅ Wizard Départ d'un MAR (config.html)
- ✅ Wizard Accueillir un MAR (config.html)

### API Apps Script
- 25+ actions disponibles
- `getStatus` sans auth (bannière dashboard)
- `saveAffectationsMar`, `addMedecinToGroupe`, `sendCodesMar` (wizards)
- `getPlanningStatus` — vérifie stats JSON sur GitHub Pages (pas l'onglet GSheet)

---

## 🔜 Prochaines priorités

### P1 — Simulation complète 2027 (immédiat)
- [ ] Lancer wizard Étape 1 → créer INDISPOS_2027 + AFFECTATIONS_2027
- [ ] Saisir indispos test sur indispos.html
- [ ] Lancer wizard Étape 2 → générer GARDES_2027
- [ ] Vérifier rendu index.html (sélecteur 2027)
- [ ] Lancer wizard Étape 3 → clôturer 2026
- [ ] Valider l'enchaînement complet

### P2 — Corrections Apps Script (avant octobre 2026)
- [ ] Colonne DECT dans GSheet MEDECINS + `getMedecins`/`saveMedecin`
- [ ] `MEDECINS_LIST` hardcodée dans `initYear()` → lire depuis GSheet
- [ ] `DOCTORS_LIST` dans `setupAnnee()` → dynamique (mineur)
- [ ] Adapter étape 2 wizard Gardes au vrai format `getVacValidation`

### P3 — Calendrier opérationnel 2026
- [ ] 01/09/2026 — TRAN → ACTIF=N
- [ ] Octobre 2026 — DR ARMAND → ACTIF=O
- [ ] Octobre 2026 — Wizard Étape 1 réel (envoi codes MARs)
- [ ] Saisir emails MARs dans MEDECINS avant envoi codes

### P4 — Terrain / Décisionnel
- [ ] Règle MARs VOLANT en surplus — à confirmer avec comité
- [ ] Valider 6 points du doc `regles_planning_CHPG_2026.md`

### P13 — Documentation (ce document + guides)
- [x] `prompt_demarrage.md` ✅
- [x] `roadmap.md` ✅
- [x] `guide_comite.md` ✅
- [ ] Guide MAR (indispos.html)

### P14 — Optimisation performance
- [ ] Minification JSON (supprimer null, indent 2→0)
- [ ] Lazy loading onglets admin
- [ ] Dédoublonnage fonctions utilitaires (`isoWeek`, `todayStr`, `getJoursFeries` × 3)
- [ ] Suppression code mort
- [ ] Audit taille fichiers HTML (admin.html ~148kb)

---

## 📅 Calendrier

| Mois | Action |
|---|---|
| Juin 2026 | Simulation complète 2027, corrections Apps Script |
| Septembre 2026 | Désactiver TRAN, lancer `generateGardes()` sur vraies indispos |
| Octobre 2026 | Activer ARMAND, wizard Étape 1 réel, envoi codes |
| Décembre 2026 | Wizard Étape 3 → clôturer 2026 |
| Janvier 2027 | ANNEE_ACTIVE → 2027, supprimer onglets 2026 du GSheet |

---

## 🔮 Modules futurs (non planifiés)

- **Module Libéral** — saisie dates opératoires libérales dans indispos.html
- **Transition NCHPG 2027** — Bloc long / Bloc court / Bloc central
- **Guide MAR** — tutoriel indispos.html intégré
