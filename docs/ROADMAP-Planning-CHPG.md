# Roadmap — Planning-CHPG

Système web : **planning des gardes** (équité annuelle) + **planning quotidien** + **consultations** + **portail/Dashboard** + **veille biblio** + **CR d'anesthésie**, pour ~23 MARs au CHPG (Monaco).
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`. *Mise à jour : 17 juillet 2026.*

> Le dépôt en ligne fait foi. Cette roadmap est un repère de pilotage, pas la source de vérité du code.

---

## ✅ Fait

### Fondations & algorithme de gardes (mai–juin 2026)
- Architecture Google Sheets → fichiers GAS (`code.gs`, `generateur_gardes.gs`, `Indispos.gs`, `setup_annee.gs`, `portail.gs`) → sortie web ; cycle annuel simulé et validé.
- Règles d'équité (VD > Samedi > Jeudi > Total), cibles proportionnelles à la quotité.
- Banc d'essai de l'algo ; correctifs équité/dette ; invariants confirmés ; génération ~10-15 s.
- Statuts spéciaux externalisés (colonnes MEDECINS), priorité vacances Monaco (groupes A/B/C, seuils).
- Consultations (comptage d'équité, refonte visuelle), rotation libérale endo (déficit-based, contrainte N+1).
- Nettoyage config-driven : getJoursFeries consolidé, MEDECINS_LIST supprimé, tokens unifiés, fériés grisés.
- Documents : guide admin, règles de génération, simulation démographique (charge jusqu'en 2060).

### Session juillet 2026 — algo & infra
- **Fix A** : rythme 2 sem./2 robuste aux années à 53 semaines.
- **Fenêtre de transparence dette** (frontend, dès 2028).
- **Historique Noël/An** : `getNoelHistory()` (HISTORIQUE ∪ GARDES présents) + archivage **au réel**.
- **Consolidation secteurs étape 1** : source unique `SECTEURS_CFG` **dans admin.html** (index.html non encore consolidé — voir Secteurs étape 2).
- **Résilience** publication + archivage (échecs remontés à l'écran).
- **Migration des JSON vers le Drive** (dossier `Planning-CHPG-JSON`) : `planning_{Y}.json` / `affectations_{Y}.json` servis depuis le Drive ; archives `stats_{Y}.json` toujours poussées sur GitHub à la clôture.
- **Onglet Maintenance** (admin.html) : diagnostic `diagComplet` réécrit (audite Sheet + GitHub + Drive, cohérence JSON↔GARDES, environnement, intégrité gardes/équipe) + renvoi des codes multi-sélection.
- **Sélecteur d'année** refait en pilule à badges.
- Wizard 1 & Wizard 3 **testés en réel**.
- Documents de présentation staff (04/09) : algorithme, guide MAR, manuel du comité.

### Planning quotidien (juillet 2026)
- Placement **additif** des consultations (le MAR reste dans son secteur bloc ; bouton « ＋ aussi »).
- Split correct des valeurs multi-tokens (« SECTEUR+CS-X »).
- Indépendance matin/après-midi des overrides ; `LockService` + déduplication anti-doublons sur `PLANNING_OVERRIDES`.
- Marqueur violet « LIB » (consult libérale endo) cliquable pour affectation manuelle.
- Bouton « Aujourd'hui » ; export Excel enrichi (staff du vendredi, séparateurs de jours).
- Diagnostic `_findPhantomGardes_` ; purge des vieux overrides pendant la clôture W3.

### Portail / Dashboard (juillet 2026)
- **9 tuiles** live : Planning, Mes congés, Topos/biblio, Protocoles, Staffs à venir, Veille biblio, Annuaire, **CR d'anesthésie**, **CRH** (cette dernière restreinte à un MAR via `only:`).
- Panneau perso « Mes gardes » (hero).
- **CR d'anesthésie** intégré dans `/cr-anesthesie/` (service worker, autosave, presets de gestes, antibioprophylaxie SFAR/SPILF 2024).

### Veille bibliographique (juillet 2026)
- Scan PubMed hebdomadaire (lundi) piloté 100 % depuis l'onglet `VEILLE_CFG` (voir `docs/VEILLE_CFG-mode-emploi.md`).
- Tri « best match » + badge type de publication (`PUBTYPE`).
- Tagging **par thème** (colonne `THEMES`), sélecteur de thème + filtrage dans le Dashboard.
- Normalisation des dates ISO au read time.

### Documentation (docs/)
- Guides : `guide-mar.html`, `guide-comite.html`, `guide-algo-gardes.html`, `guide-liberal.html`, `guide-technique.html`.
- Présentations staff, démographie.
- Conception module libéral + antisèche cotation (voir ci-dessous).

---

## 🔜 À faire

### Axes de développement (un fil de conversation chacun)

- [ ] 🔬 **Module libéral (règle des 30 % par axe)** — le plus gros morceau. Voir `docs/module-liberal/module_liberal_conception.md`.
  - Conception figée : seuil **30 % par axe** (CCAM technique **et** NGAP consultations, indépendants), objectif = optimiser le pot commun mutualisé, affichage seul côté comité.
  - Assets déjà dans le repo : conception, antisèche cotation CCAM/NGAP, `ccam_actes.json`, `maquette_estimateur_liberal.html`, memo docx, guide.
  - **Calendrier acté : rien en prod avant le go-live d'octobre 2026 et avant le Lot 0 (secteurs étape 2).**
  - Ordre des lots : **0 → 1 → 2 → 4**, Lot 3 parallélisable après Lot 1.

- [ ] 🖥️ **Dashboard / portail**
  - **Tuile Module libéral** (guide + estimateur), réservée aux membres du groupement (colonne `LIBERAL O/N`, même mécanisme `only:` que CRH). L'estimateur/guide peuvent sortir avant le volet pilotage.
  - **CRH** : aujourd'hui codée en dur pour un seul MAR (`only:'FROHLICH'`) — décider si on la garde mono-utilisateur ou on l'ouvre (construction dans une conversation dédiée, entraînement sur CRH réels).
  - Nouvelles tuiles de contenu : à cadrer au besoin.

- [ ] 📚 **Veille bibliographique** — enrichissements (option `ENRICH` IA quand clé API dispo).

### Finitions & maintenance
- [ ] Picker **manuel** des consult libérales endo : filtrer/avertir sur la présence N+1 (aujourd'hui seule la rotation auto le fait).
- [ ] Corriger un libellé hérité dans l'assistant Départ (« onglet Modifications de comite.html », page inexistante).
- [ ] Généraliser SW/icônes locales aux autres points d'entrée (index, admin…) pour que l'install profite partout.
- [ ] *(Sécurité, à l'appréciation d'Arthur)* rotation du token GitHub.

### Pour 2027 (déménagement) — **prérequis du module libéral**
- [ ] **Secteurs étape 2 (Lot 0)** : externaliser les définitions de secteurs dans un onglet Google Sheet `SECTEURS`, pour redéfinir les secteurs **sans toucher au code** (crucial avant le déménagement, BLOC CENTRAL) **et** poser la colonne `RENDEMENT_LIB` (FORT / MOYEN / NUL / REA) dont dépend le pilotage libéral.
  - État réel : **deux sources en dur, non consolidées entre elles** — `SECTEURS_CFG` dans admin.html (9 secteurs, champs code/label/court/aff/icon/bg/fg/cs/actif) **et** `SECTORS_DEF` + `_SECTOR_BASE` dans index.html (liste + couleurs séparées). Elles ont déjà divergé (ex. icône `RI` = `Zap` dans admin, `Scan` dans index). L'externalisation doit alimenter **les deux pages** depuis une source unique.

---

## 🚫 Écarté (ne pas reproposer)
- `config.html` (couvert par les onglets d'admin.html).
- Optimisation perf du JSON (déjà minifié + gzip).
