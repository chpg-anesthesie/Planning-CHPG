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
- **`assets/`** : ⚠️ `vendor/lucide-icons.js` est un mini-bundle LOCAL de **17 icônes seulement** (liste dans son en-tête) — une tuile qui demande une icône absente s'affiche vide ; pour en ajouter une, copier son tableau `children` depuis le paquet lucide. `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`. Référencés par les `<link>` des HTML et par le manifest (`assets/icon-*.png`).
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
- **Wizard 3** — clôture/archivage de l'année N : STATS→HISTORIQUE, `stats_{Y}.json`+`indispos_{Y}.json` dans le Drive, **déplacement** des onglets `*_{Y}` vers `ARCHIVE_SS_ID` (`Planning_CHPG_Archives`), bascule année active → N+1, nettoyage indispos. **Éprouvé sur un archivage de test de 2026 (07/2026)** — mais ⚠️ **l'archivage réel n'a PAS eu lieu** : au 20/07/2026 l'année active est toujours **2026** et les onglets `*_2026` sont bien dans le classeur. Le vrai W3 se tiendra en janvier 2027.

## Accès nominatif (index.html)
- **Colonne `LIBERAL` (O/N) dans `MEDECINS`** — appartenance au groupement libéral. Repérée **par son en-tête**, jamais par un index figé (`checkCode`, `Indispos.gs`) : elle peut être placée n'importe où dans l'onglet, et une insertion de colonne ne cassera rien. `checkCode` renvoie `liberal:true/false`, l'action `login` le transmet, `dashboard.html` s'en sert pour n'afficher la **tuile « Module libéral »** qu'aux membres. **Colonne absente ou vide → tuile invisible pour tout le monde** (comportement voulu). Aucune lecture de classeur supplémentaire : `MEDECINS` était déjà lu par `checkCode`.
- **Code d'accès perso = colonne G (7ᵉ colonne) de la ligne du MAR dans `MEDECINS`** (`checkCode` lit `data[r][6]`). Code admin = clé `ADMIN_CODE` de `CONFIG`.
- L'écran de connexion **met la saisie en MAJUSCULES**. ⚠️ **La comparaison GAS est STRICTE, sensible à la casse** — `checkCode` fait `String(data[r][6]).trim() === String(code).trim()`, sans `toUpperCase()`. Ce fichier a longtemps affirmé le contraire (« insensible à la casse ») : **c'était faux**, vérifié le 20/07/2026. En pratique rien ne casse puisque la saisie est forcée en majuscules, mais **un code contenant une minuscule en colonne G serait refusé**. Symptôme à connaître : un MAR dont le code « ne marche pas » alors qu'il semble correct → vérifier la casse dans le Sheet. Éviter aussi un code purement numérique (Sheets peut le stocker en numérique/notation scientifique).
- **Aucune limite de tentatives** sur `checkCode()`, et c'est **assumé** (décision du 20/07/2026, voir la section « Écarté » de la ROADMAP pour le chiffrage). Ne pas reproposer de protection anti-force-brute.
- **Codes robustes** : `genererTousLesCodes()` (dans `setup_annee.gs`) génère un code 8 caractères non devinable (alphabet sans `0 O 1 I L`) pour chaque MAR **actif** (col D=O), efface celui des inactifs (parti = ne peut plus se connecter), et logue le récap. `genererCodeMAR("XX")` pour un seul MAR. Distribution via le flux « Envoyer les codes » du Wizard 1.
- **Renouveler le code d'un MAR** : action GAS **`resetCodeMar`** (admin only, dans `WRITE_ACTIONS_LOCK`), déclenchée par le bouton **🔄** de sa ligne (onglet Équipe). Tire un code unique (comparé aux autres MARs **et** à `ADMIN_CODE`), l'écrit en colonne G — **l'écrasement EST la révocation**, il n'y a rien d'autre à invalider — puis l'envoie par email. **L'email est vérifié avant toute écriture** (pas d'email → refus, code inchangé) ; l'ancien code est tracé dans `LOGS` avant écrasement ; si l'envoi échoue, le nouveau code est **renvoyé dans le message d'erreur** pour transmission en main propre. ⚠️ **Les envois groupés ne régénèrent PAS** (`sendCodes`, `sendCodesMar`, `sendCodesWithRecap`) : ils renvoient le code existant. Distinction volontaire — un « envoyer à tous » ne doit jamais pouvoir casser 23 codes. Documenté dans `guide-comite.html` § 13.3.
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
⚠️ Le repli sur les définitions en dur est **silencieux** : en cas d'échec de lecture, les pages
tournent sur le code sans le dire. `VOLANT` et `CS` sont des pseudo-secteurs, hors onglet.
⚠️ `assets/vendor/lucide-icons.js` ne contient que **17 icônes** : aucune icône de secteur
(Activity, HeartPulse, Bone…) n'y est. `admin.html` **ne charge aucune bibliothèque lucide** —
d'où l'absence d'icônes de secteur sur cette page, contrairement à `index.html` (CDN unpkg).

## Consultation libérale endoscopie
- La consultation libérale d'endoscopie (mardi/jeudi PM) est marquée **`entry.lib=true`** côté GAS, via le tag **`LIB`** en **colonne E (COMMENTAIRE)** de `PLANNING_OVERRIDES`. Dans `index.html`, la puce Endoscopies porte un **badge « LIB »** violet (desktop + mobile) + légende conditionnelle. Cohérent avec le rendu admin.
- **Attribution 100 % manuelle** : le comité clique le marqueur LIB dans l'onglet Planning → l'override est écrit avec le commentaire `LIB`. Les créneaux `CS-END` eux-mêmes viennent de `CS_TEMPLATE` (`code.gs`) et ne dépendent d'aucun override.
- ⚠️ **La rotation automatique a été SUPPRIMÉE (20/07/2026)** — objet `ROT`, assistant « ⟳ Rotation libérale », overlay et action `applyRotationLib` retirés, faute d'usage réel. Le tag `ROT-LIB` n'existe plus : les lignes existantes ont été converties en `LIB` par la fonction one-shot `convertirRotLibEnLib()` (elle-même retirée après usage), ce qui a préservé à l'identique les créneaux déjà attribués. **Ne pas reproposer d'automatisation de cette rotation.**
- ⚠️ **`setLibSoliste` n'a jamais existé** dans le dépôt : cette doc l'a longtemps annoncée comme « à recopier », mais aucune trace dans les `.gs` ni dans `admin.html`. Mention supprimée le 20/07/2026. Rappel : **le dépôt fait foi**, pas ce fichier.

## Version du site (badge `vX.Y.Z`) — actuellement **v1.6.1**

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

**5 fichiers, 9 emplacements.** Deux fichiers la portent DEUX fois : penser au badge HTML **en dur**,
visible avant connexion tant que le JS ne l'a pas remplacé.

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · `id="verBadge">vX.Y<` · `// SITE_VERSION: vX.Y` |
| `admin.html` | idem (3) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · `<!-- SITE_VERSION: vX.Y -->` |
| `docs/guide-comite.html` | idem (2) |
| `docs/guide-technique.html` | marqueur seul |

Le 🔍 Diagnostic (section « Version du site ») compare **toutes** ces formes, dans chaque fichier et
entre fichiers, et signale `INCOHÉRENT (…)` en listant les valeurs divergentes.
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
- **`CS_TYPES`, `CS_OPENABLE`, `CS_REQUIRED`** (`admin.html`) = valeurs de **REPLI** uniquement,
  désormais toutes **globales** (`let`). Repli **silencieux** si l'onglet est illisible.
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

## État : fonctionnellement terminé
**Ne PAS reproposer** : `config.html` (abandonné — couvert par les 5 onglets d'admin.html) ; **optimisation perf** du JSON (déjà minifié/gzip) ; patch GAS de robustesse cible (le garde frontend suffit).

**Restant / à surveiller (non urgent)** :
- **`Indispos.gs`** (version dépôt **`2026-07-20.3`**) — action **`resetCodeMar`** (bouton 🔄) et retrait d'`applyRotationLib`. **Recopié et testé en production le 20/07/2026.** **`code.gs` également à recopier** (version **`2026-07-20.3`** : retrait du tag `ROT-LIB` et des fonctions one-shot de conversion). Le 🔍 Diagnostic signale l'écart dépôt/déployé.
- **⚠️ ÉTAT RÉEL AU 20/07/2026 : l'année active est 2026, PAS 2027.** Ce fichier a longtemps
  affirmé « archivage de 2026 testé en réel, année active → 2027 » : **c'est FAUX**. Le classeur
  contient `GARDES_2026` / `INDISPOS_2026` / `AFFECTATIONS_2026` / `STATS_GARDES_2026`, et **aucun
  onglet 2027** — 2027 n'a pas encore été généré (ce sera le Wizard 2, en novembre). Vérifier
  l'état réel du classeur plutôt que de se fier à cette ligne.
- **Mécanique d'archivage (quand elle servira, en janvier 2027)** : `archiveYear` écrit
  `stats_{Y}.json` dans le **Drive** et **déplace** les onglets `*_{Y}` vers `ARCHIVE_SS_ID`
  (`Planning_CHPG_Archives`). Détection via l'action GAS `getArchivedYears` (scan Drive des
  `stats_YYYY.json`) ; lecture des stats archivées via `_ssWithSheet()` (classeur actif sinon
  `ARCHIVE_SS_ID`), appliqué à `computeStatsLive` et `getStats`. Rappel : Initiale = équité figée
  à la génération, Instantané = équité réelle finale (les deux diffèrent légitimement).
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
  **22 actions d'écriture** (dont `resetCodeMar` ; `applyRotationLib` retirée le 20/07/2026) ; le point d'entrée prend `LockService.getScriptLock()` (20 s) avant de
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
