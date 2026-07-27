# Module libéral — document de conception

*Créé le 02/07/2026 · épuré le 26/07/2026 (v4.0) · **Lot 2A livré le 27/07/2026 · cotations types (v4.2)**. L'ancien document avait
1 287 lignes accumulées en 22 révisions successives ; des affirmations périmées y survivaient sous
des démentis. Il en fait aujourd'hui trois fois moins.*

> **Comment lire ce document.** Chaque brique porte un état, et un seul :
> ✅ **EN PRODUCTION** — vérifié dans le code du dépôt, le fichier concerné est nommé.
> 🔨 **À CONSTRUIRE** — décidé, pas encore écrit.
> **Une décision périmée est supprimée, jamais démentie sous elle.** Git garde l'historique, le
> journal en fin de document dit pourquoi ça a changé.

> **Confidentialité** : tous les montants et pourcentages cités ici sont **illustratifs** (ordres de
> grandeur réalistes), jamais les chiffres réels des relevés. Aucun praticien n'y est identifiable.

**Documents liés** — `antiseche_CCAM_anesthesie_CHPG.md` (règles de cotation) · `guide_liberal_MAR.html` (guide MAR) ·
`../ROADMAP-Planning-CHPG.md` (état d'avancement).

---

## 1. Le problème

Les MARs éligibles exercent une activité libérale intra-hospitalière. Un plafond réglementaire
**limite le libéral à 30 % de l'activité totale** du praticien. Au-delà, l'excédent est **reversé à
l'hôpital** : de l'argent produit puis perdu.

Les honoraires sont **mutualisés** dans un groupement (~17 MARs). L'objectif n'est donc pas
d'optimiser un individu, mais le **pot commun** : `Σ min(libéral, 30 % × total)` par axe. Ce qui
suppose deux gestes symétriques, et le second est celui qu'on oublie :

- **freiner** ceux qui vont dépasser (l'excédent part à l'hôpital) ;
- **remplir** ceux qui sont **sous** leur plafond — cette marge est **définitivement perdue au
  31 décembre** si elle n'est pas utilisée.

Aujourd'hui personne ne voit sa position avant le relevé suivant. Le module sert à voir.

---

## 2. L'invariant central : DEUX axes, DEUX plafonds

Le seuil de 30 % s'applique **séparément** sur deux catégories d'actes — confirmé par le relevé réel
et fondé sur l'**OS n° 7.766 du 06/11/2019** (contrôle par catégorie depuis le 01/01/2020) :

| Axe | Contenu | Levier public correspondant |
|---|---|---|
| **CCAM** | actes techniques (bloc) | blocs publics, **réanimation** (forfaits YYYY015/020) |
| **NGAP** | consultations | **consultations publiques** |

**Les deux plafonds sont indépendants** : on peut être conforme sur un axe et en excédent sur
l'autre. ⚠️ **La réa ne corrige QUE le CCAM.** Un excédent NGAP ne se rattrape que par des
consultations publiques. Les leviers ne sont pas interchangeables — c'est le point dur du pilotage.

**La marge, à public constant** (`P` = public, `L` = libéral, `T = P + L`) :

`marge = (3/7)·P − L = (T/7)·(3 − 10·%)` — nulle à 30 %, négative = excédent.

Le libéral ne s'*efface* pas : le public le **dilue**. À la cible, il faut `P ≥ 2,33 × L`.

**Le relevé est un CUMUL, pas un flux.** Deux conséquences :
- **inertie croissante** — plus l'année avance, plus le % est difficile à bouger : **corriger tôt
  pèse beaucoup plus que corriger tard** ;
- on dérive le **flux du mois** (`cumul_M − cumul_{M−1}`) pour lire la tendance, sinon on pilote
  dans le rétroviseur.

**Le solde est ANNUEL** (tout repart à zéro au 1ᵉʳ janvier) → **décembre est piloté à l'aveugle**
(le relevé de décembre arrive fin janvier, après clôture). Le module calcule donc, à partir du
**cumul de novembre**, le libéral encore permis en décembre pour rester ≤ 30 % sur l'année : borne
exacte, pas de décote forfaitaire.

---

## 3. Principes non négociables

1. **Zéro donnée patient, nulle part.** ✅ Vérifié : la page libérale **ne contient aucun champ nom
   de patient**. Le devis s'imprime avec un emplacement vide que **le patient remplit lui-même à la
   main**. Rien à effacer, rien à protéger : la donnée n'entre jamais dans le PC. C'est plus fort
   qu'une promesse d'effacement — c'est une absence.
2. **Le relevé administratif est la seule source de vérité financière.** Le module recopie, il ne
   reconstitue jamais le chiffre d'affaires depuis les actes. Aucune grille tarifaire devinée.
3. **Estimateur, pas décompte.** Tout chiffre calculé par le module est une estimation qui sera
   **recalée** par le relevé suivant. Il ne certifie jamais rien, et le dit à l'écran.
4. **Le module affiche, le comité décide.** Aucun pré-placement automatique, aucune recommandation
   contraignante.
5. **Aucune donnée financière individuelle ne sort du groupement.** Visibilité totale **entre
   membres** (l'argent est mutualisé), rien au-delà.
6. **Un chiffre douteux ne s'affiche pas.** Mieux vaut une case vide qu'un pourcentage faux — un
   faux chiffre dit « vas-y » à celui qui doit s'arrêter.

*(Le §3 bis de l'ancien document — contrainte de non-persistance, test jsdom, scan statique, preuve
réseau — décrivait la protection d'un champ patient qui n'a jamais existé dans le code livré. Il est
supprimé. Le fichier `tests/anti_persistance_devis.test.js` est un fossile de la même époque.)*

---

## 4. Architecture : trois couches

Le chiffre d'affaires n'est **jamais** observable en temps réel : le seul signal argent est le
relevé mensuel, retardé (M+1) et cumulé. D'où trois couches disjointes.

| Couche | Nature | Source | Rôle |
|---|---|---|---|
| **Activité** | déterministe, maîtrisée | déclarations MAR + planning | placement : présence au bloc |
| **Argent** | observée, retardée, cumulée | relevé mensuel de l'administration | mesure : `T` / `%` / excédent, par axe |
| **Pilotage** | dérivée | croise les deux | marges, réallocation, équité |

**Un parcours libéral = une consultation (J0, NGAP) + un acte au bloc (J+X, CCAM).** C'est la
consultation qui **déclenche** l'obligation de présence au bloc. Un même parcours alimente donc les
**deux axes**, à **deux dates différentes** — souvent deux mois différents. Toute la rigueur du
recoupement tient à ne pas confondre ces deux dates.

---

## 5. ✅ EN PRODUCTION — ce qui tourne aujourd'hui

**Ne pas reconstruire.** Chaque brique est vérifiable dans le dépôt.

### 5.1 Estimateur + devis — `docs/module-liberal/maquette_estimateur_liberal.html`
Cotation d'un parcours (recherche CCAM, tarif activité 4), calibrage du dépassement sur la mutuelle
du patient, impression du devis. Branchée au portail : le MAR est identifié par son code de session
(`chpgViewCode`), l'identité du praticien est pré-remplie. Accès par une **tuile Dashboard visible
seulement si `LIBERAL = O`** dans l'onglet `MEDECINS`.

Règles de calcul figées et validées au centime (détail dans l'antisèche) :
- **CCAM** : `BR = coefficient carte (monégasque ×1,95 / français ×1,00) × (tarif act. 4 × (1+%mod)
  × taux d'association + €mod)`
- **NGAP** : `BR = lettre-clé × coefficient` (`C 34,40 · CS 46 · APC 60`) — **sans** ×1,95, **sans**
  modificateur. La carte n'y joue que sur le **DH**.
- **Le DH est hors quota** : il ne charge jamais les 30 %.

### 5.2 Déclaration d'intervention — `gas/portail.gs`
Actions `declareLiberal` / `deleteLiberal` (écritures, dans `WRITE_ACTIONS_LOCK`) et `listLiberal`
(lecture). Onglet `LIBERAL_{Y}` créé à la volée, année du **jour de bloc**.

Schéma **en production depuis le 27/07/2026 (Lot 2A)** — 9 colonnes :
`ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · SPECIALITE · BR_CCAM · BR_NGAP · CHIRURGIE`
**Une ligne = un patient** ; la fusion jour+secteur a été supprimée. `DATE_CONSULT` est éditable
(elle date la BR NGAP). Onglet `SPECIALITES` amorcé avec 12 codes, action `getSpecialites`.
Une **spécialité vide est tolérée**, une spécialité **fournie mais inconnue est refusée** : une faute
de frappe créerait une spécialité fantôme qui fausserait le rendement en silence.
Les lignes antérieures gardent leurs 6 colonnes remplies, les 3 nouvelles vides — aucune migration.

### 5.3 Volet comité — `admin.html`
Au clic sur une case flash, le panneau d'affectation s'ouvre **et** un volet « ◆ Libéral » apparaît à
gauche : **une ligne par MAR et par secteur, avec le compte** (« Dr X — ORL — 4 interventions —
cataracte, septoplastie »). Depuis la fin de la fusion, une journée de cataractes remonterait sinon
huit lignes identiques ; le comité place un MAR dans un secteur, pas patient par patient. Libellés
dédupliqués, tronqués au-delà de trois.

⚠️ **Le volet ne porte AUCUN jugement** (vérifié dans `renderLiberalCard`) : ni couleur, ni
comparaison avec l'affectation en cours, ni mention « à replacer ». Il affiche, le comité décide.
S'il n'y a aucune déclaration ce jour, le tiroir **reste masqué en silence** — pas de toast : sur des
dizaines de clics par séance, une notification à chaque fois deviendrait du bruit.

**La grille ne change pas d'un pixel** — à 20 MARs, tout marquage permanent sature.
Sécurité : `secteur` et `chirurgie` viennent des MARs (texte libre) et sont injectés dans une page où
`ADMIN_CODE` est une variable vivante — **ne jamais retirer `_escHtml`** de cette fonction.

### 5.4 Secteurs — onglet `SECTEURS`
Externalisation faite : `getSecteurs()` lit l'onglet, `admin.html` en dérive toutes ses listes (le
tableau en dur n'est plus qu'un **repli** si l'API ne répond pas). Colonne `RENDEMENT_LIB`
(FORT / MOYEN / NUL / REA) présente et éditable, **pas encore consommée**.

### 5.4 bis Cotation d'un parcours — ce que le 2A y a ajouté

**Consultation associée.** Au moment de coter un parcours bloc, un champ rattache la **BR NGAP du
patient** à *son* parcours : `CS` (46,00 · **défaut**, la consultation est systématique), `C` avec
coefficient (34,40 × n — le cas `C ×2` = 68,80 du relevé), `APC` (60,00) ou montant libre.
⚠️ **Pourquoi à la cotation et pas à la déclaration :** cinq patients vus le même jour donnent cinq
parcours NGAP à la même date, de valeurs différentes. Aucune règle de date ne peut dire lequel
appartient à ce patient. Les tarifs sont lus dans la table `LC` (grille CCSS-CAMTI, annexe III au
01/10/2025), jamais réécrits ailleurs.

**Garde-fou APC.** L'APC **n'existe pas dans la nomenclature monégasque** (annexe III : `C · CPN ·
CS · CSPN · CP3 · CPSY · CSC · CALD · CDE · V · VS · VPSY · K · KC/KCC · SPM/SCP`). C'est une
**cotation française**, d'où sa valeur identique au tarif français et l'absence de coefficient ×1,95.
Elle est donc **refusée** pour carte verte, rose, bulle et SPME, **autorisée** pour un assuré
français, **avertie** pour NAS et AME.

**Bandeau AME.** Deux régimes existent (français : tarifs français, sans dépassement ; monégasque :
hors annexe III), et rien ne dit lequel s'applique en libéral. Le chiffre s'affiche, **assorti d'un
avertissement** — un chiffre douteux ne s'affiche pas en silence.

**Cotations types (27/07/2026).** Onglet `COTATIONS_TYPE` — `GROUPE · NOM · ORDRE · CODE · ROLE ·
MOD7 · MODA · LC` — servi par l'action `getCotationsType`. Un bouton remplit le tableau de cotation
en un clic : lignes d'acte, rôles, modificateurs **et** consultation associée. Il **remplace** les
lignes en place (une cotation type décrit un patient entier).

- **Amorcé avec le groupe `Endoscopie`** : *Gastro + colo* (`HHQE002` principal + `ZZLP025` associé
  50 %), *Gastro seule* (`ZZLP025` seul), *Colo seule* (`HHQE002` seul) — toutes avec modificateur 7
  et `CS` associée. Motif : la consultation d'endoscopie du mardi et du jeudi après-midi est
  composée à 100 % de patients libéraux, donc le créneau le plus chargé administrativement.
- **Sélecteur de contexte** : la page n'affiche **que** les cotations types du groupe choisi, et
  **rien** tant qu'aucun groupe ne l'est. Au-delà d'une dizaine, une rangée de boutons devient
  illisible ; grouper par contexte tient à 50 comme à 3. Le choix est mémorisé pour la session.
- ⚠️ **Aucun tarif n'est stocké dans l'onglet** : il vient de l'index CCAM à partir du code. Une
  seule source, pas de valeur à maintenir à deux endroits. Un code absent de l'index est signalé,
  et les lignes en place ne sont pas détruites.
- ⚠️ **Uniquement des lignes d'activité 4.** Sur un relevé de gastro-colo, les lignes d'activité 1
  appartiennent à l'opérateur : les inclure gonflerait la BR du MAR d'environ 300 € et son quota
  des 30 % avec.
- ⚠️ **Aucun modificateur d'urgence** (`S`, `U`, `O`, `F`, `P`) : il n'y a pas de libéral en urgence
  au CHPG.

**Modificateur 7 coché par défaut, et tableau vide au démarrage (27/07/2026).** Le modificateur 7
(présence permanente de l'anesthésiste, +6 %) est **présent sur tous les relevés observés** ; il est
donc coché d'office sur toute nouvelle ligne — cotation type, recherche CCAM ou ajout manuel. Une
case oubliée **sous-évaluait silencieusement la BR de 6 %**. Le tableau de cotation, qui contenait
deux lignes d'orthopédie de démonstration à effacer à chaque patient, démarre désormais vide.

**Pré-remplissage automatique.** « Ajouter le parcours » remplit toute la déclaration (jour, date de
consultation, deux BR, chirurgie, spécialité proposée d'après le secteur). **Un seul bouton
« 📅 Déclarer »**, en bas.
⚠️ **Règle du dernier parcours (actée le 27/07) :** le formulaire ne tient **qu'un patient**. Coter un
patient B avant d'avoir déclaré A **écrase A**. Choix assumé : le geste naturel est coter → devis →
déclarer → patient suivant, et gérer un état pour un cas rare coûtait plus que ça ne rapportait. Un
champ corrigé à la main n'est jamais écrasé ; cette mémoire est remise à zéro après chaque
déclaration réussie, sans quoi le patient suivant hériterait des corrections du précédent.

**Avertissement sans montant.** Valider sans BR CCAM demande confirmation : l'intervention sera
déclarée au comité, mais **sortira du calcul de rendement** et fera baisser le taux de couverture.

---

### 5.5 Écran « Consultations à venir » — `absences.html` (Lot 5-bis)

**La question à laquelle il répond, au moment de la consultation :** *le médecin qui voit ce patient
sera-t-il présent le jour où on l'opérera ?* C'est le contrôle qui évite qu'un patient vu en
consultation libérale se retrouve opéré un jour d'absence de son MAR.

**Deux publics, une seule page** (action `getConsultAbsences`, Indispos.gs) :
- **MAR** — « Vérifiez qu'aucun patient vu en consultation ne sera opéré un jour où vous êtes absent. »
- **Secrétariat** — « Avant de placer un patient, vérifiez que le médecin qui le verra en
  consultation sera présent le jour de son intervention. »

**Ce qu'il affiche.** Les consultations posées sur **20 jours ouvrés** ; pour chacune, les absences
du médecin sur les **20 jours ouvrés suivants**, groupées en périodes (« Dates d'intervention à
éviter — 7 jours sur 2 périodes »). Un clic sur une période montre **qui peut prendre le patient**.

**Trois règles gravées dans le code, à ne pas défaire :**
1. **Les motifs d'absence ne sont pas envoyés au secrétariat** — non transmis par le serveur, pas
   masqués côté navigateur (un masquage client resterait lisible dans le source).
2. **`G` et `G2` ne comptent pas comme absence** : un MAR de garde peut assurer une intervention
   libérale. À l'inverse, l'écran ajoute trois absences absentes de `GARDES_{Y}` — jour fixe non
   travaillé (`TP`), semaine off du rythme 2/2, hors période d'activité — sans quoi il afficherait
   « disponible » à tort. Il reprend aussi le **miroir maternité** (mardi et jeudi matin, `MAT`
   implique `CS-MAT`), règle qui n'existe nulle part dans les données et n'est que recalculée.
3. **Le code du secrétariat est partagé** → périmètre en **liste blanche de deux actions**
   (`login`, `getConsultAbsences`), refus par défaut. ⚠️ **Ne jamais y ajouter `getPlanningJson`** :
   le JSON publié contient le code d'absence brut de chaque MAR pour toute l'année.

**Source** : le planning **publié** (`planning_{Y}.json`, lu côté serveur, jamais transmis au
navigateur), pas `PLANNING_OVERRIDES` — les overrides ne contiennent que ce que le comité a posé à la
main, le JSON est le rendu final.

⏳ **En test.** La tuile Dashboard est restreinte à un seul MAR (`only:'FROHLICH'`) le temps de
l'essai en conditions réelles ; le secrétariat, lui, y accède par son code. Ouverture à l'équipe une
fois l'écran validé.

---

## 6. 🔨 À CONSTRUIRE — Lot 2 : mesurer

Trois étapes, dans cet ordre.

### 6.1 2A — Déclaration enrichie ✅ **LIVRÉ le 27/07/2026**

*Section conservée pour la conception ; l'état livré est décrit aux §5.2, §5.3 et §5.4 bis.*

**Pourquoi.** Le schéma actuel suffit au **placement** ; il ne permet **aucune mesure** — ni de
compter les interventions, ni de savoir ce que rapporte une spécialité.

**Schéma cible de `LIBERAL_{Y}` — 9 colonnes :**

`ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · SPECIALITE · BR_CCAM · BR_NGAP · CHIRURGIE`

- **Granularité : une ligne = UN PATIENT.** La fusion jour+secteur disparaît (8 cataractes ne
  peuvent pas rester 1 ligne).
- **`SPECIALITE`** — nouvelle, obligatoire, 12 codes (§6.1.1). C'est la maille du rendement : elle
  **survit au déménagement de janvier 2027**, le secteur non. `SECTEUR` reste, pour le placement.
- **`BR_CCAM` / `BR_NGAP`** — la base de remboursement, seule grandeur qui charge le quota. **Le DH
  n'est jamais déclaré.** `BR_CCAM` est datée du **bloc**, `BR_NGAP` de la **consultation** : sans
  cette séparation, le recoupement mensuel bi-axial est faux.
- **`DATE_CONSULT` devient une vraie donnée** (elle date la BR NGAP), donc **éditable**, pré-remplie
  à aujourd'hui — une déclaration faite après le bloc porterait sinon une date fausse.
- Les lignes antérieures gardent leurs 6 colonnes remplies et les 3 nouvelles vides : **aucune
  migration**, elles servent encore au placement et sont ignorées par le calcul de rendement.

**Ergonomie retenue.** La page libérale a deux blocs aujourd'hui **étanches** : la calculette en
haut, la déclaration en bas (qui ne récupère que la date de bloc et le libellé de chirurgie, jamais
le montant ni le secteur). On ajoute un bouton **« Déclarer ce parcours »** sur une ligne cotée :
un clic, tout descend (date, spécialité, BR). Le bloc du bas reste, montants **éditables**, pour les
parcours sans cotation. **On ne rend rien obligatoire — on rend le bon chemin plus court.**

#### 6.1.1 Onglet `SPECIALITES` — 12 codes

`OPH · ORL · VIS · URO · ORT · END · GYN · PED · CI · RI · VAS · AUT`

Dans un onglet, jamais en dur — même logique que `SECTEURS`. Plus fine que le secteur partout où un
secteur mélange deux rendements très différents :
- **`OPH` séparée d'`ORL`** — la cataracte est le moteur du rendement ; la noyer dans l'ORL détruit
  la mesure ;
- **`URO` séparée de `VIS`** — le bloc viscéral couvre les deux ;
- **`VAS` conservée** malgré son très faible volume : la fondre dans `VIS` serait **irréversible**,
  on ne pourrait plus jamais l'en extraire ;
- **`AUT`** est une soupape à libellé libre — **si `AUT` grossit, la liste est mal faite.**

**Règle `PED` : patient mineur ⇒ `PED`**, quelle que soit la chirurgie. Arbitraire mais **univoque** :
deux MARs qui classeraient différemment transformeraient les deux rendements en bruit.

### 6.2 2B — Saisie du relevé et marges ✅ **LIVRÉ le 27/07/2026**

**Ce qui a été construit, et qui s'écarte du plan initial :**

- ⚠️ **AUCUN écran de saisie, aucune écriture par le code.** Décision d'Arthur : la gestion du
  libéral n'est pas du ressort du comité, **rien ne passe par `admin.html`**, qui reste le planning.
  Le relevé se recopie **à la main** dans l'onglet `LIBERAL_CA_{Y}` ; le module ne fait que **lire**
  (`getReleveLiberal`). Corollaire : rien à ajouter au verrou d'écriture.
- **L'onglet est créé pré-rempli** — 12 mois × membres `LIBERAL = O`, `MOIS` et `MAR_ID` déjà posés.
  Fonction `creerReleveLiberalAnneeEnCours()`, à exécuter depuis l'éditeur Apps Script. Idempotente :
  si l'onglet existe, elle n'y touche pas.
- **Le checksum vit dans le classeur**, en formules (colonnes J à M), pas dans du code : le contrôle
  est immédiat pendant la saisie et donne le **montant de l'écart**, ce qui localise la ligne fautive.
  ✅ **Vérifié en réel le 27/07 : ça tombe au centime.** Confirmation que la ligne « ACTIVITÉ
  LIBÉRALE » du document est bien la somme des excédents **des deux axes**.
- ⚠️ **Formules posées par le code : noms de fonctions ANGLAIS obligatoires** (`IF`, `ROUND`).
  `setValues()` n'accepte que l'anglais même dans un classeur français — `SI`/`ARRONDI` renvoient
  `#NAME?`. `TEXT` est à proscrire en plus : son code de format dépend de la langue.
- **Rattrapage allégé, décidé le 27/07** : le relevé étant **cumulé**, saisir juin suffit à connaître
  la position — janvier à mai y sont déjà. 108 nombres au lieu de 650. Contrepartie assumée : pas de
  flux avant juillet, donc **pas de contrôle de monotonie sur le premier mois**.

**Page `suivi-liberal.html`** (racine) — lecture seule :
ma position par axe · tableau du groupe **en initiales**, trié par excédent décroissant · totaux par
axe **jamais consolidés** (reversé à l'hôpital d'un côté, capacité inutilisée de l'autre).
**Seul le mois le plus récent est affiché** — empiler deux cumuls compterait deux fois. La période est
écrite en toutes lettres (« cumul janvier → juin 2026 »), et **aucune projection** n'est affichée
(décision 10). L'excédent montré est celui **recopié du document**, jamais recalculé.

**Colonne « D'ici décembre »** — les secteurs des mois restants, en pastilles de largeur fixe aux
couleurs du planning. ⚠️ **Descriptif seul** : aucune flèche, aucun « s'arrange » ou « s'aggrave ».
Traduire un mois de secteur en euros suppose le rendement par spécialité, qui n'est pas encore mesuré
(2C) — et un faux chiffre dirait « vas-y » à quelqu'un qui doit s'arrêter. Les affectations sont
servies par `getReleveLiberal`, **limitées aux MAR du relevé et aux mois à venir** : l'action
`getAffectations` reste réservée à l'admin, on n'ouvre pas une action entière pour une colonne.

---

### 6.2 bis — Le plan initial du 2B (conservé pour mémoire)

**Onglet `LIBERAL_CA_{Y}`**, recopie du relevé mensuel **cumulé** :

`MOIS | MAR_ID | T_CCAM | PCT_CCAM | EXC_CCAM | T_NGAP | PCT_NGAP | EXC_NGAP`

**Six nombres recopiés par MAR et par mois.** Les excédents sont **recopiés, jamais dérivés** :
recalculer `T × (% − 30)` depuis un % arrondi à 2 décimales fausse le total de plusieurs dizaines
d'euros, et le checksum ne tombe plus. Le module ne dérive que le **flux du mois**.

**Saisie groupée mensuelle depuis le PDF** (l'administration ne diffuse aucun fichier exploitable),
par un référent. Deux garde-fous offerts gratuitement par le document :

1. **Checksum de bout en bout** — la ligne « ACTIVITÉ LIBÉRALE » du bas du PDF est le total de tous
   les excédents. Le référent la saisit ; le module somme les excédents recopiés et **valide en vert
   si ça tombe pile à 0,00 près, rouge sinon**. Vérifié au centime sur le relevé réel jan→juin 2026.
   **Un checksum rouge bloque l'enregistrement** : un relevé faux est pire que pas de relevé.
2. **Monotonie du cumul** — chaque total ne peut que croître d'un mois sur l'autre ; une régression
   déclenche une alerte. Le `%`, lui, n'est pas monotone : aucun contrôle dessus.

**Ce que 2B affiche — la mesure, pas la prévision.** Pour chaque MAR et chaque axe : l'état (`T`,
`%`) et la **marge encore permise** avant 30 %, ou l'**excédent** si le plafond est franchi. Vue
groupe = Σ marges (capacité inexploitée) vs Σ excédents (reversé si rien ne change), par axe. Le flux
du mois s'affiche comme **tendance**, jamais comme prévision : sur une activité saisonnière (congés,
gardes, blocs fermés), extrapoler « au rythme » produit un chiffre faux qui induit en erreur.

**Rattrapage.** Les relevés de janvier→août 2026 existent en PDF et se saisissent d'un coup.

### 6.3 2C — Recoupement : le rendement par spécialité

⚠️ **Le relevé ne mentionne ni secteur ni spécialité** : il donne des euros par MAR et par mois. Le
rattachement ne peut donc venir **que de la déclaration**. Ne jamais coder de colonne « spécialité »
dans `LIBERAL_CA_{Y}` : elle n'existe pas dans la source.

**Le montage — le certifié fixe le niveau, le déclaré fixe la structure :**

1. le **relevé** donne l'euro **certifié** du couple MAR-mois, par axe : c'est le niveau, il ne se
   discute pas ;
2. les **déclarations** du même MAR-mois donnent la **structure** : quelle part de BR relève de
   quelle spécialité ;
3. on **ventile le certifié au prorata** des BR déclarées. Rendement d'une spécialité =
   Σ(euros ventilés) ÷ Σ(interventions), **par axe**.

⚠️ **Ne jamais sommer les BR déclarées** pour obtenir un rendement : la BR estimée diverge du
facturé (code réel ≠ code prévu, actes annulés ou rejetés, mois d'encaissement décalé). Le résultat
serait **plausible et faux**, sans que rien ne le signale. La ventilation, elle, absorbe l'écart.

⚠️ **Toujours afficher le `n`** à côté d'un rendement (« ORL : 412 € · n=87 » / « VAS : 890 € ·
n=4 »). Sans le `n`, un rendement calculé sur quatre interventions servira à décider d'une
affectation.

*Repli, si les montants s'avéraient mal déclarés :* le rendement peut se **déduire** sans montant,
par moindres carrés sur ~100 équations MAR-mois (une par couple) pour 5 à 7 inconnues — résoluble
uniquement parce que les MARs ont des mélanges de spécialités différents. Méthode détaillée dans
l'historique git (v3.21). Elle n'est plus nécessaire dès lors que la BR est déclarée.

**Le garde-fou — taux de couverture.** Le relevé est exhaustif, les déclarations sont volontaires. Si
un MAR ne déclare que la moitié de ses interventions, le rendement est faux du double et rien ne le
dit. D'où, par MAR et par mois : `Σ BR déclarées ÷ euros du relevé`. **On n'attend pas l'égalité** —
le décalage de facturation et les oublis sont normaux. **Le critère est que l'écart soit FAIBLE et
STABLE** : ~5 % constant = sain ; un écart qui saute de 5 à 40 % = tout rendement calculé est à
jeter. À afficher au comité (« couverture : 94 % ») : il valide les rendements et incite à déclarer.

### 6.4 Ordre et calendrier

**2A avant 2B**, parce que le relevé est **rattrapable rétroactivement** (les PDF attendent) alors
qu'une intervention non déclarée est **perdue définitivement**.

⚠️ **Mais sans urgence tant qu'Arthur est le seul `LIBERAL = O`** dans `MEDECINS` : rien ne se perd
aujourd'hui. Le chronomètre démarre le jour de l'ouverture aux autres membres — et le 2A doit être
**rodé avant** cette ouverture, pour ne pas changer le formulaire sous leurs yeux.

| Quand | Quoi |
|---|---|
| Juillet–août 2026 | 2A, testé seul en conditions réelles |
| Rentrée 2026 | Ouverture aux membres · 2B et rattrapage des relevés |
| Oct.–déc. 2026 | Marges visibles — **l'excédent 2026 est encore corrigible** (solde annuel) |
| Janvier 2027 | **Déménagement.** Le Lot 2 continue sans rien changer : il ignore les secteurs |
| 2027 | Rendements par spécialité mesurés ; composition des nouveaux secteurs décrite |
| Mi-2027 | **Lot 4**, sur des chiffres réels |

---

## 7. 🔨 À CONSTRUIRE — Lot 4 : réallocation et équité (mi-2027)

**Pas envisageable avant mi-2027** : le tenter plus tôt reviendrait à recommander des déplacements
d'affectation fondés sur des rendements inventés.

**Le rendement est un attribut de SPÉCIALITÉ, pas de secteur.** Au déménagement, il n'y aura plus de
bloc ORL isolé — l'ORL entrera dans un « Bloc Court » mutualisé. Un rendement attaché au secteur
serait périmé le jour du déménagement. Attaché à la spécialité, il est permanent : **une cataracte
rapporte autant quelle que soit la salle.** Un secteur devient alors une **composition de
spécialités**, et son rendement s'en déduit — au déménagement on ne réestime rien, on **décrit la
nouvelle composition**.

**Leviers, par axe :**

| Situation | Levier CCAM | Levier NGAP |
|---|---|---|
| **Au-dessus** de 30 % | secteur `NUL` (gèle le libéral) · **réa** (monte le public) · réallouer les vacations libérales | moins de consultations libérales · **plus de consultations publiques** |
| **Sous-employé** (< 30 %) | plus de vacations bloc libérales | plus de consultations libérales |

**Équité = le désagrément, pas l'argent.** L'argent étant mutualisé, l'équité porte sur les
affectations contraintes (frigo, réa) : comptées par membre, **tournantes**, même logique que
l'équité VD des gardes.

---

## 7 bis. ❄️ Lot 5 — interface secrétaire : GELÉ

**L'idée.** Un écran, à code partagé et en lecture seule, aidant le secrétariat d'anesthésie à
placer les consultations libérales de façon que le patient soit vu par un MAR **présent le jour de
son intervention** — et, en couche 2, à orienter en priorité vers celui qui est **le plus loin de
son plafond**. Conçu en détail les 23 et 24/07/2026 (31 décisions, une maquette), **jamais codé**.

**Pourquoi c'est gelé.** (1) La couche 2 suppose le compteur, qui n'existe pas encore. (2) Le
dépassement du groupe s'efface **arithmétiquement** avec les deux entrants (oct. 2026 et janv. 2027),
qui apportent du plafond libre. (3) Au-dessus de 30 %, un acte parti en public **n'est pas une
perte** : il gonfle le dénominateur et libère du plafond. Le Lot 5 optimiserait un problème en voie
de disparition.

**Condition de réactivation :** que le Lot 2, sur données réelles, montre un dépassement
**persistant** malgré les deux entrants.

**Le seul chiffre à retenir de sa conception** — audit manuel de la semaine 25 (juin 2026, 89
patients libéraux) : **75 % des patients sont déjà vus par un MAR du bon secteur**, contre le
tiers estimé au départ. Le résidu est de ~20 déplacements par semaine, dont 6 structurellement
irréductibles (cardio interventionnelle, vivier d'un seul MAR). **Toute estimation de gain fondée
sur `p ≈ 1/3` est fausse.**

**Ce qui en a été tiré et qui tourne** : le **Lot 5-bis**, écran « Consultations à venir »
(`absences.html`), en production depuis le 25/07/2026 — décrit au **§5.5**. Il ne route rien, ne
compte rien, n'écrit rien : il répond à une question de disponibilité. C'est la jambe inoffensive du
Lot 5, et elle suffit à traiter le cas qui fait vraiment mal (un patient opéré un jour d'absence).

⚠️ La maquette `maquette_ecran_secretaire.html` est **périmée** (elle implémente une entrée
abandonnée en cours de conception). La conception complète — §11 ter, décisions 15 à 31 — vit dans
l'historique git, **dernier état complet au commit `89cf72b7`** (26/07/2026).

---

## 8. Données — onglets

| Onglet | État | Contenu |
|---|---|---|
| `MEDECINS` · colonne `LIBERAL (O/N)` | ✅ | appartenance au groupement, maintenue à la main |
| `SECTEURS` | ✅ | secteurs + `RENDEMENT_LIB` (présent, non consommé) |
| `LIBERAL_{Y}` | ✅ 6 colonnes | déclarations d'intervention → **9 colonnes au 2A** |
| `SPECIALITES` | 🔨 2A | 12 codes (`CODE · LABEL · ACTIF`) |
| `LIBERAL_CA_{Y}` | 🔨 2B | relevés cumulés, 6 nombres recopiés par MAR et par mois |
| `CONFIG` · `LIBERAL_CIBLE` | 🔨 2B | cible en % par axe (défaut 30). ⚠️ **N'existe pas encore** dans le code |

---

## 9. Décisions actées

*Numérotation d'origine conservée. **Les décisions 15 à 31 concernent le Lot 5** et vivent
désormais dans `module_liberal_lot5.md`.*

1. **Seuil de 30 % appliqué séparément sur DEUX axes** (CCAM technique, NGAP consultations) —
   confirmé par le relevé réel. Pas de seuil global.
2. **Le module suit `T`, `%` et l'excédent recopié des deux axes**, jamais un % consolidé.
3. **Objectif = optimiser le pot commun** (`Σ min(libéral, 30 % × T)` par axe) ; la convergence
   individuelle vers 30 % est le proxy de la V1.
4. **Leviers spécifiques à l'axe** : la réa ne corrige que le CCAM.
5. **Relevé mensuel cumulé** → dériver le flux ; corriger tôt ≫ corriger tard.
6. **Affichage seul côté comité** : aucun pré-placement.
7. **`RENDEMENT_LIB` à 4 valeurs** (FORT / MOYEN / NUL / REA).
8. **Payload de déclaration borné, sans code CCAM** — *amendée le 26/07/2026* : il porte désormais
   `SPECIALITE`, `BR_CCAM`, `BR_NGAP`. Restent exclus : **toute donnée patient**, **tout code CCAM**,
   **tout DH**, toute grille tarifaire devinée.
9. **Équité = le désagrément** (frigo, réa), pas l'argent (mutualisé).
10. **V1 mesure, elle ne projette pas.** Pas d'extrapolation « au rythme ». La projection à fin
    décembre, fondée sur l'activité **déjà planifiée**, est repoussée à la V2.
11. **Saisie groupée mensuelle depuis le PDF**, sécurisée par checksum + monotonie du cumul.
12. **La page du module libéral est le point d'entrée unique** côté MAR : cotation, devis et
    déclaration. `indispos.html` n'a aucun rôle libéral. Accès par tuile Dashboard si `LIBERAL = O`.
13. **Ergonomie admin actée** : grille intacte, volet « ◆ Libéral » à gauche, **affichage sans
    jugement**, tiroir masqué en silence s'il n'y a rien (pas de toast).
14. **Aucun champ patient dans le module** — *reformulée le 26/07/2026*. La version d'origine
    prévoyait un champ nom effacé à la fermeture, avec preuve de non-persistance. Le code livré va
    plus loin : **le champ n'existe pas**, le patient écrit son nom à la main sur le devis imprimé.
    Rien à protéger, donc rien qui puisse fuir.

**15 à 31 — Lot 5, gelé.** Supprimées de ce document (§7 bis) ; texte intégral dans l'historique
git, commit `89cf72b7`.

32. **La déclaration porte la spécialité ET le montant (BR)** (26/07/2026). Le rendement cesse
    d'être un calcul indirect : il devient une lecture. Corollaires : une ligne = un patient, BR
    seule, montant repris de l'estimateur mais **éditable**.
33. **Douze spécialités**, liste fermée, dans un onglet (§6.1.1).
34. **Règle `PED` : patient mineur ⇒ `PED`**, quelle que soit la chirurgie.
35. **Le rendement se ventile, il ne se somme pas** ; toujours afficher le `n`.
36. **2A avant 2B** (le relevé est rattrapable, la déclaration non) — mais sans urgence tant
    qu'Arthur est seul membre actif du module.
38. **La consultation se rattache à la COTATION, pas à la déclaration** (27/07/2026). Une première
    version rattachait la BR NGAP par la *date* de consultation ; **Arthur a montré qu'elle ne peut
    pas marcher** : cinq patients vus le même jour donnent cinq consultations de valeurs différentes
    (`C 34,40 × coeff`, `CS 46`, `APC 60`), et rien ne dit laquelle est la sienne. Le rattachement se
    fait donc au moment où le patient est coté.

39. **L'APC est une cotation FRANÇAISE**, absente de l'annexe III de la convention CCSS-CAMTI.
    Interdite pour un assuré monégasque (verte, rose, bulle, SPME). C'est la base réglementaire de la
    règle empirique d'Arthur, et la raison pour laquelle il n'y a pas de coefficient ×1,95 : on n'est
    pas dans la grille monégasque du tout.

40. **Règle du dernier parcours** : le formulaire de déclaration ne tient qu'un patient ; coter le
    suivant écrase le précédent non déclaré. Assumé plutôt que géré, le geste naturel étant un
    patient à la fois.

41. **Coter devient nécessaire pour TOUS les patients libéraux**, pas seulement ceux qui ont un
    dépassement (27/07/2026). Avant le 2A, un patient carte verte ne demandait aucune cotation — pas
    de DH, pas de devis. Désormais, sans cotation la BR reste vide et l'intervention sort du
    rendement. **C'est un travail nouveau, et il conditionne toute la mesure** : la validité du Lot 2
    repose sur le fait que chaque membre cote chacun de ses patients libéraux dans l'outil.
    Contrepartie prévue : les **combos de cotation** (§10).

37. **Bouton « Déclarer ce parcours » plutôt qu'un montant obligatoire** : rendre le bon chemin plus
    court, pas plus contraignant. ⚠️ **Le bouton par parcours a été retiré le 27/07** : le
    pré-remplissage est désormais automatique à l'ajout du parcours, et il n'y a **qu'un seul bouton
    de déclaration**, en bas de page. Le principe est inchangé, le geste est plus court encore.

45. **Le relevé ne se saisit PAS dans l'outil** (27/07/2026). Recopie manuelle dans le classeur,
    lecture seule côté module, contrôles en formules. Motif d'Arthur : `admin.html` est le planning,
    la gestion du libéral est autre chose. Effet de bord heureux : aucune écriture, donc aucun verrou,
    aucun écran de saisie à maintenir.

46. **Rattrapage par le seul mois de juin** (27/07/2026), le relevé étant cumulé. Un mois suffit à
    connaître la position ; les mois antérieurs ne servent qu'à lire le flux.

47. **La colonne `LIBERAL` de `MEDECINS` porte trois métiers à la fois** : membre du groupement,
    visibilité de la tuile, et désormais présence sur le relevé. Elle est passée à `O` pour les
    **19** (18 membres + Arthur, qui rejoint le groupe en octobre) ; la tuile est restreinte par
    `only` en attendant l'ouverture. ⚠️ **À surveiller** : trois responsabilités sur une colonne,
    ça a déjà posé problème trois fois dans la même journée.

48. **Constat du 27/07/2026 : 10 MAR sur 18 sont en excédent** au cumul de juin, dont 8 sur les deux
    axes et **2 sur le seul axe NGAP**. ⚠️ Ces deux-là ne se corrigent **pas** par la réanimation —
    seulement par des consultations publiques. Et cela **fragilise l'hypothèse ayant servi à geler le
    Lot 5** (« le dépassement s'efface arithmétiquement avec les deux entrants ») : plus de la moitié
    du groupement dépasse à mi-année. À revérifier sur deux ou trois mois consécutifs avant d'en
    tirer une conclusion.

42. **Cotations types groupées par contexte** (27/07/2026). Onglet `COTATIONS_TYPE`, amorcé sur le
    groupe `Endoscopie`. Aucun tarif stocké (il vient de l'index CCAM), uniquement des lignes
    d'activité 4, aucun modificateur d'urgence. **Rien n'est affiché tant qu'aucun contexte n'est
    choisi** — au-delà d'une dizaine de boutons l'écran devient illisible, et grouper tient à 50
    comme à 3. Nom d'onglet choisi par Arthur (`COMBOS` écarté).

43. **Modificateur 7 coché par défaut sur toute nouvelle ligne** (27/07/2026). Il est présent sur
    **tous** les relevés observés ; la case décochée par défaut sous-évaluait la BR de 6 % dès
    qu'elle était oubliée. Décochable. Corollaire : le tableau de cotation démarre **vide** (il
    contenait deux lignes d'orthopédie de démonstration).

44. **Toute clé de cache de session doit être versionnée** (`chpgCotTypeLib_v2`). Vécu le 27/07 : la
    colonne `GROUPE` n'apparaissait pas parce que la page relisait son cache sans jamais appeler le
    serveur, et `Ctrl+Maj+R` ne vide pas le `sessionStorage`. Invisible chez un seul utilisateur,
    ingérable le jour de l'ouverture au groupement.

---

## 10. Questions encore ouvertes

- **`LIBERAL_CIBLE` fixée à 30 % par axe**, avec borne de décembre. À surveiller en réel : si des
  dépassements récurrents apparaissent malgré la borne, envisager une marge de sécurité par axe (le
  NGAP paraît plus volatil sur le relevé réel).
- **V2 — projection du numérateur.** Partir du dernier relevé cumulé (socle certifié) et poser
  par-dessus l'incrément des BR déclarées depuis. Bien plus fin qu'une extrapolation au rythme : on
  voit venir un pic **avant** le relevé. Reste un **estimateur** — le code facturé diverge du prévu,
  les actes s'annulent. Le relevé recale à chaque fois.
- **V2 — sortie actionnable : le public requis par axe.** À 30 %, `P ≥ 2,33 × L`. Pour chaque MAR et
  chaque axe, comparer le public requis au public déjà projeté et n'afficher que le **déficit**,
  retraduit en **N journées d'affectation** via un rendement moyen. C'est la brique qui relie les
  deux couches par un chiffre exploitable par le comité.
- **V2 — optimiseur de réallocation** : proposer *quelles* vacations déplacer et de qui vers qui,
  sous les deux contraintes. La V1 se contente d'afficher les marges.
- **Trois questions pour la CSM / la facturation du CHPG** (relevées le 27/07/2026, aucune n'est
  tranchable par lecture) :
  1. **Coefficient de l'APC** — supposé à 1, jamais confirmé. Le tarif de 60 € est confirmé (ameli,
     tarifs conventionnels au 01/01/2026), le coefficient non.
  2. **Carte rose : 241 % ou 234 % ?** L'annexe III fixe le coefficient CCAM maximal à **195 % carte
     verte, 241 % carte rose**. L'estimateur applique `1,95 + DH plafonné à +20 %`, soit **234 %**.
     Deux expressions de la même contrainte, ou divergence réelle ? Écart d'environ 13 € sur une BR
     de 190 €.
  3. **AME en libéral** — l'AME ouvre-t-elle seulement droit à une prise en charge libérale ? Deux
     régimes existent (français, OS 5.743/2016 pour le monégasque), et l'AME monégasque est **hors
     annexe III**. En attendant : bandeau d'avertissement, statut inchangé.
- ⚠️ **L'index CCAM a ses tarifs en retard d'une version.** Le fichier `ccam_actes.json` le dit
  lui-même : `version: CCAM v83 (effet 2026-07-01)` pour les **codes et libellés**, mais
  `tarif_act4: CCAM v80 (2025)` pour les **tarifs**. Écart mesuré sur un relevé réel : `HHQE002` à
  51,31 dans l'index contre 52,03 appliqué, soit environ **1,40 € de BR** après coefficient — et
  c'est **systématique sur les 4 356 tarifs d'activité 4**. Deux chantiers distincts : *afficher la
  version et sa date dans la page* (l'information existe déjà dans le fichier, elle n'est pas
  montrée), et *régénérer l'index* depuis la publication officielle. ⚠️ **Une vérification
  automatique depuis la page est impossible** : pas d'API publique côté Cnam, et un navigateur ne
  peut pas lire un site tiers depuis GitHub Pages. Détection automatique de l'**obsolescence**, mise
  à jour **manuelle** du contenu.
- **Modificateurs `8` et `R`** — à chercher dans les relevés réels (valeurs dans l'antisèche §3).
  ⚠️ **La cataracte du second œil n'y ouvre PAS droit** : le texte vise une intervention « portant
  sur un œil ayant déjà subi une de ces mêmes interventions », c'est-à-dire **le même œil réopéré**.
- **Y a-t-il des actes facturés qu'aucune déclaration ne peut couvrir ?** À vérifier — ça borne par
  le bas le taux de couverture atteignable.

---

## 11. Journal des révisions

*Détail complet dans l'historique git. Ne sont conservés que les virages qui expliquent une décision
encore en vigueur.*

| Version | Ce qui a changé |
|---|---|
| v3 · 07/07 | **Découverte du seuil par axe** (CCAM et NGAP séparés) après lecture du relevé réel. Fonction objectif reformulée sur le pot commun. |
| v3.1 · 07/07 | La consultation (NGAP, J0) **déclenche** le placement au bloc (J+X) : un parcours alimente les deux axes. |
| v3.5 · 08/07 | Excédents **recopiés, pas dérivés** — sans quoi le checksum ne tombe jamais. |
| v3.6 · 08/07 | **V1 mesure, ne projette pas** : l'extrapolation « au rythme » est trompeuse sur une activité saisonnière. |
| v3.7 · 12/07 | Règle NGAP figée et validée au centime : `lettre-clé × coefficient`, sans ×1,95 ni modificateur. |
| v3.9 · 16/07 | Page du module = **point d'entrée unique** ; payload de déclaration fermé ; tuile conditionnée `LIBERAL = O`. |
| v3.11 · 19/07 | Base légale du seuil par axe : **OS n° 7.766 du 06/11/2019**. |
| v3.13→3.20 · 23–24/07 | Conception complète du **Lot 5** (interface secrétaire), puis **gel** (§7 bis). |
| v3.21 · 26/07 | **Le rendement est un attribut de spécialité, pas de secteur** — le déménagement de janvier 2027 change les secteurs, pas les spécialités. |
| v3.22 · 26/07 | **Lot 2 élargi** : la déclaration porte la spécialité et le montant ; ventilation au prorata ; 2A avant 2B. |
| **v4.3 · 27/07** | **Lot 2B livré.** Onglet `LIBERAL_CA_{Y}` recopié à la main (aucune écriture par le code), checksum en formules **vérifié au centime en réel**, page `suivi-liberal.html`, colonne descriptive des affectations à venir, tuile qui se sépare en deux. Décisions 45 à 48, dont le constat des **10 MAR en excédent**. |
| **v4.2 · 27/07** | **Cotations types.** Onglet `COTATIONS_TYPE` groupé par contexte, amorcé sur l'endoscopie ; modificateur 7 coché par défaut ; tableau de cotation vide au démarrage ; clés de cache versionnées. Constat consigné : l'index CCAM porte des **tarifs v80 sous des codes v83**. Décisions 42 à 44. |
| **v4.1 · 27/07** | **Lot 2A livré.** `LIBERAL_{Y}` à 9 colonnes, fin de la fusion, onglet `SPECIALITES`, consultation associée à la cotation, garde-fous APC et AME, volet comité regroupé. Tarifs NGAP recoupés sur l'annexe III de la convention CCSS-CAMTI (01/10/2025) : `C 34,40` et `CS 46` **confirmés au centime**, l'APC absente de la nomenclature monégasque. Décisions 38 à 41. Site **v1.10**. |
| **v4.0 · 26/07** | **Épuration.** 1 287 → ~420 lignes, **un seul fichier**. Lot 5 réduit à un résumé (§7 bis), conception complète laissée à git. Suppression de 9 affirmations fausses ou périmées relevées par audit face au code réel : champ patient inexistant (§3 bis entier), « rien avant octobre 2026 » alors que les lots 0/1/3 tournent, `SECTEURS_CFG` présenté comme à externaliser alors que c'est fait, contradiction 4 vs 6 nombres du relevé, projection 31/12 promise à l'écran membre alors que la décision 10 la reporte, `LIBERAL_CIBLE` annoncée en CONFIG alors qu'elle n'existe pas. **Nouvelle règle : une décision périmée est supprimée, jamais démentie sous elle.** |
