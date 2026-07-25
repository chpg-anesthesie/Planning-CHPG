# Roadmap — Planning-CHPG

Système web : **planning des gardes** (équité annuelle) + **planning quotidien** + **consultations** + **portail/Dashboard** + **veille biblio** + **CR d'anesthésie**, pour ~23 MARs au CHPG (Monaco).
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`. *Mise à jour : 23 juillet 2026 (couverture des jours serrés livrée — 13 jours sans binôme → 0 sur 140 années simulées, équité et vitesse meilleures que la référence).*

> Le dépôt en ligne fait foi. Cette roadmap est un repère de pilotage, pas la source de vérité du code.

---

## ✅ Fait

### Fondations & algorithme de gardes (mai–juin 2026)
- Architecture Google Sheets → fichiers GAS (`code.gs`, `generateur_gardes.gs`, `Indispos.gs`, `setup_annee.gs`, `portail.gs`) → sortie web ; cycle annuel simulé et validé.
- Règles d'équité (VD > Samedi > Jeudi > Total), cibles proportionnelles à la quotité.
- Banc d'essai de l'algo ; correctifs équité/dette ; invariants confirmés ; génération ~10-15 s.
- Statuts spéciaux externalisés (colonnes MEDECINS), priorité vacances Monaco (groupes A/B/C, seuils).
- Consultations (comptage d'équité, refonte visuelle), rotation libérale endo (déficit-based, contrainte N+1).
- Nettoyage config-driven : getJoursFeries consolidé, MEDECINS_LIST supprimé, tokens unifiés, fériés grisés.
- Documents : guide admin, règles de génération, simulation démographique (charge jusqu'en 2060).

### Session juillet 2026 — algo & infra
- **Fix A** : rythme 2 sem./2 robuste aux années à 53 semaines.
- **Fenêtre de transparence dette** (frontend, dès 2028).
- **Historique Noël/An** : `getNoelHistory()` (HISTORIQUE ∪ GARDES présents) + archivage **au réel**.
- **Consolidation secteurs étape 1** : source unique `SECTEURS_CFG` **dans admin.html** (index.html non encore consolidé — voir Secteurs étape 2).
- **Résilience** publication + archivage (échecs remontés à l'écran).
- **Migration des JSON vers le Drive** (dossier `Planning-CHPG-JSON`) : `planning_{Y}.json` / `affectations_{Y}.json` servis depuis le Drive ; archives `stats_{Y}.json` toujours poussées sur GitHub à la clôture.
- **Onglet Maintenance** (admin.html) : diagnostic `diagComplet` réécrit (audite Sheet + GitHub + Drive, cohérence JSON↔GARDES, environnement, intégrité gardes/équipe) + renvoi des codes multi-sélection.
- **Sélecteur d'année** refait en pilule à badges.
- Wizard 1 & Wizard 3 **testés en réel**.
- Documents de présentation staff (04/09) : algorithme, guide MAR, manuel du comité.

### Planning quotidien (juillet 2026)
- Placement **additif** des consultations (le MAR reste dans son secteur bloc ; bouton « ＋ aussi »).
- Split correct des valeurs multi-tokens (« SECTEUR+CS-X »).
- Indépendance matin/après-midi des overrides ; `LockService` + déduplication anti-doublons sur `PLANNING_OVERRIDES`.
- Marqueur violet « LIB » (consult libérale endo) cliquable pour affectation manuelle.
- Bouton « Aujourd'hui » ; export Excel enrichi (staff du vendredi, séparateurs de jours).
- Diagnostic `_findPhantomGardes_` ; purge des vieux overrides pendant la clôture W3.

### Portail / Dashboard (juillet 2026)
- **9 tuiles** live : Planning, Mes congés, Topos/biblio, Protocoles, Staffs à venir, Veille biblio, Annuaire, **CR d'anesthésie**, **CRH** (cette dernière restreinte à un MAR via `only:`).
- Panneau perso « Mes gardes » (hero).
- **CR d'anesthésie** intégré dans `/cr-anesthesie/` (service worker, autosave, presets de gestes, antibioprophylaxie SFAR/SPILF 2024).

### Audit de robustesse — 5 axes (19–20 juillet 2026)
Après les audits déjà menés (simulation 20 ans de l'algo, failles de sécurité/confidentialité,
précision des années générées et des jours fériés), cinq nouveaux angles ont été éprouvés.
**Tout est testé en production** sauf mention contraire.

- **Axe 3 — Cycle de vie RH** (3 failles corrigées) :
  - **RH-1** `ensureMarRows()` — un MAR créé ou réactivé en cours d'année n'avait de ligne
    ni dans `INDISPOS_{Y}`, ni dans `GARDES_{Y}`, ni dans `AFFECTATIONS_{Y}` → saisie d'indispos
    en échec **silencieux**, don/échange/garde exceptionnelle en « médecin introuvable »,
    affectations ignorées. Les lignes manquantes sont désormais créées automatiquement
    (année active + suivantes), format recopié, idempotent.
  - **RH-2** `getAbsencesLongues` / `annulerAbsenceLongue` — aucun moyen d'annuler ou de
    raccourcir une absence longue ; le registre `ABSENCES_LONGUES` la **rejouait** sur les années
    futures même après effacement manuel. Liste + boutons Raccourcir / Annuler dans le modal CL ;
    seules les cases valant exactement `CL` sont touchées ; registre mis à jour ou purgé.
  - **RH-3** Dette d'équité — la part juste de N-1 était calculée au prorata de la **quotité
    plein temps**, ignorant les absences légitimes : un MAR absent 6 mois (maternité) ou arrivé
    en cours d'année apparaissait « en retard » et recevait des gardes **en plus** au retour
    (jusqu'à +1,2 garde/axe). La part juste est désormais pondérée par les **colonnes CIBLE de
    N-1** (déjà pro-ratées par la présence structurelle). Ajout de `CIBLE JF` au snapshot STATS.
    Vérifié par simulation : résultat **identique** à l'ancien quand tout le monde est présent
    toute l'année ; `Σ dette = 0` par axe conservé ; repli sur l'ancienne formule si les cibles
    manquent. *Premier effet réel : génération 2028.*
  - **Décision actée** : un arrivant reste **prioritaire n°1 pour Noël/An** dès sa première année
    (historique vide = « n'a pas encore donné »). Comportement conservé.

- **Axe 5 — Charge du lundi matin** : audité, **aucune modification**. Pic réaliste de 5–10
  exécutions simultanées pour une limite Google de 30 (marge ×3) ; quotas journaliers très loin
  d'être atteints. Seul cas limite identifié : 23 MARs ouvrant la page dans les mêmes secondes
  (staff) → quelques « erreur réseau », un re-clic suffit. Jugé acceptable.

- **Axe 2 — Concurrence** : **RH-C** verrou d'écriture global. Un seul verrou existait
  (`PLANNING_OVERRIDES`). Trois courses « lire-modifier-écrire » identifiées : écrasement
  silencieux d'une ligne d'indispos (MAR + comité simultanés), **duplication** d'une garde donnée
  traitée deux fois, suppression de la mauvaise ligne d'absence après décalage. Les **22 actions
  d'écriture** sont désormais sérialisées par `LockService` au point d'entrée (20 s d'attente,
  message clair au-delà) ; les lectures ne prennent jamais le verrou.

- **Axe 1 — Résilience aux pannes partielles** : déjà solide (moteur de wizard avec arrêt sur
  erreur, bouton Réessayer, étapes réussies non rejouées ; `initYear` refuse d'écraser et son
  existence est redétectée côté serveur ; `archiveYear` a sa garde d'idempotence depuis le 15/07 ;
  le W2 rattrapait déjà « GARDES existe déjà » côté frontend). Deux finitions livrées :
  **W2-R** — reprise du W2 par un chemin **normal** plutôt qu'une exception (si `GARDES_{Y}` et
  `STATS_GARDES_{Y}` existent et sont cohérents → `success` + stats + `alreadyDone`, le wizard
  enchaîne sur publication/récaps avec l'équité renseignée) ; et l'étape récapitulatifs **affiche
  les échecs d'envoi** (jusqu'ici masqués par un ✓ vert). *Testable réellement en novembre (W2).*

- **Axe 4 — Continuité / bus factor** : `docs/reprise.md` créé (propriété des ressources, accès,
  sauvegardes, premier jour d'une reprise en main) + rappel agenda de **sauvegarde trimestrielle**
  du classeur (1er oct/jan/avr/juil). Limite assumée et documentée : les copies vivent dans le
  Drive personnel d'Arthur — elles protègent de l'erreur de manipulation, pas de la perte du compte.

### Audit externe & codes d'accès (20 juillet 2026)

**Relecture à froid du dépôt entier** (lecture du code sans consulter les instructions du projet,
pour éviter tout biais de confirmation). Conclusions :

- **Confidentialité : conforme.** Vérifié en direct que `planning_{Y}.json` / `affectations_{Y}.json`
  renvoient **404** en accès public (migration Drive effective). Les lectures nominatives sont toutes
  derrière `checkCode()`. `_buildMedecins_` ne renvoie jamais le code en clair (`hasCode` booléen).
  Le token GitHub est absent du dépôt **et de l'historique git**.
- **Générateur de gardes : déterministe** (aucun `Math.random`) → l'équité est reproductible et
  auditable. Garde-fou anti-régénération et verrou d'écriture jugés bien dimensionnés.
- **CRH : traitement RGPD solide** — double filet anti-identifiant (regex client + règle dans le
  system prompt serveur) et journalisation « qui/quand » **sans jamais le contenu clinique**.
- **Contrôles machine passés** : `node --check` OK sur les 5 `.gs` et les 17 `.js` ; `<div>` équilibrés
  sur les 6 HTML principaux.

**Corrections livrées :**

- **Code de démo du staff (04/09)** — `docs/presentation-staff.html` invitait à écrire en dur le vrai
  code perso d'un MAR pour la démo live. Sur un dépôt public, un code committé reste **dans
  l'historique à vie** même après rotation. Le code se saisit désormais **par `prompt()` au clic**
  sur le bloc affiché (mémorisé en `sessionStorage` le temps de la session) : démo identique côté
  salle, plus rien dans le dépôt.
- **`resetCodeMar` (nouvelle action GAS)** — la régénération de code n'existait pas, **et l'interface
  prétendait le contraire** : la confirmation d'envoi groupé annonçait « leur ancien code sera
  invalidé » alors que `sendCodesMar` se contentait de renvoyer le code existant par email. On pouvait
  donc croire un code renouvelé alors qu'il ne l'était pas. Désormais :
  - bouton **🔄 par MAR** (onglet Équipe) = tire un nouveau code, l'écrit en colonne G, l'envoie ;
  - **unicité garantie** : le nouveau code est comparé aux codes des autres MARs **et à `ADMIN_CODE`**
    (une collision aurait donné à un MAR le rôle admin) ;
  - **email vérifié AVANT toute écriture** — pas d'email, pas de changement, personne enfermé dehors ;
  - ancien code tracé dans `LOGS` avant écrasement, et si l'envoi échoue le **nouveau code s'affiche
    à l'écran** pour transmission en main propre ;
  - les envois **groupés restent non destructifs** (sélection, « envoyer à tous », wizard W3, wizard
    nouveau MAR) — décision assumée : impossible de casser 23 codes d'un clic. Leur message de
    confirmation a été corrigé.
  - `guide-comite.html` § 13.3 documente la différence entre *renvoyer* et *renouveler*.
  - *Non testé en production à ce stade : recopie `Indispos.gs` + redéploiement requis.*

### Veille bibliographique (juillet 2026)
- Scan PubMed hebdomadaire (lundi) piloté 100 % depuis l'onglet `VEILLE_CFG` (voir `docs/VEILLE_CFG-mode-emploi.md`).
- Tri « best match » + badge type de publication (`PUBTYPE`).
- Tagging **par thème** (colonne `THEMES`), sélecteur de thème + filtrage dans le Dashboard.
- Normalisation des dates ISO au read time.

### Audit des emails (20 juillet 2026)

Cinq emails partent du système, tous depuis `Indispos.gs` : trois portent un code d'accès
(`sendCodes`, `sendCodesMar`, `resetCodeMar`), deux sont des récapitulatifs HTML
(`envoyerRecapIndispos` = gardes, `sendCodesWithRecap` = congés + ouverture W1).

**Ce qui a été corrigé :**

- **Année erronée dans les mails de code.** Ils annonçaient `TEST_YEAR` (année du planning
  en cours) tout en pointant vers `indispos.html`, qui ouvre `INDISPOS_ACTIVE`. Les deux
  divergent **précisément pendant le Wizard 1**, en octobre — quand ces mails partent en masse :
  « votre code pour le planning 2027 » menant à la saisie 2028. Corrigé via `getIndisposYear()`.
- **Redondance à l'origine du bug.** Le corps du mail était dupliqué **à l'identique**
  (321 caractères) entre `sendCodes` et `sendCodesMar` ; la correction d'année n'avait été
  appliquée qu'à un seul. Remplacé par une **source unique `_mailCodeAcces_(nom, code, renouvele)`** —
  texte, style et année en un seul endroit.
- **Lien inadapté.** Le mail envoyait vers `indispos.html`, utile ~6 semaines par an, alors que
  le code sert toute l'année pour le portail. Le bouton principal mène désormais à
  `dashboard.html` ; la saisie n'est mise en avant que **pendant la campagne**.
- **Détection de campagne, sans nouveau réglage.** La ligne `INDISPOS_ACTIVE` de CONFIG n'existe
  QUE pendant la campagne (créée par le W1, supprimée par le W3) : sa présence est l'indicateur.
  Nouvelle fonction `_indisposOuverte_()`. ⚠️ `getIndisposYear()` ne permet PAS de le savoir
  (repli silencieux sur `getActiveYear()`).
- **Tuile de campagne.** « Mes indisponibilités » apparaît sur le portail pendant la campagne et
  disparaît après la clôture — `indispos.html` n'était atteignable que par un lien reçu par mail
  (page orpheline). Drapeau remonté par `login` (`indisposOuverte`).
- **MAR non servis, nommés.** `sendCodes` sautait silencieusement les MAR sans email **ou sans
  code** et affichait « codes envoyés » : on ignorait que 2 ou 3 n'avaient rien reçu. Ils sont
  désormais listés nominativement, en distinguant « sans email » (donnée manquante) de
  « SANS CODE » (anomalie).
- **Garde-fou quota.** Le compte Google est **GRATUIT : 100 emails/jour**, pas 1500. Avec ~23 MAR,
  un envoi groupé consomme un quart du quota et trois envois dans la journée (codes + congés +
  gardes) frôlent la limite. Sans contrôle, `MailApp` échouait **en cours d'envoi** : la moitié
  servie, l'autre non, sans trace du point d'arrêt. Les trois envois groupés refusent désormais
  **avant tout envoi** si le quota est insuffisant. Seuil du diagnostic recalé sur l'effectif réel
  (`_marsAvecEmail_()`) au lieu d'un `40` arbitraire.
- **Deux messages d'interface mensongers** supprimés : « les anciens codes seront invalidés » sur
  les deux boutons d'envoi groupé, alors qu'aucun ne modifie de code.
- **Confort** : expéditeur nommé (`name: 'Comité Planning CHPG'`), accents rétablis, échappement
  HTML du nom, version texte de secours pour chaque mail.

**Piège d'environnement relevé** : `assets/vendor/lucide-icons.js` est un mini-bundle **local de
17 icônes seulement** (liste dans son en-tête). Toute nouvelle tuile doit utiliser une icône
présente — `calendar-plus` n'existe pas et se serait affichée vide.

### Version du site — v1.5 (20 juillet 2026)

> ⚠️ **Mesuré le 24/07/2026 : le site est en `v1.9.4`, et le marqueur n'existe que dans
> DEUX fichiers** — `admin.html` (3 occurrences) et `dashboard.html` (3 occurrences).
> `index.html`, `indispos.html` et `staff.html` n'en portent **aucune**. La règle « 5 fichiers,
> 9 emplacements » ne correspond donc plus à l'état réel du dépôt : à reconfirmer avec Arthur
> avant le prochain bump (la règle a-t-elle changé, ou le marqueur a-t-il disparu de ces trois
> pages ?).


**Le badge affichait `v1.0` depuis plusieurs itérations sans que rien ne le signale.** Chaque fichier
porte la version à plusieurs endroits, et le diagnostic « Version du site » ne lisait que **le
marqueur en commentaire** — jamais la valeur affichée. Il concluait donc « les 4 fichiers sont
alignés (v1.4) » pendant que 3 sur 4 montraient v1.0 aux utilisateurs.

- **Tout est aligné sur `v1.5`**, valeur affichée ET marqueur.
- **Le diagnostic lit désormais TOUTES les formes de version** d'un fichier (constante JS, badge HTML
  en dur, ligne d'en-tête des guides, marqueur) et exige qu'elles soient identiques **dans** chaque
  fichier et **entre** fichiers. Un fichier divergent est signalé `INCOHÉRENT (v1.0 / v1.4)` avec le
  détail. Vérifié en rejouant le nouveau contrôle sur les fichiers d'avant patch : il aurait bien
  signalé les 3 fichiers fautifs.

⚠️ **Pour bumper la version : 5 fichiers, 9 emplacements.** Deux d'entre eux la portent DEUX fois.

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · badge `id="verBadge"` en dur · marqueur `// SITE_VERSION:` |
| `admin.html` | idem (3 emplacements) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · marqueur `<!-- SITE_VERSION: -->` |
| `docs/guide-comite.html` | idem (2 emplacements) |
| `docs/guide-technique.html` | marqueur seul |

Le **badge HTML en dur** compte : il est visible *avant* connexion, jusqu'à ce que le JS le remplace.
Le diagnostic signale tout oubli — c'est précisément ce qu'il ne savait pas faire.

### Export Excel hebdomadaire — 6 correctifs (20 juillet 2026)

Le fichier envoyé chaque vendredi aux 23 MAR. Aucun de ces défauts n'était dans une
demande initiale : tous repérés par Arthur en relisant le fichier produit.

- **DVI fondu dans VISCERAL.** Le bloc `VISCERAL` agrégeait `['VIS','DVI']` : le MAR posté
  en DVI le mardi matin s'affichait comme viscéral. Bloc **DVI distinct** créé, sous ORTHO
  et de sa couleur (même lieu physique dans le service), 1 ligne.
- **Bas du tableau ancré sur le compteur de blocs.** Les sections sous les blocs utilisaient
  des numéros de ligne EN DUR (22, 23+i, 30, 32, 35, 38) : ajouter DVI les faisait entrer en
  collision. Remplacés par `R_CS / R_CSR / R_ABS / R_FN / R_INFO / R_LAST`, dérivés de `row`.
  Équivalence prouvée avant push (mêmes valeurs qu'avant sur la config d'alors).
- **Texte illisible à l'impression.** *Première analyse FAUSSE de ma part* : j'ai incriminé
  `fitToHeight` et poussé un patch sans effet. Le calcul (fait après) montre que la
  **largeur** était la contrainte dominante — 29 colonnes à 8.43 = 46,6 cm pour 28,7 cm
  utiles, soit une réduction à **62 %**. Colonnes ramenées à 4.5 (planning, qui ne contient
  que des initiales) et 7 (annuaire) : **échelle 95 %**, texte ×1,5. Hauteurs 16 → 14 pt.
- **Gardes réa / anesthésie confondues.** Les statuts `G` et `G2` existaient mais étaient
  fusionnés sur une ligne « GARDES ». Deux lignes désormais : `GARDE REA` puis `GARDE ANESTH`.
  ⚠️ Les **SORTIES restent groupées** : le statut `RG` est unique, rien ne dit de quelle garde
  on sort (déduire depuis la veille échouerait le lundi, dont le dimanche est hors semaine).
- **Absents perdus au-delà de 8.** Zone figée à 2 lignes × 4 cases, boucle `i<8` : le 9ᵉ absent
  disparaissait **sans aucun signe** — fréquent l'été. Le nombre de lignes suit désormais le pic
  de la semaine (`ABS_ROWS`). Au-delà de 13 absents le tableau passe sur 2 pages : compromis
  assumé, mieux vaut une 2ᵉ page que des noms manquants.
- **Annuaire affichant des MAR pas encore arrivés** (lignes sans DECT). Filtré via
  `statActive(m, date)` — fonction **déjà existante**, réutilisée plutôt que réécrite — sur les
  dates de la semaine affichée. Repli : si aucune date, on affiche tout.
- **Cases de consultation fusionnées** quand un seul créneau est prévu, comme le tableau manuel
  (2 créneaux → 2 cases). A nécessité de **promouvoir `CS_REQUIRED` en global** (il était local à
  `renderWeek`) plutôt que d'en faire une copie — voir le CONTEXTE.

**⚠️ Piège ExcelJS à retenir — a cassé la production.** Écrire dans une cellule **esclave**
d'une fusion écrit en réalité dans la **maître**. Le code faisait `mergeCells` → écrire le nom
à gauche → écrire `''` à droite « pour nettoyer » : cette dernière écriture **effaçait le nom**.
Toutes les consultations fusionnées sont sorties vides. Règle : **écrire les deux cellules
AVANT de fusionner** (préserve aussi bordures et remplissage). Vérifié sur 5 cas avec un vrai
classeur. *Leçon : ExcelJS s'installe en local (`npm i exceljs`) — tester le rendu réel, ne pas
se contenter de `node --check`.*

### Secteurs étape 2 — consultations OK, création d'un secteur INCOMPLÈTE (20 juillet 2026)

⚠️ **Cette section a d'abord été écrite « TERMINÉE » : c'était FAUX.** Vérifié après coup, le trajet
complet d'un secteur NOUVEAU n'était pas couvert — seul l'affichage suivait. Corrigé depuis, mais
2 maillons restent ouverts (voir « Créer un secteur de bout en bout » plus bas).

Le chantier « externaliser les secteurs » est **bouclé** : secteurs ET consultations sont pilotés
depuis deux onglets du classeur, sans passer par le code.

- **2a — onglet `CS_TEMPLATE` créé et amorcé** (`portail.gs`) : 1 ligne par type, 1 colonne par
  demi-journée. `getOrCreateCsTemplateTab()` / `initCsTemplate()` / `getCsTemplate()`, action API
  routée. Amorçage prouvé **strictement identique** à `CS_REQUIRED` (comparaison clé par clé,
  23 créneaux), puis relu et validé par Arthur.
- **2c — `admin.html` consomme l'onglet** (frontend pur, aucune recopie GAS). `CS_TYPES` et
  `CS_OPENABLE`, jusque-là **locaux à `renderWeek`**, sont devenus globaux comme `CS_REQUIRED`.
  Repli conservé sur les tables en dur si la réponse est nulle, vide ou incomplète (3 cas testés).
  **Testé en production** : affichage inchangé, puis un `0` passé à `1` dans l'onglet fait bien
  apparaître le créneau.
  - Effet visible immédiat : `CS_OPENABLE` passe de **4 à 7** codes (décision d'Arthur, tout ouvrable).
- **2b sautée**, à dessein : elle devait vérifier que l'onglet correspond à la table en dur, or
  c'était déjà prouvé deux fois (simulation + relecture). Une recopie GAS de plus n'aurait rien appris.
- ⬜ **Reste l'étape 3** (non urgente) : retirer les tables en dur et rendre le repli **visible**.
  Aujourd'hui il est silencieux — une panne de lecture ferait tourner les pages sur le code sans
  le dire. Inoffensif tant qu'on ne compte pas dessus.

### Rangement du classeur (20 juillet 2026)

22 onglets, difficiles à parcourir. `organiserOnglets()` (`setup_annee.gs`, one-shot réversible)
classe, colore et masque : **16 visibles au lieu de 22**.

- 4 familles colorées : configuration courante (bleu foncé, `CONFIG`/`MEDECINS` désormais en tête),
  configuration annuelle (bleu clair), portail (violet), données de l'année (vert).
- 6 onglets **masqués** car jamais édités à la main : `SEMAINES_VALIDEES`, `ABSENCES_LONGUES`,
  `HISTORIQUE`, `VEILLE`, `LOGS`, `CONNEXIONS`. ⚠️ **Masquer ne casse rien** : `getSheetByName()`
  lit et écrit un onglet masqué à l'identique.
- `PLANNING_OVERRIDES` laissé **visible** (dépannage). Les onglets annuels se trient
  automatiquement, année la plus récente en tête — 2027 se placera devant 2026.
- Retour en arrière : `afficherTousLesOnglets()`.

### Créer un secteur de bout en bout — état au 20/07/2026

Objectif : créer un secteur dans l'onglet `SECTEURS` → l'affecter à un MAR → le voir sur le planning.

| Maillon | État |
|---|---|
| 1. Créer la ligne dans l'onglet | ✅ |
| 2. Le choisir dans le sélecteur d'admin | ✅ (vient de l'onglet) |
| 3. Couleur de la cellule d'affectation | ✅ |
| 4. **Légende de l'onglet Affectations** | ⬜ **liste en dur** `['VIS','REA',…]` (admin.html ~4080) |
| 5. Enregistrement dans `AFFECTATIONS_{Y}` | ✅ |
| 6. Génération du planning | ✅ **corrigé** (voir ci-dessous) |
| 7. Nouvelle ligne sur le planning | ✅ (index.html dérive déjà de l'onglet) |
| 8. **Export Excel** | ⬜ `BLOCS` / `SX` / `CSROWS` en dur (données prêtes, branchement à faire) |

**Le verrou levé (maillon 6).** `normalizeAffectation` (`code.gs`) ne connaissait que 9 codes en dur :
tout autre code devenait `VOLANT` **en silence**. Un secteur créé dans l'onglet était donc affectable,
coloré, enregistré… puis effacé à la publication. Elle lit désormais les codes de l'onglet.
- **Critère d'affectabilité = colonne `AFF` remplie.** Un secteur sans `AFF` n'est pas une affectation
  mensuelle : c'est le cas de **DVI**, qui est une *vacation* du mardi matin réservée aux MAR habilités
  (`DVI_ALLOWED`), posée directement par la génération. Ne pas le traiter comme un secteur.
- Un code vraiment inconnu tombe toujours sur `VOLANT` mais est **journalisé** (1 ligne par code).

**Préparé pour le maillon 8** : l'onglet `SECTEURS` a 3 colonnes de plus — `XL_LABEL`, `XL_BG`,
`XL_ROWS` — car l'Excel n'écrit pas la même chose que le web (majuscules, couleurs franches, 1 ou 2
lignes) et **aucune conversion automatique ne donnerait les couleurs actuelles** (`#EFF6FF` web vs
`FFE699` Excel). Migration douce de l'onglet existant, valeurs des 9 secteurs pré-remplies, et
**défauts si laissées vides** (`COURT` en majuscules / gris `F2F2F2` / 2 lignes) → un secteur créé sans
les remplir apparaît quand même dans le fichier du vendredi.

### Cases du planning : signal ≠ action (20/07/2026) · site v1.6.1

**Le « + » orange était le SEUL moyen de placer quelqu'un.** Il portait deux rôles à la fois : un
signal (« il manque quelqu'un ») et une action (« cliquer pour placer »). Conséquence : impossible
d'ajouter un MAR sur une case sans écart détecté, ni sur une case déjà occupée — le tiret `—` était
une impasse non cliquable.

- **Le flash orange est inchangé** : un ou plusieurs MAR affectés à ce secteur ce mois-ci sont absents
  aujourd'hui et non remplacés. C'est un écart mesurable — **pas** un besoin réel : le système ignore
  la programmation opératoire, et 3 MAR au viscéral suffisent parfois là où il en faut 4.
- **Ajout libre partout** : au survol d'une case, un « + » **gris** apparaît (y compris sur une case
  déjà occupée) ; le tiret devient cliquable. Jamais de gris en même temps qu'un orange.
- Au repos l'écran est **identique** à avant : seules les vraies alertes attirent l'œil.
- **Week-ends et fériés NON cliquables** — voulu : ces jours-là il n'y a que les 2 gardes. Ils passent
  par un rendu séparé (`isWe = isWeekend || isFerie`), makeSlot ne les touche pas.

### Secteur interventionnel — règle métier à ne pas « simplifier » (20/07/2026)

**Un seul MAR est affecté au secteur interventionnel pour le mois.** RI (radio) n'existe que
**mercredi et jeudi matin** ; CI (cardio) est présent le mercredi.

| Situation | CI | RI |
|---|---|---|
| Mercredi, MAR présent (placé en CI par défaut) | — | 🔶 |
| Mercredi, MAR absent | 🔶 | 🔶 |
| Jeudi matin, MAR présent (bascule en RI) | — | — |
| Jeudi matin, MAR absent | — | 🔶 |

Le mercredi il y a **2 postes pour 1 personne** : la radio flashe **normalement et en permanence**,
même quand tout va bien. Le jeudi, le MAR bascule sur la radio.

⚠️ **`RI` ne doit PAS rejoindre `COVERAGE`.** Sa règle (`RI_REQ_AM = {mercredi:1, jeudi:1}`) est plus
fine que la couverture ordinaire : elle dépend du **jour**, pas de la présence d'un titulaire. Idem
pour l'exclusion `if (s.code === 'CI' && dow === 3)` (jeudi = radio seule). Ces exceptions encodent
des faits d'organisation qu'une colonne générique ne capterait pas → **projet de colonne `COUVERTURE`
ÉCARTÉ**.

**Bug corrigé le jeudi après-midi** : le MAR interventionnel restait affiché en `CI` « pour justifier
la consult CS-INTER » — or **il n'y a jamais de bloc cardio le jeudi**. Il était donc montré dans un
bloc fermé. Son secteur est désormais **vidé** l'après-midi (aucune ligne de bloc) : il est en
consultation, il ne peut pas être au bloc.

### Chantier secteurs — TERMINÉ de bout en bout (21 juillet 2026) · site v1.7.1

Un secteur ou une consultation se crée désormais **dans un onglet du classeur**, et va jusqu'au
fichier Excel du vendredi. Aucun code, aucune recopie Apps Script. Documenté au **§ 18 du
guide technique** (marche à suivre complète, colonne par colonne, avec exemple).

- **Légende des Affectations** dérivée de l'onglet (elle était figée sur 9 codes).
- **Export Excel piloté par les onglets** : `BLOCS` et `SX` viennent de `SECTEURS` (colonnes
  `XL_LABEL` / `XL_BG` / `XL_ROWS`), `CSROWS` de `CS_TEMPLATE` (`XL_LABEL` / `XL_BG`).
  Équivalence prouvée avant push : libellés, couleurs, hauteurs et ordre **identiques** à l'existant.
- **Les sous-codes `URO` et `OPH` ont disparu** : ce n'étaient pas des codes mais des mentions de
  libellé (le bloc viscéral couvre viscéral ET uro). Confirmé par Arthur.
- **Ordre unifié** : `CS_TEMPLATE` a été réordonné à la main pour que l'admin et l'Excel affichent
  la même séquence (VIS, ORT, ORL, END, INTER, MAT, POLY).

**⚠️ La leçon de la journée — une 4ᵉ liste en dur, invisible aux recherches.**
Trois patchs successifs (légende, blocs Excel, consultations) étaient corrects mais **sans effet** :
le sélecteur de secteur de la grille des Affectations était une suite de balises `<option>` **écrite
en dur dans le HTML**, à 2 700 lignes du code qui l'utilise. Impossible d'affecter un secteur créé,
donc rien n'apparaissait ensuite — ni légende, ni planning, ni Excel. Trouvée uniquement par le
**test de bout en bout d'Arthur**. → Chercher les listes figées dans le HTML autant que dans le JS.

**Nouveau contrôle du diagnostic** : les affectations pointant vers un secteur supprimé, inactif ou
sans `AFF` sont signalées **en erreur**, avec le code et les MAR concernés. Sans lui, ces MAR
basculaient en VOLANT à la publication sans que personne ne le voie.

### Module libéral — chaîne complète (21–22 juillet 2026) · site v1.9

*Le MAR cote, édite un devis, déclare son intervention ; le comité la voit au placement.*

  - [x] **Tuile Module libéral** — **EN PRODUCTION, testée le 21/07/2026** (site v1.8.1).
    Ouvre **directement l'estimateur** ; celui-ci porte en tête un lien vers `docs/guide-liberal.html`
    (cotation, règle des 30 %, antisèche), qui renvoie lui-même vers l'estimateur — la boucle ferme.
    Visible pour les seuls MAR ayant `O` dans la colonne **`LIBERAL`** de `MEDECINS` (ajoutée en
    **fin** d'onglet). `checkCode` lit la colonne **par son en-tête** et renvoie `liberal`, l'action
    `login` le transmet, `dashboard.html` filtre sur `MY_LIBERAL`. Colonne vide → tuile invisible
    pour tout le monde. Aucune lecture de classeur supplémentaire.

- [x] 🧾 **Estimateur — V3.4 à V3.6, EN PRODUCTION, rendu et impression validés le 21/07/2026.**
  Quatre incréments successifs, chacun testé avant le suivant :
  - **V3.4 — les deux dates.** Modèle acté : un parcours **NGAP** porte une seule date, la
    **consultation** ; un parcours **CCAM** en porte deux, **consultation** (= date d'établissement
    du devis, pré-remplie à aujourd'hui) et **intervention** (**jamais pré-remplie**, obligatoire,
    l'ajout est refusé sans elle). Règle unique qui en découle : **la date qui remonte au comité est
    la date de l'acte** — intervention en CCAM, consultation en NGAP. Le tiroir « ◆ Libéral » du
    planning admin n'aura donc qu'un seul champ à lire. Liste triée par date d'acte, dates passées
    en orange (codage rétrospectif accepté, jamais bloqué). Le devis n'affiche plus la date du jour :
    « Établi le » = date de consultation, validité 6 mois comptée depuis elle.
    *Principe retenu : une case vide se voit, une date fausse ne se voit pas.*
  - **V3.5 — devis détaillé acte par acte**, sur le modèle de la note préalable du CNOM (secteur 2),
    qui impose de mentionner chaque acte selon les mêmes modalités. La mention `CCAM / NGAP` en dur
    et le champ « code » à recopier à la main ont disparu : le code était déjà dans le libellé.
    **La BR se décompose ligne par ligne, le DH non** — il est saisi pour l'intervention entière et
    il n'existe aucune clé de répartition : il reste sur la ligne de total, avec les honoraires et le
    remboursement. Ne pas « améliorer » ce point en inventant une répartition.
  - **V3.6 — un acte par ligne.** Le libellé et son code cohabitent sur la même ligne : chaque acte
    coûte une ligne de tableau, plus deux. C'est ce qui fait tenir un devis à 3 actes sur une A4.
  - ⚠️ **Point ouvert, à porter au CHPG / DAM** : le modèle du CNOM porte la mention que
    l'information sur les actes pratiqués est destinée **au seul patient** et n'a pas à être
    communiquée à des tiers, **y compris les assureurs complémentaires**. Le détail par acte reste
    justifié pour la clarté du patient, mais la question de faire circuler les **codes** jusqu'à la
    mutuelle n'est pas tranchée pour Monaco (cadre DAM / convention CCSS-CAMTI distinct du français).

- [x] 🔌 **Lot C — l'estimateur est branché au portail. EN PRODUCTION, testé le 21/07/2026 (V3.7 → V4.0).**
  L'estimateur n'est plus une page isolée : c'est une page du portail. **Aucune écriture** — il
  n'appelle que `login` et `getSecteurs`, deux actions de lecture déjà routées.
  - **Mécanique** : la tuile ouvre l'estimateur **dans le même onglet**, donc le code d'accès rangé
    par le dashboard dans `sessionStorage('chpgViewCode')` est lisible tel quel. Même origine
    (GitHub Pages), rien à redemander au MAR. `API_URL` était déjà publique dans `dashboard.html`.
  - **C1 — identité praticien** : nom, prénom et RPPS pré-remplis. Trois colonnes de `MEDECINS`,
    toutes **en fin d'onglet** et toutes lues **par leur en-tête** : `LIBERAL`, `RPPS`, `PRENOM`.
    Les données nominatives vivent **uniquement dans le classeur privé**, jamais dans le dépôt, et
    ne sont renvoyées qu'au MAR identifié par son propre code, pour sa seule ligne.
  - **Civilité** : le classeur stocke « Dr X » et les gabarits écrivent déjà « Dr » / « Docteur ».
    `sansCivilite()` retire la civilité au pré-remplissage — uniquement si elle est **suivie d'une
    espace**, donc Drouot, Dreyfus et Prunet ne sont pas rognés. Sans ça : « Dr Dr X ».
  - **ADELI supprimé** partout (champ, devis, en-tête) : le RPPS seul suffit. Un champ vide sur un
    document imprimé finit toujours par être rempli par quelqu'un.
  - **C2 — sélecteur de secteur**, parcours **bloc uniquement**, **facultatif** tant que la
    déclaration n'existe pas, **absent du devis** (il sert au placement par le comité, pas à
    informer le patient). Liste tirée de l'onglet `SECTEURS` — **aucune liste en dur**.
    Filtre : `ACTIF` **et** `AFF` renseigné **et** rendement ni `NUL` ni `REA`, trié par `ORDRE`.
    ⚠️ **Un secteur sans rendement renseigné est PROPOSÉ** : un secteur neuf est présumé productif
    jusqu'à classement. Mieux vaut le retirer que le voir disparaître sans explication.
    *(La colonne `RENDEMENT_LIB` de la réa est passée de `REA` à `NUL` le 21/07 ; le filtre exclut
    les deux valeurs, les deux écritures fonctionnent. Rien d'autre ne consomme cette colonne.)*
  - **Replis VISIBLES partout** — hors portail, portail injoignable, liste vide, RPPS ou prénom
    manquant : chaque cas a son message à l'écran et retombe sur la saisie manuelle. Jamais de
    dégradation silencieuse.
  - ⚠️ **Point ouvert** : le devis affiche « secteur 2 (honoraires libres, non-OPTAM) » **en dur**.
    Exact pour Arthur, potentiellement faux pour un autre MAR du groupe — et invisible si ça l'est.
    À traiter le jour où un autre praticien imprime un devis.

- [x] 📅 **Lot D — DÉCLARATION D'INTERVENTION. EN PRODUCTION, testée le 22/07/2026 (estimateur V4.2,
  `portail.gs`, `Indispos.gs` 2026-07-21.5). PREMIÈRE ÉCRITURE du module libéral.**
  - ⚠️ **Vocabulaire — deux « déclarations » à ne jamais confondre** : la *déclaration de choix* est le
    document que le patient signe (exigence DAM, imprimé par l'estimateur) ; la *déclaration
    d'intervention* est la ligne écrite dans `LIBERAL_{Y}` que le comité lit au placement.
  - **Onglet `LIBERAL_{Y}`**, créé à la volée à la première déclaration, année du **jour de bloc**
    (consultation en décembre pour un bloc en janvier → `LIBERAL_2027`). 6 colonnes :
    `ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · CHIRURGIE`. Aucune donnée patient, aucun code CCAM.
    `ID` = poignée aléatoire, pour cibler une ligne sans dépendre du n° de ligne (fragile si l'onglet est trié).
  - **Trois actions**, routées dans `portailRoute` (`portail.gs`) : `declareLiberal`, `deleteLiberal`
    (écritures, **ajoutées au `WRITE_ACTIONS_LOCK` d'Indispos.gs** — le verrou est vérifié AVANT la
    délégation, par nom d'action) et `listLiberal` (lecture).
  - 🔒 **Le `MAR_ID` écrit est TOUJOURS `user.id`, déduit du code d'accès — jamais une valeur envoyée
    par la page.** Vérifié : le payload client ne contient que `action`, `code`, `dateBloc`, `secteur`,
    `chirurgie`. `listLiberal` ne renvoie que les lignes du MAR connecté ; `deleteLiberal` refuse de
    supprimer la ligne d'un autre.
  - **Granularité : une ligne = un MAR, un jour, un secteur.** Même jour + même secteur → la ligne
    existante est **mise à jour** (libellé cumulé « PTH + hernie »), pas dupliquée. Deux secteurs le
    même jour → deux lignes.
  - **Le secteur ne se saisit QU'À LA DÉCLARATION.** Le sélecteur ajouté au parcours au lot C a été
    **supprimé** (V4.2) : il faisait double emploi et n'alimentait ni le devis ni aucun calcul.
    Jour et chirurgie se pré-remplissent depuis le dernier parcours bloc, **et cessent de le faire dès
    que l'utilisateur édite le champ** — sinon une correction saute à la cotation suivante.
  - **Affichage** : « Mes interventions déclarées » montre le futur + les 7 derniers jours (fenêtre de
    correction), passées en orange. Lien « voir mes N interventions de l'année » pour déplier.
    ⚠️ **Rien n'est jamais supprimé automatiquement côté onglet** : c'est la trace de l'activité
    libérale. Le masquage est un confort d'affichage, pas une purge.
  - Chaque MAR ne voit que **ses** interventions : le classeur n'est pas accessible aux autres, la page
    est leur seul accès.

- [x] 🩺 **Lot E — VOLET « ◆ LIBÉRAL » DU COMITÉ. EN PRODUCTION, testé le 22/07/2026
  (`admin.html` site v1.9, `portail.gs` 2026-07-22.1).** La boucle du module est fermée : un MAR
  déclare depuis l'estimateur, le comité le voit au placement.
  - **`listLiberalJour(date)`** dans `portail.gs` : toutes les déclarations d'un jour, tous MAR
    confondus. **Réservée à `user.role === 'admin'`** (`listLiberal`, elle, filtre sur le MAR
    connecté). **Lecture seule → volontairement ABSENTE du `WRITE_ACTIONS_LOCK`.**
    Onglet ou jour sans déclaration → liste vide, jamais une erreur.
  - **Tiroir GAUCHE `#liberalCard`**, symétrique de `#dispoCard`. ⚠️ **Piège vérifié le 22/07** :
    `#dispoCard` a un `style=` inline pleine largeur, mais une **règle CSS plus bas l'écrase** en
    `position:fixed; top:70px; right:16px; width:360px`. C'est un tiroir flottant à droite, pas une
    carte sous la grille. → **Lire la feuille de style, pas seulement l'attribut `style=`.**
  - **Aucune donnée transportée en plus** : `listLiberalJour` renvoie les `MAR_ID` bruts ; `admin.html`
    résout les noms via `_nm()` et les libellés de secteur via `SECTEURS_CFG`, déjà en mémoire.
  - **Cache par date** (`_libJourCache`), même logique que `_dispoCache` : un seul appel API quel que
    soit le nombre de cases cliquées le même jour.
  - ⚠️ **AUCUN jugement de placement** — pas de « déjà en ORTHO », pas de « à replacer », aucun code
    couleur d'état, aucun croisement avec le planning affecté. **Décision d'Arthur, à ne pas
    "améliorer"** : le module énonce un fait, le comité décide seul. Être de garde ne change rien.
  - **Jour sans libéral : silence total** — tiroir masqué, pas de toast (le toast prévu en conception
    a été écarté : des dizaines de clics par séance, ça devient du bruit).
  - Si le GAS n'est pas recopié, `api()` lève et le volet **reste simplement masqué** : ce volet est un
    confort, il ne doit jamais bloquer le placement.

**⚠️ Deux pièges payés comptant ce jour-là.**

1. **Une colonne insérée au MILIEU de `MEDECINS` casse les codes d'accès.** 22 lectures de l'onglet
   utilisent des index de colonne **figés** ; l'insertion décale tout et `checkCode` lit la colonne
   voisine. La roadmap et le contexte affirmaient que la colonne « pouvait être placée n'importe où » :
   c'était vrai de la lecture de `LIBERAL`, **faux de l'onglet**. Règle désormais écrite dans le
   CONTEXTE : **nouvelle colonne = toujours à la fin**.
2. **Une icône absente du mini-bundle ne s'affiche pas, en silence.** `dashboard.html` charge
   `assets/vendor/lucide-icons.js`, un fichier **local de 18 icônes**, pas le CDN Lucide. `calculator`
   n'y était pas : tuile correcte, carré vide, aucune erreur. Tracé officiel ajouté (lucide 1.23.0),
   liste d'en-tête du fichier mise à jour, et un `console.warn` remplace le `return` muet.
   → **Même réflexe manqué que la 4ᵉ liste en dur de la veille : vérifier l'inventaire réel du dépôt,
   pas la disponibilité théorique de la ressource.**

### Nettoyage (22 juillet 2026)
- **Constante `FICHES` supprimée d'`admin.html`** (site v1.9.1) : 27 lignes de **code mort**, déclarées mais lues nulle part, remplacées de longue date par l'assistant `openWizardDepart`. Elles contenaient deux renvois vers des pages/onglets **inexistants** (« onglet Modifications de `comite.html` », « onglet Paramètres »). Le contenu utile est déjà couvert, mieux, par `guide-comite.html` (§ ajout d'un MAR).
- **Roadmap rangée** : les lots terminés (estimateur, C, D, E) sont passés de « À faire » à « Fait ». La section « À faire » est repassée de ~12 700 à ~3 700 caractères. Une puce **CRH** orpheline de son parent « Dashboard / portail » a été recollée.

### Couverture des jours serrés — LIVRÉ (23 juillet 2026) · `gas/generateur_gardes.gs` v2026-07-23.2
**13 jours sans binôme → 0**, sur 140 années simulées, **avec une équité et une vitesse meilleures que la référence**.

- **Une première version a été poussée puis retirée le même jour** : elle fermait tous les trous mais dégradait l'équité des week-ends (écart par axe 5,3 contre 3,4). Dépôt restauré, passe réécrite, aucune recopie dans Apps Script entre-temps — la production n'a jamais été touchée.
- **Cause** : la passe « jours critiques » classait par disponibilité annuelle, ce qui écrasait l'équité. **Cause du non-détection** : la batterie ne mesurait que l'écart au *total*, jamais par axe.
- **Moteur retenu** : l'équité pilote le choix (la disponibilité départage) · énumération des combinaisons avec sélection de **la moins coûteuse en équité**, borne dure de 20 000 essais · samedis maintenus dans le périmètre · avertissement au comité en cas de choix contraint.
- **Passe de dernier recours (le mécanisme décisif)** : le moteur renonçait dès qu'il restait moins de deux personnes disponibles, sans essayer la tolérance qu'il avait déjà. Il retente désormais en **tolérant le combo jeudi↔samedi** — légal, ce n'est pas deux gardes d'affilée. Les deux règles dures ne bougent jamais : jamais deux gardes consécutives, jamais de garde sur une absence déclarée. Ce seul ajout fait passer de 1 trou à **0**.

| | référence | livré |
|---|---|---|
| jours sans binôme (140 années) | 13 | **0** |
| pire écart par axe | 3,4 | **3,3** |
| années avec écart ≥ 2 | 45 (32 %) | **38 (27 %)** |
| temps de génération | 7 635 ms/an | **7 456 ms/an** |
| gardes consécutives / sur absence | 0 | **0** |

- **Banc de torture** : batterie 11 scénarios identique au caractère près · déterminisme confirmé (3 exécutions) · stress +50 % d'indispos et équipe réduite → 0 trou · stress 12 congés à Noël → 12 trous, **tous avertis** · 7,5 s/an contre 7,6.
- **Sur tous les tests : avertissements « Manque MAR » = trous.** Aucun jour non pourvu ne peut être publié sans être signalé.
- **Contreparties** : 2 combos jeudi↔samedi et 4 couplages samedi→lundi dégradés sur 140 années, chacun signalé au comité.
- ✅ **Génération RÉELLE effectuée (23/07/2026)** : 2027 générée dans le classeur avec le code déployé, sur indisponibilités réalistes (25 MAR, ~2 000 jours d'absence, souhaits des deux régimes). **Zéro jour sans binôme, écart maximal 1,2 garde.** Une alerte d'effectif limite en décembre, correctement levée par la passe des jours tendus.
- **`simulateur/eval.js`** : contrôle par axe, désormais obligatoire avant toute livraison du générateur.
- **`simulateur/demographie.js` corrigé** : le MAR à 80 % avait un jour off fixe hebdomadaire, qui rendait un axe structurellement impossible (70 % d'années au rouge, artefact pur). Jours désormais dispersés.

### Rythme des gardes au creux démographique — mesuré (23 juillet 2026)
Constat d'**effectif**, pas un défaut de l'algorithme. À volume de congés constant, entre 2037 et 2042 (15 gardeurs) :
écart **médian** entre deux gardes **7,8 j → 6,2 j** · gardes suivies d'une autre sous 7 jours **48 % → 59 %** ·
mois à plus de 4 gardes **6 % → 36 %** · pire mois observé **8 gardes** · retour à la normale dès 2044.
Chiffres affichés en une ligne sur la diapo 3/3, détail complet dans les notes de présentation.
⚠️ La part des intervalles ≤ 4 j (21,6 % → 27,5 %) est **biaisée par l'unité vendredi-dimanche** (~15 % des intervalles
valent 2 jours par construction) — ne pas l'utiliser telle quelle.

### Documentation (docs/)
- Guides : `guide-mar.html`, `guide-comite.html`, `guide-algo-gardes.html`, `guide-liberal.html`, `guide-technique.html`.
- Présentations staff, démographie.
- Conception module libéral + antisèche cotation (voir ci-dessous).

---

## 🔜 À faire

- [ ] 📽️ **Présentation staff du 04/09 — reprendre début août (fil dédié).**
  Corrections factuelles et sécurisation du code de démo faites le 22/07. Reste :
  vérifier le slide 24 (cibles nominatives) contre `MEDECINS`, le slide 21 (simulation figée)
  et le slide 27 (limites connues) ; **vérifier que les profils indispos 2027 des 22 autres
  MARs sont remplis** (annoncé à la salle) ; répétition à blanc de la démo (clic sur le bloc
  code, sessionStorage) ; écrire la **check-list de ménage post-démo** dans le dépôt
  (onglets `_2027`, JSON Drive, vacances 2027, mails, changer le code de Sultan).

### Axes de développement (un fil de conversation chacun)

- [ ] 🔬 **Module libéral — brique CONVERGENCE 30 % (lots 2 et 4)**, seul morceau restant. Voir `docs/module-liberal/module_liberal_conception.md`.
  - ✅ **Déjà en production** (détail dans « Module libéral — chaîne complète » de la section Fait) : estimateur, devis, branchement au portail, déclaration d'intervention, volet comité. **Ne pas les reconstruire.**
  - Reste : saisie des **relevés mensuels** (checksum + monotonie), vue **T / % / marge** par axe, puis **réallocation** + équité du désagrément (consomme `RENDEMENT_LIB`).
  - 🆕 **Cadrage Lot 2 acté (24/07/2026).** Le relevé administratif mensuel est le **socle certifié en euros** — seule source qui connaît le **dénominateur** (activité publique), donc seule à pouvoir donner un **%** de plafond. La **déclaration MAR** (Lot 3, déjà en prod) peut faire monter un compteur **en temps réel entre deux relevés, mais en VOLUME d'interventions uniquement, jamais en %** : elle ignore le public, et un acte déclaré ≠ un euro encaissé. Afficher un % issu des seules déclarations donnerait un chiffre faux au comité. Architecture : *position certifiée au relevé + tendance en volume depuis*. Arbitrage mensuel possible → relevé mensuel, l'écran de saisie garde son sens. Maquette de saisie explorée (17 lignes × 6 nombres, checksum sur Σ excédents recopiés, monotonie du cumul) — non poussée.
  - Chantier de **conception**, pas de code : mérite un fil de conversation dédié. Jeu d'essai disponible : le relevé réel janvier→juin.
  - Conception figée : seuil **30 % par axe** (CCAM technique **et** NGAP consultations, indépendants), objectif = optimiser le pot commun mutualisé, affichage seul côté comité.
  - Assets déjà dans le repo : conception, antisèche cotation CCAM/NGAP, `ccam_actes.json`, `maquette_estimateur_liberal.html`, guide. **Les 3 `.docx` ont été supprimés le 21/07/2026** (décision d'Arthur) : le HTML et le Markdown font foi, trois copies d'un même contenu étant trois occasions de se contredire. Contenu conservé dans `antiseche_CCAM_anesthesie_CHPG.md` et `guide_liberal_MAR.html`. Seul le **mémo de poche 1 page** n'a plus d'équivalent **de format** (son contenu est aux §3 et §5 bis de l'antisèche) — à refaire en HTML si le besoin revient. Récupérables dans l'historique git.
  - **Lots 0, 1 et 3 terminés** (secteurs, fondations données, placement bloc). **Ordre restant : 2 → 4.**
  - ❄️ **Lot 5 — Orientation financière par la secrétaire : GELÉ (24/07/2026).** Conception au
    **§11 ter** de `module_liberal_conception.md`. Router chaque patient vers le MAR le plus loin
    de son plafond suppose le compteur (Lot 2) et un horizon de placement porté à 3–4 semaines
    (organisation). Surtout : le dépassement du groupe s'efface **arithmétiquement** avec les deux
    entrants (Arthur oct. 2026, un autre janv. 2027, ~82 k€ de plafond libre vs ~44 k€ reversés
    S1) ; et au-dessus de 30 %, un acte parti en public n'est pas une perte (il gonfle le
    dénominateur et libère du plafond). Le Lot 5 optimiserait un problème en voie de disparition.
    **Ne pas coder tant que le Lot 2 n'a pas montré, sur données réelles, un dépassement
    persistant après les deux arrivées.** Conception conservée, non abandonnée.
    Contexte mesuré (semaine 25, juin 2026) conservé pour mémoire : 89 patients lib/semaine, 75 %
    déjà bien appariés, vivier CI=1/MAT=1 (déplacements CARDIO structurellement irréductibles),
    délai consult→bloc médiane 6 j. `p = 1/3` était faux d'un facteur deux (consultations typées
    par secteur).

  - 🆕 **Lot 5-bis — Contrôle d'absence côté secrétariat d'anesthésie (conçu 24/07/2026, non
    codé).** Extrait de la jambe **inoffensive** du Lot 5 : ne route rien, ne compte rien, n'écrit
    rien, aucune donnée patient. **Besoin réel :** un patient libéral vu par Dr X sera opéré par
    Dr X ; si le bloc tombe un jour d'absence de Dr X, le patient est mal placé dès la
    consultation. **Outil :** la secrétaire d'anesthésie ouvre, **au coup par coup pour un MAR
    donné**, la liste de ses **absences sur les 3–4 prochaines semaines** ; elle la compare à la
    main avec sa liste de dates de bloc (qu'elle a déjà). **Forme A** retenue (l'outil affiche les
    absences, la secrétaire compare) — pas de forme B (saisie des dates patient) pour ne pas
    créer de donnée patient ni de travail aux secrétaires des chirurgiens.
    - « Absent » = jour où le MAR n'est **pas là** : RG, VAC, FORM, CL, CP, absence — **pas** un
      jour travaillé sur un autre secteur (réa, autre bloc) : ce jour-là il peut récupérer son
      patient. Ligne de partage validée par Arthur.
    - ✅ **Faisabilité vérifiée en lecture de code (24/07).** `ABSENT_CODES_SET` (Indispos.gs
      ~l.2773 : `RG,V,CP,F,CTP,A,CL`) définit déjà la notion « absent ce jour », exploitée en
      production ; cas particuliers déjà gérés (jours fixes non travaillés `tpJoursFixes`,
      dates début/fin d'activité, rythme 2/2 `estSemaineOff`). L'outil est le **même calcul
      retourné** : figer le MAR, boucler sur ~20–28 jours (au lieu de figer le jour et boucler
      sur les MARs). **Nouvelle action de LECTURE**, aucune écriture, aucune nouvelle donnée.
    - ✅ **RÉSOLU (24/07) — `GARDES_{Y}` suffit, lecture d'un seul onglet.** Vérifié sur les **deux**
      chemins d'écriture : (a) campagne d'indispos → `generateur_gardes.gs` l.1283 recopie dans
      GARDES en traduisant `VAC→V`, `INDISPO→I`, `FORM→F`, `CL→CL`, `TP/CTP→TP` — exactement les
      codes de `ABSENT_CODES_SET` ; (b) absence longue → `Indispos.gs` l.3074 écrit `CL` dans
      GARDES *et* INDISPOS (« CL écrase tout : gardes + RG »). Seule exception : année **non encore
      générée**, où le CL ne va que dans INDISPOS — sans objet ici (fenêtre de 3–4 semaines, donc
      toujours l'année en cours, générée).
    - **Source de la liste des consultations : `PLANNING_OVERRIDES`** (`DATE | MAR_ID |
      SECTEUR_MATIN | SECTEUR_AM | COMMENTAIRE`). `GENERER_CONSULTATIONS = false` (code.gs l.255) :
      les consultations ne sont **pas** générées, le comité place chaque MAR à la main. `CS_RULES`
      ne donne que le **gabarit** (combien de créneaux), **jamais qui les tient**.
    - ✅ **Prérequis d'horizon — LEVÉ (Arthur, 24/07) : les consultations seront posées à horizon
      4 semaines.** L'écran ne peut lister que les consultations **déjà nommées** par le comité ;
      cet engagement débloque donc le lot. À 1 semaine d'horizon, l'écran
      n'affiche qu'une semaine et le contre-check n'a pas de matière. ⚠️ Prérequis **beaucoup plus
      léger que celui du Lot 5** : il ne demande **que** cet horizon — rien ne change pour les
      secrétaires des chirurgiens, ni pour le flux patient. Coût réel côté comité : s'engager plus
      tôt, et retoucher un placement posé quand une absence tombe.
    - ❓ À regarder à la maquette : override **modifié après coup** (MAR remplacé sur son créneau) —
      l'outil suivrait le nouveau titulaire, mais les patients déjà placés sur l'ancien ne bougent
      pas.
    - ✅ **Accès et intégration — acté 24/07/2026.** **Une seule page**, à la **racine**, deux
      portes d'entrée vers la **même vue en lecture seule** : (a) **code personnel MAR**
      (mécanisme existant) ; (b) **code partagé du secrétariat**, nouveau, rangé dans `CONFIG`.
      → **Nommer la page par sa fonction, pas par son utilisateur** : `absences.html` /
      `controle-absences.html`, **pas** `secretariat.html` (tous les MARs y ont accès).
      Le code partagé doit avoir une **forme distincte** des codes MAR (désambiguïsation au
      login) et rester **changeable en une ligne de `CONFIG`** s'il circule trop.
    - **Tuile `dashboard.html` pour TOUS les MARs** — et non les seuls `LIBERAL = O`, à la
      différence de la tuile « Module libéral ». Conséquences mécaniques du même push :
      `dashboard.html` est une page visible → **bump de version du site (2ᵉ chiffre, feature)** ;
      c'est une page MAR → **mise à jour obligatoire de `docs/guide-mar.html`**.
    - 🔒 **Motif d'absence : visibilité SELON LE RÔLE (acté 24/07).** Session **MAR** (code
      personnel, entrée par la tuile Dashboard) → dates **+ motifs** : les MARs voient déjà le
      planning complet dans `index.html`, le masquage n'aurait aucun sens. Session
      **secrétariat** (code partagé) → **dates seules**.
      ⚠️ **Le filtrage est SERVEUR, jamais client.** L'action GAS ne doit pas renvoyer les codes
      (`V`, `CP`, `F`, `RG`, `CL`, `TP`) dans une session secrétariat : les masquer en JS les
      laisserait lisibles dans le source. **Deux réponses distinctes selon le rôle authentifié**
      → une seule page, **deux rendus**. Contrainte la plus facile à oublier en codant.
      À vérifier avant de coder : que l'action GAS sait de quel type de session elle provient
      (le code d'entrée est transmis à chaque appel, donc a priori simple — non lu à ce jour).
    - **Session MAR : file filtrée sur ses PROPRES consultations (acté 24/07).** Usage visé : le
      MAR vérifie lui-même que ses patients ne sont pas opérés un jour où il est absent. Le
      panneau de droite affiche alors toujours ses propres absences.
      ❓ À trancher : filtre **exclusif** ou **par défaut avec bascule « voir tous »** ? Aucune
      raison de confidentialité de masquer les collègues (planning déjà visible) — c'est une
      question d'usage : un MAR peut vouloir vérifier un collègue lors d'un échange.
    - Exposition : pour les **MARs**, aucune nouveauté (ils voient déjà le planning complet dans
      `index.html`). Pour le **secrétariat**, c'est un accès nouveau à l'ensemble des absences de
      l'équipe — c'est le but de l'outil, mais acté explicitement. Fuite du code partagé sans
      gravité : la page n'écrit rien, ne contient aucune donnée patient, n'expose que des dates.
    - 🔐 **AUDIT DE SÉCURITÉ AVANT CODAGE — fait le 24/07/2026, à lire AVANT de toucher au code.**
      Motif : ajouter un 3ᵉ rôle n'est **pas** neutre. J'avais annoncé à tort que les gardes
      `if (user.role !== 'admin') return _deny()` bloqueraient un nouveau rôle par défaut — **faux** :
      les actions placées *avant* ces gardes sont ouvertes à **tout code valide**.
      - **Inventaire mesuré (`Indispos.gs`, 50 actions) : 40 protégées admin, 10 OUVERTES** —
        `getActiveYear` (l.1060, avant même `checkCode`), `getStatus` (1082), `getStatsLive` (1087,
        **stats de gardes nominatives**), `login` (1094), `getNoelAnEligibles` (1115), `getIndispos`
        (1122), **`saveIndispos` (1129 — ÉCRITURE)**, `getVacConfig` (1275), `getPlanningJson`
        (3225), `getAffectationsJson` (3232).
      - 🔴 **BLOQUANT — `getPlanningJson` défait la règle « dates seules ».** `planning_{Y}.json`
        contient le **code d'absence brut** dans `status`, pour **chaque MAR et chaque jour de
        l'année** (`code.gs` l.828→857 : la valeur de `GARDES_{Y}` y est recopiée telle quelle), et
        l'action est ouverte à tout code valide. Donner un code au secrétariat lui donnerait donc
        **tous les motifs de toute l'équipe sur l'année**, quel que soit le filtrage d'une nouvelle
        action. ⇒ **La liste blanche DOIT exclure `getPlanningJson`, et l'écran secrétaire DOIT
        avoir sa propre action dédiée** (consultations + dates seules). Il ne peut pas réutiliser le
        JSON du planning.
      - **`portail.gs` (`portailRoute`, l.20) : les actions de LECTURE n'ont aucun contrôle de
        rôle** — `listTopos`, `getTopo`, `listStaffs`, `listStaffsAll`, `listProtocoles`,
        `getProtocole`, **`listAnnuaire` (annuaire nominatif)**, `getSecteurs`, `getCsTemplate`,
        `getVeille`. Un rôle secrétariat y accéderait sans garde.
      - 🟢 **Déjà solide, rien à faire :** `declareLiberal` / `deleteLiberal` exigent
        `role === 'mar'` (l.1184) ; `listLiberalJour` exige admin (l.1256) ; `genererCRH_` filtre sur
        `CRH_ALLOWED` (l.1040). Un rôle secrétariat y est refusé nativement.
      - ✅ **Plan corrigé :** l'étape 2 n'est **pas** une garde par action mais un **refus par défaut
        placé immédiatement après `checkCode` (l.1065), AVANT le `WRITE_ACTIONS_LOCK` (l.1043) et
        avant tout traitement d'action** : le rôle `secretariat` n'atteint que `login` + la nouvelle
        action de lecture, rien d'autre. **Étapes 1 et 2 indissociables** — ne jamais pousser l'une
        sans l'autre, l'intervalle serait une brèche.
    - 🏷️ **Nommage et atterrissage — arrêtés 24/07/2026.**
      - **Tuile Dashboard : « Mes consultations »**, sous-titre *« Vos consultations à venir et vos
        absences sur la même période. »* Visible par **tous les MARs**. La tuile n'est vue que par
        les MARs (la secrétaire ne passe pas par le Dashboard) : elle peut donc parler à la
        première personne. Écarté : « contrôle d'absence », vocabulaire de conception et non
        d'utilisateur.
      - **Titre de la page : « Consultations à venir »** — neutre, car la page est **partagée**
        entre MARs et secrétariat.
      - **Atterrissage secrétariat : DIRECT sur `absences.html`**, sans passer par le portail ni le
        Dashboard (elle n'y a rien à faire). ⚠️ **Impacte le code de connexion** : après saisie du
        code partagé, la redirection dépend du rôle renvoyé par `checkCode` — à traiter dans
        l'étape 1/2, pas après coup.
    - 🔢 **Version cible du lot : `v1.10`** (arrêté 24/07/2026). Le site est aujourd'hui en
      **v1.9.4** ; ce lot est une fonctionnalité ⇒ 2ᵉ chiffre. **Le passage à `v2.0` reste réservé
      à l'intégration du module libéral** (mise en service du Lot 2 / compteur), jalon encore à
      venir — ne pas le consommer ici.
      ⚠️ **Le marqueur de version n'existe que dans `admin.html` (3 occurrences) et
      `dashboard.html` (3) — soit 6 emplacements, PAS 9.** `index.html`, `indispos.html` et
      `staff.html` n'en portent aucun (mesuré le 24/07). Ne pas chercher à en ajouter ailleurs
      sans décision explicite : le diagnostic Maintenance vérifie l'égalité entre les emplacements
      existants. *(Remarque d'Arthur : l'échelle de versions n'est pas encore visible des
      utilisateurs, l'interface n'étant pas en service.)*
    - 📍 **Position de la tuile : 2ᵉ, juste après « Planning »** (validée sur visuel le 24/07).
      Alternative écartée : après « Mes congés », auprès des tuiles personnelles.
      Le marquage « Nouveau » et le cerclage du visuel de validation sont **propres au visuel** :
      en production la tuile est identique aux autres.
    - 📌 **Ordre de construction (arrêté 24/07) :** (1) `SECRETARIAT_CODE` dans CONFIG +
      `checkCode` renvoie le 3ᵉ rôle → (2) liste blanche refus-par-défaut → (3) action de lecture
      des absences, autonome, deux réponses selon le rôle → (4) action « qui peut prendre » →
      (5) `absences.html` → (6) tuile Dashboard + bump de version + `guide-mar.html`.
      Étapes 1–4 = GAS (recopie manuelle + nouveau déploiement) ; 5–6 = frontend.
      ⚠️ `getMARsDispoJour` (`Indispos.gs` l.2727) est **admin-only** et répond à une **autre**
      question (combler une case flash, groupée VOLANT/CTP/R) : l'étape 4 demande sa propre action,
      ne pas la réutiliser telle quelle.
    - 🎨 **Maquette v3 — `docs/module-liberal/maquette_controle_absence.html`** (poussée le
      24/07 ; non fonctionnelle, ne réédite que ce chemin, la version est dans l'en-tête). File des consultations posées à gauche, groupées par
      jour, avec le **secteur en clair** (Viscéral, ORL, Endoscopie… et non le code `CS-*`) ;
      pastille pleine/grise par ligne = ce MAR a ou non des absences **pertinentes pour CETTE
      consultation**. Clic → panneau droit : périodes à éviter, encadré « qui peut le prendre »,
      grille 4 semaines, état « aucune absence » explicite. Simulé et vérifié : **92 créneaux =
      23/semaine** conforme à `CS_RULES` ; **aucun médecin proposé n'est absent** le jour visé.
    - ⏱ **Fenêtre = 4 semaines À PARTIR DE LA CONSULTATION sélectionnée** (acté 24/07), et non
      depuis aujourd'hui : une absence antérieure à la consultation est sans objet (le patient
      sera opéré après). Conséquence : l'horizon de données doit dépasser de 4 semaines la
      dernière consultation affichée (maquette : 45 jours ouvrés pour 20 jours de consultations).
    - 📅 **Jours consécutifs regroupés en plages** (« 10 – 14 août », pas cinq dates). Règle de
      fusion **différente selon le rôle** : vue **MAR** → fusion **à motif identique** (le motif
      est affiché, deux motifs ne peuvent pas tenir dans une plage) ; vue **secrétariat** →
      fusion **sans regarder le motif** (il n'est pas affiché).
      ⚠️ **Corollaire serveur : regrouper APRÈS le filtrage par rôle, jamais avant** — sinon on
      regrouperait sur une information que la secrétaire n'a pas le droit de recevoir.
    - 🔎 **« Qui peut prendre ce patient ? » (acté 24/07, point 2).** Clic sur une période → liste
      des MARs **présents sur TOUTE la période** (la proposition reste donc valable quel que soit
      le jour du bloc) **et ayant une consultation AVANT** cette période (on ne peut pas voir en
      consultation un patient déjà opéré). Regroupés **même secteur d'abord**, puis autres.
      Réutilise la logique de `getMARsDispoJour` — question inverse de l'écran principal.
      Toujours **lecture pure**, zéro écriture, zéro donnée patient.
    - ❌ **Notification au MAR sur sa tuile Dashboard : ÉCARTÉ (24/07).** Supposerait que le système
      connaisse les patients — or il n'en connaît aucun, et c'est ce qui le rend simple et sans
      risque (contrainte 3.bis). Sans identité patient la notification ne pourrait dire que
      « votre consultation a changé », sans que le MAR puisse agir. Coût réel : créer un système
      de notifications inexistant + faire passer l'écran de « lecture seule » à « écrit »
      (`WRITE_ACTIONS_LOCK`, verrous, réconciliation). Arthur : « tant pis ».
    - ⚠️ **Règle générale (dépôt PUBLIC) : aucune maquette ne doit contenir de noms réels de
      praticiens.** Utiliser des noms fictifs, y compris dans les commentaires de code.
    - ⚠️ Ne pas réutiliser tel quel `getMARsDispoJour` : sa liste d'absence garde `TP`/`R`
      (proposerait un MAR son jour de non-travail).
  - **Calendrier acté : la brique convergence ne passe pas en prod avant le go-live d'octobre 2026.** Construction et tests à blanc possibles dès maintenant.

- [ ] 🖥️ **Dashboard / portail**
  - **CRH** : **DÉCIDÉ le 22/07/2026 — reste mono-utilisateur** (`only:'FROHLICH'`). Motif : l'outil consomme l'**API Anthropic**, payante ; pas question de financer l'usage du service. Ne pas reproposer d'ouvrir la tuile sans qu'un modèle de prise en charge du coût ait été tranché en amont.
  - Nouvelles tuiles de contenu : à cadrer au besoin.

- [ ] 📚 **Veille bibliographique** — enrichissements (option `ENRICH` IA quand clé API dispo).

- [ ] ✉️ **Boîte de réception dans `admin.html` (conçu 24/07/2026, non codé).** Icône enveloppe dans
  la barre d'admin ouvrant un **panneau interne** listant les mails reçus sur
  `planningchpg@gmail.com` — boîte destinée à centraliser les demandes des MARs (changement de
  statut, échange de garde…). **Lecture seule.**
  - ❌ **Pas d'iframe** : Gmail refuse d'être affiché dans une page tierce, ce n'est pas
    contournable. ❌ **Pas de lien vers Gmail** non plus : la boîte appartient au compte
    propriétaire du classeur, du Drive et de l'Apps Script — y donner accès au comité reviendrait à
    donner les clés de tout le back-end.
  - ✅ **Voie retenue : lecture côté serveur.** Le script s'exécute **en tant que propriétaire**
    (vérifié : `MailApp.sendEmail` fonctionne sans identité explicite, `Indispos.gs` l.1741), il lit
    donc la boîte nativement et renvoie du JSON. Personne n'approche des identifiants.
  - **Chargement (acté) :** le **contenu ne part qu'au clic** (~2–4 s, ordre de grandeur non
    mesuré) ; le **compteur de non-lus part en tâche de fond APRÈS l'affichage** de l'admin — les
    temps se recouvrent, jamais d'attente ajoutée à l'ouverture de la page. ⚠️ **Ne pas mettre le
    compteur dans `getAdminBootstrap`** : il ajouterait 0,5–1 s à *chaque* ouverture pour une
    fonction consultée occasionnellement. Au clic, ouvrir le panneau **immédiatement, vide, avec un
    indicateur** plutôt que de laisser l'icône figée.
  - **Quotas — non-bloquant, marge vérifiée le 24/07** (source : quotas Apps Script, compte
    *consumer*) : **20 000 opérations Gmail lecture/écriture par jour**, compteur **distinct** des
    100 destinataires/jour déjà utilisés à l'envoi. Une ouverture de panneau (20 messages) ≈ **50
    opérations** → ~**400 ouvertures/jour** possibles ; usage lourd (5 personnes × 10 ouvertures) =
    2 500 op. = **12 % du quota**. Le compteur de non-lus = **1 opération** (100 chargements/jour =
    0,5 %). Volume de mails attendu : 23 MARs, ordre de **6/semaine** — dérisoire *(estimation,
    volume réel non fourni)*.
  - 🔒 **Deux règles à ne pas oublier en codant :** afficher le **texte brut uniquement, jamais le
    HTML** des messages (injection de contenu externe dans la page) ; **lire seulement** — répondre
    depuis l'admin serait une écriture (⇒ `WRITE_ACTIONS_LOCK` + quota d'envoi), c'est une étape
    distincte à décider séparément.
  - ⚠️ **Confidentialité :** tout le comité verrait tous les mails de cette adresse. C'est l'objet
    de l'outil pour des demandes de service, mais il n'y a **aucune cloison** si un MAR y écrit
    quelque chose de personnel.
  - ❓ **À vérifier avant de coder :** la lecture Gmail peut-elle se limiter à une autorisation
    **lecture seule**, ou impose-t-elle l'autorisation large ? Cela change ce que le script pourrait
    faire de la boîte.
  - **Même push le jour venu :** `admin.html` est une page visible → **bump de version (2ᵉ chiffre,
    feature)** + mise à jour de **`docs/guide-comite.html`**.

### Finitions & maintenance
- [ ] **Sorties de garde réa / anesthésie non distinguées** dans l'Excel (une seule ligne « SORTIES DE GARDE »). Le statut `RG` est unique : impossible de savoir de quelle garde sort la personne. Piste : un second statut (`RG2`), ou déduire depuis la veille — mais le lundi renverrait au dimanche de la semaine précédente, hors `daySlots`.
- [ ] Picker des consult libérales endo : filtrer/avertir sur la présence au bloc en semaine N+1. **Plus aucun contrôle automatique depuis le retrait de la rotation (20/07/2026)** — l'attribution est 100 % manuelle et la règle du 8.1 est à vérifier de tête par le comité (documenté dans `guide-comite.html` § 8.2).
- [ ] *(Sécurité, à l'appréciation d'Arthur)* rotation du token GitHub.
- [ ] 💾 **Sauvegarde hors-compte du classeur maître (conçu 24/07/2026, non codé).**
  **Existant vérifié :** `backupHebdo()` (`code.gs` l.1473) copie le classeur **tous les lundis
  ~4 h** dans le dossier Drive `Planning-CHPG-Backups`, rotation sur **8 copies** (≈ 2 mois) ;
  installation par `installBackupTrigger()` (l.1494) ; le diagnostic Maintenance (`Indispos.gs`
  l.1886) alerte si la dernière copie date de plus de 10 jours.
  - 🔴 **Faiblesse structurelle :** la copie est dans **le même Drive, sous le même compte** que
    l'original. Elle protège d'une fausse manœuvre ou d'un onglet effacé, **pas** d'un compte
    compromis, suspendu ou fermé — dans ce cas l'original *et* les 8 copies disparaissent ensemble.
  - ⚠️ **Piège à ne pas retenir :** partager un dossier depuis un second compte et y copier **ne
    résout rien** — sur Drive, **le fichier appartient à celui qui le crée**. La copie resterait
    propriété de `planningchpg@gmail.com`, simplement rangée ailleurs.
  - ❌ **Export XLSX envoyé par mail : ÉCARTÉ.** Robuste sur la propriété (la copie vit dans une
    boîte, hors Drive) mais **ne contient pas le script bound**. Arthur : « dans l'idéal il
    faudrait que le script reste ».
  - ✅ **Voie retenue — sauvegarde TIRÉE, pas poussée.** Principe : c'est la sauvegarde qui va
    chercher, pas le système à protéger qui envoie. Un petit script (~15 lignes) **dans le compte
    Google personnel d'Arthur**, déclenché chaque semaine, fait un `makeCopy` du classeur maître
    vers *son* Drive : le fichier étant **créé par ce compte, il lui appartient nativement** —
    aucun `setOwner` nécessaire, et rien de ce qui arrive à `planningchpg` ne peut l'atteindre.
    Une copie Drive **emporte le script bound**, contrairement à l'export XLSX.
  - ❓ **À vérifier avant de coder :** (1) quel **niveau d'accès** le compte perso doit avoir sur le
    classeur pour que **le script bound suive la copie** — la lecture seule suffit probablement
    pour les données, pas forcément pour le script ; (2) accorder l'écriture au second compte
    **élargit la surface d'exposition** (c'est le compte d'Arthur, mais à décider en conscience) ;
    (3) poids réel du classeur, si un export hors-Google est aussi souhaité (limite 25 Mo en pièce
    jointe). *(`setOwner` après copie a été envisagé puis écarté : Google a durci les transferts de
    propriété entre comptes gratuits, comportement non garanti sans test réel.)*
  - 📌 **Mise en perspective :** le code GAS est déjà **à 100 % dans le dépôt** (règle du projet).
    Perdre le script bound est donc un **coût de réinstallation**, pas une perte de données. **Le
    seul actif irremplaçable est le classeur** — indispos, gardes, historique, statistiques. C'est
    lui que la sauvegarde doit protéger en priorité.
  - Le script du compte perso vivra **hors** de ce dépôt (autre compte) : prévoir malgré tout de le
    versionner quelque part, sinon il échappe à la règle « le dépôt fait foi ».
- [ ] ⚠️ **`markVeille` écrit sans verrou ni contrôle de rôle** (constaté 24/07/2026, anomalie
  **préexistante**, sans rapport avec le Lot 5-bis). Elle marque un article de veille comme lu —
  donc une **écriture** — mais elle est **absente de `WRITE_ACTIONS_LOCK`** (`Indispos.gs` l.1043)
  et n'a aucun contrôle de rôle dans `portailRoute` (`portail.gs` l.32). Risque faible vu l'usage
  (un seul lecteur à la fois en pratique), mais c'est une vraie omission. À traiter **séparément**,
  ne pas la glisser dans un autre lot.
- [ ] ⚠️ **`appsscript.json` absent du dépôt** (constaté 24/07/2026). `gas/` ne contient que les
  5 `.gs` + README. Ce fichier déclare les **autorisations OAuth** du script : en son absence, le
  dépôt ne contient pas 100 % de ce qu'il faut pour reconstruire le projet Apps Script — les
  autorisations manqueraient. Sans gravité aujourd'hui, mais **l'ajout de la lecture Gmail passe
  précisément par ce fichier** : autant le verser au dépôt à ce moment-là.

### Pour 2027 (déménagement)

*Rappel : le chantier **Secteurs (Lot 0)** est terminé depuis le 21/07/2026, de la ligne d'onglet
jusqu'au fichier Excel du vendredi (détail en section Fait, marche à suivre au § 18 du guide
technique). Seule l'étape 3 ci-dessous reste ouverte.*

- [ ] **Étape 3 (non urgente)** : retirer les tables en dur (`SECTEURS`, `CS_TYPES`, `CS_REQUIRED`,
  `CS_OPENABLE`) et rendre le **repli visible**. Aujourd'hui il est silencieux : une panne de lecture
  ferait tourner les pages sur le code en dur sans le dire. Inoffensif tant qu'on ne compte pas dessus.

---

## 🚫 Écarté (ne pas reproposer)
- **Généraliser le service worker aux autres pages** — **écarté le 22/07/2026.** Seul `dashboard.html` le porte, et c'est suffisant : **tout le monde passe par le Dashboard** (confirmé par Arthur). `admin.html` est PC uniquement ; `indispos.html` et `staff.html` s'ouvrent depuis le Dashboard. Ajouter l'installation ailleurs ne servirait personne.
- **Servir les icônes d'`index.html` depuis le mini-bundle local** — **écarté le 22/07/2026.** Les icônes de secteur sont **configurables depuis l'onglet `SECTEURS`** (colonne `icon`) : `index.html` en utilise déjà 10 (Activity, HeartPulse, Bone, Syringe, Eye, Microscope, Heart, Zap, Baby, Stethoscope) et le catalogue Lucide en compte **1 728**. Embarquer une liste figée recréerait exactement une table en dur : créer un secteur avec une autre icône ferait disparaître son picto **en silence**. Le gain est théorique (une panne d'`unpkg.com` ne dégrade que des pictogrammes décoratifs, jamais l'information du planning), le coût réel. ⚠️ Ne reproposer qu'avec un **repli visible** (initiales du secteur à la place de l'icône manquante), ce qui est un vrai chantier, pas une correction rapide.
- **`crh.html`** est en revanche passé au bundle local le 22/07 : une seule icône (`arrow-left`), déjà embarquée, aucun risque.
- **Réduction automatique du devis à l'impression** — étudiée puis **écartée le 21/07/2026**, décision d'Arthur. Le projet était de mesurer la hauteur de la feuille, de sortir les règles de compactage de `@media print` sous une classe `body.dvfit` pour qu'elles soient visibles à la mesure, et d'appliquer un `zoom` plancher 0,75. **Abandonné parce que le cas réel ne le justifie pas** : 95 % des dossiers font 2 actes, 3 au grand maximum. Le problème a été réglé par la mise en page seule (V3.6, un acte par ligne), rendu et impression validés. Ne pas reproposer sans un cas réel de débordement à 3 actes.
- `config.html` (couvert par les onglets d'admin.html).
- Optimisation perf du JSON (déjà minifié + gzip).
- **Protection anti-force-brute sur `checkCode()`** — étudiée puis **écartée le 20/07/2026**, décision d'Arthur, après chiffrage. Ne pas reproposer sans élément nouveau. Trois raisons :
  1. **Le brute-force exhaustif est déjà hors de portée.** 32⁸ ≈ 1 100 milliards de combinaisons ; Apps Script plafonne à 30 exécutions simultanées et chaque tentative lit deux onglets (~50 essais/s au mieux) → **~350 ans** pour parcourir la moitié de l'espace. Aucune protection supplémentaire ne change cet ordre de grandeur.
  2. **Un disjoncteur global couperait le service.** `checkCode()` n'est PAS appelé qu'au login : il tourne à **chaque requête**, pour les 50 actions de `doGet`. Bloquer les tentatives au-delà d'un seuil aurait rendu l'outil indisponible pour les 23 MARs — un attaquant coupait le service avec 30 essais ratés, sans jamais trouver de code. Piège identifié en cours d'implémentation.
  3. **`Utilities.sleep()` aggrave le quota.** Le temps d'attente compte dans le temps d'exécution Apps Script : une temporisation censée protéger le quota l'épuise plus vite sous charge.
  - *(Note : la piste « compteur par IP » évoquée lors de l'audit initial était de toute façon irréalisable — Apps Script ne donne pas accès à l'IP du client.)*
