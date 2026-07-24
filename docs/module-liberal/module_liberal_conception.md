# Module libéral — Document de conception

*Élaboré le 02/07/2026 · révisé le 04/07/2026 (squelette d'architecture).*
***Révision v3 — 07/07/2026** : intégration du CR administratif réel (activité jan→juin 2026).*
*Découverte majeure : le seuil de 30 % s'applique **par axe** (CCAM technique ET NGAP*
*consultations), pas sur un total unique. Fonction objectif reformulée (pot commun).*
***v3.1 — 07/07/2026** : correction — la consultation libérale (NGAP, J0) **déclenche** le*
*placement au bloc (J+X) ; un parcours alimente les deux axes. Ajout de `DATE_CONSULT`.*
***v3.2 — 07/07/2026** : `LIBERAL_CIBLE` fixée à **30 % par axe** (au lieu de 29) + borne de*
*décembre (libéral permis calculé sur le cumul de novembre pour le mois non observable).*
***v3.3 — 07/07/2026** : circuit de saisie figé — groupée mensuelle depuis PDF/papier, sécurisée*
*par checksum (total du document) + contrôle de monotonie du cumul.*
***v3.4 — 07/07/2026** : la date opératoire est toujours connue dès la consultation → suppression*
*de l'état « à programmer sans date » du cycle de vie de l'intervention.*
***v3.5 — 08/07/2026** : correction schéma `LIBERAL_CA_{Y}` — colonnes EXCÉDENT **recopiées** (6*
*nombres/MAR), pas dérivées : validé sur le relevé réel (checksum illustratif 37 890,45 € exact ; recalcul depuis*
*le % à 2 décimales = 37 824,12 €, faux). Checksum = somme des excédents recopiés.*
***v3.6 — 08/07/2026** : §8.1 refondu — **V1 = compteur de marge sur données réelles** (`marge =*
*(3/7)·P − L`), sans extrapolation « au rythme » (jugée trompeuse sur une activité saisonnière :*
*congés, gardes, blocs fermés) ; la projection d'un montant à fin décembre, fondée sur l'activité*
*planifiée, passe en V2. §13.10 aligné.*
***v3.7 — 12/07/2026** : **règle de calcul de la BR NGAP figée et validée au centime** (8 feuilles*
*réelles) — BR = lettre-clé × coefficient (`C 34,40 · CS 46 · APC 60`), **sans** coefficient*
*monégasque ×1,95 ni modificateur ; la carte ne joue que sur le DH (verte/SPME 0 · rose +20 % ·*
*bulle/français/NAS libre ; **AME 0**). Chaîne complète dans l'antisèche §5 ter. Maquette estimateur*
*(`maquette_estimateur_liberal.html`) mise à jour : axe NGAP doté d'un builder dédié. §14 précisé.*
*Calendrier inchangé : construction APRÈS le go-live d'octobre 2026 et APRÈS « secteurs étape 2 ».*
***v3.8 — 16/07/2026** : statut **AME tranché** (Ord. souveraine 5.743 du 03/03/2016). AME monégasque*
*(≠ française) = résident sans autre couverture, sous condition de ressources → remboursé sur le tarif*
*de responsabilité monégasque (**coeff ×1,95**), **DH 0** (indigent, logique carte verte). Libellé et*
*coefficient confirmés dans la maquette ; question AME close au §14.*
***v3.9 — 16/07/2026** : flux de déclaration acté. **Page du module libéral = point d'entrée unique***
*(devis à l'écran + déclaration écrivante) ; payload `LIBERAL_{Y}` **FERMÉ et sans CCAM** (date_bloc ·*
*MAR · secteur · chirurgie libre optionnelle) ; **tuile Dashboard conditionnée `LIBERAL O/N`** ;*
*ergonomie admin validée sur maquette conditions réelles (volet « ◆ Libéral » gauche par MAR,*
*vert/orange, toast si aucune intervention, grille intacte). indispos.html sort du périmètre libéral.*
*§6.2–6.4, 11, 12, 13 mis à jour.*
***v3.17 — 24/07/2026** : **audit GAS du Lot 5** (lecture réelle des 5 fichiers `gas/`). Source de*
*données identifiée (`planning_{Y}.json` via `getPlanningJson`, code-gated non-admin) ; **prérequis*
*d'organisation** isolé (horizon de placement des consultations 1 → 3–4 semaines) ; **piège des deux*
*listes d'absence** documenté ; code secrétariat + liste blanche actés. Décisions 20 à 22.*

***v3.16 — 24/07/2026** : **plancher de marge résiduelle acté** (≥ 3 patients pour rester en*
*bloc 1 ; conversion euros → patients par **moyenne globale du groupe** en V1) et **bloc 2 replié***
*par défaut. Arbitrage explicité : accepter un risque de dépassement borné plutôt qu'un déplacement*
*systématique. Plus aucun point ouvert sur la couche 2 du Lot 5.*

***v3.15 — 24/07/2026** : **partition en blocs validée** (Arthur) → passe en décision 17. Le §14*
*ne conserve plus que deux points ouverts sur la couche 2 : plancher de marge résiduelle et*
*masquage du bloc 2.*

***v3.14 — 23/07/2026** : **couche 2 du Lot 5 spécifiée** — sortie en **forme A** (deux blocs,*
*chacun chronologique) ; **la secrétaire impose les dates, le patient s'adapte** ; critère de*
*priorité = **marge en euros** (pas en points de %) sur **`min(marge_CCAM, marge_NGAP)`** ; le rang*
*A/B **ne trie plus** (simple mention « sur place » / « se déplace »), il ne sert qu'à la partition.*
*Confidentialité : **assumée** — l'ordre trahit la position financière, arbitrage acté. Partition,*
*plancher et masquage du bloc 2 restent ouverts (§14).*

***v3.13 — 23/07/2026** : ajout de l'**interface secrétaire** (§11 ter, Lot 5) — écran d'orientation*
*des patients libéraux vers un MAR disponible le jour de l'intervention. **Purement consultatif** :*
*aucune écriture, la déclaration reste au MAR au moment de la consultation réelle. Fonctionne sur*
*les **seules données de planning** (aucune donnée financière) → indépendant des Lots 0 et 2.*
*Ordre d'affichage des candidats laissé en question ouverte (§14).*

***v3.12 — 19/07/2026** : **décision** — le pré-remplissage de la fiche praticien sur les devis*
*et déclarations se fera **uniquement via le branchement au portail** (MAR identifié à la connexion*
*→ colonnes dédiées dans `MEDECINS`). **Aucune solution intermédiaire** (localStorage, paramètre*
*d'URL) : elle serait jetée au branchement. La nature des identifiants à stocker pour Monaco*
*(n° d'inscription à l'Ordre, n° praticien CCSS — les champs RPPS/ADELI actuels sont hérités du*
*modèle français) sera tranchée au moment de créer les colonnes.*

***v3.11 — 19/07/2026** : base légale du seuil par axe identifiée — **OS n° 7.766 du 06/11/2019***
*(modifiant l'OS n° 13.839) : contrôle du 30 % **par catégorie d'actes** depuis le 01/01/2020.*
*Redevance : mécanisme confirmé (retenue mensuelle à la source sur les honoraires reversés ; taux/assiette à préciser).*
*Nouvelle exigence intégrée au devis/déclaration (note DAM + ENR/QUA/1086/001) : déclaration de*
*choix **nominative par praticien**, estimation de frais systématique en hospitalisation avec DH.*

***v3.10 — 16/07/2026** : contrainte **non-persistance des champs patient du devis** gravée comme*
*NON NÉGOCIABLE (§3.bis) + **livrable de preuve obligatoire** (test anti-persistance jsdom, scan*
*statique, preuve réseau) exécuté à chaque déploiement et archivable pour audit CCIN / loi 1.565.*
*Périmètre de responsabilité clarifié (technique = module ; conformité = établissement/DPO ; le devis*
*imprimé remplace un papier existant, circuit inchangé). Décision 14 ajoutée.*
*Rien ne part en prod tant que ce plan n'est pas clair et précis. On ne code pas encore.*

> **Confidentialité** : tous les montants et pourcentages cités dans ce document sont des
> **valeurs illustratives** (ordres de grandeur réalistes), pas les chiffres réels des relevés
> administratifs. Aucun praticien n'y est identifiable.

---

## 1. Contexte et objectif

Les MARs éligibles (PH titulaires, ≥ 1 an) exercent une activité libérale intra-hospitalière au
sein d'un **groupement à revenus mutualisés** (compte bancaire commun). Règle administrative : le
libéral d'un praticien ne peut dépasser **30 % de son activité**, appliqué **séparément sur deux
axes** (cf. §2). L'excédent au 31/12 est **reversé à l'hôpital par le groupe** (pas par
l'individu).

**Objectif = optimiser le pot commun**, pas surveiller des individus. Comme le revenu est
mutualisé et l'excédent perdu, le groupe veut **maximiser le libéral encaissable** :

```
maximiser   Σ_axes Σ_praticiens  min( libéral,  30 % × total )
```

Deux façons de perdre de l'argent collectif :
- un praticien **au-dessus** de 30 % → le surplus est reversé (perte sèche) ;
- un praticien **sous-employé** (< 30 %) → marge autorisée non réalisée (manque à gagner).

Le levier maître est donc la **réallocation des vacations libérales** du saturé vers le
sous-employé — elle corrige les deux pertes à la fois. Le module est un **optimiseur de
réallocation**, pas un garde-fou anti-dépassement.

---

## 2. L'invariant central : DEUX fractions, DEUX plafonds

**Base légale (v3.11)** : OS n° 7.766 du 06/11/2019 modifiant l'OS n° 13.839 du 29/12/1998 —
le contrôle de la limitation à 30 % s'opère **par catégorie d'actes** depuis le 01/01/2020 et
« ne se mesure plus globalement » (courrier DG CHPG du 17/12/2019). La règle bi-axiale n'est
donc pas une pratique administrative : c'est le texte.

Le CR administratif réel (jan→juin 2026, décodé et validé au centime : la somme reconstruite des
excédents = 37 890,45 € [valeur illustrative], exactement la ligne « ACTIVITÉ LIBÉRALE ») établit que le seuil de 30 %
s'applique **indépendamment sur deux axes** :

```
axe CCAM  (actes techniques d'anesthésie)  :  L_ccam / T_ccam  ≤ 30 %
axe NGAP  (consultations pré-anesth., CS)  :  L_ngap / T_ngap  ≤ 30 %
```

- `T_ccam`, `T_ngap` = **totaux** de l'activité sur chaque axe (**public + libéral**).
- Les deux `%` du document = **parts libérales** de chaque axe.
- `excédent_axe = T_axe × (%_axe − 30)` si `%_axe > 30`, sinon 0. Vérifié à l'euro près.
- **Les deux plafonds sont indépendants** : on peut être conforme sur un axe et en excédent sur
  l'autre. Exemple réel : un praticien à `24,1 % CCAM` (large marge) mais `47,2 % NGAP`
  (excédent d'environ 610 €) [valeurs illustratives].

Conséquences structurantes :

- **Le module suit et projette DEUX ratios**, jamais un % consolidé.
- **Les leviers sont spécifiques à l'axe** (cf. §8) : ce qui corrige le CCAM ne corrige pas le
  NGAP. La **réa**, par exemple, ne joue **que** sur l'axe CCAM.
- Les **dépassements d'honoraires** (secteur 2 / DE) n'apparaissent pas dans ce calcul et ne
  comptent pas ; seuls CCAM et NGAP font monter les ratios.
- Algèbre par axe : `% ≤ 30 %` ⟺ `L ≤ 3/7 · P` ⟺ `P ≥ 7/3 · L` (≈ 2,33 € de public par € de
  libéral). Le public est un **levier à part entière**, pas seulement le frigo.

---

## 3. Principes non négociables

1. **Zéro donnée patient *persistée*.** Les couches Pilotage et Placement ne manipulent que (date,
   MAR, secteur, éventuel code sur sa propre activité) — jamais de nom de patient, jamais d'acte
   rattaché à un patient. Le sous-module **estimateur / devis** (axe RAC) affiche transitoirement un
   nom de patient à l'écran pour produire le devis, mais **ne le persiste jamais** : calculette sans
   mémoire, aucune écriture serveur (GitHub / Sheets / Drive) ni navigateur, champ effacé à la
   fermeture. Voir la note « Sécurité des données » ci-dessous.
2. **Chiffres officiels recopiés, jamais calculés.** L'administration communique **chaque mois**
   un tableau **cumulé depuis janvier**, par MAR : `T_ccam`, `T_ngap`, `%_ccam`, `%_ngap` (+ les
   excédents). Le module **recopie** ; il n'estime pas, il ne certifie pas. Mention permanente :
   « Chiffres issus des relevés administratifs — le décompte officiel relève de l'administration. »
3. **Le module éclaire, le comité décide.** Recommandations, jamais d'affectation automatique.
   Côté planning quotidien : **affichage seul** des contraintes.
4. **Visibilité = le groupement.** Revenus mutualisés → pas de confidentialité entre membres.
   Les non-membres (non-éligibles, < 1 an) ne voient rien du volet financier.
5. **Aucune grille tarifaire devinée ni en dur.** La source de vérité reste le relevé. Une table
   tarifaire (cf. V2, §8) ne vivrait qu'en CONFIG paramétrable, maintenue depuis la source
   officielle (ameli).

**Note — Sécurité des données.** La sécurité du module ne repose pas sur un cadenas mais sur une
discipline architecturale : classer la donnée, puis appliquer à chacune le bon régime. Quatre
natures : (a) **donnée patient sensible** (garanties mutuelle, n° AMC, RAC nominatif) → **jamais
persistée**, principe stateless ci-dessus ; (b) **donnée praticien** (nom, RPPS, ADELI) → profil MAR
(`MEDECINS`), jamais dans un JSON publié ; (c) **donnée financière du groupement** (ratios, revenus,
excédents) → non médicale mais confidentielle : c'est là que le contrôle d'accès a un vrai sens
(cloisonnement membre `LIBERAL O/N` / non-membre), avec des données **agrégées** uniquement ; (d)
**référentiel non-patient** (CCAM→BR, formules mutuelle) → technique, sourcé et versionné, sans lien
patient. Un « code perso » sur GitHub Pages + GAS est de l'**identification de confort**, pas une
barrière cryptographique : suffisant pour personnaliser le devis (rien de patient stocké), mais la
vraie protection du financier est qu'il **ne contienne aucune donnée patient**. Un suivi patient
réellement persistant sortirait de cette stack (hébergement agréé, consentement, DPO) — décision
hôpital, pas évolution du module. Détail dans `guide_module_liberal.md`, §6.

### 3.bis Contrainte NON NÉGOCIABLE — non-persistance des champs patient du devis

**La règle.** Aucun champ patient saisi à l'ouverture du devis (nom, prénom, mutuelle, RAC nominatif,
date de naissance…) ne doit **JAMAIS** être écrit dans un quelconque stockage :
- **navigateur** — `localStorage`, `sessionStorage`, `IndexedDB`, cookies, cache : interdits sur tout
  champ patient (c'est la fuite n°1 : ça survit à la fermeture de l'onglet) ;
- **réseau** — le remplissage du devis ne déclenche **aucune** requête sortante portant un champ
  patient ;
- **URL / hash** — jamais un nom en paramètre (fuite via historique, logs, referer) ;
- **pas d'autosave, pas de brouillon, pas d'historique de devis.**

Les champs sont vidés par **effacement actif à la fermeture**. Le seul canal écrivant du module est la
**déclaration d'intervention**, dont le payload est **fermé** (`DATE_BLOC · MAR_ID · SECTEUR ·
CHIRURGIE`) — sans aucune donnée patient.

**Pourquoi c'est central.** On ne peut pas voler ce qui n'existe pas. Tant que rien n'est stocké, le
module ne peut pas être la source d'une **fuite** de données patient (risque de confidentialité nul) ;
il ne reste qu'un risque d'**intégrité** (qu'on abîme le planning / les déclarations), qui se gère par
l'hygiène des accès. Le jour où une évolution ajouterait un stockage patient « pour le confort », le
module basculerait de l'autre côté — d'où le verrou ci-dessous.

**Livrable de preuve OBLIGATOIRE (code de production).** La contrainte doit être **démontrée, pas
déclarée**. Le code de production livre, et exécute à chaque déploiement (au même titre que
`node --check` et la validation `JSON.parse`) :
1. un **test anti-persistance** (jsdom) qui ouvre le devis, le remplit avec un patient fictif, ferme
   la page, puis **inspecte** `localStorage`, `sessionStorage`, `IndexedDB`, cookies, variables et DOM,
   et **échoue** si la moindre trace subsiste ;
2. un **scan statique** interdisant toute référence à un stockage navigateur sur les champs devis ;
3. la **preuve réseau** qu'aucune requête sortante ne contient de champ patient.
Le résultat est **archivable** comme preuve reproductible pour un audit (CCIN / loi n° 1.565).

**Périmètre de responsabilité (à ne pas confondre).** Ce dispositif couvre le **numérique**. Le devis
**imprimé** porte un nom : sa manipulation, sa conservation et sa destruction relèvent du **circuit
documentaire de l'établissement** — étant entendu qu'il **remplace un papier déjà existant** (devis
actuel), à circuit inchangé, et qu'il est mieux fait (mentions conformes, aucune trace numérique). La
**conformité** à la loi monégasque **n° 1.565** sur la protection des données personnelles relève de
l'**établissement / DPO / CCIN**, pas d'une garantie technique ni d'une certification par l'assistant :
le module fournit la **preuve technique** (tests ci-dessus), l'établissement porte la conformité.

---

## 4. Architecture : 3 couches disjointes qui se parlent

Le CA n'est **jamais** observable en temps réel : le seul signal argent est le relevé
administratif cumulé, retardé (M+1). D'où trois couches.

| Couche | Nature | Source | Rôle |
|--------|--------|--------|------|
| **Activité** | Déterministe, maîtrisée | Déclarations MAR + planning quotidien | Placement : présence bloc (axe **CCAM**) |
| **Argent** | Observée, retardée, cumulée | Relevé mensuel de l'administration | Mesure : `T`/`%`/`excédent` (recopié) des **deux axes** par MAR |
| **Pilotage** | Dérivée | Croise Activité × Argent × rendement secteurs | Projection + réallocation + équité |

Le module **observe** l'activité, **recopie** l'argent, **corrèle** pour piloter — il ne reconstitue
jamais le CA depuis les actes. Couches Activité et Argent **disjointes** mais reliées par le
Pilotage.

**Note de périmètre :** un **parcours libéral** = une **consultation (J0, facturée NGAP)** suivie
d'un **acte au bloc (J+X, facturé CCAM)**. C'est la **consultation qui déclenche le placement** :
voir une patiente le 02/01 pour une PTG prévue le 15/01 crée l'obligation d'être au bloc le 15/01.
L'objet « intervention » (§6) matérialise ce parcours et **alimente les deux axes** de facturation ;
la **contrainte de présence tombe le jour du bloc** (acte CCAM). Le NGAP n'est donc **pas** hors
placement — il en est le **point d'entrée**.

---

## 5. Les temporalités : 2 horloges + 1 horizon

- **Horloge quotidienne / hebdo (couche Activité).** Consult J0 → contrainte de présence bloc à
  J+X (axe CCAM) → conflit ou OK. Re-vérifiée **à chaque avancée de l'horizon publié**.
- **Horloge mensuelle (couche Pilotage).** Relevé cumulé M → projection 31/12 → reco M+1 →
  arbitrage comité → relevé suivant qui recale. Boucle **auto-corrigée**.
- **Horizon annuel (couche Argent).** Cible 31/12 = **30 % par axe** (`LIBERAL_CIBLE` en CONFIG).
  **Décembre est piloté à l'aveugle** (relevé de décembre reçu fin janvier, après clôture) :
  plutôt qu'une décote forfaitaire, le module calcule à partir du **cumul de novembre** le
  **libéral encore permis en décembre** pour rester ≤ 30 % sur l'année (borne de décembre, exacte). On vise
  ainsi 30 % le reste de l'année sans s'exposer au dépassement sur le mois non observable.

**Le relevé est un CUMUL, pas un flux.** Deux implications fortes :
- **Inertie croissante** : plus l'année avance, plus le % cumulé est difficile à bouger →
  **corriger tôt pèse bien plus que corriger tard**. Le pilotage précoce est prioritaire.
- Le module dérive le **flux du mois** (`cumul_M − cumul_{M-1}`) pour lire la **tendance**, en plus
  du cumul qui donne l'**état**. Sinon on pilote dans le rétroviseur.

---

## 6. Couche ACTIVITÉ — l'intervention (parcours consult → bloc)

### 6.1 Objet à cycle de vie

La **consultation libérale (J0, NGAP) crée l'intervention** et **engage la présence au bloc à J+X**
(l'acte, CCAM). **La date opératoire est toujours connue dès la consultation** — il n'existe pas
d'intervention « à programmer sans date ». La semaine du bloc (2 j à 3 semaines plus tard) n'est
en revanche souvent pas encore planifiée : l'intervention « attend » puis **s'active** quand
l'horizon publié atteint sa semaine. Un même objet porte les deux bouts du parcours : le J0 qui
alimente le NGAP, le J+X qui alimente le CCAM et fait tomber la contrainte de placement.

```
déclarée (date bloc connue, hors horizon)  ──►  active (semaine planifiée)  ──►  OK / conflit  ──►  réalisée
```

### 6.2 Schéma `LIBERAL_{Y}` — payload FERMÉ

`DATE_CONSULT | DATE_BLOC | MAR_ID | SECTEUR | CHIRURGIE (texte libre court, optionnel)`

- **`DATE_CONSULT`** = J0, moment de la consultation libérale (déclencheur, informatif).
- **`DATE_BLOC`** = J+X, jour de l'acte : **toujours renseignée dès la déclaration**, c'est là que
  tombe la contrainte de présence.
- **`SECTEUR`** référence `SECTEURS_CFG` (→ Lot 0). Le comité doit savoir que Dr X doit être à
  **ORTHO**, pas seulement « au bloc ». Info **logistique**, pas médicale.
- **`CHIRURGIE`** : libellé libre court (« PTH », « hernie cœlio »), **optionnel** — sert uniquement
  à donner au comité une idée de la durée du bloc. **Pas de code CCAM** : le code n'apporte rien au
  placement et son niveau de précision est inutile ici (minimisation). Pré-rempli depuis le libellé
  court du parcours coté dans l'estimateur, modifiable, effaçable.
- **Granularité : une ligne = une journée-bloc, pas un patient.**
- **Ce payload est FERMÉ** : ces cinq champs, rien d'autre, jamais. Aucune donnée patient ne
  transite par la déclaration — le nom du patient n'existe que sur le devis, tapé à la main à
  l'écran, imprimé, effacé (cf. note Sécurité §3).

### 6.3 Workflow MAR (~20 s, depuis la PAGE DU MODULE LIBÉRAL)

**La page du module libéral est le point d'entrée unique** : le MAR y cote son parcours, y génère
le devis (à l'écran, sans écriture), et **y déclare l'intervention** — bouton « 📅 Déclarer »
sur le parcours → formulaire pré-rempli (secteur, chirurgie déduite du parcours) → saisie de la
date de bloc → écriture `LIBERAL_{Y}` via l'API GAS. Aucun patient, aucun acte codé. Le module
range et affecte l'état selon l'horizon.

**Prérequis** : l'estimateur doit être **intégré au portail** (MAR identifié à la connexion) pour
que la déclaration porte le bon `MAR_ID` — et pour pré-remplir le praticien sur les devis.
L'ancienne option « onglet Activité libérale dans indispos.html » est **abandonnée** : tout vit sur
la page du module.

### 6.4 Côté comité (admin.html) — AFFICHAGE SEUL, ergonomie actée

**La grille ne change pas d'un pixel** (aucune pastille permanente — à ~20 MARs, tout marquage
dans la grille sature). L'ergonomie validée sur maquette (conditions réelles, juillet 2026) :

- Au clic sur une **case flash** (comportement existant), le panneau d'affectation s'ouvre comme
  aujourd'hui **et**, si des interventions libérales existent ce jour-là, un **volet « ◆ Libéral »
  s'ouvre à gauche** : liste **par MAR** des interventions du jour, chaque ligne colorée —
  **vert** « ✓ déjà en ORT » si le placement satisfait l'intervention, **orange** « ⚠ à replacer →
  ORT (est en ORL) » ou « ⚠ en garde — à arbitrer » sinon. Lecture en check-list de placement.
- **S'il n'y a pas de libéral ce jour** : le volet ne s'ouvre pas et un **toast** le confirme
  (« Aucune intervention libérale ce jour ») — pas de doute de bug, pas de panneau vide.
- Style : vocabulaire visuel existant d'admin (violet `cs-lib` déjà en place pour les consults
  libérales endo).

**Pas de pré-placement** : le comité place à la main. On ne touche pas à
`generatePlanningFromGardes` ; la greffe = `openLibForDay(date)` appelé dans `openSidePanel` +
le volet + la lecture de `LIBERAL_{Y}`. Chirurgicale.

---

## 7. Couche ARGENT — les relevés (deux axes)

### 7.1 Onglet `LIBERAL_CA_{Y}`

Recopie du relevé mensuel **cumulé**, par MAR et par mois, des **6 nombres** de la source :

`MOIS | MAR_ID | T_CCAM | PCT_CCAM | EXC_CCAM | T_NGAP | PCT_NGAP | EXC_NGAP`

Les colonnes **EXCÉDENT sont recopiées, pas dérivées** — validé sur le relevé réel (jan→juin 2026) :
recalculer `T × (%−30)` depuis les % affichés à 2 décimales donne **37 824,12 €** au lieu de
**37 890,45 €** (−66,33 €) [valeurs illustratives], donc le « tombe pile » du checksum est impossible sans les excédents
recopiés. Le module ne **dérive** que le **flux du mois** (différence de cumuls). Le `%` reste
recopié : c'est le ratio du pilotage, seul moyen de connaître la marge d'un MAR **sous 30 %** (où
l'excédent = 0). On stocke ce que dit la source (`T`, `%`, `excédent`) ; on ne recalcule jamais
l'excédent (évite les incohérences d'arrondi).

*(Remplace le format « deux masses € » de la v2 : la réalité est bi-axiale, `T_ccam` et `T_ngap`.)*

### 7.2 Saisie — groupée, mensuelle, depuis PDF/papier

L'administration diffuse le tableau en **PDF/papier** (pas de fichier exploitable) → pas d'import,
**saisie manuelle mensuelle**. **Voie principale : saisie groupée** par une personne (Arthur ou un
référent du groupe, à définir) : les ~17 lignes × 4 nombres (`T_ccam`, `%_ccam`, `T_ngap`,
`%_ngap`) reportées en une fois, le cumul du mois. Le seul risque étant la **faute de frappe**,
deux garde-fous **gratuits** offerts par le document :

1. **Checksum de bout en bout.** La ligne du bas du PDF (« ACTIVITÉ LIBÉRALE » — le total de tous
   les excédents, ex. 37 890,45 € [illustratif]) est un total de contrôle. Le référent le saisit ; le module
   somme les **colonnes EXCÉDENT recopiées** (`Σ EXC_CCAM + EXC_NGAP`) et **valide en vert si ça
   tombe pile à 0,00 près, rouge sinon** (coquille à localiser). Vérifié au centime sur le relevé réel
   (Σ exact, valeur non reproduite ici). Ne **jamais** recalculer depuis le % affiché (2 décimales → écart de plusieurs
   dizaines d'euros). Une saisie validée d'un coup, sans relecture ligne à ligne.
2. **Monotonie du cumul.** Le relevé étant cumulé, chaque total (`T_CCAM`, `T_NGAP`, `EXC_CCAM`,
   `EXC_NGAP`) ne peut que **croître** d'un mois sur l'autre → une valeur qui régresse déclenche une
   alerte de saisie. Le `%`, lui, n'est **pas** monotone (un ratio peut baisser) : pas de contrôle dessus.

Une **action API commune** couvre la saisie groupée et (accessoirement) une saisie par membre.

---

## 8. Couche PILOTAGE — réallocation, leviers par axe, équité

### 8.1 Projection

**V1 ne projette pas — elle mesure.** Sur une activité libérale hospitalière (congés, gardes, blocs
fermés, saisonnalité), extrapoler le cumul « au rythme » produit un chiffre faux qui **induit en
erreur** ; on y renonce. V1 se limite au **certain** : à chaque relevé, pour **chaque MAR et chaque
axe**, elle affiche l'**état** (`T`, `%`) et la **marge encore permise avant 30 %**, ou l'**excédent**
(recopié) si le plafond est déjà franchi.

Marge, à public constant (`P = T·(1−%)`, `L = %·T`) : `marge = (3/7)·P − L = (T/7)·(3 − 10·%)`
(nulle à 30 %, négative = excédent). Vérifiée sur le relevé réel jan→juin 2026 : ~45 000 € de marge
CCAM disponible dans le groupe face à ~31 000 € déjà en excédent — le carburant de la réallocation.

Vue groupe = Σ des marges (capacité libérale inexploitée) vs Σ des excédents (reversé si rien ne
change), par axe. On peut afficher le **flux du mois** (`cumul_M − cumul_{M−1}`) comme **tendance**,
jamais comme prévision. La marge est **prudente** (elle grossit quand le public rentre) ; un excédent
de mi-année reste **corrigible** en montant le public (§5).

**La projection d'un montant à fin décembre est repoussée à la V2**, appuyée sur l'**activité déjà
planifiée** (vacations bloquées, interventions déclarées) — du réel à venir ajouté au dernier cumul
certifié — et non sur une extrapolation.

### 8.2 Leviers — spécifiques à l'axe

| Situation | Levier CCAM | Levier NGAP |
|-----------|-------------|-------------|
| **Au-dessus** de 30 % | frigo (secteur `NUL`, gèle L_ccam) · **réa** (secteur `REA`, monte T_ccam public) · réallouer vacations bloc libérales | **moins de consult libérales** · **plus de consult publiques** (monte T_ngap) |
| **Sous-employé** (< 30 %) | plus de vacations bloc libérales | plus de consult libérales |

**Point dur : la réa ne corrige QUE l'axe CCAM** (forfaits YYYY015/020 = CCAM public). Un excédent
**NGAP** ne se rattrape pas par la réa — seulement par les consultations. Les leviers ne sont pas
interchangeables.

### 8.3 Équité résiduelle : le désagrément, pas l'argent

L'argent est mutualisé → l'équité porte sur le **désagrément** des affectations contraintes
(frigo, réa) : comptées par membre, **tournantes**, même logique que l'équité VD des gardes.

---

## 9. Secteurs et `RENDEMENT_LIB` (dépendance : « secteurs étape 2 »)

Attribut de rendement libéral par secteur, à **4 valeurs**, avec l'**axe** qu'il affecte :

| Valeur | Effet | Axe |
|--------|-------|-----|
| `FORT` | libéral rentable (numérateur ↑) | CCAM |
| `MOYEN` | libéral modéré | CCAM |
| `NUL` | gèle le numérateur (frigo) | — |
| `REA` | gèle le libéral ET **génère du public** (levier dur) | **CCAM** |

La **réa** n'est pas un simple `NUL` : les `NUL` empêchent la hausse, la `REA` fait **redescendre**
le `%_ccam`. Elle **n'est pas** une intervention libérale : elle vit dans le planning normal, codée
YYYY015/020 (binaire), lue depuis **l'affectation quotidienne**, pas depuis `LIBERAL_{Y}`. Son
montant réel arrive **déjà** dans le `T_ccam` du relevé → le module n'a pas besoin du tarif des
forfaits.

Prérequis : externaliser `SECTEURS_CFG` (aujourd'hui en dur en haut d'`admin.html`) dans un onglet
`SECTEURS` + colonne `RENDEMENT_LIB`. Déjà au backlog pour le déménagement 2027 → une pierre deux
coups.

---

## 10. Données (récapitulatif des onglets)

- `LIBERAL_{Y}` — parcours consult→bloc : `DATE_CONSULT | DATE_BLOC | MAR_ID | SECTEUR | CCAM? |
  COMMENTAIRE` (auto-créé dans `setupAnnee`, pattern `INDISPOS_${year}`).
- `LIBERAL_CA_{Y}` — relevés cumulés : `MOIS | MAR_ID | T_CCAM | PCT_CCAM | EXC_CCAM | T_NGAP | PCT_NGAP | EXC_NGAP` (6 nombres recopiés/MAR ; excédents recopiés, pas dérivés).
- `MEDECINS` — colonne `LIBERAL (O/N)` : appartenance au groupement (maintenue à la main).
- `SECTEURS` (Lot 0) — externalisation de `SECTEURS_CFG` + `RENDEMENT_LIB` (4 valeurs).
- `CONFIG` — `LIBERAL_CIBLE` (défaut 30, par axe) + borne de décembre (libéral permis calculé sur le cumul de novembre).

---

## 11. Interfaces

### Côté membre — PAGE DU MODULE LIBÉRAL (point d'entrée unique)
- Accessible via une **tuile « Libéral » du Dashboard, visible uniquement pour les MARs membres du
  groupement** (colonne `LIBERAL (O/N)` de `MEDECINS`) ; MAR identifié à la connexion.
- Coter un parcours (recherche CCAM, tarif act. 4 auto), calibrer le DH sur la mutuelle, générer le
  **devis** (à l'écran, nom du patient tapé à la main, rien de stocké).
- **Déclarer une intervention bloc** (date + secteur + chirurgie libre optionnelle) → `LIBERAL_{Y}`.
- Consulter les relevés du groupe (visibilité totale) ; vue convergence **par axe** : T, %, marge à
  la cible, projection 31/12 (CCAM et NGAP).
- *(indispos.html n'a plus de rôle libéral.)*

### Côté comité (admin.html)
- **Volet « ◆ Libéral »** au clic sur une case flash (cf. §6.4) : interventions du jour par MAR,
  vert/orange ; toast si aucune. Grille intacte.
- Vue convergence du groupe, **deux axes**, tri par risque, projections.
- **Réallocation** : marge de chacun par axe → orienter les vacations libérales.
- Recommandations mensuelles (frigo / réa pour CCAM ; consult publiques pour NGAP).
- Compteur d'équité des affectations contraintes.
- Saisie/rattrapage des relevés.

### Interface secrétaire — orientation des patients libéraux (Lot 5)

**Rôle, et frontière à ne pas franchir.** L'écran ne réserve rien et ne remplace aucun logiciel de
rendez-vous. Il répond à une seule question : *pour une intervention le 15/09 en ORL, quelles dates
de consultation puis-je proposer à ce patient libéral pour qu'il soit endormi par un MAR
effectivement présent ce jour-là ?* La secrétaire relève la date et le nom, puis pose le
rendez-vous dans son outil habituel. C'est la différence entre une brique légère et un projet hors
de portée.

**Entrée.** Date d'intervention + secteur.

**Sortie.** Une **liste de créneaux de consultation triés par date**, chacun portant le nom du MAR
qui la tiendra (`mar. 08/09 — Dr X · jeu. 10/09 — Dr X · lun. 14/09 — Dr Y`). La sortie est une
liste de **dates**, pas un classement de médecins : c'est ce dont la secrétaire a besoin au
téléphone. Le médecin est le moyen, pas la réponse.

**Deux rangs de candidature** (jamais un filtre binaire) :

| Rang | Condition le jour de l'intervention | Usage |
|------|--------------------------------------|-------|
| **A** | affecté au **secteur** de la chirurgie | idéal — pas de déplacement |
| **B** | **présent à l'hôpital**, quel que soit son secteur (réa comprise) | il sort endormir et revient ; vaut pour **tous** les secteurs |

Un MAR **absent** n'est jamais proposé. Le rang B n'est pas un filet de secours occasionnel : le
délai consultation → intervention descend parfois sous 7–10 jours, et la fenêtre de consultation
se réduit alors à un ou deux jours ouvrés — le rang A y sera souvent vide. **Le rang B est un mode
de fonctionnement courant, à traiter comme tel dès la V1.**

**Règle d'affichage imposée par l'accès partagé.** L'accès se fait par un **code unique pour tout
le secrétariat d'anesthésie** (pas de compte nominatif : l'écran n'écrit rien, il n'y a rien à
tracer). Toute personne détenant ce code voit donc la disponibilité de l'équipe. En conséquence :
**l'écran n'affiche jamais de motif d'indisponibilité** — ni congé, ni formation, ni maternité, ni
maladie. Il n'affiche que du positif (les dates où quelqu'un peut) ; une indisponibilité se traduit
par une ligne qui n'existe pas. Aucun montant, aucun pourcentage, aucune position individuelle
n'apparaît en Lot 5.

**Point technique à ne pas rater.** Le filtre doit exclure **tous** les types d'indisponibilité, pas
seulement les congés : jour de temps partiel, repos de garde, formation, réanimation, étages,
consultation, maternité. C'est la seule chose qui peut faire échouer l'outil en silence — proposer
un nom valide en apparence mais indisponible en réalité. Une secrétaire à qui ça arrive deux fois
cesse de s'en servir.

**Pas de décompte de places.** Une journée de consultation est traitée comme une capacité pleine :
le module ne raisonne que sur les patients **libéraux** et ne modélise pas l'activité publique de
la séance (un patient public peut être vu et endormi par deux MARs différents — sans objet ici).

**Consultatif seul — décision actée.** L'écran **n'écrit rien**. Le parcours n'est validé qu'au
moment de la consultation réelle : c'est le **MAR** qui déclare ensuite l'intervention depuis la
page du module libéral (payload fermé, §6.2). Corollaire à assumer : le système ne connaît pas les
orientations proposées, seulement les consultations effectivement réalisées — tout décompte de
répartition accuse donc le **retard du délai de consultation**.

**Couche 2 — priorisation par la marge (ultérieure).** Nécessite le compteur (Lot 2) et donc des
données financières nominatives.

*Critère.* La **marge en euros** (§8.1, `marge = (3/7)·P − L`), et non en points de pourcentage :
deux MARs à 25 % n'ont pas la même capacité résiduelle selon leur quotité, et c'est la capacité
d'absorption en euros qui détermine ce qui est récupérable. Corollaire assumé : le critère avantage
mécaniquement les temps pleins.

*Axe retenu.* Un parcours libéral alimente **les deux** compteurs (consultation → NGAP, bloc →
CCAM, cf. v3.1). Le classement se fait donc sur **`min(marge_CCAM, marge_NGAP)`** — jamais sur un
seul axe : orienter vers un MAR qui a de la marge CCAM mais plus de marge NGAP ne rapporte rien.
L'axe contraignant est le plus souvent le NGAP.

*Effet du rang.* Le rang A/B **ne participe pas au tri** (décision Arthur : mieux vaut faire
traverser l'hôpital à un MAR que perdre de l'argent). Il n'apparaît que comme mention à côté du nom
(« sur place » / « se déplace »). Il ne sert plus qu'à la **partition en blocs** (ci-dessous).

*Conséquence de la forme A.* Chaque bloc étant trié par **date**, le classement par marge n'ordonne
personne : il décide seulement **dans quel bloc** chacun tombe. La priorisation se réduit donc à une
question binaire, nettement plus simple à coder et à expliquer qu'un classement fin.

*Partition — **actée**, cf. décision 17.*

*Plancher de marge résiduelle (décision 18).* Un rang A à marge positive mais faible resterait en
bloc 1 alors qu'il va saturer aussitôt — et l'écran étant consultatif, il ne verra rien avant que
les déclarations MAR ne remontent (fenêtre aveugle de quelques jours à quelques semaines). **Règle :
marge ≥ 3 patients → bloc 1 ; ≤ 2 patients → bloc 2**, même si le MAR est du bon secteur. Le cas
« exactement 3 » reste en bloc 1 : trois places sont encore de la place réelle.

*Pourquoi 3, et pourquoi si bas.* Arbitrage Arthur : mieux vaut s'exposer à un dépassement limité
que solliciter systématiquement un MAR d'un autre secteur. Ce n'est **pas** en contradiction avec la
décision 16 (« plutôt faire traverser que perdre de l'argent ») : les deux situations diffèrent. Si
le MAR du secteur est **saturé**, la perte est **certaine** → on déplace. S'il a **encore de la
place**, la perte n'est qu'un **risque**, et seulement sur les patients orientés pendant la fenêtre
aveugle → on l'accepte pour éviter un déplacement systématique. Avec N = 3, le dépassement éventuel
porte sur quelques patients, jamais sur un flux entier : le risque est **borné**. Valeur de départ à
réviser une fois la durée réelle de la fenêtre aveugle mesurée en service.

*Conversion euros → patients.* Le compteur produit une marge **en euros**, le plancher s'exprime en
**patients** : il faut un montant moyen par patient. En V1, **moyenne globale du groupe**, pas par
secteur — la moyenne sectorielle serait plus juste mais dépend de `RENDEMENT_LIB` (Lot 0), gelé
jusqu'au plan du NCHPG, ce qui bloquerait le Lot 5 sur un chantier à l'arrêt. Le plancher est une
sécurité approximative, pas un calcul comptable : une erreur d'un patient est sans conséquence.

*Bloc 2 replié par défaut (décision 19).* Le bloc « autres dates » est **replié derrière un lien**,
pas supprimé. Motif : si les deux blocs sont visibles côte à côte, un patient qui répond « je ne
peux pas le 8 mais je suis libre le 7 » fait contourner la priorité en trois secondes, sans décision
consciente de personne. Le repli n'est pas un verrou — un clic suffit — mais il fait du bloc 1 le
réflexe par défaut. Cohérent avec la décision 16 (« la secrétaire impose les dates, le patient
s'adapte »). **Un MAR n'est jamais masqué** : en bloc 2 il reste accessible à un clic, et si le
bloc 1 est vide, le bloc 2 devient la réponse — on propose toujours le moins mauvais, jamais rien. Bloc 1 = les **rangs A à marge positive** ; si aucun n'existe,
bloc 1 = les **rangs B à marge positive** ; bloc 2 = tout le reste, marges négatives comprises.
Elle réconcilie les deux règles d'Arthur (« les affectés au secteur sont prioritaires » et « plutôt
faire traverser que perdre de l'argent ») : tant qu'un MAR du secteur a de la marge, l'orienter vers
lui ne perd **aucun** argent, il n'y a rien à arbitrer ; on ne fait traverser l'hôpital que lorsque
le secteur est saturé. Les deux règles ne s'appliquent jamais simultanément.

*Confidentialité — arbitrage assumé.* L'ordre d'affichage **encode la position financière** : un
MAR systématiquement en bloc 2 est visiblement saturé, et la secrétaire finit par le déduire même
sans qu'aucun montant ne soit affiché. On ne pourra donc pas soutenir devant le groupement
qu'« aucune donnée financière n'est exposée » dès lors que la couche 2 est active. **Décision
Arthur (23/07/2026) : arbitrage accepté en connaissance de cause**, pas d'obfuscation (blocs sans
ordre interne, catégories floues). Consigné ici pour que la trace existe si la question est posée
plus tard par le groupe.

*Décalage résiduel.* Le classement s'appuie sur le dernier relevé mensuel et sur les déclarations
MAR postérieures : la position utilisée a plusieurs jours à plusieurs semaines de retard.

**Périmètre de test.** Tous les secteurs d'emblée, sur l'hôpital **actuel** (bloc éclaté). C'est le
cas le plus contraint : au NCHPG, le bloc centralisé rend le rang A beaucoup plus fréquent. Ce qui
marche aujourd'hui marchera forcément après.

**Audit GAS — prérequis techniques (24/07/2026).** Lecture réelle des cinq fichiers `gas/`.

*Source de données.* `planning_{Y}.json` contient déjà, **pour chaque MAR et chaque jour**, quatre
champs : `status` (code GARDES), `morning`, `afternoon` (secteur) et `cs` (consultation). Tout ce
dont la couche 1 a besoin y est **déjà calculé**. Il est servi par l'action **`getPlanningJson`**,
protégée par un code mais **sans exigence de rôle admin** → consommable par un code secrétariat sans
toucher à la logique d'autorisation. Aucune nouvelle donnée à produire.

*⚠️ Piège des deux listes d'absence — ne pas réutiliser `getMARsDispoJour`.* La fonction
`getMARsDispoJour` (Indispos.gs) fait déjà ~80 % du calcul rang A / rang B, mais **deux listes
d'absence divergentes coexistent dans le code** :

| Emplacement | Codes considérés absents |
|---|---|
| `code.gs:245` — `ABSENT_CODES` | `RG V F CTP CP R A TP CL` (9) |
| `Indispos.gs:2773` — `ABSENT_CODES_SET` | `RG V CP F CTP A CL` (7) — **sans `R` ni `TP`** |

`getMARsDispoJour` conserve **volontairement** les `TP` (jour fixe non travaillé) et les `R`, en les
étiquetant : le comité peut vouloir les rappeler pour combler un trou. Pour le Lot 5, c'est
exactement l'échec silencieux redouté — l'écran proposerait un MAR **son jour de non-travail**.
**Le Lot 5 lit `planning_{Y}.json`, il ne réutilise pas `getMARsDispoJour`.**

*Gardes.* `G` et `G2` ne figurent dans aucune des deux listes : un MAR de garde le jour de
l'intervention est compté **présent**. Confirmé par Arthur — il peut endormir un patient libéral
dans la journée, la garde commence le soir.

*🔴 Prérequis d'organisation — bloquant.* `GENERER_CONSULTATIONS = false` : les consultations ne sont
pas générées, le comité les place **à la main** via les overrides. Le champ `cs` n'est donc rempli
que sur l'horizon déjà traité, **une semaine** aujourd'hui. Or l'écran doit proposer des dates de
consultation à 3–4 semaines. Les deux besoins n'ont pas le même horizon : la **disponibilité au jour
de l'intervention** est connue toute l'année (gardes et affectations annuelles), les **jours de
consultation** ne le sont qu'à sept jours. **Passer l'horizon de placement des consultations de 1 à
3–4 semaines est un prérequis dur du Lot 5**, à obtenir du comité avant tout développement.
*Statut : acquis (Arthur, 24/07/2026 — « rien ne l'empêche, ça sera fait »), à confirmer en
pratique.*

*Pas de repli fiable.* `CS_TEMPLATE` ne donne que le **nombre** de créneaux par jour de semaine et
par type (`required[dow][am|pm][code] = n`), jamais **qui** les tient — or c'est le nom qui fait
tout l'intérêt. La logique d'attribution automatique (`CS_RULES`, qui déduit le consultant de son
secteur du mois) existe mais est désactivée **et** fait partie des règles gelées jusqu'au plan du
NCHPG : à ne pas mobiliser pour ça.

*Accès secrétariat.* Entrée **`SECRETARIAT_CODE`** dans `CONFIG` ; `checkCode` renvoie
`{role:'secretariat'}`. Nouveau code **et** nouveau rôle : un code doit porter un rôle, sinon il est
indistinguable d'un MAR. **Liste blanche obligatoire dans le même geste** : aujourd'hui tout ce qui
n'est pas explicitement réservé à l'admin est accessible dès qu'un code est valide — un code
secrétariat atteindrait donc des actions d'écriture, `declareLiberal` en particulier (déléguée à
`portail.gs` sans contrôle de rôle). Le rôle `secretariat` n'a droit qu'aux **lectures nécessaires**,
tout le reste est refusé.

*Déjà en place.* `declareLiberal`, `deleteLiberal`, `listLiberal`, `listLiberalJour` existent dans
`portail.gs`, avec l'onglet `LIBERAL_{Y}`. La déclaration d'intervention est **construite**, pas
seulement conçue → source de données déjà disponible pour le futur compteur.

---

## 12. Ordre de construction (lots — chacun utilisable seul)

Chemin critique : **0 → 1 → 2 → 4**, **Lot 3 parallélisable après le Lot 1**. Rien avant le
go-live octobre 2026.

- **Lot 0 — Secteurs étape 2.** `SECTEURS_CFG` → onglet `SECTEURS` + `RENDEMENT_LIB`. Débloque le
  libéral ET le déménagement 2027. Seul lot à faire tôt.
- **Lot 1 — Fondations données + portail.** Colonne `LIBERAL (O/N)` ; onglets `LIBERAL_{Y}` et
  `LIBERAL_CA_{Y}` auto-créés ; actions API dans `WRITE_ACTIONS` (payload `declareLiberal` FERMÉ :
  date_bloc, secteur, chirurgie? — le MAR_ID vient de la session) ; **intégration de l'estimateur au
  portail** (identité MAR à la connexion, tuile Dashboard conditionnée `LIBERAL O/N`) ; visibilité
  groupement.
- **Lot 2 — Convergence (cœur métier).** Saisie relevés (6 nombres/mois + total de contrôle) ; vue **deux axes** :
  marge + projection ; membre + comité. Ne dépend pas du Lot 0.
- **Lot 3 — Placement bloc.** Bouton « 📅 Déclarer » dans la page libéral → `LIBERAL_{Y}` ; volet
  « ◆ Libéral » + toast dans admin (greffe `openSidePanel`, cf. §6.4). Dépend du Lot 1 seul.
- **Lot 4 — Réallocation + équité.** Reco par axe (nécessite `RENDEMENT_LIB` → Lot 0) ; compteur
  d'équité. Dépend Lot 0 + Lot 2.
- **Lot 5 — Interface secrétaire** (cf. §11 ter). Écran d'orientation à code partagé, **lecture
  seule**. Ne consomme que le planning (affectations sectorielles annuelles + indisponibilités) :
  **indépendant des Lots 0 et 2**, parallélisable immédiatement. Prérequis à vérifier avant de
  coder : la façon dont les indisponibilités sont exposées par la route GAS existante.

---

## 13. Décisions actées

1. **Seuil 30 % appliqué séparément sur DEUX axes** (CCAM technique + NGAP consultations),
   confirmé par le CR réel — pas de seuil global.
2. **Le module suit T, % et excédent (recopié) des deux axes**, jamais un % consolidé.
3. **Objectif = optimiser le pot commun** (`Σ min(libéral, 30%×T)` par axe) via réallocation ;
   la convergence individuelle vers 30 % par axe est le proxy V1.
4. **Leviers spécifiques à l'axe** ; la réa ne corrige que le CCAM.
5. **Relevé mensuel cumulé** → dériver le flux ; corriger tôt >> corriger tard.
6. **Affichage seul** côté comité (pas de pré-placement).
7. **`RENDEMENT_LIB` à 4 valeurs** (FORT / MOYEN / NUL / REA).
8. **Payload de déclaration FERMÉ, sans CCAM** : `DATE_BLOC · MAR_ID · SECTEUR · CHIRURGIE (libellé
   libre optionnel)` — le code n'apporte rien au placement (minimisation) ; jamais de donnée
   patient ; jamais de grille tarifaire devinée.
9. **Équité = le désagrément** (frigo/réa), pas l'argent (mutualisé).
10. **V1 = compteur de marge sur données réelles** (pas d'extrapolation ; `marge = (3/7)·P − L`) ; la **projection** à fin décembre, fondée sur l'**activité planifiée**, est repoussée à la V2.
11. **Saisie groupée mensuelle depuis PDF** (référent), sécurisée par checksum sur le total du
    document + contrôle de monotonie du cumul.
12. **La page du module libéral est le point d'entrée unique** côté MAR : devis (à l'écran, sans
    écriture) ET déclaration d'intervention (écriture au payload fermé). indispos.html n'a plus de
    rôle libéral. Accès par **tuile Dashboard visible seulement si `LIBERAL (O/N) = O`**.
13. **Ergonomie admin actée sur maquette** : grille intacte, volet « ◆ Libéral » à gauche ouvert
    avec le panneau d'affectation (liste par MAR, vert/orange), toast si aucune intervention.
    Stratégie : développer le module jusqu'à ce que le branchement au planning se fasse
    naturellement — la greffe finale reste chirurgicale.
14. **Non-persistance des champs patient du devis = contrainte NON NÉGOCIABLE** (cf. §3.bis) :
    aucun stockage navigateur / réseau / URL, pas d'autosave, effacement à la fermeture. **Preuve
    obligatoire** (test anti-persistance jsdom + scan statique + preuve réseau) exécutée à chaque
    déploiement du code de production et archivable pour audit (CCIN / loi 1.565). La conformité
    juridique relève de l'établissement/DPO, jamais d'une garantie de l'assistant.

15. **Interface secrétaire = aide à la décision, jamais un logiciel de rendez-vous** ; **lecture
    seule** (la déclaration reste au MAR, §11 ter) ; sortie = **liste de dates** de consultation
    avec le nom du MAR ; **deux rangs** (A = affecté au secteur, B = présent à l'hôpital, valable
    pour tous les secteurs) ; **code d'accès unique** pour le secrétariat ; **aucun motif
    d'indisponibilité ni aucun montant affiché**.

16. **Lot 5 couche 2 — critère de priorité** : **marge en euros** sur **`min(marge_CCAM,
    marge_NGAP)`** ; le **rang A/B ne trie pas** (mention seule) et ne sert qu'à la partition en
    blocs ; sortie en **forme A** (bloc « à proposer en priorité » puis bloc « autres dates »,
    chacun chronologique) ; **la secrétaire impose les dates, le patient s'adapte** ; **atteinte à
    la confidentialité de la position financière assumée** (l'ordre la trahit — arbitrage accepté).

17. **Lot 5 — partition en blocs.** Bloc 1 = les **rangs A à marge positive** ; si aucun n'existe,
    bloc 1 = les **rangs B à marge positive** ; bloc 2 = tout le reste, marges négatives comprises.
    Justification : tant qu'un MAR du secteur a de la marge, l'orienter vers lui ne perd aucun
    argent — il n'y a rien à arbitrer ; on ne fait traverser l'hôpital que lorsque le secteur est
    saturé. Les deux règles d'Arthur ne s'appliquent donc jamais simultanément.

18. **Lot 5 — plancher de marge résiduelle** : **≥ 3 patients de marge → bloc 1 ; ≤ 2 → bloc 2**,
    même pour un MAR du bon secteur. Conversion euros → patients par **moyenne globale du groupe**
    en V1 (pas par secteur : dépendrait du Lot 0, gelé). Valeur de départ, à réviser après mesure de
    la fenêtre aveugle en service.
19. **Lot 5 — bloc 2 replié par défaut** derrière un lien « voir d'autres dates ». Pas un verrou ;
    fait du bloc 1 le réflexe. Aucun MAR n'est jamais masqué ; si le bloc 1 est vide, le bloc 2 est
    la réponse.

20. **Lot 5 — source de données** : `planning_{Y}.json` via `getPlanningJson` (déjà code-gated,
    non-admin). **Interdiction de réutiliser `getMARsDispoJour`** : sa liste d'absence conserve
    volontairement `TP` et `R`, ce qui ferait proposer un MAR son jour de non-travail.
21. **Lot 5 — prérequis d'organisation bloquant** : horizon de placement des consultations porté de
    **1 à 3–4 semaines** par le comité. Sans lui l'écran ne peut proposer aucune date utile, et
    aucun repli fiable n'existe (`CS_TEMPLATE` ne nomme personne, `CS_RULES` est gelé).
22. **Lot 5 — accès** : `SECRETARIAT_CODE` dans `CONFIG` → rôle `secretariat`, avec **liste blanche
    d'actions en lecture seule** posée dans le même geste (sans quoi le code atteindrait
    `declareLiberal` et les autres écritures déléguées à `portail.gs`).

---

## 14. Questions encore ouvertes

- `LIBERAL_CIBLE` **fixé à 30 % par axe** (décision Arthur), avec borne de décembre. À
  surveiller en réel : si des dépassements récurrents apparaissent malgré la borne, envisager
  une marge par axe (le NGAP semble plus volatil dans le CR réel).
- **V2 — estimateur temps réel du libéral (indicateur avancé).** Dès la saisie d'une consult, on
  peut estimer le **numérateur** à venir : `Σ actes libéraux déclarés × montant CCAM` (+ le NGAP
  de la consult). **Chiffrage par axe (validé §5 ter de l'antisèche)** : côté **CCAM**, BR = coeff.
  carte (monég. ×1,95 / français ×1,00) × (tarif act.4 ×(1+%mod) × taux d'association + €mod) ;
  côté **NGAP**, BR = **lettre-clé × coefficient** (`C 34,40 · CS 46 · APC 60`), sans ×1,95 ni
  modificateur — la carte n'y touche que le DH, **hors quota**. Le **dénominateur (public)** échappe au module (l'activité publique n'y est pas
  saisie acte par acte) → on n'obtient pas le ratio complet en temps réel, seulement le libéral
  accumulé. Montage utile : **partir du dernier relevé cumulé (socle certifié)** et poser
  par-dessus l'**incrément estimé** des actes déclarés depuis → projection du numérateur bien plus
  fine qu'une extrapolation au rythme (on voit venir un pic **avant** le relevé). Limites qui en
  font un *estimateur*, pas un décompte : le code facturé diverge souvent du code prévu
  (associations, modificateurs, anesthésie indexée sur l'acte chirurgical) ; les actes s'annulent
  ou se reportent ; il faut une **table CCAM→€ en CONFIG paramétrable** (source ameli, jamais
  devinée). À chaque relevé, le chiffre officiel **recale** l'estimation. Le relevé reste la
  source de vérité ; l'estimateur ne certifie jamais rien.
  - **Sortie actionnable — public requis par axe.** À cible 30 %, `P ≥ (7/3)·L ≈ 2,33·L`. Pour
    chaque MAR et chaque axe, l'estimateur calcule le **public minimum requis** (`2,33 ×` libéral
    estimé) et le compare au **public déjà projeté** → il n'affiche que le **déficit** éventuel
    (le public n'*efface* pas le libéral, il le **dilue**). Par axe : le déficit CCAM se comble par
    du public CCAM (blocs publics, réa), le déficit NGAP par des **consultations publiques** — pas
    d'inter-compensation. Le déficit en € se retraduit en **N journées d'affectation** via un
    rendement moyen (approximatif mais directement exploitable par le comité). C'est la brique qui
    relie les deux couches par un chiffre ; l'**optimiseur de réallocation** (ci-dessous) la
    consomme.
- **V2 — optimiseur de réallocation** explicite : proposer au comité *quelles* vacations
  déplacer et de qui vers qui, sous les deux contraintes de plafond. La V1 se contente d'afficher
  les marges ; la V2 optimise.
- **Lot 5 — ordre d'affichage des candidats à disponibilité égale.** Non tranché. Un ordre **fixe**
  (alphabétique ou ordre du tableau) est simple mais **concentre** : la secrétaire est pressée et
  propose la première date qui convient — le premier de la liste absorberait le flux, aggravant le
  déséquilibre que l'outil vise à corriger. **Aucun ordre** reproduit le statu quo (elle propose
  celui qu'elle connaît). L'ordre le plus utile serait **le moins sollicité depuis janvier**, qui
  répartit sans arbitrage et sans afficher de chiffre d'argent — mais l'écran étant consultatif, ce
  décompte ne peut venir que des **déclarations MAR**, donc en retard du délai de consultation :
  juste sur la durée, potentiellement faux sur une journée (cinq orientations le même matin vers le
  même MAR resteraient invisibles). À trancher avant le développement du Lot 5.
- **Lot 5 — affiner la conversion euros → patients (mineur, différé).** La moyenne globale retenue
  en V1 (décision 18) ignore l'écart de rendement entre secteurs. À reprendre si `RENDEMENT_LIB`
  (Lot 0) est un jour dégelé.
- **Lot 5 — zone d'indifférence (mineur, non urgent).** Un tri strict sur la marge ferait traverser
  l'hôpital pour un écart négligeable (12 000 € contre 11 500 €). À marges proches, privilégier
  celui qui est déjà sur place. Sans objet tant que la partition reste binaire.
