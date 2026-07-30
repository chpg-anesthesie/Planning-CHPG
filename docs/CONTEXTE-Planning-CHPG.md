# Contexte projet Planning-CHPG — à coller en début de conversation

Tu es mon développeur attitré sur **Planning-CHPG**. Je suis **Arthur**, anesthésiste-réanimateur
au **CHPG (Monaco)**, seul responsable de ce projet et **sans bagage de code** : tu écris, valides
et livres tout ; moi je recopie/valide. Réponds en **français**, de façon **concise**, avec des
chiffres concrets plutôt que des généralités.

---

# PARTIE 1 — L'ESSENTIEL

*Si tu ne lis qu'une chose, lis ceci. Le détail complet est en partie 2.*

## État au 30 juillet 2026

**Site v1.14.14** · GAS : `code.gs` 2026-07-29.3 · `Indispos.gs` **2026-07-30.5** ·
`portail.gs` **2026-07-30.1** · `generateur_gardes.gs` 2026-07-29.1 · `setup_annee.gs` **2026-07-30.1**
*(les deux versions du 30/07 sont recopiées et déployées, confirmé par Arthur)*

**En production :** algorithme de gardes (équité annuelle), planning quotidien (`admin.html`),
portail/Dashboard, module libéral (lots 0, 1, 2A, 2B, 3), contrôle d'absence (`absences.html`,
lot 5-bis), veille bibliographique, CR d'anesthésie, export Excel hebdomadaire.

**Prochaine échéance : présentation au staff le 4 septembre 2026**, démo en production.

**⚠️ Rotation des groupes de vacances — règle actée le 30/07/2026.**
« **Le dernier devient le premier** », entre groupes **et** à l'intérieur d'un groupe :
`ABC → CAB → BCA` · `A1 A2 A3 → A3 A1 A2`. En code : `(3 − offset % 3) % 3`, **jamais**
`offset % 3`. Cette règle est écrite à **quatre endroits** (`staff.html`, `admin.html`, et
**deux fois** dans `Indispos.gs`, plus l'outil `testNotifierConflits`). Le serveur tournait à
l'envers jusqu'au 30/07 : les deux ordres ne coïncidaient qu'**une année sur trois**, et une
année sur trois le MAR désigné en conflit de vacances n'était pas celui affiché au staff.
Elle sert au blocage des conflits **et** à l'audit de couverture du W2 (qui décale ses congés).

**Journée du 30/07 — audit documentaire des 7 guides et des 4 `.md` (30 anomalies corrigées),
et surtout deux correctifs de fond sur la saisie :**
- `saveIndispos` **réécrivait la ligne entière** d'un MAR. Or `INDISPOS_{Y}` a deux propriétaires
  (comité : `VAC`/`FORM` · MAR : `INDISPO`/`SOUHAIT`/`TP`). Revalider le staff effaçait la campagne
  des MARs ; une page MAR ouverte trop tôt effaçait les vacances. Corrigé par `_fusionIndispos_`
  **dans le routeur** — pas dans `saveIndisposForDoctor`, qui sert aussi à l'absence longue.
  C'est ce qui rend le verrou des vacances **réel, côté serveur**.
- « Valider et verrouiller » faisait **un appel par MAR** (23 exécutions sérialisées, ~3 min).
  Nouvelle action `saveIndisposBatch` : 1 aller-retour, 1 écriture de bloc. **Quelques secondes,
  confirmé en production.** Cadenas désormais reconstruits depuis la base + bouton
  🔓 Tout déverrouiller.

## Les 6 règles qui évitent les dégâts

**1. Le dépôt en ligne fait foi — toujours.** Jamais un souvenir, jamais un fichier joint au
projet, jamais une mémoire de session précédente. Vérifier l'état réel avant toute modification.

**2. Aucun push sans accord explicite d'Arthur.** Préparer le patch AVANT/APRÈS, expliquer
l'effet en langage simple, attendre le « OK pour push ». Vaut aussi pour les suppressions.

**3. Lire dans l'ordre d'exécution, pas par fragments.** Un défaut d'ordre est invisible à la
lecture locale. *(Le 28/07, une déclaration placée 235 lignes trop bas a coûté une journée
entière — détail en partie 2, section Diagnostic.)*

**4. Rendre visible avant de corriger.** Face à un symptôme inexpliqué, la première action est
d'afficher l'échec silencieux — jamais un correctif. Un `try/catch` protecteur masque les erreurs.

**5. Une recherche négative ne prouve rien tant qu'elle n'est pas exhaustive.** Chercher dans
**tout** le dépôt avant d'affirmer qu'une fonction n'existe pas ou qu'un fichier est orphelin.

**6. Signaler les incertitudes plutôt que les lisser.** Distinguer toujours ce qui est vérifié par
machine (syntaxe, unicité d'ancre, simulation, jsdom) de ce qui ne sera prouvé qu'en production.

## Le réflexe performance

Une requête Apps Script **qui ne fait rien** coûte **2 à 3 s** avant d'atteindre le code (mesuré
sur deux déploiements indépendants le 29/07). **Le seul levier est de réduire le NOMBRE d'appels,
jamais leur contenu.** Avant d'ajouter un appel à l'ouverture d'une page, se demander s'il ne peut
pas rejoindre `getAdminBootstrap`. Ne jamais mesurer un gain sur une base instable : le serveur
lui-même varie du simple au double dans une même journée.

## Ce qui est livré et ne doit PAS être reconstruit

Module libéral (estimateur, devis, déclaration d'intervention, volet comité, relevé et suivi
des 30 %) · Contrôle d'absence lot 5-bis · Boîte de réception Gmail dans `admin.html` ·
Couverture des jours serrés du générateur · Export Excel · Wizards annuels.

## Ce qui est écarté — ne pas reproposer

Protection anti-force-brute sur `checkCode()` · Service worker sur les autres pages · Icônes
`index.html` en bundle local · Réduction automatique du devis à l'impression · Archivage annuel
automatisé · Cache serveur et optimisation du JSON · Migration hors Apps Script.
*(Justifications chiffrées dans la ROADMAP, section « Écarté ».)*

## Où chercher quoi

| Besoin | Document |
|---|---|
| Architecture, wizards, déploiement, dépannage | `docs/guide-technique.html` — **le plus fiable** |
| État du projet, priorités, ce qui est écarté | `docs/ROADMAP-Planning-CHPG.md` |
| Règles de code, invariants, métier | **Ce document, partie 2** |
| Module libéral (conception) | `docs/module-liberal/module_liberal_conception.md` |
| Guides utilisateurs | `docs/guide-mar.html`, `guide-comite.html`, `guide-liberal.html` |

---
---

# PARTIE 2 — LE DÉTAIL

> Conservé intégralement : conventions de code, invariants, règles métier, architecture,
> pièges. **Rien n'a été retiré.** La partie 1 oriente, la partie 2 fait foi.

## Le projet
Application web de **planning des gardes** (algorithme d'équité annuel) + **planning quotidien** d'anesthésie + **consultations**, pour ~23 MARs.
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`.

## Workflow de livraison (IMPORTANT)
- **Frontend** (`index.html`, `admin.html`, `staff.html`, `indispos.html`, `staff_gardes_demographie.html`) : tu les **pousses directement** sur le dépôt via l'API GitHub. Rien à recopier de mon côté — je fais juste **Ctrl+Maj+R**. `admin.html` = usage **PC**, optimisé souris/hover.
- **Fichiers GAS** (`gas/code.gs`, `gas/generateur_gardes.gs`, `gas/Indispos.gs`, `gas/setup_annee.gs`) : tu pousses la copie du dépôt, **je recopie manuellement dans Apps Script**. En Apps Script, les fonctions se voient entre fichiers (scope global partagé). **Tant qu'un `.gs` n'est pas recopié dans Apps Script, le web app tourne sur l'ancienne version.**
- **Token GitHub** : je te le fournis en début de session (il sert à pousser ; c'est aussi la clé `GITHUB_TOKEN` de l'onglet CONFIG côté appli). Sans lui, tu ne peux pas publier. Ne l'écris jamais dans un fichier.

## ⛔ Diagnostic : les 5 règles issues de la journée du 28/07/2026

Une seule ligne mal placée a coûté une journée entière. Ces règles en découlent — les appliquer
avant tout diagnostic de comportement anormal.

**1. Lire dans l'ORDRE D'EXÉCUTION, pas par fragments.** Le défaut du 28/07 : la file d'attente
`_fileAPI` (`let`, ligne 2036) était utilisée par la connexion automatique qui s'exécute **235
lignes plus haut** (ligne 1801). Une variable `let` n'existe pas avant sa ligne : le tout premier
appel levait `ReferenceError: Cannot access '_fileAPI' before initialization`, **à chaque
rechargement de page**. Aucune lecture locale ne peut révéler ça — seule une lecture « qu'est-ce
qui s'exécute en premier, qu'est-ce qui est déclaré où » le montre.
→ ⚠️ **L'emplacement d'une déclaration est une décision technique, jamais éditoriale.** Ne jamais
insérer du code « là où c'est lisible » sans vérifier ce qui s'exécute avant lui. Dans
`admin.html`, la connexion automatique (`tryAutoLogin`) est volontairement **la dernière chose du
gros bloc `<script>`** : ne jamais la remonter.

**2. RENDRE VISIBLE avant de corriger.** L'exception était avalée par le `catch` d'`ouvrirSession`
depuis le matin. Trois lignes de `console.warn` ont donné la réponse en une minute, après six
heures de tâtonnements. Face à un symptôme inexpliqué, la PREMIÈRE action est d'afficher l'échec
silencieux — jamais un correctif. (Corollaire de la règle « un try/catch protecteur ne dispense
pas de tester ».)

**3. Un symptôme qui CONTREDIT le code est le signal le plus fort.** Le chronomètre montrait
`login` parti AVANT `getAdminBootstrap`, alors que le code ne l'appelle qu'après. J'ai cherché
des explications de contournement pendant des heures. Quand l'observation contredit le code,
c'est que le code ne fait pas ce qu'on croit : creuser LÀ, immédiatement.

**4. Une mesure exacte peut mener à une conclusion fausse.** Le péage de 2-3 s par appel
(mesuré, vérifié sur deux déploiements) est réel — mais il explique la **durée** d'un appel, pas
leur **nombre**. Il y avait 3 à 4 appels là où un seul était nécessaire, et ça, c'était le code.
Toujours vérifier : cette mesure répond-elle à la question posée ?

**5. Quand la même fonction casse deux fois, ARRÊTER DE PATCHER.** Le préchargement du panneau a
demandé quatre versions successives le même après-midi. Après le deuxième correctif, il fallait
revenir à un état stable et repartir d'une analyse complète.

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
- **`assets/`** : ⚠️ `vendor/lucide-icons.js` est un mini-bundle LOCAL de **17 icônes seulement** (liste dans son en-tête) — une tuile qui demande une icône absente s'affiche vide ; pour en ajouter une, copier son tableau `children` depuis le paquet lucide. `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Référencés par les `<link>` des HTML et par le manifest (`assets/icon-*.png`).
- **`docs/`** : la documentation vivante — `CONTEXTE-Planning-CHPG.md` (ce fichier) et `ROADMAP-Planning-CHPG.md` ; guides `guide-technique.html` (référence interne : architecture, wizards, déploiement, dépannage), `guide-comite.html`, `guide-mar.html`, `guide-algo-gardes.html`, `guide-liberal.html` ; `reprise.md` (continuité : propriété, accès, sauvegardes) ; `VEILLE_CFG-mode-emploi.md` ; présentations staff (⚠️ `presentation-staff.html` : le code de démo se saisit **par prompt au clic**, ne jamais l'écrire en dur — dépôt public, historique permanent) ; `module-liberal/` (conception, antisèche cotation, estimateur).
- **`gas/`** : les **5** fichiers Apps Script (`code.gs`, `Indispos.gs`, `generateur_gardes.gs`, `setup_annee.gs`, `portail.gs`) + `README.md`. **+ `mesure_perf.gs` — TEMPORAIRE** (outil de diagnostic en lecture seule, lancé à la main depuis l'éditeur, jamais routé ni déployé ; contient `mesurerPerf()` et `mesurerDrive()`). **À supprimer du dépôt ET de l'éditeur quand le chantier performance sera clos.**
- **`simulateur/`** : batterie de tests Python (non-régression de l'algo) + `experiences/`.

## Architecture
Google Sheets (onglets clés : `MEDECINS`, `CONFIG`, `HISTORIQUE`, `GARDES_{Y}`, `STATS_GARDES_{Y}`, `AFFECTATIONS_{Y}`, `INDISPOS_{Y}`, `PLANNING_OVERRIDES`, `LOGS`, `CONNEXIONS`) → **5 fichiers GAS** → **web app Apps Script** (`API_URL` `/exec`) → **GitHub Pages** (les HTML).

**Données de planning servies depuis le Drive PRIVÉ** (confidentialité) : `planning_{Y}.json` et `affectations_{Y}.json` (et `stats_{Y}.json` des archives) vivent dans le dossier Drive **`Planning-CHPG-JSON`**, écrits par `generatePlanning()` via `savePlanningToDrive()` et lus via les actions API `getPlanningJson` / `getAffectationsJson` (plus de fichier statique sur Pages). **Conséquence** : une année N+1 n'apparaît dans le sélecteur admin que si `affectations_{N+1}.json` existe dans le Drive (= planning publié) — avoir seulement l'onglet `GARDES_{N+1}` ne suffit pas ; si un contrôle échoue alors que les onglets existent, **republier** l'année (admin → sélectionner l'année → ⬆️ Publier, qui relance `generatePlanning`).
**Piège Drive résolu (07/2026)** : Drive autorise des **doublons** de fichier/dossier de même nom. `readPlanningFromDrive`/`savePlanningToDrive` ciblent désormais le fichier **le plus récent** (dans tout dossier `Planning-CHPG-JSON`) et l'écriture **dédoublonne** (anciens → corbeille). Fonction de diagnostic **`diagDriveJson()`** (à lancer dans Apps Script) : liste dossiers/fichiers, dates, tailles et nombre de gardes par copie. Un W3 qui bloquait « planning N+1 non généré » alors que le JSON avait des gardes venait d'une **copie périmée lue** — corrigé.

Cycle annuel = 3 assistants dans admin.html, **tous testés en réel** :
- **Wizard 1** — init de l'année N+1 (réunion staff, octobre) : effectif, quotités, vacances.
- **Wizard 2** — génération des gardes (novembre), après collecte des indispos. La génération publie aussi le planning (Drive).
- **Wizard 3** — clôture/archivage de l'année N : STATS→HISTORIQUE, `stats_{Y}.json`+`indispos_{Y}.json` dans le Drive, **déplacement** des onglets `*_{Y}` vers `ARCHIVE_SS_ID` (`Planning_CHPG_Archives`), bascule année active → N+1, nettoyage indispos. **Éprouvé sur un archivage de test de 2026 (07/2026)** — mais ⚠️ **l'archivage réel n'a PAS eu lieu** : au 20/07/2026 l'année active est toujours **2026** et les onglets `*_2026` sont bien dans le classeur. Le vrai W3 se tiendra en janvier 2027.

## Accès nominatif (index.html)
- ⚠️ **Toute nouvelle colonne de `MEDECINS` s'ajoute À LA FIN de l'onglet.** Jamais au milieu, jamais par insertion. **22 lectures** de `MEDECINS` (dans `Indispos.gs`, `code.gs`, `portail.gs`) utilisent des **index de colonne figés** — code d'accès `[6]`, ACTIF `[3]`, DECT `[8]`, drapeaux de garde `[9]` à `[16]`. Une insertion au milieu décale tout : vérifié en réel le 21/07/2026, la colonne `LIBERAL` posée au milieu a rendu les codes d'accès inopérants (`checkCode` lisait la colonne voisine). Symptôme : « code refusé » alors que le code est correct dans le Sheet.
- **Colonne `LIBERAL` (O/N) dans `MEDECINS`** (ajoutée en fin d'onglet) — appartenance au groupement libéral. Repérée **par son en-tête** et non par un index figé (`checkCode`, `Indispos.gs`) : sa position peut donc changer sans toucher au code. ⚠️ Cela **ne dispense pas** de la règle ci-dessus : c'est la lecture de `LIBERAL` qui est robuste, pas l'onglet. `checkCode` renvoie `liberal:true/false`, l'action `login` le transmet, `dashboard.html` s'en sert pour n'afficher la **tuile « Module libéral »** qu'aux membres. **Colonne absente ou vide → tuile invisible pour tout le monde** (comportement voulu). Aucune lecture de classeur supplémentaire : `MEDECINS` était déjà lu par `checkCode`.
- **L'estimateur libéral est une page du portail** (depuis le 21/07/2026, V4.0). Il lit le code d'accès dans `sessionStorage('chpgViewCode')` — déposé par `dashboard.html`, même origine GitHub Pages, et la tuile ouvre l'estimateur **dans le même onglet**. Il appelle **`login`** (identité) et **`getSecteurs`** (liste des secteurs) : **deux lectures, aucune écriture**. `API_URL` y est écrite en clair, ce qui n'ajoute rien — elle est déjà publique dans `dashboard.html` sur ce dépôt public.
  - **Colonnes de `MEDECINS` consommées par le module** : `LIBERAL` (O/N), `RPPS`, `PRENOM`. Toutes **en fin d'onglet**, toutes lues **par leur en-tête** via `_colParTitre()` dans `checkCode` (`Indispos.gs`). Ajouter une quatrième = une ligne.
  - **Données nominatives** : RPPS et prénom ne sont **jamais** dans le dépôt. Ils font l'aller-retour classeur privé → navigateur du praticien, et ne sont renvoyés qu'au MAR identifié par **son propre** code, pour **sa seule** ligne.
  - **Civilité** : la colonne `NOM` contient « Dr X » et les gabarits écrivent déjà « Dr »/« Docteur ». `sansCivilite()` la retire au pré-remplissage. ⚠️ **Ne jamais mettre le prénom dans la colonne `NOM`** : elle alimente le planning, le dashboard et l'export Excel.
  - **Filtre des secteurs proposés** : `ACTIF` **et** `AFF` renseigné **et** `RENDEMENT_LIB` ni `NUL` ni `REA`, trié par `ORDRE`. Un secteur **sans rendement renseigné est proposé** (présumé productif jusqu'à classement).
  - **Tous les replis sont visibles** : hors portail, API injoignable, liste vide, champ manquant — chaque cas affiche son message et retombe sur la saisie manuelle.

- **Onglet `LIBERAL_{Y}` — déclarations d'intervention** (depuis le 22/07/2026). **9 colonnes** — `ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · CHIRURGIE · SPECIALITE · BR_CCAM · BR_NGAP` (ordre du `LIBERAL_HEADER`, revérifié le 30/07 : **`CHIRURGIE` est 6ᵉ, `SPECIALITE` 7ᵉ**). **Une ligne = un patient** depuis le lot 2A (27/07) : la fusion jour+secteur a été supprimée. Créé à la volée, année du **jour de bloc**. Actions dans `portail.gs` : `declareLiberal` / `deleteLiberal` (écritures, présentes dans le `WRITE_ACTIONS_LOCK` d'`Indispos.gs` bien que routées par `portailRoute` — le verrou est vérifié avant la délégation) et `listLiberal` (lecture).
  - 🔒 **`MAR_ID` = `user.id`, toujours déduit du code d'accès.** Le client n'envoie jamais d'identité. `listLiberal` filtre sur le MAR connecté, `deleteLiberal` refuse la ligne d'autrui.
  - **Une ligne = un MAR, un jour, un secteur.** Même jour + même secteur → mise à jour et libellé cumulé, jamais de doublon.
  - ⚠️ **Ne jamais purger automatiquement les lignes passées** : c'est la trace de l'activité libérale. La page en masque une partie, l'onglet garde tout.
  - ⚠️ **Piège de vocabulaire** : *déclaration de choix* (document signé par le patient) ≠ *déclaration d'intervention* (ligne lue par le comité).
  - `_isoDate()` vit dans `Indispos.gs` et est appelée depuis `portail.gs` (projet GAS unique). ⚠️ `_isoDate(undefined)` renvoie la **chaîne** `"undefined"`, pas `''` — ne l'appeler que sur une valeur présente (bug attrapé en test le 22/07).

- **Volet « ◆ Libéral » du comité** (`admin.html`, depuis le 22/07/2026). Action `listLiberalJour(date)` dans `portail.gs`, **réservée à l'admin**, lecture seule (absente du `WRITE_ACTIONS_LOCK`). Tiroir `#liberalCard` à **gauche**, symétrique de `#dispoCard`. Cache par date `_libJourCache`. Noms résolus par `_nm()`, secteurs par `SECTEURS_CFG` — rien de plus n'est transporté.
  - ⚠️ **Aucun jugement de placement n'est calculé** (ni « déjà en X », ni « à replacer ») : décision d'Arthur, le comité décide seul. Ne pas "améliorer".
  - ⚠️ **`#dispoCard` est un tiroir flottant à DROITE** (`position:fixed; right:16px; width:360px`) : son attribut `style=` inline dit le contraire, une règle CSS plus bas l'écrase. **Toujours lire la feuille de style avant de conclure sur la mise en page.**
  - Jour sans déclaration : tiroir masqué, **pas de toast**.

- **Estimateur libéral — modèle de données d'un parcours.** `docs/module-liberal/maquette_estimateur_liberal.html` (V3.6). Un parcours stocke : `axe` (CCAM ou NGAP), `statut`, `desc`, `br`, `dh`, `rac`, `mut`, **`dCs`** (date de consultation), **`dInt`** (date d'intervention, vide en NGAP), **`dActe`** (date de l'acte = `dInt` en CCAM, `dCs` en NGAP) et **`lines`** (détail acte par acte : `code`, `lib`, `br`, `mods`). Rien n'est persisté : tout vit en mémoire de page, un rechargement remet à zéro — pas de migration à prévoir.
  - **`dActe` est le champ pivot** : c'est lui, et lui seul, que lira le futur tiroir « ◆ Libéral » du planning admin pour poser l'alerte du comité au bon jour.
  - **La date d'intervention n'est jamais pré-remplie** et l'ajout d'un parcours CCAM est refusé sans elle. Une case vide se voit, une date fausse ne se voit pas.
  - **Le DH ne se répartit pas par acte.** Il est saisi pour l'intervention entière ; il n'existe aucune clé de répartition. Sur le devis il reste sur la ligne de total, avec les honoraires et le remboursement. Ne pas inventer de répartition.
  - Le devis est **établi à la date de consultation**, pas à la date d'impression, et sa validité de 6 mois court depuis elle.

- **Mini-bundle d'icônes `assets/vendor/lucide-icons.js`** — `dashboard.html` ne charge PAS Lucide depuis un CDN : le fichier local ne contient que les **18 icônes** réellement utilisées (extraites de lucide 1.23.0). ⚠️ Une icône demandée mais absente du bundle **ne s'affiche pas et ne produit aucune erreur** — la tuile garde un carré vide (constaté le 21/07/2026 avec `calculator`). Avant d'utiliser un nouveau nom d'icône, **vérifier la liste en tête de ce fichier** et y ajouter le tracé si besoin (`npm pack lucide@1.23.0`, puis `dist/esm/icons/<nom>.mjs`). Depuis le 21/07 un `console.warn` signale l'icône manquante.
- **Code d'accès perso = colonne G (7ᵉ colonne) de la ligne du MAR dans `MEDECINS`** (`checkCode` lit `data[r][6]`). Code admin = clé `ADMIN_CODE` de `CONFIG`.
- L'écran de connexion **met la saisie en MAJUSCULES**. ⚠️ **(27/07/2026) La comparaison GAS est désormais INSENSIBLE À LA CASSE** — `checkCode` normalise les deux côtés par `trim().toUpperCase()` (`_normCode`). Le motif : les champs portent `autocapitalize="characters"`, donc le téléphone corrigeait tout seul et **pas l'ordinateur** — même code accepté sur mobile et refusé sur PC. Sans risque de collision : `generateCode()` n'émet que des majuscules et `resetCodeMar` vérifie l'unicité en majuscules. ⚠️ Ce paragraphe a affirmé successivement les deux thèses — **corrigé le 29/07/2026 en relisant `checkCode`, seule référence.** Un code saisi À LA MAIN dans le classeur doit rester unique une fois mis en majuscules. 🔒 **(29/07/2026) AUCUNE limite de longueur** sur les champs de saisie de code : les trois `maxlength` d'`indispos.html` (8), `staff.html` (20) et du wizard d'`admin.html` (12) ont été retirés. Ils tronquaient un code long **sans message**, qui était ensuite déclaré invalide — panne vécue par Arthur sur son propre code. `checkCode` compare la chaîne entière, aucune contrainte serveur. **Ne jamais remettre de `maxlength` sur un champ de code.** Éviter aussi un code purement numérique (Sheets peut le stocker en numérique/notation scientifique).
- **Aucune limite de tentatives** sur `checkCode()`, et c'est **assumé** (décision du 20/07/2026, voir la section « Écarté » de la ROADMAP pour le chiffrage). Ne pas reproposer de protection anti-force-brute.
- **Codes robustes** : `genererTousLesCodes()` (dans `setup_annee.gs`) génère un code 8 caractères non devinable (alphabet sans `0 O 1 I L`) pour chaque MAR **actif** (col D=O), efface celui des inactifs (parti = ne peut plus se connecter), et logue le récap. `genererCodeMAR("XX")` pour un seul MAR. Distribution via le flux « Envoyer les codes » du Wizard 1.
- **Renouveler le code d'un MAR** : action GAS **`resetCodeMar`** (admin only, dans `WRITE_ACTIONS_LOCK`), déclenchée par le bouton **🔄** de sa ligne (onglet Équipe). Tire un code unique (comparé aux autres MARs **et** à `ADMIN_CODE`), l'écrit en colonne G — **l'écrasement EST la révocation**, il n'y a rien d'autre à invalider — puis l'envoie par email. **L'email est vérifié avant toute écriture** (pas d'email → refus, code inchangé) ; l'ancien code est tracé dans `LOGS` avant écrasement ; si l'envoi échoue, le nouveau code est **renvoyé dans le message d'erreur** pour transmission en main propre. ⚠️ **Les envois groupés ne régénèrent PAS** (`sendCodes`, `sendCodesMar`, `sendCodesWithRecap`) : ils renvoient le code existant. Distinction volontaire — un « envoyer à tous » ne doit jamais pouvoir casser 23 codes. Documenté dans `guide-comite.html` § 13.3.
- **Personnalisation** : le MAR connecté (`MY_ID`) est mis en exergue partout — puce liserée `me-chip` en vue secteurs, `me-row` en vue année/affectations, `me-card` + carte en tête en médecins/équité, `me-chip` en mobile. Le code **admin** donne la vue générique sans « moi » (l'admin n'est pas un MAR).
- **Déconnexion / changer d'utilisateur** : le badge 👤 en haut à droite est cliquable (icône ⏻) → vide la session (`sessionStorage.chpgViewCode`) et recharge → écran de connexion. Sinon l'auto-login reconnecte le dernier code.
- Chemin d'échec robuste : une erreur d'auth pendant le chargement ne détruit plus la page — retour propre à l'écran de connexion (`loadYear` renvoie `false`, `init` s'arrête, `checkMobile` null-safe).

## Règles clés de l'algo de gardes

**⚠️ L'année de planning ne fait PAS 730 gardes.** Elle va du **premier lundi de janvier** au
dimanche précédant le premier lundi de l'année suivante, donc **toujours un nombre entier de
semaines** : 52 semaines = 364 j = **728 gardes** (18 années sur 22), ou 53 semaines = 371 j =
**742 gardes** (**2028, 2034, 2040, 2045**). Le « 730 » du deck et de plusieurs commentaires est
une approximation (365 × 2) : commode à l'oral, fausse dans tout calcul. Vérifié sur la génération
réelle de 2027 : Σ `TOTAL G` = **728** exactement. Toute vérification arithmétique des cibles doit
partir de `SLOTS.total = nDays × 2`, jamais de 730.

- Priorité d'équité : **VD (week-end) > Samedi > Jeudi > Total**.
- Cibles **proportionnelles à la quotité** (colonne `PCT_GARDES`).
- **Dette inter-annuelle** dès **2028** : écart réel − cible de N-1, plafonné à ±2, amorti ×0,6.
- Noël / Jour de l'an en **rotation pluriannuelle** via `getNoelHistory(beforeYear)`.
- **Couverture des jours serrés (depuis le 23/07/2026)** : **Validé par une génération RÉELLE de 2027 dans le classeur (23/07/2026) : zéro jour sans binôme, écart maximal 1,2 garde.** En simulation : **13 jours sans binôme → 0** sur 140 années, avec une équité et une vitesse meilleures que la référence. **Aucun jour n'est jamais abandonné sans avoir tout essayé** : si le placement normal échoue, une passe de dernier recours retente en tolérant le combo jeudi↔samedi (légal — ce n'est pas deux gardes d'affilée) ; les deux règles dures ne sont JAMAIS relâchées (jamais deux gardes consécutives, jamais de garde sur une absence déclarée) et si vraiment personne n'est disponible, le jour est signalé nommément au comité avant publication. La passe « jours critiques » énumère les combinaisons possibles et retient **la moins coûteuse en équité** (borne dure : 20 000 essais) ; l'équité pilote, la disponibilité ne fait que départager — l'ordre inverse, testé et retiré, dégradait l'axe week-end (5,3 contre 3,4). Piège à connaître : `assign()` **ne vérifie pas** si le jour est déjà pourvu — toujours tester `!gardes[date]` avant de (ré)assigner, sinon on écrase silencieusement l'attribution de Noël. **Toute livraison du générateur exige `simulateur/eval.js`** (écart par axe) : la batterie historique ne mesurait que le total et a laissé passer une régression sur l'axe le plus prioritaire.
- **Deux gardes d'affilée : INTERDIT, c'est illégal.** Ne jamais le proposer. **Plafonner les congés de Noël : REFUSÉ.** Seule tolérance, en ultime recours quand un jour resterait sinon découvert : le combo jeudi↔samedi (2 occurrences en 140 ans).
- **Le choix du candidat est un vecteur de score comparé position par position** (`scoreSelect`,
  l.502) : `[espacement · ratio de l'axe du jour · lissage mensuel · ratio total · total brut]`,
  et `cmp()` s'arrête à la première position qui départage. Trois conséquences à ne pas oublier :
  le critère est un **ratio** `(réel + dette) / cible`, jamais un écart — c'est ce qui rend un 50 %
  comparable à un temps plein ; **la dette de N-1 est dedans en permanence**, ce n'est pas une
  correction appliquée après coup ; et le **ratio de l'axe du jour n'existe que pour les samedis,
  jeudis, veilles de fériés et fériés** — un mardi passe directement au lissage mensuel puis au total.
- **Récupération ≠ repos du lendemain.** Deux codes distincts : `RG` = le lendemain de **chaque**
  garde, soit 34/an pour un temps plein ; `R` = un jour rendu par **samedi** de garde, soit ~5/an.
  L'invariant est **`R ≡ SAM`** (testé dans `simulateur/chain.js`, vérifié sur les 24 MARs de la
  génération réelle 2027). Ne jamais dire « une récup par garde ».
- **L'espacement à 5 jours n'est PAS une règle dure** : c'est une pénalité de score (`spacingPenalty`). Blocages durs uniquement : lendemain de garde (`rgSet`), récupération (`rSet`), garde le lendemain (`gSet`), combo jeudi-samedi.
- **Contrainte d'effectif connue** — remesurée le 29/07 sur **400 années** (20 scénarios × 20 ans,
  `simulateur/staff140.js` et `staff_rythme.js`, `SCEN` de 0 à 19 ; `SCEN=0` = le tirage par défaut de
  `demographie.js`) : entre 2038 et 2041 (15 gardeurs), l'écart médian entre deux gardes tombe de
  **7,9 à 6,2 jours** et les mois à plus de 4 gardes passent de **8 % à 32 %**. Pire mois observé :
  **8 gardes**, jamais plus. Retour à la normale dès **2044**. L'algorithme espace au mieux ; c'est un
  sujet de recrutement, pas un défaut de code.
- **Équité mesurée sur 400 années** : 292 312 gardes placées, **0 journée sans binôme**, écart maximal
  annuel de médiane **1,20** garde. Il dépasse 2 dans 5 % des années et **3 dans 0,8 % (3 années sur
  400)** — les trois dépassements sont **tous** dans le creux démographique, le pire étant **3,5**.
  À effectif normal (plus de 16 gardeurs, 280 années), le pire observé est **2,3**. La garantie
  défendable est donc **« jamais plus de 4 »**, pas « jamais plus de 3 » comme annoncé avant le 29/07.
- **La démographie repose sur deux hypothèses fragiles, à connaître avant d'en tirer un argument.**
  Les **années de naissance n'existent nulle part ailleurs que dans `simulateur/demographie.js`** —
  `MEDECINS` n'a pas de colonne de naissance, rien ne les recoupe. Et toute la courbe est portée par
  l'**exemption de garde à 60 ans** : sans elle, la charge d'un temps plein **ne dépasserait jamais
  38,6 gardes/an** sur vingt ans, au lieu de monter à 52. Le modèle applique aussi cette exemption dès
  2027 (deux MAR concernés) alors que la génération réelle ne le fait pas — d'où une courbe qui démarre
  à 39,7 quand la cible réelle 2027 est 34,6.
- **L'algo de gardes ne dépend PAS des secteurs** (gardes = G / G2) → réorganiser les secteurs ne touche jamais l'équité.
- Secteurs définis dans une **source unique `SECTEURS_CFG`** en haut d'`admin.html`.
- **PRUNET** (`souhait_plafond`) : ses souhaits sont honorés en priorité (43 mardis en 2027, 44 gardes au total, zéro week-end) ; **il reste dans le pool proportionnel** (décision assumée). Chiffres réels 2027 : cible **44,0**, réalisé **44**, contre 34,6 pour un temps plein. Conséquence connue : les cibles des autres sont **légèrement surestimées** (~+0,6 garde/100 %) puisque BP consomme plus que sa part → les autres finissent un poil sous leur cible. Normal, dans le bruit du plancher arithmétique. Dans la vue d'équité, PRUNET s'affiche en profil **« SOUHAITS · hors cible »** (barres neutres, pas de trait de cible).

## Robustesse d'affichage (équité)
- Toute cible non plausible (date parasite dans une cellule, valeur aberrante type timestamp) est lue comme **« pas de cible » (`—`)** — garde `_cib`/`_cibNum` (admin + index, initiale + instantané). N'invente pas une cible : si une cellule CIBLE de `STATS_GARDES` contient une date, corriger la donnée dans le Sheet (ou régénérer).

## Secteurs : la source est l'onglet `SECTEURS`

L'onglet **pilote réellement** `admin.html` et `index.html` (vérifié le 20/07/2026 : une édition
du tableau remonte à l'écran). **14 colonnes** :
`ORDRE | CODE | LABEL | COURT | AFF | ICON | BG | FG | CS | ACTIF | RENDEMENT_LIB | XL_LABEL | XL_BG | XL_ROWS`.
`getOrCreateSecteursTab()` **n'écrase jamais** une ligne existante.

**Trois colonnes décident du comportement d'un secteur — à connaître avant d'en créer un :**

| Colonne | Rôle |
|---|---|
| `ACTIF` | `N` = ignoré partout, sans être supprimé (garde l'historique) |
| `AFF` | **rempli = affectable au mois** et apparaît dans la vue Affectations ; **vide = secteur d'affichage seul** (cas de `DVI`). C'est ce que lit `normalizeAffectation` pour accepter un code |
| `RENDEMENT_LIB` | socle du futur pilotage libéral (FORT / MOYEN / NUL / REA) |

**Colonnes `XL_*` (07/2026) : ce que l'EXPORT EXCEL doit écrire.** Le fichier du vendredi reprend
l'ancien tableau papier et n'affiche PAS la même chose que le web — majuscules, couleurs franches,
1 ou 2 lignes selon le secteur. **Aucune conversion automatique ne donnerait les couleurs actuelles**
(`#EFF6FF` côté web contre `FFE699` côté Excel : aucune parenté). D'où trois colonnes saisies,
ajoutées **en fin de tableau** pour ne pas décaler les index 0-10 que `getSecteurs()` lit.
Laissées **vides** → défauts appliqués : `COURT` en majuscules, gris `F2F2F2`, 2 lignes. Un secteur
créé sans les remplir apparaît donc quand même dans l'Excel. Les 9 secteurs actuels sont pré-remplis
par `_migrerColonnesXL_()` (idempotente, n'écrase jamais une saisie).
⚠️ **(29/07/2026) Il n'existe plus aucun repli en dur** : les 6 copies figées d'`admin.html` ont été
supprimées. Un échec de lecture affiche le bandeau rouge `configBanner` et **bloque l'export Excel**,
au lieu de faire tourner les pages sur une config périmée sans le dire.
`VOLANT` et `CS` sont des pseudo-secteurs, hors onglet.
⚠️ `assets/vendor/lucide-icons.js` ne contient que **17 icônes** : aucune icône de secteur
(Activity, HeartPulse, Bone…) n'y est. `admin.html` **ne charge aucune bibliothèque lucide** —
d'où l'absence d'icônes de secteur sur cette page, contrairement à `index.html` (CDN unpkg).

## Consultation libérale endoscopie
- La consultation libérale d'endoscopie (mardi/jeudi PM) est marquée **`entry.lib=true`** côté GAS, via le tag **`LIB`** en **colonne E (COMMENTAIRE)** de `PLANNING_OVERRIDES`. Dans `index.html`, la puce Endoscopies porte un **badge « LIB »** violet (desktop + mobile) + légende conditionnelle. Cohérent avec le rendu admin.
- **Attribution 100 % manuelle** : le comité clique le marqueur LIB dans l'onglet Planning → l'override est écrit avec le commentaire `LIB`. Les créneaux `CS-END` eux-mêmes viennent de `CS_TEMPLATE` (`code.gs`) et ne dépendent d'aucun override.
- ⚠️ **La rotation automatique a été SUPPRIMÉE (20/07/2026)** — objet `ROT`, assistant « ⟳ Rotation libérale », overlay et action `applyRotationLib` retirés, faute d'usage réel. Le tag `ROT-LIB` n'existe plus : les lignes existantes ont été converties en `LIB` par la fonction one-shot `convertirRotLibEnLib()` (elle-même retirée après usage), ce qui a préservé à l'identique les créneaux déjà attribués. **Ne pas reproposer d'automatisation de cette rotation.**
- ⚠️ **`setLibSoliste` n'a jamais existé** dans le dépôt : cette doc l'a longtemps annoncée comme « à recopier », mais aucune trace dans les `.gs` ni dans `admin.html`. Mention supprimée le 20/07/2026. Rappel : **le dépôt fait foi**, pas ce fichier.

## Module libéral — pilotage 30 % : cadrage du 24/07, élargi le 26/07/2026

### Lot 2 ÉLARGI (26/07/2026) — la déclaration porte la spécialité et le montant
**Décision d'Arthur.** La déclaration d'intervention (Lot 3, en prod) cesse d'être un simple signal
de placement : elle porte désormais la **SPÉCIALITÉ** et le **MONTANT (BR)**. Elle devient donc la
source du **rendement par spécialité**, qui n'a plus à être déduit par moindres carrés.

- **Granularité : une ligne = UN PATIENT.** La fusion « même MAR + même jour + même secteur » de
  `declareLiberal` disparaît (elle rendait les interventions incomptables : 8 cataractes = 1 ligne).
- **Schéma `LIBERAL_{Y}` à 9 colonnes** : `+ SPECIALITE, BR_CCAM, BR_NGAP`.
  ✅ **EN PRODUCTION depuis le lot 2A (27/07/2026)** — `portail.gs` écrit les 9 colonnes.
  *(Cette ligne a longtemps indiqué « pas encore en production » : c'était FAUX, corrigé le
  29/07.)* Les lignes anciennes gardent leurs 6 colonnes remplies : **aucune migration**.
- **BR seule, jamais le DH** (hors quota). `BR_CCAM` datée du **bloc**, `BR_NGAP` datée de la
  **consultation** — souvent deux mois différents ; sans cette séparation le recoupement bi-axial
  est faux. `DATE_CONSULT` cesse d'être informative et devient éditable.
- **Onglet `SPECIALITES`, 12 codes** : `OPH ORL VIS URO ORT END GYN PED CI RI VAS AUT`. Plus fine que
  le secteur là où un secteur mélange deux rendements (`OPH` ≠ `ORL`, `URO` ≠ `VIS`). Règle actée :
  **patient mineur ⇒ `PED`**, quelle que soit la chirurgie.
- **Le rendement se VENTILE, il ne se somme pas** : le relevé certifié fixe le niveau, les BR
  déclarées fixent la structure, on répartit au prorata. Sommer les BR déclarées donnerait un
  rendement plausible et faux. Toujours afficher le **n** d'interventions à côté d'un rendement.
- **Trois étapes : 2A** déclaration enrichie → **2B** saisie du relevé + marges → **2C** taux de
  couverture puis rendement. Le 2A d'abord (le relevé est rattrapable, la déclaration non) — **mais
  sans urgence tant qu'Arthur est le seul `LIBERAL=O` dans `MEDECINS`** : rien ne se perd, le
  chronomètre démarre le jour de l'ouverture aux autres. Le 2A doit être **rodé avant**.
- **Ergonomie retenue (option B)** : bouton **« Déclarer ce parcours »** sur une ligne cotée, qui
  descend tout (date, spécialité, BR) en un clic — plutôt que de rendre le montant obligatoire. Les
  deux blocs de la page libérale (calculette en haut, déclaration en bas) sont aujourd'hui
  **étanches** : la déclaration ne récupère que la date de bloc et le libellé de chirurgie, jamais
  le montant ni le secteur.

### Lot 2B livré (27/07/2026) — le relevé et le suivi
- Onglet **`LIBERAL_CA_{Y}`** + `getReleveLiberal`. ⚠️ **Lecture seule** : Arthur recopie le relevé à
  la main, **rien ne passe par `admin.html`** (le comité gère le planning, pas le libéral).
- Onglet créé pré-rempli par `creerReleveLiberalAnneeEnCours()`. **Checksum en formules**, vérifié au
  centime : le total « ACTIVITÉ LIBÉRALE » est bien la somme des excédents **des deux axes**.
- ⚠️ Formules posées par le code : **noms anglais obligatoires** (`IF`, `ROUND`) — `SI`/`ARRONDI`
  renvoient `#NAME?` même dans un classeur français.
- **Rattrapage par juin seul** : le relevé est cumulé, un mois suffit à connaître la position.
- Page **`suivi-liberal.html`** (racine) : position par axe, groupe en initiales, totaux par axe,
  **aucune projection**, colonne « D'ici décembre » **descriptive** (pastilles colorées).
- Tuile Dashboard **qui se sépare en deux** : Cotation & déclaration / Suivi des 30 %.
- ⚠️ **10 MAR sur 18 en excédent** au cumul de juin, dont 2 sur le seul axe NGAP. Fragilise
  l'hypothèse du gel du Lot 5 — à revérifier sur plusieurs mois.
- ⚠️ **Code d'accès insensible à la casse** (`checkCode`) : touche **toutes** les pages.

### Cotations types (27/07/2026) — après le 2A
- Onglet **`COTATIONS_TYPE`** (`GROUPE · NOM · ORDRE · CODE · ROLE · MOD7 · MODA · LC`) + action
  `getCotationsType`. Amorcé sur le groupe **Endoscopie** : *Gastro + colo* (`HHQE002` principal +
  `ZZLP025` associé 50 %), *Gastro seule*, *Colo seule*. Un bouton remplit le tableau de cotation.
- **Rien n'est affiché tant qu'aucun contexte n'est choisi** ; choix mémorisé pour la session.
- **Aucun tarif stocké** (il vient de l'index CCAM), **uniquement des lignes d'activité 4**, **aucun
  modificateur d'urgence** — il n'y a pas de libéral en urgence au CHPG.
- **Modificateur 7 coché par défaut** partout ; **tableau de cotation vide au démarrage**.
- ⚠️ **Index CCAM : codes v83, tarifs v80.** Écart d'environ 1,40 € sur `HHQE002`, systématique.
- ⚠️ **Clés de `sessionStorage` versionnées** : une colonne ajoutée à un onglet reste invisible tant
  que la session n'est pas fermée. Incrémenter le suffixe à chaque changement de structure.

Détail complet : `module_liberal_conception.md` **v4.2** — §5.4 bis, décisions 32 à 44.

### Lot 2 (compteur) — architecture du 24/07, toujours valable sauf sur un point
⚠️ **Amendement du 26/07** : la déclaration ne porte plus seulement du **volume**, elle porte aussi
des **euros estimés (BR)**. Reste entièrement vrai : **jamais un % issu des seules déclarations.**
Le **relevé administratif mensuel** est le **socle certifié en euros**. C'est la **seule** source
qui connaît le **dénominateur** (activité publique du MAR), donc la seule capable de donner un
**pourcentage** de plafond. La **déclaration d'intervention par le MAR** (Lot 3, déjà en prod) peut
faire monter un compteur **en temps réel entre deux relevés — mais en VOLUME d'interventions
uniquement, jamais en %.** Deux raisons : elle ignore l'activité publique (le dénominateur), et un
acte déclaré n'est pas un euro encaissé (cotation, délais, rejets). **Afficher un % issu des seules
déclarations donnerait un chiffre faux — et faux dans le sens dangereux** (dirait « vas-y » à qui
doit s'arrêter). Modèle retenu : *position certifiée au dernier relevé (en €, avec %) + tendance en
volume accumulée depuis*. L'arbitrage pouvant être mensuel, le relevé est mensuel → l'écran de
saisie garde son sens (17 lignes × 6 nombres, checksum sur Σ des excédents **recopiés**, monotonie
du cumul). Maquette de saisie explorée, non poussée.

### Lot 5 (orientation financière par la secrétaire) — GELÉ, mais hypothèse à revérifier

> ⚠️ **Constat du 27/07/2026 : 10 MAR sur 18 sont en excédent** au cumul de juin, dont **2 sur le
> seul axe NGAP** — non corrigeables par la réa. Cela **fragilise le motif (2) du gel ci-dessous**
> (« le dépassement s'efface arithmétiquement avec les deux entrants »). À revérifier sur deux ou
> trois mois consécutifs avant de confirmer ou lever le gel.
L'idée initiale : router chaque patient vers le MAR le plus loin de son plafond. **Gelée**, pas
abandonnée. Raisons : (1) elle dépend du Lot 2 (le plafond n'existe pas encore) et d'un horizon de
placement porté à 3–4 semaines ; (2) le dépassement du groupe s'efface **arithmétiquement** avec les
deux entrants (Arthur oct. 2026 + un autre janv. 2027 ≈ 82 k€ de plafond libre, vs ≈ 44 k€ reversés
au S1) ; (3) au-dessus de 30 %, un acte parti en public **n'est pas une perte** — il gonfle le
dénominateur et libère du plafond. Le Lot 5 optimiserait un problème en voie de disparition.
**Règle : ne pas le coder tant que le Lot 2 n'a pas prouvé, sur données réelles, un dépassement
persistant après les deux arrivées.** Conception complète conservée au §11 ter.

Mesures réelles conservées (semaine 25, juin 2026, à ne pas réestimer) : **89 patients
lib/semaine**, **75 %** déjà bien appariés, **20 déplacements** (22 %), délai consult→bloc **médiane
6 j**. Vivier CI **1** / MAT 1 / ORL 2 / ORT 2 → 6 déplacements CARDIO/semaine **irréductibles**.
⚠️ `p ≈ 1/3` était **faux d'un facteur deux** (consultations typées par secteur).

### Lot 5-bis (contrôle d'absence) — ✅ **EN PRODUCTION depuis le 25/07/2026**

> ⚠️ **Ce titre indiquait « conçu, non codé » : c'était FAUX.** Le lot est livré et tourne
> (`absences.html` à la racine, action `getConsultAbsences` dans `Indispos.gs`, tuile Dashboard,
> session secrétariat). **Ne pas le reconstruire.** Recadrage et mise à niveau de l'écran le
> 28/07 (site v1.14.1). Ce qui suit est la **conception d'origine**, conservée pour comprendre
> les décisions — pas un chantier à mener.
Extraction de la **jambe inoffensive** du Lot 5 : ne route rien, ne compte rien, n'écrit rien,
**aucune donnée patient**. **Besoin :** un patient vu par Dr X sera opéré par Dr X ; si le bloc
tombe un jour d'absence de Dr X, le patient est mal placé dès la consultation. **Outil :** la
secrétaire d'anesthésie ouvre, **au coup par coup pour un MAR donné**, ses **absences sur 3–4
semaines** et les compare à la main avec sa liste de dates de bloc (qu'elle possède déjà).
**Forme A** (l'outil affiche les absences, la secrétaire compare) — pas de forme B (saisie des dates
patient), pour ne créer ni donnée patient ni travail aux secrétaires des chirurgiens.

- **« Absent »** = jour où le MAR **n'est pas là** : RG, VAC, FORM, CL, CP, absence. **Pas** un jour
  travaillé sur un autre secteur (réa, autre bloc) : ce jour-là il peut récupérer son patient.
- ✅ **Faisable — vérifié en lecture de code (24/07).** `Indispos.gs` ~l.2773
  `ABSENT_CODES_SET = {RG,V,CP,F,CTP,A,CL}` définit déjà « absent ce jour », exploité en prod ; cas
  particuliers gérés (`tpJoursFixes`, dates début/fin, rythme 2/2 `estSemaineOff`). L'outil est ce
  **même calcul retourné** : figer le MAR, boucler sur ~20–28 jours. **Nouvelle action de LECTURE**,
  zéro écriture, zéro nouvelle donnée.
- ✅ **RÉSOLU (24/07) — lire `GARDES_{Y}` SEUL suffit.** Vérifié sur les **deux** chemins
  d'écriture, pas par analogie : (a) **campagne d'indispos** → `generateur_gardes.gs` **l.1283**
  recopie les indispos dans GARDES en les traduisant (`VAC→V`, `INDISPO→I`, `FORM→F`, `CL→CL`,
  `TP/CTP→TP`) — exactement les codes de `ABSENT_CODES_SET` ; (b) **absence longue** →
  `Indispos.gs` **l.3074** écrit `CL` dans GARDES *et* INDISPOS (commentaire : « CL écrase tout
  (gardes + RG) »). Unique exception : année **non encore générée**, le CL ne va que dans INDISPOS
  — sans objet pour cet outil (fenêtre 3–4 semaines ⇒ toujours l'année en cours, générée).
- **Liste des consultations à venir = `PLANNING_OVERRIDES`** (`DATE | MAR_ID | SECTEUR_MATIN |
  SECTEUR_AM | COMMENTAIRE`). `GENERER_CONSULTATIONS = false` (`code.gs` l.255) : les consultations
  **ne sont pas générées**, le comité place chaque MAR à la main. `CS_RULES` ne fournit que le
  **gabarit** (nombre de créneaux par jour), **jamais le nom du titulaire**.
- ✅ **Prérequis d'horizon — LEVÉ (Arthur, 24/07).** « Les consultations seront posées à horizon
  4 semaines. » L'écran ne pouvant lister que les consultations **déjà nommées**, cet engagement
  débloque le lot : plus aucun obstacle bloquant, ni technique ni organisationnel. ⚠️ Ne pas confondre avec
  le prérequis du Lot 5, **bien plus lourd** : ici **rien ne change** pour les secrétaires des
  chirurgiens ni pour le flux patient — c'est une seule habitude interne du comité. Coût réel :
  s'engager plus tôt, et retoucher un placement quand une absence tombe après coup.
- ❓ À traiter à la maquette : override **modifié après coup** (MAR remplacé sur son créneau) —
  l'outil suit le nouveau titulaire, mais les patients déjà placés sur l'ancien ne bougent pas.
- ✅ **Accès — acté 24/07/2026 : UNE page, DEUX portes.** Page unique à la **racine**, même vue en
  lecture seule pour tous. Entrée (a) **code personnel MAR** (mécanisme existant) ; entrée (b)
  **code partagé du secrétariat**, nouveau, rangé dans `CONFIG`, de **forme distincte** des codes
  MAR (pour désambiguïser au login) et **changeable en une ligne** s'il circule trop.
  → **Nommer par la fonction, pas par l'utilisateur** : `absences.html` /
  `controle-absences.html` — **pas** `secretariat.html`.
- ✅ **Périmètre — acté 28/07/2026 : cet écran ne concerne QUE le libéral**, jamais le public.
  Conséquences directes : la tuile porte `liberal:true` (**réservée au groupement**, `LIBERAL = O`,
  19 membres) ; seuls les membres du groupement sont proposés comme remplaçants — un non-membre ne
  peut pas prendre un patient libéral ; le serveur ne renvoie aucun montant à un non-membre
  (`if (!user.liberal)` dans `getConsultAbsences`), le masquage de la tuile ne protégeant rien
  puisque la page est publique.
- **Qui est proposé — couverture jour par jour, 28/07/2026.** Un confrère couvre le jour *i* s'il est
  **présent ce jour-là** et a une consultation **strictement avant**, celle-ci pouvant tomber
  **pendant** la période d'absence. Les plages couvertes sont affichées, aucun candidat n'est tronqué.
  → Remplace deux critères absolus (« présent sur toute la période », « consultation avant le début »)
  qui renvoyaient **« personne »** sur un congé réel de 19 jours ouvrés. Supprimés, pas amendés.
- **Classement des remplaçants — 28/07/2026.** Marge CCAM décroissante, calculée **côté serveur**
  dans `getConsultAbsences` : `getReleveLiberal` reste hors de `SECRETARIAT_ACTIONS`, et la réponse
  ne transporte qu'une marge par MAR, jamais tarifs, pourcentages ni excédents. L'appartenance vient
  de la **colonne `LIBERAL` de MEDECINS**, jamais du relevé — un membre au mois non saisi serait
  sinon retiré à tort. Aucune troncature : tous les candidats sont affichés.
  → Le jour où le secrétariat prend cette mission : remplacer la valeur par un rang quand
  `avecMotifs === false`. Une ligne, un seul endroit, la page ne bouge pas.
- 🔒 **Motif d'absence : VISIBILITÉ SELON LE RÔLE (acté 24/07).** Session **MAR** (code personnel,
  via la tuile Dashboard) → dates **+ motifs**. Justification : les MARs voient déjà le planning
  complet dans `index.html`, leur masquer le motif n'aurait aucun sens. Session **secrétariat**
  (code partagé) → **dates seules**.
  ⚠️ **Le filtrage se fait au SERVEUR, jamais au client.** L'action GAS ne renvoie pas les codes
  (`V`, `CP`, `F`, `RG`, `CL`, `TP`) dans une session secrétariat : les masquer en JS les
  laisserait lisibles dans le source de la page. **Deux réponses distinctes selon le rôle
  authentifié** → une page unique, **deux rendus**. C'est la contrainte la plus facile à oublier
  au moment de coder. *(À vérifier avant de coder : que l'action GAS identifie le type de session.
  Le code d'entrée étant transmis à chaque appel, a priori simple — mécanisme non lu à ce jour.)*
- **Session MAR : la file est filtrée sur ses PROPRES consultations (acté 24/07).** Usage visé : le
  MAR contrôle lui-même que ses patients ne seront pas opérés un jour où il est absent ; le panneau
  de droite montre alors toujours ses propres absences.
  ❓ **À trancher :** filtre **exclusif**, ou **actif par défaut avec bascule « voir tous »** ?
  Aucune raison de confidentialité de masquer les collègues (le planning leur est déjà visible) —
  c'est une question d'usage : un MAR peut vouloir vérifier un collègue lors d'un échange.
- **Exposition, acté explicitement :** pour les **MARs**, rien de neuf (le planning complet est déjà
  dans `index.html`). Pour le **secrétariat**, c'est un accès nouveau à toutes les absences de
  l'équipe — c'est l'objet de l'outil. Fuite du code partagé sans gravité : aucune écriture, aucune
  donnée patient, uniquement des dates.
- ⚠️ Ne pas réutiliser `getMARsDispoJour` tel quel (garde `TP`/`R` dans sa liste d'absence).
- 🎨 **Maquette v3 — `docs/module-liberal/maquette_controle_absence.html`** (poussée le 24/07 ;
  non fonctionnelle ; rééditer toujours ce chemin, la version vit dans l'en-tête du fichier). File des consultations posées à gauche, groupées par
  jour, **secteur affiché en clair** (Viscéral, ORL, Endoscopie… pas le code `CS-*`) ; pastille
  pleine/grise = ce MAR a ou non des absences **pertinentes pour CETTE consultation**. Clic →
  panneau droit : périodes à éviter, encadré « qui peut le prendre », grille 4 semaines, état
  « aucune absence » explicite. Vérifié par simulation : **92 créneaux = 23/semaine** (conforme à
  `CS_RULES`) et **aucun médecin proposé n'est absent** le jour visé.
- ⏱ **Fenêtre = 4 semaines À PARTIR DE LA CONSULTATION SÉLECTIONNÉE**, pas depuis aujourd'hui
  (acté 24/07). Une absence antérieure à la consultation est sans objet : le patient sera opéré
  *après* l'avoir vue. Conséquence à ne pas rater : **l'horizon de données doit dépasser de
  4 semaines la dernière consultation affichée** (dans la maquette, 45 jours ouvrés de données
  pour 20 jours de consultations).
- 📅 **Jours consécutifs regroupés en plages** (« 10 – 14 août » plutôt que cinq dates). Règle de
  fusion **différente selon le rôle** : vue **MAR** → fusion **à motif identique** (le motif étant
  affiché, deux motifs ne tiennent pas dans une seule plage) ; vue **secrétariat** → fusion **sans
  regarder le motif** (il n'est pas affiché).
  ⚠️ **Corollaire serveur : le regroupement se fait APRÈS le filtrage par rôle, jamais avant** —
  sinon on regrouperait sur une information que la secrétaire n'a pas le droit de recevoir.
- 🔎 **« Qui peut prendre ce patient ? » — acté 24/07.** Clic sur une période → MARs **présents sur
  TOUTE la période** (la proposition reste donc valable quel que soit le jour du bloc) **et ayant
  une consultation AVANT** cette période (impossible de voir en consultation un patient déjà
  opéré). Affichés **même secteur d'abord**, puis autres secteurs. C'est la **question inverse** de
  l'écran principal, déjà servie en production par `getMARsDispoJour`. Reste de la **lecture pure**
  : zéro écriture, zéro donnée patient. Rend le prérequis d'horizon 3–4 semaines encore plus
  déterminant (il faut des créneaux nommés pour proposer une alternative).
- ❌ **Notification au MAR sur sa tuile Dashboard — ÉCARTÉ (24/07).** Supposerait que le système
  connaisse les patients : il n'en connaît aucun, et c'est précisément ce qui rend le module simple
  et sans risque (contrainte 3.bis). Sans identité patient, la notification ne dirait que « votre
  consultation a changé » — le MAR ne pourrait ni refuser ni agir. Coût : créer un système de
  notifications inexistant, et faire passer l'écran de « lecture seule » à « écrit »
  (`WRITE_ACTIONS_LOCK`, verrous, réconciliation). Arthur : « tant pis ».
- ⚠️ **Règle générale — le dépôt est PUBLIC : aucune maquette ne doit contenir de noms réels de
  praticiens** (y compris dans les commentaires de code). Noms fictifs systématiques.

**Pistes abandonnées, à ne pas rouvrir.** *Attribution au fil de l'eau* (une consultation porte
plusieurs patients aux dates de bloc différentes, aucune permutation ne les satisfait tous).
*Interface patient* (sortirait du périmètre interne : identification, données de santé,
responsabilité → projet DSI).

Détail complet : `docs/module-liberal/module_liberal_conception.md` §11 ter.


## Version du site (badge `vX.Y.Z`) — actuellement **v1.14.14**

### 🔴 RÈGLE PERMANENTE (demandée par Arthur le 20/07/2026)

**Toute modification d'une page visible — `admin.html`, `index.html`, `dashboard.html`,
`indispos.html`, `staff.html` — DOIT s'accompagner d'une montée de version, dans le même push.**
Ne jamais livrer un changement d'interface sans incrémenter : le badge doit toujours dire la vérité.

| Nature du changement | Incrément | Exemple |
|---|---|---|
| Petit patch, correction, ajustement visuel | **3ᵉ chiffre** — `1.6` → `1.6.1` | cases cliquables au survol |
| Fonctionnalité notable, changement de comportement | **2ᵉ chiffre** — `1.6.1` → `1.7` | bascule des consultations sur l'onglet |
| Refonte majeure | **1ᵉʳ chiffre** — `1.x` → `2.0` | branchement du module libéral |

Une modification purement GAS (sans page touchée) ne change PAS la version du site : elle a ses
propres constantes `GAS_VERSION_*`.

**4 fichiers, 10 emplacements.** *(Corrigé le 29/07/2026 : ce document annonçait « 5 fichiers,
9 emplacements » et comptait `guide-technique.html`, qui ne porte aucune version — vérifié dans le
fichier ET dans le code du Diagnostic, qui ne contrôle que 4 fichiers.)*
Penser au badge HTML **en dur**, visible avant connexion tant que le JS ne l'a pas remplacé.

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · `id="verBadge">vX.Y<` · `// SITE_VERSION: vX.Y` |
| `admin.html` | idem (3) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · `<!-- SITE_VERSION: vX.Y -->` |
| `docs/guide-comite.html` | idem (2) |

Total : 3 + 3 + 2 + 2 = **10**. Le 🔍 Diagnostic (section « Version du site ») compare **toutes**
ces formes, dans chaque fichier et entre fichiers, et signale `INCOHÉRENT (…)` en listant les valeurs divergentes.
⚠️ Avant le 20/07/2026 il ne lisait que le **marqueur en commentaire** : il annonçait « alignés (v1.4) »
alors que 3 fichiers sur 4 affichaient v1.0 aux utilisateurs. Ne pas revenir à ce contrôle partiel.

## Créer un secteur / une consultation → **§ 18 du guide technique**

La marche à suivre complète (colonne par colonne, avec exemple) est dans
`docs/guide-technique.html`, chapitre 18. **Ne pas la dupliquer ici.** L'essentiel :

- Tout se règle dans **2 onglets** : `SECTEURS` et `CS_TEMPLATE`. Aucun code, aucune recopie.
- **`AFF` est le pivot** : rempli = secteur affectable au mois (sélecteur + légende) ; vide =
  secteur d'affichage seul (cas de `DVI`).
- **`CODE` ne se renomme JAMAIS** une fois en service (écrit dans `AFFECTATIONS_{Y}` et
  `PLANNING_OVERRIDES`). Pour changer d'organisation : ajouter des lignes, passer les anciennes
  à `ACTIF=N`.
- Colonne **`CS`** de `SECTEURS` = lien vers la consultation rattachée. Sert à proposer en tête les
  MAR du bon secteur dans le panneau de placement. Facile à oublier en créant une consultation.
- Un secteur **n'apparaît que s'il est utilisé** (légende, planning, Excel sont construits sur les
  secteurs réellement affectés). Après une affectation, **recharger la page** : la légende n'est
  recalculée qu'au rendu complet — `applySecteurAff()` ne la rafraîchit pas (défaut ancien, assumé).
- **Supprimer une ligne ≠ neutre** : les affectations gardent l'ancien code et basculent en VOLANT
  à la publication. Le diagnostic le signale en erreur, et `LOGS` trace le code inconnu.

⚠️ **Chercher les listes figées dans le HTML autant que dans le JS.** Le sélecteur de secteur des
Affectations était une suite de `<option>` en dur (corrigé le 21/07/2026) : trois patchs corrects
sont restés sans effet tant qu'il bloquait. Seul un test de bout en bout l'a révélé.

## Export Excel hebdomadaire (`exportWeekExcel` dans `admin.html`)

Le fichier envoyé chaque vendredi à l'équipe. Reproduit un **gabarit historique** (l'ancien
tableau papier). ⚠️ Le gabarit de référence d'Arthur contient encore une ligne `PEDIATRIE` et
fusionne `CARDIO/RADIO`, que le code ne génère pas : ce n'est donc PAS une sortie de l'appli.

**⚠️ PIÈGE ExcelJS — a cassé la production le 20/07/2026.** Écrire dans une cellule **esclave**
d'une fusion écrit en réalité dans la **cellule maître**. Un `mergeCells` suivi d'un
`cell(droite).value = ''` **efface la valeur de gauche**. Règle : **écrire les deux cellules,
PUIS fusionner** (préserve aussi bordures et remplissage).
👉 ExcelJS s'installe en local (`npm i exceljs`) : **tester le rendu d'un vrai classeur**,
`node --check` ne prouve rien sur ce terrain.

**Mise en page — ne pas se tromper de contrainte.** L'échelle d'impression retenue par Excel est
la **plus petite** entre celle imposée par la largeur et celle imposée par la hauteur. Ici c'est
la **largeur** qui commande (29 colonnes). Toucher à `fitToHeight` n'a aucun effet tant que la
largeur est le facteur limitant — erreur commise et poussée en production avant d'être corrigée.
Valeurs actuelles : col. 1 = 17, col. 2-21 (planning, initiales) = **4.5**, col. 22-29
(annuaire) = **7** ; lignes 14 pt ; `fitToWidth:1` + `fitToHeight:0` ; `printArea` explicite.
→ ~30 cm de large, **échelle ~95 %**.

**Lignes pilotées par les onglets** (depuis le 21/07/2026) : `BLOCS`/`SX` ← `SECTEURS`, `CSROWS` ← `CS_TEMPLATE`, via les colonnes `XL_*`. Repli sur les valeurs historiques si les onglets ne sont pas chargés.

**Structure verticale ancrée sur le compteur de blocs**, plus sur des numéros en dur :
`R_CS` (bandeau consultations) → `R_CSR` (7 lignes) → `R_ABS` (**ABS_ROWS** lignes, calculées sur
le pic d'absents de la semaine) → `R_FN` (GARDE REA, GARDE ANESTH, 8H/18H, SORTIES) → `R_INFO`
(3 lignes) → `R_LAST`. **Ajouter un bloc ne casse plus rien.**

**Limites connues et assumées** : les SORTIES de garde ne distinguent pas réa/anesthésie (statut
`RG` unique) ; au-delà de **13 absents** le tableau passe sur 2 pages (préféré à des noms perdus).

## Règles métier à NE PAS « simplifier »

Ces règles encodent l'organisation réelle du service. Elles ont l'air d'incohérences dans le code ;
elles n'en sont pas.

- **Secteur interventionnel** : UN SEUL MAR affecté au mois. `RI` (radio) n'existe que **mercredi et
  jeudi matin** ; `CI` (cardio) est présent le mercredi. Le mercredi = **2 postes pour 1 personne**,
  donc la radio flashe **en permanence, même quand tout va bien** (le MAR tient la cardio par
  convention). Le jeudi il bascule en radio.
  - ⚠️ **`RI` n'est PAS dans `COVERAGE` et ne doit pas y entrer** : sa règle `RI_REQ_AM =
    {mercredi:1, jeudi:1}` dépend du JOUR, pas de la présence d'un titulaire — c'est plus fin.
  - ⚠️ L'exclusion `if (s.code === 'CI' && dow === 3)` (jeudi) est **volontaire**.
  - ⚠️ **Jeudi APRÈS-MIDI : aucun bloc pour lui** (`afternoon = ''`). Il n'y a jamais de cardio le
    jeudi ; il est en consultation, il ne peut pas être au bloc. Le code le laissait en `CI` « pour
    justifier la consult » — corrigé le 20/07/2026, ne pas rétablir.
  - Projet de colonne `COUVERTURE` dans l'onglet SECTEURS : **ÉTUDIÉ PUIS ÉCARTÉ** pour ces raisons.
- **`DVI` n'est PAS un secteur** : c'est une **vacation du mardi matin** réservée aux MAR habilités
  (`DVI_ALLOWED`), posée directement par la génération. Discriminant technique : sa colonne `AFF` est
  **vide** dans l'onglet SECTEURS → il n'est pas affectable au mois.
- **Aucune consultation n'est attribuée automatiquement** (`GENERER_CONSULTATIONS = false`) : **le
  comité place chaque créneau à la main**, et c'est une volonté explicite d'Arthur.
  - **Seule exception : la consultation MATERNITÉ** (mardi/jeudi matin). Qui est sur la ligne MAT est
    reporté automatiquement sur `CS-MAT` — c'est la même personne. **Sens unique** : une consult
    CS-MAT remplie ne force personne dans MAT (MAT flashe, le comité choisit).
- **Le flash n'est PAS un besoin réel** : il dit « un MAR affecté ici est absent aujourd'hui », pas
  « il manque quelqu'un ». Le système ignore la programmation opératoire — 3 MAR au viscéral suffisent
  parfois là où il en faut 4. C'est au comité de juger.

## Cases du planning (admin) : signal ≠ action

- **« + » ORANGE clignotant = SIGNAL** : écart détecté (MAR affecté absent, non remplacé). Inchangé.
- **« + » GRIS au survol = ACTION** : placer quelqu'un, **partout**, y compris sur une case déjà
  occupée. Le tiret `—` des cases vides est cliquable. Jamais de gris en même temps qu'un orange.
- **Week-ends et fériés : NON cliquables**, volontairement (seules les 2 gardes y figurent). Ils
  passent par un rendu séparé — `makeSlot` ne les traite pas.

## Consultations : où vit la vérité

- **✅ SOURCE = onglet `CS_TEMPLATE`** depuis le 20/07/2026 (testé en production). `admin.html`
  appelle `getCsTemplate` au chargement et remplace ses 3 tables. Éditer l'onglet suffit à
  ouvrir/fermer un créneau. Colonnes : `CODE | LABEL | OUVRABLE | ACTIF | LUN_AM … VEN_PM`.
  `CODE` = clé technique (écrite dans `PLANNING_OVERRIDES` et le planning publié) : **ne jamais la
  renommer** ; pour changer d'organisation, ajouter des lignes et passer les anciennes à `ACTIF=N`.
  `LABEL` est libre (affichage seul).
- **`CS_TYPES`, `CS_OPENABLE`, `CS_REQUIRED`** (`admin.html`) sont **globales** (`let`) et
  remplies par `getCsTemplate`. ⚠️ **Il n'y a plus de repli silencieux** (29/07) : en cas d'échec
  de lecture, `CONFIG_KO.cs` reste vrai et un **bandeau rouge** le dit. Une page vide vaut mieux
  qu'une page fausse.
- **`CS_REQUIRED`** (`admin.html`) = anciennement la table **ACTIVE** : effectifs requis par jour et
  demi-journée. **GLOBALE depuis le 20/07/2026** (elle était locale à `renderWeek`), car
  l'export Excel en a besoin pour fusionner les cases à créneau unique. Une seule table.
- **`CS_RULES`** (`code.gs`) = **CODE MORT** : enfermé dans `if (GENERER_CONSULTATIONS)` qui vaut
  `false` depuis que le comité place les MAR à la main. Contenu **identique** à `CS_REQUIRED`
  (vérifié créneau par créneau). Ne pas le modifier en croyant agir sur l'affichage.
- Les **fermetures de consultation** du comité (`_localCloses`) vivent en **`localStorage`**, donc
  **dans le navigateur d'Arthur seulement** : invisibles pour les autres membres du comité, perdues
  si le cache est vidé. Seule la libération des MAR (override VOLANT) est persistée côté serveur.
  C'est un **pansement ponctuel**, pas un réglage structurel — d'où le chantier `CS_TEMPLATE`.

## Onglets du classeur (rangés le 20/07/2026)

22 onglets, dont **6 MASQUÉS** car jamais édités à la main : `SEMAINES_VALIDEES`,
`ABSENCES_LONGUES`, `HISTORIQUE`, `VEILLE`, `LOGS`, `CONNEXIONS`.
⚠️ **Un onglet masqué se lit et s'écrit normalement** (`getSheetByName()` ne fait pas de
différence) — ne pas s'inquiéter de ne pas le voir. Menu Affichage ▸ Feuilles masquées, ou
`afficherTousLesOnglets()`. Rangement/couleurs : `organiserOnglets()` (`setup_annee.gs`),
one-shot réversible, à relancer après ajout d'un onglet.

## Emails du système (5 envois, tous dans `Indispos.gs`)

| Action GAS | Contenu | Volume |
|---|---|---|
| `sendCodes` | code d'accès, à TOUS les MAR actifs | ~23 |
| `sendCodesMar` | code d'accès, ciblé | 1 |
| `resetCodeMar` | NOUVEAU code (bouton 🔄) | 1 |
| `envoyerRecapIndispos` | récap des gardes (HTML) | ~23 |
| `sendCodesWithRecap` | congés + ouverture indispos (W1, HTML) | ~23 |

- **Source unique pour les 3 mails de code** : `_mailCodeAcces_(nom, code, renouvele)`. Toute
  évolution du texte, du style ou de l'année se fait **LÀ, et nulle part ailleurs** — le corps était
  auparavant dupliqué mot pour mot, ce qui avait produit une divergence d'année non détectée.
- **Année** : toujours `getIndisposYear()` (année de la SAISIE), jamais `TEST_YEAR`/`getActiveYear()`
  (année du planning en cours). Les deux divergent pendant le W1, en octobre.
- **`_indisposOuverte_()`** : la campagne est-elle en cours ? Testée sur la **présence** de la ligne
  `INDISPOS_ACTIVE` dans CONFIG — créée par le W1, supprimée par le W3. Aucun réglage à tenir à jour.
  ⚠️ `getIndisposYear()` ne répond PAS à cette question : il se replie silencieusement sur
  `getActiveYear()` quand la ligne est absente. Ce drapeau pilote le contenu des mails **et** la
  tuile « Mes indisponibilités » du portail (remonté par `login` sous le nom `indisposOuverte`).
- **⚠️ QUOTA : compte Google GRATUIT = 100 emails/jour** (pas 1500). Un envoi groupé ≈ 23. Les trois
  envois groupés appellent `_quotaEmailInsuffisant_(_marsAvecEmail_())` et **refusent avant tout
  envoi** si le compte n'y est pas — sans quoi `MailApp` échoue en cours de route et laisse la moitié
  des MAR non servis, sans trace. Si le quota est illisible, l'envoi est autorisé (choix assumé :
  ne pas bloquer le comité sur une lecture ratée).
- **Toute nouvelle action d'envoi groupé doit poser ce garde-fou.**

## Performance — ce qu'il faut savoir avant toute optimisation (28/07/2026)

**Le coût dominant est PAR APPEL, et il ne nous appartient pas.** Mesure de référence : une requête
qui ne fait rien (17 ms de travail serveur) met **2 à 3 s** à revenir, avec des pointes à 10-20 s
et des rejets HTTP 404 sporadiques. Vérifié sur **deux déploiements indépendants** (5 mesures
chacun, médianes 2,70 s et 2,31 s) : un déploiement neuf se comporte exactement comme l'ancien.
Ce socle varie dans la journée (≈1,4 s le matin, 2,5 à 7 s l'après-midi du 28/07).

**Conséquence pratique : le seul levier est le NOMBRE d'appels.** Alléger le contenu d'une réponse
ou optimiser 200 ms de lecture ne change presque rien ; supprimer un appel gagne 2,5 s. Les deux
succès du 28/07 viennent de là — placements groupés (34 appels → 1) et panneau préchargé
(10-14 appels → 0 au clic).

**Outils de mesure en place :**
- `chronoAPI()` dans la console d'`admin.html` : chaque ligne affiche **serveur / attente**
  séparément, grâce au champ `_srv_ms` que `doGet` ajoute à chaque réponse JSON.
  ⚠️ `doGet` n'est plus l'aiguillage : celui-ci s'appelle **`_routeRequete_`**, et `doGet` ne fait
  que le chronométrer. Ne pas les confondre en lisant `Indispos.gs`.
- `gas/mesure_perf.gs` : `mesurerPerf()` (coût des lectures d'onglets, du login, de l'ouverture
  admin, du Drive ; inventaire du classeur) et `mesurerDrive()` (recherche vs téléchargement).
  Lecture seule, à lancer depuis l'éditeur Apps Script, résultat dans le Journal d'exécution.
- Menu **Exécutions** d'Apps Script : durée réelle côté serveur, à croiser avec `chronoAPI()`.

**Ouverture d'admin : UN SEUL appel bloquant** (`getAdminBootstrap`), plus le préchargement du
panneau en arrière-plan. Le bootstrap livre identité, planning, affectations, médecins,
overrides, secteurs, modèle de consultations, compteur de mails ET l'existence de l'année
suivante (`anneeSuivante`). **Avant d'ajouter un appel à l'ouverture, se demander s'il ne peut
pas rejoindre le bootstrap** : un appel séparé coûte ~2,5 s de péage pour souvent moins de
200 ms de travail.

**Apps Script n'offre AUCUNE garantie de performance.** Service gratuit, partagé, sans
engagement pour un compte personnel. Le 28/07, le même code est passé de 3,1 à 6,1 s côté
serveur en trois heures, sans panne déclarée et sans rapport avec le réseau (partage 4G le
matin, wifi domestique l'après-midi, même résultat). C'est le régime normal de la plateforme,
pas un incident. Le vrai enjeu d'un changement d'hébergement n'est donc pas la vitesse moyenne
mais la **prévisibilité**.

**Méthode : ne jamais optimiser sur une base instable.** Le 28/07 après-midi, `getAdminBootstrap`
est passé de 3 135 à 5 712 ms **sans changement de code** ; mesurer un gain y était impossible.
Prendre la mesure de référence le matin.

**Pistes fermées (ne pas reproposer sans élément nouveau) :** tailler les lignes vides des onglets
(ouverture du classeur = 120 ms pour 1,7 M de cellules) ; lire les JSON du Drive par identifiant
direct (396 ms contre ~350 ms par recherche de nom) ; fusionner `login` et `getAdminBootstrap`
(**déjà fait**) ; cache serveur et optimisation du JSON (écartés de longue date).

## État : fonctionnellement terminé
**Ne PAS reproposer** : `config.html` (abandonné — couvert par les 5 onglets d'admin.html) ; **optimisation perf** du JSON (déjà minifié/gzip) ; patch GAS de robustesse cible (le garde frontend suffit).

**Restant / à surveiller (non urgent)** :
- **`Indispos.gs`** (version dépôt **`2026-07-20.3`**) — action **`resetCodeMar`** (bouton 🔄) et retrait d'`applyRotationLib`. **Recopié et testé en production le 20/07/2026.** **`code.gs` également à recopier** (version **`2026-07-20.3`** : retrait du tag `ROT-LIB` et des fonctions one-shot de conversion). Le 🔍 Diagnostic signale l'écart dépôt/déployé.
- ✅ **29/07/2026 (matin) — les 5 fichiers GAS ont été recopiés et déployés, fonctionnement confirmé en production.** Versions déployées : `code.gs` `2026-07-29.3` · `Indispos.gs` `2026-07-29.4` · `portail.gs` `2026-07-29.2` · `generateur_gardes.gs` `2026-07-29.1` · `setup_annee.gs` `2026-07-29.2`.
- ✅ **29/07/2026 (après-midi) — `Indispos.gs` `2026-07-29.5` recopié et déployé, alignement confirmé par le 🔍 Diagnostic.** Correctif du tri des volants (helper `_rangRole_`). **Plus rien en attente de recopie.** Site **v1.14.5** (frontend, rien à recopier).
- ✅ **30/07/2026 — `Indispos.gs` `2026-07-30.2` et `portail.gs` `2026-07-30.1` recopiés et déployés.**
  Fusion des indispos par propriétaire de code, action `saveIndisposBatch`, commentaire de la
  déclaration libérale réaligné (9 colonnes, une ligne = un patient).
- ✅ **30/07/2026 — `Indispos.gs` `2026-07-30.3` recopié et déployé, fonctionnement confirmé.**
  Bandeau Noël : plancher **8 en dur** (4 dates × 2 gardes, jamais regroupables) et **lecture de
  `CONFIG` supprimée** — les clés `NOEL_*` n'existaient pas. ⚠️ Conséquence : `CONFIG` ne porte
  plus que **six clés lues** (`ANNEE_ACTIVE`, `INDISPOS_ACTIVE`, `ADMIN_CODE`,
  `SECRETARIAT_CODE`, `GITHUB_TOKEN`, `ANTHROPIC_TOKEN`).
- ✅ **30/07/2026 (soir) — audit des 3 wizards.** `Indispos.gs` `2026-07-30.5` et
  `setup_annee.gs` `2026-07-30.1` recopiés et déployés. Site **v1.14.14**.
  **Plus rien en attente de recopie.**

## ⛔ L'année d'une date n'est PAS ses 4 premiers chiffres

Une **année de planning commence le premier LUNDI**, pas le 1er janvier : l'année 2026 court
du 05/01/2026 au **dimanche 03/01/2027**. Les tout premiers jours de janvier appartiennent donc
encore à l'année précédente — leurs gardes sont dans `GARDES_2026` et `planning_2026.json`.

- **Toute lecture d'un `GARDES_{Y}` ou d'un `planning_{Y}.json` faite À PARTIR D'UNE DATE passe par
  `anneePlanning(date)` (`code.gs`), jamais par `ds.slice(0,4)`.** Trois défauts en production
  venaient de là (voir ROADMAP du 29/07) ; volume mesuré : 5 jours ouvrés au passage 2028→2029.
- **EXCEPTION — les onglets `LIBERAL_{Y}` sont rangés par année CIVILE** de la date de bloc, parce
  que le relevé du groupement est calendaire. Ils utilisent `_libYearOf`, PAS `anneePlanning`.
  ⚠️ Ne pas « harmoniser » les deux : une semaine à cheval doit lire les DEUX onglets libéraux.
- **Une semaine se désigne par son LUNDI**, jamais par son numéro ISO : en 2028, 2034, 2040 et 2045,
  le n° 1 désigne deux semaines distinctes de la même année de planning (`_lundiDe` dans `admin.html`).

## 📦 Quand clôturer l'année : le premier lundi, JAMAIS avant

**Clôturer trop tôt** fait disparaître du portail les gardes des premiers jours de janvier (elles
appartiennent à l'année archivée alors que le système affiche déjà la nouvelle). **Clôturer en
retard** n'est qu'un inconfort d'affichage. Le risque est donc entièrement d'un seul côté.

Dates : **lundi 4 janvier 2027**, 3 janvier 2028, **8** janvier 2029, 7 janvier 2030.
Prérequis : le planning de la nouvelle année doit être **généré ET publié**.

**L'archivage n'est volontairement PAS automatisé** (décision du 29/07/2026) : un déclencheur
annuel est du code jamais testé, qui s'exécuterait sans personne pour vérifier que l'année
suivante est prête. À la place, le système **signale** — bandeau dans `admin.html` (rouge et bouton
désactivé si le planning suivant n'est pas publié) + ligne dans le 🔍 Diagnostic. **Ne pas
reproposer l'automatisation.**

## 🔬 Chercher un défaut : simuler, pas relire

Leçon du 29/07/2026. La relecture intégrale des pages HTML (16 000 lignes) n'a **rien** donné et a
été abandonnée. La même journée, extraire les vraies fonctions du dépôt dans un banc d'essai Node
et les **rejouer sur 22 années** a trouvé trois défauts en une heure — dont deux dans du code
écrit le jour même, invisibles à la relecture.
→ Partir d'une **famille de pannes** (frontières de dates, incohérences entre deux endroits qui
font la même chose, scénarios de rupture, échecs silencieux) et la traquer par script. Un objectif
ciblé produit des réponses ; le balayage produit du volume.
- **⚠️ Année active : 2026.** Le classeur contient `GARDES_2026`, `INDISPOS_2026`,
  `AFFECTATIONS_2026` et `STATS_GARDES_2026`. L'archivage de 2026 n'a PAS eu lieu ; il se fera en
  janvier 2027 (voir « Quand clôturer l'année »).
  ⚠️ **Mise à jour du 29/07/2026 — `INDISPOS_2027` EXISTE** (mesuré le 28/07 : 1000 × 365
  cellules), créé pour la campagne de saisie des indisponibilités 2027 en cours. Ce fichier
  affirmait « aucun onglet 2027 » : c'est **périmé**. Les gardes 2027, elles, ne sont pas encore
  générées (ce sera le Wizard 2, en novembre).
  **Règle qui ne change pas : vérifier l'état réel du classeur plutôt que de se fier à ce
  document.**
- **Mécanique d'archivage (quand elle servira, en janvier 2027)** : `archiveYear` écrit
  `stats_{Y}.json` dans le **Drive** et **déplace** les onglets `*_{Y}` vers `ARCHIVE_SS_ID`
  (`Planning_CHPG_Archives`). Détection via l'action GAS `getArchivedYears` (scan Drive des
  `stats_YYYY.json`) ; lecture des stats archivées via `_ssWithSheet()` (classeur actif sinon
  `ARCHIVE_SS_ID`), appliqué à `computeStatsLive` et `getStats`. Rappel : Initiale = équité figée
  à la génération, Instantané = équité réelle finale (les deux diffèrent légitimement).
- ✅ **Secteurs — CHANTIER TERMINÉ DE BOUT EN BOUT le 21/07/2026** (site v1.7.1). Un secteur ou
  une consultation se crée **dans un onglet du classeur** et va jusqu'à l'Excel du vendredi, sans
  code ni recopie Apps Script. Marche à suivre complète au **§ 18 du guide technique**.
  ⚠️ **Ne pas reconstruire.** Le plan d'exécution qui suit est conservé pour comprendre les
  décisions ; il est **réalisé**, pas à faire.
- *(Plan d'origine, réalisé)* **Secteurs étape 2 — plan validé (avant déménagement NCHPG/2027).** Objectif : bascule secteurs en quelques minutes dans un onglet, pas de hardcode. Constat : la config secteurs est **triplée et non synchronisée** — `admin.html` (`SECTEURS_CFG`, source riche), `index.html` (copie en dur `_SECTOR_BASE` + `SECLABELS`), `gas/code.gs` (`CS_TEMPLATE` par jour + règles CI→RI/`csAmRules`). `staff.html` n'a pas de secteurs. **Périmètre décidé : complet** (définitions + consultations). **On ne modélise PAS encore les secteurs NCHPG** — on construit le mécanisme rempli à l'identique de l'existant ; la bascule sera une simple édition d'onglet.
  - **Schéma validé — onglet `SECTEURS`** (1 ligne/secteur) : `ORDRE | CODE | LABEL | COURT | AFF | ICON | BG | FG | CS | ACTIF`.
  - **Schéma validé — onglet `CS_TEMPLATE`** (1 ligne/créneau conso) : `JOUR(1-5) | DEMI(AM/PM) | SECTEUR_AFFIL | CODE_CS | NB`.
  - **Workflow d'exécution** (après synchro des 4 `.gs`), chaque étape validée avant la suivante, **repli systématique sur les valeurs actuelles** à chaque étape (jamais de casse) : (1) `setupSecteursTab()` GAS — crée+remplit les 2 onglets à l'identique, idempotente ; (2) lecteur GAS `getSecteursConfig()` (caché) + injection d'un bloc `secteurs` dans les JSON publiés + action API `getSecteursConfig` ; contrôle non-régression = JSON identique + ce bloc ; (3) `admin.html` lit la config au chargement (repli sur `SECTEURS_CFG` actuel si l'API échoue) ; (4) `index.html` consomme le bloc `secteurs` du JSON au lieu de ses copies en dur. Bascule 2027 = éditer l'onglet (nouveaux codes BLOC CENTRAL, anciens en `ACTIF=N`), regénérer. La bascule CI→RI restera du code paramétré (logique, pas donnée).
- **Module libéral** (règle des 30 %, voir `docs/module-liberal/module_liberal_conception.md`).

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
  **22 actions d'écriture** (dont `resetCodeMar` ; `applyRotationLib` retirée le 20/07/2026) ; le point d'entrée prend `LockService.getScriptLock()` (20 s) avant de
  router. **Toute nouvelle action qui écrit doit être ajoutée à ce Set.** Les lectures n'en prennent
  jamais (fluidité du dashboard). Pas de `releaseLock` explicite : Google libère en fin d'exécution.
- **Reprise des wizards.** Les étapes réussies ne sont pas rejouées ; `initYear` refuse d'écraser,
  `archiveYear` et `generateGardes` détectent « déjà fait » et renvoient un succès (avec les stats
  pour la génération) au lieu d'une erreur. Le verrou anti-régénération de `generateGardes()` reste
  intact pour les appels directs depuis l'éditeur : **ne jamais le contourner**.
- **Charge** : marge ×3 sur la limite des 30 exécutions simultanées au pic réaliste — pas
  d'optimisation nécessaire (ne pas reproposer de cache serveur).

## Banc d'essai du générateur (`simulateur/`)
`node simulateur/scenarios.js` (11 scénarios, invariants + équité) · `avant_apres.js` (dépôt vs copie patchée) · `chain.js` (dette sur 4 ans). Le harnais exécute le **vrai** `generateur_gardes.gs` dans Node avec un Google Sheets simulé. `demographie.js` porte le modèle d'absences calé sur la feuille réelle 2026 (~81 j bloqués/MAR/an). Règle : **aucune métrique ne doit se dégrader** avant un push sur l'algo.
Pièges d'outillage consignés dans `simulateur/experiences/2026-07_couverture_jours_serres.md` (portée de `shiftD`, colonnes MEDECINS, rythme 2/2 géré nativement, `pkill -f` qui tue le shell appelant, `process.chdir()` et chemins de sortie relatifs).

## Pour retrouver le contexte détaillé
Tu disposes d'une **mémoire** de nos sessions et des **transcripts** dans `/mnt/transcripts/` (voir `journal.txt` pour le catalogue). Consulte-les si tu as besoin d'un détail précis (code exact, décisions passées).

---
*Pour démarrer : donne-moi le token GitHub, dis-moi ce qu'on modifie, et vérifie d'abord l'état réel du dépôt.*
