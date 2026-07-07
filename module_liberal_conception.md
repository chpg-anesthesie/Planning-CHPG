# Module libéral — Document de conception

*Élaboré le 02/07/2026 · révisé le 04/07/2026 (squelette d'architecture).*
***Révision v3 — 07/07/2026** : intégration du CR administratif réel (activité jan→juin 2026).*
*Découverte majeure : le seuil de 30 % s'applique **par axe** (CCAM technique ET NGAP*
*consultations), pas sur un total unique. Fonction objectif reformulée (pot commun).*
***v3.1 — 07/07/2026** : correction — la consultation libérale (NGAP, J0) **déclenche** le*
*placement au bloc (J+X) ; un parcours alimente les deux axes. Ajout de `DATE_CONSULT`.*
***v3.2 — 07/07/2026** : `LIBERAL_CIBLE` fixée à **30 % par axe** (au lieu de 29) + borne de*
*décembre (libéral permis calculé sur le cumul de novembre pour le mois non observable).*
*Calendrier inchangé : construction APRÈS le go-live d'octobre 2026 et APRÈS « secteurs étape 2 ».*
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

1. **Zéro donnée patient.** Le module manipule (date, MAR, secteur, éventuel code sur sa propre
   activité). Jamais de nom de patient, jamais d'acte rattaché à un patient.
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

---

## 4. Architecture : 3 couches disjointes qui se parlent

Le CA n'est **jamais** observable en temps réel : le seul signal argent est le relevé
administratif cumulé, retardé (M+1). D'où trois couches.

| Couche | Nature | Source | Rôle |
|--------|--------|--------|------|
| **Activité** | Déterministe, maîtrisée | Déclarations MAR + planning quotidien | Placement : présence bloc (axe **CCAM**) |
| **Argent** | Observée, retardée, cumulée | Relevé mensuel de l'administration | Mesure : `T`/`%` des **deux axes** par MAR |
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
(l'acte, CCAM), souvent quand la semaine du bloc (2 j à 3 semaines plus tard) n'est pas encore
planifiée. L'intervention « attend » puis **s'active** quand l'horizon publié atteint sa semaine.
Un même objet porte donc les deux bouts du parcours : le J0 qui alimente le NGAP, le J+X qui
alimente le CCAM et fait tomber la contrainte de placement.

```
à programmer (date bloc inconnue)
      │  (le MAR pose la date)
      ▼
déclarée (hors horizon)  ──►  active (semaine planifiée)  ──►  OK / conflit  ──►  réalisée
```

### 6.2 Schéma `LIBERAL_{Y}`

`DATE_CONSULT | DATE_BLOC | MAR_ID | SECTEUR | CCAM (optionnel) | COMMENTAIRE`

- **`DATE_CONSULT`** = J0, moment de la consultation libérale (déclencheur). Peut précéder une
  `DATE_BLOC` encore inconnue (état « à programmer »).
- **`DATE_BLOC`** = J+X, jour de l'acte : c'est là que tombe la contrainte de présence.
- **`SECTEUR`** référence `SECTEURS_CFG` (→ Lot 0). Le comité doit savoir que Dr X doit être à
  **ORTHO**, pas seulement « au bloc ». Info **logistique**, pas médicale.
- **`CCAM` optionnel** : collecté dès la V1, **non exploité en V1** (gratuit à prévoir, coûteux à
  reconstituer). Curseur à bouger consciemment (cf. §3.1).
- **Granularité : une ligne = une journée-bloc, pas un patient.**
- Peut naître **sans date** (état « à programmer »).

### 6.3 Workflow MAR (~20 s, indispos.html → « Activité libérale »)

Après la consult (J0), le MAR **déclare** : date de bloc + secteur + commentaire optionnel. Aucun
patient, aucun acte. Le module range dans `LIBERAL_{Y}` et affecte l'état selon l'horizon.

### 6.4 Côté comité (admin.html) — AFFICHAGE SEUL

Flux **descendant** (le 12/01, marqueur « Dr X → ORTHO (libéral) » au moment où le comité
planifie) + **remontant** (badge de conflit si l'affectation contredit l'intervention). **Pas de
pré-placement** : le comité place à la main. On ne touche pas à `generatePlanningFromGardes`.

---

## 7. Couche ARGENT — les relevés (deux axes)

### 7.1 Onglet `LIBERAL_CA_{Y}`

Recopie du relevé mensuel **cumulé**, par MAR et par mois, des **4 nombres** de la source :

`MOIS | MAR_ID | T_CCAM | PCT_CCAM | T_NGAP | PCT_NGAP`

Le module **dérive** : libéral par axe (`% × T`), excédent par axe (`T × (%−30)` si `%>30`), et le
**flux du mois** par différence de cumuls. On stocke ce que dit la source (cumul + %) ; on ne
stocke jamais un excédent ou un flux recalculé (évite les incohérences d'arrondi).

*(Remplace le format « deux masses € » de la v2 : la réalité est bi-axiale, `T_ccam` et `T_ngap`.)*

### 7.2 Saisie

Même action API pour saisie par le membre **et** saisie groupée par le comité (l'administration
envoie un tableau global — la saisie groupée sera probablement la voie principale).

---

## 8. Couche PILOTAGE — réallocation, leviers par axe, équité

### 8.1 Projection

**V1 = rythme constaté** (extrapolation du cumul + tendance du flux récent). Affectations
prévues → V2. Recale à chaque relevé. Afficher pour **chaque MAR sa marge par axe** (combien de
libéral en plus/moins pour viser 30 % sur CCAM et sur NGAP) — c'est le carburant de la
réallocation.

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
- `LIBERAL_CA_{Y}` — relevés cumulés : `MOIS | MAR_ID | T_CCAM | PCT_CCAM | T_NGAP | PCT_NGAP`.
- `MEDECINS` — colonne `LIBERAL (O/N)` : appartenance au groupement (maintenue à la main).
- `SECTEURS` (Lot 0) — externalisation de `SECTEURS_CFG` + `RENDEMENT_LIB` (4 valeurs).
- `CONFIG` — `LIBERAL_CIBLE` (défaut 30, par axe) + borne de décembre (libéral permis calculé sur le cumul de novembre).

---

## 11. Interfaces

### Côté membre (indispos.html) — onglet « Activité libérale »
- Déclarer une intervention bloc (date + secteur).
- Consulter les relevés du groupe (visibilité totale).
- Vue convergence **par axe** : T, %, marge à la cible, projection 31/12 (CCAM et NGAP).

### Côté comité (admin.html)
- Vue convergence du groupe, **deux axes**, tri par risque, projections.
- **Réallocation** : marge de chacun par axe → orienter les vacations libérales.
- Recommandations mensuelles (frigo / réa pour CCAM ; consult publiques pour NGAP).
- Compteur d'équité des affectations contraintes.
- Badges de conflit « intervention sans présence bloc » (affichage seul).
- Saisie/rattrapage des relevés.

---

## 12. Ordre de construction (lots — chacun utilisable seul)

Chemin critique : **0 → 1 → 2 → 4**, **Lot 3 parallélisable après le Lot 1**. Rien avant le
go-live octobre 2026.

- **Lot 0 — Secteurs étape 2.** `SECTEURS_CFG` → onglet `SECTEURS` + `RENDEMENT_LIB`. Débloque le
  libéral ET le déménagement 2027. Seul lot à faire tôt.
- **Lot 1 — Fondations données.** Colonne `LIBERAL (O/N)` ; onglets `LIBERAL_{Y}` et
  `LIBERAL_CA_{Y}` auto-créés ; actions API dans `WRITE_ACTIONS` ; visibilité groupement.
- **Lot 2 — Convergence (cœur métier).** Saisie relevés (4 nombres/mois) ; vue **deux axes** :
  marge + projection ; membre + comité. Ne dépend pas du Lot 0.
- **Lot 3 — Placement bloc.** Saisie interventions → `LIBERAL_{Y}` ; badge de conflit. Dépend du
  Lot 1 seul.
- **Lot 4 — Réallocation + équité.** Reco par axe (nécessite `RENDEMENT_LIB` → Lot 0) ; compteur
  d'équité. Dépend Lot 0 + Lot 2.

---

## 13. Décisions actées

1. **Seuil 30 % appliqué séparément sur DEUX axes** (CCAM technique + NGAP consultations),
   confirmé par le CR réel — pas de seuil global.
2. **Le module suit T et % des deux axes**, jamais un % consolidé.
3. **Objectif = optimiser le pot commun** (`Σ min(libéral, 30%×T)` par axe) via réallocation ;
   la convergence individuelle vers 30 % par axe est le proxy V1.
4. **Leviers spécifiques à l'axe** ; la réa ne corrige que le CCAM.
5. **Relevé mensuel cumulé** → dériver le flux ; corriger tôt >> corriger tard.
6. **Affichage seul** côté comité (pas de pré-placement).
7. **`RENDEMENT_LIB` à 4 valeurs** (FORT / MOYEN / NUL / REA).
8. **`CCAM` collecté en V1, non exploité** ; jamais de grille tarifaire devinée.
9. **Équité = le désagrément** (frigo/réa), pas l'argent (mutualisé).
10. **Projection V1 = rythme constaté** ; affectations prévues = V2.

---

## 14. Questions encore ouvertes

- `LIBERAL_CIBLE` **fixé à 30 % par axe** (décision Arthur), avec borne de décembre. À
  surveiller en réel : si des dépassements récurrents apparaissent malgré la borne, envisager
  une marge par axe (le NGAP semble plus volatil dans le CR réel).
- Fréquence réelle des interventions « à programmer sans date » à la sortie de consult →
  conditionne le poids de cet état.
- **V2 — estimateur temps réel** : prévisualiser les `%` entre deux relevés à partir des codes ;
  table tarifaire en CONFIG paramétrable (source ameli), le relevé restant la source de vérité.
- **V2 — optimiseur de réallocation** explicite : proposer au comité *quelles* vacations
  déplacer et de qui vers qui, sous les deux contraintes de plafond. La V1 se contente d'afficher
  les marges ; la V2 optimise.
