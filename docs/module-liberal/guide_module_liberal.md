# Module libéral — Guide du projet (comité & MARs)

*Document de cadrage. Style « guide comité / guide MAR » : à lire pour comprendre ce que fait le
module, pourquoi, et ce qu'on en attend. Rien n'est en production ; ce guide décrit la cible.*

*Version 1 — 15/07/2026. Complète le document de conception (`module_liberal_conception.md`) et
l'antisèche de cotation (`antiseche_CCAM_anesthesie_CHPG.md`). En cas de divergence, la conception
fait foi sur l'architecture, ce guide sur les objectifs et les usages.*

---

## 1. En une phrase

Le module libéral aide le **groupement** à exercer son activité libérale intra-hospitalière **dans
les règles et sans perte** : il calibre le dépassement d'honoraires sur la mutuelle du patient (pour
minimiser son reste à charge), gère les contraintes de présence au bloc, et pilote la répartition
libéral / public pour rester sous le seuil des 30 %.

Principe directeur, valable partout : **le module éclaire, le comité décide.** Aucune affectation
automatique, aucun engagement à la place de l'administration.

---

## 2. Les trois briques du module

Le projet tient sur trois briques distinctes qui partagent les mêmes données de base (le codage des
actes) mais répondent à trois questions différentes.

### Brique A — Calibrage du dépassement d'honoraires (le reste à charge patient)

**Question : combien facturer de dépassement pour que le patient ne paie (presque) rien ?**

C'est la brique la plus récente, déjà maquettée (`maquette_estimateur_liberal.html`). Elle part de
deux entrées :

1. **Le codage de l'acte** (CCAM au bloc, NGAP en consultation) → la **base de remboursement (BR)**.
2. **La mutuelle du patient** → la ligne « honoraires » exprimée en **% de la BR**.

À partir de là, le moteur applique la règle réglementaire, dans cet ordre — **c'est la couleur de
carte (ou le statut) qui ouvre le droit de facturer, la mutuelle ne fait que déterminer le
remboursement** :

| Statut du patient | Plafond réglementaire du dépassement | Calage sur la mutuelle |
|---|---|---|
| Carte **verte** (monégasque) | 0 — tarif conventionnel strict | non |
| **SPME** (monégasque) | 0 | non |
| Carte **rose** (monégasque) | +20 % de la BR | oui, plafonné à +20 % |
| Carte **bulle** (monégasque) | libre — **entente préalable obligatoire** | oui |
| **Assuré français** (secteur 2 non-OPTAM) | libre | oui, **plafond non-OPTAM** (voir plus bas) |
| **NAS** (non assuré social) | libre | oui |
| **AME** | 0 — pas de dépassement | non |

Le calcul, identique partout où le dépassement est libre :

- **Absorbé par la mutuelle** = (% BR affiché − 100) × BR. Une formule « 200 % BR » absorbe jusqu'à
  100 % de BR de dépassement ; « 300 % BR » jusqu'à 200 % ; « 100 % BR » n'absorbe **rien**.
- **Dépassement optimal** = le plus petit des deux : ce que la carte autorise, et ce que la mutuelle
  absorbe. À ce montant, le **reste à charge du patient est nul**.
- **Reste à charge (RAC)** = (BR + dépassement) − remboursement, affiché en direct pour le
  dépassement réellement saisi.

**Posture — non négociable.** On vise à **minimiser le reste à charge du patient**, pas à maximiser
l'honoraire. Les deux coïncident quand le patient est bien couvert ; quand il est mal couvert (par
exemple une formule à 100 % BR, qui n'absorbe aucun dépassement), le moteur recommande de **facturer
moins, voire zéro**. Le vocabulaire, les calculs et les documents produits sont tous orientés
« RAC patient » — c'est la position déontologiquement et réputationnellement sûre.

**Le plafond non-OPTAM (branche française).** Pour un assuré français avec un contrat responsable
(la norme), vu par un praticien de **secteur 2 non-OPTAM**, la prise en charge du dépassement est
plafonnée par la loi à **200 % de la BR au total** (part Sécu incluse), soit **100 % de BR de
dépassement absorbé** — quel que soit le beau pourcentage affiché sur la grille. Le module applique
ce plafond automatiquement sur la branche française et alerte si le pourcentage saisi le dépasse
(signe qu'on a lu la colonne OPTAM par erreur au lieu de la colonne non-OPTAM). Les cartes
monégasques ne sont **pas** concernées : le régime OPTAM est une construction française.

**Sortie attendue :** un dépassement modulé finement au cas par cas, un RAC estimé, et — prochaine
étape — la **génération automatique du devis / de l'entente préalable** (obligatoire en carte
bulle).

### Brique B — Contraintes de placement (la consultation qui engage le bloc)

**Question : qui doit être présent, dans quel secteur, le jour de l'intervention ?**

Un **parcours libéral** = une **consultation libérale (J0)** suivie d'un **acte au bloc (J+X)**.
C'est la consultation qui **déclenche** l'obligation : voir une patiente le 2 pour une intervention
le 15 crée la contrainte d'être au bloc le 15, dans le bon secteur. Le MAR déclare son intervention
(date de bloc + secteur, **sans aucune donnée patient**) ; le comité voit apparaître, au moment où
il planifie, un marqueur « Dr X → ORTHO (libéral) », et un badge de conflit si l'affectation
contredit l'intervention.

**Affichage seul.** Le module ne pré-place personne et ne touche pas à la génération du planning :
il signale, le comité décide.

### Brique C — Pilotage libéral / public (le fameux pourcentage)

**Question : chacun est-il bien sous 30 % de libéral, et le groupe perd-il de l'argent ?**

Le seuil de 30 % s'applique **séparément sur deux axes** (découverte validée sur le relevé réel) :

- **axe CCAM** (actes techniques au bloc) : libéral / total ≤ 30 %,
- **axe NGAP** (consultations) : libéral / total ≤ 30 %.

Les deux plafonds sont **indépendants** : on peut être large sur un axe et en excédent sur l'autre.
Comme les revenus sont mutualisés et l'excédent reversé à l'hôpital au 31/12, le groupe a **deux
façons de perdre** : un praticien **au-dessus** de 30 % (surplus reversé) ou **sous-employé**
(marge autorisée non réalisée). Le module projette, pour chaque MAR et chaque axe, sa **marge**
(combien de libéral en plus ou en moins pour viser 30 %) et guide la **réallocation** des vacations
du saturé vers le sous-employé.

**Leviers spécifiques à l'axe** : la réa (secteur REA) fait redescendre le seul axe CCAM ; un
excédent NGAP ne se corrige que par les consultations. Les leviers ne sont pas interchangeables.

---

## 3. Comment les briques se parlent (et une clarification importante)

Le codage des actes est le **socle commun** : la table CCAM/NGAP → BR sert à la fois au calibrage du
dépassement (Brique A) et au calcul des ratios 30 % (Brique C).

Mais attention à ne pas mélanger les deux lectures :

- **Le dépassement d'honoraires est HORS quota des 30 %.** Il ne bouge **ni** l'axe CCAM **ni** l'axe
  NGAP. Seule la **BR** de l'acte alimente le libéral qui charge le ratio.
- Autrement dit : le même acte se lit de deux façons indépendantes. Pour le **patient**, ce qui
  compte c'est le dépassement et son RAC (Brique A). Pour le **groupe**, ce qui compte c'est la BR
  qui fait monter le ratio (Brique C). Régler l'un ne touche pas l'autre.

Le lien entre placement (Brique B) et argent (Brique C) : la consultation libérale est le **point
d'entrée** du parcours ; elle alimente le NGAP, et l'acte au bloc qu'elle déclenche alimente le
CCAM. Le placement est donc la face « logistique » de ce que le pilotage lit ensuite en « argent ».

---

## 4. Objectifs attendus, par acteur

**Pour le patient.** Un reste à charge minimal, calculé et transparent, et un devis clair — en
particulier en carte bulle, où l'entente préalable est obligatoire.

**Pour le MAR.** Une cotation juste (l'antisèche CCAM/NGAP), un dépassement calibré au lieu d'être
« au doigt mouillé », et un document prêt à remettre. Moins d'à-peu-près, moins de litiges.

**Pour le comité.** Une vue par axe du risque de dépassement des 30 %, des recommandations de
réallocation des vacations, et l'affichage des contraintes de présence au bloc — sans jamais se
substituer à sa décision.

**Pour le groupement.** Maximiser le libéral **réellement encaissable** dans les règles : éviter le
surplus reversé (perte sèche) **et** la marge non réalisée (manque à gagner). C'est un optimiseur de
répartition, pas un garde-fou anti-dépassement.

---

## 5. Principes non négociables (les mêmes partout)

1. **Zéro donnée patient stockée.** Le calibrage du dépassement se fait à l'écran, sans persistance :
   on saisit le codage et le niveau de mutuelle, on lit le résultat, on imprime le devis, **rien du
   patient n'est conservé**. La stack publique (GitHub / Pages / Sheets / Drive) ne reçoit jamais de
   donnée proche du secret médical.
2. **Chiffres officiels recopiés, jamais devinés.** Les BR viennent des tarifs officiels (Caisses
   monégasques / ameli), les formules mutuelle des vrais tableaux de garanties (colonne non-OPTAM
   pour le français). Aucune grille tarifaire en dur ni estimée.
3. **Le module éclaire, le comité décide.** Recommandations, pas d'automatisme. Côté planning :
   affichage seul.
4. **Visibilité = le groupement.** Revenus mutualisés → pas de confidentialité entre membres
   éligibles. Les non-membres ne voient rien du volet financier.
5. **Deux axes, jamais un pourcentage unique.** Le seuil de 30 % se suit et se projette séparément
   sur le CCAM et le NGAP.

---

## 6. Sécurité des données

C'est le sujet le plus sensible du module : c'est le seul endroit où l'on approche du secret médical.
La sécurité ne repose pas sur un cadenas, mais sur une **discipline architecturale** — d'abord
classer la donnée, puis appliquer à chacune le bon régime.

**Quatre natures de données, quatre régimes.**

- **Donnée patient sensible** (garanties mutuelle, n° AMC, RAC nominatif, lien patient ↔
  intervention) → **jamais persistée**. Le meilleur moyen de la sécuriser est de ne pas la détenir.
- **Donnée praticien** (nom, RPPS, ADELI du MAR) → personnelle mais non médicale ; vit dans le
  **profil MAR** (onglet `MEDECINS`), jamais dans un JSON publié.
- **Donnée financière du groupement** (ratios, revenus, excédents) → non médicale mais
  **confidentielle entre membres et non-membres** : c'est là que le contrôle d'accès a un vrai sens.
- **Référentiel non-patient** (table CCAM→BR, formules mutuelle) → technique/public, aucune
  contrainte, mais **sourcé et versionné**.

**Le principe « stateless » comme garde-fou.** Le calibrage du dépassement est une calculette sans
mémoire : on saisit, on lit, on imprime, **rien ne persiste**. Ce qui doit rester vrai en
permanence :

- Aucune écriture patient côté serveur (ni GitHub, ni Sheets, ni Drive — supports partagés, **pas des
  hébergeurs de données de santé**).
- Aucune persistance côté navigateur non plus : pas de `localStorage`/`sessionStorage`, pas
  d'autosave sur les champs patient. Le nom du patient vit dans la page le temps de l'impression et
  est **effacé à la fermeture**.
- Aucune donnée patient dans une URL (fuite via historique, logs, referer) : c'est pourquoi le devis
  est **intégré à la page** de l'estimateur, sans passage de paramètres.
- Le PDF/impression sort par le **circuit médical normal**, jamais par un canal du module.

**Point de vigilance permanent :** toute future fonction « pratique » qui voudrait mémoriser
(historique de devis, « reprendre le dernier patient », autosave) **casserait ce principe** — à
refuser par défaut. Contrairement au CR d'anesthésie, le module libéral **n'a pas d'autosave** sur
les champs patient.

**Le contrôle d'accès porte sur le financier, pas sur le devis.** Un « code perso » sur GitHub Pages
+ GAS est de l'**identification de confort**, pas une barrière cryptographique. Pour l'estimateur/le
devis, c'est suffisant : comme rien de patient n'est stocké, la connexion sert seulement à
**personnaliser** le pré-remplissage (nom/RPPS/ADELI du MAR), pas à protéger quoi que ce soit. Pour
le volet financier, en revanche, la connexion doit réellement **cloisonner** membre du groupement
(colonne `LIBERAL O/N`) et non-membre. La vraie protection du financier, ce n'est pas le login :
c'est qu'il ne contienne **que des données agrégées, aucune donnée patient**.

**La zone à ne pas bricoler.** Un suivi patient réellement persistant (tracer des prises en charge
nominatives) sort de cette stack : ce serait un chantier à part (hébergement agréé, consentement,
DPO, registre de traitement) — décision hôpital, pas évolution du module. En attendant, on reste
stateless.

---

## 7. Ce qui existe, ce qui reste

**Déjà en ligne** — l'estimateur (`maquette_estimateur_liberal.html`) : saisie multi-lignes CCAM
(principal / associé / complément, modificateurs), axe NGAP indépendant, calibrage mutuelle → RAC,
bibliothèque de formules démarrée avec les **6 formules CCSP Monaco** (sourcées, Notice CG déc.
2025) et des paliers génériques, garde-fou non-OPTAM sur la branche française.

**Reste à construire** (par lots, cf. conception — rien avant le go-live d'octobre 2026 et la sortie
de « secteurs étape 2 ») :

- **Générateur de devis / entente préalable** à partir du calibrage (obligatoire en bulle).
- **Enrichissement de la bibliothèque de formules** au fil de la collecte des tableaux (mutuelle ·
  formule · % BR non-OPTAM · source · date).
- **Saisie des interventions** (parcours consult → bloc) et badges de conflit côté comité.
- **Saisie des relevés mensuels** (6 nombres par MAR, total de contrôle) et vue de convergence par
  axe : marge + projection au 31/12.
- **Réallocation + équité** des affectations contraintes (frigo / réa), sur le modèle de l'équité
  des gardes.
- **Intégration au portail** une fois l'ensemble stabilisé.

---

## 8. Comment ça s'utilisera (workflow cible)

**Le MAR, à la consultation d'anesthésie (≈ 30 s).** Il saisit le codage de l'acte prévu et le
statut / la mutuelle du patient. L'outil affiche le dépassement optimal et le RAC estimé, et — à
terme — produit le devis. Il déclare aussi, s'il s'agit d'un parcours libéral, la date de bloc et le
secteur (sans patient).

**Le comité, chaque mois.** Il recopie le relevé administratif cumulé (source de vérité), lit la
projection par axe pour chaque MAR, arbitre la réallocation des vacations, et visualise les
contraintes de présence au bloc. Le relevé suivant recale la projection : boucle auto-corrigée, où
**corriger tôt pèse bien plus que corriger tard**.

---

## 9. Résumé

En connaissant, pour chaque acte, **son codage** et **la mutuelle du patient**, le module permet de
**moduler le dépassement finement** pour minimiser le reste à charge du patient. En agrégeant
l'activité, il aide le comité à **placer** correctement les parcours libéraux et à **piloter la
charge libéral / public** sous le double seuil des 30 %. Le tout sans jamais stocker de donnée
patient, sans jamais deviner un tarif, et en laissant toujours la décision au comité.
