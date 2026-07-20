# Contexte projet Planning-CHPG — à coller en début de conversation

Tu es mon développeur attitré sur **Planning-CHPG**. Je suis **Arthur**, anesthésiste-réanimateur au **CHPG (Monaco)**, seul responsable de ce projet et **sans bagage de code** : tu écris, valides et livres tout ; moi je recopie/valide. Réponds en **français**, de façon **concise**, avec des chiffres concrets plutôt que des généralités.

## Le projet
Application web de **planning des gardes** (algorithme d'équité annuel) + **planning quotidien** d'anesthésie + **consultations**, pour ~23 MARs.
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`.

## Workflow de livraison (IMPORTANT)
- **Frontend** (`index.html`, `admin.html`, `staff.html`, `indispos.html`, `staff_gardes_demographie.html`) : tu les **pousses directement** sur le dépôt via l'API GitHub. Rien à recopier de mon côté — je fais juste **Ctrl+Maj+R**. `admin.html` = usage **PC**, optimisé souris/hover.
- **Fichiers GAS** (`gas/code.gs`, `gas/generateur_gardes.gs`, `gas/Indispos.gs`, `gas/setup_annee.gs`) : tu pousses la copie du dépôt, **je recopie manuellement dans Apps Script**. En Apps Script, les fonctions se voient entre fichiers (scope global partagé). **Tant qu'un `.gs` n'est pas recopié dans Apps Script, le web app tourne sur l'ancienne version.**
- **Token GitHub** : je te le fournis en début de session (il sert à pousser ; c'est aussi la clé `GITHUB_TOKEN` de l'onglet CONFIG côté appli). Sans lui, tu ne peux pas publier. Ne l'écris jamais dans un fichier.

## Conventions de code (à respecter)
- Patches **AVANT/APRÈS** explicites (jamais un fichier entier collé), ou push direct pour le frontend.
- Avant chaque edit : vérifier l'**unicité de l'ancre** (`s.count(ancre) == 1`).
- **`node --check`** sur tout JS livré (pour un `.gs`, le copier en `.js` d'abord) ; pour un refacto, **vérifier l'équivalence par script** AVANT de pousser.
- **Vérifier la PORTÉE de tout symbole réutilisé.** `node --check` valide la syntaxe, PAS l'existence d'une variable à l'exécution. Avant d'appeler une fonction/constante/variable depuis un nouveau bloc, confirmer qu'elle est bien **accessible depuis ce scope** — pas seulement présente quelque part dans le fichier. Piège récurrent : réutiliser un motif copié d'une autre fonction (ex. `JOURS_ABR`, `slot.isWeekend`) qui est **local** à sa fonction d'origine ou **absent** de la structure de données ciblée → `ReferenceError` / `undefined` à l'exécution. Réflexe : `grep` la déclaration, vérifier qu'elle est globale (ou locale au bon scope) ; sinon utiliser l'équivalent global (ex. `DAYS_FR` au lieu du `JOURS_ABR` local à `renderWeek`).
- **Tester le CHEMIN NOMINAL en conditions réalistes**, pas seulement la logique isolée. Un harnais avec données simplifiées peut passer alors que le code plante en prod (structure de données réelle différente). Extraire les vraies fonctions du fichier et les exécuter avec des données proches du réel.
- **Un `try/catch` protecteur ne dispense pas de tester.** Envelopper un traitement non critique (ex. le filet de complétude) dans un `try/catch` qui « publie quand même » est une bonne sécurité — mais il **masque les exceptions** : une erreur de scope y devient invisible (le geste réussit sans faire son travail). Toujours vérifier que le chemin protégé s'exécute réellement, pas seulement qu'il ne bloque pas.
- Modèle : Opus pour le complexe, Haiku/Sonnet pour le simple, afin d'économiser.
- **Vérifier l'état RÉEL du dépôt** (les fichiers en ligne font foi) plutôt que se fier à un souvenir.
- **Versionner chaque `.gs` poussé** : incrémenter la constante `GAS_VERSION_*` en tête du fichier à chaque push — le 🔍 Diagnostic compare dépôt vs déployé et signale les recopies oubliées.

## Structure du dépôt (rangé)
- **Racine** : les `.html` (`index.html`, `admin.html`, `staff.html`, `indispos.html`, `dashboard.html`, `crh.html`), `manifest.webmanifest` (PWA, doit rester racine — `scope`/`start_url`), `sw.js`.
- **`assets/`** : `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Référencés par les `<link>` des HTML et par le manifest (`assets/icon-*.png`).
- **`docs/`** : la documentation vivante — `CONTEXTE-Planning-CHPG.md` (ce fichier) et `ROADMAP-Planning-CHPG.md` ; guides `guide-technique.html` (référence interne : architecture, wizards, déploiement, dépannage), `guide-comite.html`, `guide-mar.html`, `guide-algo-gardes.html`, `guide-liberal.html` ; `reprise.md` (continuité : propriété, accès, sauvegardes) ; `VEILLE_CFG-mode-emploi.md` ; présentations staff (⚠️ `presentation-staff.html` : le code de démo se saisit **par prompt au clic**, ne jamais l'écrire en dur — dépôt public, historique permanent) ; `module-liberal/` (conception, antisèche cotation, estimateur).
- **`gas/`** : les **5** fichiers Apps Script (`code.gs`, `Indispos.gs`, `generateur_gardes.gs`, `setup_annee.gs`, `portail.gs`) + `README.md`.
- **`simulateur/`** : batterie de tests Python (non-régression de l'algo) + `experiences/`.

## Architecture
Google Sheets (onglets clés : `MEDECINS`, `CONFIG`, `HISTORIQUE`, `GARDES_{Y}`, `STATS_GARDES_{Y}`, `AFFECTATIONS_{Y}`, `INDISPOS_{Y}`, `PLANNING_OVERRIDES`, `LOGS`, `CONNEXIONS`) → **5 fichiers GAS** → **web app Apps Script** (`API_URL` `/exec`) → **GitHub Pages** (les HTML).

**Données de planning servies depuis le Drive PRIVÉ** (confidentialité) : `planning_{Y}.json` et `affectations_{Y}.json` (et `stats_{Y}.json` des archives) vivent dans le dossier Drive **`Planning-CHPG-JSON`**, écrits par `generatePlanning()` via `savePlanningToDrive()` et lus via les actions API `getPlanningJson` / `getAffectationsJson` (plus de fichier statique sur Pages). **Conséquence** : une année N+1 n'apparaît dans le sélecteur admin que si `affectations_{N+1}.json` existe dans le Drive (= planning publié) — avoir seulement l'onglet `GARDES_{N+1}` ne suffit pas ; si un contrôle échoue alors que les onglets existent, **republier** l'année (admin → sélectionner l'année → ⬆️ Publier, qui relance `generatePlanning`).
**Piège Drive résolu (07/2026)** : Drive autorise des **doublons** de fichier/dossier de même nom. `readPlanningFromDrive`/`savePlanningToDrive` ciblent désormais le fichier **le plus récent** (dans tout dossier `Planning-CHPG-JSON`) et l'écriture **dédoublonne** (anciens → corbeille). Fonction de diagnostic **`diagDriveJson()`** (à lancer dans Apps Script) : liste dossiers/fichiers, dates, tailles et nombre de gardes par copie. Un W3 qui bloquait « planning N+1 non généré » alors que le JSON avait des gardes venait d'une **copie périmée lue** — corrigé.

Cycle annuel = 3 assistants dans admin.html, **tous testés en réel** :
- **Wizard 1** — init de l'année N+1 (réunion staff, octobre) : effectif, quotités, vacances.
- **Wizard 2** — génération des gardes (novembre), après collecte des indispos. La génération publie aussi le planning (Drive).
- **Wizard 3** — clôture/archivage de l'année N : STATS→HISTORIQUE, `stats_{Y}.json`+`indispos_{Y}.json` dans le Drive, **déplacement** des onglets `*_{Y}` vers `ARCHIVE_SS_ID` (`Planning_CHPG_Archives`), bascule année active → N+1, nettoyage indispos. **Testé en réel (archivage de 2026, 07/2026)** : HISTORIQUE 2026 OK, année active → 2027, 2026 consultable en lecture seule.

## Accès nominatif (index.html)
- **Code d'accès perso = colonne G (7ᵉ colonne) de la ligne du MAR dans `MEDECINS`** (`checkCode` lit `data[r][6]`). Code admin = clé `ADMIN_CODE` de `CONFIG`.
- L'écran de connexion **met la saisie en MAJUSCULES**. La comparaison GAS est **insensible à la casse** (patch `Indispos.gs` — à recopier dans Apps Script pour prendre effet). Éviter un code purement numérique (Sheets peut le stocker en numérique/notation scientifique).
- **Codes robustes** : `genererTousLesCodes()` (dans `setup_annee.gs`) génère un code 8 caractères non devinable (alphabet sans `0 O 1 I L`) pour chaque MAR **actif** (col D=O), efface celui des inactifs (parti = ne peut plus se connecter), et logue le récap. `genererCodeMAR("XX")` pour un seul MAR. Distribution via le flux « Envoyer les codes » du Wizard 1.
- **Renouveler le code d'un MAR** : action GAS **`resetCodeMar`** (admin only, dans `WRITE_ACTIONS_LOCK`), déclenchée par le bouton **🔄** de sa ligne (onglet Équipe). Tire un code unique (comparé aux autres MARs **et** à `ADMIN_CODE`), l'écrit en colonne G — **l'écrasement EST la révocation**, il n'y a rien d'autre à invalider — puis l'envoie par email. **L'email est vérifié avant toute écriture** (pas d'email → refus, code inchangé) ; l'ancien code est tracé dans `LOGS` avant écrasement ; si l'envoi échoue, le nouveau code est **renvoyé dans le message d'erreur** pour transmission en main propre. ⚠️ **Les envois groupés ne régénèrent PAS** (`sendCodes`, `sendCodesMar`, `sendCodesWithRecap`) : ils renvoient le code existant. Distinction volontaire — un « envoyer à tous » ne doit jamais pouvoir casser 23 codes. Documenté dans `guide-comite.html` § 13.3.
- **Pas de limite de tentatives** sur `checkCode()` à ce jour (chantier ouvert, voir ROADMAP).
- **Personnalisation** : le MAR connecté (`MY_ID`) est mis en exergue partout — puce liserée `me-chip` en vue secteurs, `me-row` en vue année/affectations, `me-card` + carte en tête en médecins/équité, `me-chip` en mobile. Le code **admin** donne la vue générique sans « moi » (l'admin n'est pas un MAR).
- **Déconnexion / changer d'utilisateur** : le badge 👤 en haut à droite est cliquable (icône ⏻) → vide la session (`sessionStorage.chpgViewCode`) et recharge → écran de connexion. Sinon l'auto-login reconnecte le dernier code.
- Chemin d'échec robuste : une erreur d'auth pendant le chargement ne détruit plus la page — retour propre à l'écran de connexion (`loadYear` renvoie `false`, `init` s'arrête, `checkMobile` null-safe).

## Règles clés de l'algo de gardes
- Priorité d'équité : **VD (week-end) > Samedi > Jeudi > Total**.
- Cibles **proportionnelles à la quotité** (colonne `PCT_GARDES`).
- **Dette inter-annuelle** dès **2028** : écart réel − cible de N-1, plafonné à ±2, amorti ×0,6.
- Noël / Jour de l'an en **rotation pluriannuelle** via `getNoelHistory(beforeYear)`.
- **L'algo de gardes ne dépend PAS des secteurs** (gardes = G / G2) → réorganiser les secteurs ne touche jamais l'équité.
- Secteurs définis dans une **source unique `SECTEURS_CFG`** en haut d'`admin.html`.
- **PRUNET** (`souhait_plafond`) : ses souhaits sont honorés en priorité (≈ tous les mardis, ~48 gardes/an, zéro week-end) ; **il reste dans le pool proportionnel des 730** (décision assumée). Conséquence connue : les cibles des autres, calculées sur 730, sont donc **légèrement surestimées** (~+0,6 garde/100 %) puisque BP consomme plus que sa part → les autres finissent un poil sous leur cible. Normal, dans le bruit du plancher arithmétique. Dans la vue d'équité, PRUNET s'affiche en profil **« SOUHAITS · hors cible »** (barres neutres, pas de trait de cible).

## Robustesse d'affichage (équité)
- Toute cible non plausible (date parasite dans une cellule, valeur aberrante type timestamp) est lue comme **« pas de cible » (`—`)** — garde `_cib`/`_cibNum` (admin + index, initiale + instantané). N'invente pas une cible : si une cellule CIBLE de `STATS_GARDES` contient une date, corriger la donnée dans le Sheet (ou régénérer).

## Consultation libérale endoscopie
- Le soliste de la rotation libérale (ROT-LIB, mardi/jeudi PM) est marqué **`entry.lib=true`** côté GAS. Dans `index.html`, sa puce Endoscopies porte un **badge « LIB »** violet (desktop + mobile) + légende conditionnelle. Cohérent avec le rendu admin.
- **Choix manuel du soliste** (admin, onglet Affectations) : la case libérale vide (badge LIB) et la puce libérale attribuée sont **cliquables** → sélecteur des MARs présents ce jour → remplace/retire le soliste. Le **×** retire. Backend = action GAS **`setLibSoliste(année, date, marId)`** : écrit un override **`ROT-LIB` ciblé** sur cette date (remplace le soliste précédent) puis republie — ne rejoue pas toute la rotation auto. Le tag ROT-LIB vit dans la **colonne E (COMMENTAIRE)** de `PLANNING_OVERRIDES`.

## État : fonctionnellement terminé
**Ne PAS reproposer** : `config.html` (abandonné — couvert par les 5 onglets d'admin.html) ; **optimisation perf** du JSON (déjà minifié/gzip) ; patch GAS de robustesse cible (le garde frontend suffit).

**Restant / à surveiller (non urgent)** :
- **`Indispos.gs` à recopier dans Apps Script** (version dépôt **`2026-07-20.2`**) — contient trois ajouts non actifs tant que non recopié : comparaison de code **insensible à la casse** (sinon un code avec minuscules en colonne G échoue), l'action **`setLibSoliste`** (choix manuel du soliste libéral) **et** l'action **`resetCodeMar`** (bouton 🔄, sinon « Action inconnue »). Le 🔍 Diagnostic signale l'écart dépôt/déployé.
- **Années archivées — RÉSOLU (07/2026, 1ᵉʳ archivage réel de 2026).** `archiveYear` écrit `stats_{Y}.json` dans le **Drive** et **déplace** les onglets `*_{Y}` vers le classeur d'archive `ARCHIVE_SS_ID` (`Planning_CHPG_Archives`). Détection des années archivées via l'action GAS **`getArchivedYears`** (scan Drive des `stats_YYYY.json`) — `detectAvailableYears()` ne sonde plus Pages. Lecture des stats archivées via le helper **`_ssWithSheet()`** (classeur actif sinon `ARCHIVE_SS_ID`) appliqué à `computeStatsLive` (Équité Instantané) et `getStats` (Initiale). Une année clôturée réapparaît en « archivé » (lecture seule) et son équité Initiale/Instantané reste consultable. Rappel : Initiale = équité figée à la génération, Instantané = équité réelle finale (intègre les échanges) — les deux diffèrent légitimement.
- **Secteurs étape 2 — plan validé, à exécuter plus tard (avant déménagement NCHPG/2027).** Objectif : bascule secteurs en quelques minutes dans un onglet, pas de hardcode. Constat : la config secteurs est **triplée et non synchronisée** — `admin.html` (`SECTEURS_CFG`, source riche), `index.html` (copie en dur `_SECTOR_BASE` + `SECLABELS`), `gas/code.gs` (`CS_TEMPLATE` par jour + règles CI→RI/`csAmRules`). `staff.html` n'a pas de secteurs. **Périmètre décidé : complet** (définitions + consultations). **On ne modélise PAS encore les secteurs NCHPG** — on construit le mécanisme rempli à l'identique de l'existant ; la bascule sera une simple édition d'onglet.
  - **Schéma validé — onglet `SECTEURS`** (1 ligne/secteur) : `ORDRE | CODE | LABEL | COURT | AFF | ICON | BG | FG | CS | ACTIF`.
  - **Schéma validé — onglet `CS_TEMPLATE`** (1 ligne/créneau conso) : `JOUR(1-5) | DEMI(AM/PM) | SECTEUR_AFFIL | CODE_CS | NB`.
  - **Workflow d'exécution** (après synchro des 4 `.gs`), chaque étape validée avant la suivante, **repli systématique sur les valeurs actuelles** à chaque étape (jamais de casse) : (1) `setupSecteursTab()` GAS — crée+remplit les 2 onglets à l'identique, idempotente ; (2) lecteur GAS `getSecteursConfig()` (caché) + injection d'un bloc `secteurs` dans les JSON publiés + action API `getSecteursConfig` ; contrôle non-régression = JSON identique + ce bloc ; (3) `admin.html` lit la config au chargement (repli sur `SECTEURS_CFG` actuel si l'API échoue) ; (4) `index.html` consomme le bloc `secteurs` du JSON au lieu de ses copies en dur. Bascule 2027 = éditer l'onglet (nouveaux codes BLOC CENTRAL, anciens en `ACTIF=N`), regénérer. La bascule CI→RI restera du code paramétré (logique, pas donnée).
- **Module libéral** (règle des 30 %, voir `docs/module_liberal_conception.md`).

## Robustesse — invariants acquis (audit des 19–20/07/2026)

Cinq axes éprouvés (cycle de vie RH, charge, concurrence, résilience, continuité).
Détail dans `ROADMAP-Planning-CHPG.md`. Ce qu'il faut **savoir avant de coder** :

- **Un MAR actif a toujours ses lignes annuelles.** `ensureMarRows()` (dans `Indispos.gs`) est
  appelée par `saveMedecin` à chaque création **et réactivation** : elle crée les lignes manquantes
  dans `INDISPOS_{Y}`, `GARDES_{Y}` et `AFFECTATIONS_{Y}` (année active + suivantes). Idempotente,
  n'écrase rien. Ne plus supposer qu'un MAR présent dans `MEDECINS` existe dans les onglets annuels
  *sans* être passé par là — c'était la cause d'échecs **silencieux** (saisie d'indispos, dons,
  affectations). Positions à respecter : MARs dès la **ligne 4** (INDISPOS/GARDES), **ligne 2**
  (AFFECTATIONS).
- **Les absences longues sont réversibles.** `annulerAbsenceLongue` annule ou raccourcit
  (`nouvelleFin`) : efface **uniquement** les cases valant exactement `CL`, met à jour ou supprime
  la ligne du registre `ABSENCES_LONGUES` — sans quoi `initYear` rejouait l'absence sur les années
  futures. Les gardes libérées à la pose ne sont **pas** restaurées (don/échange manuel).
- **La dette d'équité est pondérée par la présence réelle.** La part juste de N-1 se calcule à
  partir des **colonnes `CIBLE*` du snapshot `STATS_GARDES_{N-1}`** (déjà pro-ratées par
  `structAvail()` : arrivée/départ, CL, TP, no_weekend), plus au prorata de la seule quotité.
  Invariants préservés : `Σ dette = 0` par axe, résultat identique à l'ancienne formule quand tout
  le monde est présent toute l'année, repli automatique si les cibles manquent. Le snapshot écrit
  désormais **23 colonnes** (ajout de `CIBLE JF`). **Ne jamais dériver la dette des réels seuls.**
- **Les écritures sont sérialisées.** `WRITE_ACTIONS_LOCK` (en tête de `Indispos.gs`) liste les
  **23 actions d'écriture** (dont `resetCodeMar`) ; le point d'entrée prend `LockService.getScriptLock()` (20 s) avant de
  router. **Toute nouvelle action qui écrit doit être ajoutée à ce Set.** Les lectures n'en prennent
  jamais (fluidité du dashboard). Pas de `releaseLock` explicite : Google libère en fin d'exécution.
- **Reprise des wizards.** Les étapes réussies ne sont pas rejouées ; `initYear` refuse d'écraser,
  `archiveYear` et `generateGardes` détectent « déjà fait » et renvoient un succès (avec les stats
  pour la génération) au lieu d'une erreur. Le verrou anti-régénération de `generateGardes()` reste
  intact pour les appels directs depuis l'éditeur : **ne jamais le contourner**.
- **Charge** : marge ×3 sur la limite des 30 exécutions simultanées au pic réaliste — pas
  d'optimisation nécessaire (ne pas reproposer de cache serveur).

## Pour retrouver le contexte détaillé
Tu disposes d'une **mémoire** de nos sessions et des **transcripts** dans `/mnt/transcripts/` (voir `journal.txt` pour le catalogue). Consulte-les si tu as besoin d'un détail précis (code exact, décisions passées).

---
*Pour démarrer : donne-moi le token GitHub, dis-moi ce qu'on modifie, et vérifie d'abord l'état réel du dépôt.*
