# Contexte projet Planning-CHPG — à coller en début de conversation

Tu es mon développeur attitré sur **Planning-CHPG**. Je suis **Arthur**, anesthésiste-réanimateur
au **CHPG (Monaco)**, seul responsable de ce projet et **sans bagage de code** : tu écris, valides
et livres tout ; moi je recopie/valide. Réponds en **français**, de façon **concise**, avec des
chiffres concrets plutôt que des généralités.

---

# PARTIE 1 — L'ESSENTIEL

*Si tu ne lis qu'une chose, lis ceci. Le détail complet est en partie 2.*

## État au 14 août 2026 — v1.34 en attente de push : les échanges de gardes sont construits de bout en bout

**Le chantier « échanges et dons de gardes entre MAR » est TERMINÉ dans la copie de travail — rien
n'est encore poussé.** Un MAR proposera (don ou échange), l'autre recevra une notification avec
pastille rouge sur l'icône, acceptera ou refusera, et le planning s'écrira tout seul — comité hors
boucle sauf pour replacer un R intransférable. Décision d'Arthur : tout déployé et testé AVANT le
staff du 4/09, INVISIBLE pour les 23 (interrupteur côté serveur, pilotes nominatifs hors dépôt),
mise en service en un geste (`ouvrirEchanges()`) juste après. Le détail complet, la séquence de
déploiement et les ajouts à la check-list de nettoyage sont dans la ROADMAP (bloc du 13-14/08).

**Quatre règles apprises ou confirmées dans ce chantier.**
1. **Une clé de plus dans une requête existante coûte des octets ; une requête de plus coûte un
   aller-retour.** La clé `echanges` voyage dans l'appel d'ouverture du dashboard — zéro requête
   ajoutée, un refus serveur = coût nul ET invisibilité garantie sans aucune logique côté page.
2. **Le dryRun d'`applyModification` tient par la doctrine « tout vérifié avant la première
   écriture »** : neutraliser writeCell suffit à juger une demande sans rien dupliquer. Si cette
   doctrine cassait un jour, le dryRun casserait avec elle.
3. **Un R peut être ANTICIPÉ (posé avant son samedi)** — comportement voulu du générateur (repli
   hors vacances scolaires). Tout raisonnement « le R est après le samedi » est FAUX.
4. **Les tests d'inventaire vérifient l'APPARTENANCE, jamais la POSITION** : deux regex du banc
   figeaient la liste exacte (dernier élément, liste complète d'un appel) et cassaient à chaque
   ajout légitime. Le banc a attrapé les deux — c'est son travail — mais la règle vaut pour tout
   nouveau test.

**Le gel de `sw.js` tient jusqu'au 4/09.** La v4 (pastille d'icône) est écrite et testée mais
partira dans un second micro-push le 5/09, avec l'ouverture. Aucune exception au gel.

## État au 13 août 2026 (soir) — v1.33.2, plus rien n'attend Google, banc à 863 vérifications

**Le bandeau « mon ordre de passage » est en service dans « Mes congés ».** Chaque MAR y voit son
groupe, son rang, et — d'un appui — qui choisit avant lui, période par période, pour l'année en
cours et la suivante. L'année mise en avant bascule le 1er septembre : jusqu'au 31 août on regarde
l'année en cours, après on prépare le staff de la suivante. **C'est le serveur qui tranche cette
bascule**, pas le téléphone.

**Trois choses à ne pas refaire autrement.**

1. **`getOrdreVacances` n'est pas un doublon de `getVacConfig`.** `getVacConfig` part de
   `PERIODES_VAC`, qui ne contient QUE l'année de campagne, et de `INDISPOS_{Y}`, qui n'existe pas
   encore pour l'année d'après. L'ordre de passage ne dépend que de `GROUPES_VAC` et de l'année :
   d'où une fonction séparée, capable de répondre pour deux années.
2. **Aucun nom dans le dépôt.** Un formulaire de code sur une page GitHub Pages ne protège RIEN :
   le fichier se télécharge par `raw.githubusercontent.com` sans jamais exécuter le JavaScript. Les
   guides portent les lettres A/B/C ; les noms transitent à l'affichage, derrière le code.
3. **La règle de rotation des vacances existe en SIX exemplaires** — trois dans `Indispos.gs`
   (`getVacConfig`, `getVacValidation`, une fonction de diagnostic), `staff.html`, `admin.html`,
   `docs/guide-mar.html`. `banc_docs.js` §6 les compare et vérifie que le tableau écrit du guide
   correspond au calcul. Toute nouvelle copie doit rejoindre ce test. Sens : rotation à DROITE, le
   dernier repasse premier, pour les groupes entre eux comme à l'intérieur de chacun.

**Le guide MAR n'est plus seulement un document : il porte un calcul.** Le tableau de l'ordre des
groupes y est écrit en dur ET recalculé au chargement, pour ne jamais périmer — et pour rester juste
si le script ne s'exécute pas.

**Plus aucune lecture systématique chez Google, ni côté MAR ni côté comité.** Le dernier appel était
`getStatsLive`, l'onglet Instantané — le calcul le plus lourd du portail, payé par chaque MAR à
chaque clic. Il tourne désormais une fois pour les 23, dans le déclencheur différé du miroir.
**La charge d'un calcul lourd se met là où elle est payée une fois, jamais dans la requête de
quelqu'un.** Contrepartie assumée et annoncée à l'écran : « à la minute près » au lieu de « à
l'instant T », avec un lien pour forcer le calcul frais.

**Une donnée déposée que personne ne lit ne sert à rien.** `vacances_admin` et `indispos_{Y}`
étaient dans la copie rapide et autorisées au comité depuis le 04/08 : aucun écran ne les demandait.
Avant d'ajouter une clé, vérifier que celles qui existent sont consommées.

**Les listes de codes métier recopiées à la main finissent TOUJOURS par diverger.** `index.html` en
portait cinq pour les absences ; aucune ne connaissait `V`, `TP` ni `CL`. Le vocabulaire ayant
changé entre 2026 (`A`) et 2027 (`V`), la vue MAR ignorait 1013 cases de vacances sur toute l'année
à venir — et ses quatre compteurs de présents étaient faux sans que rien ne le signale. Une seule
liste désormais, avec le relevé du classeur en commentaire. **Le symptôme signalé (un nom manquant
dans un panneau) était infiniment plus petit que le défaut.** C'est la troisième fois de la journée.

**Le banc voit ce que je ne vois pas.** La pastille des indisponibilités, première version, appelait
Apps Script à l'ouverture de la page — interdit depuis la v1.25. Un scénario existant l'a signalé
avant qu'Arthur ne le voie. Ne jamais proposer un push sans l'avoir lancé, même pour un ajout qui
paraît anodin.

**Une clé nouvelle dans la copie rapide, et une ouverte.** `ordre_vac` (composition ordonnée des
groupes, sans aucun rang personnel : la page s'y cherche par son identifiant) voyage dans le même
appel que le planning à l'ouverture du dashboard. Et `stats_{Y}`, jusque-là réservée au comité,
passe aux MAR pour que la vue Équité affiche les cibles sans attendre.

**Deux leçons de cette ouverture.** D'abord : **demander avant de trancher**. Qui voit quoi est une
décision de service, pas un choix technique — je l'avais tranchée seul en fabriquant une clé
dédiée, à tort. Ensuite : **vérifier le fondement d'une prudence avant de la payer**. `getStatsLive`
ne porte AUCUN contrôle de rôle et l'onglet « Instantané » montre déjà ces compteurs nominatifs à
tout MAR : la clé dédiée aurait coûté une recopie Apps Script pour protéger une donnée déjà
accessible. Le banc garde désormais cette absence de contrôle sous surveillance.

Restent au comité : `gardes_{Y}`, `joursferies_{Y}`, `config_admin`, `vacances_admin`,
`mail_nonlus`, `liberal_{Y}`.

**Ordre de mise en service d'une nouvelle clé, non négociable** : le Worker D'ABORD, puis le `.gs`,
puis `miroirSyncComplet`. Inversé, la clé est refusée en silence et poussée dans le vide. Et si la
clé s'appuie sur une fonction d'un AUTRE `.gs`, recopier l'un sans l'autre la fait OMETTRE, sans
message. Rien ne signale l'erreur : seule la lenteur persistante la trahit.

**Le compte des porteurs de version a changé : 5 fichiers, 11 occurrences**, pas 9. `index.html`,
`indispos.html` et `staff.html` n'en portent aucun — mais une modification de ces pages impose
quand même la montée de version chez les 5 porteurs. **Compter, ne jamais recopier ce chiffre.**

**Un 404 sur le diagnostic n'est pas une panne.** Google perd l'accusé de réception sur les
exécutions longues (travers documenté depuis le 28/07) et le diagnostic est le plus long appel du
portail. Une relance passe. Le panneau Exécutions d'Apps Script tranche : « Terminée » = le script
a tourné.

**Changer d'année redessine désormais la vue affichée.** Le sélecteur ne rappelait que
`renderMedecins` : Équité, Affectations et Année gardaient les données de l'année précédente sous le
libellé de la nouvelle. Sur Équité, ça produisait un certificat rouge nominatif — « 19 écarts au-delà
de 2 gardes » — sur un planning qui n'en comptait aucun.

**La leçon de méthode compte plus que le correctif.** J'ai d'abord accusé le changement du jour (le
raccourci par la copie rapide) et proposé un retour en arrière. Arthur l'a refusé et a exigé une
correction : c'est ce refus qui a mené au vrai coupable. **Accuser la dernière modification est un
réflexe, pas un diagnostic.** **Reproduire hors ligne** — ici recalculer les écarts à partir du
planning publié, six valeurs sur six retrouvées — tranche en une commande ce que trois hypothèses ne
départagent pas. Et **un affichage faux est pire qu'un affichage absent** : un écran vide se
remarque, un certificat chiffré et nominatif se croit.

**Un cache partagé se remplit parfois à moitié, et c'est un piège.** `dashboard.html` précharge le
planning de l'année suivante dans `chpgPlan:{Y}` sans ses affectations. `index.html` y voyait une
année « déjà chargée » et partait chercher les affectations chez Google — appel lent, rejoué,
attendu avant tout affichage. **Ne jamais se fier à un cache rempli par une autre page sans vérifier
qu'il est complet.** Les affectations manquantes passent désormais par le miroir avant Google.

**Et la règle de méthode que cette soirée a imposée : quand je ne peux pas mesurer, je dois fournir
le moyen de mesurer, pas empiler les hypothèses.** Trois fausses pistes sur ce seul défaut — copie
rapide périmée, purge d'année, paquet de dépôt en échec — toutes plausibles, aucune vérifiable
depuis ma place. Le portail est instrumenté (`chrono()`) mais vers la console seule, inaccessible
depuis un iPhone. Un affichage de mesure lisible sur téléphone reste à faire.

**Ce qui n'est pas prouvé, et doit être dit.** Le banc éprouve la mécanique de l'ordre de passage
sur 21 MAR inventés. Que le rang RÉEL soit juste n'a été vérifié que sur le cas d'Arthur, à l'œil.
Un contrôle croisé sur deux ou trois collègues avant le 4 septembre reste à faire. Et la liste
nominative étant désormais visible par tous les MAR — choix assumé, c'est ce que le comité projette
déjà au staff — mieux vaut l'annoncer que la laisser découvrir.

## État au 12 août 2026 (soir) — v1.31.14, identité visuelle propre, banc à 723 vérifications

**Le drapeau monégasque a disparu.** Icône d'application, favicon et logo de bandeau : partout
remplacés par une marque du service — silhouettes en groupe au-dessus d'un tracé de monitorage,
blanc sur `#CE1126`. 5 fichiers dans `assets/` + `assets/logo.png` (144 px) pour les bandeaux.
Le drapeau était dessiné en CSS à 11 endroits sur 8 pages ; tous remplacés par `<img>`.

**Ce qu'il faut savoir avant de refaire une icône** : elle doit être **carrée avec le fond
jusqu'au dernier pixel** (les coins arrondis peints dans l'image donnent un liseré noir, iOS et
Android appliquant leur propre masque) ; la version *maskable* a besoin de **20 % de marge** ;
et le rouge d'un rendu généré n'est jamais `#CE1126`, il faut le recaler.

**Bandeaux mobiles refaits sur `dashboard.html` et `index.html`.** « CHPG » + « Anesthésie-Réa »,
logo 34 px, contenu centré, bloc titre en `min-width: 0` + troncature pour qu'il ne puisse plus
déborder sur les boutons. Sur `index.html`, le bandeau portait 7 éléments et occupait 320 pt
sur 390 : les sélecteurs année/mois sont sortis dans une **barre « période »** sous 768 px.
Ils y sont **déplacés dans le DOM, jamais dupliqués** — un seul `#yearSelect` existe à tout
instant, gestionnaires intacts, et le banc le prouve après 3 rotations d'écran.

**La pastille du bandeau affiche les initiales**, pas le nom (`AFR`), repli sur les 3 premières
lettres de l'identifiant, `ADMIN` pour le comité. **Aucun `.gs` modifié** : `initials` transitait
déjà dans la réponse de connexion — colonne 3 de MEDECINS, même source que `staff.html`.

**Tuile « Mes gardes »** : `PROCHAINE GARDE` / `Mardi 01/09 · Réa` / `Dans 20 jours · 45 autres à
venir`. Fonction dédiée `_mgDateCourte()` ; `staffDateParts()`, utilisée ailleurs, n'est pas
touchée.

**Trois leçons de méthode, chèrement apprises :**

1. **Le numéro de version est porté par 5 fichiers, pas 2.** `admin.html`, `dashboard.html` et
   les trois documents `docs/guide-comite.html`, `docs/guide-mar.html`, `docs/roadmap.html`.
   Une recherche limitée aux pages racine a laissé 3 guides en arrière pendant un push. C'est le
   banc, et non une relecture, qui l'a détecté.
2. **Deux conversations sur le même dépôt = collisions.** Trois en deux heures. La plus grave :
   des fichiers partis d'un clone vieux de 20 minutes qui auraient **effacé en silence** le
   travail de l'autre session — le push aurait réussi, sans erreur. Seul le contrôle
   « la branche a-t-elle bougé depuis mon clone ? » juste avant le PUT l'a évité.
3. **Vérifier avant de proposer.** Les initiales sur mobile existaient déjà dans `index.html`
   depuis longtemps ; elles étaient simplement invisibles, la pastille étant compressée à zéro
   par `flex-shrink: 1`. Proposer de les « ajouter » était une erreur de lecture.

**Un faux défaut à ne pas rechercher à nouveau** : le thème « automatique » semblait toujours
sombre — l'iPhone était réglé en mode sombre. Le sélecteur reste à 3 positions, inchangé.

**Les 8 écrans de connexion sont identiques** (logo 48 px, coins 12 px). Attention pour la suite :
les drapeaux de ces écrans étaient écrits **en style directement dans la balise, sans classe** —
une recherche par nom de classe ne les trouve pas. Décision : **pas de pastille « ADMIN »**,
l'écran admin annonce déjà « Espace Admin » et « CODE ADMIN ».

**Deux défauts d'`indispos.html` corrigés, tous deux vus en production :** le code s'affichait en
clair (`type="text"`, seule page du portail dans ce cas), et la page redemandait le code alors que
le MAR venait du dashboard. **Clés de session, relevé complet** : `chpgViewCode` sur `index`,
`dashboard`, `absences`, `crh`, `suivi-liberal` et désormais `indispos` ; `adminCode` sur `admin` ;
**rien** sur `staff`. `staff.html` ne doit **pas** lire la session MAR : vérifié dans son `doLogin`,
il n'accepte que `role === 'admin'`.

**Règle apprise le 12/08, à ne jamais oublier : une tentative automatique ne touche JAMAIS à
l'interface.** La reprise de session d'`indispos` appelait `doLogin()`, qui désactive le bouton et
affiche « Connexion… » : tant que le serveur ne répondait pas (jusqu'à 20 s au réveil d'Apps
Script), l'écran de saisie était **figé**, le MAR ne pouvait plus rien taper. `doLogin()` prend
désormais un argument `silencieux`. Vérifié au banc avec un serveur qui ne répond jamais.

**On pouvait poser une indispo hors de l'année de planning** (à partir du 03/01/2028 pour 2027) :
les cases étaient grisées mais `applyTool()` ne vérifiait pas les bornes, et le serveur ignore ces
dates **en silence** — le MAR croyait avoir déclaré. Corrigé par `bornesAnneePlanning(y)`, **une
seule définition partagée par l'affichage et la pose**. Année 2027 : du 04/01/2027 au 02/01/2028.

**Le vide sous les onglets d'`index.html`** : `#mobileView` (hauteur minimale d'un écran) restait
affiché sur tous les onglets alors qu'il ne sert qu'à Planning — ~790 pt de blanc sous les tableaux
Médecins, Équité, Secteurs et Année.

**La barre d'onglets du bas d'`index.html` débordait** : 410 pt requis pour 390 d'écran. La cause
de fond est l'absence de `min-width: 0` — **un élément `flex: 1` refuse de descendre sous la
largeur de son contenu**, aucun réglage de police ne compense cela. Corrigé à 355 pt.

**Reste ouvert** : `indispos`, `staff`, `absences`, `crh` et `suivi-liberal` n'ont pas reçu le
nouveau bandeau, donc trois styles coexistent. `staff.html` et `admin.html` utilisent tous deux un
code admin sans partager leur session : le comité ressaisit son code en passant de l'un à l'autre. Le nom de domaine propre est écarté avant le 4 septembre (le `.mc` est
réservé aux entités monégasques ; un `.fr` coûte ~10 €/an, mais changer l'adresse avec des codes
déjà distribués est un risque gratuit).

---

## État au 11 août 2026 — v1.31.1, les temps partiels entrent dans l'équité, banc à 612 vérifications

**Ce qui a changé.** Les MAR à temps partiel posent leurs jours de TP eux-mêmes, dans les
indispos, après le staff (jamais pendant) : 26 jours pour un 90 %, 52 pour un 80 %, 260 pour le
service. Ces jours arrivent donc avant la génération des gardes. Personne n'avait mesuré ce que
l'algorithme en faisait à cette échelle.

**Mesuré sur le vrai générateur, année complète : il tient.** Quatre façons de poser (dispersés,
même jour chaque semaine, semaines de 5, accolés aux vacances) : aucun jour non pourvu, aucun
« Manque MAR », équité totale inchangée (≤ 1,1 garde d'écart, comme sans TP). **Les MAR peuvent et
doivent poser leurs TP avec leurs indispos.**

**La seule faille.** Un 80 % qui pose ses 52 jours toujours le même jour de la semaine se retire
d'un axe entier : cible 5 jeudis, réalisé 0, les 5 gardes retombent sur les autres. Cause : un jour
fixe déclaré dans `MEDECINS` (`tp_jours_fixes`) réduit la cible de cet axe-jour ; un TP posé dans
les indispos ne la réduit pas — `structAvail` ne regarde que date d'arrivée, date de départ et `CL`.

**Deux garde-fous en production (v1.31)** : l'outil Temps partiel n'accepte que les jours ouvrés
(ni week-end ni férié) ; le récap d'ouverture du W2 mesure le report par axe et désactive Générer
au-delà d'une garde. Le seuil est calé sur la mesure : ce qui coûte aux autres n'est pas la part
bloquée mais la place restante — 26 jeudis bloqués sur 51 ne déplacent rien, 51 sur 51 reportent
5 gardes.

**Ce qui compte comme « place prise » (corrigé le jour même en v1.31.1).** Pour savoir s'il reste
de la place sur un axe, on compte toutes les cases occupées — `TP`, `CTP`, `VAC`, `FORM`,
`INDISPO`, `I`, `CL` — et pas seulement les TP. Un jeudi de vacances empêche autant de prendre la
garde qu'un jeudi de TP. La première version ne comptait que les TP et laissait passer le cas
type : un 80 % dont les vacances occupent déjà ~7 jeudis semblait garder 7 jeudis de marge.
`SOUHAIT` est exclu du décompte : c'est une demande de garde.

**Sens des codes de saisie, à ne plus confondre :**
- **INDISPO** — je peux travailler ce jour-là s'il est ouvré, mais pas prendre de garde.
- **TP** — je ne souhaite ni travailler ni être de garde ; réquisitionnable en cas de grosse
  difficulté. Se pose uniquement sur un jour ouvré.
- **VAC / FORM** — propriété du comité, posés au staff, intouchables par le MAR.
  La fusion (`_fusionIndispos_`) sépare strictement les deux propriétaires : le comité ne possède
  que VAC et FORM ; TP, INDISPO et SOUHAIT appartiennent au MAR et survivent à un enregistrement
  groupé du staff.

**Enseignement.** Le banc semait déjà des TP — un tiers du volume réel, dispersés, jamais
concentrés. *Un scénario qui contient le bon code de statut ne prouve rien sur le volume ni sur la
forme de la pose.* Le défaut n'est sorti ni du code ni du banc, mais d'une question sur le sens
métier d'une case vide.

**RÈGLE FONDAMENTALE, actée le 11/08 : la part de gardes est due, quoi qu'il arrive.**
Aucune façon de poser ses vacances, ses indispos ou ses jours de TP ne doit réduire la part de
gardes de son auteur — sinon l'équité, qui est le principe premier du système, n'existe plus.
Le générateur ne compense donc JAMAIS un jour bloqué en demandant moins : il refuse de générer
quand quelqu'un n'a plus la place de tenir sa part. Corollaire pour toute évolution future : une
proposition qui « allège la cible » de quelqu'un est à refuser d'emblée, quel qu'en soit le motif.

**Entorse identifiée dans le code actuel, à supprimer.** Un jour fixe déclaré dans `MEDECINS`
(`tp_jours_fixes`) met à zéro la cible de cet axe-jour (`generateur_gardes.gs`, `_tpA`) : un MAR
avec « jeudi » déclaré ne doit aucun jeudi, ses jeudis partent chez les autres. Sans effet
aujourd'hui (la seule personne concernée ne prend pas de gardes), mais illégitime.
**Règle actée : un jour fixe de temps partiel ne peut pas tomber sur un jour surveillé** — samedi,
jeudi, vendredi, férié — pour un MAR qui prend des gardes. Seuls lundi, mardi et mercredi sont
admissibles.

**Reste ouvert** : retirer la réduction d'axe du générateur et contrôler la saisie du jour fixe
(après le 4 septembre) ; intégrer ou non le harnais de charge au banc (~15 s) ; écrire la règle du
jour ouvré dans les guides.


## État au 9 août 2026 — session d'audit : sauvegardes, comptes, connecteurs

**Aucune ligne de code de production modifiée.** Session de vérification et de rangement.

### Le projet Apps Script est RATTACHÉ au classeur maître
Confirmé : on l'ouvre par *Extensions → Apps Script* depuis le classeur. Conséquences :
- `SpreadsheetApp.getActiveSpreadsheet()` fonctionne, et les fichiers créés par les
  déclencheurs appartiennent au compte **planningchpg**, pas au compte personnel.
- **Chaque sauvegarde hebdomadaire du classeur emporte le code avec elle.** Les projets
  « Planning-CHPG » multiples visibles dans l'éditeur ne sont pas des doublons : ce sont
  les instantanés des lundis. Ne pas les supprimer.
- Un projet homonyme traîne en plus dans le compte **personnel** (créé le 23/05, antérieur
  au classeur) : vestige, à ne pas confondre avec le vrai.

### Les 11 fichiers de l'éditeur viennent de 3 endroits du dépôt
`gas/` (8 + le manifeste), **plus** `sauvegarde.gs` à la racine et `dispo_jour.gs`
(= `partage/dispo_jour.js`, extension différente). Et l'éditeur affiche **`Code.gs`**
avec une majuscule là où le dépôt a `code.gs`.
Carte détaillée dans `gas/README.md`. **Tout envoi automatisé réglé sur `gas/` seul
effacerait deux fichiers et créerait un doublon.**

### Trois sauvegardes, toutes vérifiées actives
Voir l'encadré de `docs/roadmap.html` et `docs/sauvegarde-compte-perso.md`.
La seule qui survivrait à la perte du compte planning est celle du **dimanche 5 h**,
qui vit dans le compte personnel.

### Les connecteurs : ce qu'ils donnent, ce qu'ils ne donnent pas
- **Google Drive** doit être branché sur **planningchpg@gmail.com**. Branché sur le compte
  personnel, on ne voit ni `Planning-CHPG-Backups` ni `Planning-CHPG-JSON` — et on conclut
  à tort que des sauvegardes ne tournent pas. **Erreur commise ce jour.** Vérifier le compte
  avant toute conclusion : le classeur maître apparaît « partagé avec moi » si l'on est du
  mauvais côté.
- **Cloudflare Developer Platform** : Workers en **lecture seule** (liste, détails, code
  source), namespaces KV listables mais **valeurs illisibles**, **aucun log**, **aucun
  déploiement**. Utile pour comparer le Worker en ligne au dépôt — fait ce jour, identiques.
  Écriture possible sur KV/D1/R2 : ne jamais s'en servir sans accord.
- **Pas de connecteur GitHub ni Apps Script** dans l'annuaire.

### Déploiement sans ordinateur — préparé, non installé
`clasp` écarté (exige un ordinateur). Retenu : un projet Apps Script **séparé** qui lit le
dépôt et pilote l'API Apps Script — aucun jeton Google ne sort de chez Google. Écrit,
syntaxe validée, **rien d'installé**. L'API Apps Script est activée sur le compte ;
identifiants de script et de déploiement en possession d'Arthur (hors dépôt : public).
Reprendre par un essai sur une **copie** du projet.

### Erreur de méthode à ne pas répéter
Un document de sauvegarde a été poussé alors que `docs/sauvegarde-compte-perso.md`
existait déjà et couvrait mieux le sujet. **Lister `docs/` avant de créer un document.**
Le doublon a été retiré dans la foulée.

---

## État au 8 août 2026 — v1.30.2, veille refondue et validée, banc à 524 vérifications

**Site v1.30.2.** GAS veille : `veille.gs 2026-08-08.4` (module extrait de `portail.gs`
le matin, commit `49e6465`, puis corrigé trois fois dans la journée) ;
`portail.gs 2026-08-08.1`, `Indispos.gs 2026-08-08.1`.

### La journée du 8 août — la veille, de la première collecte réelle à la validation

- **Liste blanche par axe** (`2026-08-08.2`) : la première collecte réelle a rendu
  114 art./semaine pour une cible de 50-80. Cause mesurée : la suppression de la
  liste blanche de types, justifiée pour les 23 revues d'anesthésie-réa, avait aussi
  été appliquée aux 18 généralistes (axe croisé : 1 040/180 j au lieu de ~31/90 j).
  Rétablie sur l'axe GENERAL **seul**, pilotée par les lignes `PUBTYPE` de
  `VEILLE_CFG`. Résultat mesuré : axe croisé 157, **79,5 art./semaine**. Le journal
  d'exécution annonce désormais le total /semaine et le détail par axe.
- **Dates de mise en ligne** (`2026-08-08.3`) : 925 articles sur 2 044 n'avaient que
  le mois de parution → tous datés au « 01 », et le tri stable les laissait en blocs
  par revue (PMID contigus d'un même numéro). Mesuré sur échantillon : `epubdate`
  est au jour près pour 27/30. Elle prime désormais quand elle porte un jour.
- **Contrat SOURCE** (`2026-08-08.4`) : la refonte écrivait `Revue`/`Généraliste` là
  où le filtre de `dashboard.html` attend `REVUE`/`GENERAL` → filtre vide, tout
  badgé « Revue spécialisée ». Codes rétablis à l'écriture, valeurs héritées
  **normalisées à la lecture** (les 2 044 lignes n'ont pas été réécrites).
  → **Leçon (répétée) : lire le consommateur.** Un test de **contrat** au banc lit
  désormais le vrai `dashboard.html` et exige que `getVeille()` ne serve que les
  codes que l'écran sait filtrer.
- **v1.29 — filtre par revues cochées** : bouton « Revues » dans la veille du
  dashboard, panneau à cases avec compte par revue, mémorisé **par appareil**
  (`localStorage`, comme le repère « nouveau »). Guide MAR mis à jour.
- **Diapo 29 de la présentation staff** réalignée : 41 revues, 21 thèmes, deux
  régimes de filtrage, démo « cocher ses revues ».
- **Banc 446 → 482** : nouveau `banc_veille.js` (20ᵉ script) — collecte face à un
  PubMed simulé qui rendrait 1 040 articles sans bride, contrat SOURCE↔dashboard,
  dates, et l'interface **pilotée au clic** dans la vraie page. Stubs complétés
  (`setFrozenRows`, `clearContent`).

### Chantier Lu/★ par MAR — livré et validé le 08/08 au soir (v1.30)

Marquer « lu » ne retire plus l'article que de SA liste ; les marques suivent le
MAR d'un appareil à l'autre. Onglet **`VEILLE_MARQUES`** creux (MAR_ID, PMID, LU,
STAR, MAJ_LE — une ligne par couple touché, zéro de base) ; `markVeille` exige
l'identité **du routeur** (jamais du payload) et est idempotent ; clé miroir
`veille_marques` au format `{parMar:{ID:…}}`, filtrée par le Worker **pour tous
les rôles, admin compris** ; `getVeille(user)` fusionne côté serveur pour le
repli GAS — les deux chemins rendent le même écran ; **file locale des marques**
au dashboard (une entrée par article×champ, le dernier geste gagne, sortie sur
confirmation seulement, « article introuvable » = marque abandonnée proprement).
Ordre de déploiement qui compte : **Worker d'abord**, puis les .gs, puis
`miroirSyncComplet()`. Tests solo + croisé à deux vrais codes : passés.
`veille_dryrun.gs` supprimé (dépôt + Apps Script). Aucun entretien automatique
des onglets VEILLE/VEILLE_MARQUES : purge **manuelle** à concevoir ~novembre
(ROADMAP). Banc **482 → 510**.

### Doctrine des écritures (08/08/2026, gravée après audit)

**Toute écriture de données utilisateur est soit journalisée, soit attendue avec
erreur affichée, soit rejouable depuis une file locale. Jamais à fond perdu avec
échec avalé.** Inventaire du 08/08, à l'origine de la règle :
- **Journalisées** (fiches persistantes, filet horaire) : placements, statuts,
  publication — aucune disparition possible, prouvé au banc.
- **Attendues, erreur affichée** : `saveIndispos` (toast ✅/❌), outils admin hors
  journal (timeout 90 s, échec à l'écran, rejeu limité à `getAdminBootstrap` seul
  — mesure du 28/07 : rejouer sur file saturée AGGRAVE).
- **À fond perdu assumé** (perte sans conséquence, documentée) : journal de
  connexion (`sendBeacon`), appel de réveil.
- **La violation identifiée** : `markVeille` — écriture de données utilisateur,
  `.catch` vide, écran optimiste → marque fantôme possible (timeout GAS ou page
  suspendue par iOS). À corriger par **file locale** dans le chantier Lu/★ par MAR.
- Case restante à classer : l'appelant client de `declareLiberal`/`deleteLiberal`
  (absent des pages de la racine).

### Leçons du 8 août

- **Un correctif de filtre se mesure sur TOUS les axes** : annoncer un sous-total a
  masqué l'explosion de l'axe croisé un jour de plus.
- **`epubdate` avant `sortpubdate`** : `sortpubdate` invente un « 01 » pour les
  numéros datés au mois ; l'écran en fait des blocs par revue.
- **La clé miroir `veille` n'est rafraîchie QUE par la synchro horaire**
  (`miroirSyncComplet`) : après toute modification de `getVeille()` ou re-collecte,
  la lancer à la main, sinon le dashboard sert l'instantané périmé.
- **`VEILLE_ITEMS` et l'état du filtre sont des `let` de page** : au banc, on les
  atteint par le chemin public (`miroirTuile` remplacée puis `openVeille()`),
  jamais par `w.VEILLE_ITEMS = …` qui crée une propriété fantôme.
- **Un seuil de date en dur est un correctif qui vieillit mal.** Le dashboard
  allait chercher l'année suivante « dès octobre » pour la transition
  décembre → janvier. Deux défauts en un : du 1er octobre à la génération de
  novembre, le planning N+1 n'existe pas — chaque ouverture partait donc chercher
  Apps Script pour rien, **et la tuile attendait la réponse** ; et les 1er-3
  janvier, l'année de planning est encore la précédente alors que le mois vaut 0,
  donc le seuil était faux. **Corrigé sans date** : l'année suivante voyage dans
  l'appel d'ouverture déjà existant (`miroirBootDash`, une clé de plus, zéro
  aller-retour supplémentaire) et se lit sans réseau (`_planDejaLa`).
  → **Quand un correctif s'écrit avec une date, chercher d'abord la condition
  qui la rend inutile.**
- **Le contrôle négatif peut passer pour la mauvaise raison.** Le scénario
  « aucun appel Apps Script » est vert sur l'ANCIEN code aussi — on est en août,
  le seuil d'octobre ne se déclenche pas. C'est le contrôle « le seuil n'existe
  plus dans le code » qui épingle réellement le défaut. Un test dont la
  condition de déclenchement dépend de la date du jour ne prouve rien le reste
  de l'année.

---

## État au 6 août 2026 — v1.28, guides refondus, banc à 436 vérifications

**Site v1.28.** GAS : `code.gs 2026-08-05.3`, `Indispos.gs 2026-08-05.13`,
`miroir.gs 2026-08-05.10`, `journal.gs 2026-08-05.3`, `portail.gs 2026-08-05.2`.
Worker `2026-08-05.7`.

### Ce que la journée du 5-6 août a livré, dans l'ordre

- **Journal d'intentions** : les gestes du comité (placements, statuts,
  publication) ne passent plus par Apps Script. Mesuré chez Arthur :
  **171-189 ms** au lieu de 4 à 37 s. Chaque dépôt garde son repli GAS.
- **Accroche miroir différée**, puis **envoi par paquets de 20 clés** : la
  synchro complète construit 23 clés (28 avec 2028, 38 avec cinq années) pour
  un plafond de 20 — elle échouait EN BLOC, filet horaire hors service.
- **Le dernier geste gagne** : poser V/F/TP/CL/A retire les placements du
  jour. TP et R restent plaçables (réquisition en dernier recours).
- **Atomicité des modifications de gardes** : un refus ne laisse plus rien de
  modifié. Vérifié en production sur ARMANDO/MENADE, classeur relu.
- **Zéro appel Apps Script à l'ouverture** des trois pages : témoin
  échantillonné puis retiré, volet libéral par le miroir, compteur de courrier
  par le miroir, journal de connexion en envoi à fond perdu.
- **Volet libéral mirroré** après allègement de `listLiberalJour` : les
  montants (br CCAM/NGAP) ne quittent plus le classeur.
- **Alerte du jeton GitHub** : information > 30 j, orange 30-11 j, ROUGE ≤ 10 j.
- **Rafraîchissement par glissement** (index, dashboard) : iOS ne le fournit
  pas en mode application (`apple-mobile-web-app-capable`), le geste bougeait
  l'écran sans rien recharger — et le guide MAR l'annonçait pourtant.
- **Guides refondus** : bloc « En 2 minutes », sections « je veux faire quoi »,
  encadrés dépliables, blocs « Le geste », animations CSS reproduisant
  l'interface réelle, section messagerie (planningchpg@gmail.com).
- **Cahier de tests** : 179 points (5 corrigés, 15 ajoutés en P15), dont plus
  de 40 marqués « déjà vérifié automatiquement ».

### Le banc d'essai — 436 vérifications, 19 scripts *(remesuré le 06/08 : somme des « N OK » de `lancer.sh`)*

`cd banc && ./lancer.sh`. Il exécute le vrai code (les `.gs`, le Worker,
`admin.html`, les pages MAR) dans un Google et un Cloudflare simulés, et va
jusqu'à **cliquer dans l'interface** : saisie du code, clic sur une case à
pourvoir, choix d'un MAR, publication, fermeture de page, vérification du
classeur puis du planning régénéré.

Couvre aussi : accès et rôles (P1), scénarios catastrophe (P12), équipe et
absences longues (P5), garde-fous annuels (P11), indisponibilités (P6),
calendrier et fériés monégasques (P2/P3), plafond de clés du miroir,
mécanismes mobiles, contraintes Apps Script, rafraîchissement par glissement.

⚠️ **06/08 — le banc était rouge sur `main`** : `Indispos.gs 2026-08-05.13` appelle
`getRange(...).getValue()` (l.≈1675, `readCell`) mais le stub ne l'implémentait pas —
`banc_gestes.js` plantait. Corrigé : `getValue()` ajouté à `banc/stubs.js` (1 ligne).
Rappel : toute nouvelle API Apps Script utilisée dans un `.gs` doit exister dans le stub.

**Défauts trouvés par le banc AVANT la production** : verrous imbriqués (15 s
perdues par écriture), échange refusé laissant le classeur à moitié modifié,
plafond de 20 clés, et deux faux positifs de test qui masquaient un repli
silencieux vers Apps Script.

## Ce qu'ont appris les 5 et 6 août 2026

1. **Lire le CONSOMMATEUR, pas seulement le producteur.** Le volet libéral a
   été déclaré « non mirrorable » sur la seule lecture de la réponse serveur
   (qui portait des montants), sans lire l'affichage — qui n'utilise que MAR,
   secteur et chirurgie. Décision d'architecture fausse, prise sur une lecture
   partielle.
2. **Une accroche synchrone est un péage sur chaque geste.** Tout travail
   ajouté « juste avant la réponse » se paie en attente utilisateur.
3. **Verrous imbriqués = 15 s perdues par écriture.** Deux espaces de verrous
   distincts (document pour l'applicateur, script pour les écritures).
4. **Un test qui passe peut mentir.** Deux faux positifs attrapés : mauvais nom
   de paramètre, code d'accès non injecté.
5. **Repartir de la version EN LIGNE, jamais d'une copie locale.** Un
   `dashboard.html` reconstruit depuis une copie périmée a affiché v1.24 après
   un push v1.28. Attrapé par le contrôle post-push.
6. **Un lot = un commit.** Sept fichiers poussés séparément = sept
   publications, six annulées, mise en ligne retardée.
7. **iOS en mode application ne fournit aucun rafraîchissement par
   glissement.** Documenter un geste sans l'avoir éprouvé sur l'appareil cible
   revient à écrire une supposition.
8. **`PLANNING_OVERRIDES` n'a pas d'horodatage** : impossible de dater une
   ligne après coup. Le registre d'audit du journal ferme cette impasse.

## DÉCISIONS MÉTIER — ce qui n'est écrit dans aucun code

Ces règles ne se déduisent PAS de la lecture du dépôt. Les ignorer conduit à
« corriger » un comportement voulu, ou à proposer une automatisation déjà
écartée. À compléter au fil des sessions.

| Décision | Détail |
|---|---|
| **Emails vides = volontaire** | 24 MAR sur 25 n'ont pas d'adresse dans MEDECINS. C'est un choix, pas un oubli : les notifications ne doivent pas partir avant la mise en service. Des propriétés Apps Script seront basculées **le jour J**. Ne jamais traiter ce point comme un défaut à réparer. |
| **TP et récup restent plaçables** | Un MAR en temps partiel est **réquisitionnable en dernier recours** : le panneau le propose (en dernier), et un placement postérieur à la pose du TP tient. Poser une absence retire en revanche les placements déjà posés ce jour-là (« le dernier geste gagne »). |
| **Publier reste volontaire** | Aucune publication automatique. Un brouillon non publié est invisible des MAR, et c'est voulu : le comité décide du moment où son travail devient public. |
| **Le secrétariat ne lit rien au miroir** | Rôle exclu de toute lecture Cloudflare (liste rouge des absences). Ne jamais « optimiser » ce chemin. |
| **Pas de mémoire de session admin** | Le code est redemandé à CHAQUE ouverture de l'interface d'administration : elle modifie le planning de toute l'équipe et peut être ouverte sur un poste partagé. Décision confirmée le 04/08/2026. |
| **L'archivage n'est jamais automatisé** | Opération manuelle, le premier lundi de la nouvelle année de planning. Archiver trop tôt est la seule erreur vraiment coûteuse. Ne pas reproposer. |
| **Aucun montant hors du classeur** | Les données financières (br CCAM/NGAP, relevés) ne quittent ni le classeur ni la page du MAR concerné. Le volet libéral du comité n'affiche QUE qui opère, dans quel secteur, quelle chirurgie. |
| **La garde exceptionnelle n'existe pas** | Il y a toujours 2 MAR de garde, jamais 3. La fonction `gardeExceptionnelle` subsiste côté serveur mais **aucun bouton ne l'appelle** : code mort, retiré des guides. |
| **Le planning affiche le motif d'absence** | Le code (V, F, TP, CL, R) est visible de toute l'équipe : le planning est public par nature. Seules les **indisponibilités saisies à l'automne** restent privées (MAR + comité). |
| **Les guides doivent tout couvrir** | `docs/guide-comite.html` et `docs/guide-mar.html` doivent expliquer **l'intégralité** du fonctionnement, en langage simple, à plusieurs niveaux de lecture. Toute modification fonctionnelle se pousse avec sa documentation. |

## État au 5 août 2026 — LE JOURNAL D'INTENTIONS ET LE BANC D'ESSAI

**Site v1.24.** GAS : `code.gs 2026-08-05.3`, `Indispos.gs 2026-08-05.11`,
`miroir.gs 2026-08-05.8`, `journal.gs 2026-08-05.3` (NOUVEAU fichier),
Worker `2026-08-05.6`.

### Le journal d'intentions — les écritures ne passent plus par Google

Le comité ne parle plus à Apps Script pour écrire. Chaque geste (placement,
statut, publication) dépose une **fiche** chez Cloudflare (~150 ms, accusée,
durable) ; un déclencheur GAS tire la file **chaque minute** et applique dans
l'ordre des horodatages du Worker, par les fonctions de production existantes.
Purge → registre d'audit `jfait_*` conservé 90 jours (qui, quoi, quand,
appliqué quand, résultat).

Conséquence pour le comité : **cliquer à son rythme, publier, fermer la page** —
tout aboutit, avec ou sans lui. Chaque dépôt garde son **repli GAS intégral** :
une panne de Cloudflare ne bloque aucun geste.

### Pourquoi les écritures étaient lentes — la faute était dans le lot B

L'accroche miroir tournait **dans la requête, avant la réponse**, et
reconstruisait gardes + stats + planning pour **toutes les années** à chaque
écriture (mesure : `savePlanningOverridesBatch` à 6,9 s serveur). Deux
corrections : audit des familles (chaque action ne pousse que ce qu'elle
modifie réellement), puis **accroche différée** — la requête note ce qu'il
faudra pousser (fusion sous verrou, un déclencheur unique) et répond tout de
suite. La construction du miroir est sortie de la file du comité.

### Le dernier geste gagne (statuts vs placements)

Constat de terrain : un MAR placé en secteur puis passé en TP restait affiché
en secteur — il fallait supprimer la ligne à la main dans le classeur.
Désormais **poser un statut d'absence (V, F, TP, CL, A) retire les placements
de ces jours-là** pour ce MAR, ciblage par (date, MAR), jamais par numéro de
ligne. Décision du service : **TP et R restent plaçables** — un MAR en temps
partiel est réquisitionnable en dernier recours ; il suffit de le placer
APRÈS avoir posé le TP. À la publication, seules les vraies absences rendent
un placement caduc, avec les **mêmes critères que le panneau**
(`CADUC_ABSENT_CODES` ↔ `DISPO_ABSENT_CODES` de `partage/dispo_jour.js` :
toute modification de l'un impose l'autre).

### Les modifications manuelles du classeur sont enfin vues

Une correction faite directement dans le Google Sheet n'était vue par
personne : aucune requête ne partait, donc aucune note miroir, et la copie de
lecture n'était réalignée qu'à la **synchro horaire**. `miroirSurEdition`
écoute désormais les onglets qui comptent (GARDES, INDISPOS, MEDECINS,
SECTEURS, PLANNING_OVERRIDES, PERIODES_VAC, GROUPES_VAC) et pose la même note
que les écritures du portail. **Le bouton Publier reste volontaire** : c'est
lui, et lui seul, qui fabrique ce que voient les MAR.

### Le banc d'essai — RÈGLE DE TRAVAIL

`banc/` exécute le **vrai code** (les `.gs`, `cloudflare/worker.js`,
`admin.html`, les pages MAR) dans un Google et un Cloudflare simulés.
**181 vérifications**, onze scripts, une commande : `cd banc && ./lancer.sh`.

**Avant toute proposition de push** touchant `admin.html`, un `.gs`,
`cloudflare/worker.js` ou `partage/dispo_jour.js` : lancer le banc, ne
présenter le patch qu'une fois tout au vert, et annoncer le résultat chiffré.
**Toute fonctionnalité nouvelle ou tout défaut corrigé se pousse avec son
test** — un défaut trouvé en production devient un scénario du banc.

Ce que le banc prouve : ordre des opérations, idempotence, isolation des
échecs, ciblage des lignes, verrous, absence d'appel Apps Script sur les
gestes du comité, parcours complet placer → publier → fermer → classeur →
planning régénéré, droits des MAR, confidentialité des indispos, et les
*mécanismes* des pannes mobiles (onglet gelé, fermeture, cache servant une
ancienne page) et Apps Script (budget d'exécution, refus de déclencheur,
saturation).

Ce qu'il ne prouve pas, et qu'il ne faut jamais présenter comme prouvé : le
moteur réel de Safari, les quotas et autorisations Google, la latence réelle,
l'exécution effective des déclencheurs installables. **« Le banc est vert »
n'a jamais voulu dire « ça marche ».**

## Ce qu'a appris la journée du 5 août 2026

1. **Une accroche synchrone est un péage sur chaque geste.** Tout travail
   ajouté « juste avant la réponse » se paie en attente utilisateur, et se
   multiplie silencieusement par le nombre d'années balayées.
2. **Des familles trop larges coûtent cher.** Le lot B poussait `planning` sur
   un simple placement, qui n'y touche pas. L'audit action par action a divisé
   le travail serveur.
3. **Verrous imbriqués = 15 s perdues par écriture.** L'applicateur prenait le
   verrou de script que réclament ensuite les fonctions d'écriture. Deux
   espaces de verrous distincts (document / script) règlent le problème.
   *Défaut trouvé par le banc, pas en production.*
4. **Un test qui passe peut mentir.** Deux faux positifs attrapés : un mauvais
   nom de paramètre (`cles` au lieu de `keys`) et un code d'accès non injecté
   — la page retombait silencieusement sur Apps Script. Vérifier ce qu'un test
   prouve *vraiment*, pas seulement qu'il est vert.
5. **`PLANNING_OVERRIDES` n'a pas d'horodatage.** Impossible de dater une
   ligne : on ne peut donc pas prouver après coup qu'une écriture a eu lieu ce
   matin-là. Le registre d'audit du journal ferme cette impasse.
6. **Le cache mobile fait croire que les correctifs ne prennent pas.** Avant
   de rechercher un bug de code, vérifier le numéro de version affiché sur
   l'appareil.

## État au 4 août 2026 — LE MIROIR CLOUDFLARE EST EN PRODUCTION

**Site v1.19** · nouveau fichier **`gas/miroir.gs` 2026-08-04.4** · `Indispos.gs` **2026-08-03.4**
(accroche miroir dans `doGet`) · nouveau **`cloudflare/worker.js`** (Worker `chpg-miroir`,
version `miroir 2026-08-04.4`, déployé chez Cloudflare, stockage KV `CHPG_MIROIR`).

**Pourquoi.** Mesures du 03/08 : tout appel Apps Script coûte 2,5–5 s quel que soit le
travail serveur (compilation ~575 Ko À CHAQUE requête + redirection 302 + file d'attente
par compte + pages d'erreur HTML aléatoires). Aucune optimisation de code ne pouvait rendre
l'ouverture des pages ni rapide ni PRÉVISIBLE — exigence non négociable pour la démo du 04/09.

**Architecture.** Apps Script reste le SEUL écrivain. Après chaque écriture réussie, il dépose
les JSON à jour au Worker (`miroirApresRequete_` appelé par `doGet`, table
`MIROIR_APRES_ECRITURE` dans `miroir.gs`) ; un déclencheur HORAIRE (`miroirSyncComplet`)
resynchronise tout en filet — c'est la SEULE fraîcheur pour ce qui ne passe par aucune action
du portail (modification manuelle du classeur, dossiers Drive des topos/protocoles).
Les pages lisent le miroir d'abord (~150 ms, authentification comprise) ; **tout écart —
panne, clé absente, code refusé — rend la main au circuit GAS, seul juge d'un code**.

**Clés servies** : `acces` (EMPREINTES SHA-256 des codes + identité + indisposYear/Ouverte —
jamais un code en clair, jamais le code secrétariat), `annees`, `secteurs`, `config_admin`
(admin seul), `planning_{Y}` / `affectations_{Y}` (toutes les années consultables — PAS
« active + N+1 », voir leçons), `indispos_{Y}` (filtrées par MAR côté Worker),
`topos` / `staffs` / `veille` / `protocoles` / `annuaire` (enveloppes `{success:true,…}`
telles quelles, fraîcheur horaire assumée), et **lot B (admin seul)** : `gardes_{Y}`,
`joursferies_{Y}`, `stats_{Y}`, `vacances_admin` — rafraîchies aux écritures planning
(+ `savePeriodes`/`saveGroupes` pour les vacances). Les builders `gardes`/`stats`/
`vacances_admin` sont des COPIES CONFORMES annotées des blocs inline de `_routeRequete_`
(purs dumps d'onglets — si un bloc change dans Indispos.gs, répercuter dans miroir.gs).
`getStatsLive` (calcul vivant) n'est JAMAIS mirroré ; `getVacValidation` non plus.

**Sécurité** : jeton d'écriture `MIROIR_PUSH_TOKEN` (propriétés du script + secret Worker,
JAMAIS dans le dépôt) ; secrétariat = AUCUNE lecture miroir ; **liste rouge inchangée** —
relevé libéral, marges, CONFIG/PARAMETRES, Gmail, journaux ne transitent JAMAIS par le miroir.

**Pages branchées : LES CINQ** — `index.html` (v1.18), `dashboard.html` + ses 5 tuiles
(v1.18.1/.3), `indispos.html` (v1.18.3), `admin.html` (v1.18.4 → v1.19 : ouverture,
changement d'année, sélecteur, Équipe depuis le bootstrap, chauffage d'arrière-plan —
panneau semaine courante **±1** et liste des mails —, onglets Statuts et Équité via les clés
lot B), `staff.html` (v1.19 : médecins + indispos par le miroir, `vacances_admin`, rejeu).
**Garde de fraîcheur des éditeurs** : Statuts/Équité évitent le miroir pendant 90 s après
toute écriture planning (`_tsEcriturePlanning` dans `api()`) — le circuit direct tranche.
**Périmètre démo 04/09 confirmé par Arthur : dashboard + index + indispos** (admin en
second plan) — les trois sont au miroir depuis le 04/08.

**Règles posées le 04/08 (ne pas défaire)** :
- Après une ÉCRITURE, la page relit le circuit DIRECT GAS, jamais le miroir (propagation
  KV ≈ 60 s max). Vaut pour admin et pour la saisie de WS le 04/09.
- Rejeu sur échec de transport (page d'erreur HTML Google → un renvoi silencieux) posé sur
  les 4 pages ; il protège surtout les ÉCRITURES, qui ne passeront jamais par le miroir.
- `getVacConfig` est PAR MAR (quota, temps partiel) → hors miroir, appelé SANS bloquer.
- Pas de recalcul CLIENT du panneau semaine (logique de tri du comité : divergence interdite) ;
  pas de cache page pour Statuts/Équité (un ÉDITEUR ne montre jamais du périmé) → lot B.

## Ce qu'a appris la journée du 4 août 2026

1. **Le miroir met l'aléa GAS à nu.** Tout ce qui reste sur GAS (tuiles avant migration,
   mails, onglets) paraissait « cassé » par contraste — c'était la loterie de toujours,
   rendue visible. Réponse : rejeu de transport partout + chauffage d'arrière-plan.
2. **« Active + N+1 » était une règle fausse.** Année active 2027 → `planning_2026` jamais
   déposé, repli GAS à chaque bascule. Corrigé : TOUTES les années consultables, même
   balayage que le sélecteur. Une règle de périmètre se calque sur ce que l'interface
   PROPOSE, pas sur un raccourci.
3. **Une modification MANUELLE du classeur est invisible du miroir** jusqu'à la synchro
   horaire (ou un `miroirSyncComplet` à la main). L'accroche n'écoute que les actions du
   portail.
4. **`getPlanningJson` sert le fichier Drive BRUT, sans fusion d'overrides** — vérifié le
   04/08 au soir en lisant l'action. Le miroir, qui pousse ce même fichier, est donc fidèle
   bit pour bit au circuit GAS. Toute évolution qui ferait fusionner des overrides côté
   serveur devra être répercutée dans `miroir.gs` LE MÊME JOUR.
5. **`getStats` est un dump d'onglet, pas un calcul** — l'Équité (source feuille) est entrée
   au miroir sans mesure préalable. `getStatsLive` reste le calcul vivant, hors miroir.
6. **Mes notes de session peuvent être périmées** : « la version vit dans 5 fichiers /
   9 emplacements » était faux (règle en vigueur : 4 fichiers, celle du Diagnostic).
   Compter dans le dépôt, jamais se fier à une liste écrite — la règle existait déjà,
   elle a encore servi.

## État au 3 août 2026

**Site v1.17** · GAS : `code.gs` **2026-08-01.2** · `Indispos.gs` **2026-08-03.3** ·
`portail.gs` **2026-08-02.1** · `generateur_gardes.gs` **2026-07-31.3** · `setup_annee.gs` **2026-08-03.1**

**⚠️ 03/08 — un jour de 2027 s'est retrouvé sans garde de réanimation (vendredi 26/03).**
Pas le générateur : la génération réelle rejouée hors ligne avec les vraies entrées donne
0 trou. Un **don de garde** sur la veille a écrit le repos du lendemain **par-dessus** la garde
que le bénéficiaire détenait déjà ce jour-là. Trois fonctions avaient le même défaut
(`donGarde`, `gardeExceptionnelle`, `echangeGarde`) et **aucune n'était journalisée**.
Corrigé : refus explicite, vérification des cases avant écriture, journal des succès et des
refus. Réparé en production, invariants 2027 à zéro (0 trou, 0 repos orphelin, 0 garde
consécutive).

**Le Diagnostic détectait ce trou depuis le 01/08 et personne ne le lançait.** Il est désormais
extrait dans `diagnosticComplet()` et envoyé automatiquement chaque **lundi 2 h** à l'adresse
lue dans `CONFIG / DIAG_EMAIL`.

**Années clôturées consultables** en lecture seule sur `admin.html` et `index.html`
(planning, statuts, affectations, équité initiale/instantané), y compris après déplacement des
onglets vers le classeur d'archives.

**En production :** algorithme de gardes (équité annuelle), planning quotidien (`admin.html`),
portail/Dashboard, module libéral (lots 0, 1, 2A, 2B, 3), contrôle d'absence (`absences.html`,
lot 5-bis), veille bibliographique, CR d'anesthésie, export Excel hebdomadaire.

**Prochaine échéance : présentation au staff le 4 septembre 2026**, démo en production.

**⚠️ Banc d'essai — refonte du 31/07/2026.** Le modèle simulait une équipe qui n'existe pas :
six temps partiels à **cible pleine** ignorés, jours de TP **figés sur un jour fixe** (un axe
entier inatteignable), 12 % posés en week-end, FERRIERO retiré de 20 années. Corrigé et aligné sur
`MEDECINS`. **L'algorithme était sous-évalué** (médian par axe 3,80 → 1,70 à échantillon identique).
Référence définitive sur 400 années : **292 312 gardes, 0 journée sans binôme, écart médian sur le
total 1,10, pire 2,90, jamais plus de 3**. Le générateur porte désormais la passe « jour gagné
avant les vacances » (~16 jours de congé/an, équité strictement inchangée).
⚠️ **MENADE doit être coché `no_garde = O`** dans `MEDECINS` avant la génération de novembre.

**⚠️ 31/07 — la première génération réelle a sorti 3 défauts invisibles en simulation.**
Le banc d'essai **fabrique** onglets et dates : il n'exerce jamais le chemin de lecture du classeur.
(1) `reconstruireDatesHeaders` datait la **queue de janvier N+1** en année N → absences des 2
derniers jours invisibles, 2 gardes attribuées à des MAR en congés. Règle : *si le mois recule,
l'année s'incrémente*. (2) Le statut **`I`** recopié dans `GARDES` était lu comme une absence par
4 écrans → retiré de `GARDES` (option A : une donnée, un endroit) ; code **`E`** supprimé.
(3) Les **avertissements du générateur** n'arrivaient nulle part — ils remontent désormais au W2.
**Génération 2027 revalidée** : 0 garde sur absence, 0 statut `I`, écart maximal **0,6 garde**,
**21/21 MAR à moins d'une garde** de leur cible, 29 départs en congés prolongés d'un jour.

**⚠️ Rotation des groupes de vacances — règle actée le 30/07/2026.**
« **Le dernier devient le premier** », entre groupes **et** à l'intérieur d'un groupe :
`ABC → CAB → BCA` · `A1 A2 A3 → A3 A1 A2`. En code : `(3 − offset % 3) % 3`, **jamais**
`offset % 3`. Cette règle est écrite à **quatre endroits** (`staff.html`, `admin.html`, et
**deux fois** dans `Indispos.gs`, plus l'outil `testNotifierConflits`). Le serveur tournait à
l'envers jusqu'au 30/07 : les deux ordres ne coïncidaient qu'**une année sur trois**, et une
année sur trois le MAR désigné en conflit de vacances n'était pas celui affiché au staff.
Elle sert au blocage des conflits **et** à l'audit de couverture du W2 (qui décale ses congés).

**Journée du 30/07 — audit documentaire des 7 guides et des 4 `.md` (30 anomalies corrigées),
et surtout deux correctifs de fond sur la saisie :**
- `saveIndispos` **réécrivait la ligne entière** d'un MAR. Or `INDISPOS_{Y}` a deux propriétaires
  (comité : `VAC`/`FORM` · MAR : `INDISPO`/`SOUHAIT`/`TP`). Revalider le staff effaçait la campagne
  des MARs ; une page MAR ouverte trop tôt effaçait les vacances. Corrigé par `_fusionIndispos_`
  **dans le routeur** — pas dans `saveIndisposForDoctor`, qui sert aussi à l'absence longue.
  C'est ce qui rend le verrou des vacances **réel, côté serveur**.
- « Valider et verrouiller » faisait **un appel par MAR** (23 exécutions sérialisées, ~3 min).
  Nouvelle action `saveIndisposBatch` : 1 aller-retour, 1 écriture de bloc. **Quelques secondes,
  confirmé en production.** Cadenas désormais reconstruits depuis la base + bouton
  🔓 Tout déverrouiller.

## Ce qu'a appris la journée du 3 août 2026

1. **Une donnée dérivée s'écrit en regardant la case d'arrivée.** Un `RG` posé automatiquement
   après un `G` peut écraser un `G`. Refuser, jamais écraser.
2. **L'absence de trace ne prouve rien.** J'ai conclu « pas de don » d'un journal vide, alors
   que ces gestes n'étaient tout simplement pas journalisés.
3. **Un contrôle sans destinataire ne sert à rien.** Le trou était détecté, écrit noir sur
   blanc, avec « À TRAITER IMMÉDIATEMENT ». Personne ne l'a lu pendant deux jours.
4. **Lire la fonction entière avant de proposer de l'étendre.** Trois contrôles proposés pour
   le Diagnostic existaient déjà. Inventorier, puis proposer.
5. **Le simulateur ne remplace pas les vraies entrées.** 400 années simulées, 0 défaut ; la
   première année réelle en a eu un. Le harnais fabrique ses données et n'exerce pas le chemin
   de lecture du classeur — ni les Date, ni les souhaits, ni les transitions.
6. **Deux représentations d'un même fait finissent par diverger.** Le générateur tient
   `gardes[]` et `gSet`/`g2Set` en parallèle ; la grille écrite lit l'un, les repos sont
   dérivés de l'autre. Rien ne vérifie qu'ils disent la même chose.

---

## Les 6 règles qui évitent les dégâts

**1. Le dépôt en ligne fait foi — toujours.** Jamais un souvenir, jamais un fichier joint au
projet, jamais une mémoire de session précédente. Vérifier l'état réel avant toute modification.

**2. Aucun push sans accord explicite d'Arthur.** Préparer le patch AVANT/APRÈS, expliquer
l'effet en langage simple, attendre le « OK pour push ». Vaut aussi pour les suppressions.

**3. Lire dans l'ordre d'exécution, pas par fragments.** Un défaut d'ordre est invisible à la
lecture locale. *(Le 28/07, une déclaration placée 235 lignes trop bas a coûté une journée
entière — détail en partie 2, section Diagnostic.)*

**4. Rendre visible avant de corriger.** Face à un symptôme inexpliqué, la première action est
d'afficher l'échec silencieux — jamais un correctif. Un `try/catch` protecteur masque les erreurs.

**5. Une recherche négative ne prouve rien tant qu'elle n'est pas exhaustive.** Chercher dans
**tout** le dépôt avant d'affirmer qu'une fonction n'existe pas ou qu'un fichier est orphelin.

**6. Signaler les incertitudes plutôt que les lisser.** Distinguer toujours ce qui est vérifié par
machine (syntaxe, unicité d'ancre, simulation, jsdom) de ce qui ne sera prouvé qu'en production.

## Le réflexe performance

**Décomposition mesurée le 01/08 d'un appel qui ne fait rien :** ~1 400 ms de plancher
plateforme (Google, irréductible) + ~730 ms de compilation de nos 545 Ko de `.gs`. Méthode :
comparer avec un projet Apps Script **vide**, en alternant les deux appels dans la même
minute — jamais entre deux heures différentes.

**Trois leviers, dans cet ordre :** réduire le nombre d'APPELS, puis le nombre
d'allers-retours vers SHEETS, puis rien. Le JS du navigateur coûte 0,1 s : ce n'est jamais là.

**⚠️ NE JAMAIS AJOUTER DE REQUÊTE POUR ACCÉLÉRER.** Apps Script sérialise les exécutions
d'un même utilisateur : toute requête ajoutée occupe la file. Deux tentatives du 01/08
(appel de réveil, délai d'abandon court avec rejeu) ont cassé l'ouverture d'admin et ont
été retirées le jour même.

**Le terme qui décide des mauvais jours** — l'attente hors exécution — a valu 2 656 ms puis
18 191 ms à trois minutes d'écart, à code identique. Rien dans notre code ne le touche.

Avant d'ajouter un appel à l'ouverture d'une page, se demander s'il ne peut pas rejoindre
`getAdminBootstrap`.

## Ce qui est livré et ne doit PAS être reconstruit

Module libéral (estimateur, devis, déclaration d'intervention, volet comité, relevé et suivi
des 30 %) · Contrôle d'absence lot 5-bis · Boîte de réception Gmail dans `admin.html` ·
Couverture des jours serrés du générateur · Export Excel · Wizards annuels ·
**Bande de présence** en tête de l'onglet Planning (01/08) ·
**Notifications de changement de planning** (01/08, module livré **éteint**).

## Ce qui est écarté — ne pas reproposer

Protection anti-force-brute sur `checkCode()` · Service worker sur les autres pages · Icônes
`index.html` en bundle local · Réduction automatique du devis à l'impression · Archivage annuel
automatisé · Cache serveur et optimisation du JSON · Migration hors Apps Script.
*(Justifications chiffrées dans la ROADMAP, section « Écarté ».)*

## Où chercher quoi

| Besoin | Document |
|---|---|
| Architecture, wizards, déploiement, dépannage | `docs/guide-technique.html` — **le plus fiable** |
| **Vue courte du projet : échéancier, chantiers, règles** | `docs/roadmap.html` — le plus lisible |
| État du projet, priorités, ce qui est écarté (détail et historique) | `docs/ROADMAP-Planning-CHPG.md` |
| Règles de code, invariants, métier | **Ce document, partie 2** |
| Module libéral (conception) | `docs/module-liberal/module_liberal_conception.md` |
| Guides utilisateurs | `docs/guide-mar.html`, `guide-comite.html`, `guide-liberal.html` |

**Entretien de `docs/roadmap.html`** *(règle posée le 08/08/2026)* : c'est une vue de
pilotage, pas un doublon. Elle se met à jour **en même temps que ROADMAP et CONTEXTE**,
en fin de session : un chantier qui bouge change de carte ou disparaît, et la date du pied
de page suit. Une roadmap courte qui a vieilli est pire qu'un document long — elle se lit
en confiance. Comme ROADMAP et CONTEXTE : **une seule conversation à la fois l'édite.**

---
---

# PARTIE 2 — LE DÉTAIL

> Conservé intégralement : conventions de code, invariants, règles métier, architecture,
> pièges. **Rien n'a été retiré.** La partie 1 oriente, la partie 2 fait foi.

## Le projet
Application web de **planning des gardes** (algorithme d'équité annuel) + **planning quotidien** d'anesthésie + **consultations**, pour ~23 MARs.
Dépôt : `chpg-anesthesie/Planning-CHPG`, branche `main`.

## Workflow de livraison (IMPORTANT)
- **Frontend** (`index.html`, `admin.html`, `staff.html`, `indispos.html`, `staff_gardes_demographie.html`) : tu les **pousses directement** sur le dépôt via l'API GitHub. Rien à recopier de mon côté — je fais juste **Ctrl+Maj+R**. `admin.html` = usage **PC**, optimisé souris/hover.
- **Fichiers GAS** (`gas/code.gs`, `gas/generateur_gardes.gs`, `gas/Indispos.gs`, `gas/setup_annee.gs`) : tu pousses la copie du dépôt, **je recopie manuellement dans Apps Script**. En Apps Script, les fonctions se voient entre fichiers (scope global partagé). **Tant qu'un `.gs` n'est pas recopié dans Apps Script, le web app tourne sur l'ancienne version.**
- **Token GitHub** : je te le fournis en début de session (il sert à pousser ; c'est aussi la clé `GITHUB_TOKEN` de l'onglet CONFIG côté appli). Sans lui, tu ne peux pas publier. Ne l'écris jamais dans un fichier.

## ⛔ Diagnostic : les 5 règles issues de la journée du 28/07/2026

Une seule ligne mal placée a coûté une journée entière. Ces règles en découlent — les appliquer
avant tout diagnostic de comportement anormal.

**1. Lire dans l'ORDRE D'EXÉCUTION, pas par fragments.** Le défaut du 28/07 : la file d'attente
`_fileAPI` (`let`, ligne 2036) était utilisée par la connexion automatique qui s'exécute **235
lignes plus haut** (ligne 1801). Une variable `let` n'existe pas avant sa ligne : le tout premier
appel levait `ReferenceError: Cannot access '_fileAPI' before initialization`, **à chaque
rechargement de page**. Aucune lecture locale ne peut révéler ça — seule une lecture « qu'est-ce
qui s'exécute en premier, qu'est-ce qui est déclaré où » le montre.
→ ⚠️ **L'emplacement d'une déclaration est une décision technique, jamais éditoriale.** Ne jamais
insérer du code « là où c'est lisible » sans vérifier ce qui s'exécute avant lui. Dans
`admin.html`, la connexion automatique (`tryAutoLogin`) est volontairement **la dernière chose du
gros bloc `<script>`** : ne jamais la remonter.

**2. RENDRE VISIBLE avant de corriger.** L'exception était avalée par le `catch` d'`ouvrirSession`
depuis le matin. Trois lignes de `console.warn` ont donné la réponse en une minute, après six
heures de tâtonnements. Face à un symptôme inexpliqué, la PREMIÈRE action est d'afficher l'échec
silencieux — jamais un correctif. (Corollaire de la règle « un try/catch protecteur ne dispense
pas de tester ».)

**3. Un symptôme qui CONTREDIT le code est le signal le plus fort.** Le chronomètre montrait
`login` parti AVANT `getAdminBootstrap`, alors que le code ne l'appelle qu'après. J'ai cherché
des explications de contournement pendant des heures. Quand l'observation contredit le code,
c'est que le code ne fait pas ce qu'on croit : creuser LÀ, immédiatement.

**4. Une mesure exacte peut mener à une conclusion fausse.** Le péage de 2-3 s par appel
(mesuré, vérifié sur deux déploiements) est réel — mais il explique la **durée** d'un appel, pas
leur **nombre**. Il y avait 3 à 4 appels là où un seul était nécessaire, et ça, c'était le code.
Toujours vérifier : cette mesure répond-elle à la question posée ?

**5. Quand la même fonction casse deux fois, ARRÊTER DE PATCHER.** Le préchargement du panneau a
demandé quatre versions successives le même après-midi. Après le deuxième correctif, il fallait
revenir à un état stable et repartir d'une analyse complète.

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
- **`docs/`** : la documentation vivante — `CONTEXTE-Planning-CHPG.md` (ce fichier) et `ROADMAP-Planning-CHPG.md` ; guides `guide-technique.html` (référence interne : architecture, wizards, déploiement, dépannage), `guide-comite.html`, `guide-mar.html`, `guide-algo-gardes.html`, `guide-liberal.html` ; `reprise.html` (continuité : propriété, accès, sauvegardes, réparations) ; `si-ca-tombe.html` (urgence comité : mode dégradé) ; `guide-demenagement-nchpg.html` (bascule des secteurs au NCHPG, phases A→D, créé 06/08) ; `VEILLE_CFG-mode-emploi.md` ; présentations staff (⚠️ `presentation-staff.html` : le code de démo se saisit **par prompt au clic**, ne jamais l'écrire en dur — dépôt public, historique permanent) ; `module-liberal/` (conception, antisèche cotation, estimateur).
- **`gas/`** : les **5** fichiers Apps Script (`code.gs`, `Indispos.gs`, `generateur_gardes.gs`, `setup_annee.gs`, `portail.gs`) + `README.md`. **+ `mesure_perf.gs` — TEMPORAIRE** (outil de diagnostic en lecture seule, lancé à la main depuis l'éditeur, jamais routé ni déployé ; contient `mesurerPerf()` et `mesurerDrive()`). **À supprimer du dépôt ET de l'éditeur quand le chantier performance sera clos.**
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
- ⚠️ **Toute nouvelle colonne de `MEDECINS` s'ajoute À LA FIN de l'onglet.** Jamais au milieu, jamais par insertion. **22 lectures** de `MEDECINS` (dans `Indispos.gs`, `code.gs`, `portail.gs`) utilisent des **index de colonne figés** — code d'accès `[6]`, ACTIF `[3]`, DECT `[8]`, drapeaux de garde `[9]` à `[16]`. Une insertion au milieu décale tout : vérifié en réel le 21/07/2026, la colonne `LIBERAL` posée au milieu a rendu les codes d'accès inopérants (`checkCode` lisait la colonne voisine). Symptôme : « code refusé » alors que le code est correct dans le Sheet.
- **Colonne `LIBERAL` (O/N) dans `MEDECINS`** (ajoutée en fin d'onglet) — appartenance au groupement libéral. Repérée **par son en-tête** et non par un index figé (`checkCode`, `Indispos.gs`) : sa position peut donc changer sans toucher au code. ⚠️ Cela **ne dispense pas** de la règle ci-dessus : c'est la lecture de `LIBERAL` qui est robuste, pas l'onglet. `checkCode` renvoie `liberal:true/false`, l'action `login` le transmet, `dashboard.html` s'en sert pour n'afficher la **tuile « Module libéral »** qu'aux membres. **Colonne absente ou vide → tuile invisible pour tout le monde** (comportement voulu). Aucune lecture de classeur supplémentaire : `MEDECINS` était déjà lu par `checkCode`.
- **L'estimateur libéral est une page du portail** (depuis le 21/07/2026, V4.0). Il lit le code d'accès dans `sessionStorage('chpgViewCode')` — déposé par `dashboard.html`, même origine GitHub Pages, et la tuile ouvre l'estimateur **dans le même onglet**. Il appelle **`login`** (identité) et **`getSecteurs`** (liste des secteurs) : **deux lectures, aucune écriture**. `API_URL` y est écrite en clair, ce qui n'ajoute rien — elle est déjà publique dans `dashboard.html` sur ce dépôt public.
  - **Colonnes de `MEDECINS` consommées par le module** : `LIBERAL` (O/N), `RPPS`, `PRENOM`. Toutes **en fin d'onglet**, toutes lues **par leur en-tête** via `_colParTitre()` dans `checkCode` (`Indispos.gs`). Ajouter une quatrième = une ligne.
  - **Données nominatives** : RPPS et prénom ne sont **jamais** dans le dépôt. Ils font l'aller-retour classeur privé → navigateur du praticien, et ne sont renvoyés qu'au MAR identifié par **son propre** code, pour **sa seule** ligne.
  - **Civilité** : la colonne `NOM` contient « Dr X » et les gabarits écrivent déjà « Dr »/« Docteur ». `sansCivilite()` la retire au pré-remplissage. ⚠️ **Ne jamais mettre le prénom dans la colonne `NOM`** : elle alimente le planning, le dashboard et l'export Excel.
  - **Filtre des secteurs proposés** : `ACTIF` **et** `AFF` renseigné **et** `RENDEMENT_LIB` ni `NUL` ni `REA`, trié par `ORDRE`. Un secteur **sans rendement renseigné est proposé** (présumé productif jusqu'à classement).
  - **Tous les replis sont visibles** : hors portail, API injoignable, liste vide, champ manquant — chaque cas affiche son message et retombe sur la saisie manuelle.

- **Onglet `LIBERAL_{Y}` — déclarations d'intervention** (depuis le 22/07/2026). **9 colonnes** — `ID · DATE_CONSULT · DATE_BLOC · MAR_ID · SECTEUR · CHIRURGIE · SPECIALITE · BR_CCAM · BR_NGAP` (ordre du `LIBERAL_HEADER`, revérifié le 30/07 : **`CHIRURGIE` est 6ᵉ, `SPECIALITE` 7ᵉ**). **Une ligne = un patient** depuis le lot 2A (27/07) : la fusion jour+secteur a été supprimée. Créé à la volée, année du **jour de bloc**. Actions dans `portail.gs` : `declareLiberal` / `deleteLiberal` (écritures, présentes dans le `WRITE_ACTIONS_LOCK` d'`Indispos.gs` bien que routées par `portailRoute` — le verrou est vérifié avant la délégation) et `listLiberal` (lecture).
  - 🔒 **`MAR_ID` = `user.id`, toujours déduit du code d'accès.** Le client n'envoie jamais d'identité. `listLiberal` filtre sur le MAR connecté, `deleteLiberal` refuse la ligne d'autrui.
  - **Une ligne = un MAR, un jour, un secteur.** Même jour + même secteur → mise à jour et libellé cumulé, jamais de doublon.
  - ⚠️ **Ne jamais purger automatiquement les lignes passées** : c'est la trace de l'activité libérale. La page en masque une partie, l'onglet garde tout.
  - ⚠️ **Piège de vocabulaire** : *déclaration de choix* (document signé par le patient) ≠ *déclaration d'intervention* (ligne lue par le comité).
  - `_isoDate()` vit dans `Indispos.gs` et est appelée depuis `portail.gs` (projet GAS unique). ⚠️ `_isoDate(undefined)` renvoie la **chaîne** `"undefined"`, pas `''` — ne l'appeler que sur une valeur présente (bug attrapé en test le 22/07).

- **Volet « ◆ Libéral » du comité** (`admin.html`, depuis le 22/07/2026). Action `listLiberalJour(date)` dans `portail.gs`, **réservée à l'admin**, lecture seule (absente du `WRITE_ACTIONS_LOCK`). Tiroir `#liberalCard` à **gauche**, symétrique de `#dispoCard`. Cache par date `_libJourCache`. Noms résolus par `_nm()`, secteurs par `SECTEURS_CFG` — rien de plus n'est transporté.
  - ⚠️ **Aucun jugement de placement n'est calculé** (ni « déjà en X », ni « à replacer ») : décision d'Arthur, le comité décide seul. Ne pas "améliorer".
  - ⚠️ **`#dispoCard` est un tiroir flottant à DROITE** (`position:fixed; right:16px; width:360px`) : son attribut `style=` inline dit le contraire, une règle CSS plus bas l'écrase. **Toujours lire la feuille de style avant de conclure sur la mise en page.**
  - Jour sans déclaration : tiroir masqué, **pas de toast**.

- **Estimateur libéral — modèle de données d'un parcours.** `docs/module-liberal/estimateur-liberal.html` (V3.6). Un parcours stocke : `axe` (CCAM ou NGAP), `statut`, `desc`, `br`, `dh`, `rac`, `mut`, **`dCs`** (date de consultation), **`dInt`** (date d'intervention, vide en NGAP), **`dActe`** (date de l'acte = `dInt` en CCAM, `dCs` en NGAP) et **`lines`** (détail acte par acte : `code`, `lib`, `br`, `mods`). Rien n'est persisté : tout vit en mémoire de page, un rechargement remet à zéro — pas de migration à prévoir.
  - **`dActe` est le champ pivot** : c'est lui, et lui seul, que lira le futur tiroir « ◆ Libéral » du planning admin pour poser l'alerte du comité au bon jour.
  - **La date d'intervention n'est jamais pré-remplie** et l'ajout d'un parcours CCAM est refusé sans elle. Une case vide se voit, une date fausse ne se voit pas.
  - **Le DH ne se répartit pas par acte.** Il est saisi pour l'intervention entière ; il n'existe aucune clé de répartition. Sur le devis il reste sur la ligne de total, avec les honoraires et le remboursement. Ne pas inventer de répartition.
  - Le devis est **établi à la date de consultation**, pas à la date d'impression, et sa validité de 6 mois court depuis elle.

- **Mini-bundle d'icônes `assets/vendor/lucide-icons.js`** — `dashboard.html` ne charge PAS Lucide depuis un CDN : le fichier local ne contient que les **18 icônes** réellement utilisées (extraites de lucide 1.23.0). ⚠️ Une icône demandée mais absente du bundle **ne s'affiche pas et ne produit aucune erreur** — la tuile garde un carré vide (constaté le 21/07/2026 avec `calculator`). Avant d'utiliser un nouveau nom d'icône, **vérifier la liste en tête de ce fichier** et y ajouter le tracé si besoin (`npm pack lucide@1.23.0`, puis `dist/esm/icons/<nom>.mjs`). Depuis le 21/07 un `console.warn` signale l'icône manquante.
- **Code d'accès perso = colonne G (7ᵉ colonne) de la ligne du MAR dans `MEDECINS`** (`checkCode` lit `data[r][6]`). Code admin = clé `ADMIN_CODE` de `CONFIG`.
- L'écran de connexion **met la saisie en MAJUSCULES**. ⚠️ **(27/07/2026) La comparaison GAS est désormais INSENSIBLE À LA CASSE** — `checkCode` normalise les deux côtés par `trim().toUpperCase()` (`_normCode`). Le motif : les champs portent `autocapitalize="characters"`, donc le téléphone corrigeait tout seul et **pas l'ordinateur** — même code accepté sur mobile et refusé sur PC. Sans risque de collision : `generateCode()` n'émet que des majuscules et `resetCodeMar` vérifie l'unicité en majuscules. ⚠️ Ce paragraphe a affirmé successivement les deux thèses — **corrigé le 29/07/2026 en relisant `checkCode`, seule référence.** Un code saisi À LA MAIN dans le classeur doit rester unique une fois mis en majuscules. 🔒 **(29/07/2026) AUCUNE limite de longueur** sur les champs de saisie de code : les trois `maxlength` d'`indispos.html` (8), `staff.html` (20) et du wizard d'`admin.html` (12) ont été retirés. Ils tronquaient un code long **sans message**, qui était ensuite déclaré invalide — panne vécue par Arthur sur son propre code. `checkCode` compare la chaîne entière, aucune contrainte serveur. **Ne jamais remettre de `maxlength` sur un champ de code.** Éviter aussi un code purement numérique (Sheets peut le stocker en numérique/notation scientifique).
- **Aucune limite de tentatives** sur `checkCode()`, et c'est **assumé** (décision du 20/07/2026, voir la section « Écarté » de la ROADMAP pour le chiffrage). Ne pas reproposer de protection anti-force-brute.
- **Codes robustes** : `genererTousLesCodes()` (dans `setup_annee.gs`) génère un code 8 caractères non devinable (alphabet sans `0 O 1 I L`) pour chaque MAR **actif** (col D=O), efface celui des inactifs (parti = ne peut plus se connecter), et logue le récap. `genererCodeMAR("XX")` pour un seul MAR. Distribution via le flux « Envoyer les codes » du Wizard 1.
- **Renouveler le code d'un MAR** : action GAS **`resetCodeMar`** (admin only, dans `WRITE_ACTIONS_LOCK`), déclenchée par le bouton **🔄** de sa ligne (onglet Équipe). Tire un code unique (comparé aux autres MARs **et** à `ADMIN_CODE`), l'écrit en colonne G — **l'écrasement EST la révocation**, il n'y a rien d'autre à invalider — puis l'envoie par email. **L'email est vérifié avant toute écriture** (pas d'email → refus, code inchangé) ; l'ancien code est tracé dans `LOGS` avant écrasement ; si l'envoi échoue, le nouveau code est **renvoyé dans le message d'erreur** pour transmission en main propre. ⚠️ **Les envois groupés ne régénèrent PAS** (`sendCodes`, `sendCodesMar`, `sendCodesWithRecap`) : ils renvoient le code existant. Distinction volontaire — un « envoyer à tous » ne doit jamais pouvoir casser 23 codes. Documenté dans `guide-comite.html` § 13.3.
- **Personnalisation** : le MAR connecté (`MY_ID`) est mis en exergue partout — puce liserée `me-chip` en vue secteurs, `me-row` en vue année/affectations, `me-card` + carte en tête en médecins/équité, `me-chip` en mobile. Le code **admin** donne la vue générique sans « moi » (l'admin n'est pas un MAR).
- **Déconnexion / changer d'utilisateur** : le badge 👤 en haut à droite est cliquable (icône ⏻) → vide la session (`sessionStorage.chpgViewCode`) et recharge → écran de connexion. Sinon l'auto-login reconnecte le dernier code.
- Chemin d'échec robuste : une erreur d'auth pendant le chargement ne détruit plus la page — retour propre à l'écran de connexion (`loadYear` renvoie `false`, `init` s'arrête, `checkMobile` null-safe).

## Règles clés de l'algo de gardes

**⚠️ L'année de planning ne fait PAS 730 gardes.** Elle va du **premier lundi de janvier** au
dimanche précédant le premier lundi de l'année suivante, donc **toujours un nombre entier de
semaines** : 52 semaines = 364 j = **728 gardes** (18 années sur 22), ou 53 semaines = 371 j =
**742 gardes** (**2028, 2034, 2040, 2045**). Le « 730 » du deck et de plusieurs commentaires est
une approximation (365 × 2) : commode à l'oral, fausse dans tout calcul. Vérifié sur la génération
réelle de 2027 : Σ `TOTAL G` = **728** exactement. Toute vérification arithmétique des cibles doit
partir de `SLOTS.total = nDays × 2`, jamais de 730.

- Priorité d'équité : **VD (week-end) > Samedi > Jeudi > Total**.
- Cibles **proportionnelles à la quotité** (colonne `PCT_GARDES`).
- **Dette inter-annuelle** dès **2028** : écart réel − cible de N-1, plafonné à ±2, amorti ×0,6.
- Noël / Jour de l'an en **rotation pluriannuelle** via `getNoelHistory(beforeYear)`.
- **Couverture des jours serrés (depuis le 23/07/2026)** : **Validé par une génération RÉELLE de 2027 dans le classeur (23/07/2026) : zéro jour sans binôme, écart maximal 1,2 garde.** En simulation : **13 jours sans binôme → 0** sur 140 années, avec une équité et une vitesse meilleures que la référence. **Aucun jour n'est jamais abandonné sans avoir tout essayé** : si le placement normal échoue, une passe de dernier recours retente en tolérant le combo jeudi↔samedi (légal — ce n'est pas deux gardes d'affilée) ; les deux règles dures ne sont JAMAIS relâchées (jamais deux gardes consécutives, jamais de garde sur une absence déclarée) et si vraiment personne n'est disponible, le jour est signalé nommément au comité avant publication. La passe « jours critiques » énumère les combinaisons possibles et retient **la moins coûteuse en équité** (borne dure : 20 000 essais) ; l'équité pilote, la disponibilité ne fait que départager — l'ordre inverse, testé et retiré, dégradait l'axe week-end (5,3 contre 3,4). Piège à connaître : `assign()` **ne vérifie pas** si le jour est déjà pourvu — toujours tester `!gardes[date]` avant de (ré)assigner, sinon on écrase silencieusement l'attribution de Noël. **Toute livraison du générateur exige `simulateur/eval.js`** (écart par axe) : la batterie historique ne mesurait que le total et a laissé passer une régression sur l'axe le plus prioritaire.
- **Deux gardes d'affilée : INTERDIT, c'est illégal.** Ne jamais le proposer. **Plafonner les congés de Noël : REFUSÉ.** Seule tolérance, en ultime recours quand un jour resterait sinon découvert : le combo jeudi↔samedi (2 occurrences en 140 ans).
- **Le choix du candidat est un vecteur de score comparé position par position** (`scoreSelect`,
  l.502) : `[espacement · ratio de l'axe du jour · lissage mensuel · ratio total · total brut]`,
  et `cmp()` s'arrête à la première position qui départage. Trois conséquences à ne pas oublier :
  le critère est un **ratio** `(réel + dette) / cible`, jamais un écart — c'est ce qui rend un 50 %
  comparable à un temps plein ; **la dette de N-1 est dedans en permanence**, ce n'est pas une
  correction appliquée après coup ; et le **ratio de l'axe du jour n'existe que pour les samedis,
  jeudis, veilles de fériés et fériés** — un mardi passe directement au lissage mensuel puis au total.
- **Récupération ≠ repos du lendemain.** Deux codes distincts : `RG` = le lendemain de **chaque**
  garde, soit 34/an pour un temps plein ; `R` = un jour rendu par **samedi** de garde, soit ~5/an.
  L'invariant est **`R ≡ SAM`** (testé dans `simulateur/chain.js`, vérifié sur les 24 MARs de la
  génération réelle 2027). Ne jamais dire « une récup par garde ».
- **L'espacement à 5 jours n'est PAS une règle dure** : c'est une pénalité de score (`spacingPenalty`). Blocages durs uniquement : lendemain de garde (`rgSet`), récupération (`rSet`), garde le lendemain (`gSet`), combo jeudi-samedi.
- **Contrainte d'effectif connue** — remesurée le 29/07 sur **400 années** (20 scénarios × 20 ans,
  `simulateur/staff140.js` et `staff_rythme.js`, `SCEN` de 0 à 19 ; `SCEN=0` = le tirage par défaut de
  `demographie.js`) : entre 2038 et 2041 (15 gardeurs), l'écart médian entre deux gardes tombe de
  **7,9 à 6,2 jours** et les mois à plus de 4 gardes passent de **8 % à 32 %**. Pire mois observé :
  **8 gardes**, jamais plus. Retour à la normale dès **2044**. L'algorithme espace au mieux ; c'est un
  sujet de recrutement, pas un défaut de code.
- **Équité mesurée sur 400 années** : 292 312 gardes placées, **0 journée sans binôme**, écart maximal
  annuel de médiane **1,20** garde. Il dépasse 2 dans 5 % des années et **3 dans 0,8 % (3 années sur
  400)** — les trois dépassements sont **tous** dans le creux démographique, le pire étant **3,5**.
  À effectif normal (plus de 16 gardeurs, 280 années), le pire observé est **2,3**. La garantie
  défendable est donc **« jamais plus de 4 »**, pas « jamais plus de 3 » comme annoncé avant le 29/07.
- **La démographie repose sur deux hypothèses fragiles, à connaître avant d'en tirer un argument.**
  Les **années de naissance n'existent nulle part ailleurs que dans `simulateur/demographie.js`** —
  `MEDECINS` n'a pas de colonne de naissance, rien ne les recoupe. Et toute la courbe est portée par
  l'**exemption de garde à 60 ans** : sans elle, la charge d'un temps plein **ne dépasserait jamais
  38,6 gardes/an** sur vingt ans, au lieu de monter à 52. Le modèle applique aussi cette exemption dès
  2027 (deux MAR concernés) alors que la génération réelle ne le fait pas — d'où une courbe qui démarre
  à 39,7 quand la cible réelle 2027 est 34,6.
- **L'algo de gardes ne dépend PAS des secteurs** (gardes = G / G2) → réorganiser les secteurs ne touche jamais l'équité.
- Secteurs définis dans une **source unique `SECTEURS_CFG`** en haut d'`admin.html`.
- **PRUNET** (`souhait_plafond`) : ses souhaits sont honorés en priorité (43 mardis en 2027, 44 gardes au total, zéro week-end) ; **il reste dans le pool proportionnel** (décision assumée). Chiffres réels 2027 : cible **44,0**, réalisé **44**, contre 34,6 pour un temps plein. Conséquence connue : les cibles des autres sont **légèrement surestimées** (~+0,6 garde/100 %) puisque BP consomme plus que sa part → les autres finissent un poil sous leur cible. Normal, dans le bruit du plancher arithmétique. Dans la vue d'équité, PRUNET s'affiche en profil **« SOUHAITS · hors cible »** (barres neutres, pas de trait de cible).

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
⚠️ **(29/07/2026) Il n'existe plus aucun repli en dur** : les 6 copies figées d'`admin.html` ont été
supprimées. Un échec de lecture affiche le bandeau rouge `configBanner` et **bloque l'export Excel**,
au lieu de faire tourner les pages sur une config périmée sans le dire.
`VOLANT` et `CS` sont des pseudo-secteurs, hors onglet.
⚠️ `assets/vendor/lucide-icons.js` ne contient que **17 icônes** : aucune icône de secteur
(Activity, HeartPulse, Bone…) n'y est. `admin.html` **ne charge aucune bibliothèque lucide** —
d'où l'absence d'icônes de secteur sur cette page, contrairement à `index.html` (CDN unpkg).

## Consultation libérale endoscopie
- La consultation libérale d'endoscopie (mardi/jeudi PM) est marquée **`entry.lib=true`** côté GAS, via le tag **`LIB`** en **colonne E (COMMENTAIRE)** de `PLANNING_OVERRIDES`. Dans `index.html`, la puce Endoscopies porte un **badge « LIB »** violet (desktop + mobile) + légende conditionnelle. Cohérent avec le rendu admin.
- **Attribution 100 % manuelle** : le comité clique le marqueur LIB dans l'onglet Planning → l'override est écrit avec le commentaire `LIB`. Les créneaux `CS-END` eux-mêmes viennent de `CS_TEMPLATE` (`code.gs`) et ne dépendent d'aucun override.
- ⚠️ **La rotation automatique a été SUPPRIMÉE (20/07/2026)** — objet `ROT`, assistant « ⟳ Rotation libérale », overlay et action `applyRotationLib` retirés, faute d'usage réel. Le tag `ROT-LIB` n'existe plus : les lignes existantes ont été converties en `LIB` par la fonction one-shot `convertirRotLibEnLib()` (elle-même retirée après usage), ce qui a préservé à l'identique les créneaux déjà attribués. **Ne pas reproposer d'automatisation de cette rotation.**
- ⚠️ **`setLibSoliste` n'a jamais existé** dans le dépôt : cette doc l'a longtemps annoncée comme « à recopier », mais aucune trace dans les `.gs` ni dans `admin.html`. Mention supprimée le 20/07/2026. Rappel : **le dépôt fait foi**, pas ce fichier.

## Module libéral — pilotage 30 % : cadrage du 24/07, élargi le 26/07/2026

### Lot 2 ÉLARGI (26/07/2026) — la déclaration porte la spécialité et le montant
**Décision d'Arthur.** La déclaration d'intervention (Lot 3, en prod) cesse d'être un simple signal
de placement : elle porte désormais la **SPÉCIALITÉ** et le **MONTANT (BR)**. Elle devient donc la
source du **rendement par spécialité**, qui n'a plus à être déduit par moindres carrés.

- **Granularité : une ligne = UN PATIENT.** La fusion « même MAR + même jour + même secteur » de
  `declareLiberal` disparaît (elle rendait les interventions incomptables : 8 cataractes = 1 ligne).
- **Schéma `LIBERAL_{Y}` à 9 colonnes** : `+ SPECIALITE, BR_CCAM, BR_NGAP`.
  ✅ **EN PRODUCTION depuis le lot 2A (27/07/2026)** — `portail.gs` écrit les 9 colonnes.
  *(Cette ligne a longtemps indiqué « pas encore en production » : c'était FAUX, corrigé le
  29/07.)* Les lignes anciennes gardent leurs 6 colonnes remplies : **aucune migration**.
- **BR seule, jamais le DH** (hors quota). `BR_CCAM` datée du **bloc**, `BR_NGAP` datée de la
  **consultation** — souvent deux mois différents ; sans cette séparation le recoupement bi-axial
  est faux. `DATE_CONSULT` cesse d'être informative et devient éditable.
- **Onglet `SPECIALITES`, 12 codes** : `OPH ORL VIS URO ORT END GYN PED CI RI VAS AUT`. Plus fine que
  le secteur là où un secteur mélange deux rendements (`OPH` ≠ `ORL`, `URO` ≠ `VIS`). Règle actée :
  **patient mineur ⇒ `PED`**, quelle que soit la chirurgie.
- **Le rendement se VENTILE, il ne se somme pas** : le relevé certifié fixe le niveau, les BR
  déclarées fixent la structure, on répartit au prorata. Sommer les BR déclarées donnerait un
  rendement plausible et faux. Toujours afficher le **n** d'interventions à côté d'un rendement.
- **Trois étapes : 2A** déclaration enrichie → **2B** saisie du relevé + marges → **2C** taux de
  couverture puis rendement. Le 2A d'abord (le relevé est rattrapable, la déclaration non) — **mais
  sans urgence tant qu'Arthur est le seul `LIBERAL=O` dans `MEDECINS`** : rien ne se perd, le
  chronomètre démarre le jour de l'ouverture aux autres. Le 2A doit être **rodé avant**.
- **Ergonomie retenue (option B)** : bouton **« Déclarer ce parcours »** sur une ligne cotée, qui
  descend tout (date, spécialité, BR) en un clic — plutôt que de rendre le montant obligatoire. Les
  deux blocs de la page libérale (calculette en haut, déclaration en bas) sont aujourd'hui
  **étanches** : la déclaration ne récupère que la date de bloc et le libellé de chirurgie, jamais
  le montant ni le secteur.

### Lot 2B livré (27/07/2026) — le relevé et le suivi
- Onglet **`LIBERAL_CA_{Y}`** + `getReleveLiberal`. ⚠️ **Lecture seule** : Arthur recopie le relevé à
  la main, **rien ne passe par `admin.html`** (le comité gère le planning, pas le libéral).
- Onglet créé pré-rempli par `creerReleveLiberalAnneeEnCours()`. **Checksum en formules**, vérifié au
  centime : le total « ACTIVITÉ LIBÉRALE » est bien la somme des excédents **des deux axes**.
- ⚠️ Formules posées par le code : **noms anglais obligatoires** (`IF`, `ROUND`) — `SI`/`ARRONDI`
  renvoient `#NAME?` même dans un classeur français.
- **Rattrapage par juin seul** : le relevé est cumulé, un mois suffit à connaître la position.
- Page **`suivi-liberal.html`** (racine) : position par axe, groupe en initiales, totaux par axe,
  **aucune projection**, colonne « D'ici décembre » **descriptive** (pastilles colorées).
- Tuile Dashboard **qui se sépare en deux** : Cotation & déclaration / Suivi des 30 %.
- ⚠️ **10 MAR sur 18 en excédent** au cumul de juin, dont 2 sur le seul axe NGAP. Fragilise
  l'hypothèse du gel du Lot 5 — à revérifier sur plusieurs mois.
- ⚠️ **Code d'accès insensible à la casse** (`checkCode`) : touche **toutes** les pages.

### Cotations types (27/07/2026) — après le 2A
- Onglet **`COTATIONS_TYPE`** (`GROUPE · NOM · ORDRE · CODE · ROLE · MOD7 · MODA · LC`) + action
  `getCotationsType`. Amorcé sur le groupe **Endoscopie** : *Gastro + colo* (`HHQE002` principal +
  `ZZLP025` associé 50 %), *Gastro seule*, *Colo seule*. Un bouton remplit le tableau de cotation.
- **Rien n'est affiché tant qu'aucun contexte n'est choisi** ; choix mémorisé pour la session.
- **Aucun tarif stocké** (il vient de l'index CCAM), **uniquement des lignes d'activité 4**, **aucun
  modificateur d'urgence** — il n'y a pas de libéral en urgence au CHPG.
- **Modificateur 7 coché par défaut** partout ; **tableau de cotation vide au démarrage**.
- ⚠️ **Index CCAM : codes v83, tarifs v80.** Écart d'environ 1,40 € sur `HHQE002`, systématique.
- ⚠️ **Clés de `sessionStorage` versionnées** : une colonne ajoutée à un onglet reste invisible tant
  que la session n'est pas fermée. Incrémenter le suffixe à chaque changement de structure.

Détail complet : `module_liberal_conception.md` **v4.2** — §5.4 bis, décisions 32 à 44.

### Lot 2 (compteur) — architecture du 24/07, toujours valable sauf sur un point
⚠️ **Amendement du 26/07** : la déclaration ne porte plus seulement du **volume**, elle porte aussi
des **euros estimés (BR)**. Reste entièrement vrai : **jamais un % issu des seules déclarations.**
Le **relevé administratif mensuel** est le **socle certifié en euros**. C'est la **seule** source
qui connaît le **dénominateur** (activité publique du MAR), donc la seule capable de donner un
**pourcentage** de plafond. La **déclaration d'intervention par le MAR** (Lot 3, déjà en prod) peut
faire monter un compteur **en temps réel entre deux relevés — mais en VOLUME d'interventions
uniquement, jamais en %.** Deux raisons : elle ignore l'activité publique (le dénominateur), et un
acte déclaré n'est pas un euro encaissé (cotation, délais, rejets). **Afficher un % issu des seules
déclarations donnerait un chiffre faux — et faux dans le sens dangereux** (dirait « vas-y » à qui
doit s'arrêter). Modèle retenu : *position certifiée au dernier relevé (en €, avec %) + tendance en
volume accumulée depuis*. L'arbitrage pouvant être mensuel, le relevé est mensuel → l'écran de
saisie garde son sens (17 lignes × 6 nombres, checksum sur Σ des excédents **recopiés**, monotonie
du cumul). Maquette de saisie explorée, non poussée.

### Lot 5 (orientation financière par la secrétaire) — GELÉ, mais hypothèse à revérifier

> ⚠️ **Constat du 27/07/2026 : 10 MAR sur 18 sont en excédent** au cumul de juin, dont **2 sur le
> seul axe NGAP** — non corrigeables par la réa. Cela **fragilise le motif (2) du gel ci-dessous**
> (« le dépassement s'efface arithmétiquement avec les deux entrants »). À revérifier sur deux ou
> trois mois consécutifs avant de confirmer ou lever le gel.
L'idée initiale : router chaque patient vers le MAR le plus loin de son plafond. **Gelée**, pas
abandonnée. Raisons : (1) elle dépend du Lot 2 (le plafond n'existe pas encore) et d'un horizon de
placement porté à 3–4 semaines ; (2) le dépassement du groupe s'efface **arithmétiquement** avec les
deux entrants (Arthur oct. 2026 + un autre janv. 2027 ≈ 82 k€ de plafond libre, vs ≈ 44 k€ reversés
au S1) ; (3) au-dessus de 30 %, un acte parti en public **n'est pas une perte** — il gonfle le
dénominateur et libère du plafond. Le Lot 5 optimiserait un problème en voie de disparition.
**Règle : ne pas le coder tant que le Lot 2 n'a pas prouvé, sur données réelles, un dépassement
persistant après les deux arrivées.** Conception complète conservée au §11 ter.

Mesures réelles conservées (semaine 25, juin 2026, à ne pas réestimer) : **89 patients
lib/semaine**, **75 %** déjà bien appariés, **20 déplacements** (22 %), délai consult→bloc **médiane
6 j**. Vivier CI **1** / MAT 1 / ORL 2 / ORT 2 → 6 déplacements CARDIO/semaine **irréductibles**.
⚠️ `p ≈ 1/3` était **faux d'un facteur deux** (consultations typées par secteur).

### Lot 5-bis (contrôle d'absence) — ✅ **EN PRODUCTION depuis le 25/07/2026**

> ⚠️ **Ce titre indiquait « conçu, non codé » : c'était FAUX.** Le lot est livré et tourne
> (`absences.html` à la racine, action `getConsultAbsences` dans `Indispos.gs`, tuile Dashboard,
> session secrétariat). **Ne pas le reconstruire.** Recadrage et mise à niveau de l'écran le
> 28/07 (site v1.14.1). Ce qui suit est la **conception d'origine**, conservée pour comprendre
> les décisions — pas un chantier à mener.
Extraction de la **jambe inoffensive** du Lot 5 : ne route rien, ne compte rien, n'écrit rien,
**aucune donnée patient**. **Besoin :** un patient vu par Dr X sera opéré par Dr X ; si le bloc
tombe un jour d'absence de Dr X, le patient est mal placé dès la consultation. **Outil :** la
secrétaire d'anesthésie ouvre, **au coup par coup pour un MAR donné**, ses **absences sur 3–4
semaines** et les compare à la main avec sa liste de dates de bloc (qu'elle possède déjà).
**Forme A** (l'outil affiche les absences, la secrétaire compare) — pas de forme B (saisie des dates
patient), pour ne créer ni donnée patient ni travail aux secrétaires des chirurgiens.

- **« Absent »** = jour où le MAR **n'est pas là** : RG, VAC, FORM, CL, CP, absence. **Pas** un jour
  travaillé sur un autre secteur (réa, autre bloc) : ce jour-là il peut récupérer son patient.
- ✅ **Faisable — vérifié en lecture de code (24/07).** `Indispos.gs` ~l.2773
  `ABSENT_CODES_SET = {RG,V,CP,F,CTP,A,CL}` définit déjà « absent ce jour », exploité en prod ; cas
  particuliers gérés (`tpJoursFixes`, dates début/fin, rythme 2/2 `estSemaineOff`). L'outil est ce
  **même calcul retourné** : figer le MAR, boucler sur ~20–28 jours. **Nouvelle action de LECTURE**,
  zéro écriture, zéro nouvelle donnée.
- ✅ **RÉSOLU (24/07) — lire `GARDES_{Y}` SEUL suffit.** Vérifié sur les **deux** chemins
  d'écriture, pas par analogie : (a) **campagne d'indispos** → `generateur_gardes.gs` **l.1283**
  recopie les indispos dans GARDES en les traduisant (`VAC→V`, `INDISPO→I`, `FORM→F`, `CL→CL`,
  `TP/CTP→TP`) — exactement les codes de `ABSENT_CODES_SET` ; (b) **absence longue** →
  `Indispos.gs` **l.3074** écrit `CL` dans GARDES *et* INDISPOS (commentaire : « CL écrase tout
  (gardes + RG) »). Unique exception : année **non encore générée**, le CL ne va que dans INDISPOS
  — sans objet pour cet outil (fenêtre 3–4 semaines ⇒ toujours l'année en cours, générée).
- **Liste des consultations à venir = `PLANNING_OVERRIDES`** (`DATE | MAR_ID | SECTEUR_MATIN |
  SECTEUR_AM | COMMENTAIRE`). `GENERER_CONSULTATIONS = false` (`code.gs` l.255) : les consultations
  **ne sont pas générées**, le comité place chaque MAR à la main. `CS_RULES` ne fournit que le
  **gabarit** (nombre de créneaux par jour), **jamais le nom du titulaire**.
- ✅ **Prérequis d'horizon — LEVÉ (Arthur, 24/07).** « Les consultations seront posées à horizon
  4 semaines. » L'écran ne pouvant lister que les consultations **déjà nommées**, cet engagement
  débloque le lot : plus aucun obstacle bloquant, ni technique ni organisationnel. ⚠️ Ne pas confondre avec
  le prérequis du Lot 5, **bien plus lourd** : ici **rien ne change** pour les secrétaires des
  chirurgiens ni pour le flux patient — c'est une seule habitude interne du comité. Coût réel :
  s'engager plus tôt, et retoucher un placement quand une absence tombe après coup.
- ❓ À traiter à la maquette : override **modifié après coup** (MAR remplacé sur son créneau) —
  l'outil suit le nouveau titulaire, mais les patients déjà placés sur l'ancien ne bougent pas.
- ✅ **Accès — acté 24/07/2026 : UNE page, DEUX portes.** Page unique à la **racine**, même vue en
  lecture seule pour tous. Entrée (a) **code personnel MAR** (mécanisme existant) ; entrée (b)
  **code partagé du secrétariat**, nouveau, rangé dans `CONFIG`, de **forme distincte** des codes
  MAR (pour désambiguïser au login) et **changeable en une ligne** s'il circule trop.
  → **Nommer par la fonction, pas par l'utilisateur** : `absences.html` /
  `controle-absences.html` — **pas** `secretariat.html`.
- ✅ **Périmètre — acté 28/07/2026 : cet écran ne concerne QUE le libéral**, jamais le public.
  Conséquences directes : la tuile porte `liberal:true` (**réservée au groupement**, `LIBERAL = O`,
  19 membres) ; seuls les membres du groupement sont proposés comme remplaçants — un non-membre ne
  peut pas prendre un patient libéral ; le serveur ne renvoie aucun montant à un non-membre
  (`if (!user.liberal)` dans `getConsultAbsences`), le masquage de la tuile ne protégeant rien
  puisque la page est publique.
- **Qui est proposé — couverture jour par jour, 28/07/2026.** Un confrère couvre le jour *i* s'il est
  **présent ce jour-là** et a une consultation **strictement avant**, celle-ci pouvant tomber
  **pendant** la période d'absence. Les plages couvertes sont affichées, aucun candidat n'est tronqué.
  → Remplace deux critères absolus (« présent sur toute la période », « consultation avant le début »)
  qui renvoyaient **« personne »** sur un congé réel de 19 jours ouvrés. Supprimés, pas amendés.
- **Classement des remplaçants — 28/07/2026.** Marge CCAM décroissante, calculée **côté serveur**
  dans `getConsultAbsences` : `getReleveLiberal` reste hors de `SECRETARIAT_ACTIONS`, et la réponse
  ne transporte qu'une marge par MAR, jamais tarifs, pourcentages ni excédents. L'appartenance vient
  de la **colonne `LIBERAL` de MEDECINS**, jamais du relevé — un membre au mois non saisi serait
  sinon retiré à tort. Aucune troncature : tous les candidats sont affichés.
  → Le jour où le secrétariat prend cette mission : remplacer la valeur par un rang quand
  `avecMotifs === false`. Une ligne, un seul endroit, la page ne bouge pas.
- 🔒 **Motif d'absence : VISIBILITÉ SELON LE RÔLE (acté 24/07).** Session **MAR** (code personnel,
  via la tuile Dashboard) → dates **+ motifs**. Justification : les MARs voient déjà le planning
  complet dans `index.html`, leur masquer le motif n'aurait aucun sens. Session **secrétariat**
  (code partagé) → **dates seules**.
  ⚠️ **Le filtrage se fait au SERVEUR, jamais au client.** L'action GAS ne renvoie pas les codes
  (`V`, `CP`, `F`, `RG`, `CL`, `TP`) dans une session secrétariat : les masquer en JS les
  laisserait lisibles dans le source de la page. **Deux réponses distinctes selon le rôle
  authentifié** → une page unique, **deux rendus**. C'est la contrainte la plus facile à oublier
  au moment de coder. *(À vérifier avant de coder : que l'action GAS identifie le type de session.
  Le code d'entrée étant transmis à chaque appel, a priori simple — mécanisme non lu à ce jour.)*
- **Session MAR : la file est filtrée sur ses PROPRES consultations (acté 24/07).** Usage visé : le
  MAR contrôle lui-même que ses patients ne seront pas opérés un jour où il est absent ; le panneau
  de droite montre alors toujours ses propres absences.
  ❓ **À trancher :** filtre **exclusif**, ou **actif par défaut avec bascule « voir tous »** ?
  Aucune raison de confidentialité de masquer les collègues (le planning leur est déjà visible) —
  c'est une question d'usage : un MAR peut vouloir vérifier un collègue lors d'un échange.
- **Exposition, acté explicitement :** pour les **MARs**, rien de neuf (le planning complet est déjà
  dans `index.html`). Pour le **secrétariat**, c'est un accès nouveau à toutes les absences de
  l'équipe — c'est l'objet de l'outil. Fuite du code partagé sans gravité : aucune écriture, aucune
  donnée patient, uniquement des dates.
- ⚠️ Ne pas réutiliser `getMARsDispoJour` tel quel (garde `TP`/`R` dans sa liste d'absence).
- 🎨 **Maquette v3** (poussée le 24/07, **supprimée du dépôt le 02/08/2026** — écran livré :
  `absences.html` ; la maquette reste consultable dans l'historique git). File des consultations posées à gauche, groupées par
  jour, **secteur affiché en clair** (Viscéral, ORL, Endoscopie… pas le code `CS-*`) ; pastille
  pleine/grise = ce MAR a ou non des absences **pertinentes pour CETTE consultation**. Clic →
  panneau droit : périodes à éviter, encadré « qui peut le prendre », grille 4 semaines, état
  « aucune absence » explicite. Vérifié par simulation : **92 créneaux = 23/semaine** (conforme à
  `CS_RULES`) et **aucun médecin proposé n'est absent** le jour visé.
- ⏱ **Fenêtre = 4 semaines À PARTIR DE LA CONSULTATION SÉLECTIONNÉE**, pas depuis aujourd'hui
  (acté 24/07). Une absence antérieure à la consultation est sans objet : le patient sera opéré
  *après* l'avoir vue. Conséquence à ne pas rater : **l'horizon de données doit dépasser de
  4 semaines la dernière consultation affichée** (dans la maquette, 45 jours ouvrés de données
  pour 20 jours de consultations).
- 📅 **Jours consécutifs regroupés en plages** (« 10 – 14 août » plutôt que cinq dates). Règle de
  fusion **différente selon le rôle** : vue **MAR** → fusion **à motif identique** (le motif étant
  affiché, deux motifs ne tiennent pas dans une seule plage) ; vue **secrétariat** → fusion **sans
  regarder le motif** (il n'est pas affiché).
  ⚠️ **Corollaire serveur : le regroupement se fait APRÈS le filtrage par rôle, jamais avant** —
  sinon on regrouperait sur une information que la secrétaire n'a pas le droit de recevoir.
- 🔎 **« Qui peut prendre ce patient ? » — acté 24/07.** Clic sur une période → MARs **présents sur
  TOUTE la période** (la proposition reste donc valable quel que soit le jour du bloc) **et ayant
  une consultation AVANT** cette période (impossible de voir en consultation un patient déjà
  opéré). Affichés **même secteur d'abord**, puis autres secteurs. C'est la **question inverse** de
  l'écran principal, déjà servie en production par `getMARsDispoJour`. Reste de la **lecture pure**
  : zéro écriture, zéro donnée patient. Rend le prérequis d'horizon 3–4 semaines encore plus
  déterminant (il faut des créneaux nommés pour proposer une alternative).
- ❌ **Notification au MAR sur sa tuile Dashboard — ÉCARTÉ (24/07).** Supposerait que le système
  connaisse les patients : il n'en connaît aucun, et c'est précisément ce qui rend le module simple
  et sans risque (contrainte 3.bis). Sans identité patient, la notification ne dirait que « votre
  consultation a changé » — le MAR ne pourrait ni refuser ni agir. Coût : créer un système de
  notifications inexistant, et faire passer l'écran de « lecture seule » à « écrit »
  (`WRITE_ACTIONS_LOCK`, verrous, réconciliation). Arthur : « tant pis ».
- ⚠️ **Règle générale — le dépôt est PUBLIC : aucune maquette ne doit contenir de noms réels de
  praticiens** (y compris dans les commentaires de code). Noms fictifs systématiques.

**Pistes abandonnées, à ne pas rouvrir.** *Attribution au fil de l'eau* (une consultation porte
plusieurs patients aux dates de bloc différentes, aucune permutation ne les satisfait tous).
*Interface patient* (sortirait du périmètre interne : identification, données de santé,
responsabilité → projet DSI).

Détail complet : `docs/module-liberal/module_liberal_conception.md` §11 ter.


## Version du site (badge `vX.Y.Z`) — actuellement **v1.17**

### 🔴 RÈGLE PERMANENTE (demandée par Arthur le 20/07/2026)

**Toute modification d'une page visible DOIT s'accompagner d'une montée de version, dans le
même push.** Le badge est porté par **4 fichiers, 8 emplacements** (comptés le 03/08/2026) :
`admin.html`, `dashboard.html`, `docs/guide-mar.html`, `docs/guide-comite.html`. `index.html`,
`indispos.html` et `staff.html` n'en portent pas. **Recompter avant chaque montée** plutôt que
se fier à cette liste.
Ne jamais livrer un changement d'interface sans incrémenter : le badge doit toujours dire la vérité.

| Nature du changement | Incrément | Exemple |
|---|---|---|
| Petit patch, correction, ajustement visuel | **3ᵉ chiffre** — `1.6` → `1.6.1` | cases cliquables au survol |
| Fonctionnalité notable, changement de comportement | **2ᵉ chiffre** — `1.6.1` → `1.7` | bascule des consultations sur l'onglet |
| Refonte majeure | **1ᵉʳ chiffre** — `1.x` → `2.0` | branchement du module libéral |

Une modification purement GAS (sans page touchée) ne change PAS la version du site : elle a ses
propres constantes `GAS_VERSION_*`.

**4 fichiers, 10 emplacements.** *(Corrigé le 29/07/2026 : ce document annonçait « 5 fichiers,
9 emplacements » et comptait `guide-technique.html`, qui ne porte aucune version — vérifié dans le
fichier ET dans le code du Diagnostic, qui ne contrôle que 4 fichiers.)*
Penser au badge HTML **en dur**, visible avant connexion tant que le JS ne l'a pas remplacé.

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · `id="verBadge">vX.Y<` · `// SITE_VERSION: vX.Y` |
| `admin.html` | idem (3) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · `<!-- SITE_VERSION: vX.Y -->` |
| `docs/guide-comite.html` | idem (2) |

Total : 3 + 3 + 2 + 2 = **10**. Le 🔍 Diagnostic (section « Version du site ») compare **toutes**
ces formes, dans chaque fichier et entre fichiers, et signale `INCOHÉRENT (…)` en listant les valeurs divergentes.
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

## Notifications de changement de planning (`code.gs`) — 01/08/2026, LIVRÉ **ÉTEINT**

*(Conçu dans un autre fil ; ce qui suit est **lu dans le code**, pas repris d'une conception —
les arbitrages de départ appartiennent à cette conversation-là.)*

**Principe : comparer deux états, jamais surveiller les gestes.** `planning_{Y}.json` (courant) vs
`planning_{Y}_notifie.json` (photo au dernier envoi, dans le même dossier Drive). Un changement
posé puis annulé avant l'envoi ne produit donc **aucun mail**.

- **Déclenchement** : `publishPlanning` appelle `notifPlanifier()` (3 lignes dans `Indispos.gs`,
  sous `try/catch` — un échec du notifieur ne fait jamais échouer la publication). Chaque appel
  **supprime le minuteur en attente et en repose un neuf** à `NOTIF_DELAI_MIN` = **10 minutes** :
  tant que le comité publie, rien ne part. Une soirée de travail ⇒ un seul envoi.
- **Interrupteur : propriété de script `NOTIF_ACTIVE`** (`'O'` = allumé). **Aujourd'hui éteint.**
  Éteint, ou à la toute première exécution, le module **prend la photo et se tait**.
  `NOTIF_EMAIL_TEST` redirige tous les envois vers une seule adresse — à utiliser pour l'essai.
- **Filtre** : un **changement de statut** (garde, RG, R, 18h, vacances, formation, TP, CL, CP,
  absence) est signalé **quelle que soit la date** ; un **changement de secteur** ne l'est que s'il
  tombe dans la **semaine couverte par le dernier Excel du vendredi 16 h**.
- **Destinataires** : `MEDECINS`, `ACTIF = O`, moins ceux dont la colonne **`NOTIF` vaut `N`**.
  La colonne est cherchée **par son titre** ; **absente, tout le monde est notifié**.
- **Quota vérifié avant le premier envoi** : s'il manque des jetons, rien ne part et l'erreur est
  journalisée — plutôt qu'un envoi à la moitié de l'équipe.
- **La photo n'est recalée que si l'envoi s'est passé sans erreur** : un changement non annoncé est
  repris à la publication suivante. Un JSON illisible interrompt **sans recaler**.
- **`notifRecaler(year)`** remet la photo à jour sans rien envoyer — à lancer après une génération
  annuelle ou un wizard, où `envoyerRecapGardes` fait déjà le travail.
- Un code de statut inconnu est affiché **brut**, jamais interprété.

⚠️ **Ménage post-démo du 04/09** : si le planning 2027 est publié pendant la démo, un
`planning_2027_notifie.json` apparaîtra dans le dossier Drive. À supprimer avec les deux autres.

## Bande de présence (`admin.html`, en tête de l'onglet Planning) — 01/08/2026

Un carré = une journée ouvrée, 5 lignes (lundi→vendredi) × 52 colonnes, couleur = **nombre de MAR
présents en journée**. Clic sur un carré → la semaine s'ouvre dans la grille.

- **Définition du présent : celle de `presentsPool` (`code.gs`, l.~895)** — statut du jour hors
  `ABSENT_CODES` (`RG V F CTP CP R A TP CL`) **et** MAR dans sa période d'activité
  (`date_debut` / `date_fin`). **`G`, `G2` et `18` comptent PRÉSENTS** (ils travaillent en journée,
  en réa et en maternité), **`I` aussi** (indispo de garde ≠ absence). `PRUNET` est exclu, comme
  dans `nonPlacesJour` : le comité ne le place pas.
  ⚠️ **Ne pas transformer cette liste en liste blanche** (« vide + 18 + G + G2 ») : `I` deviendrait
  absent à tort. La liste noire est la règle du serveur, c'est elle qui fait foi.
- **Aucun appel serveur** : tout vient de `DATA` et de `marsData`, déjà en mémoire. ~251 jours × 23 MAR.
- **Seuils de couleur : onglet `SEUILS`** (`CLE | VALEUR | DESCRIPTION`), lignes
  `SEUIL_PRESENCE_ALERTE` et `SEUIL_PRESENCE_CONFORT`. Onglet **créé et pré-rempli automatiquement**
  (13 et 17) par `getSeuils()` (`portail.gs`), servi par `getAdminBootstrap`. Absent ou illisible →
  `admin.html` garde ses valeurs de repli, jamais de blocage. **Volontairement séparé de `CONFIG`**,
  qui porte `ADMIN_CODE` / `SECRETARIAT_CODE` / `ANNEE_ACTIVE` / `INDISPOS_ACTIVE` : régler une
  couleur ne doit pas obliger à ouvrir l'onglet des codes d'accès (décision Arthur, 01/08).
- Bornes inversées dans l'onglet → corrigées à la volée, l'échelle reste monotone.
- **Première mesure réelle (01/08, année 2026) : 9 / 44 / 68 / 70 / 58 jours du rouge au vert**
  avec 13 et 17. Les cinq couleurs servent, aucune n'écrase les autres : les bornes par défaut
  tiennent. Le comité doit encore trancher les siennes.
- A **remplacé l'ancienne heatmap des indispos**, code orphelin (`renderIndispos` + CSS `.heatmap`
  / `.heat-*`) : ni `#heatmap` ni `#marGrid` n'existaient plus dans la page, la fonction n'était
  plus appelée, et ses seuils 75/65 étaient écrits en dur.

## Consultations : où vit la vérité

- **✅ SOURCE = onglet `CS_TEMPLATE`** depuis le 20/07/2026 (testé en production). `admin.html`
  appelle `getCsTemplate` au chargement et remplace ses 3 tables. Éditer l'onglet suffit à
  ouvrir/fermer un créneau. Colonnes : `CODE | LABEL | OUVRABLE | ACTIF | LUN_AM … VEN_PM`.
  `CODE` = clé technique (écrite dans `PLANNING_OVERRIDES` et le planning publié) : **ne jamais la
  renommer** ; pour changer d'organisation, ajouter des lignes et passer les anciennes à `ACTIF=N`.
  `LABEL` est libre (affichage seul).
- **`CS_TYPES`, `CS_OPENABLE`, `CS_REQUIRED`** (`admin.html`) sont **globales** (`let`) et
  remplies par `getCsTemplate`. ⚠️ **Il n'y a plus de repli silencieux** (29/07) : en cas d'échec
  de lecture, `CONFIG_KO.cs` reste vrai et un **bandeau rouge** le dit. Une page vide vaut mieux
  qu'une page fausse.
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

22 onglets **+ `SEUILS`** (créé le 01/08/2026 — bornes d'affichage, voir plus bas), dont **6 MASQUÉS** car jamais édités à la main : `SEMAINES_VALIDEES`,
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

## Performance — état arrêté au 01/08/2026

**Outils de mesure (les seuls, ne pas en recréer) :**
- **`chrono()`** dans la console des 5 pages : la page, les ressources, les appels
  (**avant `doGet` · `doGet` · réseau**), le détail des 10 étapes du bootstrap, les
  fonctions d'affichage, l'écran figé. S'affiche seul à l'ouverture d'admin.
- **`chronoClics()`** : le coût d'une interaction, en trois temps — **attente** (le
  navigateur était occupé) / **traitement** (notre code, le seul réductible) / **écran**
  (peinture). Chrome et Edge uniquement.
- **Menu Exécutions d'Apps Script** : durée TOTALE côté serveur, la seule qui inclue la
  compilation. À croiser avec `_srv_ms`, qui ne mesure que l'intérieur de `doGet`.
- Documentés au **§ 23 du guide technique**.

**Ce que la mesure a démenti le 01/08 — ne pas y revenir :**
- `renderWeek()` rappelée entièrement à chaque placement : **17 ms**. Le coût d'un clic est
  la **peinture** (100-230 ms), pas notre code (10-25 ms).
- Les 500 Ko d'`admin.html` : 0,44 s d'analyse, 2 % de l'ouverture.
- `JSON.parse`/`stringify` d'une réponse de 350 Ko : **6 ms**.
- **Le JS du navigateur coûte 0,1 s au total.**

**Cache de configuration (livré 01/08).** `CONFIG`, `SECTEURS`, `CS_TEMPLATE`, `SEUILS` en
`CacheService`, 10 min. Motif : les lectures d'onglets sautent d'un facteur 10 d'une minute
à l'autre (SEUILS+CS_TEMPLATE : 702 puis 6 956 ms) alors que les **lectures Drive sont
stables** (529 à 785 ms sur 7 relevés). Invalidation accrochée à `WRITE_ACTIONS_LOCK`,
bouton de purge dans Maintenance.

**🔒 Le cache de script est PARTAGÉ entre tous les utilisateurs.** On n'y met JAMAIS une
donnée qui dépend de qui appelle — sinon l'appelant suivant reçoit celles du précédent.
`MEDECINS` reste hors cache. Effet de bord : une modification faite **à la main** dans le
classeur (dont un **code d'accès révoqué**) met jusqu'à 10 min à prendre effet.

**Ouverture d'admin : UN SEUL appel** (`getAdminBootstrap`), ~5 s. Il livre identité,
planning, affectations, médecins, overrides, secteurs, seuils, modèle de consultations,
compteur de mails et existence de l'année suivante.

**Apps Script n'offre AUCUNE garantie de performance.** Service gratuit, partagé. Le vrai
enjeu d'un changement d'hébergement n'est pas la vitesse moyenne mais la **prévisibilité** —
et le 01/08 a chiffré ce qu'on paie à rester : de 2,7 s à 18,2 s d'attente hors exécution
pour le même appel, à trois minutes d'écart.

**Pour une démonstration en public (4 septembre) :** ne pas ouvrir la page en direct.
Charger et se connecter AVANT. La saisie d'indisponibilités est locale une fois la page
ouverte ; seul l'enregistrement final passe par le réseau.

**Pistes fermées — ne pas reproposer sans élément nouveau :** découper le projet GAS
(~150 ms mesurés, chantier annulé) ; supprimer les commentaires des `.gs` ; tailler les
lignes vides du classeur ; lire les JSON du Drive par identifiant ; fusionner `login` et
`getAdminBootstrap` (déjà fait).

**Reste ouvert :** le journal de connexion coûte 210 à 480 ms pour une ligne écrite — seul
poste ayant encore une marge ET de la variance.

## État : fonctionnellement terminé
**Ne PAS reproposer** : `config.html` (abandonné — couvert par les 5 onglets d'admin.html) ; **optimisation perf** du JSON (déjà minifié/gzip) ; patch GAS de robustesse cible (le garde frontend suffit).

**Restant / à surveiller (non urgent)** :
- **`Indispos.gs`** (version dépôt **`2026-07-20.3`**) — action **`resetCodeMar`** (bouton 🔄) et retrait d'`applyRotationLib`. **Recopié et testé en production le 20/07/2026.** **`code.gs` également à recopier** (version **`2026-07-20.3`** : retrait du tag `ROT-LIB` et des fonctions one-shot de conversion). Le 🔍 Diagnostic signale l'écart dépôt/déployé.
- ✅ **29/07/2026 (matin) — les 5 fichiers GAS ont été recopiés et déployés, fonctionnement confirmé en production.** Versions déployées : `code.gs` `2026-07-29.3` · `Indispos.gs` `2026-07-29.4` · `portail.gs` `2026-07-29.2` · `generateur_gardes.gs` `2026-07-29.1` · `setup_annee.gs` `2026-07-29.2`.
- ✅ **29/07/2026 (après-midi) — `Indispos.gs` `2026-07-29.5` recopié et déployé, alignement confirmé par le 🔍 Diagnostic.** Correctif du tri des volants (helper `_rangRole_`). **Plus rien en attente de recopie.** Site **v1.14.5** (frontend, rien à recopier).
- ✅ **30/07/2026 — `Indispos.gs` `2026-07-30.2` et `portail.gs` `2026-07-30.1` recopiés et déployés.**
  Fusion des indispos par propriétaire de code, action `saveIndisposBatch`, commentaire de la
  déclaration libérale réaligné (9 colonnes, une ligne = un patient).
- ✅ **30/07/2026 — `Indispos.gs` `2026-07-30.3` recopié et déployé, fonctionnement confirmé.**
  Bandeau Noël : plancher **8 en dur** (4 dates × 2 gardes, jamais regroupables) et **lecture de
  `CONFIG` supprimée** — les clés `NOEL_*` n'existaient pas. ⚠️ Conséquence : `CONFIG` ne porte
  plus que **six clés lues** (`ANNEE_ACTIVE`, `INDISPOS_ACTIVE`, `ADMIN_CODE`,
  `SECRETARIAT_CODE`, `GITHUB_TOKEN`, `ANTHROPIC_TOKEN`).
- ✅ **30/07/2026 (soir) — audit des 3 wizards.** `Indispos.gs` `2026-07-30.5` et
  `setup_annee.gs` `2026-07-30.1` recopiés et déployés. Site **v1.14.14**.
  **Plus rien en attente de recopie.**

## ⛔ L'année d'une date n'est PAS ses 4 premiers chiffres

Une **année de planning commence le premier LUNDI**, pas le 1er janvier : l'année 2026 court
du 05/01/2026 au **dimanche 03/01/2027**. Les tout premiers jours de janvier appartiennent donc
encore à l'année précédente — leurs gardes sont dans `GARDES_2026` et `planning_2026.json`.

- **Toute lecture d'un `GARDES_{Y}` ou d'un `planning_{Y}.json` faite À PARTIR D'UNE DATE passe par
  `anneePlanning(date)` (`code.gs`), jamais par `ds.slice(0,4)`.** Trois défauts en production
  venaient de là (voir ROADMAP du 29/07) ; volume mesuré : 5 jours ouvrés au passage 2028→2029.
- **EXCEPTION — les onglets `LIBERAL_{Y}` sont rangés par année CIVILE** de la date de bloc, parce
  que le relevé du groupement est calendaire. Ils utilisent `_libYearOf`, PAS `anneePlanning`.
  ⚠️ Ne pas « harmoniser » les deux : une semaine à cheval doit lire les DEUX onglets libéraux.
- **Une semaine se désigne par son LUNDI**, jamais par son numéro ISO : en 2028, 2034, 2040 et 2045,
  le n° 1 désigne deux semaines distinctes de la même année de planning (`_lundiDe` dans `admin.html`).

## 📦 Quand clôturer l'année : le premier lundi, JAMAIS avant

**Clôturer trop tôt** fait disparaître du portail les gardes des premiers jours de janvier (elles
appartiennent à l'année archivée alors que le système affiche déjà la nouvelle). **Clôturer en
retard** n'est qu'un inconfort d'affichage. Le risque est donc entièrement d'un seul côté.

Dates : **lundi 4 janvier 2027**, 3 janvier 2028, **8** janvier 2029, 7 janvier 2030.
Prérequis : le planning de la nouvelle année doit être **généré ET publié**.

**L'archivage n'est volontairement PAS automatisé** (décision du 29/07/2026) : un déclencheur
annuel est du code jamais testé, qui s'exécuterait sans personne pour vérifier que l'année
suivante est prête. À la place, le système **signale** — bandeau dans `admin.html` (rouge et bouton
désactivé si le planning suivant n'est pas publié) + ligne dans le 🔍 Diagnostic. **Ne pas
reproposer l'automatisation.**

## 🔬 Chercher un défaut : simuler, pas relire

Leçon du 29/07/2026. La relecture intégrale des pages HTML (16 000 lignes) n'a **rien** donné et a
été abandonnée. La même journée, extraire les vraies fonctions du dépôt dans un banc d'essai Node
et les **rejouer sur 22 années** a trouvé trois défauts en une heure — dont deux dans du code
écrit le jour même, invisibles à la relecture.
→ Partir d'une **famille de pannes** (frontières de dates, incohérences entre deux endroits qui
font la même chose, scénarios de rupture, échecs silencieux) et la traquer par script. Un objectif
ciblé produit des réponses ; le balayage produit du volume.
- **⚠️ Année active : 2026.** Le classeur contient `GARDES_2026`, `INDISPOS_2026`,
  `AFFECTATIONS_2026` et `STATS_GARDES_2026`. L'archivage de 2026 n'a PAS eu lieu ; il se fera en
  janvier 2027 (voir « Quand clôturer l'année »).
  ⚠️ **Mise à jour du 29/07/2026 — `INDISPOS_2027` EXISTE** (mesuré le 28/07 : 1000 × 365
  cellules), créé pour la campagne de saisie des indisponibilités 2027 en cours. Ce fichier
  affirmait « aucun onglet 2027 » : c'est **périmé**. Les gardes 2027, elles, ne sont pas encore
  générées (ce sera le Wizard 2, en novembre).
  **Règle qui ne change pas : vérifier l'état réel du classeur plutôt que de se fier à ce
  document.**
- **Mécanique d'archivage (quand elle servira, en janvier 2027)** : `archiveYear` écrit
  `stats_{Y}.json` dans le **Drive** et **déplace** les onglets `*_{Y}` vers `ARCHIVE_SS_ID`
  (`Planning_CHPG_Archives`). Détection via l'action GAS `getArchivedYears` (scan Drive des
  `stats_YYYY.json`) ; lecture des stats archivées via `_ssWithSheet()` (classeur actif sinon
  `ARCHIVE_SS_ID`), appliqué à `computeStatsLive` et `getStats`. Rappel : Initiale = équité figée
  à la génération, Instantané = équité réelle finale (les deux diffèrent légitimement).
- ✅ **Secteurs — CHANTIER TERMINÉ DE BOUT EN BOUT le 21/07/2026** (site v1.7.1). Un secteur ou
  une consultation se crée **dans un onglet du classeur** et va jusqu'à l'Excel du vendredi, sans
  code ni recopie Apps Script. Marche à suivre complète au **§ 18 du guide technique**.
  ⚠️ **Ne pas reconstruire.** Le plan d'exécution qui suit est conservé pour comprendre les
  décisions ; il est **réalisé**, pas à faire.
- *(Plan d'origine, réalisé)* **Secteurs étape 2 — plan validé (avant déménagement NCHPG/2027).** Objectif : bascule secteurs en quelques minutes dans un onglet, pas de hardcode. Constat : la config secteurs est **triplée et non synchronisée** — `admin.html` (`SECTEURS_CFG`, source riche), `index.html` (copie en dur `_SECTOR_BASE` + `SECLABELS`), `gas/code.gs` (`CS_TEMPLATE` par jour + règles CI→RI/`csAmRules`). `staff.html` n'a pas de secteurs. **Périmètre décidé : complet** (définitions + consultations). **On ne modélise PAS encore les secteurs NCHPG** — on construit le mécanisme rempli à l'identique de l'existant ; la bascule sera une simple édition d'onglet.
  - **Schéma validé — onglet `SECTEURS`** (1 ligne/secteur) : `ORDRE | CODE | LABEL | COURT | AFF | ICON | BG | FG | CS | ACTIF`.
  - **Schéma validé — onglet `CS_TEMPLATE`** (1 ligne/créneau conso) : `JOUR(1-5) | DEMI(AM/PM) | SECTEUR_AFFIL | CODE_CS | NB`.
  - **Workflow d'exécution** (après synchro des 4 `.gs`), chaque étape validée avant la suivante, **repli systématique sur les valeurs actuelles** à chaque étape (jamais de casse) : (1) `setupSecteursTab()` GAS — crée+remplit les 2 onglets à l'identique, idempotente ; (2) lecteur GAS `getSecteursConfig()` (caché) + injection d'un bloc `secteurs` dans les JSON publiés + action API `getSecteursConfig` ; contrôle non-régression = JSON identique + ce bloc ; (3) `admin.html` lit la config au chargement (repli sur `SECTEURS_CFG` actuel si l'API échoue) ; (4) `index.html` consomme le bloc `secteurs` du JSON au lieu de ses copies en dur. Bascule 2027 = éditer l'onglet (nouveaux codes BLOC CENTRAL, anciens en `ACTIF=N`), regénérer. La bascule CI→RI restera du code paramétré (logique, pas donnée).
- **Module libéral** (règle des 30 %, voir `docs/module-liberal/module_liberal_conception.md`).

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

## Banc d'essai du générateur (`simulateur/`)
`node simulateur/scenarios.js` (11 scénarios, invariants + équité) · `avant_apres.js` (dépôt vs copie patchée) · `chain.js` (dette sur 4 ans). Le harnais exécute le **vrai** `generateur_gardes.gs` dans Node avec un Google Sheets simulé. `demographie.js` porte le modèle d'absences calé sur la feuille réelle 2026 (~81 j bloqués/MAR/an). Règle : **aucune métrique ne doit se dégrader** avant un push sur l'algo.
Pièges d'outillage consignés dans `simulateur/experiences/2026-07_couverture_jours_serres.md` (portée de `shiftD`, colonnes MEDECINS, rythme 2/2 géré nativement, `pkill -f` qui tue le shell appelant, `process.chdir()` et chemins de sortie relatifs).

## Pour retrouver le contexte détaillé
Tu disposes d'une **mémoire** de nos sessions et des **transcripts** dans `/mnt/transcripts/` (voir `journal.txt` pour le catalogue). Consulte-les si tu as besoin d'un détail précis (code exact, décisions passées).

---
*Pour démarrer : donne-moi le token GitHub, dis-moi ce qu'on modifie, et vérifie d'abord l'état réel du dépôt.*
