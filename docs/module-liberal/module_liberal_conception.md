# Module libéral — document de conception

*Créé le 02/07/2026 · **épuré et remis à plat le 26/07/2026** (v4.0). L'ancien document avait
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

Schéma **réellement en production** : `ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · CHIRURGIE`
— granularité **une journée-bloc dans un secteur** (les déclarations identiques du même jour sont
**fusionnées**), `DATE_CONSULT` posée automatiquement à aujourd'hui, aucun montant.
⚠️ Ce schéma est **remplacé par le 2A** (§6.1). Il reste décrit ici tant que le 2A n'est pas déployé.

### 5.3 Volet comité — `admin.html`
Au clic sur une case flash, le panneau d'affectation s'ouvre **et** un volet « ◆ Libéral » apparaît à
gauche : interventions du jour par MAR, **vert** si le placement satisfait l'intervention, **orange**
sinon (« à replacer → ORT », « en garde — à arbitrer »). Toast si aucune intervention ce jour-là.
**La grille ne change pas d'un pixel** — à 20 MARs, tout marquage permanent sature.

### 5.4 Secteurs — onglet `SECTEURS`
Externalisation faite : `getSecteurs()` lit l'onglet, `admin.html` en dérive toutes ses listes (le
tableau en dur n'est plus qu'un **repli** si l'API ne répond pas). Colonne `RENDEMENT_LIB`
(FORT / MOYEN / NUL / REA) présente et éditable, **pas encore consommée**.

---

## 6. 🔨 À CONSTRUIRE — Lot 2 : mesurer

Trois étapes, dans cet ordre.

### 6.1 2A — Déclaration enrichie

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

### 6.2 2B — Saisie du relevé et marges

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

**Ce qui en a été tiré et qui tourne** : le **Lot 5-bis** (contrôle d'absence côté secrétariat
d'anesthésie), en production depuis le 25/07/2026 — voir la ROADMAP.

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
13. **Ergonomie admin actée** : grille intacte, volet « ◆ Libéral » à gauche, toast si rien.
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
37. **Bouton « Déclarer ce parcours » plutôt qu'un montant obligatoire** : rendre le bon chemin plus
    court, pas plus contraignant. Le taux de couverture dira si ça suffit.

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
| **v4.0 · 26/07** | **Épuration.** 1 287 → ~420 lignes, **un seul fichier**. Lot 5 réduit à un résumé (§7 bis), conception complète laissée à git. Suppression de 9 affirmations fausses ou périmées relevées par audit face au code réel : champ patient inexistant (§3 bis entier), « rien avant octobre 2026 » alors que les lots 0/1/3 tournent, `SECTEURS_CFG` présenté comme à externaliser alors que c'est fait, contradiction 4 vs 6 nombres du relevé, projection 31/12 promise à l'écran membre alors que la décision 10 la reporte, `LIBERAL_CIBLE` annoncée en CONFIG alors qu'elle n'existe pas. **Nouvelle règle : une décision périmée est supprimée, jamais démentie sous elle.** |
