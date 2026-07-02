# Module libéral — Document de conception

*Figé le 02/07/2026 après élaboration Arthur + assistant. À relire avant toute implémentation.*
*Calendrier : construction APRÈS le go-live d'octobre 2026, et APRÈS « secteurs étape 2 ».*

## 1. Contexte et objectif

Les MARs éligibles (PH titulaires, ≥ 1 an) exercent une activité libérale intra-hospitalière
au sein d'un **groupement qui partage les revenus**. Règle administrative : si, au 31/12,
le revenu libéral d'un MAR dépasse **30 %** de son activité totale, l'excédent est
**reversé à l'hôpital**.

**Objectif du module : la convergence collective.** Tous les membres du groupement
terminent l'année **le plus près possible de 30 % sans jamais le franchir**.
- Finir sous la cible = revenu autorisé non réalisé (manque à gagner pour le groupe) ;
- Finir au-dessus = revenu confisqué (perte sèche pour le groupe).

Ce n'est pas une alarme de dépassement : c'est un **pilote de convergence vers une cible**,
sur le modèle de l'algorithme de gardes (cible → écart mesuré → correction par affectations).

## 2. Principes non négociables

1. **Zéro donnée patient.** Le module manipule (date, MAR, type). Jamais de nom de patient,
   jamais d'acte médical.
2. **Chiffres officiels recopiés, jamais calculés.** L'administration communique en fin de
   mois le montant ET le pourcentage par MAR. Le module recopie ; il n'estime pas, il ne
   certifie pas. Mention permanente dans l'interface : « Chiffres issus des relevés
   administratifs — le décompte officiel relève de l'administration. »
3. **Le module éclaire, le comité décide.** Recommandations d'affectation, jamais
   d'affectation automatique.
4. **Visibilité = le groupement.** Pas de confidentialité entre membres (revenus partagés).
   Les non-membres (non-éligibles, < 1 an) ne voient rien du volet financier.

## 3. Mécanique de pilotage (boucle mensuelle)

1. **Saisie** du relevé officiel du mois : % et montant par membre (2 chiffres/MAR/mois).
2. **Projection** : trajectoire de chaque membre au 31/12, au rythme constaté et selon les
   affectations prévues (ex. « X finit à 31,5 %, Y à 24 % »).
3. **Recommandations** pour le mois suivant :
   - membre au-dessus de la trajectoire cible → secteurs à rendement NUL (« frigo » : le
     numérateur gèle, le dénominateur croît, le % redescend) ;
   - membre en dessous → secteurs à rendement FORT.
4. Le comité arbitre ; le relevé suivant recale tout (les erreurs de prédiction ne
   s'accumulent pas).

**Cible pratique ≈ 29 %, pas 30,0 %** (`LIBERAL_CIBLE` en CONFIG). Asymétrie : finir à 29 %
coûte peu, finir à 31 % coûte un reversement. Les relevés arrivant à M+1 et décembre étant
décidé avant d'être mesuré, une marge de sécurité est indispensable. À calibrer après une
année d'historique (volatilité réelle des relevés).

**Équité résiduelle : le désagrément, pas l'argent** (l'argent est partagé). Les passages
« au frigo » sont comptés par membre et tournants — même logique que l'équité des gardes VD.

## 4. Données

### Onglet `LIBERAL_{Y}` — interventions (brique placement)
`DATE | MAR_ID | COMMENTAIRE`
Règle métier : le MAR ayant fait la consultation libérale doit être **au bloc le jour de
l'intervention**. Le planning quotidien (admin.html) affiche un **badge de conflit** dès la
saisie si le MAR est absent / de garde / hors bloc ce jour-là, avec suggestion de placement
à moindre déplacement (optimisation logistique).

### Onglet `LIBERAL_CA_{Y}` — relevés officiels (brique convergence)
Une ligne par membre, colonnes JAN…DEC, chaque cellule = `% ; montant` (ou deux blocs de
colonnes % / montant — à trancher à l'implémentation).

### `MEDECINS`
Colonne `LIBERAL (O/N)` : appartenance au groupement (maintenue à la main — l'éligibilité
PH titulaire ≥ 1 an est une décision administrative, pas algorithmique).

### Secteurs (dépendance : « secteurs étape 2 »)
Attribut **rendement libéral : FORT / MOYEN / NUL** par secteur (la réa = NUL).
Classification manuelle par le comité, 3 valeurs suffisent pour la V1.
→ Prérequis : externaliser `SECTEURS_CFG` dans un onglet Google Sheet (chantier déjà au
backlog pour le déménagement 2027 — une pierre deux coups).

### `CONFIG`
`LIBERAL_CIBLE` (défaut 29), autres paramètres de calibration à l'usage.

## 5. Interfaces

### Côté membre (indispos.html) — onglet « Activité libérale »
- Déclarer une intervention (date) → alimente la brique placement.
- Saisir/consulter ses relevés mensuels (les membres voient tout le groupe).
- Vue convergence : écart à la cible, projection 31/12.

### Côté comité (admin.html)
- Vue convergence du groupe : tous les membres, tri par risque, projections.
- Recommandations mensuelles d'affectation (frigo / FORT).
- Compteur d'équité des passages au frigo.
- Badges de conflit « intervention sans présence bloc » dans le planning quotidien.
- Saisie de rattrapage des relevés.

## 6. Ordre de construction (4 étapes, chacune utilisable seule)

0. **Prérequis** : secteurs étape 2 (onglet Sheet + attribut rendement).
1. Données + API (onglets auto-créés, actions protégées, visibilité groupement).
2. Saisie relevés + vue convergence (indispos.html et admin.html).
3. Badges de conflit bloc dans le planning quotidien + saisie des interventions.
4. Recommandations mensuelles + compteur d'équité frigo.

## 7. Questions à trancher au moment de l'implémentation

- Valeur initiale de `LIBERAL_CIBLE` (29 ? à calibrer avec le groupe).
- Format exact de `LIBERAL_CA_{Y}` (cellule composite vs colonnes séparées).
- Qui saisit les relevés en pratique : chaque membre, ou une saisie groupée par le comité
  si l'administration envoie un tableau global (le circuit réel du document tranchera).
- La projection intègre-t-elle dès la V1 les affectations prévues, ou d'abord un simple
  rythme constaté (V1 recommandée : rythme constaté, plus simple et déjà utile).
