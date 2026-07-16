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
*nombres/MAR), pas dérivées : validé sur le relevé réel (checksum 44 170,30 € exact ; recalcul depuis*
*le % à 2 décimales = 44 103,59 €, faux). Checksum = somme des excédents recopiés.*
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
*Rien ne part en prod tant que ce plan n'est pas clair et précis. On ne code pas encore.*

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

Le CR administratif réel (jan→juin 2026, décodé et validé au centime : la somme reconstruite des
excédents = 44170,30 €, exactement la ligne « ACTIVITÉ LIBÉRALE ») établit que le seuil de 30 %
s'applique **indépendamment sur deux axes** :

```
axe CCAM  (actes techniques d'anesthésie)  :  L_ccam / T_ccam  ≤ 30 %
axe NGAP  (consultations pré-anesth., CS)  :  L_ngap / T_ngap  ≤ 30 %
```

- `T_ccam`, `T_ngap` = **totaux** de l'activité sur chaque axe (**public + libéral**).
- Les deux `%` du document = **parts libérales** de chaque axe.
- `excédent_axe = T_axe × (%_axe − 30)` si `%_axe > 30`, sinon 0. Vérifié à l'euro près.
- **Les deux plafonds sont indépendants** : on peut être conforme sur un axe et en excédent sur
  l'autre. Exemple réel : un praticien à `23,52 % CCAM` (large marge) mais `48,66 % NGAP`
  (excédent de 554 €).

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
recalculer `T × (%−30)` depuis les % affichés à 2 décimales donne **44 103,59 €** au lieu de
**44 170,30 €** (−66,71 €), donc le « tombe pile » du checksum est impossible sans les excédents
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
   les excédents, ex. 44170,3 €) est un total de contrôle. Le référent le saisit ; le module
   somme les **colonnes EXCÉDENT recopiées** (`Σ EXC_CCAM + EXC_NGAP`) et **valide en vert si ça
   tombe pile à 0,00 près, rouge sinon** (coquille à localiser). Vérifié au centime sur le relevé réel
   (Σ = 44 170,30 €). Ne **jamais** recalculer depuis le % affiché (2 décimales → écart de plusieurs
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
