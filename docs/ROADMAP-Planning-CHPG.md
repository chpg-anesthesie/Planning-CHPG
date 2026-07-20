# Roadmap — Planning-CHPG

Système web : **planning des gardes** (équité annuelle) + **planning quotidien** + **consultations** + **portail/Dashboard** + **veille biblio** + **CR d'anesthésie**, pour ~23 MARs au CHPG (Monaco).
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`. *Mise à jour : 20 juillet 2026.*

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

### Audit de robustesse — 5 axes (19–20 juillet 2026)
Après les audits déjà menés (simulation 20 ans de l'algo, failles de sécurité/confidentialité,
précision des années générées et des jours fériés), cinq nouveaux angles ont été éprouvés.
**Tout est testé en production** sauf mention contraire.

- **Axe 3 — Cycle de vie RH** (3 failles corrigées) :
  - **RH-1** `ensureMarRows()` — un MAR créé ou réactivé en cours d'année n'avait de ligne
    ni dans `INDISPOS_{Y}`, ni dans `GARDES_{Y}`, ni dans `AFFECTATIONS_{Y}` → saisie d'indispos
    en échec **silencieux**, don/échange/garde exceptionnelle en « médecin introuvable »,
    affectations ignorées. Les lignes manquantes sont désormais créées automatiquement
    (année active + suivantes), format recopié, idempotent.
  - **RH-2** `getAbsencesLongues` / `annulerAbsenceLongue` — aucun moyen d'annuler ou de
    raccourcir une absence longue ; le registre `ABSENCES_LONGUES` la **rejouait** sur les années
    futures même après effacement manuel. Liste + boutons Raccourcir / Annuler dans le modal CL ;
    seules les cases valant exactement `CL` sont touchées ; registre mis à jour ou purgé.
  - **RH-3** Dette d'équité — la part juste de N-1 était calculée au prorata de la **quotité
    plein temps**, ignorant les absences légitimes : un MAR absent 6 mois (maternité) ou arrivé
    en cours d'année apparaissait « en retard » et recevait des gardes **en plus** au retour
    (jusqu'à +1,2 garde/axe). La part juste est désormais pondérée par les **colonnes CIBLE de
    N-1** (déjà pro-ratées par la présence structurelle). Ajout de `CIBLE JF` au snapshot STATS.
    Vérifié par simulation : résultat **identique** à l'ancien quand tout le monde est présent
    toute l'année ; `Σ dette = 0` par axe conservé ; repli sur l'ancienne formule si les cibles
    manquent. *Premier effet réel : génération 2028.*
  - **Décision actée** : un arrivant reste **prioritaire n°1 pour Noël/An** dès sa première année
    (historique vide = « n'a pas encore donné »). Comportement conservé.

- **Axe 5 — Charge du lundi matin** : audité, **aucune modification**. Pic réaliste de 5–10
  exécutions simultanées pour une limite Google de 30 (marge ×3) ; quotas journaliers très loin
  d'être atteints. Seul cas limite identifié : 23 MARs ouvrant la page dans les mêmes secondes
  (staff) → quelques « erreur réseau », un re-clic suffit. Jugé acceptable.

- **Axe 2 — Concurrence** : **RH-C** verrou d'écriture global. Un seul verrou existait
  (`PLANNING_OVERRIDES`). Trois courses « lire-modifier-écrire » identifiées : écrasement
  silencieux d'une ligne d'indispos (MAR + comité simultanés), **duplication** d'une garde donnée
  traitée deux fois, suppression de la mauvaise ligne d'absence après décalage. Les **22 actions
  d'écriture** sont désormais sérialisées par `LockService` au point d'entrée (20 s d'attente,
  message clair au-delà) ; les lectures ne prennent jamais le verrou.

- **Axe 1 — Résilience aux pannes partielles** : déjà solide (moteur de wizard avec arrêt sur
  erreur, bouton Réessayer, étapes réussies non rejouées ; `initYear` refuse d'écraser et son
  existence est redétectée côté serveur ; `archiveYear` a sa garde d'idempotence depuis le 15/07 ;
  le W2 rattrapait déjà « GARDES existe déjà » côté frontend). Deux finitions livrées :
  **W2-R** — reprise du W2 par un chemin **normal** plutôt qu'une exception (si `GARDES_{Y}` et
  `STATS_GARDES_{Y}` existent et sont cohérents → `success` + stats + `alreadyDone`, le wizard
  enchaîne sur publication/récaps avec l'équité renseignée) ; et l'étape récapitulatifs **affiche
  les échecs d'envoi** (jusqu'ici masqués par un ✓ vert). *Testable réellement en novembre (W2).*

- **Axe 4 — Continuité / bus factor** : `docs/reprise.md` créé (propriété des ressources, accès,
  sauvegardes, premier jour d'une reprise en main) + rappel agenda de **sauvegarde trimestrielle**
  du classeur (1er oct/jan/avr/juil). Limite assumée et documentée : les copies vivent dans le
  Drive personnel d'Arthur — elles protègent de l'erreur de manipulation, pas de la perte du compte.

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
