# Module libéral — Document de conception

*Élaboré le 02/07/2026 (Arthur + assistant). **Révisé le 04/07/2026** : ajout du squelette*
*d'architecture (3 couches, 2 horloges), de l'invariant « on pilote une fraction »,*
*du cycle de vie de l'intervention et de la 4ᵉ catégorie de rendement (réa).*
*À relire avant toute implémentation.*
*Calendrier : construction APRÈS le go-live d'octobre 2026, et APRÈS « secteurs étape 2 ».*
*Rien ne part en prod tant que ce plan n'est pas clair et précis. On ne code pas encore.*

---

## 1. Contexte et objectif

Les MARs éligibles (PH titulaires, ≥ 1 an) exercent une activité libérale intra-hospitalière
au sein d'un **groupement qui partage les revenus**. Règle administrative : le libéral d'un
praticien ne peut dépasser **30 % de son activité totale** (donc **70 % de public minimum**).
Ce pourcentage correspond à une **somme d'argent**, pas à un volume d'actes. Au 31/12, si le
seuil est franchi, l'excédent est **reversé à l'hôpital**.

**Objectif du module : la convergence collective.** Tous les membres terminent l'année **le
plus près possible de 30 % sans jamais le franchir**.
- Finir sous la cible = revenu autorisé non réalisé (manque à gagner pour le groupe) ;
- Finir au-dessus = revenu confisqué (perte sèche pour le groupe).

Ce n'est pas une alarme de dépassement : c'est un **pilote de convergence vers une cible**,
sur le modèle de l'algorithme de gardes (cible → écart mesuré → correction par affectations).

---

## 2. L'invariant central : on pilote une FRACTION, pas un compteur

Le seuil porte sur un **ratio** :

```
        L (libéral, base CCAM)
ratio = ──────────────────────      plafond 30 %
        L + P (public, base CCAM)
```

Algèbre du seuil : `ratio ≤ 30 %` ⟺ **`L ≤ 3/7 · P`** ⟺ **`P ≥ 7/3 · L`**.
→ Il faut **≈ 2,33 € de public pour chaque € de libéral**.

Conséquences structurantes (ce point gouverne tout le reste) :

- **Deux leviers, non symétriques.** On redescend le ratio en faisant **moins de libéral**
  (numérateur) **ou plus de public** (dénominateur). Le « frigo » du doc initial (geler le
  numérateur) n'est qu'**un** des deux leviers ; ajouter du public est l'autre, souvent plus
  puissant. Le frigo *est* d'ailleurs un ajout de dénominateur déguisé.
- **Le % seul ment.** Deux MARs à 28 % ne sont pas dans la même situation : `L=28/P=72` a de
  la marge ; `L=2,8/P=7,2` (dix fois moins d'activité) est fragile — un mois creux en public
  le fait basculer. → **Le module suit L et P séparément, pas le % consolidé.**
- **Les dépassements d'honoraires ne comptent pas.** Seuls les actes **CCAM** font monter le
  ratio. Le dépassement sort du calcul de convergence.

---

## 3. Principes non négociables

1. **Zéro donnée patient.** Le module manipule (date, MAR, secteur, éventuel code CCAM sur sa
   propre activité). Jamais de nom de patient, jamais d'acte rattaché à un patient.
2. **Chiffres officiels recopiés, jamais calculés.** L'administration communique en fin de
   mois, par MAR, le **montant libéral € ET le montant public €** (le document contient bien
   les deux). Le module **recopie** ; il n'estime pas, il ne certifie pas. Mention permanente :
   « Chiffres issus des relevés administratifs — le décompte officiel relève de
   l'administration. »
3. **Le module éclaire, le comité décide.** Recommandations d'affectation, jamais d'affectation
   automatique. Côté planning quotidien : **affichage seul** des contraintes, le comité garde
   la main.
4. **Visibilité = le groupement.** Pas de confidentialité entre membres (revenus partagés).
   Les non-membres (non-éligibles, < 1 an) ne voient rien du volet financier.
5. **Aucune grille tarifaire devinée ni en dur.** Traduire un CCAM en euros (réa ou autre) ne
   se fait jamais de mémoire ni codé en dur. La source de vérité reste le **relevé**. Si un
   jour une table tarifaire est utile (cf. V2, §8), elle vit dans un onglet CONFIG paramétrable,
   maintenu à la main depuis la source officielle (ameli).

---

## 4. Architecture : 3 couches disjointes qui se parlent

Le CA n'est **jamais** observable en temps réel par le module : le seul signal argent est le
relevé administratif, agrégé et retardé (M+1). D'où trois couches à ne pas confondre.

| Couche | Nature | Source | Rôle |
|--------|--------|--------|------|
| **Activité** | Déterministe, maîtrisée par le module | Déclarations MAR + planning quotidien | Placement : « qui doit être au bloc, où, quand » |
| **Argent** | Observée, retardée, opaque | Relevé mensuel de l'administration | Mesure : L et P par MAR/mois |
| **Pilotage** | Dérivée | Croise Activité × Argent × rendement secteurs | Projection + recommandations + équité |

**Le module ne déduit jamais l'euro à partir de l'acte.** Il **observe** l'activité,
**recopie** l'argent, **corrèle** les deux dans le temps pour piloter. Les couches Activité et
Argent restent **disjointes** (on ne reconstitue pas le CA depuis les interventions) mais
**communiquent** via la couche Pilotage.

---

## 5. Les temporalités : 2 horloges + 1 horizon

- **Horloge quotidienne / hebdo (couche Activité).** Consult J0 → contrainte de présence bloc
  à J+X → conflit ou OK. Re-vérifiée **automatiquement à chaque avancée de l'horizon publié**.
- **Horloge mensuelle (couche Pilotage).** Relevé M → projection 31/12 → reco M+1 → arbitrage
  comité → relevé suivant qui **recale tout**. Boucle **auto-corrigée** : les erreurs de
  prédiction ne s'accumulent pas.
- **Horizon annuel (couche Argent).** Cible 31/12. **Décembre est piloté à l'aveugle** (son
  relevé n'arrive que fin janvier, après la clôture) → d'où la cible **≈ 29 %, pas 30,0 %**
  (`LIBERAL_CIBLE` en CONFIG). Asymétrie assumée : finir à 29 % coûte peu, finir à 31 % coûte
  un reversement. À recalibrer après un an d'historique (volatilité réelle des relevés).

---

## 6. Couche ACTIVITÉ — l'intervention

### 6.1 L'intervention est un objet à cycle de vie

Le double dating est structurant : la consult (J0) crée l'intervention, souvent quand la
semaine du bloc (J+X, de 2 jours à 3 semaines) **n'est pas encore planifiée**. L'intervention
« attend » puis **s'active automatiquement** quand l'horizon publié atteint sa semaine.

```
à programmer (date bloc inconnue)
      │  (le MAR pose la date)
      ▼
déclarée (hors horizon)  ──►  active (semaine planifiée)  ──►  OK / conflit  ──►  réalisée
```

### 6.2 Schéma de données `LIBERAL_{Y}`

`DATE_BLOC | MAR_ID | SECTEUR | CCAM (optionnel) | COMMENTAIRE`

- **`SECTEUR`** référence `SECTEURS_CFG` (→ dépendance Lot 0). Indispensable : le comité doit
  savoir non seulement que Dr X « doit être au bloc » mais qu'il doit être à **ORTHO**.
  « ORTHO » est une info **logistique**, pas médicale.
- **`CCAM` optionnel** : **collecté dès la V1, non exploité en V1** (gratuit à prévoir, coûteux
  à reconstituer après coup). Curseur à bouger consciemment : stocker un CCAM range un *acte*
  dans le module — défendable car sans patient et sur la propre activité de facturation du MAR,
  mais c'est une décision volontaire (cf. §3.1).
- **Granularité : une ligne = une journée-bloc, pas un patient.** 3 patients le même jour au
  même bloc = **une** déclaration (la contrainte de présence est la même).
- Une intervention peut naître **sans date** (état « à programmer ») ; le MAR revient poser la
  date quand elle tombe.

### 6.3 Workflow concret du MAR (~20 s, dans indispos.html → « Activité libérale »)

1. Après la consult (J0), le MAR **déclare** : date de bloc + secteur + commentaire libre
   optionnel. Rien d'autre. Aucun patient, aucun acte.
2. Le module range dans `LIBERAL_{Y}` et affecte l'état selon l'horizon (active tout de suite
   si la semaine est déjà planifiée, sinon en attente).
3. Après le jour J, l'intervention passe **réalisée** → nourrit l'historique *placement*
   (disjoint du €).

### 6.4 Côté comité (admin.html) — AFFICHAGE SEUL (décision actée)

Flux **bidirectionnel** :
- **descendant** (le plus utile) : le 12/01, la journée porte le marqueur « Dr X → ORTHO
  (libéral) » **au moment où le comité planifie**, même si l'affectation par défaut de Dr X
  serait Endos. La vigilance individuelle devient une **info partagée**.
- **remontant** (filet) : si l'affectation retenue contredit l'intervention (autre secteur /
  garde / absence) → **badge de conflit** + suggestion de moindre déplacement.

**Affichage seul, pas de pré-placement** : le comité place à la main. On ne touche pas à la
génération quotidienne (`generatePlanningFromGardes` / overrides).

---

## 7. Couche ARGENT — les relevés

### 7.1 Onglet `LIBERAL_CA_{Y}` (format révisé)

Le relevé mensuel donne **deux masses natives** par MAR : **`€ libéral`** et **`€ public`**
(base CCAM, hors dépassements). On stocke **les deux montants**, jamais le %.

→ Format : **colonnes séparées** (JAN…DEC pour `€ libéral`, JAN…DEC pour `€ public`).
**Pas** de cellule composite « % ; montant » : (a) elle ré-ouvre le risque du bug `parseNum`
déjà vécu sur le Patrimoine (16,1 % lu comme 161) ; (b) le % se **dérive** de L et P, le stocker
créerait des incohérences d'arrondi ; (c) sans les deux masses on ne distingue pas le MAR à
marge du MAR fragile (cf. §2).

### 7.2 Saisie

Prévoir la **même action API** pour saisie par le membre **et** saisie groupée par le comité
(si l'administration envoie un tableau global). Le circuit réel du document tranchera à l'usage.

---

## 8. Couche PILOTAGE — leviers, projection, équité

### 8.1 Projection

**V1 = rythme constaté seul** (simple, déjà utile). Intégrer les affectations prévues → **V2**.
Recale à chaque relevé.

### 8.2 Leviers d'affectation (bilatéraux — cf. §2)

Pour un MAR **au-dessus** de la trajectoire cible :
- **Frigo** (secteur `NUL`) : gèle le numérateur, laisse le dénominateur croître doucement →
  levier **mou**.
- **Réa** (secteur `REA`) : levier **dur bilatéral** — gèle le libéral (zéro acte possible) ET
  fait **monter franchement le public** (forfaits réa). C'est le rattrapage le plus puissant et
  le seul **binaire, non ambigu**.

Pour un MAR **en dessous** → secteurs à rendement **FORT**.

### 8.3 Équité résiduelle : le désagrément, pas l'argent

L'argent est partagé → l'équité ne porte pas sur les revenus mais sur le **désagrément** des
passages « au frigo »/réa contraints : comptés par membre, **tournants**, même logique que
l'équité VD des gardes.

---

## 9. Secteurs et `RENDEMENT_LIB` (dépendance : « secteurs étape 2 »)

Attribut **rendement libéral par secteur**, à **4 valeurs** (et non 3) :

| Valeur | Effet sur la fraction | Exemple |
|--------|-----------------------|---------|
| `FORT` | libéral rentable (numérateur ↑) | blocs à forte activité libérale |
| `MOYEN` | libéral modéré | — |
| `NUL` | gèle le numérateur (frigo) | secteurs sans libéral |
| `REA` | **gèle le libéral ET génère du public** (levier dur) | réanimation |

La **réa** n'est pas un simple `NUL` : les `NUL` **empêchent la hausse**, la `REA` **fait
redescendre activement**. Pour le moteur de reco (Lot 4), c'est « mets-le au frigo pour stopper »
vs « mets-le en réa pour rattraper » — deux intentions → deux valeurs.

Détail d'implémentation : la réa **n'est pas une intervention libérale**, elle vit dans le
planning normal (codée YYYY015 / YYYY020, forfaits A/B, binaire). Le module la lit donc depuis
**l'affectation quotidienne**, pas depuis `LIBERAL_{Y}`. Son montant réel arrive **déjà** dans
le `€ public` du relevé → le module n'a **pas** besoin de connaître le tarif des forfaits.

Classification manuelle par le comité. Prérequis : externaliser `SECTEURS_CFG` (aujourd'hui en
dur en haut d'`admin.html`, source unique — étape 1 faite) dans un **onglet Google Sheet**
+ colonne `RENDEMENT_LIB`. Chantier déjà au backlog pour le déménagement 2027 → une pierre
deux coups.

---

## 10. Données (récapitulatif des onglets)

- `LIBERAL_{Y}` — interventions : `DATE_BLOC | MAR_ID | SECTEUR | CCAM? | COMMENTAIRE`
  (auto-créé dans `setupAnnee`, même pattern qu'`INDISPOS_${year}`).
- `LIBERAL_CA_{Y}` — relevés : colonnes séparées `€ libéral` (JAN…DEC) + `€ public` (JAN…DEC),
  une ligne par membre.
- `MEDECINS` — colonne `LIBERAL (O/N)` : appartenance au groupement (maintenue à la main —
  décision administrative, pas algorithmique).
- `SECTEURS` (Lot 0) — externalisation de `SECTEURS_CFG` + colonne `RENDEMENT_LIB`.
- `CONFIG` — `LIBERAL_CIBLE` (défaut 29), calibration à l'usage.

---

## 11. Interfaces

### Côté membre (indispos.html) — onglet « Activité libérale »
- Déclarer une intervention (date bloc + secteur) → brique placement.
- Saisir/consulter les relevés mensuels (les membres voient tout le groupe).
- Vue convergence : L, P, écart à la cible, projection 31/12.

### Côté comité (admin.html)
- Vue convergence du groupe : tous les membres, tri par risque, projections (L et P, pas juste
  le %).
- Recommandations mensuelles frigo / REA / FORT.
- Compteur d'équité des passages au frigo/réa contraints.
- Badges de conflit « intervention sans présence bloc » dans le planning quotidien (affichage
  seul).
- Saisie de rattrapage des relevés.

---

## 12. Ordre de construction (lots — chacun utilisable seul)

Chemin critique : **0 → 1 → 2 → 4**, le **Lot 3 parallélisable après le Lot 1**.
Rien avant le go-live octobre 2026.

- **Lot 0 — Secteurs étape 2.** `SECTEURS_CFG` → onglet `SECTEURS` + `RENDEMENT_LIB` (4 valeurs).
  Débloque le libéral ET le déménagement 2027. Seul lot à faire tôt.
- **Lot 1 — Fondations données.** Colonne `LIBERAL (O/N)` dans MEDECINS ; onglets `LIBERAL_{Y}`
  et `LIBERAL_CA_{Y}` auto-créés ; actions API ajoutées à `WRITE_ACTIONS` (verrou déjà en
  place) ; visibilité groupement. Plomberie, pas d'UI riche.
- **Lot 2 — Convergence (cœur métier).** Saisie relevés (L + P) ; vue écart-à-cible + projection
  31/12 au rythme constaté ; membre (indispos.html) et comité (admin.html). **Ne dépend pas du
  Lot 0.**
- **Lot 3 — Placement bloc.** Saisie interventions → `LIBERAL_{Y}` ; badge de conflit dans le
  planning quotidien (affichage seul). Dépend du Lot 1 seul, parallélisable.
- **Lot 4 — Recommandations + équité.** Reco mensuelles frigo/REA/FORT (nécessite
  `RENDEMENT_LIB` → Lot 0) ; compteur d'équité tournant. Dépend Lot 0 + Lot 2.

---

## 13. Décisions actées

1. **Format `LIBERAL_CA_{Y}` = deux masses € séparées** (libéral + public), pas de composite.
2. **On pilote L et P séparément**, pas le % consolidé.
3. **Affichage seul** côté comité (pas de pré-placement automatique).
4. **`RENDEMENT_LIB` à 4 valeurs** (FORT / MOYEN / NUL / REA).
5. **`CCAM` collecté en V1, non exploité** ; jamais de grille tarifaire devinée/en dur.
6. **Silos volontaires V1** : pas d'estimation acte→€ avant un an d'historique.
7. **Convergence individuelle vers 29 %** en V1 ; optimisation collective fine = V2.
8. **Équité = le désagrément** (frigo/réa), pas l'argent (partagé).
9. **Projection V1 = rythme constaté** ; affectations prévues = V2.

---

## 14. Questions encore ouvertes (à trancher à l'implémentation)

- **Comprendre le CR mensuel de l'administration** : circuit réel, format exact du document,
  qui le reçoit et qui saisit. → Arthur enquête.
- Valeur définitive de `LIBERAL_CIBLE` (29 ? à calibrer avec le groupe après un an de
  volatilité observée).
- Cas « intervention à programmer sans date » : fréquence réelle (la date du bloc est-elle
  souvent inconnue à la sortie de consult ?). → conditionne le poids de l'état « à programmer ».
- **V2 éventuelle — estimateur temps réel** : si l'on veut prévisualiser L (et P) entre deux
  relevés à partir des CCAM, la table tarifaire vit en CONFIG paramétrable (source ameli),
  jamais en dur ; le relevé reste la source de vérité.
