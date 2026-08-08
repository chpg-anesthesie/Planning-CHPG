# Roadmap — Planning-CHPG

Système web pour le service d'anesthésie du CHPG (Monaco), ~23 MARs :
planning des gardes (équité annuelle), planning quotidien, consultations,
portail/Dashboard, module libéral, contrôle d'absence, veille biblio, CR d'anesthésie.

**Dépôt** `chpg-anesthesie/Planning-CHPG`, branche `main` · **Site v1.28** ·
**GAS** `code.gs` 2026-08-05.3 · `Indispos.gs` 2026-08-05.13 · `miroir.gs` 2026-08-05.10 ·
`journal.gs` 2026-08-05.3 · `portail.gs` 2026-08-05.2 ·
`generateur_gardes.gs` 2026-07-31.3 · `setup_annee.gs` 2026-08-03.1 ·
**Worker** `cloudflare/worker.js` 2026-08-05.7

**Banc d'essai** `banc/` — 440 vérifications, `cd banc && ./lancer.sh`.
À lancer AVANT toute proposition de push touchant une page visible, un `.gs`,
le Worker ou `partage/dispo_jour.js`.

*Mise à jour : 6 août 2026.*

> **Le dépôt en ligne fait foi.** Ce document est un repère de pilotage, pas la source de vérité
> du code. Les règles de méthode sont dans `CONTEXTE-Planning-CHPG.md` ; l'architecture et le
> dépannage dans `docs/guide-technique.html` ; la conception du module libéral dans
> `docs/module-liberal/module_liberal_conception.md`.

---

## 6 août 2026 — v1.28 : plus aucun appel inutile, guides refondus

**Livré**

- **Volet libéral par le miroir** (`portail.gs .2`, `miroir.gs .9`, Worker .7) :
  réponse allégée aux trois champs affichés — les montants restent au
  classeur — puis clé `liberal_{année}`, admin seule. Affichage instantané
  (3,8 s et 9,6 s mesurés auparavant).
- **Envoi du miroir par paquets de 20 clés** (`miroir.gs .10`) : la synchro
  complète échouait en bloc (« 20 clés maximum ») depuis l'ajout des familles
  courrier et libérale. Éprouvé jusqu'à cinq années (38 clés).
- **Alerte du jeton GitHub** (`Indispos.gs .13`) : ROUGE à 10 jours, orange à
  30, message centré sur la conséquence (« plus aucune publication ne part »).
- **Sélecteur d'année** (v1.26.2) : la liste du miroir fait foi pour toutes les
  années, futures comprises. 2027 disparaissait dès que le booléen
  `anneeSuivante` n'arrivait pas.
- **Message de publication unique et exact** (v1.26.1) : « Publication en
  route — vous pouvez fermer la page » au lieu d'un « publié en ligne » faux.
- **Panneau Modifications** (v1.27) : gardes lues au miroir, et surtout un
  échec n'est plus mémorisé comme une réponse vide (« aucune garde à cette
  date » affiché indéfiniment). Message + bouton Réessayer.
- **Rafraîchissement par glissement** (v1.28, index + dashboard) : iOS ne le
  fournit pas en mode application. Seuil 70 px, indicateur circulaire,
  ignoré si la page est défilée ou si le geste va vers le haut.
- **Journal de connexion en envoi à fond perdu** (index + dashboard) : le
  témoin d'activité ne s'allume plus sans raison visible.
- **Guides refondus** (MAR : 9 sections · comité : 14) : « En 2 minutes »,
  sections « je veux faire quoi », dépliables, blocs « Le geste », animations
  CSS conformes à l'interface, messagerie du portail. Corrections d'Arthur
  intégrées via export texte étiqueté (aller-retour Pages, zéro bloc perdu).
- **Cahier de tests** : 179 points, 5 corrigés, section P15 ajoutée, 40+
  marqués comme couverts par le banc.

**Banc d'essai : 181 → 440 vérifications, 20 scripts**

Ajouts : accès et rôles (P1), scénarios catastrophe (P12), équipe et absences
longues (P5), garde-fous annuels (P11), indisponibilités (P6), calendrier et
fériés monégasques (P2/P3), plafond de clés, rafraîchissement par glissement.

**Corrections de méthode**

- Un lot de fichiers se pousse en **UN SEUL COMMIT** (API git/trees) : sept
  push séparés = sept publications, six annulées, mise en ligne retardée.
- Toute modification repart de **la version en ligne**, jamais d'une copie
  locale — un `dashboard.html` reconstruit depuis une copie périmée a affiché
  v1.24 après un push v1.28.

**Reste à faire**

- Séance PC : recopier `portail.gs`, `miroir.gs`, `Indispos.gs` + Worker,
  déployer une nouvelle version, relancer `miroirSyncComplet`.
- Relecture des guides par Arthur (fichiers texte étiquetés fournis).
- Captures d'écran dans les guides, si souhaité.
- `gardeExceptionnelle` : code mort côté serveur, aucun bouton ne l'appelle.
- Répétition générale du cahier (P1 à P6) fin août, avant la démo du 4/09.
- Renouvellement du jeton GitHub : **mi-octobre 2026**.

## 5 août 2026 — Journal d'intentions, banc d'essai, statut vs placement

**Livré (site v1.24)**

- **Journal d'intentions Cloudflare** (`journal.gs` NOUVEAU, Worker `.6`,
  admin v1.23) : les gestes du comité déposent une fiche chez Cloudflare
  (~150 ms) ; l'applicateur GAS tire chaque minute et applique dans l'ordre.
  Registre d'audit 90 jours. Repli GAS intégral sur chaque dépôt.
- **Accroche miroir différée** (`miroir.gs .6` puis `.8`) : la construction du
  miroir sort de la requête d'écriture. Racine des écritures lentes du 04/08.
- **Audit des familles miroir** (`.5`) : chaque action ne pousse que ce qu'elle
  modifie (un lot de placements → `config_admin` seul, plus `planning`).
- **Le dernier geste gagne** (`Indispos.gs .11`) : poser V/F/TP/CL/A retire les
  placements de ces jours-là (ciblage date+MAR). TP et R restent plaçables
  (réquisition en dernier recours) — décision du service.
- **Placement caduc** (`code.gs .3`) : à la publication, un placement visant un
  MAR en vraie absence est ignoré et recensé ; la ligne reste au classeur et
  redevient active si le statut est retiré. Signalé au diagnostic.
- **Éditions manuelles du classeur** (`miroir.gs .8`) : `miroirSurEdition` pose
  la même note que les écritures du portail → copie de lecture à jour dans la
  minute au lieu d'une heure.
- **Compteur de courrier par le miroir** : badge visible à l'ouverture sans
  aucun appel Google (et même si Gmail est en panne).
- **Bascule d'année corrigée** (v1.22.1) : la valeur KV EST le planning brut ;
  le test cherchait un emballage inexistant → repli GAS silencieux à chaque
  bascule. C'était le « chargement infini ».
- **Témoin échantillonné** (v1.24) : 1 semaine sur 5 au lieu de chaque semaine
  parcourue, plus systématiquement après un écart.
- **Zéro appel Google à l'ouverture** : chauffages retirés, journal de
  connexion en envoi à fond perdu.

**Banc d'essai (`banc/`) — 181 vérifications, 11 scripts**

Le vrai code exécuté dans un Google et un Cloudflare simulés : fonctions GAS,
Worker réel, `admin.html` chargée et **pilotée au clic** (code saisi, case à
pourvoir cliquée, MAR choisi dans le panneau, publication, fermeture de page),
pages MAR et droits, scénarios adverses (crash entre application et purge,
Cloudflare KO, 404 HTML, concurrence, 200 fiches), mécanismes mobiles (onglet
gelé, `pagehide`, cache servant une ancienne page) et contraintes Apps Script
(budget d'exécution, refus de déclencheur, saturation 429).

**Règle de travail** : lancer le banc avant toute proposition de push touchant
`admin.html`, un `.gs`, le Worker ou le module partagé ; livrer chaque
correctif avec son test. Le banc prouve la logique, jamais l'infrastructure.

**Défauts trouvés par le banc avant la production** : verrous imbriqués
(15 s perdues par écriture), deux faux positifs de test qui masquaient un repli
silencieux vers Apps Script.

**Reste à faire**

- Séance PC : Worker → 4 GAS → nouvelle version → `miroirInstallerDeclencheur`
  (surveiller le journal d'exécution : le déclencheur d'édition peut être
  refusé) → diagnostic → test SEVERAC.
- Couvrir au banc : éditeur d'affectations, échanges de gardes, génération
  d'année, vacances.
- Répétition générale T154+ (`docs/cahier-de-tests.html`) avant le 4 septembre.

## Comment lire ce document

Le document est en **deux parties**.

**PARTIE 1 — Synthèse** (ci-dessous, ~2 pages). Ce qu'il faut savoir pour travailler aujourd'hui.

| Section | Ce qu'on y trouve |
|---|---|
| **Pièges** | Ce qui a déjà cassé la production. À lire avant de coder. |
| **Performance** | État arrêté, mesures de référence, pistes fermées. |
| **État par module** | Ce qui existe et les règles métier à ne jamais « simplifier ». |
| **À faire** | Par ordre de priorité réelle. |
| **Écarté** | Étudié, chiffré, refusé. **Ne pas reproposer sans élément nouveau.** |

**PARTIE 2 — Historique détaillé par chantier** (à partir de « ✅ Fait »). Conservé **intégralement** :
le détail d'implémentation, les décisions datées, les cas limites. C'est là qu'on cherche
« pourquoi tel choix a été fait » ou le nom exact d'une action, d'un onglet, d'une colonne.
**Rien n'y a été retiré** — la synthèse ne le remplace pas, elle y donne accès.

---

## ⚠️ Pièges — à lire avant toute intervention

### Issus d'erreurs commises (ne pas les refaire)

- **(03/08) Ne jamais écrire une donnée dérivée sans regarder la case d'arrivée.** Un don de
  garde écrivait le repos du lendemain sans vérifier ce qu'il écrasait. Le 26/03/2027 s'est
  retrouvé sans garde de réa pendant deux jours, sans le moindre signal. Toute écriture qui
  découle d'une autre (RG après G, récup après samedi) doit refuser si la case est occupée.
- **(03/08) Un geste non journalisé rend le diagnostic impossible.** `applyModification`
  n'écrivait rien dans `LOGS`. J'en ai déduit à tort qu'aucun don n'avait eu lieu, et cherché
  le bug dans le générateur pendant des heures. **L'absence de trace ne prouve rien.**
- **(03/08) Un contrôle sans destinataire ne sert à rien.** Le trou du 26/03 était détecté par
  le Diagnostic depuis le 01/08, avec la mention « À TRAITER IMMÉDIATEMENT ». Personne ne le
  lançait. Avant d'ajouter un contrôle, se demander qui le lira.
- **(03/08) Lire la fonction avant de proposer de l'étendre.** Trois propositions d'ajout au
  Diagnostic portaient sur des contrôles **qui existaient déjà** (rotation de `CONNEXIONS`,
  purge de `PLANNING_OVERRIDES`, couverture des gardes). Inventorier d'abord, proposer ensuite.
- **(03/08) Un cache de 10 minutes n'a rien à faire dans une tâche hebdomadaire.**
  `diagHebdo` lisait `CONFIG` via `_configRows_()` et a conclu « DIAG_EMAIL absent » sur une
  valeur périmée. Une tâche rare lit la source, pas le cache.

- **(01/08) Ne jamais ajouter de requête pour accélérer.** Apps Script sérialise les
  exécutions d'un même utilisateur. Un « appel de réveil » et un délai d'abandon court avec
  rejeu ont tous deux CASSÉ l'ouverture d'admin le jour de leur livraison, et ont été
  retirés. Voir la RÈGLE ABSOLUE, § Performance.
- **(01/08) Ne jamais reconstruire un correctif sur une copie non revérifiée.** Un patch
  GAS a failli être poussé sur une copie d'`Indispos.gs` antérieure au push précédent : il
  aurait annulé `_glob_ms` en silence. Toujours re-télécharger le fichier AVANT de le
  modifier, même si on l'a lu une heure plus tôt.
- **(01/08) Une hypothèse tirée de la lecture du code ne vaut rien tant qu'elle n'est pas
  mesurée.** Trois coupables « évidents » — `renderWeek`, le poids d'`admin.html`, le
  `JSON.parse` de la réponse — étaient tous innocents (17 ms, 0,44 s, 6 ms).

**0. Écrire une ligne entière, c'est écraser ce qu'on n'a pas chargé.** (30/07/2026)
`saveIndispos` remplaçait toute la ligne d'un MAR par ce qu'envoyait la page. Or `INDISPOS_{Y}`
a **deux propriétaires** (comité : VAC/FORM · MAR : INDISPO/SOUHAIT/TP). Résultat : revalider le
staff effaçait la campagne entière, et une page MAR ouverte trop tôt effaçait les vacances.
Aucune erreur, aucun message — le dernier qui enregistre a raison.
→ **Dès qu'une ressource a deux propriétaires, on fusionne, on ne remplace pas.**
→ Et un interdit posé dans le navigateur (`indispos.html` refuse de cliquer sur une VAC) **ne
protège rien** : ce n'est pas par le clic que la perte arrive.

**0 quater. Une mémorisation ne vaut que si sa clé couvre TOUTES ses sources.** (01/08/2026)
La bande de présence mémorisait son calcul sur `DATA` seul, alors qu'elle lit aussi `marsData`.
Or `loadPlanningData` et `loadStatusBar` partent **en parallèle** : `DATA` arrive d'abord,
`renderWeek` est appelée entre les deux, le compte vaut 0 partout — et ce 0 était mémorisé.
Le second `renderWeek` (celui de `loadStatusBar`) resservait le cache. Résultat : **0 présent sur
toute l'année, définitivement**, sans la moindre erreur affichée.
→ **Clé de cache = toutes les entrées lues.** Et tant qu'une entrée manque : ne rien calculer,
ne rien mémoriser (retour vide), plutôt que de figer un résultat faux.
→ Même famille que la TDZ du 28/07 : **l'ordre d'exécution est la première chose à vérifier**
quand un affichage est uniformément faux.

**0 bis. Déclarer un document « sans erreur » après un contrôle par sondage.** (30/07/2026)
`guide-fichier-maitre.html` a été annoncé exact ; le croisement avec `VEILLE_CFG-mode-emploi.md`
a révélé qu'il oubliait le type `GENERAL`. Le sondage prouve la qualité, jamais l'absence d'erreur.
→ Dire ce qui a été vérifié **et par quel moyen**, pas « tout est propre ».

**0 ter. La même règle métier écrite à quatre endroits finit par diverger.** (30/07/2026)
La rotation A/B/C vit dans `staff.html`, `admin.html` et **deux fois** dans `Indispos.gs`.
Le serveur tournait à l'envers depuis le début ; personne ne l'a vu parce que les deux ordres
coïncident **une année sur trois**. Découvert par un symptôme d'Arthur, pas par une relecture.
→ Avant de modifier une règle de classement, d'équité ou de rotation : **chercher toutes ses
copies dans tout le dépôt**, jamais seulement celle qu'on a sous les yeux.
→ Un bug qui ne se manifeste qu'une année sur trois ne se trouve pas en relisant : il se trouve
en **comparant deux implémentations** sur plusieurs années.

**0 quater. Un « succès » décidé sur un caractère de préfixe.** (30/07/2026)
`archiveYear` renvoie un rapport texte ; le succès se lisait à l'absence de `❌` en tête de ligne.
Les vrais échecs de transfert étaient des `⚠️` → succès annoncé, année basculée, onglets restés
en place. → Un contrat de retour doit être **structuré** (booléen, code), pas typographique.

**0 quinquies. Le banc d'essai ne teste pas le chemin de lecture du classeur.** (31/07/2026)
Le simulateur **fabrique** onglets et dates ; il ne relit jamais des libellés de mois réels. Les
400 années n'ont donc jamais exercé `reconstruireDatesHeaders` — bug de frontière d'année sorti en
30 s par la première génération réelle.
→ **Une validation ne vaut que pour le chemin qu'elle emprunte.** Dire *par quel chemin* un
composant est validé — et lister ceux qui ne le sont pas.

**0 sexies. Un indicateur qui ne détecte jamais rien doit prouver qu'il sait détecter.** (31/07/2026)
Le compteur « 0 journée sans binôme » bâtissait son dictionnaire **à partir des gardes existantes** :
une journée entièrement vide n'y figurait pas. Il répondait 0 quoi qu'il arrive.
→ **Contrôle négatif obligatoire** : fabriquer le défaut, vérifier qu'il est vu. Appliqué ensuite
aux 5 contrôles du planning et au patch de frontière d'année — les deux fois, il a servi.
→ Même famille que le garde-fou mort du W2 (`.length` sur un dictionnaire).

**0 septies. Un chiffre dont je n'ai pas lu le calcul est une rumeur.** (31/07/2026)
Sept chiffres annoncés dans la journée se sont révélés faux — jamais par erreur de raisonnement,
toujours parce que la **source n'avait pas été lue** : compteur écrit des semaines plus tôt,
commentaire obsolète, deux mesures aux définitions différentes comparées entre elles.
→ Marquer la **provenance** : *lu dans le code* · *mesuré, et par quoi* · *supposé*. Sans
provenance = supposé.
→ Les 7 erreurs ont été trouvées par les **questions de mécanisme d'Arthur**, jamais par relecture.
Une question sur le résultat ne trouve rien ; une question sur le mécanisme trouve tout.

**1. Une déclaration placée trop bas dans le fichier casse tout, en silence.** (28/07/2026)
Dans `admin.html`, la file d'appels `_fileAPI` (`let`) avait été déclarée ligne 2036 alors que la
connexion automatique l'utilise ligne 1801. Une variable `let` n'existe pas avant sa ligne : le
tout premier appel échouait **à chaque rechargement**, l'exception était avalée par un `catch`, et
trois appels de repli partaient par-dessus. Quatre symptômes apparemment distincts, une seule
cause. Coût : une journée.
→ `tryAutoLogin` doit rester **la dernière chose du gros bloc `<script>`**. Ne jamais la remonter.
→ **L'emplacement d'une déclaration est une décision technique, jamais éditoriale.**

**2. Une section déclarée « terminée » sans vérifier le chemin complet.** (20/07/2026)
Le chantier « créer un secteur » a été annoncé fini alors que la création de bout en bout ne
fonctionnait pas. → Vérifier le trajet réel avant d'écrire « terminé ».

**3. Une 4ᵉ liste en dur, invisible aux recherches.** (21/07/2026)
Des tables figées dans le code doublonnaient les onglets du classeur. Une recherche partielle ne
les avait pas trouvées. → **Une recherche négative ne prouve rien tant qu'elle n'est pas
exhaustive** (tout le dépôt, pas les deux fichiers auxquels on pense).

**4. Un générateur livré puis retiré le même jour.** (23/07/2026)
La version fermait tous les trous de garde mais **dégradait l'équité des week-ends** — non détecté
parce que seule la déviation globale était mesurée. → **Mesure d'équité par axe obligatoire**
avant toute livraison du générateur (`simulateur/eval.js`).

**5. Quatre versions successives d'une même fonction en un après-midi.** (28/07/2026)
Le préchargement du panneau de placement a demandé 4 itérations, dont 3 régressions livrées en
production. Point commun : les défauts n'apparaissaient que dans **l'usage réel** (navigation
rapide, clic pendant un chargement, retour en arrière), jamais sur le chemin nominal.
→ **Quand la même fonction casse deux fois, arrêter de patcher** et repartir d'une analyse.
→ Tester les scénarios d'usage réel **avant** de pousser, pas après le retour d'Arthur.

**6. Un gain annoncé sans être mesuré.** (29/07/2026)
« Faire voyager les gardes avec le login » devait gagner ~4 s. Gain réel mesuré : **130 ms** — le
second appel n'était pas sur le chemin critique. → Le gain d'un appel supprimé n'est réel que s'il
est **bloquant**. Mesurer l'instant d'affichage de l'information utile, pas le nombre d'appels.

**7. Un commentaire périmé maintenu sous un correctif.** Une décision qui ne vaut plus se
**supprime et se remplace**, elle ne s'empile pas — git garde l'historique.

### Pièges techniques

- **ExcelJS** : écrire dans une cellule *esclave* d'une fusion casse le fichier en production.
- **Cache `sessionStorage`** : une colonne ajoutée à un onglet reste invisible tant que la session
  n'est pas fermée (`Ctrl+Maj+R` ne suffit pas). **Versionner les clés** à chaque changement.
- **Clé de semaine** : ne jamais la fonder sur le numéro de semaine (frontières d'année).
- **`.length` sur un dictionnaire vaut `undefined`.** `getAllIndispos` renvoie `{date: code}` par
  MAR : `ind.length === 0` est toujours faux, le garde-fou du W2 n'a jamais rien détecté.
  Utiliser `Object.keys(x).length`. Un test qui ne lève jamais d'erreur peut ne jamais rien tester.
- **Une boucle d'appels côté page = N exécutions sérialisées.** Apps Script sérialise les appels
  d'un même utilisateur : `doValidate()` faisait 23 allers-retours (~3 min, pris pour un plantage).
  **Dès qu'une action porte sur toute l'équipe, c'est un batch** — 1 lecture, 1 écriture de bloc.
- **Rendre un état persistant peut rendre permanent un défaut jusque-là passager.** Les cadenas de
  `staff.html` masquaient le libellé VAC/FORM ; invisible tant qu'ils s'effaçaient au rechargement,
  gênant dès qu'ils ont duré. *(Ici les couleurs suffisaient : bleu = VAC, violet = FORM.)*
- **Codes d'accès** : insensibles à la casse depuis le 27/07 (mobile vs PC). Un code vide est
  refusé explicitement. Format : éviter `&` (coupe les URL) et `O`/`0`/`I`/`1`.
  **Aucune limite de longueur** : les trois `maxlength` des champs de saisie ont été retirés le
  29/07 (`indispos.html` 8, `staff.html` 20, wizard `admin.html` 12). Ils tronquaient un code
  saisi à la main **sans aucun message**, et le code était ensuite déclaré invalide. Ne jamais
  remettre de `maxlength` sur un champ de code.
- **Verrou d'écriture** : toute nouvelle action qui écrit doit rejoindre `WRITE_ACTIONS_LOCK`
  (`Indispos.gs`). Les lectures ne le prennent jamais.
- **Motifs d'absence** : filtrage **serveur**, jamais navigateur. Le rôle secrétariat est une
  liste blanche de deux actions — ne jamais y ajouter `getPlanningJson`.

---

## 🚀 Performance — état arrêté au 01/08/2026

### 🪞 Miroir Cloudflare — LIVRÉ (04/08/2026) — remplace la lecture GAS à l'ouverture

Le tableau du coût d'un appel ci-dessous reste EXACT — c'est précisément pourquoi la lecture
a quitté Apps Script. Worker `chpg-miroir` + KV `CHPG_MIROIR`, alimentés par `gas/miroir.gs`
(accroche `doGet` sur écriture + synchro horaire). Pages branchées : index, dashboard
(+ tuiles), indispos, admin (site v1.18.5). Repli GAS intégral au moindre écart ; rejeu de
transport sur les 4 pages ; après une écriture la page relit le circuit direct (KV ≈ 60 s).
Détail complet : CONTEXTE « État au 4 août 2026 » et guide technique § 25.
**Ne pas rouvrir** : recalcul client du panneau semaine, cache page pour Statuts/Équité,
clé miroir pour `getVacConfig` (par MAR) — décisions motivées du 04/08.

### Le coût d'un appel, DÉCOMPOSÉ (mesuré le 01/08, chiffres à jour)

Le 01/08 a produit la première décomposition réelle. Elle corrige la formule du 29/07
(« le seul levier est le nombre d'appels ») : **le poids du projet compte aussi**.

| Poste | Durée | À qui |
|---|---|---|
| Plancher de la plateforme | **~1 400 ms** | Google — irréductible |
| Compilation des 545 Ko de `.gs` | **~730 ms** | nous |
| Lecture du classeur avant `doGet` (`TEST_YEAR`) | ~430 ms | nous — **supprimé par le cache** |
| Travail utile | 14 ms à 4 500 ms | nous |

**Méthode de mesure (à reproduire, elle seule fait foi) :** créer un projet Apps Script
**vide** (`doPost` renvoyant `{}`), le déployer en Web App « Exécuter en tant que moi /
Tout le monde », puis appeler ALTERNATIVEMENT le projet vide et le vrai, 5 fois chacun,
depuis la même console. Le 01/08 : **témoin 1 417 ms · projet réel 2 580 ms → écart
1 163 ms**, qui est notre code. Alterner est indispensable : les deux subissent alors la
même minute, et aucune comparaison entre deux heures différentes n'est valable.

### Ce qui décide vraiment des mauvais jours

Le terme **hors exécution** (file d'attente / redirection Google) a valu **2 656 ms puis
18 191 ms à trois minutes d'écart** le 01/08, à code identique. Aucune optimisation ne le
touche. C'est lui qui produit les ouvertures à 30 s ou 1 min, et c'est le seul argument
sérieux en faveur d'un changement d'hébergement.

**→ Réduire le NOMBRE d'appels reste le premier levier** : chaque appel est une occasion
supplémentaire de tomber sur un mauvais moment. L'ouverture d'admin est passée de 3 appels
à 1 le 01/08 — de 50-107 s à ~5 s.
**→ Réduire le nombre d'allers-retours vers SHEETS est le second** (voir le cache ci-dessous).
**→ Ne jamais mesurer un gain sur une base instable.**

### ⚠️ RÈGLE ABSOLUE : ne JAMAIS ajouter de requête pour « aller plus vite »

Apps Script sérialise les exécutions d'un même utilisateur. **Toute requête ajoutée
occupe la file et retarde les autres.** Deux tentatives du 01/08 l'ont prouvé en cassant
l'ouverture d'admin, et ont été retirées le jour même :

- **Appel de « réveil »** (un `getActiveYear` envoyé pendant que l'utilisateur tape son
  code) : il a retardé le bootstrap de 18,5 s. Retiré.
- **Délai d'abandon court + rejeu** (25 s au lieu de 2 min sur les lectures) : il
  abandonnait des réponses **encore en route** et envoyait un second appel derrière le
  premier, qui continuait de tourner côté serveur — la file doublait. 4 appels en échec,
  page inutilisable. Retiré.

Le commentaire d'`admin.html` l.~2124 le disait depuis le 28/07 : *« sur une file
d'attente saturée, rejouer AGGRAVE l'engorgement »*. Il a été enfreint quand même.

### Ce qui a été livré

| Chantier | Avant | Après |
|---|---|---|
| Enregistrer 20+ placements | 34 appels, **10 perdus en silence** | 1 appel groupé, zéro perte |
| Ouvrir une case du planning | 2 appels par jour (~5 s) | 0 — préchargement semaine |
| Ouvrir `admin.html` | 4 appels bloquants | 1 (`getAdminBootstrap`) |

- **File groupée des placements** (`savePlanningOverridesBatch`) : badge « N en attente », lot
  rejouable sans doublon, persistance `localStorage`, envoi de secours à la fermeture, et
  **vidage bloquant avant publication** — on ne publie jamais avec des placements non écrits.
- **Préchargement du panneau** (`getPanneauSemaine`) : un appel pour les 7 jours, déclenché après
  500 ms d'immobilité (traverser 12 semaines = 1 appel). Cache invalidé après changement de statut.
- **Bootstrap enrichi** : compteur de mails et existence de l'année suivante (`anneeSuivante`,
  listage Drive sans lecture de fichier) livrés dans la réponse, au lieu de deux appels séparés.
- **Chronomètre** `chronoAPI()` : affiche **départ (T+), serveur et attente** séparément, grâce au
  champ `_srv_ms` posé par l'enveloppe GAS. ⚠️ `doGet` n'est plus l'aiguillage : celui-ci s'appelle
  **`_routeRequete_`**, `doGet` ne fait que le chronométrer.
- **CONFIG lu une seule fois par exécution** (memo `_configRows_` de `code.gs`, utilisé par
  `getActiveYear`, `getIndisposYear`, `_indisposOuverte_` et `checkCode`) : les ~1,5 s de
  relectures sont récupérées. ⚠️ Toute action qui **écrit** dans CONFIG doit appeler
  `_configReset_()` juste après, sinon la suite de la même exécution relit l'ancienne valeur.
- **Chantier performance CLOS le 30/07/2026**, vérifié en lecture du code en ligne (et non au
  ROADMAP, qui était périmé) : `mailNonLus`, `getSecteurs` et `getCsTemplate` sont dans
  `getAdminBootstrap`, et `gas/mesure_perf.gs` a été supprimé du dépôt **et** de l'éditeur Apps
  Script (confirmé par Arthur le 30/07).

### ⛔ `dashboard.html` — piste fermée, ne pas la rouvrir

Mesuré chez Arthur : 2 appels, ~10,6 s. Deux optimisations étudiées **et écartées sur mesure** :
1. **Gardes livrées par le `login`** → gain réel **130 ms**, pour une lecture Drive (~1 s serveur)
   ajoutée à chaque login de MAR. Rapport défavorable, non livré.
2. **Login et planning en parallèle** → impossible : **Apps Script sérialise les exécutions d'un
   même utilisateur** (4 appels parallèles = 4 à 7 s chacun contre 1,8 s seul).

**`dashboard.html` est à l'optimum de ce qu'Apps Script permet.** Ses ~10 s sont 2 × le péage.

### Comparatif d'hébergement (mesuré le 29/07, même poste, réponse vide des deux côtés)

| | Cloudflare Workers | Apps Script |
|---|---|---|
| Mesures | 93 · 101 · 204 ms | 2,62 · 2,80 · 2,85 · 3,02 · 4,00 s |
| **Médiane** | **~100 ms** | **~2 850 ms** |

**Facteur ≈ 28.** Apps Script fait **deux allers-retours** par appel (redirection puis contenu),
Cloudflare un seul — pénalisant sur connexion à forte latence.

⚠️ **Ce que la mesure ne dit pas** : le coût de lecture des données depuis une plateforme externe.
Sur `admin.html`, le travail serveur (~4,8 s) domine désormais le péage : migrer y serait
décevant. Sur `dashboard.html` et `index.html` (lecture pure), le gain serait franc.
**Décision : chantier non lancé** (effort de plusieurs semaines, duplication des codes d'accès de
23 médecins sur une plateforme tierce, second service à maintenir seul, et calendrier du 4/09).

### Cache serveur des onglets de configuration — LIVRÉ (01/08/2026)

`CONFIG`, `SECTEURS`, `CS_TEMPLATE`, `SEUILS` sont gardés en `CacheService` (10 min).
Helpers dans `code.gs` (`_cacheLire_`, `_cacheEcrire_`, `viderCacheConfig`), lecture
mise en cache dans `portail.gs`, invalidation accrochée à **`WRITE_ACTIONS_LOCK`** dans
`_routeRequete_` (et non action par action : une écriture ajoutée demain sera couverte
sans que personne y pense). Bouton **🧹 Vider le cache** dans l'onglet Maintenance.

**Motif : la VARIANCE, pas la moyenne.** Mesuré le 01/08, deux ouvertures à trois minutes
d'écart, code identique :

| | 15:03 | 15:06 |
|---|---|---|
| SEUILS + CS_TEMPLATE | 702 ms | **6 956 ms** |
| SECTEURS | 432 ms | 1 291 ms |
| MEDECINS | 257 ms | 1 048 ms |
| **Fichiers Drive (planning, affectations)** | **548 / 588 ms** | **542 / 551 ms** |

**Les lectures Drive sont stables (7 relevés : 529 à 785 ms). Les lectures d'onglets
sautent d'un facteur 10.** Chaque aller-retour vers Sheets est une occasion de tomber sur
un mauvais moment ; le bootstrap en faisait 6, il en fait 3.

Résultat mesuré : SEUILS+CS_TEMPLATE 764 → **15 ms**, SECTEURS 359 → **11 ms**,
`avant doGet` 868 → **13 ms**. `doGet` : 2 943 → **2 551 ms**.

**🔒 RÈGLE DE SÉCURITÉ — le cache de script est PARTAGÉ entre tous les utilisateurs.**
On n'y met JAMAIS une donnée qui dépend de qui appelle. Les quatre onglets retenus sont
globaux. Y mettre un planning de MAR, des indisponibilités ou des déclarations libérales
serait une faille : l'appelant suivant recevrait les données du précédent.
`MEDECINS` reste hors cache (réécrit par les formulaires, et 250 ms ne valent pas ce risque).

**Effet de bord à connaître :** une modification faite **à la main** dans le classeur met
jusqu'à 10 min à prendre effet — y compris un **code d'accès révoqué**. Le bouton de purge
est là pour ça. Toute modification passant par l'interface est immédiate.

### Pistes fermées (performance)

- Tailler les lignes vides du classeur (ouverture = 120 ms pour 1,7 M de cellules).
- Lire les JSON du Drive par identifiant direct (396 ms contre ~350 ms par nom).
- Optimisation du JSON (déjà minifié + gzip).
- **Découper le projet GAS** (sortir `generateur_gardes.gs` + `setup_annee.gs`) : mesuré
  le 01/08, la compilation vaut ~730 ms au total et ces deux fichiers pèsent 115 Ko sur
  545, soit **~150 ms**. Plusieurs semaines de travail et une architecture éclatée pour un
  septième de seconde. **Chantier annulé.**
- **Alléger le code en supprimant les commentaires** (24 % des `.gs`, 130 Ko) : on
  n'échange pas la documentation du projet contre des millisecondes.
- **`JSON.parse`/`stringify` de la réponse** : soupçonné coûteux sur 350 Ko, **mesuré à
  6 ms**. L'enveloppe `_srv_ms` insère désormais ses champs par concaténation de chaîne
  (gain nul mais code plus simple). Rappel : la taille d'un JSON ne dit rien de son coût.

---

## ✅ État par module

### Algorithme de gardes
Équité annuelle sur ~730 gardes/an, dette calculée depuis les colonnes `CIBLE*` du snapshot
`STATS_GARDES_{N-1}` (déjà pro-ratées par la présence), jamais des réels seuls.
Invariants : Σ dette = 0 par axe, repli si les cibles manquent.
**Couverture des jours serrés livrée (23/07)** : 13 jours sans binôme → 0 sur 140 années simulées,
équité et vitesse meilleures que la référence. Mécanisme décisif : passe de dernier recours.
⚠️ Ne jamais régénérer une année déjà générée (verrou de `generateGardes()`).

### Planning quotidien (`admin.html`)
Grille du comité, placement par cases, publication vers les JSON du Drive privé.
`SECTEURS` et `CS_TEMPLATE` sont la configuration — **il n'existe plus aucune copie en dur**
(6 supprimées le 29/07, dont 2 cachées dans l'export Excel). Échec de lecture ⇒ bandeau rouge
`configBanner` + **export Excel refusé** ; la grille s'affiche amputée, jamais fausse en silence.
⚠️ Restent deux listes de secteurs figées, hors config : voir Priorité 3.
⚠️ **`RI` ne doit pas rejoindre `COVERAGE`** — sa règle (mercredi/jeudi matin) est plus fine, et
il n'y a jamais de bloc cardio le jeudi.
⚠️ Les **sorties de garde restent groupées** dans l'Excel : le statut `RG` est unique, rien ne dit
de quelle garde sort la personne.
🆕 **Bande de présence en tête de l'onglet** (01/08, v1.15) : un carré = une journée ouvrée,
couleur = nombre de MAR présents (définition `presentsPool` de `code.gs`, **`G`/`G2`/`18`/`I`
comptent présents**, `PRUNET` exclu). Clic → ouvre la semaine. Aucun appel serveur. Seuils dans
l'onglet **`SEUILS`**, servi par `getAdminBootstrap`, repli silencieux 13/17. Détail complet dans
`CONTEXTE`. A remplacé l'ancienne heatmap des indispos, devenue code mort.

### Notifications de changement de planning (`code.gs`, 01/08/2026) — EN ESSAI, allumage planifié
Compare `planning_{Y}.json` à `planning_{Y}_notifie.json` après **10 minutes d'accalmie** suivant la
dernière publication ; un changement posé puis annulé ne produit aucun mail. Statut ⇒ signalé
toujours ; secteur ⇒ seulement dans la semaine du dernier Excel. Détail dans `CONTEXTE`.
**Essai réel validé par Arthur le 07/08/2026** : `NOTIF_ACTIVE='O'` + `NOTIF_EMAIL_TEST` posées —
tout part sur sa boîte perso, rien aux MARs (`_notifExpedier` : `email: testMail || vraie adresse`).
**Allumage = supprimer la propriété `NOTIF_EMAIL_TEST`, à faire APRÈS le staff et le ménage du
04/09 — jamais avant** : la démo publiera un planning 2027 fictif et le notifieur s'armera dessus
(`journal.gs` l.140) ; avec la redirection en place, ces mails fictifs tombent chez Arthur.
Colonne **`NOTIF`** de `MEDECINS` : **facultative** (absente ⇒ tout le monde reçoit), cherchée par
son nom — à créer au premier désabonnement, pas avant.
Pas de doublon avec le récap de génération (vérifié 07/08) : `generateur_gardes.gs` n'arme jamais
le notifieur ; seule la première **publication** du planning 2027 le fera, et elle sera silencieuse
(pas de photo de référence après le ménage → « photo prise, aucun envoi », l.1573).
`notifRecaler` : outil de secours si une photo de référence préexiste à une génération — inutile en
novembre, le ménage supprime la photo. Les arbitrages de conception (accalmie, deux canaux, filtres
d'horizon) ne sont écrits nulle part — à consigner avant de les perdre.

### Portail / Dashboard
`dashboard.html` est **le seul carrefour** : toutes les pages s'ouvrent depuis ses tuiles.
Service worker sur cette page uniquement (suffisant, tout le monde y passe).

### Module libéral — lots 0, 1, 3, 2A et 2B en production
Le MAR cote, édite un devis, déclare son intervention ; le comité la voit au placement.
Détail complet : `docs/module-liberal/module_liberal_conception.md`.

**Règles métier à ne jamais « simplifier » :**
- Seuil de **30 % par axe**, CCAM et NGAP **indépendants**. La réa ne corrige que le CCAM.
- **Une ligne = un patient** (`LIBERAL_{Y}`, 9 colonnes). La fusion jour+secteur a été supprimée.
- `BR_CCAM` est datée du **bloc**, `BR_NGAP` de la **consultation** — souvent deux mois différents.
- **Le DH n'est jamais déclaré** (hors quota) et ne se répartit pas par acte.
- **Le rendement se ventile, il ne se somme pas** : le relevé certifié fixe le niveau, les BR
  déclarées la structure.
- **Jamais de % issu des seules déclarations** : le dénominateur (activité publique) n'existe que
  dans le relevé. Les déclarations donnent un **volume**, jamais un pourcentage.
- Tarifs NGAP (annexe III CCSS-CAMTI au 01/10/2025) : `C 34,40 · CS 46,00`. **L'APC est une
  cotation française, absente de la nomenclature monégasque.** Les tarifs ameli ne valent pas ici.
- `SPECIALITES` : 12 codes. **Patient mineur ⇒ `PED`**, quelle que soit la chirurgie.
- Index CCAM **v84** (régénéré le 27/07, codes et tarifs sur la même version).
  Alerte d'obsolescence calendaire à 8 puis 14 mois. **Prochaine régénération vers mars 2027.**
- ⚠️ Le devis affiche « secteur 2 (honoraires libres, non-OPTAM) » **en dur** — exact pour Arthur,
  potentiellement faux pour un autre MAR, et invisible si ça l'est.
- ⚠️ **Point ouvert CHPG/DAM** : le modèle CNOM réserve l'information sur les actes **au seul
  patient**, y compris vis-à-vis des complémentaires. Non tranché pour Monaco.
- ⚠️ **Constat du 27/07 : 10 MAR sur 18 en excédent** au cumul de juin, dont 2 sur le seul axe
  NGAP. Fragilise l'hypothèse ayant servi à geler le Lot 5 — à revérifier sur 2-3 mois.

### Contrôle d'absence (`absences.html`, Lot 5-bis) — en production
Deux portes : tuile MAR et session secrétariat.
🔒 Les **motifs d'absence ne sont jamais transmis au secrétariat** (filtrage serveur).
`G`/`G2` ne comptent pas comme absence. Rôle secrétariat = liste blanche de deux actions.

### Veille bibliographique, CR d'anesthésie
En production. **Refonte du 08/08/2026 validée en production** : module autonome
`gas/veille.gs` (2026-08-08.4), règle « revue ET thème », 41 revues (23 directes +
18 généralistes sous liste blanche `PUBTYPE`), 21 thèmes, fenêtre 180 j, POST +
pagination, dates `epubdate`, codes SOURCE conformes à l'écran — 79,5 art./semaine
mesurés (cible 50-80). Filtre par revues cochées côté dashboard (v1.29). *(L'alerte « `markVeille` sans verrou ni contrôle de rôle » a été retirée le 29/07
après vérification du code : le secrétariat est déjà refusé en amont par `SECRETARIAT_ACTIONS`,
et l'action écrit **une seule cellule ciblée par PMID**, sans lire-modifier-écrire ni suppression
de ligne — son exclusion de `WRITE_ACTIONS_LOCK` est délibérée et documentée.)*

### Sécurité et robustesse
Audit en 5 axes (19-20/07) : toutes les actions derrière `checkCode()`, aucun code renvoyé en
clair, verrou d'écriture, journalisation « qui/quand » sans contenu clinique, XSS fermée dans le
volet libéral (26/07), `getReleveLiberal` réservé aux membres du groupement (29/07).
`ensureMarRows()` garantit les lignes annuelles de tout MAR actif (création et réactivation).
`annulerAbsenceLongue` n'efface que les cases valant exactement `CL`.

### Versionnement
La version du site vit dans **4 fichiers, 10 emplacements** : `admin.html` (3),
`dashboard.html` (3), `docs/guide-mar.html` (2), `docs/guide-comite.html` (2).
⚠️ `index.html`, `indispos.html`, `staff.html` et `absences.html` **n'en portent aucune**.
Patch → 3ᵉ chiffre · Fonctionnalité → 2ᵉ · **v2.0 réservée à l'ouverture du module libéral au
groupement** (la version est un repère pour les utilisateurs, pas pour le développeur).
**Version en cours : v1.29** (08/08/2026).

---

## 🔜 À faire

### Priorité 1 — Présentation staff du 04/09 *(session du 29/07 : deck refait, il reste 3 choses)*

**Le deck est à jour** (`docs/presentation-staff.html`, commit `6ca0b09cd1`, 33 diapos). Chiffres
alignés sur la génération réelle de 2027 et sur 400 années simulées, animations en place.
Les anciennes lignes de cette section étaient périmées et ont été **supprimées, pas démenties** :
les numéros de slides ne correspondaient plus, et `CONFIG.SULTAN_CODE` demandait d'écrire en dur
le code retiré le 22/07 pour raison de sécurité (il se saisit par `prompt()`, il n'y a **rien** à
remplir dans le fichier).

Reste à faire, par ordre de criticité :
1. ✅ **`GARDES_2027` et `STATS_GARDES_2027` supprimés le 30/07.** Le verrou de `generateGardes()`
   ne bloquera pas la démo (`GARDES_{Y}` est le **seul** onglet qui l'arme, l.138).
   `INDISPOS_2027` et `AFFECTATIONS_2027` conservés : les profils fictifs sont dedans.
   ⚠️ `STATS_GARDES_2026` doit rester en place — c'est lui qui porte les colonnes `CIBLE*` de la
   dette d'équité pour la vraie génération de novembre.
2. **Répétition à blanc chronométrée.** Le deck annonce « 15 secondes » deux fois (diapos 9 et 23).
   Ce qui n'est pas mesuré, ce n'est pas l'algorithme — c'est le temps que la salle verra, aller-retour
   Apps Script compris, là où on a déjà observé 30 à 56 s côté client pour 2 s côté serveur.
3. **Relecture du deck en projection.** Tout est vérifié par machine (structure, `<div>`, `node --check`,
   jsdom, arithmétique des pourcentages) ; **rien n'est vérifié à l'œil**. Points sensibles : diapo 10
   (tableau à 5 colonnes, le plus large), diapo 19 (densifiée), diapo 16 (146 cellules animées sur 5,6 s,
   et le rosé du repos du lendemain peut passer pour du blanc en vidéoprojection).
4. Vérifier que les **profils indispos 2027 des autres MARs sont remplis** (annoncé à la salle).
   `PERIODES_VAC` : ✅ déjà réglé sur 2027 (Arthur, 30/07).
   📌 **`PERIODES_VAC` ne contient qu'UNE année à la fois — celle qu'on prépare, et c'est normal.**
   `savePeriodes` (Indispos.gs l.1765) efface tout l'onglet et réécrit les périodes envoyées. Rien à
   sauvegarder, rien à restaurer : les deux seuls consommateurs (`getVacConfig` via `getIndisposYear()`,
   `getConflitsAll` via l'année passée en paramètre) travaillent **toujours sur l'année préparée, jamais
   sur l'année en cours** — vérifié en lecture de code le 30/07. Ne pas chercher 2026 dedans.

### Ménage post-démo — check-list (à exécuter le 04/09 au soir, puis supprimer cette section)

1. **Onglets `_2027` : supprimer `INDISPOS_2027` et `AFFECTATIONS_2027`.** Impératif, pas cosmétique :
   `initYear` (Indispos.gs l.1361) **refuse de tourner** si `INDISPOS_2027` existe (« INDISPOS_2027
   existe déjà ») → le Wizard 1 d'octobre serait bloqué. Et `AFFECTATIONS_2027` n'étant recréé que s'il
   est absent, les affectations fictives resteraient en place. `GARDES_2027` / `STATS_GARDES_2027` ont
   été supprimés le 30/07 ; si une génération est relancée pendant la démo, les resupprimer.
2. **JSON du Drive** (dossier « Planning-CHPG-JSON ») : supprimer `planning_2027.json`,
   `affectations_2027.json` **et `planning_2027_notifie.json`** *(ajouté le 01/08 : le notifieur
   dépose cette photo de référence à chaque publication, même éteint)* si la publication a été montrée. **Butoir dur : avant le 1er octobre.**
   Tracé dans le code le 30/07 :
   - `index.html` l.1119 sonde les années `2026 → année+1` avec `getAffectationsJson` : c'est
     **`affectations_2027.json` qui ouvre la porte**. Dès qu'il existe, **2027 apparaît dans le
     sélecteur de tous les MARs** (l'affichage par défaut reste `activeYear`, mais le clic est
     disponible et charge alors `planning_2027.json`).
   - `dashboard.html` l.729 et 832 : `if (new Date().getMonth() >= 9)` — **dès le 1er octobre**, le
     dashboard va chercher `_fetchPlanning(year+1)` **silencieusement**, sans action de
     l'utilisateur, et fusionne le résultat dans « prochaine garde » et « Mes congés ». Les JSON de
     démo laissés en place afficheraient donc des **gardes 2027 fictives à 23 MARs le 1er octobre**.
   - `admin.html` : `anneeSuivante` n'ajoute que « 2027 — N+1 » au sélecteur du comité (l.2704) et
     fait passer le bandeau de clôture de ⛔ à 📦 (l.2805) — bandeau invisible avant le premier
     lundi de 2027. Sans effet en septembre.
   - Session secrétariat : `getPlanningJson` n'est pas dans la liste blanche → aucun accès.
   - ⚠️ Non prouvé en réel : supprimer les fichiers ne vide pas le cache `sessionStorage`
     (`chpgPlan:2027`) d'un onglet déjà ouvert — le rafraîchissement silencieux échoue sans bruit
     et la copie en cache survit jusqu'à la fermeture de l'onglet.
3. **CONFIG : refermer la campagne** si `INDISPOS_ACTIVE = 2027` a été posé pour la démo (bouton du
   wizard = `clearIndisposYear`, ou suppression de la ligne). Tant qu'elle est là, la tuile
   « Mes indispos » est ouverte aux 23 MARs sur une année fictive.
4. **Code d'accès de WS** : saisi devant la salle → « Régénérer le code » dans MEDECINS
   (`resetCodeMar`) : nouveau code envoyé par mail, ancien tracé dans `HISTORIQUE`. Idem `ADMIN_CODE`
   (CONFIG, à la main) s'il a été projeté.
5. **Mails : rien ne part tout seul.** Vérifié dans le code : `setIndisposYear` n'envoie aucun
   message ; les envois sont des actions explicites (`sendCodesWithRecap`, `envoyerRecapIndispos`,
   `envoyerRecapGardes`). Contrôler seulement qu'aucun bouton d'envoi n'a été cliqué — journal
   `HISTORIQUE` en cas de doute.
6. **Terminer par 🔍 Diagnostic système** (onglet Maintenance) : onglets, JSON du Drive, concordance
   des versions.

### Priorité 1 bis — Deux données à trancher AVANT la génération de novembre

Aucune urgence pour le 04/09, mais elles faussent la génération réelle si elles restent en l'air.
Arthur n'avait pas la réponse au 29/07.

- **`date_fin` de FERRIERO.** `simulateur/demographie.js` le fait partir fin février 2027 ; `MEDECINS`
  n'a aucune `date_fin`. Le probable, d'après Arthur : le 150 % cumulé AF + LC devient un 50 % seul en
  mars 2027. Si le départ est réel et la colonne vide, l'algorithme lui donne une cible pleine de 34,6
  au lieu de ~5,4, et **les cibles des 21 autres sont fausses de ~1,5 garde chacune**.
- **MENADE et l'exemption de garde à 60 ans.** Il atteint 60 ans en 2027 (né en 1967 d'après le modèle).
  La règle d'exemption est réelle ; WS en est une exception assumée et continue les gardes. Si RM
  l'invoque, Σ des poids passe de 21,05 à 20,05 : **la base passe de 34,6 à 36,3**, soit +1,7 garde
  pour chacun des autres, et le slide des cibles devient faux dans ses 24 lignes.

### Priorité 2 — Module libéral, brique convergence 30 %
Ordre restant : **2C** (recoupement, taux de couverture, rendement) puis **Lot 4**.
- **Lot 4 pas envisageable avant mi-2027** : il lui faut des rendements mesurés, donc plusieurs
  mois de 2A+2B.
- Chantier de **conception**, pas de code — mérite un fil dédié. Jeu d'essai : relevé réel
  janvier→juin.
- Picker des consultations libérales d'endoscopie : plus aucun contrôle automatique depuis le
  retrait de la rotation (20/07) — attribution 100 % manuelle, règle du 8.1 à vérifier de tête.
  *(Rangé ici le 29/07 : c'est une question de règle métier, pas une dette de code.)*
- ❄️ **Lot 5 (orientation financière par la secrétaire) : GELÉ** depuis le 24/07 — à revoir au vu
  du constat sur les excédents.

### Priorité 2 bis — NCHPG (janvier 2027) : la réorganisation des secteurs *(cadrage du 30/07, aucune conception faite)*

**Acquis (Arthur, 30/07) : les codes de secteurs changent, de façon certaine.** Structure annoncée :
de **grands secteurs** (« Bloc long », « Bloc court »…) contenant des **sous-secteurs** (endoscopies,
cardio…). **L'organisation cible n'est pas connue** — donc rien à concevoir tant qu'elle ne l'est pas.
Ce qui suit n'est pas une conception, c'est l'inventaire de ce que le changement casse.

1. **`COVERAGE` (admin.html l.≈3754, revérifié 06/08) deviendra une liste de codes morts** → le « + » de case à
   pourvoir **s'éteindra partout, en silence** : ni erreur, ni message, juste un signal de sécurité
   qui disparaît. C'est le point le plus dangereux du déménagement côté logiciel.
   Correctif décidé : colonne **`COUVERTURE` (O/N)** dans l'onglet `SECTEURS` — c'est une **règle
   métier** (« ce secteur doit toujours être pourvu »), pas la liste des secteurs actifs.
   ⚠️ Conserver l'exception `RI`, volontairement hors couverture (règle plus fine, mercredi/jeudi matin).
2. **`targets` (l.≈4761, revérifié 06/08)**, boutons « Déplacer vers » du volet latéral : à alimenter par les secteurs
   actifs de l'onglet. Confort, pas blocage — on peut toujours retirer puis reposer depuis la case.
3. **Export Excel du vendredi** : déjà piloté par `SECTEURS` (`ORDRE / XL_LABEL / XL_BG / XL_ROWS`)
   et `CS_TEMPLATE` depuis juillet — un secteur créé apparaît dans le fichier sans toucher au code.
   **Mais le modèle est PLAT** : rien n'exprime « sous-secteur de ».
   **Forme retenue le 30/07 — option A, un bandeau par grand secteur** : fusion des colonnes 1→21,
   exactement le mécanisme déjà utilisé par la ligne 7 (« ANESTHESISTES AUX BLOCS »). Les
   sous-secteurs gardent leur comportement actuel (libellé fusionné en colonne 1, `XL_ROWS` pour la
   hauteur, 2 lignes = 4 initiales par demi-journée). Côté code : une colonne **`PARENT`** dans
   l'onglet `SECTEURS` et une boucle imbriquée dans `BLOCS` — pas de réécriture de l'export.
   **Maquette : `docs/maquette-export-excel-secteurs.xlsx`** (4 onglets : modèle actuel, option A,
   variante « à répartir », notes ; secteurs et initiales fictifs). Vérifié au rendu PDF : chaque
   onglet tient sur une page A4 paysage en largeur. Non vérifié : le rendu dans le vrai Excel.
   ⛔ **Écartée : la colonne mère à gauche** (cellule fusionnée verticalement, texte pivoté). La
   contrainte d'impression est la **largeur** (`fitToWidth:1, fitToHeight:0`, déjà ~30 cm pour
   28,7 cm utiles) : une ligne de plus est gratuite, une colonne de plus se paie en réduction de
   police sur tout le document, et obligerait à retoucher tout le calcul `colStart` et chaque fusion.
   ⚠️ ExcelJS : écrire dans une cellule *esclave* d'une fusion casse le fichier en production.
   **Point de départ, pas conception figée** — la maille d'affectation (point 4) reste à trancher.
4. **Question de fond, à trancher avant de coder quoi que ce soit** : l'affectation mensuelle d'un MAR
   est aujourd'hui **un code de secteur unique** (`AFFECTATIONS_{Y}`, comparé tel quel par la
   couverture). Avec une hiérarchie, est-on affecté au **grand secteur** ou au **sous-secteur** ?
   Cette réponse fixe la maille de tout le reste : couverture, volet de placement, export Excel.
5. Rappel : le rendement libéral est modélisé **par spécialité et non par secteur** précisément
   parce que les secteurs changent au NCHPG et pas les spécialités. Ce choix reste bon.

**Ordre : ne rien coder avant de connaître l'organisation cible.** Le jour où elle est connue → fil
de conversation dédié.

**06/08/2026 — le chantier a désormais son guide : `docs/guide-demenagement-nchpg.html`**
(lié depuis le §18 du guide technique). Phases A (décisions) / B (lot de code) / C (bascule,
classeur seul) / D (contrôles), encadrés ⏳ pour ce qui attend l'organisation cible.

6. **Constat vérifié au banc le 06/08 (scénario dédié, vraies pages) : `ACTIF = N` efface
   l'historique de l'écran.** Un secteur désactivé mais encore présent dans un planning publié
   perd sa ligne dans la grille d'`admin.html` (semaines passées comprises) et un MAR placé
   dedans est **ignoré silencieusement** au rendu (l.≈3673 : `if (smap[key])`, pas de repli) ;
   sur `index.html`, ligne, couleur et libellé disparaissent. Les données restent intactes.
   → Nouvelle décision de Phase A : garder les anciens secteurs actifs tant que l'historique
   de l'ancien hôpital doit rester consultable, **ou** ajouter au lot de code le rendu des
   secteurs inactifs encore présents dans un planning publié.

### Priorité 3 — Dettes techniques
- **Deux listes de secteurs encore figées dans `admin.html`** (`COVERAGE` l.≈3754, `targets` l.≈4761 — revérifiées 06/08)
  *(trouvées le 29/07, revérifiées présentes le 30/07)* : **un secteur créé dans l'onglet n'apparaît
  dans aucune des deux.** Traitement et solution retenue : voir **Priorité 2 bis (NCHPG)** ci-dessus —
  c'est le même chantier. Rien à faire avant le 04/09.
- **Écran « Paramètres » d'`admin.html` : MORT** *(trouvé le 01/08)*. `renderParametres()`
  (l.~7222) n'est appelée nulle part, `configData` n'est jamais rempli, `#paramsBody` n'existe pas
  dans la page. Côté serveur `saveConfig` fonctionne toujours. **Conséquence : régler quoi que ce
  soit dans `CONFIG` impose d'ouvrir le classeur à la main** — donc de passer à côté d'`ADMIN_CODE`
  et `SECRETARIAT_CODE`. C'est ce constat qui a fait créer l'onglet `SEUILS` séparé plutôt que
  d'ajouter deux lignes à `CONFIG`. **Tranché par Arthur le 07/08 : le rebranchement sur `CONFIG`
  est ÉCARTÉ** — argument de sécurité : les secrets doivent rester dans le classeur, pas transiter
  par une page web. Reste : supprimer le code mort (orientation retenue, à grouper avec le retrait
  d'`OVERRIDES` — même genre de lot) · ou rebrancher **sur `SEUILS` seulement** si le besoin de
  régler les bornes souvent apparaît (pas le cas à ce jour, réglées une fois le 01/08).
  ⚠️ Lot séparé, **après le 04/09**.
- **Code mort `OVERRIDES`** *(30/07)* — deux systèmes successifs aux noms voisins cohabitent :
  `OVERRIDES` (ancien, **l'onglet n'existe plus**) et `PLANNING_OVERRIDES` (actuel). Conséquence
  visible : `admin.html` porte un panneau « Modifications en attente » qui affichera
  **toujours** « ✅ Aucune modification en attente ». Retrait = 6 endroits (3 GAS, 3 `admin.html`),
  à faire comme lot dédié : la variable `_localOverrides` ne dit pas de quel système elle relève.
- **Décompte de la tolérance jeudi/samedi non remesuré** sur les 400 années *(le guide n'affiche
  plus aucun chiffre faux, il dit « exceptionnelle » — c'est un confort, pas une correction)*.
  Coût mesuré le 30/07 : **1 min 14 s par scénario**, soit ~25 min pour les 20.
- **Indispo saisie AVANT le staff, écrasée par une vacance** *(examiné le 30/07, **décision :
  on laisse comme ça**)*. La case du comité gagne, la saisie du MAR est perdue sur ce jour et
  devient non modifiable. **Impact nul sur les gardes** : `INDISPO` et `VAC` bloquent
  identiquement (`blocked()`, l.420). Seul cas gênant : **retirer** ensuite la vacance laisse la
  case vide, l'indispo d'origine ne revient pas. Deux pistes étudiées et **non retenues** :
  verrou `STAFF_VALIDE` sur `indispos.html` (bloquerait la démo du 04/09, et retarder
  `INDISPOS_ACTIVE` déplacerait toute la résolution d'année d'un an en silence) et marqueur de
  conflit dans `staff.html`. Ne pas les reproposer sans élément nouveau.
- *(À l'appréciation d'Arthur)* rotation du token GitHub.

*Traitées le 29/07 : tables de configuration en dur (6 supprimées, repli remplacé par un bandeau
visible) · tri `roleOrder` des volants (helper `_rangRole_`) · limites de saisie des codes d'accès.
La ligne `markVeille` a été supprimée : c'était une fausse alerte.*

---

## 🚫 Écarté — ne pas reproposer sans élément nouveau

- **Protection anti-force-brute sur `checkCode()`** *(20/07, chiffré)*. 32⁸ ≈ 1 100 milliards de
  combinaisons, ~50 essais/s au mieux → **~350 ans**. Surtout : `checkCode()` tourne à **chaque
  requête**, pas seulement au login — un disjoncteur global aurait coupé le service pour les
  23 MARs avec 30 essais ratés. Et `Utilities.sleep()` épuise le quota au lieu de le protéger.
  *(Le compteur par IP est de toute façon impossible : Apps Script ne donne pas l'IP.)*
- **Généraliser le service worker aux autres pages** *(22/07)*. Tout le monde passe par le
  Dashboard, qui le porte déjà.
- **Servir les icônes d'`index.html` depuis le bundle local** *(22/07)*. Les icônes sont
  configurables par l'onglet `SECTEURS` (1 728 icônes possibles) : une liste figée ferait
  disparaître un picto **en silence**. Ne reproposer qu'avec un repli visible.
- **Réduction automatique du devis à l'impression** *(21/07)*. 95 % des dossiers font 2 actes,
  3 au maximum ; réglé par la mise en page seule.
- **Archivage annuel automatisé** *(29/07)*. Un déclencheur annuel est du code jamais testé qui
  s'exécute sans surveillance ; il transformerait un oubli en erreur grave.
- **`config.html`** — couvert par les onglets d'`admin.html`.
- **Migration hors Apps Script** — non lancée, voir la section Performance pour le détail chiffré.

---
---

# PARTIE 2 — Historique détaillé par chantier

> Conservé intégralement. La synthèse ci-dessus oriente ; ce qui suit fait foi sur le détail.

## ✅ Fait

### Intégrité des gardes & consultation des années passées (3 août 2026)

**Origine.** Audit complet du classeur maître (30 onglets) via le connecteur Drive. Découverte
d'un jour sans garde de réanimation dans l'année 2027 générée : **vendredi 26/03/2027**.

**Cause, établie par rejeu.** Le générateur est hors de cause : la génération réelle du 01/08
rejouée hors ligne avec les vraies entrées donne 0 trou, quel que soit le nombre de passes de
l'optimiseur. Un **don de garde** portant sur le jeudi 25/03 a écrit `RG` sur le 26 par-dessus
la garde que le bénéficiaire y détenait déjà. Signature : un repos orphelin le 27, et une
configuration (deux gardes à 24 h d'intervalle) que le générateur ne peut pas produire.

**Livré.**
- `Indispos.gs` **2026-08-03.3** — refus de tout don / échange / garde exceptionnelle qui
  écraserait un `G`/`G2` ou créerait deux gardes consécutives ; vérification que toutes les
  cases visées existent **avant** la première écriture (`writeCell` échouait à mi-parcours et
  laissait une garde perdue — cas atteignable : un MAR actif absent de `GARDES_{année}`) ;
  journalisation des succès **et** des refus.
- `portail.gs` **2026-08-02.1** — `deleteLiberal` cherche sur `ID` **+** `MAR_ID`. Dix lignes
  de `LIBERAL_2026` partageaient un même identifiant (héritage d'un ancien schéma de fusion) :
  trois MAR ne pouvaient pas supprimer leur propre déclaration.
- **Diagnostic** extrait du routeur dans `diagnosticComplet()` — corps prouvé identique,
  534 lignes sur 534. Quatre contrôles ajoutés : repos orphelins, gardes consécutives, gardes
  sans repos, MAR actifs absents de `GROUPES_VAC`, MAR `ACTIF=O` à date de départ dépassée,
  `HISTORIQUE` comparé aux gardes réellement faites. **Déclencheur hebdomadaire** `diagHebdo`
  (lundi 2 h), destinataire lu dans `CONFIG / DIAG_EMAIL`, objet `❌ N problème(s)` ou `✅ RAS`.
- **Années clôturées consultables** — repli sur le classeur d'archives pour `getGardes` et
  `getStats`, endpoint `getAnneesDisponibles` (maître + archives), verrou serveur explicite sur
  les années archivées. Côté interface : `admin.html` testait `./archives/stats_{année}.json`,
  **fichier qui n'a jamais existé** depuis le passage au Drive privé — le sélecteur ne pouvait
  donc jamais proposer une année close ; `index.html` sondait les années une par une (1 appel
  en 2026, 10 en 2035, ~2,5 s chacun de plancher). Les deux passent par l'endpoint unique.
- `setup_annee.gs` **2026-08-03.1** — `archiveYear` alimente `HISTORIQUE` depuis
  `computeStatsLive()` (gardes **réellement faites**) au lieu de recopier le snapshot `STATS`,
  avec repli. Sauvegarde JSON de la grille elle-même (`archives_gardes_{année}.json`).

**Décision structurante.** `HISTORIQUE` = mémoire longue du service, pas moteur. La **dette
d'équité** de l'année N+1 est lue par le générateur dans `STATS_GARDES_N` directement, avec
repli sur le classeur d'archives — `HISTORIQUE` n'intervient jamais dans ce calcul. Il doit donc
refléter le **réel**. Effet concret : ARMAND (arrivé en novembre 2026, absent du snapshot,
de garde le 25 décembre) obtient enfin sa ligne et son Noël — sans quoi il redevenait éligible.

**Reste à faire côté classeur** : supprimer les 25 lignes `ANNEE = 2026` de `HISTORIQUE` après
déploiement du patch (l'ajout est idempotent sur `id|année` : sans suppression, les lignes
périmées sont figées pour toujours) ; ajouter FERRIERO dans `GROUPES_VAC` ; passer TRAN en
`ACTIF=N` le 1er septembre ; régénérer le token GitHub avant le 18 octobre (expiration).

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

- **Axe 4 — Continuité / bus factor** : `docs/reprise.html` créé (propriété des ressources, accès,
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

### Veille bibliographique (juillet 2026, refondue le 08/08/2026)
- Scan PubMed hebdomadaire (lundi) piloté 100 % depuis l'onglet `VEILLE_CFG` (voir `docs/VEILLE_CFG-mode-emploi.md`).
- Tri « best match » + badge type de publication (`PUBTYPE`).
- Tagging **par thème** (colonne `THEMES`), sélecteur de thème + filtrage dans le Dashboard.
- Normalisation des dates ISO au read time.
- **08/08/2026** : module extrait dans `gas/veille.gs` ; liste blanche de types sur
  l'axe généraliste **seul** (lignes `PUBTYPE` de `VEILLE_CFG`) ; dates `epubdate`
  au jour près ; codes `SOURCE` = contrat de l'écran, avec test de contrat au banc ;
  filtre par revues cochées (v1.29, mémoire par appareil) ; diapo 29 du deck staff
  réalignée. Volume validé : **79,5 art./semaine**.

**Veille — reste à faire :**
- Supprimer `gas/veille_dryrun.gs` (du dépôt ET d'Apps Script, avec la fonction de
  mesure `mesureEpubdate` qui y a été collée) — la veille est validée.
- **Lu/★ par MAR** : une seule colonne LU/STAR pour 23 MARs aujourd'hui — marquer
  « lu » retire l'article de l'écran de tous. La clé miroir `veille` est un
  instantané **unique et partagé** : l'état par MAR passera par le mécanisme
  `{parMar:{ID:…}}` filtré par le Worker (celui des indispos, `miroir.gs` ~l.602).
  Touche `dashboard.html` → montée de version ; y inclure le **retrait de l'option
  morte « Thèmes »** du menu sources (vestige de l'ancien axe thème).
  Plan validé le 08/08 (6 points) : ① onglet `VEILLE_MARQUES` (une ligne par
  couple MAR×PMID, écriture ciblée, jamais de suppression) ; ② clé `veille_marques`
  filtrée par le Worker **pour tous les rôles, admin compris** (lecture = donnée
  personnelle) ; ③ accroche miroir après `markVeille` + optimisme d'écran existant ;
  ④ colonnes LU/STAR partagées abandonnées ; ⑤ v1.30 ; ⑥ **file locale de marques**
  (`localStorage`) rejouée à chaque ouverture jusqu'à confirmation — ferme le seul
  « à fond perdu avec échec avalé » portant des données utilisateur (cf. doctrine
  des écritures, CONTEXTE). Banc écrit d'abord : deux MARs qui ne se voient pas,
  refus Worker, transport coupé → page fermée → rejeu. **Gel le 31/08** : fini,
  testé à deux vrais codes, `veille_dryrun.gs` supprimé — puis plus rien jusqu'au
  4/09.
- **Audit des écritures — case restante** : localiser l'appelant client de
  `declareLiberal`/`deleteLiberal` (absent des pages de la racine, probablement le
  module libéral sous `docs/`) et le classer selon la doctrine des écritures.
- Rappel d'exploitation : après re-collecte ou modification de `getVeille()`,
  lancer `miroirSyncComplet()` — la clé `veille` n'est rafraîchie que par la
  synchro horaire.

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

⚠️ **Pour bumper la version : 4 fichiers, 10 emplacements.** *(Corrigé le 29/07/2026 : ce
paragraphe annonçait « 5 fichiers, 9 emplacements » et comptait `docs/guide-technique.html`, qui
ne porte aucune version — vérifié dans le fichier ET dans le code du Diagnostic, qui ne contrôle
que les 4 ci-dessous. La même erreur vivait dans le CONTEXTE, corrigée le même jour.)*

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · badge `id="verBadge"` en dur · marqueur `// SITE_VERSION:` |
| `admin.html` | idem (3 emplacements) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · marqueur `<!-- SITE_VERSION: -->` |
| `docs/guide-comite.html` | idem (2 emplacements) |

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
- ✅ **Étape 3 faite le 29/07** : les tables en dur sont supprimées et le repli n'existe plus.
  Une panne de lecture affiche désormais le bandeau rouge `configBanner` et **bloque l'export
  Excel** (un fichier amputé de ses lignes de secteur ne doit pas partir au service).

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
| 4. **Légende de l'onglet Affectations** | ✅ dérivée de `SECTEURS_ACTIFS` (`legendOrder`) — constaté fait le 29/07, la ligne était périmée |
| 5. Enregistrement dans `AFFECTATIONS_{Y}` | ✅ |
| 6. Génération du planning | ✅ **corrigé** (voir ci-dessous) |
| 7. Nouvelle ligne sur le planning | ✅ (index.html dérive déjà de l'onglet) |
| 8. **Export Excel** | ✅ **29/07** — `BLOCS` et `CSROWS` dérivés des onglets, `SX` dérivé de `BLOCS` |

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

### Performance — chantier du 28 juillet 2026 · site v1.12 · `gas/Indispos.gs` v2026-07-28.6

**Le constat qui commande tout le reste.** Une requête qui ne fait RIEN (17 ms de travail serveur)
coûte **2 à 3 s** d'attente avant d'atteindre le code, avec des pointes à 10-20 s et des rejets
HTTP 404 sporadiques. Vérifié deux fois, sur deux déploiements indépendants (5 mesures chacun,
médianes 2,70 s et 2,31 s) : **un déploiement neuf se comporte comme l'ancien**. Ce coût est
**par appel**, hors de notre contrôle, et il varie dans la journée (≈1,4 s le matin, 2,5 à 7 s
l'après-midi). Conséquence : **le seul levier est de réduire le NOMBRE d'appels**, jamais leur
contenu. Toute optimisation future doit être jugée à cette aune.

**Livré et vérifié en production :**
- **File groupée des placements** (`savePlanningOverridesBatch`). Avant : un appel par clic —
  34 appels pour une session, ~15 s de moyenne, **10 placements sur 34 perdus en HTTP 404**
  (l'écran les affichait, le classeur ne les avait pas : risque réel de publier un planning amputé).
  Après : **un appel par rafale**, mesuré à 4,0 s pour une session entière, zéro perte. Garanties :
  badge « N placements en attente » en bas à gauche, lot rejouable sans doublon (ligne visée par
  le couple date+MAR), persistance `localStorage` y compris du lot en vol, envoi de secours à la
  fermeture d'onglet (`sendBeacon`), et **vidage BLOQUANT avant publication** — on ne publie
  jamais avec des placements non écrits.
- **Chronomètre serveur** (`_srv_ms`). `doGet` a été renommé `_routeRequete_` (aiguillage intact) ;
  le nouveau `doGet` le chronomètre et l'enveloppe ajoute la durée d'exécution réelle dans chaque
  réponse JSON (garde-fous : réponses > 400 Ko et non-objet passent telles quelles). `chronoAPI()`
  affiche désormais **serveur / attente** séparément. Le diagnostic se lit sans ouvrir le menu
  Exécutions d'Apps Script.
- **Préchargement du panneau de placement** (`getPanneauSemaine`). Avant : 2 appels par jour ouvert
  (dispos + libéral) ≈ 5 s, soit 10 à 14 appels pour une semaine. Après : **un seul appel pour les
  7 jours**, lancé en arrière-plan dès l'affichage de la semaine — le panneau s'ouvre ensuite
  **sans aucun appel**. Vérifié au chronomètre : plus aucun `getMARsDispoJour` ni `listLiberalJour`.
  Les onglets (`GARDES_{Y}`, `AFFECTATIONS_{Y}`, `MEDECINS`, `LIBERAL_{Y}`) sont lus **une fois**
  pour les 7 jours. Le repli unitaire reste en place. **Défaut corrigé au passage** : `_dispoCache`
  ne se rafraîchissait jamais de la session — il est désormais invalidé après tout changement de statut.

**Mesures serveur de référence** (`mesurerPerf`, 12:59) : ouverture du classeur 120 ms ·
CONFIG 1re lecture 199 ms, **2e lecture identique 638 ms** · MEDECINS 313 ms · `getSecteurs` 500 ms ·
`getCsTemplate` 512 ms · JSON du Drive ~970 ms · total 5 418 ms sur 5 660 ms d'exécution.
28 onglets, 1 697 000 cellules. `mesurerDrive` : lire par identifiant direct (396 ms) n'est **pas**
plus rapide que la recherche par nom (~350 ms cumulés) — piste fermée.

**Écarté en cours de route :** tailler les 1 000 lignes vides des onglets (l'ouverture du classeur
ne coûte que 120 ms — impressionnant ≠ coûteux, gain estimé 0 à 300 ms) ; fusionner `login` et
`getAdminBootstrap` (**déjà fait le matin même** — le `login` observé au chronomètre était un repli
après un bootstrap raté, pas un défaut).

**Le prechargement du panneau a demande QUATRE versions dans l'apres-midi — fonction piegeuse,
a ne pas modifier a la legere.** Les trois premieres ont ete livrees en production puis corrigees :
1. **v1.12** — le suivi se faisait par *signature de semaine* : revenir sur une semaine deja
   chargee relancait tout, et `renderWeek()` (rappele a chaque placement, pas seulement au
   changement de semaine) declenchait un appel a chaque fois. **9 appels mesures en une session.**
2. **v1.12.1** — corrige en suivant chaque *jour*, mais avec `if (_preEnCours) return;` :
   sauter a une semaine lointaine pendant que la precedente chargeait encore (5-6 s) faisait
   **abandonner definitivement** le chargement de la nouvelle → repli unitaire, 2 appels par jour.
3. **v1.12.2** — enchainement corrige, mais un refus serveur sortait en silence sans marquer les
   jours : `renderWeek` relancait indefiniment. **11 appels mesures**, dont plusieurs traites en
   11 a 48 ms cote serveur (le temps d'une reponse d'erreur). Corrige en v1.12.3, qui trace
   desormais l'echec en console (`[prechargement]`) et marque les jours « tentes ».
4. **v1.13 — version finale, validee en production a 14:59** : le prechargement attend **500 ms
   d'immobilite** avant de partir (traverser 12 semaines a la fleche = 1 appel au lieu de 12), et
   un clic sur une case d'une semaine non prete declenche le chargement de **toute la semaine**
   (1 appel) au lieu de 2 appels unitaires pour ce seul jour. Mesure de controle : 9 appels pour
   9 semaines visitees, **aucun repli**, aucune attente superieure a 3,1 s.

**Ouverture d'admin : 4 appels bloquants ramenes a 1 (fin d'apres-midi, v1.13.4).**
Audit du chemin d'ouverture mene en EXECUTANT la page (jsdom + faux serveur tracant depart
et fin de chaque appel), et non en la lisant. Quatre correctifs :
- **`mailNonLus` livre par le bootstrap** (`2026-07-28.7`). 129 ms de travail serveur contre
  2,4 s d'appel separe. ⚠️ Le commentaire « NE JAMAIS le mettre dans getAdminBootstrap » qui
  figurait dans `admin.html` a ete **remplace** : il datait d'un contexte ou un appel separe
  etait bon marche. Premiere version fautive (valeur lue APRES `initDashboard`, qui efface
  `window.__boot`) — corrigee en v1.13.2.
- **Detection de l'annee suivante par le bootstrap** (`2026-07-28.8`, champ `anneeSuivante`).
  `checkNextYearAvailable` telechargeait le planning COMPLET de N+1 (**255 Ko, ~2,5 s**) pour
  repondre a un oui/non. Le serveur liste desormais les fichiers du dossier Drive **sans lire
  leur contenu**. Repli integral conserve : GAS non recopie → ancien telechargement. Les deux
  cas verifies en simulation, `nextYearAvailable` correct dans les deux.
- **Garde contre la double ouverture de session.** Le verrou `_sessionEnCours` ne protege que
  pendant `ouvrirSession` ; une seconde validation (Entree ou clic) relancait TOUTE l'ouverture
  — 4 appels au lieu de 2, reproduit en simulation. Corrige par `_ouvertureFaite`.
- **Bloc residuel supprime** dans `admin.html` : un SECOND ecouteur « Entree » sur le champ de
  code, avec des en-tetes vides (TABS, TOAST, MODAL, API), vestiges d'une reorganisation.
  Hygiene — sans gain mesurable, le verrou le neutralisait deja.
- **`chronoAPI()` horodate desormais le DEPART** de chaque appel (colonne `T+x.xs`). Sans cela,
  seules les fins etaient visibles : impossible de savoir si deux appels s'etaient suivis ou
  chevauches. C'est ce qui a fait perdre du temps sur un `login` apparaissant avant le bootstrap
  (en realite le vestige d'une sequence d'ouverture precedente, `_journalAPI` n'etant pas vide
  entre deux tentatives).

**⛔ CAUSE RACINE trouvee a 16 h — un defaut INTRODUIT LE MATIN MEME, qui a fausse toute la
journee.** Le patch « un seul appel serveur en vol a la fois » (28/07 matin) a introduit la file
`_fileAPI`, declaree en `let` **ligne 2036**, alors que la connexion automatique qui l'utilise
s'execute **ligne 1801**. Une variable `let` n'existe pas avant sa ligne : le TOUT PREMIER appel
levait donc `ReferenceError: Cannot access '_fileAPI' before initialization`, **a chaque
rechargement de page avec session active**. L'exception etait avalee par le `catch`
d'`ouvrirSession`, sans trace ni au journal ni en console.

Quatre symptomes, longtemps pris pour trois problemes distincts, tous issus de ce point unique :
un `login` parti AVANT le bootstrap (T+0,0 s au chronometre), `window.__boot` vide, donc
`initDashboard` refaisant un bootstrap complet, puis les replis `getPlanningJson` et `mailNonLus`
par-dessus — **3 a 4 appels la ou UN seul etait necessaire**.

Corrige en **v1.14** : la connexion automatique est deplacee en fin de bloc `<script>`, apres
toutes les declarations. Verifie par simulation (auto-login) : **3 appels ramenes a 1**, plus
aucune alerte `[ouverture]`. Les 5 regles de diagnostic qui en decoulent sont dans
`CONTEXTE-Planning-CHPG.md` (section « Diagnostic »). ⚠️ **Ne jamais remonter `tryAutoLogin`
au-dessus des declarations de la section API.**

### ⛔ `dashboard.html` — PISTE FERMÉE, ne pas la rouvrir (29/07/2026)

**Mesuré chez Arthur (connexion domestique, ~6 Mbit/s) : 2 appels, 6,46 s + 4,13 s ≈ 10,6 s**
avant que le bandeau « prochaine garde » s'affiche. Deux tentatives d'optimisation ont été
étudiées **et écartées sur mesure**, pas sur intuition :

**1. Faire voyager les gardes avec le `login`** (le serveur extrait les jours G/G2 du MAR et les
renvoie, au lieu que le dashboard télécharge le planning complet de 255 Ko).
→ Patch écrit, testé, équivalence de l'extraction prouvée à l'identique.
→ **Gain mesuré en simulation : 130 ms.** Le second appel n'est que partiellement bloquant, et le
planning reste nécessaire pour « Mes congés » — il part de toute façon. Coût : une lecture Drive
(~1 s serveur) ajoutée à CHAQUE login de MAR. **Rapport défavorable — non livré.**
→ Leçon : le gain d'un appel supprimé n'est réel que s'il est sur le **chemin critique**. Mesurer
l'instant d'affichage de l'information utile, pas le nombre d'appels.

**2. Lancer login et planning EN PARALLÈLE.** Impossible d'en tirer quoi que ce soit :
**Apps Script sérialise les exécutions d'un même utilisateur** (mesure du 28/07 : 4 appels
parallèles = 4 à 7 s chacun contre 1,8 s seul — c'est la raison d'être de la file `_fileAPI`
d'`admin.html`). Deux appels parallèles feraient la queue exactement comme aujourd'hui.

**Conclusion : `dashboard.html` est à l'optimum de ce qu'Apps Script permet.** Ses ~10 s sont
2 × le péage de la plateforme, et rien d'autre. Le seul levier restant sur cette page est un
changement d'hébergement.

**Mesure de référence pour la décision d'hébergement (29/07, même poste, à quelques minutes
d'intervalle, réponse vide des deux côtés) :**

| | Cloudflare Workers | Apps Script |
|---|---|---|
| Mesures | 93 · 101 · 204 ms | 2,62 · 2,80 · 2,85 · 3,02 · 4,00 s |
| **Médiane** | **~100 ms** | **~2 850 ms** |

**Facteur ≈ 28.** À noter : Apps Script fait **deux allers-retours** par appel (redirection `exec`
puis contenu `echo?…`), Cloudflare un seul — pénalisant sur une connexion à forte latence.
⚠️ **Ce que cette mesure ne dit PAS** : ce que coûterait la lecture des données depuis une
plateforme externe. Sur `admin.html`, le travail serveur (~4,8 s de bootstrap) domine désormais
le péage (~2,8 s) : migrer y serait décevant. Sur `dashboard.html` et `index.html`, qui ne font
que lire du pré-calculé, le gain serait franc. **Mesurer ce point avant toute décision.**

**Le serveur s'est degrade tout au long de l'apres-midi du 28/07, a code constant.**
`getAdminBootstrap` cote serveur : **3 106 → 3 512 → 3 881 → 5 036 → 6 110 ms** entre 13 h et
16 h. `getPanneauSemaine` : 2 179 → 4 164 ms. Le reseau est hors de cause (partage 4G le matin,
wifi domestique l'apres-midi, meme resultat). **Ne jamais mesurer un gain sur cette base** :
prendre la reference le matin.

**Lecon de methode.** Les trois regressions ont un point commun : elles ne se voient QUE dans
l'usage reel (navigation rapide, clic pendant un chargement, retour en arriere), jamais sur le
chemin nominal. Toute modification de cette fonction doit etre testee sur ces scenarios AVANT
d'etre poussee, pas apres. Les suites jsdom correspondantes sont decrites dans les commentaires
du code — les rejouer avant toute intervention.

**Point ouvert, non corrigé (hors périmètre) :** dans le tri serveur des MARs disponibles,
`roleOrder[role] || 3` vaut **3 pour VOLANT** (sa valeur est `0`, falsy en JS) : les volants ne
remontent pas en tête côté serveur. Sans effet visible (le frontend retrie par sections). Présent
dans `getMARsDispoJour` **et** reproduit à l'identique dans `getPanneauSemaine` — à corriger dans
les deux si on y touche.

### Documentation (docs/)
- Guides : `guide-mar.html`, `guide-comite.html`, `guide-algo-gardes.html`, `guide-liberal.html`, `guide-technique.html`.
- Présentations staff, démographie.
- Conception module libéral + antisèche cotation (voir ci-dessous).

### Dates aux frontières d'année — traqué par SIMULATION et corrigé (29 juillet 2026) · site v1.14.3 · `code.gs` v2026-07-29.3 · `Indispos.gs` v2026-07-29.4

**Méthode, à reprendre telle quelle** : aucune relecture. Les vraies fonctions de dates du
dépôt ont été extraites dans un banc d'essai Node et **rejouées sur 22 années (2025→2046)**,
avec des invariants vérifiés automatiquement. La lecture exhaustive du matin n'avait rien
donné ; la simulation a trouvé trois défauts en une heure — **dont deux dans le code que je
venais d'écrire**, invisibles à la relecture (comparaison d'une heure courante à un lundi
« à midi » : le rappel serait resté masqué toute la matinée du jour J).

**Prouvé sain** (donc à ne pas re-suspecter) : bornes de l'année planning (toujours
lundi→dimanche, durée multiple de 7, ni trou ni chevauchement entre années) ; concordance
des DEUX lectures de dates du classeur (par position vs par en-têtes) ; 12 fériés monégasques
avec report au lundi ; rythme 2 semaines/2 sans dérive y compris sur les années à 53 semaines ;
absences longues à cheval sur le Nouvel An ; rotation Noël/An.

**CAUSE UNIQUE des trois défauts** : « l'année d'une date = ses 4 premiers chiffres ». Faux ici —
l'année de planning 2026 court jusqu'au dimanche 03/01/2027.
→ Helper **`anneePlanning(date)`** dans `code.gs` (vérifié sur les 8 035 jours de 2025→2046).

1. **Écran « Consultations à venir »** — les absences de début janvier étaient cherchées dans
   l'onglet `GARDES_{année civile}`, qui ne les contient pas : rien trouvé donc « aucune absence »,
   donc **faux « disponible »**. Volume mesuré : 1 jour ouvré en 2026→2027 (le 1er janvier, férié),
   mais **5 en 2028→2029**, 4 en 2029→2030, 3 en 2030→2031.
2. **Volet libéral du comité** — la semaine à cheval ne lisait que `LIBERAL_{année du lundi}` :
   les interventions déclarées en janvier disparaissaient (3 jours en 2026→2027, 6 en 2029→2030).
   ⚠️ Corrigé en lisant **toutes** les années civiles de la semaine : les onglets `LIBERAL_{Y}`
   suivent le relevé, qui est **calendaire** — ils ne doivent PAS passer par `anneePlanning`.
3. **Navigation par semaine (`admin.html`)** — la clé était « année du jour + n° ISO ». Deux effets :
   la dernière semaine de chaque année s'affichait **en double**, et surtout **en 2028, 2034, 2040
   et 2045 le n° ISO 1 désigne DEUX semaines distinctes** de la même année, que `getWeekDays`
   mélangeait. Une semaine est désormais identifiée par **son lundi** (`_lundiDe`), les 6 appelants
   mis à jour. ⚠️ Ne jamais revenir à une clé fondée sur le numéro de semaine.

### Rappel de clôture — et pourquoi l'archivage n'est PAS automatisé (29 juillet 2026)

Une année de planning commence le **premier lundi**, pas le 1er janvier. Les deux erreurs
possibles ne coûtent pas la même chose : **clôturer en retard** n'est qu'un inconfort d'affichage,
**clôturer trop tôt** fait disparaître du portail les gardes des premiers jours de janvier, qui
appartiennent encore à l'année écoulée. Automatiser transformerait donc l'erreur bénigne
(l'oubli) en erreur grave — et un déclencheur annuel est du code jamais testé, qui s'exécute
sans personne devant l'écran, incapable de vérifier que le planning suivant est publié.

**Retenu : signaler, ne pas agir.**
- **Bandeau dans `admin.html`** : n'apparaît JAMAIS avant le premier lundi ; ambré si le planning
  suivant est publié (bouton vers l'assistant), **rouge avec bouton désactivé** sinon. Masquable
  pour la journée (`chpg_clotureVue`, localStorage). Validé par simulation sur 9 scénarios.
- **Ligne dans le 🔍 Diagnostic** : info avant la date (« à faire à partir du lundi 4 janvier 2027 —
  surtout pas avant »), point de vigilance après.

**Dates de clôture** : lundi 4 janvier 2027, 3 janvier 2028, **8** janvier 2029, 7 janvier 2030.

### Dettes techniques soldées + panne silencieuse des codes d'accès (29 juillet 2026) · site v1.14.5 · `gas/Indispos.gs` v2026-07-29.5

Passe de nettoyage des 4 « dettes techniques » de la Priorité 3. **Deux des quatre lignes étaient
fausses** — la lecture du code a démenti la ROADMAP. Rappel de méthode : une dette notée n'est pas
une dette prouvée ; on relit le chemin avant de coder.

**1. `markVeille` — fausse alerte, ligne supprimée.** La ROADMAP annonçait « écrit sans verrou ni
contrôle de rôle ». Vérifié : le secrétariat est refusé **avant** la délégation à `portailRoute`
(liste blanche `SECRETARIAT_ACTIONS`), il ne reste que `admin` et `mar` — le public visé. Et
l'action écrit **une cellule ciblée par PMID**, jamais de lire-modifier-écrire ni de suppression
de ligne : deux clics simultanés touchent deux cellules différentes. Son exclusion de
`WRITE_ACTIONS_LOCK` est délibérée et commentée dans `Indispos.gs`. Ajouter le verrou aurait
contredit une décision écrite sans rien protéger. **Aucun code livré.**

**2. Configuration en dur — 6 copies supprimées, pas 3.** La ROADMAP en citait trois
(`SECTEURS`, `CS_TYPES`, `CS_REQUIRED`). La recherche exhaustive en a trouvé **six** :
`SECTEURS_CFG`, `CS_TYPES`, `CS_OPENABLE`, `CS_REQUIRED`, plus **`BLOCS` et `CSROWS`, cachées
dans l'export Excel** — invisibles à qui cherche les trois noms cités. C'est la récidive exacte
du piège de la « 4ᵉ liste en dur » du 21/07.

Décision d'Arthur, contre ma première proposition : **ne pas ajouter de bandeau par-dessus le
repli, mais supprimer le repli**. Son argument : « on ne va pas faire une sécurité sur chaque
chose ». Il avait raison — j'empilais un troisième mécanisme sur deux existants. Raisonnement
retenu : le repli ne sauvait que le cas étroit où *ces deux lectures seules* échouent (si le
réseau tombe, `admin.html` est mort de toute façon), et il coûtait une **panne muette** — grille
affichée avec une config périmée, indiscernable d'une grille juste.

Livré : les 6 tables vidées, `CONFIG_KO` + `majBandeauConfig()`, bandeau rouge non masquable, et
surtout **l'export Excel refuse de partir** si la config n'est pas lue (un fichier amputé de ses
lignes de secteur part par mail au service — c'est le point le plus grave du lot).
Principe consigné : **une panne visible vaut mieux qu'un affichage faux et muet.**

**3. Tri des volants — vrai défaut, corrigé.** `(roleOrder[role] || 3)` renvoyait `3` pour
`VOLANT`, dont la valeur est `0` (falsy en JS). Jeu d'essai : `R > PRESENT > VOLANT > VOLANT` au
lieu de `VOLANT > VOLANT > R > PRESENT`. Corrigé par un helper unique `_rangRole_(role, ordre)`
(`role in ordre ? ordre[role] : 3`) appelé par `getMARsDispoJour` **et** `getPanneauSemaine` —
une définition, pas deux corrections jumelles. `??` volontairement évité : la syntaxe n'apparaît
nulle part dans les 9 455 lignes de GAS, pas d'exception pour deux lignes.
Sans effet visible : `admin.html` regroupe lui-même par rôle (l.~3893).

**4. Picker endoscopie** — sorti des dettes techniques : c'est une règle métier, pas du code.
Rangé en Priorité 2 avec le lot 2C.

---

**Panne découverte en cours de session : les codes d'accès étaient tronqués en silence.**
Arthur, ayant changé son code à la main dans `MEDECINS`, ne pouvait plus se connecter à
`indispos.html`. Cause : `maxlength="8"` sur le champ de saisie — la longueur des codes
**générés**. Le champ refusait la 9ᵉ frappe **sans aucun message**, et le code tronqué était
déclaré invalide. Personne ne l'avait jamais heurté parce que les codes automatiques font
exactement 8 caractères.

Recherche exhaustive sur les 21 fichiers HTML du dépôt : **trois** limites de la même famille,
toutes retirées — `indispos.html` (8), `staff.html` (20, code admin) et le **wizard de création
de MAR d'`admin.html` (12)**. Cette dernière était la plus dangereuse : un code de plus de
12 caractères y aurait été tronqué *à l'enregistrement*, et Arthur aurait communiqué au MAR un
code qui ne fonctionne pas. Aucune limite haute côté serveur : `checkCode` compare la chaîne
entière. Placeholder `XXXXXXXX` remplacé par « Votre code d'accès », qui ne suggère plus de
longueur. Conservés : `maxlength` du DECT (6) et des initiales (3), qui sont de vraies contraintes.

**Troisième panne silencieuse de la semaine** après la déclaration mal placée du 28/07 et le repli
de configuration ci-dessus. Même schéma : le système refuse quelque chose sans le dire, et
l'utilisateur cherche au mauvais endroit.

**Trouvé en vérifiant, jamais répertorié** : deux listes de secteurs restent figées dans
`admin.html` — `COVERAGE` (l.≈3754) et `targets` (l.≈4761). Un secteur créé dans l'onglet
n'apparaît ni dans les « + » de couverture ni dans les boutons « Déplacer vers ». Inscrit en
Priorité 3, à traiter avant le déménagement NCHPG.

### Audit du code — passe serveur (29 juillet 2026) · `gas/portail.gs` v2026-07-29.2

Relecture intégrale des 5 fichiers GAS (≈9 400 lignes) et matrice croisée
actions serveur ↔ pages appelantes. **La passe frontend (9 pages, ~16 000 lignes)
n'a PAS été faite** : la lecture exhaustive s'est révélée improductive, elle est
abandonnée au profit d'audits ciblés (une question précise par session).

**Corrigé et poussé** — `getReleveLiberal` (relevé financier mensuel du groupement)
était accessible à TOUT code MAR valide, membre ou non. Masquer la tuile ne protège
rien : la porte est désormais fermée côté serveur, comme les marges de
`getConsultAbsences`. Décision Arthur : fermer aux non-membres.

**Vérifié sans anomalie** : aucun bouton orphelin (chaque action appelée existe côté
serveur) ; liste blanche secrétariat à 2 actions avec refus par défaut ; verrou
d'écriture pris avant délégation à portail.gs ; `declareLiberal`/`deleteLiberal`
ancrées sur `user.id` ; `getTopo`/`getProtocole` vérifient l'appartenance au dossier Drive.

**Ménage identifié, non traité** (aucun impact fonctionnel) :
- `getVacConfig` / `getVacValidation` : ~80 lignes dupliquées à l'identique.
- Mapping des stats recopié 3× dans le routeur d'`Indispos.gs`.
- Ligne 1237-1238 d'`Indispos.gs` : garde « GARDES_2026 sanctuarisé » écrite deux fois.
- Commentaire périmé au-dessus de `mailNonLus` (« ne jamais mettre dans le bootstrap »)
  alors que le bootstrap l'intègre depuis le 28/07.
- Calcul de Pâques dupliqué (`feriesNamed` vs `getJoursFeries`).
- `savePlanningOverride` unitaire : plus aucun appelant côté client depuis le passage
  au batch. **À conserver comme repli** pendant les fenêtres GAS/frontend désynchronisées.

---

### Audit documentaire complet + sauvetage des saisies (30 juillet 2026) · site v1.14.9 · `gas/Indispos.gs` v2026-07-30.2 · `gas/portail.gs` v2026-07-30.1

**Audit des 7 guides et des 4 `.md` de `docs/`, exhaustif, contre le code en production.**
Passe machine d'abord (liens, ancres, identifiants cités) : 0 anomalie. Puis lecture
document par document. 30 anomalies corrigées.

| Document | Corrigé |
|---|---|
| `guide-mar` | 8 — dont « retouchez un jour pour le désélectionner » (**faux** : `applyTool` écrase, seul ✕ Effacer supprime) et un e-mail récapitulatif des congés **qui n'existe pas** |
| `guide-comite` | 5 — dont §6.6 entièrement périmée (décrivait le « Enregistré » par case d'avant le lot, alors que §6.1 décrivait déjà le bon mécanisme) |
| `guide-liberal` | 6 — le module y était décrit **comme à construire alors qu'il est en service** |
| `guide_liberal_MAR` | 7 — dont « il ne reste que le nom du patient à taper » (aucun champ patient n'existe) et la fusion jour+secteur supprimée depuis le lot 2A |
| `guide-algo-gardes` | §14 réaligné sur la campagne du 29/07 : 140 → **400 années**, 102 312 → **292 312 gardes**, écart médian 1,7 → **1,20**, pire 3,3 → **3,5** |
| `guide-technique` | 1 (date) — **22 sections vérifiées, aucune erreur de fond** |
| `guide-fichier-maitre` | 1 — type `GENERAL` de `VEILLE_CFG` oublié, révélé par croisement avec le mode d'emploi |
| `README.md` | réécrit — décrivait 12 fichiers sur 33, citait `maquette_V1_pilotage_liberal.html` **qui n'existe pas**, omettait `guide-technique.html` et l'estimateur libéral |
| `reprise.html` | les deux comptes Google (`planningchpg` / personnel) nommés explicitement |

`VEILLE_CFG-mode-emploi.md` et `sauvegarde-compte-perso.md` : **exacts, rien à corriger**.
`docs/Presentation-gardes-staff.html` supprimé (aucun lien n'y menait, 29 mentions de « 140 années »).

**Trois motifs récurrents** : du livré documenté comme à venir · des promesses que le code
ne tient pas · des chiffres d'une campagne en retard (le guide **sous-vendait** l'algorithme).

---

**Défauts de code trouvés pendant l'audit et corrigés**

- `indispos.html` s'ouvrait sur `currentTool = 'VAC'`, outil **interdit au MAR** : le premier
  clic de chacun renvoyait « 🔒 Les vacances sont gérées par le comité ». `selectTool` n'était
  jamais appelée à l'init. Corrigé, + 24 lignes de code mort (`if (false)`) supprimées.
- `staff.html` : la confirmation promettait un e-mail récapitulatif inexistant.
- `admin.html` : repère de couverture harmonisé à 400 années (le guide copiait fidèlement un
  écran qui affichait 20).

---

**⚠️ Le vrai sujet : `saveIndispos` réécrivait la ligne entière**

Découvert en instruisant le verrou du staff. `INDISPOS_{Y}` porte **deux familles de codes** :
`VAC`/`FORM` (comité, via `staff.html`) et `INDISPO`/`SOUHAIT`/`TP` (MAR, via `indispos.html`).
Le serveur remplaçait toute la ligne par ce qu'envoyait la page. **Deux pertes silencieuses :**

1. `staff.html` ne garde que les VAC/FORM (`if(val==='VAC'||val==='FORM')`) → **revalider le
   staff après la campagne effaçait toutes les indispos, souhaits et TP des MARs.** Seul l'ordre
   du calendrier masquait le problème ; le bouton restait cliquable toute l'année.
2. Une page MAR ouverte **avant** la pose des vacances les effaçait en enregistrant plus tard —
   elle renvoyait sa photo périmée.

**Correctif** — `_fusionIndispos_(existant, envoyé, estRoleComite)` dans le **routeur**, pas dans
`saveIndisposForDoctor` (ce helper sert aussi à l'absence longue et doit continuer à poser une
ligne complète). Règle : chacun remplace **intégralement ses propres cases** (le retrait reste
possible des deux côtés) et ne touche jamais celles de l'autre ; en cas de conflit de date, le
comité gagne. Prouvé sur 7 cas en isolant la fonction.
**C'est ce qui rend le verrou des vacances réel** : il est désormais côté serveur, plus une
politesse du navigateur.

---

**« Valider et verrouiller » : ~3 min → quelques secondes** *(confirmé par Arthur en production)*

`doValidate()` bouclait avec **un appel serveur par MAR** : 23 exécutions sérialisées par Apps
Script, au point qu'Arthur a cru à un plantage. Nouvelle action **`saveIndisposBatch`**
(admin, dans `WRITE_ACTIONS_LOCK`) : 1 aller-retour, 1 lecture d'onglet, **1 écriture de bloc**,
même règle de fusion, MARs introuvables remontés au lieu d'être avalés. Échec = message franc
« rien n'a été modifié », plus de demi-enregistrement silencieux.

**Bandeau Noël / Jour de l'An** — le plancher passe de 4 à **8 en dur** (`Indispos.gs`
v2026-07-30.3). Il faut **exactement 8 MAR distincts** : 4 dates (24/12, 25/12, 31/12, 01/01)
× 2 gardes (G réa + G2 mat), et ces dates **ne peuvent jamais tomber dans la même unité de
couplage** (les couplages se font à ±2 jours, elles sont espacées de 1 ou 7). La lecture de
`CONFIG` (`NOEL_SEUIL_ANS` / `NOEL_PLANCHER` / `NOEL_PLAFOND`) a été **supprimée** : aucune des
trois lignes n'existait dans le classeur, c'était une lecture d'onglet par affichage pour rien.
Effet de bord heureux : `guide-fichier-maitre.html` affirme « six clés sont lues par le code » —
c'était **faux** ce matin (les 3 `NOEL_*` l'étaient aussi, manqué à l'audit par sondage), c'est
redevenu vrai. Le bandeau est désormais documenté dans `guide-comite.html` §4 (règle de priorité,
exclusions, caractère indicatif).
À égalité parfaite, le départage est **alphabétique sur l'id** — même clé (`overdueKey`) dans le
bandeau et dans le générateur. Déterministe, mais auto-correcteur : faire Noël change l'historique.

**Favicon** — `admin.html` et `absences.html` portaient `rel="icon" href="data:,"` (favicon vide
déclarée exprès) : pas de drapeau monégasque dans l'onglet du navigateur, contrairement aux 5
autres pages. Corrigé le 30/07, site v1.14.10.

**Cadenas** — ils n'existaient qu'en mémoire de l'onglet et disparaissaient au rechargement.
Reconstruits à chaque chargement depuis les VAC/FORM réellement en base. Bouton
**🔓 Tout déverrouiller** ajouté (session seulement, **aucune donnée touchée**) : sans lui,
il fallait déverrouiller case par case. `guide-comite.html` §4 réécrit en conséquence.

---

### Audit des 3 wizards (30 juillet 2026, soir) · site v1.14.14 · `Indispos.gs` v2026-07-30.5 · `setup_annee.gs` v2026-07-30.1

Lecture des trois assistants **dans l'ordre d'exécution**, écran par action serveur.
Constat d'ensemble : **les verrous sont solides, l'affichage ment.** Impossible de générer
deux fois, de clôturer trop tôt, de tout rejouer après une panne — mais un contrôle qui ne
contrôlait rien, une coche décorative, un « rien n'est supprimé » qui supprimait, une année
fausse dans un titre. *Le code protégeait mieux que l'écran n'informait.*

**W1 — corrigé**
- Un échec de `getVacancesConfig` (filet `.catch`) laissait `wizGroupes = {A:[],B:[],C:[]}` →
  l'étape 3 envoyait `saveGroupes` qui **vidait `GROUPES_VAC`** en affichant « ✓ Groupes
  sauvegardés ». L'assistant s'arrête désormais sur un écran « Lecture du classeur impossible ».
- `savePeriodes` **rasait la table entière** alors que `PERIODES_VAC` porte toutes les années
  (préparer 2028 effaçait 2027). Suppression ciblée sur l'année, reconnue à l'année de la date
  de début, comme à la lecture. + refus serveur d'écraser groupes ou périodes par du vide.
- `PERIODES_DEFAUT` (dates scolaires figées 2027/2028) **supprimé** : le repli renvoyait les
  dates 2027 pour toute année inconnue. Les périodes viennent du serveur, qui sait interroger
  le calendrier scolaire (`proposerVacances`) ; sinon bandeau « aucune période trouvée ».
- Coche décorative « Journal mis à jour » retirée (aucune action ; le journal est écrit par
  l'étape précédente, `setIndisposYear`).

**W2 — corrigé**
- ⚠️ **Le garde-fou « des MARs n'ont pas saisi leurs indispos » ne détectait jamais rien.**
  `getAllIndispos` renvoie un **dictionnaire** `{date: code}` ; le test `ind.length === 0`
  vaut toujours `false` sur un objet. L'écran affichait systématiquement « ✅ Tous les MARs ont
  saisi » et **ne bloquait pas** le bouton. (La liste détaillée en dessous, elle, était juste :
  elle testait `Array.isArray(ind) ? ind.length : Object.keys(ind).length`.)
- Titre de l'étape 1 sur `YEAR` au lieu de `INDISPOS_YEAR` : « Indisponibilités 2026 » au-dessus
  d'un audit portant sur 2027.
- `getAllIndispos` était le seul des 5 appels à ne pas passer l'année (repli serveur silencieux).
- Nouveau garde-fou : sans campagne ouverte, `INDISPOS_YEAR` est `null` et l'audit bouclait sur
  « l'année nulle » (1900). Écran d'arrêt explicite.

**W3 — corrigé**
- ⚠️ **Un archivage partiel était annoncé comme réussi.** Le dispatcher décide du succès en
  cherchant `❌` en tête de ligne ; les échecs de transfert d'onglets étaient des `⚠️`. Le wizard
  affichait « ✓ Année archivée », **basculait l'année active et fermait la campagne** alors que
  les 4 onglets étaient toujours dans le maître — et, l'année ayant basculé, réarchiver N devenait
  impossible depuis l'assistant. « Classeur d'archive inaccessible » et « transfert échoué » sont
  désormais bloquants ; les `⚠️` bénins s'affichent sous la coche au lieu d'être avalés.
- L'écran promettait « **Opération sans risque : rien n'est supprimé** » alors que l'archivage
  déplace 4 onglets **hors** du classeur maître et purge `PLANNING_OVERRIDES`. Libellé refait,
  liste complétée (5 opérations réelles, dont la fermeture de la campagne).

**⚠️ Le plus grave, trouvé par un symptôme d'Arthur : la rotation A/B/C tournait à l'envers
côté serveur.**
« 1 MAR a des conflits vacances non résolus — DR ARMANDO » alors qu'Armando **n'était pas** le
moins prioritaire à l'écran. Cause : `staff.html` et `admin.html` tournent **à droite**
(`(3 - offset % 3) % 3`, « le dernier devient le premier »), `Indispos.gs` tournait **à gauche**
(`offset % 3`) — dans les **deux** fonctions de conflits, la rotation intra-groupe, et l'outil
`testNotifierConflits`. Les deux ordres ne coïncidaient qu'**une année sur trois** (décalage nul :
2026, 2029…). Pour l'hiver 2027, l'ordre serveur était le **miroir** de l'écran.
**Règle actée par Arthur** : le dernier devient le premier, entre groupes **et** en intra-groupe.
`ABC → CAB → BCA` · `A1 A2 A3 → A3 A1 A2`. Serveur aligné sur l'écran, vérifié identique MAR par
MAR sur 5 périodes × 6 années. Impact : le classement sert **aussi** à l'audit de couverture du
W2 (qui décale ses vacances).
**✅ Confirmé en production le 30/07 par Arthur** : après recopie et redéploiement, le MAR
désigné en conflit correspondait cette fois à l'ordre affiché à l'écran. Arthur a résolu le
conflit en relevant le seuil de la période. *(Le seuil ne gouverne que l'arbitrage du staff :
l'audit de couverture du W2 compare capacité réelle et gardes requises, sans le regarder — le
relever assouplit l'arbitrage, pas la sécurité.)*

**Documentation** — `guide-technique.html` §07/§08/§09 et `guide-comite.html` §4.3 refaits :
le W2 **envoie bien** 23 récapitulatifs automatiquement (le guide affirmait le contraire et citait
`envoyerRecapGardes`, qui n'est qu'un libellé de journal) · sens de rotation écrit noir sur blanc
avec l'avertissement des 4 copies · archivage décrit comme destructif pour le classeur maître ·
étape Groupes = écran de contrôle en lecture seule.

---

### Jour gagné avant les vacances — LIVRÉ · et refonte du banc d'essai (31 juillet 2026) · `generateur_gardes.gs` v2026-07-30.1

**La passe de confort est dans le générateur**, entre l'optimiseur d'équité et le calcul des repos
(le recalcul des RG se fait donc automatiquement sur l'état final).

**Principe** : on remonte du 1er jour d'un bloc `VAC` au dernier jour **réellement travaillé** J
(week-ends, fériés, **jours de TP fixes**, semaines off et absences collées sont sautés) ; la garde
visée est **J-1**, qui doit tomber **lundi→jeudi, ni férié ni veille de férié**.
**Réalisation** : échange entre deux MAR de deux gardes de **même jour de semaine et même rôle**,
toutes deux hors férié/VJF → contribution identique à tous les compteurs. **L'équité est neutre
PAR CONSTRUCTION, pas par mesure.** Protections : le cédant ne perd jamais son propre jour gagné
et n'hérite jamais d'un rapprochement · régime `souhait_plafond` exclu · plafond **2 par MAR et
par an** · toutes les règles dures passent par `blocked()`, la fonction du générateur.

**Validation — égalité stricte sur 400 années** : 292 312 gardes, 0 journée sans binôme, et les
écarts (total, par axe, axe concerné, MAR concerné) **identiques année par année**. Mesuré :
**16,5 échanges/an** pour ~12 MAR, **+2,2 gardes rapprochées J±2/an**, et **0 violation
supplémentaire** (29 replis avec la passe, 29 sans, scénario par scénario).

**⚠️ Le banc d'essai simulait une équipe qui n'existe pas.** Corrigé dans `simulateur/demographie.js` :
six temps partiels **à cible pleine** ignorés (CATINEAU 80/100 · GHIGLIONE, LEVASSEUR, MENADE,
WIDEHEM, ZAMARON 90/100, ~175 jours/an manquants) · jours de TP **figés sur un jour fixe** (un 80 %
indisponible **tous les jeudis** avec une cible jeudi pleine) · 12 % posés en **week-end** ·
BONNET/BOUREGBA inversés · FERRIERO retiré de 2028 à 2046 alors que sa `date_fin` est vide.
Désormais : pool de TP proportionnel à la quotité, jours ouvrés uniquement, un tiers en blocs de
3-5 jours ; table alignée sur `MEDECINS` ; **SULTAN garde à 100 %** malgré ses 66 ans (exception
`noExempt`), **MENADE exempté à 60 ans**.
⚠️ **À FAIRE EN PRODUCTION** : cocher `no_garde = O` pour MENADE dans `MEDECINS`, sinon production
et banc d'essai divergent d'un gardeur.

**Effet : l'algorithme était sous-évalué.** À échantillon identique, écart médian par axe
3,80 → **1,70** ; pire par axe 5,90 → 4,30 ; médian sur le total 1,30 → **1,10**.

**Référence définitive (400 années)** : 292 312 gardes · **0 journée sans binôme** · écart médian
**sur le total 1,10**, pire **2,90**, dépasse 2 dans **3,5 %** des années, **jamais 3** ·
par axe : médian 1,70, pire 3,00.
*(Le « 1,20 » du deck était l'écart sur le TOTAL, pas par axe — deux mesures mélangées. Mesure
retenue pour le staff : le total.)*

**Les 7 violations d'invariants ne sont PAS des bugs** : ce sont des **replis délibérés**, chacun
annoncé par un avertissement (« unité non tenable, date placée seule », « couplage férié : binôme
samedi indispo », « jeudi↔samedi toléré »). Toutes à **Noël ou Pâques**, avec 5 à 11 gardeurs
disponibles contre 15 en médiane. Fausse alerte de ma part, corrigée.
→ *À faire* : que `checkInvariants` distingue une violation **avec** avertissement (normal) d'une
violation **silencieuse** (vrai bug) — sinon un vrai défaut s'y noiera.

**Deck du 04/09 mis à jour** : médiane 1,10 · dépasse 2 dans 3,5 % · jamais 3 · pire 2,90 ·
phrase sur le creux démographique supprimée · **nouvelle diapo « Un jour de congé gagné avant les
vacances »**.

**Scripts** : `simulateur/echanges_rg_vacances.js` · `simulateur/diag_invariants.js`.

---

**⚠️ Le compteur « 0 journée sans binôme » était aveugle.** Il construisait un dictionnaire à
partir des gardes existantes, puis comptait les dates ayant moins de 2 titulaires : **une journée
ENTIÈREMENT vide n'y figurait pas**. Il annonçait donc 0 quel que soit le résultat. Corrigé dans
`staff140.js` (comptage sur `P.dates`, pas sur les dates pourvues).
**Chiffre vrai : 4 journées non pourvues sur 292 312 gardes** (une par siècle), toutes fin
décembre, avec 3 gardeurs disponibles sur 17, et **toutes signalées** par le générateur
(`Manque MAR`). → Ne jamais réintroduire un « zéro » sur cette mesure.

**Récupérations — comportement assumé, ne pas « corriger ».** Le compte est exact (12 240 samedis
→ 12 240 R sur 120 années, y compris les samedis fériés qui ouvrent aussi un R). Mais le placement
refuse de sortir de l'année civile, et un repli balaie alors l'année **depuis janvier** : **369
samedis sur 626 ont leur récup posée AVANT le samedi qui la justifie**. Délai médian quand elle est
postérieure : 39 jours, jusqu'à 282.
**Règle actée par Arthur (31/07)** : *seul compte le fait que chacun ait autant de R que de samedis
sur l'année de planning ; la date importe peu, le comité déplace ponctuellement à la demande.*
Il n'y a **aucun report** d'une année sur l'autre — le générateur repart des seuls samedis de
l'année générée. Ne pas croire à un mécanisme de reliquat : il n'existe pas.

**Dossier complet du staff** : `simulateur/staff_dossier.js` extrait en une passe tout ce qui est
mesurable (équité par MAR et par axe, robustesse, absences par profil de quotité, congés simultanés,
espacement, démographie, confort) — écrit précisément pour ne plus avoir à relancer 400 années
parce qu'une donnée manque. Chiffres de référence au 31/07 : écart individuel médian **0,30**,
**88 % à moins d'une garde**, 99,7 % à moins de deux, **jamais plus de 2,9** · espacement médian
**9 jours** · absences **79 j** (temps plein) / **92 j** (90 %) / **113 j** (80 %) · **15 congés
simultanés** au maximum · pic de charge **48,8 gardes en 2040** avec 16 gardeurs.


---

### Première génération réelle 2027 — trois défauts que 400 années simulées n'ont pas vus (31 juillet 2026) · `code.gs` v2026-07-31.1 · `generateur_gardes.gs` v2026-07-31.1 · `Indispos.gs` v2026-07-31.1 · site v1.14.15

**Leçon centrale : le banc d'essai FABRIQUE les onglets et les dates, il ne relit jamais le
classeur réel.** Toute une famille de défauts lui est structurellement invisible. La première
génération en production les a sortis en quelques minutes.

**1. ⚠️ FRONTIÈRE D'ANNÉE — deux gardes attribuées à des MAR en congés.**
`reconstruireDatesHeaders` ne changeait d'année que si le libellé contenait 4 chiffres. Or les
en-têtes ne portent que le mois (« Janvier »). Un onglet annuel court du 1er lundi de janvier N au
dimanche précédant le 1er lundi de N+1 : il se termine par une **queue de janvier N+1**, qui était
datée en **année N**. Les absences des 2 derniers jours du planning devenaient **invisibles** →
OPPRECHT (INDISPO) et ZAMARON (VAC) de garde le 01/01/2028.
Règle : **si le numéro de mois recule, l'année s'incrémente.** Année écrite prioritaire, en-têtes
Date inchangés. Contrôle négatif : l'ancienne version datait bien les 2 dernières colonnes en 2027.
Fonction utilisée à **8 endroits**. `buildDateToCol` (13 autres lectures) est **sain** : il compte
les colonnes depuis le 1er lundi.

**2. Le statut `I` recopié dans GARDES était lu comme une ABSENCE.**
842 cas sur 2027. `I` = « présent, mais pas de garde » — `ABSENT_CODES` l'exclut explicitement,
mais **4 listes d'affichage** l'ajoutaient aux absents, dont deux comme **filtre** : le MAR
disparaissait de son secteur, consultations et affectations non traitées.
**Décision d'Arthur : option A** — `I` n'est plus écrit dans `GARDES` (l'info vit dans `INDISPOS`),
retiré des statuts posables et du glossaire. **Une donnée, un endroit.**
Le code **`E`** n'existait plus côté serveur mais traînait dans 5 listes : supprimé.

**3. Les avertissements du générateur n'arrivaient nulle part.**
`Logger.log` (invisible depuis l'application) + un `getUi().alert()` qui **lève une exception via
la Web App**, avalée par un `try/catch`. Replis, exceptions VD, « Manque MAR », passe de confort :
tout était perdu, **une année se générait à l'aveugle**. Désormais renvoyés par `generateGardes`,
transmis par le routeur, affichés sous l'étape du W2 (journées non pourvues en rouge).

**✅ Génération 2027 revalidée** (contrôles indépendants sur les onglets réels) : 0 statut `I` ·
**0 garde sur absence** · 364/364 jours à 2 gardes · 0 garde consécutive · 727/727 repos ·
récup = samedis pour chacun · 0 unité VD brisée.
**Équité : écart maximal 0,6 garde, 21/21 MAR à moins d'UNE garde de leur cible** (SAM 1,2 ·
JEU 0,5 · VD 1,2 · VJF 0,6) — bien mieux que la campagne (pire 2,9), 2027 étant une année
confortable à 21 gardeurs.
**Confort : 29 départs servis sur 76 éligibles (38 %), 16 MAR bénéficiaires.** Aucun repli.

---

**4. ⚠️ `canHold` et `blocked()` avaient divergé — DEUX GARDES D'AFFILÉE en production.**
`generateur_gardes.gs` v2026-07-31.3. Constaté sur la 2ᵉ génération réelle : PARTOUCHE de garde
le **03/01/2027** (dernier jour du planning 2026) **et le 04/01/2027** (1er jour de 2027).
WIDEHEM, l'autre titulaire du 03/01, avait bien son `RG` — pas lui.

*Mécanisme* : `CONFIG_TRANSITION` porte les 2 titulaires du dernier jour de N-1 ; le générateur
leur pose `RG_TRANSITION` sur le 1er jour de N, et `blocked()` le respecte. Mais l'**optimiseur
d'équité** n'appelle pas `blocked()` : sa fonction `canHold` refaisait ses propres tests, avec une
liste maintenue à la main — **`RG_TRANSITION` n'y était pas**. Le placement chronologique
respectait la contrainte, l'optimiseur la piétinait ensuite.
Comparaison exhaustive des 2 listes : **un second écart** — `canHold` ne vérifiait pas non plus le
**plafond des souhaits garantis** (un transfert pouvait dépasser la cible totale de PRUNET).

*Correctif retenu (Arthur : « il faut faire le vrai correctif »)* : **source unique**
`indispoIndividuelle(id, date)` — toutes les contraintes qui ne dépendent NI de l'ordre de
placement NI du contexte d'un transfert (présence, absences, `RG_TRANSITION`, semaine off, TP
fixes, NO_WEEKEND, les 4 règles du régime `souhait_plafond` dont son plafond). Appelée par
`blocked()` **et** par `canHold()`. Chacun ne garde que ce qui lui est propre : repos, récup,
gardes adjacentes, combos jeudi↔samedi et dimanche→mardi — car l'optimiseur raisonne sur un
**groupe** de jours et doit ignorer l'adjacence interne. Commentaire posé : *ne jamais y remettre
une liste locale*.
*Validation* : 60 années rejouées, **équité strictement inchangée**, 0 erreur de génération.

**Pourquoi la simulation ne pouvait pas le voir** : `RG_TRANSITION` naît de `CONFIG_TRANSITION`,
onglet que le banc d'essai **ne crée jamais**. Sur 400 années, ce code n'a jamais valu autre chose
qu'« absent », et la contrainte ne s'applique qu'**un jour par an** — le premier.

---

**✅ 3ᵉ génération 2027 — validée sur les vraies données (croisement GARDES × INDISPOS × STATS)**
`RG` présent pour PARTOUCHE **et** WIDEHEM le 04/01 · 364/364 jours à 2 gardes · 0 garde
consécutive · 0 garde sur absence · 0 repos manquant · récup = samedis pour chacun · 0 unité VD
brisée · 0 statut `I` · 0 absence d'`INDISPOS` non reportée · 0 code d'absence sans source ·
**61 souhaits honorés sur 64, aucun hors lundi-mercredi** · Noël/An : 8 MAR distincts sur 4 dates ·
BONNET et BOUREGBA 0 garde · **PRUNET 43 gardes pour une cible de 44, aucune en week-end ni férié
— plafond respecté** · 0 récup et 0 « 18 h » en week-end ou férié.
**Équité : médiane 0,6 · pire 1,6 (MENADE) · 20/21 MAR à moins d'une garde** (axes : SAM 1,2 ·
JEU 1,0 · VD 1,2 · VJF 0,7). **Confort : 32 départs servis sur 76 (42 %), 18 MAR.**

**À trancher** : 2 journées de « 18 h » posées sur des jours `INDISPO` (CATINEAU 22/01,
GUERIN 19/03). **Conforme au code** — `ABSENT_18` exclut délibérément `INDISPO`, qui signifie
« présent, mais pas de garde », et un 18 h n'est pas une garde. Question métier : un MAR qui se
déclare indisponible accepte-t-il un 18 h ce jour-là ? Si non, ajouter `INDISPO` à `ABSENT_18`.

**Divergence production / banc d'essai** : **MENADE a 33 gardes** en production — `no_garde` n'est
pas coché dans `MEDECINS`, alors que le modèle l'exempte au titre des 60 ans. À aligner avant
novembre.


---

## 🔜 À faire

- [x] 🪞 **Miroir — lot B — LIVRÉ ET DÉPLOYÉ (04/08 soir)** : Worker `.4` + `miroir.gs` `.4`,
  clés `gardes_{Y}` / `joursferies_{Y}` / `stats_{Y}` / `vacances_admin` (admin seul).
  Découverte en route : `getStats` est un dump d'onglet → Équité (source feuille) mirrorée
  sans mesure. Garde de fraîcheur 90 s après écriture planning sur Statuts/Équité.
- [x] 🪞 **`staff.html` — BRANCHÉE (v1.19)** : miroir + rejeu de transport.
- [x] 🪞 **Lot A-bis — semaines voisines ±1 préchargées** derrière la semaine courante.
- [x] 🪞 **Périmètre démo confirmé par Arthur : dashboard + index + indispos** (admin second plan).
- [ ] 🪞 **Répétition générale chiffrée — DERNIER JALON AVANT LE 04/09** : chaque page ×10,
  PC + mobile + navigation privée. Verdict « prêt » = **10/10 sous 2 s**, pas une moyenne.
  À caler sur une session PC tranquille (`chrono()`, lignes `miroir:`), chiffres consignés ici.
- [ ] 🪞 **Idée en réserve (non engagée)** : clé `panneau_{Y}` précalculée pour un premier clic
  case flash instantané — coût du calcul année entière PAR ÉCRITURE à mesurer d'abord ;
  le chauffage + voisines du 04/08 la rendent probablement inutile.

- [ ] 📽️ **Présentation staff du 04/09** — voir « Priorité 1 » en tête de section.
  Deck refait et poussé (`6ca0b09cd1`), `GARDES_2027` supprimé le 30/07. Reste : **répétition
  à blanc chronométrée**, relecture en projection, check-list de ménage post-démo.

*(La ligne « Performance — suite » a été supprimée le 30/07 : le chantier est clos, voir la section
Performance en tête de document. Le ROADMAP l'annonçait encore à faire alors que le code était
livré — d'où la règle : vérifier le code, pas le ROADMAP.)*

### Axes de développement (un fil de conversation chacun)

- [ ] 🧮 **Trois pistes ouvertes le 01/08/2026, conçues à moitié, aucune codée.** Elles partagent
  un même constat : **les règles ne sont appliquées qu'à la génération, jamais aux modifications
  manuelles qui suivent.**
  1. **Solde des récupérations de samedi.** Le générateur ouvre un R par samedi tenu
     (`recupDue`, `generateur_gardes.gs`) mais **le lien samedi→R n'est écrit nulle part** : la
     cellule de `GARDES_{Y}` ne contient qu'un `R` nu. Or `donGarde` / `echangeGardeJours`
     (`applyModification`) déplacent la garde **et le RG, jamais le R** : qui donne son samedi
     garde sa récup. ✅ **Le lien n'est pas nécessaire** pour le détecter : `computeStatsLive`
     compte déjà `sam` et `recupR` depuis `GARDES_{Y}` — le solde `sam − recupR` suffit, sans
     aucune donnée nouvelle. **Décision Arthur : le replacement du R reste MANUEL** (une date
     libérée chez le donneur n'a aucune raison d'être plaçable chez le receveur) ; l'outil affiche
     le déséquilibre, il ne le corrige pas.
     ⚠️ **À calibrer avant d'afficher une alerte** : `sam − recupR` n'est pas nul même sans échange.
     Le R se place dans une fenêtre de 2 à 16 semaines **et** doit rester dans l'année
     (`cDate.startsWith(String(year))`) : les samedis de novembre-décembre repartent sans R.
     Mesurer sur la génération 2027 réelle avant de coder l'écran.
     ✅ **Réglé le 01/08 : un samedi couplé à un jeudi ou un lundi férié ouvre bien un R** — le code
     le fait déjà (`if(dayByDate[dd].dow===6)`), seul le commentaire prêtait à confusion. L'unité de
     3 jours donne une récup, pas deux. Conforme à la règle d'Arthur, rien à changer.
  2. **Dette inter-annuelle calculée sur les gardes RÉELLEMENT effectuées.** La dette lit les réels
     de `STATS_GARDES_{N-1}`, qui est un **instantané figé à la génération** et n'est jamais
     réécrit ensuite. Un don ou un échange modifie `GARDES_{Y}`, jamais `STATS_GARDES_{Y}` ; à
     l'archivage (`setup_annee.gs`) **seule la colonne Noël/An est recalculée sur le réel**, les 15
     autres partent telles quelles dans `HISTORIQUE`. Conséquence : qui donne 8 gardes les porte
     quand même comme faites dans la dette de N+1, et se voit servir moins de gardes pour des
     gardes qu'il n'a pas faites. **Correctif court** : réécrire les réels avec
     `computeStatsLive(year)` **avant** la copie vers `HISTORIQUE`. Sans objet pour 2027
     (`PREMIERE_ANNEE_STATS_FIABLES = 2027`, dette neutre) — **mord à partir de la génération 2028,
     donc à traiter d'ici novembre 2027**. Accord de principe d'Arthur (« idée à creuser »).
  3. **Bilan personnel annuel du MAR** (`dashboard.html`) — « votre 2026 : 31 gardes pour une cible
     de 34,6 · 6 samedis · 2 fériés · Noël non · 6 récups dues, 6 posées ». Une autre façon de lire
     l'onglet Équité, pour que le MAR se situe sans lire un tableau de 23 lignes. Source :
     `getStatsLive` (qui renvoie déjà tout, échanges inclus) + `HISTORIQUE`. **Le moins cher des
     trois : un rendu, zéro modification serveur.** Accord de principe d'Arthur.

- [ ] 🔬 **Module libéral — brique CONVERGENCE 30 % (lots 2 et 4)**, seul morceau restant. Voir `docs/module-liberal/module_liberal_conception.md`.
  - ✅ **Déjà en production** (détail dans « Module libéral — chaîne complète » de la section Fait) : estimateur, devis, branchement au portail, déclaration d'intervention, volet comité. **Ne pas les reconstruire.**
  - Reste : **Lot 2 élargi** (déclaration enrichie, saisie des relevés, recoupement) puis **Lot 4** (réallocation + équité du désagrément).
  - 🆕 **Lot 2 ÉLARGI — décision du 26/07/2026 (remplace le cadrage du 24/07 ci-dessous sur un point).** La **déclaration d'intervention porte désormais la SPÉCIALITÉ et le MONTANT (BR)**. Conséquences : **une ligne = un patient** (fin de la fusion jour+secteur de `declareLiberal`) ; nouveau schéma `LIBERAL_{Y}` à 9 colonnes (`+ SPECIALITE, BR_CCAM, BR_NGAP`) ; onglet `SPECIALITES` (12 codes : `OPH ORL VIS URO ORT END GYN PED CI RI VAS AUT`, règle **`PED` = patient mineur, quelle que soit la chirurgie**) ; **le calcul par moindres carrés du §12 ter devient inutile** — le rendement se **ventile** (le relevé certifié fixe le niveau, les BR déclarées fixent la structure), il ne se somme jamais. **Trois étapes : 2A déclaration enrichie → 2B saisie du relevé + marges → 2C recoupement / taux de couverture / rendement.** Le 2A passe avant le 2B (le relevé est rattrapable rétroactivement, une intervention non déclarée est perdue) — **mais sans urgence tant qu'Arthur est le seul `LIBERAL=O`** : rien ne se perd aujourd'hui, le chronomètre démarre à l'ouverture aux autres. Le 2A doit être **rodé avant** cette ouverture. Détail : `module_liberal_conception.md` **v3.22**, §6.2, §12 ter, décisions 32 à 36. Bouton **« Déclarer ce parcours »** retenu plutôt qu'un montant obligatoire (option B : rendre le bon chemin plus court, pas plus contraignant).
  - **Cadrage Lot 2 du 24/07/2026 — toujours valable SAUF sur un point.** ⚠️ La déclaration MAR ne porte plus seulement du **volume** : elle porte aussi des **euros estimés (BR)**. Reste vrai et non négociable : **jamais un % issu des seules déclarations** — le dénominateur (activité publique) n'existe que dans le relevé. Le relevé administratif mensuel est le **socle certifié en euros** — seule source qui connaît le **dénominateur** (activité publique), donc seule à pouvoir donner un **%** de plafond. La **déclaration MAR** (Lot 3, déjà en prod) peut faire monter un compteur **en temps réel entre deux relevés, mais en VOLUME d'interventions uniquement, jamais en %** : elle ignore le public, et un acte déclaré ≠ un euro encaissé. Afficher un % issu des seules déclarations donnerait un chiffre faux au comité. Architecture : *position certifiée au relevé + tendance en volume depuis*. Arbitrage mensuel possible → relevé mensuel, l'écran de saisie garde son sens. Maquette de saisie explorée (17 lignes × 6 nombres, checksum sur Σ excédents recopiés, monotonie du cumul) — non poussée.
  - Chantier de **conception**, pas de code : mérite un fil de conversation dédié. Jeu d'essai disponible : le relevé réel janvier→juin.
  - Conception figée : seuil **30 % par axe** (CCAM technique **et** NGAP consultations, indépendants), objectif = optimiser le pot commun mutualisé, affichage seul côté comité.
  - Assets déjà dans le repo : conception, antisèche cotation CCAM/NGAP, `ccam_actes.json`, `estimateur-liberal.html`, guide. **Les 3 `.docx` ont été supprimés le 21/07/2026** (décision d'Arthur) : le HTML et le Markdown font foi, trois copies d'un même contenu étant trois occasions de se contredire. Contenu conservé dans `antiseche_CCAM_anesthesie_CHPG.md` et `guide_liberal_MAR.html`. Seul le **mémo de poche 1 page** n'a plus d'équivalent **de format** (son contenu est aux §3 et §5 bis de l'antisèche) — à refaire en HTML si le besoin revient. Récupérables dans l'historique git.
  - **Lots 0, 1 et 3 terminés** (secteurs, fondations données, placement bloc). **Ordre restant : 2A → 2B → 2C → 4.** Le Lot 4 n'est pas envisageable avant **mi-2027** (il lui faut des rendements mesurés, donc plusieurs mois de 2A+2B).
  - 📌 **Versionnement — règle affinée le 26/07/2026.** La version du site vit dans **4 fichiers, 10 emplacements** : `admin.html` (3), `dashboard.html` (3), `docs/guide-mar.html` (2), `docs/guide-comite.html` (2). ⚠️ `index.html`, `indispos.html`, `staff.html` et `absences.html` **n'en portent aucune** — les instructions de projet annoncent encore « 5 fichiers, 9 emplacements », c'est faux. **Le 2A passera en v1.10** (fonctionnalité, 2ᵉ chiffre). **La v2.0 est réservée au jour où le module libéral s'ouvre au groupement** (colonne `LIBERAL = O` pour les autres MARs, tuile visible) : la version est un repère pour les utilisateurs, pas pour le développeur — tant qu'Arthur est seul à voir le module, rien n'a changé de leur point de vue.
  - 🆕 **Cotations types (27/07/2026, après le 2A).** Onglet `COTATIONS_TYPE` (`GROUPE · NOM · ORDRE · CODE · ROLE · MOD7 · MODA · LC`) + action `getCotationsType`, amorcé sur le groupe **Endoscopie** : *Gastro + colo* (`HHQE002` principal + `ZZLP025` associé 50 %), *Gastro seule*, *Colo seule*, toutes avec modificateur 7 et `CS` associée. Un bouton remplit le tableau de cotation en un clic ; **la page n'affiche que le groupe choisi et rien tant qu'aucun ne l'est** (tient à 50 cotations comme à 3), choix mémorisé pour la session. **Aucun tarif stocké** (il vient de l'index CCAM), **uniquement des lignes d'activité 4**, **aucun modificateur d'urgence** (pas de libéral en urgence au CHPG). Motif : la cotation devient nécessaire pour **tous** les patients libéraux (décision 41), et la consultation d'endoscopie du mardi/jeudi après-midi est composée à 100 % de libéral.
  - 🆕 **Modificateur 7 coché par défaut** sur toute nouvelle ligne (présent sur tous les relevés observés ; une case oubliée sous-évaluait la BR de 6 %). Le tableau de cotation démarre **vide** (il contenait deux lignes d'orthopédie de démonstration).
  - ✅ **Index CCAM aligné en v84 (régénéré le 27/07/2026).** `ccam_actes.json` porte `version: CCAM v84`, `effet: 2026-07-03`, `tarif_act4: CCAM v84 (NX tarifaire, 03/07/2026)` — **codes et tarifs sur la même version**, 8 558 actes dont 4 939 tarifés (activité 4, contexte 007/017). Le décalage codes v83 / tarifs v80 qui faussait toute BR estimée est corrigé. La version est affichée dans la page, avec **alerte d'obsolescence à 8 puis 14 mois** (bandeau de cotation + ligne du Diagnostic) : une vérification automatique reste **impossible** (pas d'API Cnam, pas de lecture de site tiers depuis GitHub Pages), l'alerte est donc calendaire. **Prochaine régénération à prévoir vers mars 2027.**
  - ⚠️ **Piège de cache** : les listes servies par l'onglet sont mises en `sessionStorage`. Une colonne ajoutée reste invisible tant que la session n'est pas fermée (`Ctrl+Maj+R` ne suffit pas). Clés désormais versionnées — **incrémenter le suffixe à chaque changement de structure**.
  - 🆕 **Lot 2B LIVRÉ (27/07/2026).** Onglet `LIBERAL_CA_{Y}` + action `getReleveLiberal` (**lecture seule** : le relevé est recopié à la main dans le classeur, rien ne passe par `admin.html` — décision d'Arthur, le comité gère le planning, pas le libéral). Onglet créé pré-rempli par `creerReleveLiberalAnneeEnCours()`. **Checksum en formules dans le classeur, vérifié au centime en réel** — confirmant que la ligne « ACTIVITÉ LIBÉRALE » du document est bien la somme des excédents **des deux axes**. Rattrapage allégé : le relevé étant cumulé, **juin seul suffit** (108 nombres au lieu de 650). Nouvelle page **`suivi-liberal.html`** (racine) : position par axe, groupe en initiales trié par excédent, totaux par axe jamais consolidés, **aucune projection**. Colonne **« D'ici décembre »** : secteurs à venir en pastilles colorées, **descriptif seul**. Tuile Dashboard **qui se sépare en deux au clic** (Cotation & déclaration / Suivi des 30 %).
  - ⚠️ **Constat du 27/07 : 10 MAR sur 18 en excédent** au cumul de juin, dont **2 sur le seul axe NGAP** (non corrigeables par la réa). Cela **fragilise l'hypothèse ayant servi à geler le Lot 5** (« le dépassement s'efface avec les deux entrants ») — à revérifier sur deux ou trois mois consécutifs.
  - ⚠️ **Code d'accès désormais INSENSIBLE À LA CASSE** (`checkCode`, Indispos.gs). Le même code était accepté sur mobile (`autocapitalize` corrige) et refusé sur PC. Touche **toutes** les pages du portail. Un code vide est désormais refusé explicitement.
  - ⚠️ **La colonne `LIBERAL` porte trois métiers** : membre du groupement, visibilité de la tuile, présence sur le relevé. Passée à `O` pour les **19**, tuile restreinte par `only` en attendant l'ouverture.
  - 📅 **Prochaine séance (27/07/2026) : les 4 pushs du 2A** — (1) GAS `portail.gs` + `setup_annee.gs` ; (2) page libérale (bouton « Déclarer ce parcours », spécialité, BR éditables, date de consult) ; (3) volet admin regroupé par secteur avec le compte ; (4) guides + **v2.0**. Le push 1 doit être **déployé** avant le push 2.
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
      `controle-absences.html`, **pas** `secretariat.html`.
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
      ⚠️ **CORRECTION du 26/07 — le diagnostic compare QUATRE fichiers, pas deux.**
      `Indispos.gs` l.2023 : `dashboard.html`, `admin.html`, **`docs/guide-mar.html`** et
      **`docs/guide-comite.html`**. J'avais conclu à tort « 2 fichiers / 6 emplacements » en
      ne cherchant que dans les 5 pages visibles — **les guides portent aussi la version**, et
      c'est ce qui faisait échouer le diagnostic.
      **Quatre formes de version sont reconnues**, et elles doivent être identiques DANS chaque
      fichier ET entre fichiers : `SITE_VERSION = 'vX.Y'` (constante JS), `id="verBadge">vX.Y<`
      (badge HTML), `Version <strong>vX.Y</strong>` (en-tête des guides), `SITE_VERSION: vX.Y`
      (marqueur en commentaire).
      **Décompte réel : 3 occurrences dans `admin.html`, 3 dans `dashboard.html`, 2 dans chaque
      guide — soit 10 emplacements sur 4 fichiers.** `index.html`, `indispos.html` et
      `staff.html` n'en portent aucune et ne sont pas contrôlées.
      ⇒ **Tout bump doit toucher les 4 fichiers dans le même push**, sinon le diagnostic signale
      une erreur (constaté le 26/07). *(Remarque d'Arthur : l'échelle de versions n'est pas encore visible des
      utilisateurs, l'interface n'étant pas en service.)*
    - 📍 **Position de la tuile : 2ᵉ, juste après « Planning »** (validée sur visuel le 24/07).
      Alternative écartée : après « Mes congés », auprès des tuiles personnelles.
      Le marquage « Nouveau » et le cerclage du visuel de validation sont **propres au visuel** :
      en production la tuile est identique aux autres.
    - ✅✅ **ÉTAPES 1 + 2 FAITES ET VALIDÉES EN PRODUCTION le 25/07/2026** (commit `23aa79e`,
      `GAS_VERSION_INDISPOS = 2026-07-24.3`, recopié dans Apps Script et déployé).
      - `checkCode` lit désormais **`SECRETARIAT_CODE`** dans CONFIG (même régime qu'`ADMIN_CODE` :
        aucun défaut ; clé absente ⇒ le rôle n'existe pas). Boucle CONFIG unifiée, `break` retiré
        mais **« première occurrence gagnante » conservée** ⇒ comportement admin inchangé.
        Retour : `{role:'secretariat', id:'SECRETARIAT', name:'Secrétariat', initials:'SEC'}` —
        `name`/`initials` servent **uniquement de libellé dans le journal CONNEXIONS**
        (`logConnexion` lit `user.name`) ; le code étant partagé, on ne peut pas savoir QUI s'est
        connecté. Aucune donnée nominative renvoyée.
      - **`SECRETARIAT_ACTIONS`** (Set) + **refus par défaut** placé juste après `checkCode`,
        **avant** `WRITE_ACTIONS_LOCK` et avant tout traitement. **Périmètre actuel : `login` seul.**
      - ✔️ **`doPost` délègue à `doGet`** (`Indispos.gs` l.3275) : le garde couvre **les deux**
        points d'entrée. Vérifié.
      - **Tests réels passés le 25/07** (appel direct de l'URL du Web App, sans interface) :
        `login` ⇒ `role:"secretariat"` ; `getStatsLive` ⇒ refus ; **`getPlanningJson` ⇒ refus**
        (le test qui protège les motifs d'absence) ; non-régression MAR + admin + diagnostic
        Maintenance affichant bien `2026-07-24.3`.
      - ⚠️ **Format du code partagé : éviter `&`** (coupe les URL) **et `O`/`0`/`I`/`1`**
        (confusions à la dictée — c'est pourquoi `generateCode()` les exclut déjà). Lettres,
        chiffres et tirets uniquement. Ex. `SEC-4KFE-HXUP`.
      - ⚠️ **Effet de bord connu, non bloquant :** `dashboard.html` **ne teste pas le rôle** au
        login (l.1176 : tout `success` ouvre le portail). Saisir le code secrétariat y affiche donc
        le portail complet, dont toutes les tuiles échoueront (serveur refuse). **Pas une faille**
        — corrigé à l'étape 6 (redirection du rôle secrétariat vers `absences.html`).
    - ✅ **ÉTAPE 3 FAITE ET TESTÉE EN PRODUCTION le 25/07/2026** — action `getConsultAbsences`
      (commits `454942f`, `d66c1a4` ; `GAS_VERSION_INDISPOS = 2026-07-25.3`).
      - 🔴 **PIÈGE MAJEUR RENCONTRÉ — les consultations de MATERNITÉ n'existent dans AUCUNE
        donnée.** Première version lisant `PLANNING_OVERRIDES` : elle ratait toutes les CS-MAT.
        Cause : la règle vit dans **`admin.html` l.2586** — « la consult CS-MAT et la ligne MAT
        sont la MÊME personne, le MAR de mater fait la consult systématiquement ». Elle est
        **recalculée à l'affichage** à partir du secteur ; la cellule contient `MAT`, jamais
        `CS-MAT`. ⇒ **Ne jamais chercher les consultations par le seul préfixe `CS-`.**
      - **Source corrigée : le PLANNING PUBLIÉ `planning_{Y}.json`**, pas les overrides. Motif :
        les overrides ne contiennent que le placement manuel du comité ; la génération (dont les
        affectations de secteur) n'y est pas. Argument décisif d'Arthur : *si ce n'est pas publié,
        ça n'apparaît pas dans `index.html` non plus, donc ça n'existe pour personne* — le JSON
        est donc la vérité par définition. Publication systématique après modification (confirmé).
      - **Le JSON est lu CÔTÉ SERVEUR uniquement** et n'est jamais transmis : il contient le code
        d'absence brut de chaque MAR dans `status`. La règle « dates seules » reste intacte.
      - ⚠️ **DETTE : la règle du miroir maternité existe maintenant à DEUX endroits** —
        `admin.html` l.2586 (affichage) et l'action GAS. Les modifier séparément les fera diverger
        silencieusement. À traiter si la règle évolue.
      - **Trois absences hors `GARDES` ajoutées** (sans quoi faux « disponible ») : `TP` jours
        fixes non travaillés, `OFF` semaine off du rythme 2/2, `HS` hors période d'activité.
        Validé sur données réelles (BONNET/MENADE/SEVERAC en TP, TRAN en OFF puis HS au 01/09).
      - **Codes comptés absents = `ABSENT_CODES` (code.gs l.245)** : RG,V,F,CTP,CP,R,A,TP,CL.
        **`G`/`G2` volontairement exclus** — décision d'Arthur : *un MAR de garde peut assurer du
        libéral*. `CTP` conservé par sécurité bien que mort dans GARDES (`generateur_gardes.gs`
        l.1283 traduit `TP`/`CTP` → `TP`) : le classeur est éditable à la main.
      - **MAR hors service sur TOUTE la fenêtre retirés** de `noms`, `absences` **et**
        `consultations`. ⚠️ Les retirer des seules absences les aurait rendus **présents tous les
        jours** aux yeux du frontend, donc proposés comme remplaçants — le faux « disponible » que
        l'outil doit empêcher. Un `HS` **partiel** (TRAN, part au 01/09) doit au contraire RESTER.
      - **Tests réels 25/07 :** code MAR ⇒ `motifs:true` + champ `c` présent ; code secrétariat ⇒
        `motifs:false`, `moi:null`, **aucune occurrence de `"c":`** dans toute la réponse.
        CS-MAT correctement détectées (FROHLICH mar. 28/07, SALA jeu. 30/07, SULTAN 18 et 20/08).
      - ⚠️ **Conséquence visible : liste très déséquilibrée** tant que l'horizon de placement
        n'est pas tenu. Les CS-MAT, déduites du secteur généré, apparaissent sur des semaines ;
        les autres, posées à la main, s'arrêtent à ~4 jours.
      - ❓ **À vérifier :** aucune CS-MAT entre le 3 et le 14/08 (4 mardis/jeudis). Personne en MAT
        ces matins-là (plausible en août), ou trou résiduel du miroir ? Contrôle visuel dans
        `admin.html` semaine du 03/08, ligne MAT mardi matin.
      - 📝 **Limite assumée :** masquer le motif ne masque pas la **forme**. Quinze jours
        consécutifs se lisent comme un arrêt long même sans le code `CL`. Inhérent à l'affichage
        de dates, acté en connaissance de cause.
    - 🎉 **LOT 5-bis TERMINÉ ET EN PRODUCTION le 25/07/2026** — conception → prod en une session,
      6 étapes, toutes testées réellement. **Site en `v1.9.5`.**
      - **Étapes 4 et 5 (25/07).** L'étape 4 n'a demandé **aucune action serveur** : le frontend
        reçoit déjà les absences de tous les MARs et toutes les consultations, le calcul « qui peut
        prendre ce patient » se fait entièrement dans le navigateur.
        Page **`absences.html`** (commits `c53cc0b`, `7991009`) — testée par **jsdom** avant push :
        connexion, filtre vue MAR, regroupement en plages, panneau de remplaçants.
        Code repris de `sessionStorage.chpgViewCode`, **partagé avec les autres pages** ⇒ un MAR
        déjà connecté au portail n'a rien à ressaisir. Écran de connexion **aligné sur le skin du
        portail** (drapeau, champ masqué, bouton rouge) : c'est l'unique écran que verra le
        secrétariat, qui n'a pas de Dashboard (lien « Retour au portail » masqué pour ce rôle).
      - ⚠️ **Écart avec la maquette, assumé :** « même secteur » dans le panneau de remplaçants
        n'est plus un **rattachement** (la maquette utilisait une liste figée secteur → MARs) mais
        une **déduction** : un médecin est réputé du même secteur s'il tient déjà une consultation
        du même type. Bon indicateur en pratique. Pour le vrai rattachement, il faudrait le faire
        remonter par le serveur.
      - **Étape 6 — MISE EN SERVICE PARTIELLE (décision d'Arthur, 25/07).** Tuile
        « Mes consultations » posée sur `dashboard.html` mais **restreinte à FROHLICH**
        (`only:'FROHLICH'`, mécanisme existant de la tuile CRH). Motif : l'horizon de placement
        est encore de ~4 jours ; ouverte à tous, l'écran serait presque vide et la première
        impression — celle qui colle — serait mauvaise.
        Commits `ef608e2` (icônes), `0f09318` (dashboard), `6870d77` (admin).
      - ⚠️ **`calendar-check` n'existait PAS** dans `assets/vendor/lucide-icons.js` : ce bundle est
        **réduit aux seules icônes utilisées** (23). Sans l'ajout, la tuile n'aurait affiché aucune
        icône. **Réflexe à garder : vérifier la présence de l'icône dans le bundle avant d'en poser
        une nouvelle.**
      - **Version `v1.9.5` et non `v1.10`** : la fonctionnalité n'est pas mise en service, elle
        n'existe que pour un utilisateur. Le 2ᵉ chiffre marquera le vrai jalon.
        `guide-mar.html` **volontairement non modifié** pour la même raison : documenter une tuile
        que personne ne voit embrouillerait.
      - 🔜 **GESTE UNIQUE DE MISE EN SERVICE**, le jour où le comité posera les consultations à
        4 semaines : retirer `only:'FROHLICH'` de la tuile `consult` dans `dashboard.html`, passer
        le site en **`v1.10`** (3 emplacements dans `dashboard.html` + 3 dans `admin.html`, à garder
        égaux — le diagnostic vérifie), et mettre à jour **`docs/guide-mar.html`**. Un commentaire
        au-dessus de la tuile le rappelle dans le code.
    - ✅ **28/07/2026 — RECADRAGE ET MISE À NIVEAU DE L'ÉCRAN. Site `v1.14.1`.**
      Détail complet au **§5.5** de `docs/module-liberal/module_liberal_conception.md` (v4.7).
      - **Périmètre acté : cet écran ne concerne QUE le libéral**, jamais le public. Rien dans le
        code ne le disait ; il a été lu comme un contrôle d'absence général, y compris par moi.
        Les textes de la page, `guide-mar.html` et `guide-liberal.html` le disent désormais.
      - **Tuile `consult` : `liberal:true`** (réservée au groupement, 19 membres) **+ filtre
        serveur `if (!user.liberal)`** sur les montants. Masquer la tuile ne protège rien :
        `absences.html` est une page publique, seul le serveur ferme la porte.
      - **Classement par marge CCAM déplacé côté serveur** (`getConsultAbsences`). Le navigateur
        appelait `getReleveLiberal`, action **interdite au secrétariat** : la liste sortait donc
        non classée pour lui, dans l'ordre de l'onglet MEDECINS — d'où les MAR en excédent en
        tête. La réponse ne transporte plus qu'**une marge par MAR**, jamais tarifs ni
        pourcentages ; masquer les montants plus tard = **une ligne, un seul endroit**.
      - ⚠️ **Deux critères absolus supprimés, pas amendés.** « Présent sur TOUTE la période » et
        « consultation avant le DÉBUT de la période » renvoyaient **« personne »** sur un congé
        réel de 19 jours ouvrés (29 juillet → 24 août). Remplacés par une **couverture jour par
        jour** : présent ce jour-là + une consultation strictement avant, celle-ci pouvant tomber
        **pendant** la période. Plages affichées par candidat, **aucun candidat tronqué** (le
        `slice(0,3)` masquait les meilleurs derrière les 3 premiers de la feuille MEDECINS).
      - **Vérifié par jsdom avant push** : plages trouées par les congés propres, exclusion des
        non-membres, exclusion d'un MAR absent tout le mois, membre sans relevé proposé sans
        pastille, `0 €` neutre au seuil exact.
      - ⚠️ **Incident de concurrence évité.** Au moment du push, `gas/Indispos.gs` portait **trois
        commits d'une autre session** (versions `.6` à `.8`, chantier performance). Le contrôle de
        divergence les a détectés ; le patch a été **rejoué sur la version fraîche**. Sans ce
        contrôle, trois optimisations étaient effacées. La règle « GET du SHA juste avant le PUT »
        a payé pour de vrai ce jour-là.
      - 🔜 **Reste à éprouver sur le terrain** : le cas d'usage réel est **ORL / viscéral /
        orthopédie**. La maternité reste affichée (miroir `MAT` → `CS-MAT`) mais son circuit
        libéral est **à part** : ce n'est pas là que l'écran sera jugé.
    - 📌 **Ordre de construction (arrêté 24/07) :** (1) `SECRETARIAT_CODE` dans CONFIG +
      `checkCode` renvoie le 3ᵉ rôle → (2) liste blanche refus-par-défaut → (3) action de lecture
      des absences, autonome, deux réponses selon le rôle → (4) action « qui peut prendre » →
      (5) `absences.html` → (6) tuile Dashboard + bump de version + `guide-mar.html`.
      Étapes 1–4 = GAS (recopie manuelle + nouveau déploiement) ; 5–6 = frontend.
      ⚠️ `getMARsDispoJour` (`Indispos.gs` l.2727) est **admin-only** et répond à une **autre**
      question (combler une case flash, groupée VOLANT/CTP/R) : l'étape 4 demande sa propre action,
      ne pas la réutiliser telle quelle.
    - 🎨 **Maquette v3** (poussée le 24/07, **supprimée du dépôt le 02/08/2026** — écran livré :
      `absences.html` ; consultable dans l'historique git). File des consultations posées à gauche, groupées par
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

- [x] ✅ **Boîte de réception dans `admin.html` — EN PRODUCTION le 26/07/2026.** Bouton
  **✉ Messages** dans la barre d'admin, tiroir latéral, point rouge des non lus.
  Commits `abe6999` (GAS), `f890363` (admin), `c5c6f52` (dashboard). **Site en `v1.9.6`.**
  - **Serveur — 3 actions de LECTURE seule**, toutes `user.role !== 'admin' → _deny()` :
    `mailNonLus` (compteur, 1 opération), `mailListe` (20 messages, ~40 op.), `mailMessage`
    (corps d'un message). Passent par le **service avancé Gmail**, pas par `GmailApp` — qui
    aurait imposé une autorisation large. Testé en réel : `{"success":true,"nonLus":35}`.
  - ❌ **Pas d'iframe** (Gmail refuse d'être affiché dans une page tierce) ❌ **pas de lien vers
    Gmail** (la boîte appartient au compte propriétaire de tout le back-end).
  - **Chargement (conforme à la décision du 24/07) :** le contenu ne part qu'**au clic** ; le
    **compteur part 1,5 s APRÈS l'affichage**, en tâche de fond. ⚠️ **Ne jamais le mettre dans
    `getAdminBootstrap`.** Vérifié en production : l'ouverture de l'admin n'est pas ralentie.
    Au clic, le tiroir s'ouvre **immédiatement** avec un indicateur — même durée, ressenti tout
    autre.
  - 🔒 **Deux barrières indépendantes contre l'injection :** le serveur ne renvoie que du
    **texte brut** (parcours des parties MIME, `text/plain` uniquement, le HTML du message
    n'est jamais transmis) ; et le client pose le corps avec **`textContent`, jamais
    `innerHTML`**. Expéditeur, objet et aperçu passent par une fonction d'échappement.
  - **Quotas (mesurés le 24/07)** : 20 000 opérations Gmail/jour sur compte *consumer*, compteur
    **distinct** des 100 destinataires/jour de l'envoi. Usage lourd (5 personnes × 10 ouvertures)
    = ~12 % du quota. Non-sujet.
  - ⚠️ **Confidentialité actée :** tout le comité voit tous les messages de cette adresse.
    C'est l'objet de l'outil pour des demandes de service, mais **aucune cloison** si un MAR y
    écrit quelque chose de personnel.
  - 🐛 **Correctif du 26/07 — décodage (`GAS 2026-07-26.2`, commit `763dbe4`).** Gmail encode le
    corps en base64 **URL-safe et SANS remplissage** ; `Utilities.base64DecodeWebSafe` échoue
    dessus. **Mesuré : ~2 messages sur 3** tombaient en « Impossible de décoder la chaîne ».
    ⇒ normaliser soi-même (`-`→`+`, `_`→`/`, puis compléter à un multiple de 4) avant
    `base64Decode`. Ajouté au passage : les messages **HTML seuls** sont convertis en texte
    **côté serveur** (le HTML ne part jamais au navigateur), et les **entités accentuées**
    (`&eacute;`, `&#233;`, `&laquo;`…) sont décodées — indispensable pour des mails en français.
  - 🐛 **Correctif du 26/07 — compteur figé (`GAS 2026-07-26.3`, site `v1.9.7`).** Lire un message
    dans l'admin ne le marquait pas lu dans Gmail : le compteur ne bougeait jamais, **ce qui était
    incompréhensible pour le comité**. ⇒ `Gmail.Users.Messages.modify` retire le libellé `UNREAD`
    à l'ouverture ; la pastille de la ligne disparaît et le compteur se rafraîchit.
    - **Écarté : un onglet « messages traités » dans le classeur.** Aurait gardé
      `gmail.readonly` et distingué « non lu » de « non traité », mais ajoutait une pièce au
      système. Arthur ne lisant **jamais** cette boîte dans Gmail, les deux notions se confondent
      — l'option simple devient la bonne.
    - ⚠️ **`mailMessage` reste HORS de `WRITE_ACTIONS_LOCK`, volontairement** : ce verrou protège
      le **classeur** contre les écritures concurrentes ; l'y mettre sérialiserait la lecture des
      messages pendant 20 s sans rien protéger. Le retrait d'un libellé est **idempotent**.
    - Le marquage a son propre `try/catch` : **un échec de marquage n'empêche jamais de lire**.
  - ℹ️ **Faux problème rencontré :** après un redéploiement, l'admin peut tourner sans fin avec un
    `404` en console vers `script.googleusercontent.com`. C'est la page **en cache** qui appelle
    l'ancienne adresse temporaire de Google. **Ctrl+Maj+R suffit** — ne pas chercher plus loin.
  - 🔜 **Répondre depuis l'admin : NON FAIT, et volontairement.** Ce serait une **écriture**
    (⇒ `WRITE_ACTIONS_LOCK`, quota d'envoi) et exigerait d'élargir l'autorisation Gmail.
    Décision distincte, à reprendre explicitement — ne pas y glisser par commodité.
  - 📌 **Reste à faire : mettre à jour `docs/guide-comite.html`** (nouveau bouton visible par
    tout le comité).

- [ ] **Sorties de garde réa / anesthésie non distinguées** dans l'Excel (une seule ligne « SORTIES DE GARDE »). Le statut `RG` est unique : impossible de savoir de quelle garde sort la personne. Piste : un second statut (`RG2`), ou déduire depuis la veille — mais le lundi renverrait au dimanche de la semaine précédente, hors `daySlots`.
- [ ] Picker des consult libérales endo : filtrer/avertir sur la présence au bloc en semaine N+1. **Plus aucun contrôle automatique depuis le retrait de la rotation (20/07/2026)** — l'attribution est 100 % manuelle et la règle du 8.1 est à vérifier de tête par le comité (documenté dans `guide-comite.html` § 8.2).
- [ ] *(Sécurité, à l'appréciation d'Arthur)* rotation du token GitHub.
- [x] ✅ **Sauvegarde hors-compte — INSTALLÉE ET VÉRIFIÉE le 26/07/2026.** Script autonome dans le
  compte Google **personnel** d'Arthur, déclencheur **hebdomadaire (dimanche ~5 h)**, dossier
  `Sauvegardes Planning-CHPG`, rotation sur 8 copies. Vérifié dans le Drive : projet créé, dossier
  créé, copies réelles présentes (69 568 o). Marche à suivre : `docs/sauvegarde-compte-perso.md`.
  - **Partage en LECTEUR suffit** — testé : la copie **emporte le script attaché**. Le compte
    personnel ne peut donc jamais modifier la production. Classeur : ~78 Ko, stockage non-sujet.
  - ⚠️ **Piège vérifié le 26/07 :** avec plusieurs comptes Google connectés, l'ouverture affiche
    « Impossible d'ouvrir le fichier ». **Ni un problème de droits, ni une sauvegarde corrompue** —
    ouvrir en **navigation privée** avec le seul compte personnel. À savoir avant un jour de panne.
  - Procédure de restauration complète (dont **l'adresse de déploiement qui change**) :
    `docs/guide-technique.html` §21.
  - *(Ancien item, pour mémoire : `backupHebdo` du compte planning reste en place, lundi ~4 h — les
    deux sauvegardes sont volontairement décalées.)*
- [ ] ⚠️ **`markVeille` écrit sans verrou ni contrôle de rôle** (constaté 24/07/2026, anomalie
  **préexistante**, sans rapport avec le Lot 5-bis). Elle marque un article de veille comme lu —
  donc une **écriture** — mais elle est **absente de `WRITE_ACTIONS_LOCK`** (`Indispos.gs` l.1043)
  et n'a aucun contrôle de rôle dans `portailRoute` (`portail.gs` l.32). Risque faible vu l'usage
  (un seul lecteur à la fois en pratique), mais c'est une vraie omission. À traiter **séparément**,
  ne pas la glisser dans un autre lot.
- [x] ✅ **`appsscript.json` versé au dépôt** (26/07/2026, commit `e2ff328`). Il manquait :
  le dépôt ne contenait pas les autorisations OAuth, donc pas 100 % de quoi reconstruire le
  projet. ⚠️ **Ma première version était INVENTÉE** (mauvais fuseau, bloc `oauthScopes`
  inexistant chez Arthur) — remplacée par le manifeste réel. *Leçon : ne jamais reconstituer un
  fichier de configuration de mémoire ; un manifeste faux est pire qu'aucun manifeste, il
  tromperait le jour d'une restauration.*

- [x] ✅ **DETTE REFERMÉE le 26/07/2026 — autorisation Gmail restreinte.** Passée de
  « Lire, rédiger, envoyer **et supprimer définitivement** » à « **Consulter, rédiger et
  envoyer** » (`gmail.modify`). **La suppression n'est plus possible.**
  - ⚠️ **Piège majeur à retenir : Google ne retire JAMAIS une autorisation déjà accordée.**
    Déclarer un scope plus étroit dans `appsscript.json` ne suffit pas — l'accord antérieur
    subsiste. **Il faut révoquer explicitement** : myaccount.google.com → Données et
    confidentialité → Applications tierces → Planning-CHPG → *Tout supprimer*, puis exécuter une
    fonction pour relancer le consentement, puis **redéployer**.
    ⚠️ Le site est **hors service entre la révocation et le redéploiement** (quelques minutes).
  - **`gmail.modify` et non `gmail.readonly`** : ouvrir un message doit le marquer LU, sinon le
    compteur de non-lus ne bouge jamais (voir ci-dessous). `modify` reste **plus étroit** que
    l'accès large accordé initialement.
  - **Écran de consentement — 6 lignes, à cocher TOUTES**, elles correspondent exactement aux 6
    scopes du manifeste : Drive, Sheets, Gmail, service externe (`script.external_request`),
    envoi de mail (`script.send_mail`, = MailApp pour les codes d'accès), exécution en l'absence
    de l'utilisateur (`script.scriptapp`, = déclencheurs). En décocher une casse la fonction
    correspondante (sans Drive : plus de publication ; sans déclencheurs : plus de sauvegarde
    hebdomadaire ni de veille).

- [ ] **Étape 3 (non urgente)** : retirer les tables en dur (`SECTEURS`, `CS_TYPES`, `CS_REQUIRED`,
  `CS_OPENABLE`) et rendre le **repli visible**. Aujourd'hui il est silencieux : une panne de lecture
  ferait tourner les pages sur le code en dur sans le dire. Inoffensif tant qu'on ne compte pas dessus.

---

### Chantier performance du 1er août 2026 — instrument, décomposition, cache · site v1.16.7

**Point de départ :** ouverture d'`admin.html` mesurée à 50-107 s, sans qu'on sache où
partait le temps. Seul `chronoAPI()` existait, et il ne mesurait que les appels.

**1. Instrument `chrono()` / `chronoClics()`** (les 5 pages, § 23 du guide technique).
Mesure la page, les ressources tierces, les appels (avant `doGet` / `doGet` / réseau), les
fonctions d'affichage, l'écran figé et **le coût d'un clic** (attente / traitement / écran).
Côté serveur : `_glob_ms` (code global avant `doGet`) et `_detail` (les 10 étapes du
bootstrap). C'est lui qui a tout permis — rien n'aurait été trouvé sans.

**2. Ce que la mesure a démenti.** Trois hypothèses tirées de la LECTURE du code, toutes
fausses :
- `renderWeek()` rappelée entièrement à chaque placement : **17 ms de moyenne, 30 ms au
  pire**. Aucun problème. Le coût d'un clic est la PEINTURE (100-230 ms), pas notre code
  (10-25 ms). Le pire clic mesuré — onglet Équipe, 288 ms — c'est 1 ms de code.
- Les 500 Ko d'`admin.html` : **0,44 s d'analyse**, 2 % du temps d'ouverture.
- `JSON.parse`/`stringify` de 350 Ko : **6 ms**.
- **Le JS du navigateur coûte 0,1 s au total. Le problème n'a jamais été là.**

**3. Cascade d'ouverture corrigée.** Le premier appel d'un chargement revenait
« Code invalide » en 14-18 ms de serveur — la requête arrivait **sans son corps**. Le
serveur distingue désormais `Code absent de la requête` de `Code invalide` (2 lignes dans
`_routeRequete_`), et la couche d'appel **renvoie une fois** sur ce message précis.
Sûr pour toute action, y compris une écriture : ce message prouve que le serveur n'a RIEN
fait. Résultat : 3 appels → 1 à l'ouverture.

**4. Cache de configuration** (voir PARTIE 1). −1,8 s par appel, 6 → 3 allers-retours Sheets.

**5. Deux correctifs retirés le jour même** — voir la RÈGLE ABSOLUE en PARTIE 1 : appel de
réveil et délai d'abandon court. Les deux ajoutaient une requête dans une file sérialisée.

**Résultat :** ouverture d'admin **5,2 s** (1 appel, `doGet` 2 551 ms) contre 50-107 s le matin.

**Ce qu'il reste, et qui n'a plus de marge :**

| Poste | Durée | Marge |
|---|---|---|
| Planning + affectations (Drive) | ~1 400 ms | aucune : ce sont les données |
| Journal de connexion (écriture) | 210-480 ms | **réelle, non explorée** |
| Existence année N+1, MEDECINS, Gmail | ~500 ms | faible |
| Hors exécution (file Google) | 2 656 à 18 191 ms | **aucune** |

**Reste ouvert :** le journal de connexion coûte 480 ms pour une ligne écrite, et varie.
Seul poste restant ayant à la fois une marge et une variance.

**Piste de repli si le cache devait être abandonné :** déplacer la configuration du
classeur vers un `config.json` sur le Drive. Sept relevés de lecture Drive le 01/08 :
529 · 542 · 548 · 554 · 588 · 697 · 785 ms. Le Drive est régulier, le classeur ne l'est pas.

**Nettoyage fait le 01/08 :** les sondes `archives/stats_{Y}.json` passaient 4 fois par
ouverture (fonction appelée deux fois, `?t=Date.now()` interdisant toute mise en cache)
vers des fichiers qui n'ont jamais existé. Résultat retenu pour la session : 4 → 2 requêtes.

### Bande de présence + onglet SEUILS — LIVRÉ (1er août 2026) · site v1.15.2 · `portail.gs` v2026-08-01.1 · `Indispos.gs` v2026-08-01.1 · `setup_annee.gs` v2026-08-01.1

**Demande d'Arthur** : des idées de fonctionnalités pour l'interface planning. Deux séries de
propositions ont été **entièrement rejetées** avant d'arriver à celle-ci — les propositions
« ergonomie » (copie de semaine, glisser-déposer, .ics, diff des changements) et une partie des
propositions « règles » ne l'intéressaient pas. Ce qui a accroché : la **heatmap de tension**, qui
existait au début du projet et lui manquait.

**Découverte : l'ancienne heatmap était encore dans le fichier, morte.** CSS `.heatmap` /
`.heat-*` (l.330-334) et `renderIndispos` (l.4699) présents, mais **ni `#heatmap` ni `#marGrid`
dans la page**, et la fonction **appelée nulle part** — orpheline depuis la réorganisation de
l'onglet indispos. Son modèle était rudimentaire : présences = (nb MAR × 5) − indispos déclarées,
seuils **75 et 65 écrits en dur**, valable pendant la seule campagne d'octobre, ignorant gardes,
RG, vacances validées, temps partiels et postes à couvrir. Supprimée et remplacée.

**Choix de conception, tous d'Arthur :**
- **Une case = une journée** (et non une semaine). 365 cases en ligne feraient 4 400 px ⇒ format
  retenu : **5 lignes lun→ven × 52 colonnes**, ~80 px de haut, en tête de l'onglet Planning.
- **Le calcul porte sur le NOMBRE DE PRÉSENTS**, pas sur les cases à pourvoir (première proposition,
  écartée). Définition reprise telle quelle de `presentsPool` (`code.gs`) — voir `CONTEXTE`.
- **Les seuils vont dans un onglet dédié `SEUILS`, PAS dans `CONFIG`** : « Config me semble trop
  important pour ça ». Confirmé par la découverte de l'**écran Paramètres mort** (voir Priorité 3) —
  régler `CONFIG` impose aujourd'hui d'ouvrir le classeur, donc de côtoyer les codes d'accès.
- **Colonnes élastiques** (option A) plutôt que des carrés plus gros : la bande garde sa hauteur et
  occupe toute la largeur. Les étiquettes de mois sont passées de largeurs en pixels à
  `grid-column: span N`, sinon elles se décalaient dès que la largeur changeait.

**Séquence de livraison** — imposée par un patch concurrent (notifications de planning, autre fil,
poussé à 04:33 le même jour dans `code.gs` et `Indispos.gs`) : celui-ci recopié et déployé
**d'abord**, confirmé, puis reconstruction de mon patch sur l'état frais du dépôt. Le lecteur
`getSeuils()` a été placé dans **`portail.gs`** (non touché par l'autre patch) pour réduire la zone
commune à **3 lignes dans `getAdminBootstrap`**.

**Un raté, corrigé en v1.15.1** : 0 présent partout à la mise en service. Cause = mémorisation
sur une clé incomplète, voir « Pièges », point 0 quater. Reproduit au harnais **avant** de corriger,
puis prouvé corrigé sur le même harnais.

**Vérifications** : ancre unique (`assert count == 1`) sur chacun des remplacements, `<div>`
équilibrés (789/789), `node --check` sur le JS extrait, simulation à 12 contrôles (blocs « mois »
qui se chevauchent, week-ends, fériés, arrivée/départ en cours d'année, `PRUNET`, `G` compté
présent, bornes inversées, `DATA` absent), et contrôle d'alignement des étiquettes de mois.

**Mesure réelle du 01/08 (année 2026, seuils 13/17) : 9 / 44 / 68 / 70 / 58 jours du rouge au vert**,
18 jours sous 13 présents sur les 8 semaines à venir, plancher à 10 le lundi 10 août. Les cinq
couleurs servent ⇒ les bornes par défaut tiennent. **Reste à faire : Arthur demande au comité les
seuils qu'il veut** — modification dans l'onglet `SEUILS`, sans push.

**À savoir** : la bande devient un **troisième consommateur** de la notion « secteurs / effectifs »
au moment du NCHPG. Elle ne lit pas `COVERAGE` (elle compte des présents, pas des postes), donc elle
ne casse pas au changement de codes — mais si le calcul évolue un jour vers « présents − postes
requis », il faudra le brancher sur la colonne `COUVERTURE` prévue en Priorité 2 bis.

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
