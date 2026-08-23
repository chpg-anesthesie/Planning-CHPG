# Roadmap — Planning-CHPG

Système web pour le service d'anesthésie du CHPG (Monaco), ~23 MARs :
planning des gardes (équité annuelle), planning quotidien, consultations,
portail/Dashboard, module libéral, contrôle d'absence, veille biblio, CR d'anesthésie.

**Dépôt** `chpg-anesthesie/Planning-CHPG`, branche `main` · **Site v1.64** ·
**GAS** (relevé fichier par fichier dans le dépôt le 19/08/2026) `code.gs` 2026-08-05.3 ·
`Indispos.gs` 2026-08-19.1 · `miroir.gs` **2026-08-20.1** · `journal.gs` 2026-08-05.3 ·
`portail.gs` 2026-08-17.3 · `veille.gs` 2026-08-08.5 · `sauvegarde.gs` 2026-08-06.1 ·
`echanges.gs` 2026-08-14.3 · `generateur_gardes.gs` 2026-08-14.1 · `setup_annee.gs` 2026-08-08.1 ·
**Worker** `cloudflare/worker.js` : `const VERSION = 'miroir 2026-08-20.1'` — **seule** version
écrite dans le fichier depuis le 16/08 (le commentaire d'en-tête qui la doublait a été supprimé,
le banc refuse qu'un second numéro réapparaisse).

⚠️ **DEUX RECOPIES EN ATTENTE au 20/08.** `miroir.gs` **2026-08-20.1** → éditeur Apps Script, puis
**déployer une nouvelle version**. `cloudflare/worker.js` **miroir 2026-08-20.1** → tableau de bord
Cloudflare (Workers → `chpg-miroir` → Edit code → Deploy). Les deux sont **indépendants** : aucun
ordre imposé, l'un sans l'autre ne casse rien. Tant qu'ils ne sont pas faits, l'ancien code tourne
et les corrections sont sans effet. Contrôle du Worker : son adresse racine doit répondre
`miroir 2026-08-20.1`.

✅ **RIEN EN ATTENTE au 19/08 (midi).** `Indispos.gs` **2026-08-19.1** recopié et déployé le
19/08 au matin, **confirmé par le 🔍 Diagnostic de 11:12** ; site **v1.61** ; quatre commits dans
la journée (`c630ce2c85`, `ba8448b0e6`, `b2bebfaf4e`, `4e0a211fa4`). Historique du 17/08 : le **Worker** (2026-08-17.2), **`miroir.gs`**
(2026-08-17.4) et **`portail.gs`** (2026-08-17.3) sont déployés, `miroirSyncComplet` exécutée, et la
clé `LIBERAL_ADMIN` posée dans CONFIG — dans cet ordre, qui n'est pas négociable : Worker → `.gs` →
synchro. Dans l'autre sens, les pages demandent des clés qui n'existent pas encore et retombent en
silence sur l'ancien circuit.
**Vérifié à l'écran par Arthur** : diagnostic sans avertissement, la page du suivi affiche
« juillet 2026 » au lieu de « undefined », et surtout **la double déclaration au même jour, même
secteur, produit bien deux lignes** — le seul scénario où une erreur du jeton aurait écrit une
bêtise durable dans le classeur.

**Pour le reste, rien en attente.** Le Worker le 16/08 au soir ;
`Indispos.gs` deux fois, en 2026-08-16.1 puis en **2026-08-17.1** (verrou de clôture), recopié et
déployé le 17/08 dans la foulée du push. **Confirmé par Arthur au diagnostic après la première
recopie : le bloc « Version du site » ne sonne plus en rouge.** C'est le contrôle qui fait foi ici,
pas le fait d'avoir poussé — coder, livrer et déployer restent trois étapes distinctes.

**Le numéro de version du site vit dans UN seul fichier : `version.js`** (`window.SITE_VERSION`,
depuis le 14/08/2026). Il n'y a plus de marqueurs à compter ni à recopier : toute page qui doit
l'afficher charge `version.js` et pose un élément portant `data-version`, qui se remplit seul.
Cinq pages l'affichent aujourd'hui — `admin.html`, `dashboard.html`, `docs/guide-comite.html`,
`docs/guide-mar.html`, `docs/roadmap.html` — mais **une modification de n'importe quelle page
visible impose quand même la montée de version**, dans le même push. Deux chiffres, pas trois.
Le banc refuse tout numéro réintroduit en dur, et le Diagnostic aussi depuis le 16/08.

**Banc d'essai** `banc/` — **1537 vérifications** sur 32 scripts (relevé le 20/08/2026),
`cd banc && ./lancer.sh`. *(⚠️ La recette du 19/08 disait « compter les coches `✓` de la sortie
complète ». Appliquée telle quelle — `grep -c "✓"` — elle donne **1538** : elle compte aussi la
ligne récapitulative de `banc_notif.mjs`, qui contient « 36 ✓ / 0 ✗ ». La recette exacte est de
compter les **lignes de coche**, `grep -cE "^\s+✓ "`. Même écart sur les échecs : `grep -c "✗"`
rend 1 alors qu'il n'y en a aucun. Deuxième correction de cette recette en deux jours.)* *(Comptage — **recette corrigée le 19/08 au soir** : compter les
coches `✓` de la sortie complète, et rien d'autre. L'ancienne recette — somme des récapitulatifs de
fin de script — donnait 1444 et **ne reproduisait plus son propre chiffre** : `banc.js` n'imprime
plus de récapitulatif du tout, ses 19 vérifications échappaient donc à la somme, et `banc_notif.mjs`
en annonce 36 pour 37 coches. Une recette de comptage qu'il faut corriger avant de s'en servir est
une recette morte. Recompter, ne pas recopier.)*
À lancer AVANT toute proposition de push touchant une page visible, un `.gs`,
le Worker ou `partage/dispo_jour.js`.

*Mise à jour : 20 août 2026.*

> 📋 **Vue courte : [`docs/roadmap.html`](roadmap.html)** — échéancier, chantiers en cours et règles
> à ne jamais casser, sans l'historique. Ce fichier-ci reste la mémoire longue : les deux se tiennent
> à jour ensemble.
>
> **Le dépôt en ligne fait foi.** Ce document est un repère de pilotage, pas la source de vérité
> du code. Les règles de méthode sont dans `CONTEXTE-Planning-CHPG.md` ; l'architecture et le
> dépannage dans `docs/guide-technique.html` ; la conception du module libéral dans
> `docs/module-liberal/module_liberal_conception.md`.

---

### Répétition générale : le 1er septembre, seul, en 4G

Déplacée du 28 août au **1er septembre** (Arthur ne revient à l'hôpital que le 31, et il est de garde
le 1er). **Faite seul : WS découvrira l'outil en direct devant la salle**, choix assumé — un collègue
qui n'a jamais cliqué et qui s'en sort convainc plus qu'une démonstration rodée. Consigne unique à lui
donner le jour J : au bout de 45 s un message « toujours en cours » peut s'afficher, ne pas recliquer.

**Conditions réelles à éprouver, découvertes ce soir : il n'y a pas de poste dans la salle de staff.**
Ce sera l'ordinateur personnel d'Arthur en partage de connexion 4G. Donc à vérifier le 1er : le câble
ou l'adaptateur du vidéoprojecteur, la mise à l'échelle des diapos larges, et la tenue de la 4G
pendant un appel serveur de trente secondes — une réponse perdue en route n'est pas un geste refusé,
mais il faut savoir le lire.

**Objet du test — pas le chronomètre.** Le générateur est passé en 2026-08-14.1 après la répétition du
10 août : il écrit désormais `LIENS_R_{Y}` (une ligne par samedi tenu, avec la récupération qui lui
appartient). **Cette version n'a jamais tourné en production.** Contrôle : cinq onglets 2027 créés,
autant de lignes dans `LIENS_R_2027` que de samedis tenus, Diagnostic à zéro récup manquante.

**Changement de doctrine sur le ménage :** l'effacement du bac à sable se fait **dans la foulée de la
génération**, le soir même, et non plus le matin du 4. Les deux gestes sont indissociables — interrompu
entre les deux (garde), le bac à sable reste généré et le 4 l'assistant réafficherait ce résultat sans
calculer, en silence. Le matin du 4 ne garde plus qu'un contrôle, les adresses et le Diagnostic.

---

## 20 août 2026 — les plafonds gratuits de Cloudflare étaient atteints tous les jours, et personne ne le voyait

Deux commits : `0537b89a86` (5 fichiers, l'envoi différentiel du miroir) et `60e7b99ce2`
(4 fichiers, le drapeau de la file). **Aucune page visible touchée : le site reste en v1.64.**
Séance déclenchée par un mail Cloudflare, pas par une demande de fonctionnalité.

### Le point de départ : un mail d'alerte à 50 %

Alerte reçue par Arthur à 10h54 : « 50 % du plafond quotidien Workers KV ». Relevé du tableau de
bord à 11h38 (soit **09h38 UTC**, 578 minutes de journée écoulées) :

| Compteur | Consommé | Plafond gratuit | Projection à minuit |
|---|---|---|---|
| Ouvertures de file (*list*) | 640 | 1 000 | ~1 590 — **dépassé vers 17 h** |
| Écritures (*write*) | 380 | 1 000 | ~950 — frôlé |
| Suppressions | 70 | 1 000 | ~175 |
| Lectures | 0 *(voir plus bas)* | 100 000 | — |

Les plafonds sont **durs** : au-delà, l'opération échoue en 429, jusqu'à minuit UTC — **2 h du
matin heure de Monaco**.

### Ce que ça provoquait réellement, et qui n'était visible nulle part

Le chemin coupé n'était pas la consultation (les lectures sont à 0,1 % du plafond) mais **le
relevé de la file d'attente du comité**. `journal.gs` installe un déclencheur `everyMinutes(1)` qui
appelle `/tirer` ; `/tirer` faisait un `KV.list` **à chaque passage, file vide ou non** : 1 440 par
jour pour un plafond de 1 000. Passé ~17 h, plus rien n'était relevé.

Scène type : le comité publie à 17h15. La page dépose la fiche (le dépôt, lui, fonctionne),
affiche *« Publication en route… vous pouvez fermer cette page »*, et la pastille passe au vert.
**La fiche dort alors jusqu'à 2 h du matin.** Les MARs qui consultent dans la soirée lisent
l'ancien planning — pas une erreur, pas un vide : une version périmée, indiscernable de la bonne.

**Aucune trace nulle part** : `journal.gs` ligne 105 fait `if (rep.getResponseCode() !== 200)
return;` — abandon silencieux, pas même une ligne de LOGS. C'est exactement la famille de défauts
que la doctrine du projet interdit, et elle était au cœur du circuit le plus critique.

**Lien avec la pastille orange signalée le 19/08.** Une pastille « À publier » qui revient à
l'orange après une publication est le symptôme littéral de ce blocage : `reconcileOverrides()`
compare les modifications locales au planning publié ; si la publication n'a jamais été appliquée,
l'écart persiste et la pastille se rallume. **Compatible, non prouvé** — les traces Cloudflare ne
sont pas accessibles par le connecteur.

### Correction 1 — l'envoi différentiel du miroir (`miroir.gs` 2026-08-20.1)

`miroirSyncComplet` renvoyait ses ~29 clés **chaque heure, identiques ou non** : un dimanche sans
une seule modification coûtait autant qu'un mardi de réunion. Le compteur de courrier, réécrit
toutes les 5 minutes, en dépensait ~288 à lui seul pour une pastille qui ne bouge pas.

`_miroirEnvoyer_` retient désormais l'empreinte de ce qui a été **réellement écrit** et ne renvoie
que ce qui a bougé. Le correctif est posé dans la fonction d'envoi, donc il couvre **tous** les
appelants d'un coup — les deux correctifs envisagés séparément (badge courrier, synchro horaire)
n'en faisaient qu'un.

**Le défaut qui a failli passer : six clés portent un horodatage régénéré à chaque construction**
(`acces`, `config_admin`, `mail_nonlus`, `ordre_vac`, `veille_marques`, `indispos_{Y}`). Leur
empreinte aurait changé à chaque fois : le filtre n'aurait rien fait **précisément sur les six
clés les plus fréquentes**. L'empreinte est donc calculée sans ces champs ; la valeur envoyée
n'est pas touchée. Vérifié par lecture de `admin.html`, `index.html`, `dashboard.html` : aucune
page ne lit `t` ni `maj` — seul `mail_nonlus.nonLus` est consommé.

Trois garde-fous, chacun contre une façon de figer une donnée :
1. **L'empreinte n'est retenue que pour les clés que le Worker déclare avoir traitées** (`ecrits`,
   `supprimes`). Une clé refusée — ou un Worker ancien qui ne détaille pas sa réponse — ne laisse
   aucune empreinte et repart au passage suivant. *La dégradation va vers le renvoi, jamais vers
   le silence.*
2. **Une suppression n'est jamais filtrée.** Effacer une clé déjà absente est sans effet ; ne pas
   l'effacer laisserait une donnée périmée servie à 23 MARs.
3. **Oubli complet des empreintes à la synchro de 4 h** : tout repart sans condition, ~29
   écritures une fois par nuit. Filet contre une dérive invisible d'ici (miroir vidé à la main,
   écriture perdue). Fonction manuelle : `miroirOublierEmpreintes`.

Mesure au banc : **24 synchros sans modification = 18 écritures au lieu de 432.**

### Correction 2 — le drapeau de la file (`worker.js` miroir 2026-08-20.1)

`/ecrire` pose la clé `jsignal` **en même temps** que la fiche (`Promise.all` : aucune milliseconde
ajoutée au geste du comité). `/tirer` la lit — plafond des lectures 100 000/jour, cent fois plus
large — et n'ouvre la file que si elle existe, **ou une minute sur trois**.

**Le filet n'est pas une précaution de confort.** Une lecture KV peut servir une valeur vieille de
60 secondes, y compris « absent » alors que le drapeau vient d'être levé ailleurs. Comme le
drapeau est interrogé chaque minute depuis le même endroit, un cache négatif est probable : il se
peut que le filet devienne le chemin dominant et qu'une publication mette **1 à 3 minutes** au
lieu d'une. Ce serait conforme à ce que l'écran promet déjà (« sous 2 à 3 minutes ») et sans
commune mesure avec le blocage jusqu'à 2 h du matin — **mais ce n'est mesurable qu'en
production**. Si c'est trop lent : passer `J_FILET_MINUTES` à 2 (720 ouvertures/jour, toujours
sous le plafond).

**Ordre des gestes, non négociable : le drapeau est baissé AVANT l'ouverture, jamais après.** Une
fiche arrivée pendant l'ouverture relève donc le drapeau et sera vue au passage suivant. L'inverse
perdrait exactement cette fiche-là. Une fiche vue deux fois est sans conséquence (idempotence, cf.
`journal.gs`) ; une fiche jamais vue serait une publication perdue.

**Aucun changement Apps Script** : la réponse de `/tirer` garde la même forme, un applicateur
ancien fonctionne à l'identique. Les fiches déposées avant le déploiement (qui n'ont jamais eu de
drapeau) sont relevées par le filet.

Mesure au banc, journée complète simulée (1 440 passages, 40 gestes du comité) :

| | Avant | Après | Plafond |
|---|---|---|---|
| Ouvertures de file | 1 440 | **480** | 1 000 |
| Écritures ajoutées | — | 80 | 1 000 |
| Suppressions | — | 40 | 1 000 |
| Lectures | — | 1 520 | 100 000 |

### Le banc : deux scripts, 74 vérifications, six contre-épreuves

`banc/banc_miroir_diff.js` (30) et `banc/banc_journal_signal.mjs` (44), tous deux ajoutés à
`lancer.sh`. Le second exécute le **vrai `worker.js`** face à un KV simulé qui **compte chaque
opération** — c'est ce comptage qui prouve le gain, pas une estimation.

Contre-épreuves systématiques : neutralisation des horodatages retirée → 4 échecs · empreintes
posées sur les clés refusées → 1 · suppressions filtrées → 1 · drapeau baissé après l'ouverture →
3, dont « aucune fiche perdue » · filet supprimé → 4 · drapeau non posé au dépôt → 5.

Effet de bord attrapé par le banc : `banc_synchro.js` cassait sur le nouveau mécanisme — adapté.

### Pourquoi pas le plan payant à 5 $/mois

Écarté par Arthur : « j'aimerais bien quelque chose de full gratuit quand même ». Le plan Workers
Paid ferait sauter les trois plafonds sans une ligne de code. **À garder en tête si les compteurs
remontent** — notamment après le déménagement NCHPG ou l'ouverture du module libéral aux 19
membres.

### Le soir — deux vérifications dans le classeur, et une décision

**Les deux recopies sont faites.** Diagnostic de 21:06 : `miroir.gs : à jour (v2026-08-20.1)`,
`Worker joignable — miroir 2026-08-20.1`. Code du Worker relu directement chez Cloudflare (drapeau
et filet présents), déploiement horodaté 15h02.

**Le carnet des placements caducs garde des notes périmées.** Le Diagnostic annonçait « 18
placements ignorés » dont cinq datés **janvier 2027**, alors que la même page affirmait
« Placements hors année active 2026 : aucun ». Lecture du classeur : `PLANNING_OVERRIDES` porte
**315 lignes, toutes 2026** — la purge manuelle d'Arthur a bien tout emporté. Recalcul ligne à
ligne avec la règle du code (`CADUC_ABSENT_CODES` + fenêtres d'activité de MEDECINS) : **13 caducs
réels**. 13 + 5 fantômes = 18. Le compte tombe juste.

**Cause, proposée par Arthur et conforme au constat du 10/08 déjà consigné ici** : les
régénérations successives de 2027 recollaient les overrides de test, devenus incompatibles avec la
nouvelle grille ; chaque publication en laissait la trace. La purge a nettoyé le classeur, **pas le
carnet** — qui vit dans une propriété du script et ne se vide qu'à la republication du mois
concerné. *(Réserve : le carnet n'a pas été lu directement, il est hors de portée du connecteur
Drive. Conclusion déduite de la concordance 13 + 5 = 18, non constatée.)*

Sur les 13 réels, **un seul portait sur une date à venir** (le lendemain) ; les douze autres
étaient déjà passés. Le détail nominatif a été donné à Arthur en conversation et **n'est pas
recopié ici** : c'est une donnée du classeur, le dépôt est public et son historique définitif.

### ⛔ Le placement défait par un statut — DÉCIDÉ : on ne fait rien

**Problématique soulevée par Arthur, et c'est la bonne question.** Le comité place un MAR ; le MAR
annonce ensuite une absence ; le comité pose le statut. Le placement est alors ignoré et **la case
redevient vide**, sans que personne ne soit prévenu.

**Vérifié** : `planningCaducs` est construit, écrit dans les LOGS, rangé dans `PLANNING_CADUCS` —
puis `return months` **sans lui**. La liste ne sort jamais du serveur. Zéro occurrence de « caduc »
dans `admin.html`, `index.html`, `dashboard.html`. Le Diagnostic Maintenance est le seul endroit où
le comité peut l'apprendre.

**Décision d'Arthur, 20/08 au soir : non bloquant, on ne fait rien.** Le motif est juste — la case
vide reste visible si on rouvre le mois, et personne n'est jamais affecté à un poste qu'il ne peut
pas tenir. Le système protège le bon côté. Risque résiduel assumé : un trou rouvert dans un mois
considéré comme fini, que personne ne rouvrira.

**Effet miroir à connaître** : la ligne restant dans `PLANNING_OVERRIDES`, **le placement
ressuscite seul** si le statut est retiré plus tard. Souvent souhaitable, parfois surprenant.

*Si on y revient un jour*, la piste retenue était de prévenir **au moment où le comité pose le
statut** (« X est placé en VOLANT le JJ/MM — ce placement sera ignoré ») : seul instant où
l'information tombe devant quelqu'un qui peut décider. Les deux autres pistes — marque dans la
grille, statu quo avec purge périodique du carnet — avaient été écartées. Touche `admin.html`.

### ✅ CONFIRMÉ EN PRODUCTION — relevé du 21/08 à 07h01 UTC

Première journée complète avec les deux corrections. **421 minutes** de journée écoulées :

| | 20/08 au même point | 21/08 | Projection | Plafond |
|---|---|---|---|---|
| Ouvertures de file | ~466 | **141** | ~480 | 1 000 |
| Écritures | ~277 | **26** | ~89 | 1 000 |
| Suppressions | ~51 | 63 | ~215 | 1 000 |
| Lectures | — | 447 | ~1 530 | 100 000 |

**Ouvertures ÷ 3,3 · écritures ÷ 10,6.** Le chiffre qui ferme le dossier : 421 ÷ 3 = 140
ouvertures attendues avec le filet, **141 observées**. Le banc prédisait 480/jour, la production
en donne 480. Plus d'alerte à 50 % ni à 90 %, plus de plafond à 17 h.

**Non encore prouvé : le drapeau lui-même.** À 07h01 le filet avait fait la totalité du travail —
personne ne publie entre 2 h et 9 h, donc aucun drapeau à lever. La vérification est de publier en
journée et de chronométrer : < 1 min = drapeau, 2-3 min = filet. Les deux sont acceptables.

**Fausse alerte écartée** : la vue Workers KV affichait `Storage 0 B` (43 Mo la veille), au moment
où un second espace de stockage apparaissait dans la liste du compte. Le miroir n'était pas vide —
vérifié par le seul test qui compte : `dashboard.html` s'affiche **instantanément**, donc il lit
bien le miroir et non le repli Google. Artefact de la métrique, pas un incident.

### 📌 PLAN D'ATTAQUE APRÈS LE 4 SEPTEMBRE — arrêté avec Arthur le 21/08

**Pas de dates : des séances.** Ce qui cadence n'est pas la durée du travail — quelques heures par
chantier — mais **le nombre de recopies** à faire dans l'éditeur Apps Script, et la règle « une
chose à la fois, confirmée en production avant la suivante ». *Remarque d'Arthur, justifiée : les
délais initialement proposés (« semaine du 15 », « semaine du 22 ») étaient des marges de réflexe
sans contrepartie réelle. **L'ensemble tient en deux journées de travail.*** Total : **quatre
recopies**.

⚠️ **Le 5 septembre, les échanges s'ouvrent aux 23 MARs.** Le risque de conflit placement ↔ garde
monte ce jour-là : les séances C et D ne sont pas des chantiers de confort.

| Séance | Ce qu'on fait | Touche | Recopie |
|---|---|---|---|
| **4–5 sept.** | Ménage du bac à sable, notifications réelles, envoi des codes, passage en v2.0 | aucun code | non |
| **A** | Le diagnostic **garde son résultat** et tourne **chaque nuit sans rien envoyer**, **et** distingue ce qui appelle un geste | serveur | oui |
| **B** | Pastille + bloc actionnable en tête de l'onglet Maintenance | `admin.html` | non, publication seule |
| **C** | **Le R de récupération** + nettoyage de `PLANNING_CADUCS` (même fichier, même passage) | serveur | oui |
| **D** | **Le repos de garde** — message aux deux MARs sur la carte d'échange | serveur + `dashboard.html` | oui |
| **E** | **Renouveler le token GitHub** — seule échéance dure, **mi-octobre**, ne dépend de rien | — | non |
| **✅ R** | ~~Placement des récupérations~~ — **LIVRÉ le 21/08**, `generateur_gardes.gs` 2026-08-21.1. Reste à recopier dans l'éditeur Apps Script. | fait | à recopier |
| **F** | La publication coincée qui ne se signale pas | `admin.html` | oui |
| — | Ouvrir le libéral aux 19 (rythme propre : RPPS, cotations types, présentation au groupement) | accès | non |
| plus tard | Retirer `tp_jours_fixes` (avant génération nov. 2027) · sortir `COVERAGE`/`targets` en dur (avant NCHPG janv. 2027) | serveur + admin | oui |

**Pourquoi A et B en premier.** Sans eux, chaque anomalie qu'on apprend à détecter retombe dans un
mail du lundi que personne ne lit. C'est le socle, pas un confort.

✅ **Le chantier R est livré le 21/08**, avant l'échéance. Il reste à recopier `generateur_gardes.gs`
dans l'éditeur Apps Script et à déployer une nouvelle version. Le code ne tourne qu'au moment d'une
génération : rien ne changera d'ici là.
⚠️ **Génération de test avant le 4/09** : supprimer d'abord manuellement `GARDES_2027` (verrou
anti-régénération), puis générer, puis ouvrir `LIENS_R_2027`. **La grille de démo sera entièrement
redistribuée** — si des exemples précis ont été préparés pour le staff, ils ne seront plus valables.
Vérifier aussi que `PLANNING_OVERRIDES` ne contient aucune ligne 2027 : les placements se recollent
sur toute grille régénérée (constat du 10/08).

**Pourquoi C avant D.** Voir ci-dessous : le RG **vide** la case (visible, le flash « + »
clignote) ; le R **laisse le placement tenir** (invisible). Le pire des deux passe en premier.

**Pourquoi A et le tag « actionnable » sont indissociables.** Conserver un rapport où les sept
points se valent ne sert à rien. Le diagnostic du 20/08 affichait 7 avertissements dont **un seul**
appelait un geste : c'est ce qui use l'attention et fait qu'on cesse d'ouvrir le rapport.

#### Séance A/B — le diagnostic comme élément d'interface

**Constat vérifié le 21/08** : `diagHebdo` (`Indispos.gs` l.~770) appelle `diagnosticComplet()`, met
le texte dans un mail, et **ne range rien**. Aucune trace, aucune poussée au miroir. Trois
conséquences :
- `admin.html` **ne peut pas** afficher d'indicateur — elle n'a rien à lire. Il faut d'abord
  **conserver**, pas seulement « rendre visible ».
- Le bouton Maintenance relance tout : **19,9 s mesurées le 20/08**. Interdit au chargement d'une page.
- `diagnosticComplet()` rend `{ok, results, nbErr, nbWarn}` où `results` est une liste de chaînes
  préfixées ✅⚠️❌. **Aucune notion d'actionnabilité.**

**Le chiffre qui débloque** : 20 s par passage. Un diagnostic **quotidien** coûte 20 s/jour sur les
5 400 s de tâches de fond disponibles = **0,4 %**. Gratuit. Le mail hebdomadaire ne change pas ;
c'est le passage nocturne qui devient silencieux et alimente l'indicateur.

**Piste d'implémentation** : `check()` gagne un 4e argument optionnel `actionnable`, porté par
quelques contrôles seulement (placements caducs **à venir**, conflits R/RG, trous de couverture).
Le résumé part au miroir sous une clé dédiée ; `miroirBootAdmin` (l.2021) l'ajoute à sa liste de
lecture — aucun appel Google supplémentaire au chargement.

**Détail visuel** (maquette validée le 21/08) : pastille ambre sur l'onglet Maintenance **seulement
si** au moins un point est actionnable ; bloc ambre en tête de l'onglet avec une ligne par point et
un lien « Voir la semaine → » ; le reste replié derrière « 5 autres points de vigilance —
historique, rien à faire ». Les jours calmes : pas de pastille, un bandeau vert « Rien à faire —
dernier contrôle cette nuit ».

⚠️ **À vérifier avant de coder B** : `admin.html` sait-elle ouvrir l'onglet Planning sur une semaine
donnée ? Si non, « Voir la semaine → » devient un chantier en soi — se contenter d'afficher la date.

#### Séance C — le R de récupération (⚠️ le plus dangereux des deux)

**Soulevé par Arthur le 21/08, vérifié dans la foulée.** `transfertR` (`Indispos.gs` l.1865) vérifie
que le receveur est libre dans `GARDES` et qu'il n'est pas indisponible (`refuseSiIndisponible`) —
**il ne lit pas `PLANNING_OVERRIDES`**. Même angle mort que le RG.

**Mais la conséquence est inverse, et pire.** `R` n'est **pas** dans `CADUC_ABSENT_CODES`
(`code.gs` l.288) — c'est **délibéré**, le commentaire du 05/08 l'explique : le panneau propose les
TP et les récups en dernier recours, donc un placement qui les vise doit tenir. Résultat :

| | Le placement | Signalement |
|---|---|---|
| **RG** (repos de garde) | est ignoré, la case se vide | le flash « + » clignote — moche mais **visible** |
| **R** (récup de samedi) | **tient** | **rien.** Aucun flash, aucune case vide, aucune note au carnet |

Le MAR apparaît en secteur un jour où il récupère son samedi. Il le découvre, ou il ne vient pas.

⚠️ **Ne PAS corriger en ajoutant `R` à `CADUC_ABSENT_CODES`** : c'est une règle métier voulue, et
elle est **dupliquée dans `partage/dispo_jour.js`** (le commentaire l'impose explicitement : toute
modification ici doit être répercutée là-bas). La collision doit être détectée **à part**.

#### Séance D — le repos de garde (conception arrêtée le 21/08)

**Le problème.** Le comité place un MAR dans un secteur pour combler un trou. Plus tard, ce MAR
récupère une garde — par échange, par don, ou parce que le comité a modifié la grille. Le système
lui pose alors automatiquement un **repos le lendemain**, ce qui est juste. Mais son placement
devient caduc : à la publication suivante, **la case se vide et le trou se rouvre**, dans un mois
que tout le monde considérait comme bouclé.

**Deux cas vérifiés dans le classeur le 20/08**, tous deux avec le même mécanisme — G2 la veille,
RG le jour du placement, dans un vrai secteur (bloc viscéral et maternité). Deux cas en deux mois :
rare, mais réel.

**Pourquoi ce n'est pas une erreur de saisie.** `admin.html` l.4645 exclut déjà les MARs en repos de
la liste des placements proposés : le comité ne *peut pas* placer quelqu'un déjà en RG. C'est un
événement **postérieur** qui défait le placement. Angle mort réel, pas maladresse.

**Ce qui existe déjà et qu'il ne faut PAS refaire :**
- Le **flash « + »** d'`admin.html` l.3877 signale toute case d'un secteur de couverture dont le
  titulaire est absent (RG compris) sans remplaçant, avec un plancher anti-blocage sur une case
  vide. **Le trou EST signalé dans la grille.** Le manque n'est pas l'affichage, c'est qu'il faut
  ouvrir la semaine concernée pour le voir.
- `refuseSiIndisponible` (`Indispos.gs` l.1977) vérifie **déjà** que le nouveau repos ne tombe pas
  sur une absence, et refuse l'échange le cas échéant. Il lit `INDISPOS_{Y}` — il ne lit pas
  `PLANNING_OVERRIDES`. **La logique de protection est écrite ; il lui manque une source.**
- La colonne `INFO` d'`ECHANGES` est **déjà affichée** sur la carte côté MAR (`dashboard.html`
  l.1660 : `if (e.etat==='acceptee' && e.info)`). **La persistance du message est acquise.**
- `notifierPush_` sait cibler `{role:'admin'}` depuis le 13/08. **Écarté** — voir ci-dessous.

**⛔ Écarté : la notification automatique au comité.** Motif d'Arthur, 21/08 : *« le membre du
comité qui reçoit une notif à 22h ne va pas ouvrir la page admin. Il va oublier et puis plus
rien. »* Le canal technique existe et fonctionne ; c'est le moment et le destinataire qui sont
mauvais. **Ne pas reproposer.**

**⛔ Écarté : refuser l'échange.** Bloquer un droit des médecins pour un problème d'organisation du
comité. Deux MARs verraient « échange impossible » pour une raison qui ne les concerne pas et sur
laquelle ils n'ont aucune prise.

**La solution retenue.** L'échange se fait quoi qu'il arrive. Après application, lecture de
`PLANNING_OVERRIDES` sur les dates de repos nouvellement créées. **Pas de conflit → personne n'est
dérangé.** Conflit → message aux **deux** MARs, qui prennent la responsabilité de prévenir le comité.

Maquette validée le 21/08 — **deux lignes, pas quinze** ; la première dit *quoi*, la seconde dit
*quoi faire* :

> ⚠️ **{Dr X} · {secteur} · {jour} ({matin / après-midi})**
> *Place à libérer — prévenez le comité*

Sur fond ambre, bordure gauche, sous le détail de l'échange. Un échange sans conflit garde
**exactement** l'aspect actuel : on ne dérange personne pour rien.

**Décisions d'Arthur (21/08), point par point :**
1. **Le don est couvert** comme l'échange (il crée aussi un repos le lendemain).
2. **Les modifications de gardes par le comité sont couvertes** aussi, pas seulement les échanges
   entre MARs.
3. **Les deux MARs voient le conflit**, y compris celui qui n'est pas concerné : *« ça fait
   2 personnes informées et moins de risque de perte d'info »*.
4. **Si le MAR oublie de prévenir, tant pis** — le filet est le contrôle du comité à la publication,
   et le flash « + » dans la grille. Pas de mécanisme de rattrapage supplémentaire.

**Stockage — décidé** : une **13e colonne `CONFLIT`** dans `ECHANGES_ENTETE` (`echanges.gs` l.44),
plutôt que d'empiler un troisième usage sur `INFO` (qui sert déjà au transfert de R **et** au motif
d'échec). La page peut alors styler le conflit à part sans deviner. Les lignes existantes restent
vides, la colonne se crée à la prochaine écriture.

**Portée D** : `echanges.gs`, `Indispos.gs`, `dashboard.html`. Page visible → **montée de version du
site dans le même push** — 2e chiffre, ou 3e si le passage en v2.0 a déjà eu lieu le 5. Mockup avant
implémentation, scénario au banc obligatoire.

**Rappel de méthode, coûteux le 21/08.** J'ai proposé successivement un bandeau d'alerte dans
`admin.html` puis une notification au comité, **sans avoir lu le flash « + » qui existait déjà**, et
j'ai construit un scénario entier sur onze lignes `VOLANT` de `PLANNING_OVERRIDES` prises pour des
placements alors qu'`admin.html` l.1685 les traite comme des **retraits** (`VOLANT` n'est pas dans
`SECTEURS` — vérifié dans le classeur : neuf secteurs, VIS à MAT). Deux fois la même faute : lire le
producteur d'une donnée sans lire son consommateur.

### 🔎 PASSE EXHAUSTIVE DU 21/08 — ce que la recherche systématique a trouvé

**Demandée par Arthur** après l'incident Cloudflare : chercher d'autres conflits du même type — une
action qui invalide silencieusement une donnée — **avant** qu'ils surviennent.

**Méthode, quatre axes** : (1) les écrivains de la grille croisés avec ce qu'ils consultent avant
d'écrire · (2) les gestions d'erreur muettes · (3) les règles écrites en double · (4) la cohérence
du classeur par croisements. Tout chiffre vient d'un comptage, jamais d'une estimation.

**Résultat général : le système est plus solide que la matinée ne le laissait croire.** Les données
du classeur sont propres — **315 placements lus un par un**, tous vers un secteur valide, aucun hors
fenêtre d'activité, aucun sur un MAR inactif ; tous les MARs actifs ont leur ligne dans
`AFFECTATIONS_2026/2027` et `GARDES_2026`.

#### 🔴 Trouvaille 1 — les placements vers un secteur supprimé (échéance : NCHPG, janvier 2027)

`normalizeAffectation` (`code.gs` l.566) rattrape un code de secteur inconnu dans une **affectation
mensuelle** : retour à VOLANT + trace au journal. **Les placements du comité ne passent PAS par
cette fonction** — `code.gs` l.964 écrit `ov.morning` / `ov.afternoon` tels quels dans le planning.

Sans effet aujourd'hui (vérifié : les 315 placements pointent tous vers l'un des 9 secteurs actifs).
Mais **le déménagement change les codes**, et la règle du projet est que les anciens passent
`ACTIF=N` **sans jamais être renommés**. Ce jour-là, tout placement visant un ancien code devient un
placement vers un secteur inexistant — **ni la génération ni le diagnostic ne le contrôlent**.

→ **À traiter avec le chantier `COVERAGE`/`targets` en dur, avant janvier 2027.** Deux gestes : un
contrôle au diagnostic, et décider du comportement à la génération (rattrapage type
`normalizeAffectation`, ou refus explicite).

#### 🔴 Trouvaille 2 — le module libéral n'est pas prêt à ouvrir, et ce n'est pas du code

Compté dans le classeur le 21/08 : le groupe libéral compte **19 membres actifs**. Sur ces 19,
**18 n'ont ni RPPS ni prénom** renseignés dans `MEDECINS` — sans eux le devis s'imprime sans numéro
et la page réclame de compléter à chaque ouverture. `COTATIONS_TYPE` contient **5 lignes couvrant
4 gestes**, tous d'endoscopie ou de paroi, alors que **12 spécialités** sont déclarées dans
`SPECIALITES`.

Déjà noté dans `roadmap.html` comme préalable ; **le chiffrer change la nature de l'information** :
ce n'est pas « quelques fiches à compléter », c'est 18 fiches sur 19 et 8 spécialités sans cotation.
C'est du remplissage, pas du développement — mais c'est **le** préalable, et il ne se délègue pas à
une session de travail.

#### 🟠 Trouvaille 3 — huit listes de codes dupliquées entre fichiers

`CADUC_ABSENT_CODES` est écrite deux fois (`code.gs` l.288 et `partage/dispo_jour.js`), avec un
commentaire qui l'assume : *« Toute modification ici doit être répercutée dans dispo_jour.js, et
inversement. »* **Une consigne dans un commentaire n'est pas une protection** — elle tient tant que
quelqu'un la lit.

Sept autres listes sont dupliquées : les codes d'absence apparaissent sous **quatre noms différents
dans le seul `admin.html`** (`ABSENT_FLASH`, `EXCL`, `TENSION_ABSENTS`, `ABSENT_S`), plus
`ABSENT_CODES` côté serveur. Elles sont **aujourd'hui identiques** — comparées le 21/08. Aucune n'a
de mécanisme empêchant la divergence.

→ **Ce n'est pas un chantier** : c'est à savoir quand on touche à l'une d'elles. À rappeler
explicitement au moment du chantier C (le R de récupération), qui touche précisément à cette
famille.

#### 🟠 Trouvaille 4 — une date de départ avancée efface des placements sans le dire

Les placements postérieurs à `date_fin` cessent d'être appliqués (comptés « hors activité »,
`code.gs` l.960), **silencieusement**. Vérifié : **0 cas aujourd'hui**, y compris pour le départ du
1er septembre. Le risque n'existe que si le comité place quelqu'un **puis** avance sa date de départ.

→ **Un contrôle de plus au diagnostic**, quasi gratuit : la lecture de `PLANNING_OVERRIDES` est déjà
faite. À ajouter en séance A, avec le contrôle « secteur inexistant » de la trouvaille 1. Le
diagnostic contrôle aujourd'hui les doublons, les MARs inconnus, les dates illisibles et les
placements hors année — **ni la fenêtre d'activité, ni la validité du secteur**.

#### ✅ Les échecs avalés en silence — 231 passés en revue, 10 réellement muets

Chaque bloc `catch` du serveur et du Worker a été examiné. **81 sont muets**, mais après tri
(libération de verrou, format de cellule, boîte de dialogue — sans coût), **10 enveloppent une
action réelle**. Sur ces 10, **8 portent un commentaire assumant le choix** (le badge de courrier
est un confort ; la trace des placements caducs est du « meilleur effort »).

Deux méritent un regard, sans urgence : `Indispos.gs` l.2703 (report des congés longs dans les
indisponibilités) et `code.gs` l.1253 (lecture réseau dont l'échec laisse la variable vide au lieu
de faire échouer l'opération).

**Dix silences dont huit délibérés : bon score. Ce n'est pas un chantier.**

#### ✅ Ce qui est DÉJÀ protégé — vérifié, à ne plus reproposer

L'erreur a été commise trois fois ce mois-ci. Table de référence :

| Situation | Protégée | Par quoi |
|---|---|---|
| Le comité pose une absence sur un MAR déjà placé | **oui** | `retirerPlacementsPourDates` — « le dernier geste gagne », 05/08. Statuts concernés : V, F, TP, CL, A |
| Placer un MAR déjà en repos de garde | **oui** | `admin.html` l.4645 ne le propose pas |
| Un échange dont le repos tombe sur une absence | **oui** | `refuseSiIndisponible`, les deux MARs prévenus |
| Un MAR casse l'année en cours via ses indisponibilités | **oui** | La campagne ne porte que sur l'année N+1 (`INDISPOS_ACTIVE`) |
| Une case de secteur sans personne | **oui** | Flash « + », avec plancher anti-blocage |
| Un envoi groupé dépassant le quota d'emails | **oui** | Refus **avant** envoi, à trois endroits |
| Les journaux qui gonflent le classeur | **oui** | Élagage automatique : LOGS 500, CONNEXIONS 2 000 |
| Un placement défait par un repos de garde | non | **Chantier D** |
| Un placement un jour de récupération | non | **Chantier C** — le placement *tient* |

#### ⚠️ Ce que la passe n'a PAS couvert — à ne pas prendre pour un blanc-seing

- **Le comportement réel des pages.** Code lu, pas cliqué. Défauts d'affichage, boutons inertes,
  lenteurs : hors périmètre.
- **Les traces d'exécution.** Pas d'accès à l'historique du serveur ni aux traces Cloudflare. Le
  temps réellement consommé par les tâches de fond reste l'inconnue du 10/08.
- **Les propriétés du script** (`PLANNING_CADUCS`, `MIROIR_EMPREINTES`, jetons) : hors de portée du
  connecteur Drive. Tout ce qui en est dit est **déduit du code et recoupé avec le classeur**,
  jamais lu directement.
- **Le générateur de gardes : survolé seulement.** Pièce la plus complexe du système. Un examen
  sérieux demande une session entière — **à faire avant la génération de novembre 2027**, pas
  maintenant.

### 🔬 EXAMEN APPROFONDI DU GÉNÉRATEUR DE GARDES — 21/08/2026

Demandé par Arthur. **1 528 lignes lues section par section**, puis confrontées à **2027, seule
année réellement produite par l'algorithme** : 23 lignes de `STATS_GARDES_2027`, 364 colonnes de
`GARDES_2027`, 104 lignes de `LIENS_R_2027`.

#### ✅ VERDICT — l'algorithme est OPTIMAL, et je l'avais d'abord accusé à tort

**Constat initial (faux) :** Σ cibles 2027 = **736,60** pour **728 créneaux** → excédent **+8,60**,
et 17 MARs sur 22 affichant exactement **−0,60**. J'en ai conclu à un défaut de répartition.

**Correction apportée par Arthur** : *« l'écart à la cible de mon générateur est obligatoire avec
quelqu'un qui en prend plus et qui modifie sa cible »*. **Il a raison.** Recalcul fait le 21/08 en
réservant d'abord les 43 gardes du régime particulier, puis en répartissant les **685 restantes** :

| | Cible théorique | Cible recalculée | Reçu | Écart th. | **Écart réel** |
|---|---|---|---|---|---|
| 17 MARs temps plein | 34,60 | 34,17 | 34 | −0,60 | **−0,17** |
| 2 MARs | 34,60 | 34,17 | 35 | +0,40 | **+0,83** |
| Quotités réduites | 27,70 → 31,10 | 27,36 → 30,71 | 28 / 31 | +0,30 / −0,10 | **+0,64 / +0,29** |
| Régime particulier | 43,00 | 43,00 | 43 | 0,00 | **0,00** |

**Σ des écarts = 0,00 exactement** (contre −8,60 avec la cible théorique) · **amplitude 1,00 garde**,
identique dans les deux cas.

**Ce qui tranche : les gardes sont des entiers.** Une part de 34,17 ne peut donner que 34 ou 35. Le
générateur donne 34 à dix-sept MARs et 35 à trois — et il en faut **exactement trois** pour que la
somme tombe à 685. **C'est la répartition entière optimale : on ne peut pas faire mieux.**

**Et j'ai affirmé à tort que la dette 2028 serait faussée.** Vérifié le 21/08 : la part juste est une
redistribution du réel au prorata des cibles N-1, donc **Σ dette = 0,0000 exactement**. Le mécanisme
est correct. L'affirmation n'était pas vérifiée avant d'être écrite.

**⛔ DÉCISION D'ARTHUR (21/08) : on laisse les cibles telles quelles.** Pas de colonne
supplémentaire, pas de changement d'affichage. La cible théorique répond à une vraie question — *que
ferais-je si tout le monde était traité pareil ?* — et l'écart mesure ce que le régime particulier
épargne aux autres. **Ne pas reproposer de la modifier.**

⚠️ **Une seule conséquence à retenir, pour le poster SFAR** (échéance ~avril 2027) : présenter
« écart max −0,60 » sans expliquer d'où vient le −0,60 prêterait le flanc. **La formulation juste
est : écart borné à moins d'une garde, somme nulle, répartition entière optimale.** Le chiffre à
citer est la cible recalculée, ou bien la cible théorique avec sa justification.

#### 🔴 LE DÉFAUT RÉEL — 73 % des récupérations sont posées AVANT leur samedi

Mesuré sur `LIENS_R_2027`, délai calculé ligne à ligne :

| Récupérations | Nombre | Délai |
|---|---|---|
| Posées **après** leur samedi (normal) | 28 | médiane **73 jours** |
| Posées **avant** leur samedi | **76** | de −3 à **−354 jours** |

Cas extrême : un samedi du 01/01/2028 dont le R est posé le 12/01/2027 — **onze mois et demi avant**.

**Cause, lue dans `generateur_gardes.gs` section 9.** Deux boucles :
1. **Nominale** : semaines +2 à +16 après le samedi, hors week-end, férié, vacances scolaires, et sur
   une date ne portant **aucune autre récupération de l'équipe** (`rAssigned` est **global**, une
   seule récup par jour tous MARs confondus). Avec 104 R à caser, la fenêtre sature.
2. **Repli** : `for(const d of allDays)` — balaie l'année **depuis le 1er janvier**, **sans jamais
   vérifier que la date est postérieure au samedi**. Il prend la première place libre, presque
   toujours en début d'année.

**Conséquence fonctionnelle démontrée.** `_transfererR_` (`echanges.gs`) refuse le transfert si
`dateR <= aujourd'hui` — message existant : *« R non transféré (déjà pris le JJ/MM) »*. Pour
**trois samedis sur quatre**, le R a été posé des mois plus tôt : **le transfert échouera presque
toujours**. La conception du chantier D suppose l'inverse.

**Et le déséquilibre n'est pas qu'informatif** : le cédant a pris sa journée de récupération, puis
donne le samedi — **il garde le bénéfice d'une garde qu'il ne fera pas**, pendant que le preneur
tient le samedi **sans compensation**.

**Faisabilité de la compensation double, mesurée le 21/08** sur les 76 cas :

| | Cas | Part |
|---|---|---|
| Retirer un R au cédant **et** en donner un au preneur | 21 | **28 %** |
| Seul le don au preneur est possible (aucun R postérieur chez le cédant) | **55** | **72 %** |

Les 55 cas se concentrent sur juillet-décembre : plus le samedi est tardif, moins le cédant a de R
restants derrière lui.

**⛔ DÉCISION D'ARTHUR (21/08) : le R du preneur d'abord, le reste en arbitrage.** *« Le plus
important est que celui qui prend le samedi ait un nouveau jour de R. Parfois le cédant aura gratté
un R gratuit mais tant pis, le comité arbitrera. »*

**Message à afficher aux deux MARs** (à joindre au chantier D) :

> ⚠️ **La récupération de ce samedi a déjà été prise le {date}**
> **{Preneur} tiendra ce samedi sans récupération.** Prévenez le comité : il posera un jour de
> récupération, et retirera si possible celui du cédant.

**Piste évoquée par Arthur — reporter le R gratté en dette sur l'année suivante.** La mesure existe
déjà : chaque MAR a un nombre de samedis tenus et un nombre de R, **aujourd'hui rigoureusement égaux
pour tout le monde** (vérifié : 104 = 104, 0 MAR en écart). Un R gratté se voit donc immédiatement.
L'écart pourrait se reporter comme la dette de gardes — même principe, même amortissement. **Mais
c'est un mécanisme NOUVEAU** : la dette actuelle porte sur les gardes, pas sur les repos. À examiner
sérieusement, après le 4 septembre.

**Correctif du générateur → voir le chantier dédié ci-dessous (🔴 PLACEMENT DES RÉCUPÉRATIONS).**

⚠️ **ERREUR CORRIGÉE LE 21/08.** J'ai écrit trois fois que « 2027 est généré et ne sera pas
régénéré ». **C'est faux, et Arthur l'a corrigé.** La grille `GARDES_2027` du classeur est celle du
**bac à sable de démo** ; la **vraie** 2027 sera générée après la campagne d'indisponibilités
d'octobre. La ROADMAP le disait déjà noir sur blanc au 10/08 : *« Le risque n'est pas la démo, c'est
NOVEMBRE : ces lignes se colleraient sur la vraie génération 2027. »* J'avais lu ce passage le matin
même. **Conséquence : le correctif ne sert pas seulement 2028 — il sert la vraie 2027, à condition
d'être en place avant la génération.**

## 22 août 2026 — le placement des récupérations, déployé et confirmé en production

`generateur_gardes.gs` **2026-08-21.1** recopié et déployé par Arthur · **génération de test 2027
lancée à 08h30** · résultats **vérifiés dans le classeur**, pas seulement au banc.

### ✅ Ce que la génération réelle a donné

`LIENS_R_2027`, 104 récupérations, mesurées ligne à ligne :

| | Avant (grille du 14/08) | **Après (22/08)** |
|---|---|---|
| Posées **après** leur samedi | 28/104 — **27 %** | **100/104 — 96 %** |
| Délai médian | **−75 j** (avant la garde) | **+6 j** |
| Pire cas | 354 j avant | 16 j avant |
| Jours descendant sous 15 présents | 15 | **0** |
| Jour de la semaine | — | **54 lundis · 22 vendredis** |
| Deux récupérations le même jour | jamais | 35 jours (jamais trois) |

**Les 4 récupérations restées antérieures** sont exactement les cas prévus : samedis du 25/12 et du
01/01, sans lendemain dans l'année. Posées 8 à 16 jours avant — donc **encore transférables** en cas
d'échange.

### 🔑 LA MESURE QUI COMPTE — le gain réel pour l'équipe

Longueur de la **plage de repos continue** autour de chaque récupération (week-end, férié, congé,
repos de garde compris) :

| | Avant | **Après** |
|---|---|---|
| Récupérations **isolées** (1 seul jour de repos) | **33 — 32 %** | **2 — 2 %** |
| Dans une plage de 3 jours ou plus | 58 — 56 % | **93 — 89 %** |
| Dans une plage de 10 jours ou plus | 3 | **19** |
| **Longueur moyenne** | **3,03 j** | **5,98 j** |

**La durée moyenne du repos autour d'une récupération a doublé.** Avant, un tiers des jours rendus
étaient un mercredi off perdu au milieu d'une semaine de travail. Même nombre de jours dus — 104 —
mais ils servent à quelque chose.

### 🔒 Rien n'est cassé — contrôlé sur la grille produite

| Contrôle | Résultat |
|---|---|
| Jours sans exactement 1 G + 1 G2 | **0** sur 364 |
| Repos orphelins (RG sans garde la veille) | **0** |
| Gardes sans repos le lendemain | **0** |
| Gardes consécutives | **0** |
| Récupérations un week-end ou un férié | **0** |
| Astreintes 18 h | 251, **une par jour ouvré**, jamais le week-end, écart 6–14 |
| Samedis tenus = récupérations dues | **104 = 104**, aucun MAR en écart |

**Équité meilleure sur trois axes** : jeudi 1,00 → 0,50 · vendredi-dimanche 1,40 → 1,20 · fériés
1,90 → 1,80. Total 0,60 → 0,70 (bruit de régénération, pas un effet du patch).

### Les 5 avertissements de la génération — identifiés

Les LOGS ne conservent que le **compte**, pas le texte. Mais l'historique tranche : les générations
des 1er, 10, 11 et 14 août en produisaient **1**, toujours le même. Celle du 22 en produit **5**.
Les 4 nouveaux correspondent exactement aux 4 récupérations posées avant leur samedi (Noël et Jour
de l'an) — message prévu, qui prévient qu'un échange de ces samedis ne pourra pas transférer la
récupération. **Le 5e est l'avertissement historique**, sans rapport avec le patch.

⚠️ **Défaut à traiter avec la séance A** : le générateur produit des avertissements nommés et datés,
puis **les perd**. Impossible de savoir aujourd'hui ce que disait celui du 1er août. Deux lignes
pour que `logAction` écrive le détail, pas seulement le nombre.

### Ce que la régénération a appris sur la marche à suivre

- **`generateGardes` supprime et recrée lui-même** `GARDES_{Y}`, `STATS_GARDES_{Y}` et
  `LIENS_R_{Y}`. Seul `GARDES_{Y}` est à supprimer à la main, et uniquement pour lever le verrou.
- **`INDISPOS_{Y}` et `AFFECTATIONS_{Y}` sont des ENTRÉES** — ne jamais les supprimer.
- **L'assistant publie tout seul** : `generatePlanning(year)` est appelé juste après
  `generateGardes` (`Indispos.gs` l.2528). Rien à republier. *(Erreur corrigée par Arthur : j'avais
  annoncé une republication manuelle obligatoire.)* En revanche, appeler `generateGardes()`
  directement depuis l'éditeur ne publie pas.
- **Le miroir ne lit pas le classeur** mais le fichier `planning_{Y}.json` du Drive (`miroir.gs`
  l.378 → 852). Sans publication, il recopierait fidèlement l'ancienne grille. La synchro horaire
  suffit ensuite.
- ⚠️ **`planning_{Y}_notifie.json`** garde la photo au dernier envoi de notifications. Republier
  après une régénération déclenche la comparaison : le système voit toute l'année changée. Protégé
  ce jour par l'absence d'adresses (« 1 email, 24 sans email » dans les LOGS). **Ce filet disparaît
  le 4 septembre** quand les 24 adresses seront saisies. Réflexe à prendre : supprimer ce fichier
  avant de republier, ou vérifier `NOTIF_EMAIL_TEST`.
- Le circuit de notification de changement est **email uniquement** (`_notifExpedier`, `code.gs`) —
  aucun envoi push.

### 📊 Diapo du staff — commit `6e55eb21`

Nouvelle diapo **« Vos récupérations de samedi »**, après « Un jour de congé gagné avant les
vacances ». **Ne parle QUE de l'état actuel** — consigne d'Arthur : évoquer l'ancien placement est
inutile et affaiblit le propos. Trois chiffres : 76/104 un lundi ou un vendredi · 6 j de repos
d'affilée en moyenne · 15 présents au minimum. Chute : *un jour par samedi de garde comme avant,
aucune garde ne change de main, aucun compteur d'équité ne bouge*.

**Calendrier de l'année type régénéré** depuis la nouvelle grille. Le Dr Armando reste l'exemple et
il est meilleur qu'avant : 34 gardes pour 34,6, **5 récupérations toutes un vendredi ou un lundi,
aucune isolée**. Celle du 5 avril suit une formation et un week-end.

**Doublons retirés** : carte « 5 récupérations placées automatiquement » de l'année type (g4 → g3),
mention dans l'escalier des axes. **Conservés** : la carte « 1 = 1 » des garanties (c'est le NOMBRE,
une garantie d'équité, pas le placement) et la légende verte du calendrier.

---

#### ✅ LIVRÉ LE 21/08/2026 — LE PLACEMENT DES RÉCUPÉRATIONS

`generateur_gardes.gs` **2026-08-21.1** · `banc/banc_recups.js` (34 vérifications) ·
`banc/jeu_service.json` · banc complet **1 589 vérifications, 0 échec**.
⚠️ **À recopier dans l'éditeur Apps Script**, puis déployer une nouvelle version.
**Rien ne se passera avant une génération** : le code ne tourne qu'à ce moment-là.

##### Ce que fait le nouveau placement

Pour chaque samedi, **dans l'ordre du calendrier** (et non plus dans l'ordre de la
liste MEDECINS), on cherche une date **APRÈS la garde** :
1. **Un vendredi, un lundi, ou un jour bordant une absence déjà posée** — quelque
   chose qui prolonge un repos existant. *Règle demandée par Arthur : « quitte à
   placer un R autant le faire sur des jours sympas, style vendredi ou lundi pour
   prolonger le WE, ou augmenter les vacances ».*
2. Sinon n'importe quel jour ouvrable.
3. Sinon en acceptant une journée déjà chargée — **le plancher d'effectif tenant
   toujours**.
4. En tout dernier recours, une date **avant** la garde, la **plus proche possible** —
   jamais la plus ancienne : si le samedi change de mains, le R n'est transférable que
   s'il est encore à venir. Chaque relâchement écrit un avertissement nommé.

**Réglages** : `R_MAX_PAR_JOUR = 2` · `R_PLANCHER_PRESENTS = 15` (aligné sur le code
couleur du planning du service : vert = 15 présents ou plus).

##### Quatre corrections de fond, chacune issue d'une précision d'Arthur

1. **Le plancher de 15 est ABSOLU** — il s'applique même en dernier recours (« on ne
   passe pas sous 15 »). L'ancien code sautait ce contrôle en juillet, août et
   décembre.
2. **Les MARs de garde sont COMPTÉS PRÉSENTS.** Ils travaillent au bloc dans la
   journée. Vérifié sur le planning réel : le 08/09/2026, « TOTAL PRESENTS » vaut 15,
   soit les MARs actifs moins les absents, **gardes incluses**. L'ancien calcul les
   excluait et sous-estimait l'effectif de 2.
3. **INDISPO et SOUHAIT ne sont PAS des absences.** Ce sont des préférences exprimées
   **avant** la génération, à l'usage de l'algorithme des gardes ; une fois les gardes
   posées elles n'ont plus de sens, et le jour est un jour de travail ordinaire. Le
   code le savait déjà ailleurs (`ABSENT_18` ne les contient pas). **905 jours sur
   2 451 redeviennent disponibles.**
4. **`blocked()` n'est plus utilisée pour les récupérations.** Elle répond à « ce MAR
   peut-il prendre une GARDE ? » et exclut la veille d'une garde et le combo
   jeudi-samedi — deux règles contre l'enchaînement de deux gardes, sans objet pour un
   jour de repos. Un MAR de garde étant présent au bloc, se reposer la veille est
   légitime. Une fonction dédiée `_rDispo()` la remplace.

##### Résultats — mesurés sur la CHARGE RÉELLE du service

Jeu `INDISPOS_2027` du classeur : **2 451 jours d'absence, 25 MARs**, régimes
particuliers compris.

| | Avant | Après |
|---|---|---|
| Récupérations **après** leur samedi | **34 %** | **95 %** |
| Délai médian | 27 jours | **6 jours** |
| Pire cas | **354 jours AVANT** | 18 jours avant |
| Prolongent un week-end ou une absence | — | **98 %** (57 lundis · 25 vendredis · 24 accolées) |
| Jours descendant sous 15 présents | **15** | **0** |
| Récupérations perdues | 0 | **0** |

⚠️ **Le jeu par défaut du banc ne voyait RIEN.** Trop peu d'absences : l'effectif y
reste à 20-21, le plancher n'est jamais atteint. C'est en passant sur la charge réelle
qu'on a découvert que l'algorithme d'avant ne posait **aucune** récupération un lundi
pour **personne** — 0 MAR sur 21 — sa fenêtre démarrant à 2 semaines.

##### 🔒 PREUVE DE NON-RÉGRESSION — l'algorithme des gardes est INTACT

Question d'Arthur : *« l'algo de garde est la pierre angulaire du système, je ne veux
rien casser »*. Vérifié sur **4 configurations** (charge réelle + 3 années du jeu par
défaut), **24 contrôles, 0 échec** :

- **Grille identique CELLULE PAR CELLULE** (G, G2, RG, absences) — zéro différence.
- **Statistiques identiques au caractère près** : cibles, totaux, SAM, JEU, VD, JF,
  VJF, Noël.
- **Équité par axe inchangée au centième** : TOTAL 0,50→0,50 · SAM 0,80→0,80 ·
  JEU 1,00→1,00 · VD 1,20→1,20 · VJF 0,60→0,60.
- **Astreintes 18 h** : total conservé (251), **une par jour ouvré, jamais deux,
  jamais le week-end**, répartition par MAR rigoureusement identique sur la charge
  réelle (min 6 · médiane 11 · max 14).

**Pourquoi c'est structurel** : l'ordre du générateur est gardes (§8) → récupérations
(§9) → astreintes (§10) → stats (§13). Quand le placement des R s'exécute, tout est
déjà décidé ; il LIT et n'écrit que `rSet`. Seul effet en aval possible : les
astreintes étant placées après, un R déplacé change *qui* est disponible — jamais
*combien* chacun en tient, le tri par charge relative rattrapant l'écart.

##### Sept contre-épreuves, chacune faisant tomber un test précis

Postériorité supprimée (11 % au lieu de 96 %) · plancher jusqu'au dernier recours
(**895 récupérations perdues sur 10 ans**) · délai minimum à 0 · tri par charge
supprimé (5 R empilées sur une date) · plafond porté à 99 · plancher abaissé à 8 ·
réservation du lundi désactivée.

##### Erreurs de méthode commises ce jour-là — à ne pas refaire

- **Mon premier patch perdait 895 récupérations sur 10 ans** : j'appliquais le plancher
  d'effectif jusque dans la passe de dernier recours. *Une récupération mal datée reste
  due au MAR ; une récupération jamais posée est un jour de repos volé.*
- **Trois de mes tests ne mordaient pas** : ils lisaient la constante depuis le code
  (mettre le délai minimum à 0 faisait passer « aucune récup à moins de 0 jour ») ou ne
  testaient jamais les passes de repli. **Les valeurs de réglage sont désormais
  verrouillées dans le banc.**
- **J'ai parlé de « week-end de 3 jours »** : faux, le samedi est travaillé. Le lundi
  qui suit la garde donne DEUX jours de repos consécutifs (dimanche + lundi).
- **J'ai construit un scénario de banc irréaliste** (16 MARs, 6 semaines d'absence) où
  l'effectif tombe structurellement sous 15 et où plus rien n'est posable.
- **J'ai affirmé trois fois que « 2027 ne sera pas régénérée »** alors que la ROADMAP
  disait le contraire au 10/08, et que je l'avais lue le matin même.

##### ⚠️ Note sur `banc/jeu_service.json`

Contient `INDISPOS_2027` du classeur — **scénario de démonstration construit par
Arthur**, calqué sur le volume et la saisonnalité réels de l'équipe. **Identités
remplacées par MAR01..MAR25** : le dépôt est public, un nom réel n'a rien à faire à
côté de données d'absence, même fictives. Entorse assumée à la règle « ne recopie
jamais de données du classeur dans le dépôt », validée par Arthur le 21/08 : sans cette
charge, le banc ne détecte aucun des défauts corrigés ici.

##### Ce qu'il reste

- **5 récupérations sur 104 restent posées avant leur samedi** (au pire 18 jours
  avant) : samedis de fin d'année sans lendemain disponible. Le générateur les signale.
- **`isVacancesScolaires` n'a plus aucun appelant** — l'exclusion des vacances est
  remplacée par le plancher d'effectif. La fonction est conservée avec un avertissement
  en tête : ne pas croire, en la lisant, qu'elle contraint encore quelque chose.
- **À vérifier lors de la génération de test** : ouvrir `LIENS_R_{année}` et comparer
  `DATE R − SAMEDI`. Avant : une majorité de négatifs. Après : une majorité de petits
  positifs.

#### 🔴 LE CHANTIER TEL QU'IL ÉTAIT POSÉ (conservé pour la trace)

**Arrêté avec Arthur le 21/08, simulations à l'appui.** ⚠️ **Échéance dure : la vraie 2027 est
générée après la campagne d'octobre.** Le correctif doit être écrit, testé au banc et déployé avant.
Ce n'est pas un chantier de 2028.

##### Le défaut, et sa cause exacte

Deux règles internes, prises ensemble, rendent le placement impossible :
1. **`rAssigned` est GLOBAL** — une seule récupération par jour pour **toute l'équipe**.
2. **Les vacances scolaires sont totalement exclues** — près de **4 mois** dans l'année (hiver,
   printemps, été, Toussaint, Noël), dont deux mois d'été en bloc.

Arithmétique du blocage : les **30 samedis du 2e semestre** demandent **60 récupérations**, et il ne
reste que **65 jours** ouvrables hors vacances entre septembre et décembre — en exigeant en plus que
le MAR soit libre et l'effectif suffisant. **La place n'existe pas.** Le repli qui balaie depuis le
1er janvier n'est donc pas une négligence : c'est la seule issue.

Résultat mesuré sur la grille de démo : **90 % des récupérations tombent au 1er semestre**, juillet
et août n'en portent **aucune**, octobre une seule.

##### La règle retenue (décision d'Arthur, 21/08)

> **Une récupération peut être posée n'importe quel jour ouvrable, vacances scolaires comprises,
> tant que l'effectif reste à 15 présents ou plus après l'avoir posée. Deux au maximum le même
> jour.**

Alignée sur le code couleur du planning réel du service (vert = 15 présents ou plus), donc
vérifiable d'un coup d'œil.

##### Ce que disent les données RÉELLES (fichier `planing.ods` fourni par Arthur le 21/08)

Effectif présent sur **193 jours ouvrables** (janv. 2026 → janv. 2027) : médiane **17**, mode 17.
**80 % des jours sont à 15 ou plus.**

| Effectif | Jours |
|---|---|
| ≥ 17 | **105** → peuvent porter 2 récups |
| = 16 | **30** → peuvent en porter 1 |
| ≤ 15 | 58 |

**Capacité théorique : 105×2 + 30×1 = 240 récupérations possibles pour un besoin de 104.**
**Plus du double de la place nécessaire.** ⇒ *le verrou n'a JAMAIS été l'effectif* : c'était
l'unicité globale et l'exclusion des vacances.

⚠️ **Juillet et août resteront hors-jeu, et c'est un fait, pas une règle** : août n'a aucun jour à
16 ou plus, 11 jours sur 16 sont déjà sous 15. Le gain vient de février, avril, octobre et Noël.

##### Résultat simulé (plancher 15 · max 2/jour · vacances incluses)

| | Aujourd'hui | Après |
|---|---|---|
| Récupérations **après** leur samedi | 28/104 — **27 %** | **94/104 — 90 %** |
| Délai médian samedi → récup | **−75 j** (avant !) | **+23 j** |
| Jours utilisés | — | 60 (dont 34 à 2 récups) |
| Effectif après pose | — | médiane 16, **jamais sous 15** |

**Sensibilité — le levier décisif est le passage de 1 à 2 par jour, pas le plancher :**

| Plancher | Max/jour | Placés après | Délai médian |
|---|---|---|---|
| 15 | 1 | 78 % | 32 j |
| **15** | **2** | **90 %** | **23 j** |
| 15 | 3 | 90 % | 18 j |
| 16 | 2 | 90 % | 31 j |

⇒ **le plancher 15 ne coûte rien** ; 16 donnerait le même taux pour 8 jours de délai en plus.
Passer à 3/jour n'apporte que 5 jours — ne le vaut pas.

**Les 10 échecs restants sont tous en décembre et le 01/01** : des samedis sans lendemain dans
l'année. Ils devront rester avant, ou déborder sur l'année suivante.

##### 🔑 L'effet en cascade sur les échanges de samedi — mesuré

Un échange se conclut **avant** le samedi ; le transfert de récupération réussit si elle est encore
à venir.

| | Transfert possible | Marge minimale |
|---|---|---|
| Aujourd'hui | **28/104 — 27 %** | — |
| Après correction | **94/104 — 90 %** | **16 jours** après le samedi |

**Même un échange conclu la veille laisse 16 jours pour transférer.** Le message « récupération déjà
prise » passerait de **trois cas sur quatre** à **10 sur 104**, tous en décembre-janvier : il
redevient l'exception.

**Un seul correctif règle QUATRE choses** : la datation absurde, l'entassement en début d'année,
l'échec des transferts lors des échanges, et le déséquilibre du « R gratté » (le cédant qui garde le
bénéfice d'une garde qu'il ne fera pas).

##### Réserves et méthode

- **Les simulations tournent sur la grille de DÉMO**, pas sur les vraies indisponibilités
  (collectées en octobre). L'ordre de grandeur est solide — le verrou est structurel — mais le
  chiffre de 94 ne se reproduira pas à l'identique. Le planning réel étant **plus généreux**
  (médiane 17 contre un effectif plus serré en démo), le taux réel devrait être **au moins aussi
  bon**.
- **17 jours resteraient pile à 15.** Admissible puisque c'est le seuil retenu, mais un arrêt
  maladie ce jour-là fait passer dessous. La variante 16 est gratuite en couverture si Arthur change
  d'avis.
- ⚠️ **Le banc de charge est indispensable ici** (documenté au 11/08, jamais branché) : on change une
  règle de fond du générateur, il faut faire tourner le vrai code sur une année complète et comparer
  avant/après. **C'est le moment de trancher cette décision en attente.**

#### ✅ Ce que l'examen confirme, mesuré sur 2027

| Contrôle | Résultat | Mesure |
|---|---|---|
| Couverture | parfait | 364 jours, chacun exactement 1 G + 1 G2 |
| Équité totale | **optimal** | écarts recalculés −0,17 à +0,83, somme nulle |
| Équité par axe | bon | sam ±0,8 · jeu +1,0/−0,5 · VD +0,8/−1,4 · VJF ±0,5 |
| Fériés | correct | +1,9/−1,2 — axe le plus dispersé, sur 24 jours seulement |
| Récupérations dues | exact | 104 samedis → 104 R, **0 MAR en écart** |
| Unicité des R | exact | aucune date ne porte deux R |
| Garde-fou anti-régénération | solide | refus net si la grille existe, suppression manuelle exigée |
| Impasses de couverture | tracées | chaque repli produit un avertissement nommé et daté |

#### 🟠 Trois points de vigilance, sans urgence

1. **2028 sera la PREMIÈRE année où la dette inter-annuelle jouera.**
   `PREMIERE_ANNEE_STATS_FIABLES = 2027` → pour générer 2027, `year-1 = 2026 < 2027`, donc **départ
   neutre : le mécanisme n'a jamais tourné en conditions réelles**. Amorti à 60 %, plafonné à ±2 par
   axe. Noté aussi : `STATS_GARDES_2026` n'a **pas** de colonne `CIBLE JF` — le repli sur `CIBLE SAM`
   prévu dans le code jouera. **À surveiller de près en novembre 2027.**
2. **`tp_jours_fixes` est la même erreur de raisonnement que la cible relevée** : une cible
   individuelle modifiée sans répercussion sur l'équipe. Différence : ici la contrepartie est
   **absente**, alors que pour la cible relevée elle est **assumée**. Les deux se regardent ensemble.
3. **Les avertissements de génération ne survivent pas.** « choix contraint, équité dégradée »,
   « pourvu en tolérant le combo jeudi-samedi » : renvoyés à l'écran, conservés nulle part. Même
   problème que le diagnostic hebdomadaire — **à faire bénéficier du mécanisme de la séance A**.

#### ⚠️ Limites de l'examen

- **Le générateur n'a PAS été exécuté.** Tout vient de 2027 tel que produit, croisé avec la lecture
  du code. Un défaut propre à une autre configuration (beaucoup de TP, équipe plus petite, année à
  53 semaines) n'apparaîtrait pas.
- **Le banc de charge existe mais n'est pas branché** (documenté au 11/08 : vrai générateur, année
  complète, 260 jours de TP, ~15 s de plus au lancement, décision en attente). C'est l'outil adapté
  pour éprouver le correctif des récupérations.
- **Aucun des points ne justifie de régénérer 2027**, ce qui reste interdit.

### Ce qui reste ouvert

- **⚠️ Une publication coincée ne le dit toujours pas.** Les deux correctifs suppriment la cause la
  plus fréquente ; une coupure réseau ou une panne Google produiraient le même silence. Le message
  dit « vous pouvez fermer cette page », la pastille passe au vert, et rien ne contredit.
  Correctif de fond : que la page vérifie que sa fiche a quitté la file et le signale sinon.
  **Après le 4 septembre.**
- **Le compteur « Read » du tableau de bord affichait 0** alors que les pages sont consultées. Ne
  s'explique pas par le code. Soit la vue ne compte pas les lectures faites depuis un Worker, soit
  la métrique est en retard. **Non vérifié** — le connecteur Cloudflare ne donne pas les métriques.
  Sans effet sur le diagnostic, mais à ne pas prendre pour un constat.
- **À relever le lendemain matin**, même heure : les ouvertures de file doivent être nettement sous
  640, et les écritures sous 380. Si elles ne bougent pas, c'est que les recopies n'ont pas été
  faites.

---

## 23 août 2026 (soir) — le circuit TP écrit dans le PLANNING, et un blocage de huit jours mis au jour

**Douze commits** — v1.71 → **v1.76**, `Indispos.gs` **2026-08-23.6**, `miroir.gs` **2026-08-23.6**,
`echanges.gs` **2026-08-23.1**. Banc : **1 839 vérifications, 0 échec**. Tout déployé et éprouvé.

### La refonte demandée par Arthur

> « INDISPOS est un onglet qui sert AVANT la génération des gardes. Après, c'est inutile.
> Il faut écrire dans GARDES, l'onglet maître du planning. »

Un jour de temps partiel **accordé s'écrit dans `GARDES_{Y}`** — jamais ailleurs — et le planning est
republié. Écriture uniquement dans une case **vide**, effacement uniquement d'un `TP`, lecture juste
avant écriture. `TP` figurant dans `ABSENT_CODES`, le MAR sort automatiquement de son secteur.
**Une demande non tranchée n'écrit rien dans le planning** : elle attend dans le nouvel onglet
**`TP_DEMANDES`** (ANNEE | DATE | MAR | QUAND). Le comité valide → `TP` dans la grille, la ligne
disparaît. Il refuse → la ligne disparaît, le jour se ferme dans `TP_FERMES`.

### Les décisions d'Arthur dans la séance

- **Plafond commun** : accordés + en attente ne dépassent jamais le quota. On pouvait poser 26 verts
  puis demander 10 jaunes et finir à 36.
- **Décisions en lot** : le comité marque toute sa liste — rien ne part — puis envoie d'un coup.
  **Contrepartie assumée : l'annulation après envoi disparaît**, un jour fermé par erreur se rouvre
  en supprimant sa ligne dans `TP_FERMES`.
- **Republication différée** : republier coûte ~10 s (mesure du 09/08) ; cinq validations d'affilée
  auraient fait attendre 50 s. La requête note l'année, un déclencheur unique republie dans la minute.
- **Vocabulaire** : ACCORDÉ (inscrit au planning) · EN ATTENTE (le comité n'a pas tranché) · RESTANT.
  « 19 posés » à côté de « 7 sous réserve » se lisait comme si les 19 contenaient les jaunes.
- **Traçabilité des connexions réduite à deux endroits** : portail et comité. Cinq journaux retirés.
- **Récupération de samedi : un seul canal.** Le mail au comité est retiré ; l'alerte vit dans
  l'onglet **Statuts**, avec une **pastille sur l'onglet**. Elle se calcule (écart samedis tenus /
  récups posées) donc elle s'éteint seule quand le `R` est posé.

### Le défaut le plus important de la journée

**La copie rapide était bloquée depuis le 5 août.** Le déclencheur de poussée n'était armé **que si la
file d'attente était vide** — l'idée étant qu'une file pleine signifiait qu'un déclencheur existait.
Faux dès qu'une exécution meurt avant la purge : la file restait pleine **pour toujours**, plus aucune
écriture n'armait de déclencheur, et **plus rien ne se rafraîchissait automatiquement, sur tous les
écrans**. Invisible faute de trace. La condition juste est « aucun déclencheur n'existe ».

**Ce n'est pas la lecture du code qui l'a trouvé, c'est la trace.** Après trois correctifs posés sur
des hypothèses, l'accroche a été rendue observable : LOGS dit désormais quelle action a été notée,
avec quelle année, ce que la poussée a écrit, ce qu'elle a jugé inchangé, et **ce que le relais a
refusé**. Le diagnostic a suivi en une lecture du classeur.

### Trois autres défauts trouvés en production

1. **La tuile n'apparaissait pas** — les critères d'éligibilité étaient câblés sur la connexion GAS,
   or le portail s'ouvre par la copie rapide, dont l'identité est une liste blanche de champs.
2. **L'écran s'ouvrait blanc** — `getJoursFeries()` renvoie un ENSEMBLE, qui devient `{}` en voyageant.
   Le banc ne l'avait pas vu **parce qu'il passait la clé en mémoire, jamais par le texte**. Défaut
   jumeau : la clé `joursferies_` du comité n'avait **jamais** été poussée depuis sa création.
3. **Les boutons du comité ne partaient nulle part** — `apiCall` n'existe pas dans `admin.html`.

### Ce que le banc a gagné

`banc_pose_tp_page.js` : la **vraie page** pilotée avec la clé qui fait le **voyage complet en texte**
à travers le vrai relais, latence comprise ; le **vrai bouton** du comité réellement cliqué. Plus un
balayage qui refuse tout ensemble laissé dans une clé.

### Conséquences sur les documents

Le ménage du 4 au soir passe à **onze gestes** : `TP_DEMANDES` rejoint `TP_FERMES` — ni l'un ni
l'autre n'est rattaché à une année, une demande oubliée réapparaîtrait dans le vrai planning de
novembre.

---

## 23 août 2026 — la pose des TP en production, trois défauts trouvés en vrai, et la démo change de forme

**Six commits** (`51eb3fe`, `7c45ce7`, `f67b61e`, `cff7a22`, `3d8903f`, + docs) — v1.68 → **v1.71**,
`Indispos.gs` **2026-08-23.2**, `miroir.gs` **2026-08-23.1**, Worker **2026-08-22.2**.
Banc : **1 778 vérifications, 0 échec** (35 scripts). **Tout est déployé et éprouvé en production.**

### Trois défauts, tous de la même famille : « je n'ai pas lu le consommateur »

1. **La tuile n'apparaissait pas.** Les critères d'éligibilité étaient câblés sur la connexion GAS —
   or `dashboard.html` ouvre le portail par la **copie rapide**, dont l'identité est une liste blanche
   de champs. Correctif : `phaseTp`, `quotite` et `tpFixe` voyagent dans la clé d'accès et le relais ;
   `acces` se reconstruit à `generateGardes` et `archiveYear`.
2. **L'écran s'ouvrait blanc.** `getJoursFeries()` renvoie un **ENSEMBLE** ; mis en texte pour voyager,
   il devient `{}`. La page plantait sur `new Set({})`, et le filet de la connexion **avalait l'erreur**.
   Le banc ne l'avait pas vu **parce qu'il passait la clé en mémoire, jamais par le texte**. Correctif :
   les fériés partent en liste, la page n'accepte qu'une liste, et **plus jamais d'écran blanc** —
   toute erreur de montage s'affiche avec sa raison. Défaut jumeau corrigé au passage : la clé
   `joursferies_` du comité faisait `.concat()` sur ce même ensemble et **n'avait jamais été poussée
   depuis sa création**.
3. **Les boutons du comité ne partaient nulle part.** Le bloc appelait `apiCall`, **qui n'existe pas
   dans `admin.html`** (cette page parle au serveur par `api({action})`). Six appels corrigés.

**Ce que le banc a gagné** : `banc_pose_tp_page.js`, nouveau scénario où la **vraie page** est pilotée
avec la clé qui fait le **voyage complet en texte** à travers le vrai relais, latence comprise ; un
balayage refuse tout ensemble laissé dans une clé ; et le **vrai bouton « Valider »** d'`admin.html`
est réellement cliqué, avec exigence qu'une décision parte au serveur.

### Décisions d'Arthur dans la journée

- **Traçabilité des connexions : deux endroits, pas un de plus** — portail (`dashboard.html`) et comité
  (`admin.html`). Les cinq journaux de `index.html`, `indispos.html` (×2), `staff.html` et
  `absences.html` sont retirés : ils réveillaient Apps Script à chaque ouverture sans rien apprendre.
  `banc_ptr.js` vérifie désormais **où le journal a le droit d'exister**.
- **Instantané = servi par la copie rapide.** Mesuré : **un seul aller-retour** avant l'affichage de
  l'écran de pose. Ce qui restait, c'était un écran de connexion inutile pendant ~150 ms — remplacé
  par un squelette dès que le code est en mémoire.
- **La réponse du comité se notifie.** Validation ET refus préviennent le MAR (date en toutes lettres,
  ouvre l'écran de pose). Un refus ne notifie **que les demandeurs du jour** — « le jour passe noir et
  basta, les autres le verront noir ». Une notification qui rate ne fait jamais échouer la décision.
- **Jours passés figés, phase à deux années** (v1.68) : un TP révolu est posé, compté, intouchable par
  le MAR — le comité garde la main. Et fin 2027, le reliquat 2027 restera posable pendant que 2028
  s'ouvrira.

### La démonstration du 4 septembre change de forme

**Le bac à sable est périmé** : `INDISPOS_2027` contient **256 cellules TP** chez huit médecins, posées
par l'ancien circuit. Le générateur les lit comme des absences — les laisser fausserait le calcul et
contredirait ce qu'on montre. **Elles doivent être vidées avant toute génération** (`Ctrl+H`, contenu
entier de la cellule, `TP` puis `TPA`, cette feuille seulement), et de nouveau après la répétition du
1<sup>er</sup>, qui en posera de test. Vérifié : **`LIENS_R_2027` n'est PAS à supprimer** — le
générateur le détruit et le recrée lui-même.

**Nouveau déroulé, quatre actes** : (1) le volontaire saisit **deux ou trois** indisponibilités —
court, c'est voulu ; (2) génération ; (3) résultat, certificat, notifications, mail ; (4) **la pose des
temps partiels**, carte violette apparue avec la publication, calendrier en trois couleurs, validation
par le comité et notification sur le téléphone.

**Point pratique à régler avant le 4** : Arthur est à 100 % et le collègue qui génère aussi — **la carte
violette n'apparaîtra avec aucun de leurs deux codes**. Il faut un des huit temps partiels dans la
salle (WIDEHEM, testeur du circuit), sinon se connecter à sa place sans jamais projeter le code, code à
régénérer le soir.

**Livrables** : `docs/roadmap.html` (phase 0 et C du 1<sup>er</sup>, contrôle du matin du 4, déroulé à
quatre actes, ménage), `docs/presentation-staff.html` (diapo « Choisir ses jours, une fois les gardes
connues » + notes d'orateur), et un PDF de marche à suivre détaillée pour le 1<sup>er</sup> et le 4.

---

## 22 août 2026 (soir) — v1.65 → v1.67 : la pose des temps partiels est CONSTRUITE (lots 1 à 4)

**Quatre commits dans la journée** (`510cf80`, `b02c649`, `8388d72`, `c8cbe2d`) — la totalité du
chantier décidé l'après-midi même (entrée ci-dessous), écrans comité compris. **Banc : 1 705
vérifications, 0 échec** (dont 62 neuves, scénario `banc_pose_tp.js`, contre-épreuves faites).
**RIEN N'EST DÉPLOYÉ** : le dépôt porte tout, Arthur recopie à son retour PC, dans l'ordre
non négociable **Worker d'abord, puis `Indispos.gs` (2026-08-22.3) + `miroir.gs` (2026-08-22.2)
+ nouvelle version de déploiement, puis `miroirSyncComplet`**. D'ici là : tuile invisible,
écran `?tp=1` « fermé », rien ne casse.

### Ce qui existe désormais

- **Lot 1 — le socle serveur.** La phase de pose se DÉDUIT (`GARDES_{Y}` **et** `LIENS_R_{Y}`
  présents), jamais d'un drapeau à poser. Deux circuits d'écriture étanches dans `saveIndispos` :
  campagne (verrou serveur : hors campagne, un MAR est refusé avec un message clair) et TP
  (`{tp:true}`, routé vers l'année de PHASE — le repli `getIndisposYear() → année active` aurait
  envoyé les TP dans la mauvaise année, attrapé par le banc avant tout push). `_poserTp_` : passe 1
  l'acquis (un TP validé n'est JAMAIS re-jugé ; le comité peut annuler sa propre validation, un MAR
  ne peut pas s'auto-valider), passe 2 les nouveautés en ordre chronologique, aux seuils
  15 (validé) / 13-14 (TPA « sous réserve », ne consomme pas le quota) / ≤ 12 (refus chiffré).
- **Lot 2 — la tuile** (`v1.65`). « Mes jours de temps partiel », violette, visible si
  phase active ET quotité < 100 ET pas de jours fixes — critères SERVEUR renvoyés à la connexion,
  repli vieux-serveur → invisible. Icône `calendar-clock` ajoutée au paquet local (une icône
  absente du paquet fait un carré vide, sans erreur).
- **Lot 3 — l'écran de pose** (`?tp=1` sur `indispos.html`, `v1.66`), conforme à la maquette.
  Nourri par la clé **`pose_tp_{Y}`** de la copie rapide : effectifs par jour ouvré (des NOMBRES,
  anonymes, servis à tous), fériés, et `parMar` filtré à l'identité par le relais (blocages
  personnels avec le code exact — G/G2/RG/R/18/VAC… — plus le quota). **Mesuré sur les données
  réelles 2027 : 6,8 Ko servis à un MAR, construction 31 ms.** Repli GAS : action `getPoseTp`.
  L'écran PROPOSE, le serveur TRANCHE : chaque jour nouveau est re-jugé à l'enregistrement, le
  récapitulatif rapporte aussi les refus motivés (copie rapide en retard → « l'état réel a été
  revérifié »). Le bouton « Temps partiel » a QUITTÉ l'écran campagne.
- **Lot 4 — l'écran comité** (`admin.html`, onglet Équipe, `v1.67`). Alerte dépliable, effectif
  **recalculé à l'instant** (valider une demande fait baisser sous vos yeux le chiffre de la
  suivante sur le même jour). Action `deciderJourTp`, réservée au comité, quatre gestes journalisés
  et annulables : valider (TPA→TP), annuler la validation, **refuser — le jour se FERME pour toute
  l'équipe** (nouvel onglet `TP_FERMES` : ANNEE | DATE | PAR | QUAND, créé au premier refus) **et
  les demandes en attente ce jour-là sont rendues**, annuler le refus (rouvre + rétablit).

### Les arbitrages d'Arthur, dans la séance

1. **La garde de 18h BLOQUE la pose** : « 18h implique d'être au travail, TP est un congé. »
2. **INDISPO et SOUHAIT ne bloquent PLUS** : « plus de sens une fois les gardes générées. » Un
   TP/TPA accepté écrit par-dessus le vestige ; un refus le laisse intact. (La clé s'est allégée
   au passage : 905 vestiges de campagne ne voyagent plus.)
3. **Le refus ferme le jour pour tous** (pressenti l'après-midi, confirmé) — stockage `TP_FERMES`.
4. Un jour validé puis périmé par un échange de garde : **acquis, on ne revient pas dessus**.

### Pièges rencontrés (et testés)

- **Le cousin miroir du piège d'année** : la famille `indispos` du miroir poussait
  `indispos_{année de campagne}` — après une pose de TP hors campagne, l'écran serait resté figé.
  Elle pousse désormais AUSSI l'année de phase.
- **`TP_FERMES` n'est PAS suffixé par année** (colonne ANNEE) : la purge du bac à sable du
  4 septembre au soir doit AUSSI supprimer ses lignes 2027 si des refus ont été essayés —
  ajouté à la liste de ménage.
- La clé `pose_tp_{Y}` hors phase vaut `{ferme:true}` à empreinte stable : elle s'auto-nettoie à
  la régénération, une écriture KV une seule fois.

### Guides et documents

`guide-mar.html` : section 11 « Vos jours de temps partiel », **qui s'adapte au lecteur** — un code
en mémoire sur l'appareil interroge la copie rapide : temps plein → la section se replie sur une
ligne ; temps partiel → l'introduction se personnalise avec le quota annuel ; sans code, la section
générique reste telle quelle. `guide-comite.html` : le bloc de validation dans l'onglet Équipe.
`roadmap.html` synchronisé (état vérifié, ménage à dix gestes, carte « avant novembre »).

---

## 22 août 2026 (après-midi) — les jours de temps partiel changeront de moment

**Session d'analyse et de conception. Aucun code poussé, aucun fichier du dépôt modifié.**
Deux maquettes produites et validées par Arthur.

### Le défaut : 29 repos de garde mangés par un TP chaque année

Un MAR de garde le mercredi a son repos le jeudi. Si le jeudi était son jour de temps partiel, le
repos tombe sur un jour de toute façon non travaillé : il est perdu, et le TP avec.

Mesuré sur la génération réelle 2027 (celle du 22/08 à 08h30), en lisant `INDISPOS_2027` — **jamais
la grille `GARDES`, qui écrit `RG` par-dessus le `TP` et le `V` d'un congé** (l.1535) et répond donc
faux exactement dans le cas cherché :

| cause du repos perdu | nombre |
|---|---|
| **jour de TP** | **29** |
| congés | 7 |
| formation | 1 |
| week-end (structurel, réparti par les axes) | 208 |
| férié (structurel) | 18 |

10 MAR touchés, **le plus atteint en perd 8 dans l'année**. Ce sont les 80 % et les 90 %.

### Le fait qui a tranché : le comité ne commet jamais cette erreur

Arthur a fourni le planning 2026 tenu à la main (`.ods`). Les jours de TP y sont des croix — non pas
du texte, mais des **bordures diagonales** du format, lues via 14 styles de cellule.

**Sur 725 gardes en 2026 : zéro repos tombé sur une croix. Zéro garde posée un jour de croix.**

Le générateur est donc en défaut, pas la demande. Et les croix sont réparties sur tous les jours de
la semaine (CATINEAU 13 lundis, 13 mardis, 14 mercredis, 12 vendredis, 0 jeudi) : **les jours de TP
sont choisis, pas imposés** — sauf LB, seul à avoir un jour fixe (jeu/ven, colonne
`tp_jours_fixes`), et qui ne prend pas de gardes.

### La solution d'Arthur : poser les TP APRÈS la génération

Indisponibilités et congés → génération des gardes et des repos → **puis** pose des TP dans ce qui
reste. Le repos ne peut plus manger un TP **par construction**.

Mesuré en retirant les TP de `INDISPOS_2027` et en régénérant :

| | aujourd'hui | TP posés après |
|---|---|---|
| repos tombés sur un TP | 29 | **0** |
| écart samedis | 0,80 | 0,80 |
| écart jeudis | 0,50 | 0,50 |
| écart vendredi/dimanche | 1,80 | **1,20** |
| écart total | 1,10 | **0,60** |
| jours sans binôme | 0 | 0 |

Sur 20 années simulées (2027-2046, creux d'effectif compris) : samedis 0,84 → 0,82, jeudis
0,80 → 0,74, VD 1,47 → 1,34, **somme des écarts identique (6,9/an)**, défauts de couplage 9 → 7,
replis 12 → 10.

**Trois années sur vingt voient l'écart TOTAL se creuser** (2033, 2039, 2046). Ce n'est pas une
dégradation mais un déplacement, et l'explication est double :

1. **L'optimiseur ne minimise pas l'écart total.** Ses poids sont en dur : VD 7, samedi 6, jeudi 5,
   VJF 5, **total 2**. Le total est ce qu'il accepte de sacrifier. En 2039, sa note passe de 155 à
   132 — **il a acheté du week-end avec du total**, c'est-à-dire qu'il a fait son travail.
2. **C'est une recherche locale** (best-improvement, arrêt quand plus aucun échange isolé
   n'améliore). Agrandir le terrain ne garantit pas de mieux jouer : en 2046 sa propre note se
   dégrade (114 → 121). Limite connue, bilan largement positif. **Piste si un jour ça gêne** :
   relancer l'optimiseur depuis plusieurs points de départ et garder le meilleur.

### La faisabilité : est-ce que les TP tiennent dans ce qui reste ?

**379 jours à poser** avec les quotités actuelles — LB retiré (102 j constitutifs), TRAN retiré
(date de fin 09/2026) : COPELOVICI 127, CATINEAU et SEVERAC 51, six autres 25 chacun.

**Places disponibles**, calculées sur le planning 2026 réel, jeudis et vendredis de LB déjà
consommés : **589 au minimum 16**, **410 à l'objectif 17**. Les deux passent.

**Effectif** : ta feuille compte de deux façons (ligne 1 « TOTAL PRESENTS », objectif 17 mini 16, les
2 RG comptés présents ; ligne 2 « −2 RG », objectif 15 mini 14). **82 jours sur 249 sont déjà sous
le minimum en 2026**, dont 31 en juillet-août. Le plancher n'est pas un acquis qu'on risquerait de
perdre : il est déjà enfoncé, et surtout l'été.

**Les besoins réels de l'été sont faibles** : 9 jours de TP posés en juillet-août 2026 par les 8
temps partiels, parce qu'ils sont eux-mêmes en congés (112 jours d'absence sur ces deux mois, contre
23 les autres mois). **Il n'y a donc pas de règle de priorité à écrire.**

**Constat annexe** : 224 jours posés en 2026 pour 252 dus. **Quatre personnes n'ont pas pris tout
leur temps partiel** — jusqu'à 9 jours. Ce n'est pas la place qui a manqué (les mois où elles ont
posé le moins sont les plus fournis), c'est le suivi. D'où le compteur dans la maquette.

### Ce qui a été construit puis ABANDONNÉ

Une règle du générateur interdisant la garde la veille d'un jour non travaillé, avec trois soupapes
(couverture, unité VD, couplage férié) et un scénario de banc à contre-épreuve. **Elle marchait** :
39 repos perdus → 2, banc à 1 626 vérifications, 0 échec, aucune dégradation sur `avant_apres.js`.

**Elle a été abandonnée pour une raison mesurée** : un temps partiel avec un TP hebdomadaire se voit
interdire un quart des dimanches en plus des vendredis où il est déjà en TP. Un dimanche étant soudé
à son vendredi (unité VD), CATINEAU tombait à **3 unités VD pour une cible de 5,2** — deux week-ends
reportés sur les collègues. **Protéger son repos lui coûtait ses week-ends.** La solution d'Arthur
n'a pas ce coût. **Ne pas re-proposer cette règle.**

### Ce qui a été décidé pour l'écran — maquettes validées

**Une tuile, deux visages.** Pendant la campagne : « Mes indisponibilités », ouverte à tous. Une
fois `GARDES_{N+1}` généré : **« Mes jours de temps partiel »**, visible uniquement pour
*quotité < 100 % et pas de jours fixes déclarés*. Le mécanisme existe déjà (`campagne:true` et
`only` dans `TILES`, `dashboard.html`).

**Trois bandes**, selon ce qu'il RESTERAIT après la pose — chiffres 2026 :

| | il resterait | jours | part |
|---|---|---|---|
| 🟢 libre | 15 et plus | 196 | 75 % |
| 🟡 sous réserve | 13 ou 14 | 48 | 18 % |
| ⬛ fermé, non proposable | 12 ou moins | 17 | 6,5 % |

**Côté MAR** : calendrier coloré, le nombre de présents en petit dans chaque case, un compteur
« X posés · Y restants sur N », et un **récapitulatif à l'enregistrement** listant les jours sous
réserve. **Aucun mail, aucune notification** : le MAR va voir le comité lui-même.

**Côté comité** : une alerte pliée, une ligne par demande, Valider / Refuser, décision annulable.
**Le nombre de présents est recalculé à chaque clic** — si deux MAR demandent le même jour, valider
le premier fait aussitôt tomber l'affichage du second. Sans ça, on validerait deux jours en croyant
n'en valider qu'un. Un jour noir n'arrive jamais dans cette liste.

**Temps de chargement : rien de neuf à transporter.** La clé `gardes_{année}` de la copie rapide
contient déjà, pour chaque date, qui est G, G2, RG, R, TP. Le nombre de présents s'en déduit dans le
navigateur. La page demandera `indispos_{année}` **et** `gardes_{année}` dans le même appel — le
mécanisme accepte déjà plusieurs clés. *(Lecture du code ; poids non mesuré.)*

### Ce qui reste à faire — dans cet ordre

1. **Verrou serveur par type d'écriture.** Aujourd'hui `saveIndispos` n'interroge jamais
   `_indisposOuverte_` : rien n'empêche d'écrire hors campagne. Sans effet tant que la page est
   fermée 10 mois par an ; **bloquant dès qu'on l'ouvre toute l'année**. TP autorisé en permanence,
   indispo et souhait **refusés côté serveur** hors campagne.
2. **Renvoyer la quotité à la connexion.** `checkCode` lit déjà MEDECINS mais ne renvoie que
   l'identité, le rôle et l'appartenance au groupement libéral.
3. **Statut « TP en attente »** dans `INDISPOS_{Y}`, distinct du TP validé, et qui **ne compte pas
   comme une absence** — sinon la demande ferait elle-même baisser l'effectif et deux demandes le
   même jour se bloqueraient mutuellement.
4. **L'écran MAR**, puis **l'écran comité**, conformes aux maquettes.
5. **L'avertissement sur les échanges de gardes à distance** (non bloquant).

→ **Les points 1 à 4 sont RÉALISÉS le soir même** (lots 1 à 4, v1.65 → v1.67 — entrée du
22 août au soir, ci-dessus). Seul le point 5 reste ouvert.

### Points ouverts

- **Un jour validé peut se périmer** (échange de garde ultérieur). Position retenue : **c'est
  acquis, on ne revient pas dessus** — revenir sur un jour accordé serait pire que le problème.
  Non tranché formellement.
- **Une demande refusée disparaît** et ce MAR-là ne peut pas redemander ce jour ; il reste jaune
  pour les autres. *(Arthur penchait pour fermer le jour à tout le monde — à confirmer.)*
  → **Tranché le soir même : le refus ferme le jour pour toute l'équipe** (onglet `TP_FERMES`).
- **Les 82 jours sous le minimum en 2026** méritent un examen à part, indépendamment de ce chantier.

### Trouvaille annexe, sans rapport avec le TP

Le simulateur produit, sur 20 années réalistes, **9 défauts préexistants** : couplages férié/samedi
rompus (2028-04-15, 2031-12-25, 2027-10-30…) et unités VD brisées **dans la dernière semaine de
décembre** (2029, 2037, 2038, 2046). Ils existent avec ou sans toute modification testée ce jour.
Non traités, à instruire séparément.

---

## 19 août 2026 (soir) — v1.64 : la tuile CR quitte le mobile, et le document de panne rattrape neuf mois

Commit unique `433974c7f9`, cinq fichiers. Séance de lecture plus que d'écriture : l'essentiel du
temps est parti à vérifier des affirmations, dont plusieurs se sont révélées fausses — y compris
les miennes.

### La tuile « CR d'anesthésie » ne s'affiche plus sous 768 px

Constat d'Arthur : le générateur de comptes-rendus se remplit par dizaines de pastilles à cliquer et
se termine par un copier-coller vers le DPI. Personne ne rédige un CR depuis un téléphone ; la tuile
n'y faisait qu'allonger la liste du portail.

Mise en œuvre : un marqueur `pc:true` sur la tuile, et **une condition de plus dans le filtre qui
existait déjà** (`renderTiles`, qui gère `only`, `campagne` et `liberal`). Aucune mécanique nouvelle.
Seuil **768 px**, celui de `isMobile` dans `index.html` — deux seuils différents feraient dire deux
choses à « petit écran » selon la page.

**Limite connue et acceptée (Arthur, 19/08) :** le filtre mesure la largeur **au chargement**. Une
tablette pivotée du portrait au paysage ne fait pas réapparaître la tuile avant rechargement. Ne
concerne ni les téléphones (toujours sous le seuil, dans les deux sens) ni les PC. Recharger suffit.

**Scénario 29 du banc** (`banc_pages_mar.js`) : il **extrait du fichier livré** le tableau des tuiles
et la ligne de filtrage, puis les exécute à deux largeurs. Recopier le filtre dans le test aurait
prouvé le test, pas la page. Vérifie aussi qu'**aucune autre tuile** ne disparaît — une condition mal
placée masquerait le planning sur mobile, panne invisible à qui développe sur grand écran.
Contre-épreuves : filtre retiré → 3 échecs · seuil porté à 1024 → 2 · `pc` posé par erreur sur
« Mes congés » → 2.

### `robots.txt` affirmait le contraire de la vérité

Le fichier annonçait depuis sa création que « les données nominatives sont hors du dépôt public ».
**C'est faux :** `cr-anesthesie/data.js` porte les 23 noms du service, et le générateur de CR est une
page **100 % statique, sans code d'accès** — vérifié : zéro occurrence de session, d'authentification
ou d'appel serveur dans ses sept fichiers. Qui connaît l'adresse entre.

Décision d'Arthur : **laisser les noms, corriger le fichier qui ment.** Ce sont des praticiens
hospitaliers, publics par ailleurs ; il n'y a ni donnée patient, ni montant, ni code. Le `robots.txt`
dit désormais ce qui est.

> **Erreur de méthode, à consigner.** J'ai présenté ce constat à Arthur comme une découverte. Il
> était **déjà écrit dans cette ROADMAP le 17/08**, section « Constaté et non traité : des noms dans
> un dépôt public ». Je ne l'avais pas lue. La règle du projet dit de lire avant d'affirmer ; elle
> vaut aussi pour les documents du projet, et pas seulement pour le code.

### `docs/si-ca-tombe.html` — quatre mises à jour, dont un chiffre faux

Le document de continuité était juste sur l'ossature (les quatre gestes, l'onglet renommé, le mode
dégradé, les cinq gestes interdits, le calendrier des périodes sensibles) et en retard sur le reste :

1. **Symptôme absent : « j'ai validé, rien ne bouge ».** Depuis le journal d'intentions (05/08), une
   validation peut mettre jusqu'à une minute à s'afficher. Ajouté au tableau, avec un encadré rouge
   **ne jamais revalider** — deux validations, c'est deux fois le même changement dans la file.
2. **Un chiffre faux.** Le document annonçait « deux sauvegardes du classeur, lundi 4 h et une le
   dimanche ». Relevé dans le code : lundi 4 h = copie du classeur ; **dimanche 5 h = copie sur un
   second compte**, la seule qui survivrait à la perte du compte du planning ; **dimanche 3 h = copie
   du programme**, que le document ignorait entièrement. Trois lignes de tableau, avec ce que chacune
   protège.
3. **Deux tâches automatiques annoncées, neuf réellement programmées** (relevé par `newTrigger` dans
   les `.gs`).
4. **« Ce qui s'arrête » ignorait les échanges de gardes et le module libéral**, tous deux entrés en
   service depuis l'écriture du document. Ajoutés, avec le cas des propositions d'échange en attente
   qui expirent d'elles-mêmes pendant une panne.

### Deux constats de lecture, non traités

- **Le numéro de version affiché peut mentir d'une version.** Les pages chargent `version.js` sans
  anti-cache, et `sw.js` met en cache tout ce qui finit par `.js` : le fichier est servi depuis le
  téléphone puis rafraîchi en arrière-plan. Le HTML, lui, n'est jamais mis en cache. Conséquence :
  après une publication, la page est neuve et le badge affiche encore l'ancien numéro, pendant un
  chargement. C'est précisément au moment où l'on s'appuie dessus pour diagnostiquer qu'il trompe.
  Correctif tenant en une ligne (paramètre changeant, ou exclusion de ce seul fichier du cache) —
  **non fait, gel du code avant le 4.**
- **Le repli n'a aucun garde-fou de charge.** Vérifié : pas une temporisation aléatoire dans
  `index.html` ni `dashboard.html`. Si la copie rapide tombe, les 23 téléphones basculent sur Apps
  Script **en même temps**, sur un seul compte Google — et une notification push, par construction,
  synchronise tout le monde dans la même minute. La copie rapide, elle, traite les clés en parallèle
  et ne connaît pas de file. **Décision d'Arthur : ne rien faire, on fait confiance à Cloudflare.**
  Le risque n'existe que le jour d'une panne du relais. Signe distinctif ce jour-là : plusieurs
  personnes bloquées **dans la même minute** — attendre, ne pas chercher un défaut de code.

### Remontée des bugs après l'ouverture : capture d'écran, et rien de plus pour l'instant

Discussion sur l'après-4-septembre. Constat de lecture : **aucune capture d'erreur navigateur** dans
le dépôt (pas un `window.onerror`, pas un `unhandledrejection`) — un plantage sur le téléphone d'un
MAR ne laisse aucune trace. Aucun bouton de signalement non plus. Ce qui existe déjà : le journal
consigne chaque écriture du comité avec son résultat, échecs compris, dans un registre de 90 jours
que le Diagnostic signale.

Propositions faites (capteur d'erreurs, bandeau de signalement n'existant que pendant une panne,
entrée sur la page d'accueil pour les erreurs silencieuses) — **toutes écartées pour l'instant.**
Arthur commence par demander aux MARs un message avec capture d'écran. Choix délibérément empirique :
deux ou trois semaines de remontées réelles diront quels défauts arrivent vraiment et sous quelle
forme, là où toute conception a priori resterait une supposition. À reprendre ensuite, sur du réel.

---

## 19 août 2026 — v1.59 → v1.61 : le grand diagnostic du dépôt, et l'affaire PRUNET à deux étages

**Le matin a commencé par un diagnostic complet du dépôt** (code mort, optimisation) et s'est
terminé en incident de production instructif. Quatre commits : `c630ce2c85` (nettoyage, v1.59),
`ba8448b0e6` (`Indispos.gs` 2026-08-18.1), `b2bebfaf4e` (2026-08-19.1), `4e0a211fa4` (v1.60).

### Le nettoyage (v1.59 + `Indispos.gs` 2026-08-18.1)

~500 lignes sans appelant retirées de 5 pages : l'ancien onglet « calendrier des gardes », le
widget overrides, les reliquats de l'écran Paramètres, `_reveilAPI` ×5, le panneau « Ma priorité »
fantôme d'indispos, `updateFlashBadge`, le CSS orphelin. **Trois retraits avaient un effet réel** :
un appel `getOverrides` gaspillé après **chaque** geste planning ; le bootstrap d'admin qui lisait
PLANNING_OVERRIDES à chaque ouverture pour un widget disparu (retiré côté GAS) ; une écriture
orange parasite sur la pastille « Système » (couleur seule, texte « OK » à côté — un voyant qui
aurait menti). **Conservés après lecture du contexte** : `pushFileToGitHub` (son commentaire
affirme qu'il sert encore — zéro appelant trouvé, à éclaircir), `veilleVerifierNoms`,
`diagDriveJson`, `testNotifierConflits`, et tous les outils manuels d'éditeur.

**`banc_ptr.js` ressuscité** : écrit le 05/08, il lisait `../live_index.html` et
`../live_dashboard.html` — des instantanés de mise au point jamais entrés au dépôt. Il ne pouvait
donc PAS tourner et n'avait jamais rejoint `lancer.sh` : 28 vérifications qui rassuraient sans
exister. Rebranché sur les vraies pages, ajouté au lanceur, et **banc_docs §13** rend l'oubli
impossible (tout `banc*/e2e/interface .js|.mjs` doit figurer dans `lancer.sh`, contre-preuve incluse).

**Piège d'outillage consigné** : l'extracteur de fonctions par comptage d'accolades s'est fait
avoir par un paramètre par défaut `options={}` (`fetchTimeout`) — coupe au milieu de la signature.
Chercher la fin de la liste de paramètres avant la première accolade du corps.

### L'enquête « pastille À publier orange à l'arrivée »

Arthur voyait régulièrement « À publier » orange en rouvrant admin, en étant certain d'avoir
publié. Traces relevées (LOGS, 500 lignes, 28/07→18/08) : **zéro fiche en échec au journal sur
trois semaines** ; les « trous » entre passages ne prouvent rien (le journal ne trace pas les
passages à vide). Conclusion la plus probable pour les cas historiques de plusieurs heures : **la
course corrigée le 16/08** (copies publiées construites sur un état non rafraîchi du classeur).
À retenir : **« Publier » = publication GARANTIE, pas FAITE** (2-3 min de chaîne) ; le brouillon
local n'est purgé que sur preuve ; le registre `jfait_` garde 90 jours fiche par fiche. Si un
orange de plusieurs heures réapparaît après le 16/08 : noter jour + case, tracer au registre.

### L'affaire PRUNET — un défaut à deux étages, masqué par un journal qui comptait mal

PRUNET (volant, chef de service) s'affichait « VOL » dans la grille Affectations mais n'avait
**aucune ligne** dans `AFFECTATIONS_2026` (onglet antérieur à sa fiche ; 2027, créé par le wizard,
l'a bien). Le ⚠️ du Diagnostic disait vrai, l'écran comblait par défaut (`|| 'VOLANT'`, admin
l.5919). En voulant réparer par l'écran, Arthur a mis au jour :

1. **Étage serveur** : `saveAffectations` **sautait en silence** tout MAR sans ligne
   (`if (!rowNum) return;`) et le journal comptait les données *reçues*, pas les lignes *écrites*
   (« 25 MAR(s) mis à jour » à 09:30 pour 24 écrites — un compte qui ment dans les traces fait
   chercher au mauvais endroit). Corrigé (`2026-08-19.1`) : logique extraite en
   **`ecrireAffectations()`** (éprouvable), ligne manquante **créée** comme le fait déjà
   `saveAffectationsMar`, log honnête « N mis à jour, M ligne(s) créée(s) ». Banc **T-AFF**
   (7 vérifs, contre-preuve rouge/vert).
2. **Étage page** (découvert une heure après, en production : « 24 mis à jour » pour 26 affichés) :
   la grille AFFICHE tous les actifs mais **n'envoyait que les lignes lues** dans l'onglet.
   Corrigé (v1.60) : **`completerAffectationsActifs()`** complète l'envoi avec chaque actif affiché
   (vide = VOLANT×12 côté serveur) — **garde-fou : une grille vide (chargement raté) ne complète
   RIEN**, sinon Enregistrer aurait écrasé tous les secteurs réels par VOLANT. Banc **T-AFF-2** :
   chaîne complète page→serveur + **vérification de câblage** avec contre-preuve — la leçon
   maîtresse du jour : *un code juste mais jamais appelé doit rendre le banc rouge.*

**Résultat vérifié** : 10:59:42 « saveAffectations — 24 MAR(s) mis à jour, 2 ligne(s) créée(s) » ;
`AFFECTATIONS_2026` à 26 lignes, PRUNET et ARMAND en VOLANT×12 ; Diagnostic de 11:12 :
« MARs actifs sans affectation : **aucun** » (8 points de vigilance). ARMAND (arrivée 01/11)
recevra ses vrais secteurs par un clic ordinaire.

### L'après-midi — l'envoi différentiel (v1.62 → v1.63)

En réalignant la séquence d'avant-démo, Arthur a rouvert le fond : « c'est quand même peu probable
qu'un autre membre saisisse EN MÊME TEMPS — ils n'ont qu'à se parler ». Exact, et c'est ce qui a
révélé que le vrai danger n'a jamais été la simultanéité : **c'est que l'Enregistrer envoyait TOUTE
la grille** — depuis une base restée ouverte (le cache de session fait ça très bien), on réécrivait
aussi le travail des autres. La complétion du matin (vie brève : ~5 h) aggravait ce trait pour
soigner PRUNET.

**Décision d'Arthur : n'envoyer que les MARs touchés en session.** `_affTouches` (Set) marqué à
chaque `applySecteurAff`, purgé aux lectures fraîches et après un enregistrement réussi ;
`construireEnvoiAffectations()` remplace la complétion ; zéro touche = refus poli « Aucune
modification à enregistrer » (la grille vide d'un chargement raté devient inoffensive par
construction). Un MAR sans ligne touché est créé par le serveur (mois absents = VOLANT). Banc
**T-AFF-2 réécrit** : la protection s'éprouve **à l'octet** (la ligne d'un MAR jamais touché
ressort du classeur strictement identique). Contre-preuve instructive : ma première vérification
de câblage contrôlait que le différentiel était *calculé*, pas qu'il était *celui qui part* —
resserrée (« affectations: envoi » exigé, « affectations: affData » interdit). **Le volet lourd
(lecture miroir + journal + diagnostic déposé) est REFUSÉ avant le 4** : ordre Worker→GAS→synchro
et zéro usage réel avant la répétition — conçu ci-dessous (🔜 n°3), exécuté en septembre.

### Le brouillard réseau — à connaître pour ne plus perdre une heure

Toute la matinée, le téléphone d'Arthur affichait « Délai dépassé (90 s) » pendant que **chaque
requête arrivait, s'exécutait et se terminait OK côté serveur** (trois `diagComplet — OK` à
10:01/10:02/10:03 pour trois « échecs » à l'écran). Les réponses se perdaient au retour
(`script.googleusercontent.com` ↔ Safari : réseau du moment, Relais privé, filtrage).
**Doctrine : devant un « Délai dépassé », LOGS fait foi, pas l'écran.** L'onglet Affectations est
la seule surface branchée sur Google en direct (éditeur de brouillon : lire la source avant
d'écrire) — c'est lui qui sonne quand ce chemin casse, pendant que tout le reste vit du miroir.

## 18 août 2026 — v1.58 : la recette à la main trouve ce que le banc ne pouvait pas voir

Journée en trois temps : relecture d'un lot de nettoyage préparé hors projet, remise au réel du
cahier de tests, puis première passe de recette — qui a sorti un vrai défaut de vitesse.

### Le cahier de tests remis au réel (179 → 193 points)

Il datait du 5 août et ignorait six semaines de travail : **aucun point de contrôle sur les échanges
de gardes**, c'est-à-dire sur la fonctionnalité qui justifie le passage en v2.0. Ajouté un parcours
**P16** (14 points) : dons et échanges — acceptation, refus qui n'écrit rien, dates éloignées,
**dates qui se suivent dans les deux sens**, don d'un samedi avec sa récupération, le cas où elle ne
peut pas suivre, don à un indisponible, double appui sur « Accepter », expiration à 48 h —, puis les
notifications (carte visible sur téléphone, **absente sur PC** depuis le 17/08), la mémoire de
session de 30 jours et son geste « m'oublier », et le refus de la carte de clôture.

Deux avertissements posés là où le cahier était devenu faux : les points W3 sont **injouables**
depuis le verrou de date du 17/08 (à cocher « Non fait », ce n'est pas une anomalie), et la section
libérale décrit un écran refondu les 17-18 août.

### Le défaut : 75 secondes pour une année que la copie rapide rend en 164 ms

Mesuré au chronomètre pendant la recette. Après une publication, la bascule sur 2027 partait sur
Apps Script : **deux délais de 20 s dépassés**, puis 12 et 17 s. Deux causes distinctes.

**1. La garde des 90 s ne regardait pas l'année.** Elle interdit de lire la copie rapide pendant
90 s après une écriture — un éditeur ne doit jamais voir du périmé. Mais elle ne portait qu'un
horodatage : publication à T+49 s, bascule sur 2027 à T+118 s, soit 69 s, donc fermée — alors que
l'écriture portait sur **une autre année**. La garde lit désormais `_tsEcritureAnnee`, prise sur le
geste lui-même (`payload.year`, `modification.year`, ou `intention.year` pour les quatre intentions
du journal). **Le doute reste protecteur** : année écrite inconnue ou année demandée inconnue → tout
reste fermé, exactement comme avant. On ne gagne de la vitesse que là où on peut le prouver.

**2. Une fois tombé sur Apps Script, on n'en revenait pas.** `loadPlanningData()` était le **seul**
chemin sans tentative miroir. Le bouton « Réessayer », un retour sur l'onglet Planning, tout
rechargement de l'année repartaient sur le circuit lent — même une demi-heure plus tard, garde
retombée depuis longtemps. Seul un aller-retour dans le sélecteur d'années rebranchait la copie
rapide : geste indevinable. Ce chemin tente désormais `planning_{Y}` + `affectations_{Y}` en tête,
sous la même règle de fraîcheur, et tout écart (pas de code, Worker muet, clé absente) retombe sur
le circuit d'origine, inchangé.

Volontairement **non touchés** : les quatre autres lecteurs de la garde (statuts, équité, gardes du
panneau, vacances) restent sur l'horodatage global, donc plus stricts que nécessaire. Une chose à la
fois, confirmée en production avant la suivante.

**Banc 1 386 → 1 404**, scénarios 64 et 65 de `banc_page.js`, écrits avant le correctif. Contre-preuve
mesurée : sans le patch, `miroir: 0 · apps script: 2` ; avec, `miroir: 1 · apps script: 0`.

### La leçon, à ne pas perdre

**Le banc était vert à 1 386 vérifications pendant que la page mettait 75 secondes.** Ce qui a cassé
n'était pas une règle fausse : c'était un Apps Script froid et une garde trop large — de
l'infrastructure et un réglage, deux choses qu'aucune simulation ne voit. C'est la recette à la main
qui l'a trouvé, et ce sont les scénarios 64 et 65 qui l'empêchent de revenir.

### Le lot de nettoyage préparé hors projet : bon fond, périmètre incomplet

Relu contre le dépôt. Le code visé est bien mort — vérifié : `#overridesBody` n'existe plus qu'à
l'intérieur de la fonction qui le cherche. Mais trois défauts d'exhaustivité, tous du même type :
`_reveilAPI` existe dans **cinq pages** (`admin`, `absences`, `dashboard`, `index`, `indispos`) et
n'est appelée nulle part — le lot n'en retirait qu'une ; `miroir.gs` l.82 (`deleteOverride:
['config_admin']`) et `banc/monde.js` l.25 n'étaient pas inventoriés ; et un commentaire affirmait
« onglet supprimé du classeur » sans vérification, dans un dépôt public et définitif.

**⚠️ Confusion de noms à ne plus refaire :** les « dix-huit endroits » notés le 10 août désignaient
`PLANNING_OVERRIDES`, **bien vivant** (il porte les placements du comité). Seul l'ancien `OVERRIDES`,
dont l'onglet n'existe plus, est du code mort. La roadmap de pilotage a été corrigée en ce sens.

### Ce qui reste ouvert de la séance

- **P16 non fait** : exige un second téléphone avec un autre code MAR.
- **T041** (conflits de vacances) : la description du cahier parle d'un « écran » qui n'existe pas —
  `getConflitsAll` n'est appelé qu'à l'étape 1 de l'assistant de génération, où il **bloque** la
  génération. À reformuler au prochain passage.
- **T065-T066** (assistant départ) : à faire avant le 1<sup>er</sup> septembre, un départ réel tombe ce jour-là.
- **Documents** : une copie semblait revenue après `miroirSyncComplet`. Impossible — cette fonction
  pousse 20 familles et **aucune n'est les documents** ; seul `miroirDocuments` les copie, à raison
  d'**un par heure**. À reprendre avec le détail du geste fait.
- **À reconfirmer en production** : placer, publier, basculer sur 2027 dans la minute — `chronoAPI()`
  doit montrer `miroir:planning_2027`, pas `getPlanningJson`.

---

## 17 août 2026 (fin de soirée) — v1.52 à v1.57 : la fabrique, les 50 %, et plus rien à lire chez Google

Suite du fil libéral. Six push de plus, banc de **1 260 → 1 341** vérifications, dont **181 sur ce
seul module** (13 le matin même).

### Un seul écran de cotation (v1.52)

Décision d'Arthur : **tout patient vu en consultation libérale passe ensuite au bloc.** Le sélecteur
d'axe « Bloc CCAM / Consult NGAP » n'avait donc jamais lieu d'être choisi — et deux endroits
parlaient de consultation sans que rien ne dise en quoi ils différaient.

⚠️ **La comptabilité, elle, ne bouge pas** : les actes comptent en CCAM au mois du bloc, la
consultation associée en NGAP au mois où le patient a été vu. Quatre vérifications le protègent.

### Une page pour fabriquer les cotations types (v1.53)

L'onglet se remplissait à la main : huit colonnes, le bon code CCAM de mémoire, `associe` sans
accent. Une erreur ne se voyait qu'au moment où quelqu'un cliquait sur le bouton, en consultation.
Les cotations types sont **le principal levier de rapidité du module** (Arthur : « il faudra en
faire à gogo, c'est ça qui va faciliter les choses »).

- le montant se calcule **pendant** la construction, séparé en actes/bloc et consultation, pour se
  comparer à un vrai relevé
- un acte **sans tarif d'anesthésie est refusé à la source** — piège de l'activité 1, qui gonflerait
  la BR d'environ 300 € sur un relevé de gastro-colo. ⚠️ Le serveur ne peut pas le voir : le
  référentiel vit dans le dépôt, pas dans le classeur. Il ne contrôle que la forme du code.
- créer et modifier : **ouverts à tous les membres**. Supprimer : **réservé**, via la clé CONFIG
  `LIBERAL_ADMIN` — jamais un identifiant en dur, le dépôt est public. Clé absente ⇒ personne ne
  supprime : un droit qui s'ouvrirait par oubli de configuration serait le mauvais défaut.
- écriture = retrait puis réécriture **sous verrou** : sans lui, deux enregistrements simultanés
  fabriqueraient une cotation composite inattribuable.

### La règle des 50 % (v1.54)

Apportée par Arthur, **absente de l'outil** : quand le chirurgien cote lui aussi en libéral, le
dépassement de l'anesthésiste est calé par **usage** à 50 % du sien. Il n'est libre — et « reste à
charge nul » n'a de sens — que si l'anesthésiste cote seul.

L'outil proposait *toujours* le montant optimal : dans le cas le plus fréquent, un montant qu'on n'a
pas le droit d'appliquer. Précisions appliquées telles quelles : 50 % du **dépassement seul**, usage
et non règle (valeur proposée, champ modifiable), et **montant du chirurgien inconnu ⇒ la page ne
bloque pas**. S'il reste du reste à charge, il s'affiche en euros : le patient le découvrirait sinon
en payant.

### Le devis rouvrable, et l'échec qui cesse de ressembler à un vide (v1.55)

Cas réel : trois patients passés, le premier n'a pas signé. La cotation d'un patient **déclaré** est
gardée en mémoire vive ; sa ligne porte une icône qui rouvre son devis. **Rien n'est écrit nulle
part** — recharger efface. Aller au-delà imposerait de stocker actes et carte : la ligne qu'on ne
franchit pas.

Et le défaut de fond, présent sur deux écrans : « pas de réponse = rien à montrer ». La liste des
déclarations se masquait entièrement, la barre des cotations types disparaissait sans un mot —
Arthur a cru des déclarations perdues alors qu'elles étaient dans le classeur ET chez le comité.

### Plus aucune lecture chez Google (v1.56)

Erreurs « réseau » aléatoires en production. Intuition d'Arthur : *« ce n'est pas mirrorable ? »* —
juste pour tout ce qui se **lit**, impossible pour ce qui s'**écrit**.

- clé `liberal_mar_{Y}` : « Mes interventions déclarées », **filtrée côté relais**. Séparée de
  `liberal_{Y}`, qui reste celle du comité (allégée : ni montant ni spécialité).
  Arthur : *« pas grave de voir ceux des autres, on est un groupe »* — le filtre reste, mais pour que
  la liste soit **utilisable** (la corbeille désignerait sinon la ligne d'un autre), pas pour fermer
  une porte. La suppression est de toute façon protégée serveur : recherche sur ID **et**
  propriétaire.
- le droit de gérer les cotations types voyage avec l'**identité**
- **jeton unique** sur la déclaration : le réseau peut perdre la *réponse* d'une écriture réussie ;
  on croit l'échec, on recommence, la déclaration part deux fois — indétectable. Le jeton rend le
  réessai sûr. Les écritures ne se réessaient **que** si elles en portent un : l'ancienne page, en
  fenêtre de déploiement, ne fabriquera pas de doublon.
- « réseau » → **délai dépassé / connexion perdue / réponse illisible**
- **AME retirée** (Arthur : « on ne fait pas de libéral pour l'AME »). Deux entrées coexistaient, à
  1,95 (monégasque) et 1,00 (français) : deux calculs opposés, rien à l'écran ne disait lequel
  choisir. La C2S est laissée **intacte**, libellé compris.

⚠️ **Le banc a rattrapé un vrai piège** : `liberal_mar_` n'était pas déclarée dans
`MIROIR_CLES_PAR_ANNEE`. La clé aurait **survécu au ménage du 4 septembre** — exactement ce qui
était arrivé à `equite_live_`.

### Une régression du même jour, corrigée le même jour (v1.57)

La ligne déclarée n'apparaissait pas ; recharger pour la voir faisait **perdre le devis du patient**.

**Cause, et c'est ma régression** : la copie de lecture n'est pas rafraîchie au moment de
l'écriture — un déclencheur s'en charge 1 à 2 minutes plus tard. `miroir.gs` le disait déjà noir sur
blanc : *« l'écran qui vient d'écrire relit de toute façon le circuit DIRECT »*. En faisant lire la
copie **en premier**, j'ai cassé cette hypothèse sans la voir — et le banc ne pouvait pas
l'attraper, sa doublure Apps Script ne retenait pas ce qu'on lui déclarait.

Correctif : la ligne **s'affiche immédiatement** (le serveur vient de confirmer et rend
l'identifiant, la page a déjà tout), et après une écriture la relecture passe par le **classeur**.
Copie rapide à l'ouverture, où elle évite les pannes ; classeur après écriture, où la fraîcheur est
le seul critère.

Décision d'Arthur : les **autres** membres gardent le décalage de 1–2 min sur les cotations types,
*« c'est pas grave »*.

### Questions de facturation — les seules qui engagent vis-à-vis d'un patient

**Tranchées le 17/08 :**
- **Coefficient de l'APC** : aucun. C'est une cotation réservée aux assurés sociaux français. L'outil
  appliquait déjà 60 € sans coefficient.
- **AME en libéral** : on n'en fait pas. Statut retiré.

**Ouvertes, à trancher au retour du 31/08 :**
1. **Carte rose au bloc : 241 % ou 234 % ?** La page officielle des Caisses Sociales publie deux
   règles distinctes pour la rose — NGAP majorée de 20 % au maximum, **CCAM à 241 %**. L'outil
   applique 1,95 puis plafonne le DH à +20 %, soit 234 % : il **sous-facture** d'environ 4 € par
   patient (l'écart vaut 7 points du **tarif français**, pas de la BR — le chiffre de « 13 € » qui
   figurait dans la conception était calculé sur la mauvaise base). Indice : chez les sages-femmes
   la rose vaut exactement la verte +20 % (154 → 185), alors que 195 × 1,20 = 234 ≠ 241. Le chiffre
   semble voulu. **Rien n'a été modifié** : sous-facturer se rattrape, surfacturer sur un devis signé
   non. Arthur doute (« j'avais l'impression que c'était 20 % point barre ») — à confirmer auprès de
   la facturation.
2. **Modificateur A** : +23 € dans le code, +44,85 € pour un Monégasque selon l'aide de la page.
3. **C2S** : distincte de l'AME ? applicable en libéral ?
4. **Paiement de la consultation** : elle n'apparaît ni sur le devis ni dans le reste à charge, alors
   qu'elle porte souvent un dépassement. Modèle arrêté avec Arthur — **note d'honoraires acquittée**
   pour la consultation (numéro sur date+heure, champ mode de paiement, pas de note sans
   dépassement) et devis pour le bloc. En attente du circuit de paiement réel.

### Reste à faire sur le module

1. **Les guides** — décision d'Arthur : *après* stabilisation, « pour ne pas les modifier 10 fois ».
2. **Le taux de couverture** (BR déclarées ÷ euros du relevé). N'a de sens qu'avec des déclarations
   réelles à comparer.
3. **Remplir la bibliothèque de cotations types** — Arthur, à son retour, relevés réels sous les yeux.
4. **RPPS et prénoms** des 18 autres dans MEDECINS.

### ⚠️ Constaté et non traité : des noms dans un dépôt public

Le nom d'Arthur apparaît en clair dans **dix fichiers** (commentaires, exemples, données du
simulateur). Le dépôt est public et son historique définitif ; la règle du projet est explicite.
Chantier à part, non ouvert ici.

> **Suite le 19/08/2026 (soir).** Le constat était plus large que « dix fichiers » :
> `cr-anesthesie/data.js` porte **la liste nominative des 23 praticiens**. Arthur a tranché : on
> **laisse** les noms — praticiens hospitaliers, publics par ailleurs, et il n'y a ni donnée patient,
> ni montant, ni code — et on corrige le `robots.txt`, qui affirmait l'inverse. Le chantier « sortir
> les noms du dépôt » est donc **fermé, par décision**, et non plus en attente.

---

## 17 août 2026 (soir) — v1.47 à v1.51 : le module libéral optimisé pour la consultation

**Fil dédié au module libéral.** Objectif fixé par Arthur : *déclarer vite pendant la consultation,
sans faire attendre le patient*. Présentation au groupement visée en septembre/octobre, ouverture
aux 19 dans la foulée. Six push, banc de **1 156 → 1 255** vérifications, dont **13 → 95** sur ce
seul module.

### Le défaut fondateur : le mois du relevé était une date

`getOrCreateLiberalCaTab` écrit la chaîne `'2026-07'` ; **Sheets la reconnaît comme une date** et
stocke une vraie date. Vérifié : les **228 cellules** de la colonne MOIS de `LIBERAL_CA_2026` sont
des dates. `getReleveLiberal` renvoyait donc `'Wed Jul 01 2026 00:00:00 GMT+0200'`.

Deux conséquences, vues à l'écran :
1. `suivi-liberal.html` affichait « cumul janvier → **undefined Wed** » ;
2. le « dernier mois », choisi par `items.map(i => i.mois).sort().pop()`, comparait des **noms de
   jours anglais**. Simulation sur les douze mois de 2026 : le tri retenait `Wed Jul` **jusqu'en
   décembre**. Août (Sat), septembre (Tue), octobre (Thu), novembre (Sun) perdaient tous contre Wed.
   Arthur aurait recopié le relevé d'octobre et la page aurait continué d'afficher juillet, **en
   silence**.

Le même défaut atteignait `Indispos.gs` : le classement des remplaçants d'`absences.html` se serait
appuyé sur un relevé périmé.

**Correctif** : `_libMoisISO_()` normalise à la lecture (Date **ou** texte → `AAAA-MM`). Le classeur
n'est pas touché, les mois déjà saisis sont rattrapés. Canard-typage volontaire (`typeof
v.getFullYear === 'function'`) et non `instanceof Date` : au banc, la date vient d'un autre contexte
d'exécution et `instanceof` y serait faux.

⚠️ **La doublure Sheets du banc mentait.** Elle coerçait `'2026-07-01'` en date mais pas `'2026-07'` :
1 156 vérifications n'ont donc rien vu. Corrigée dans `banc/stubs.js` — **c'est elle, autant que le
code, qui rendait le défaut invisible**.

### Un chiffre inventé, affiché à tous

La page de cotation portait deux cases « Socle CCAM / Socle NGAP » **écrites en dur** (50 000 € à
25 %, 15 000 € à 25 %) qui alimentaient deux cadrans « % projeté » et « marge ». Personne ne les
renseignait : la page annonçait donc à chacun une marge qui n'était pas la sienne. Sur dix-neuf
personnes dont plusieurs au-dessus de 30 %, c'est le « chiffre plausible et faux » contre lequel le
document de conception met en garde. **Cadrans et socles retirés** — la position réelle vit sur
`suivi-liberal.html`, alimentée par le relevé certifié.

### La panne intermittente : quatre appels lancés ensemble

Constaté à l'écran : « Secteur (portail injoignable) », barre des cotations d'endoscopie absente,
**pendant que l'identité s'affichait normalement**. La page lançait quatre appels Apps Script
simultanés au démarrage ; les exécutions d'un même utilisateur étant mises en file, les dernières
tombaient.

**Correctif** : deux clés de plus au relais (`specialites`, `cotations_type`, même niveau d'accès que
`secteurs`), et **un seul aller-retour** qui rend l'identité *et* les trois listes. Repli Apps Script
**en série** — c'est le parallélisme qui faisait tomber.

### Un patient à la fois (décision d'Arthur)

Le devis se remettant en direct au patient, empiler des cotations n'avait plus d'objet depuis le
retrait des cadrans. « Ajouter le parcours » supprimé ; *Devis* et *Déclarer* portent sur la cotation
affichée ; l'écran se vide après déclaration **mais le secteur reste**. La déclaration perd ses
doublons de saisie (dates, montants) : elle les lit dans la cotation — deux endroits pour la même
donnée, c'étaient deux valeurs possibles. Barre d'action **fixe en bas d'écran** : sur téléphone, les
deux gestes qui comptent restent sous le pouce. D'une douzaine d'interactions à quatre ou cinq.

Maquette cliquable soumise à Arthur **avant** d'écrire le code, et validée.

### Ce qui s'enregistre doit rester exploitable

- **Spécialité obligatoire.** Une ligne sans spécialité compte dans le volume mais sort du rendement,
  et rien ne le signale six mois plus tard.
- **`ORL` retiré de la table secteur → spécialité.** Le secteur s'appelle « ORL / Ophtalmologie » :
  le pré-remplissage étiquetait **toute cataracte en ORL**, exactement ce que la séparation OPH/ORL
  devait empêcher, la cataracte étant le moteur du rendement. La page refuse désormais de deviner et
  le dit en rouge.

### Vitesse

`ccam_actes.json` réduit aux **4 726 actes tarifés** en anesthésie (8 558 avant ; 162 → 94 Ko sur le
réseau) et **mis en cache navigateur** : il était demandé avec `cache:'no-store'`, donc retéléchargé
et réanalysé **à chaque patient**, en consultation, sur le réseau du téléphone. Étiquette `?v=84`, à
incrémenter avec la version CCAM.

### LISTE ROUGE RÉVISÉE — décision d'Arthur

Le relevé financier du groupement était explicitement exclu du relais. **Il y est désormais admis**
(`releve_liberal_{Y}`), réservé aux membres du groupement (`role = mar` **et** `liberal`), soit
exactement la règle de `getReleveLiberal`. Ni le comité, ni le secrétariat, ni un MAR hors
groupement. PARAMETRES, Gmail et les journaux restent dehors.

Motif : `suivi-liberal.html` était la dernière page à ne parler qu'à Apps Script. Question posée par
Arthur, et réponse honnête : *c'est la même porte* — même code d'accès, même règle. Deux nuances
notées : la donnée existe désormais à deux endroits (deux endroits à purger), et **ni l'un ni l'autre
des deux points d'entrée ne limite les tentatives répétées**. Le code d'accès porte donc un peu plus
de poids. À regarder, pas aujourd'hui.

La révision est écrite, datée et motivée **dans `worker.js` et dans `miroir.gs`**.

⚠️ Deux pièges traités : la clé est datée sur l'**année civile** (le relevé est calendaire, l'année
active bascule en automne) ; et `LIBERAL_CA_2026` commençant par `LIBERAL_`, l'entrée `LIBERAL_CA`
doit rester **après** `LIBERAL` dans `MIROIR_ONGLETS_SUIVIS` — la boucle garde la dernière
correspondance, sinon saisir le relevé rafraîchirait le volet du comité.

### Un défaut de fond, présent partout : l'échec affiché comme un vide

Trois écrans traduisaient « le serveur n'a pas répondu » par « il n'y a rien » : « Aucun relevé saisi
pour le moment », la liste des déclarations qui se masque, la barre des cotations types qui
s'évanouit. Corrigé sur le relevé (message explicite + bouton **Réessayer**) ; **reste à faire sur les
deux autres**.

### La session, et l'écran de code qui clignotait

`partage/session.js` (livré le même jour par l'autre fil) décide où vit le code d'accès — 30 jours
glissants dans l'app installée. **Quatre pages ne l'avaient pas adopté** : `suivi-liberal.html`,
l'estimateur, `absences.html`, `crh.html`. Elles interrogeaient le stockage de l'onglet en direct, en
infraction avec la règle écrite dans ce fichier même. Constaté en réel : le portail se souvenait,
la page du suivi redemandait.

Puis, une fois la session réglée : la page affichait quand même l'écran d'authentification **quelques
secondes**, le temps de valider auprès d'Apps Script, avant de disparaître toute seule. Deux
correctifs : la copie rapide **authentifie et sert dans le même appel** (plus aucun `login` quand elle
répond), et **affichage optimiste** — on masque l'écran de code tout de suite, on valide derrière, on
le remontre s'il est refusé. Même principe que `crh.html` depuis longtemps.

### Banc

`banc/banc_liberal.js` — fichier neuf, **95 vérifications**. L'écran de cotation, jusque-là **le seul
du site sans aucun contrôle**, est désormais **piloté au clic** dans un vrai DOM servi par le vrai
Worker : contexte → cotation type → jour du bloc → déclarer. On vérifie que la déclaration part avec
les bonnes dates et montants, que **ni code d'acte ni identifiant de MAR** ne l'accompagnent, que
l'écran se vide, que le secteur reste — et, côté porte, qu'un MAR hors groupement et le comité
n'obtiennent pas le relevé.

**Contre-preuves systématiques** : ancien code du mois → 9 échecs · clés du relais retirées → 5 ·
cache CCAM retiré → 1 · porte du relevé ouverte à tous → 2 · `crh.html` remis en l'état → 2.

### Constaté en passant, non corrigé

- Le test `docs/module-liberal/tests/anti_persistance_devis.test.js` — la **preuve rejouable** pour un
  contrôle CCIN — **est cassé** (2 échecs) et n'est pas dans `lancer.sh` : personne ne le voit tomber.
- `LIBERAL_2026` est **vide** : aucune déclaration réelle à ce jour. Le 2A n'a jamais tourné en
  conditions réelles.
- Les guides du libéral sont à revoir (décision d'Arthur : **après** l'optimisation).
- La conception §10 affirme encore « index CCAM v83, tarifs v80 » : c'est v84 depuis le 27/07.

### Reste à faire sur ce module

1. Rouvrir le devis d'un patient **déjà déclaré dans la même consultation** (cas réel : oubli de
   signature). Faisable **sans rien stocker** — mémoire vive de la page, perdue au rechargement.
   Au-delà, il faudrait garder actes, carte et mutuelle : c'est la ligne qu'on ne franchit pas.
2. L'échec affiché comme un vide, sur les déclarations et les cotations types.
3. Les guides.
4. Le **taux de couverture** (BR déclarées ÷ euros du relevé) — sans lui, un rendement calculé sur
   des déclarations partielles est faux sans que rien ne le dise. N'a de sens qu'avec des
   déclarations réelles à comparer.

---

## 17 août 2026 (matin) — v1.38 à v1.41 : le deck corrigé, la séquence du 4 septembre, et le code retenu 30 jours

Suite directe de la session de la veille, après une nuit. **Quatre push, banc de 1126 à 1147
vérifications, 0 échec.**

**Le deck du 4 septembre — dix corrections d'Arthur.** Une seule touchait le fond : diapo 28,
« vos téléphones vibrent ». Vérification faite, la notification de fin de génération part bien à
**tous** les abonnés (`notifierPush_` sans cible) — mais l'abonnement était encore verrouillé aux
seuls comité et pilotes. En l'état, une vingtaine de personnes auraient touché « Activer les
notifications » à la diapo 7 pour recevoir un refus, et **aucun téléphone n'aurait sonné à la démo**.
Arthur a ouvert le canal dans la foulée. Les autres corrections : `PRIORITÉ` → `AXE` avec le mot posé
dans le texte, « 1 minute » au lieu de « 15 secondes », deux étapes sur six qui demandent quelque
chose aux MAR, SEVERAC au féminin (diapo **et** notes d'orateur), « c'est illégal » retiré,
« mois chargés » défini comme « mois à plus de 4 gardes », et le bandeau défilant de `staff.html`
reproduit à l'identique sur la diapo 12 — figé, puisqu'une diapo projetée n'est pas connectée, et
stable puisque le calcul des prioritaires ne regarde que les années passées.

**La séquence du 04/09 — avant, pendant, après.** Le plan d'Arthur (saisir les 24 adresses la veille
pour que les codes arrivent le matin) a été vérifié dans le code plutôt que validé sur parole, et
**deux points en sont sortis** : la garde d'idempotence du wizard 2, qui ferait afficher « 730 gardes »
sans aucun calcul si le bac à sable de la répétition n'est pas effacé ; et l'ordre nettoyage → envoi
des codes, sans lequel un curieux verrait la veille au soir des gardes 2027 fictives données pour les
siennes. Détail en section dédiée.

**Le code d'accès retenu 30 jours glissants, et seulement dans l'app installée** (v1.40). Le code
vivait en `sessionStorage` : iOS fermant volontiers les apps web, un MAR retapait ses 8 caractères à
peu près chaque jour. Arthur a tranché contre mon avis sur le calendrier — et il avait raison : le
risque est de pousser *la veille*, pas de pousser à 19 jours avec une répétition le 28 pour le
prouver. C'est la première semaine d'adoption qui juge un outil.
Choix : 30 jours glissants, **uniquement dans l'app posée sur l'écran d'accueil**. Depuis un
navigateur — donc peut-être un poste du bloc — rien n'est mémorisé : gain de sécurité autant que de
confort. Le comité garde la main, le code étant revalidé à chaque ouverture : régénérer un code éjecte
le téléphone aussitôt. `partage/session.js` est le point unique ; le banc refuse qu'une page touche à
la clé en direct. Testé en réel par Arthur : app fermée complètement puis rouverte, pas d'écran de code.

**Le banc a trouvé un défaut avant la production.** Première version : les pages appelaient
`CHPGSession` sans filet. Si `partage/session.js` ne se charge pas — réseau, cache — elles **ne
s'ouvraient plus du tout**, le MAR ne pouvant même plus taper son code. Avec 23 téléphones sur le wifi
de l'hôpital un 4 septembre, c'était le scénario à ne pas prendre. Chaque page retombe désormais sur
le comportement d'avant plutôt que de planter.

**Un verrou posé juste avant de remettre le code au comité** *(17/08, v1.45, `Indispos.gs`
2026-08-17.1)*. Arthur s'apprêtait à envoyer le code administrateur aux 3-4 membres du comité. Contrôle
de dernière minute : la carte « 3 · Clôturer l'année » n'avait **aucun garde-fou de date**. Ses deux
conditions portaient sur l'EXISTENCE des onglets de l'année suivante — or ils existaient depuis août,
créés par le bac à sable de la démonstration. **Clôturer 2026 était donc à deux clics** pour n'importe
quel membre du comité, ce qui aurait déplacé le planning EN COURS D'USAGE et basculé le service sur
une année fictive. Le Diagnostic l'annonçait, le guide l'écrivait : *une consigne n'est pas un verrou.*
Refus désormais **à deux niveaux**, avant le premier lundi de planning de l'année suivante (jamais le
1er janvier civil), avec la date exacte, le motif, et « aucune modification n'a été faite » :
1. **Sur l'écran** (`admin.html`) — l'assistant ne s'ouvre pas, et la carte affiche d'elle-même
   « Disponible à partir du lundi 4 janvier 2027 » : personne n'a à cliquer pour l'apprendre.
2. **Sur le serveur** (`Indispos.gs` 2026-08-17.1) — la barrière qui tient quel que soit l'écran.

**Les deux niveaux sont actifs depuis le 17/08.** Arthur n'ayant pas eu accès à son PC au moment de
remettre le code au comité, le verrou d'écran a tenu seul pendant une heure — suffisant pour le risque
réel, un membre du comité qui explore de bonne foi. `Indispos.gs` 2026-08-17.1 a été recopié et
déployé dans la foulée.

**Et une leçon sur le banc lui-même.** Ma première version du test T130 rejouait la règle de date
**réécrite dans le test** : la contre-épreuve a montré qu'elle continuait de passer une fois le
garde-fou retiré du serveur. Réécrit pour **extraire et exécuter le bloc du serveur** ; sans lui,
10 vérifications tombent. C'est le même défaut que celui relevé le matin sur `banc_miroir.js` —
*un test qui recopie ne protège que la copie* —, commis à nouveau trois heures plus tard.

**La révocation est vérifiée en production** *(17/08, 12 h 11)*. Arthur a régénéré son propre code
depuis l'onglet Équipe, téléphone connecté : l'appareil a bien été éjecté à l'ouverture suivante, et
la reconnexion avec le nouveau code a rendu les 30 jours. C'est ce qui rend la mémoire longue
acceptable — sans ce geste d'urgence prouvé, elle ne le serait pas.

**Un effet de bord découvert à cette occasion, et documenté.** Juste après une régénération, le
dashboard s'ouvre lentement et la carte « Mes échanges » disparaît. Une seule cause : le miroir est
rafraîchi par l'accroche différée **dans la minute qui suit** (`resetCodeMar: ['acces','config_admin']`),
donc pendant ce court moment il contient encore l'ANCIEN code. Le nouveau est refusé par le circuit
rapide, la page bascule sur le circuit Google — d'où la lenteur — et la carte des échanges, alimentée
**uniquement** par le miroir (`_echDepuisMiroir`, aucun appel de rattrapage), reste cachée.
Rien à corriger : le comportement est correct et se répare seul. Mais Arthur l'a pris pour un défaut,
et un membre du comité fera pareil — d'où l'encadré ajouté au guide comité, section 06, à côté du
bouton 🔄. *Une minute d'attente non écrite coûte un appel téléphonique.*

**Deux leçons.**

1. **« C'est trop risqué avant l'échéance » n'est pas un argument, c'est un réflexe.** Le risque
   dépend de la date de livraison ET du temps de vérification qui reste. À 19 jours avec une
   répétition programmée, la friction quotidienne d'un code retapé pesait plus lourd que le risque
   d'une modification testée.
2. **Une date écrite est une donnée, pas une politesse.** Cette session-ci a passé minuit et j'ai daté
   du 16 des fichiers écrits le 17 — dans un projet où l'on retrouve *quand* une décision a été prise
   en lisant les commentaires du code. Corrigé dans les huit fichiers concernés ; l'heure se relève,
   elle ne se suppose pas.

## 16 août 2026 (soir) — v1.36 : le guide du comité restructuré, et un Diagnostic qui redit la vérité

Session préparatoire à l'envoi du code et du lien aux membres du comité. Deux push, banc de **1112**
puis **1119 vérifications**, 0 échec.

**Push 1 — `docs/guide-comite.html`, `version.js`, `banc/banc_docs.js` (v1.36).** Le guide était une
liste de 13 sections où un nouvel admin ne savait pas *où cliquer*, et il se trompait sur trois points
vérifiés dans `admin.html` :

1. **La session.** Il affirmait que le code était redemandé à chaque ouverture, « c'est voulu ».
   Faux : `sessionStorage` le garde, l'auto-ouverture rouvre l'interface sans rien demander tant que
   le navigateur n'est pas fermé. La consigne juste sur un poste partagé n'est pas « il redemandera »
   mais « fermez le navigateur ». C'est le genre d'erreur qui compte double dans un document qu'on
   envoie AVEC un code d'accès.
2. **Les statuts.** Il annonçait qu'on pouvait poser une « absence ». `STAT_POSABLES` en contient
   cinq et cinq seulement : V, F, TP, CL, 18. La récupération (R) s'affiche et s'efface, mais ne se
   pose pas depuis cet écran — asymétrie réelle, désormais écrite.
3. **Les libellés.** « panneau Modifications » pour une carte qui s'appelle « 🔁 Modifier une garde ».

Onze gestes réels n'y figuraient pas du tout : `＋ aussi` (double poste), ouvrir/fermer/rouvrir une
consultation, « ∅ Laisser vide », la bande « Présents en journée », l'export Excel de la semaine,
« ↺ réinit. », l'écran « des MAR présents ne sont pas placés » avant publication, le bandeau
« Récupérations de samedi », le certificat d'équité, la vue Année des statuts, « Vider le cache »,
le renvoi groupé des codes. Le tableau de lecture du Diagnostic passe de 6 à 12 lignes.

Structure retenue (choix d'Arthur) : **A · Prise en main** (se connecter, les six onglets, la séance
type, les gestes de la semaine) puis **B · Référence, une section par onglet**, **C · Calendrier de
l'année**, **D · Repères et dépannage**. Ancres `#a1…#d3` : aucun lien entrant n'utilisait les
anciennes (`admin.html` est le seul à lier le guide, sans ancre — vérifié).

**`banc_docs.js` bloc 11** : relit `admin.html` et exige que chaque onglet ait sa section (dans les
TITRES, pas dans le sommaire) et que les libellés de `STAT_POSABLES` figurent dans la section
Statuts. Première version trop faible — « formation » apparaît ailleurs dans le guide et masquait la
disparition du libellé ; la contre-épreuve l'a montré, la recherche a été restreinte à la section.

**Push 2 — `gas/Indispos.gs` (2026-08-16.1) + `banc_docs.js` bloc 12.** Le rapport de diagnostic
d'Arthur affichait **4 ❌ « Version du site — (absente) → réaligner »**. Défaut confirmé en rejouant
l'ancienne logique sur le dépôt : elle cherchait `SITE_VERSION = 'vX.Y'`, `id="verBadge">vX.Y<`,
`Version <strong>vX.Y</strong>` — trois écritures supprimées par la centralisation du 14/08. Le
contrôle ne trouvait plus rien et criait au rouge sur une chaîne parfaitement alignée.

**Avec la centralisation, la question change** : non plus « quel numéro est écrit ici ? » mais
« cette page est-elle branchée sur la source unique ? ». Le nouveau contrôle vérifie, pour cinq pages
(`docs/roadmap.html` était oubliée), qu'elles chargent `version.js`, qu'elles ont un emplacement
`data-version`, et qu'aucune n'a **réintroduit** un numéro en dur — l'erreur reviendrait sinon sans
bruit. Un fichier injoignable devient un ⚠️ (incident réseau), plus un ❌.
La comparaison vit dans `_versionSiteAnomalies_`, **sans réseau** : c'est ce qui la rend exécutable
au banc, sur le dépôt réel puis sur cinq fichiers fabriqués fautifs.

**Ce que le rapport de diagnostic a révélé d'autre** (vérifié dans le classeur, pas déduit) :

- ⚠️ **24 MAR actifs sur 25 n'ont aucune adresse mail** dans `MEDECINS` (colonne EMAIL) — un seul en
  a une. Conséquence : l'envoi des codes (assistant 1 d'octobre, renvoi groupé, bouton 🔄) n'atteint
  personne. **Point bloquant pour la campagne d'indisponibilités**, à traiter avant octobre. Ce n'est
  pas un défaut de code : les cases sont vides.
- **TRAN** : actif, sans code d'accès, hors `GROUPES_VAC`, `date_fin` au 01/09/2026 — et porte une
  **G2 le 26/09**. C'est exactement l'écart « 702 gardes publiées vs 703 » du bloc Drive : les deux
  lignes du rapport sont le même fait.
- **Quatre samedis 2026 sans G2** (05/09, 24/10, 07/11, 12/12) : Arthur confirme qu'une garde est
  bien tenue ces jours-là, **par quelqu'un d'extérieur au groupe**. Le contrôle ne peut pas la voir.
  10 samedis sur 51 sont dans ce cas en 2026 ; **2027 n'en compte aucun** (365 jours recalculés).
  À trancher plus tard : déclarer ces gardes, ou apprendre au contrôle à les ignorer.
- Jeton GitHub : **63 jours**, expiration vers le **18 octobre 2026**.

**Troisième push — `gas/miroir.gs` (2026-08-16.1), `banc_miroir.js`, la check-list de ménage révisée
et sa vue courte (`docs/roadmap.html`, v1.37).** Arthur pensait la check-list du 4/09 complète ; relue contre le code, elle l'était **le
10/08**. Trois choses sont entrées depuis :

- **`LIENS_R_{Y}`** (13/08) : cinquième onglet annuel, absent de la liste des suppressions.
- **`ECHANGES`** (13-14/08) : onglet **unique, sans année dans son nom** — le piège de
  `PLANNING_OVERRIDES`, à l'identique. Il porte 3 dons acceptés sur 2027, faits pendant le test à deux,
  et `getEchangesEnveloppe` publie **toutes** les lignes au miroir, sans filtre d'année ni d'état.
- **L'oubli des années au miroir** (09/08) : il protège explicitement l'année de campagne. Avec
  `INDISPOS_ACTIVE = 2027` encore posé, une synchro lancée trop tôt **n'efface rien**, en silence.
  D'où une check-list désormais numérotée **dans l'ordre d'exécution**, la synchro en 6, après le
  retrait de la ligne CONFIG en 4.

**Et un vrai trou dans le code** : `MIROIR_CLES_PAR_ANNEE` ne contenait pas `equite_live_`, poussé par
année depuis le 13/08. Cette clé aurait survécu au ménage — le défaut du 09/08 revenu par une famille
ajoutée depuis. Les tests existants ne pouvaient pas le voir : ils nommaient trois préfixes **à la
main**. Le nouveau ne compare plus la liste à des noms écrits dans le test, mais **aux clés que le
miroir construit réellement par année** ; contre-épreuve faite, sans le correctif il tombe.

**La vue courte disait autre chose que la vue longue.** `docs/roadmap.html` portait déjà l'onglet
`ECHANGES` et l'allumage des notifications, absents du fichier long ; le long portait `LIENS_R` et
l'ordre de la synchro, absents de la vue courte. Les deux listes ont donc été écrites l'une après
l'autre sans être relues ensemble, et chacune était incomplète d'une manière différente. Elles sont
désormais alignées sur les mêmes 9 étapes. Au passage : la vue courte annonçait « 1120 vérifs ·
29 scripts » — le banc en compte 28, listés dans `lancer.sh`.

**Une carte périmée trouvée en relisant la vue courte** *(question d'Arthur)* : `roadmap.html`
présentait encore l'échange de deux gardes adjacentes comme « refusé aujourd'hui », avec son plan de
correction — alors qu'il est **livré depuis le 12/08** (`applyModification`, branche `adjacent` de
`echangeGardeJours`) et couvert par **9 scénarios** de `banc_gestes.js`. Quatre jours d'écart entre le
code et la vue de pilotage, sur une fonctionnalité livrée à la demande d'Arthur lui-même. La carte est
remplacée par un état des lieux de ce qui est réellement vérifié avant écriture.
*(Rien de tel dans le fichier long : il décrivait déjà correctement l'existant.)*

**Quatrième push — `cloudflare/worker.js` + `banc_worker.mjs`.** Le fichier portait DEUX versions :
un commentaire d'en-tête figé à « miroir 2026-08-05.7 » et la constante servie, « 2026-08-13.4 » —
huit versions d'écart. Sans effet en production, mais un jour de panne on lit la première ligne qui
ressemble à une version et on conclut à une dérive de déploiement inexistante. **Supprimé plutôt que
corrigé** : corrigé, il serait périmé au prochain déploiement, exactement comme aujourd'hui. Le banc
exige désormais qu'il n'existe **qu'une seule** version écrite dans le fichier, et que ce soit celle
que le guichet de santé annonce.

**Tout est déployé.** Les deux `.gs` recopiés et déployés, le Worker redéployé, dans la foulée du
push — et Arthur confirme au diagnostic que le rouge a disparu. Aucun `miroirSyncComplet` n'était
nécessaire : un déploiement de Worker remplace le programme, pas les données qu'il sert.

**La séquence du 4 septembre, écrite en entier** *(demande d'Arthur : « que tout soit rodé avant,
pendant et après »)*. Son plan — saisir les 24 adresses la veille pour que les codes arrivent le matin
— a été vérifié dans le code plutôt que validé sur parole, et deux points en sont sortis :

1. **Le wizard 2 ne régénère pas une année déjà générée** (garde d'idempotence, action
   `generateGardes` : si `GARDES_{Y}` et `STATS_GARDES_{Y}` existent et sont cohérents, il renvoie les
   stats existantes et enchaîne). Excellent en production, **fatal en démonstration** : la répétition
   du 28/08 laisse les onglets en place, et le 4 la salle verrait « 730 gardes » s'afficher
   instantanément **sans calcul et sans message**. D'où : remise à zéro obligatoire la veille.
2. **L'ordre nettoyage → envoi des codes.** Dès qu'un code est reçu, son détenteur se connecte, et
   `dashboard.html` demande `planning_{active+1}` à chaque ouverture : codes envoyés avant le
   nettoyage, un curieux verrait des gardes 2027 fictives données pour les siennes. Envoyer après.

Vérifié aussi, en faveur du plan : `sendCodes` relit `MEDECINS` sans mémoire intermédiaire (aucun
délai entre la saisie et l'envoi), et le quota de 100 messages/jour laisse la place à 25 destinataires
avec de quoi recommencer. Reste le risque d'indésirables sur 25 messages identiques : envoi d'essai à
un seul destinataire d'abord.

**Trois leçons.**

1. **Un guide se relit contre le code, pas contre le souvenir qu'on en a.** Les trois erreurs
   trouvées étaient toutes des affirmations plausibles — dont une qui expliquait *pourquoi* le
   comportement était voulu. Une explication bien tournée d'un fait faux est plus dure à repérer
   qu'une omission.
2. **Un contrôle qui crie au rouge sans motif finit par ne plus être lu du tout.** Les 4 ❌ étaient
   inoffensifs techniquement ; leur coût réel, c'est l'habitude de survoler le rapport. D'autant que
   le guide, lui, demande de le lire.
3. **Un correctif de diagnostic doit être testable sans réseau.** Tant que la comparaison vivait au
   milieu des `UrlFetchApp`, aucun banc ne pouvait l'atteindre — et c'est précisément pour ça que le
   défaut a survécu deux jours à la centralisation qui l'avait créé.
4. **Un test qui recopie une liste ne protège que les lignes recopiées.** Trois préfixes écrits à la
   main dans `banc_miroir.js` donnaient l'illusion de couvrir la purge ; ils ne pouvaient rien dire
   d'une famille ajoutée après eux. Un test doit lire la source, jamais la redire — c'est la même
   règle que « compter les marqueurs dans le dépôt », appliquée au banc lui-même.
5. **Une check-list vieillit sans prévenir.** Celle du ménage était juste le jour de son écriture ;
   trois ajouts au système l'ont rendue incomplète en dix jours, sans que rien ne le signale. Toute
   liste de gestes manuels se relit contre le code avant d'être exécutée.

## 14 août 2026 — LE DÉPLOIEMENT : les échanges tournent en production (éteints), v1.34.1 + v1.34.3

La session de la nuit avait tout construit ; celle-ci l'a MIS EN PLACE. Arthur a déroulé les phases
1 à 4 de la feuille de route sans accroc : Worker `miroir 2026-08-13.4` déployé, les 4 `.gs`
recopiés (dont le nouveau fichier `echanges`) + nouvelle version, `ECHANGES_PILOTES` renseignée
(2 identifiants — ils vivent dans les propriétés du script, PAS ici), `installerDeclencheurEchanges`
+ `synchroniserEtatEchanges` exécutés, bac à sable 2027 régénéré (`LIENS_R_2027` créé, ~104
lignes), publié, `miroirSyncComplet` passé.

**Preuves de vie relevées en production :**
- Notification « Les gardes 2027 sont générées » reçue sur le téléphone d'Arthur à la
  régénération — le canal de la phase 1 est vivant de bout en bout, abonnement d'origine compris.
- Chrono API de la génération : 36,9 s (l'écriture de LIENS_R y est comprise, négligeable),
  publication 11,3 s, lectures rapides 100-220 ms, aucun appel repris. La ligne « ÉCHEC — Code
  invalide » du chrono est la lecture rapide tentée AVANT la saisie du code (préexistante,
  cosmétique, 161 ms perdus au premier chargement — à faire taire un jour si l'envie prend).
- Carte « Mes échanges » visible chez Arthur, invisibilité côté serveur confirmée par construction.

### Deux correctifs nés des questions d'Arthur (pas d'une relecture de code)

**v1.34.1 — la carte notifications suit l'interrupteur.** « Détaille-moi le test avec RW » a fait
relire la condition d'affichage : la carte « Activer les notifications » était réservée au rôle
admin — un pilote MAR n'aurait JAMAIS vu le bouton que le Worker lui autorisait pourtant.
Désormais : admin toujours, puis quiconque reçoit la clé `echanges` (pilotes du test, les 23 à
l'ouverture). La « levée du verrou » prévue en phase 4 devient AUTOMATIQUE à `ouvrirEchanges()`.
La carte disparaît seule une fois la permission accordée (et ne revient que sur un nouveau
téléphone ou après un refus) — comportement confirmé en production chez Arthur.

**v1.34.3 — trois icônes fantômes.** Capture d'Arthur : carré vide sur la carte Échanges. Cause :
`repeat`, `plus` ET `bell` (la carte notifications du 12/08 !) demandés par dashboard.html mais
absents du mini-bundle local `assets/vendor/lucide-icons.js` — le piège que l'en-tête du fichier
documente lui-même. Ajout des 3 formes officielles (~600 octets), et GARDE-FOU au banc
(`banc_ecran_echanges.js` §0) : toute icône `data-lucide` d'une page utilisant le bundle doit
exister dedans. **Un avertissement en commentaire ne protège personne ; un test, si.**

À noter aussi : à la vérification post-push de v1.34.3, l'API de contenu GitHub a servi quelques
minutes des versions en retard (3 « écarts » fantômes). Tranché par la source autoritaire : les
SHA git des blobs de l'arbre de `main` — cette comparaison-là ne ment pas et devient la méthode
de référence en cas de doute.

### Décisions prises avec Arthur

- **L'ouverture du 5/09 sera la v2.0** (pas v1.35) : premier circuit où le planning s'écrit sans
  le comité + notifications + pastille = changement de nature, pas de degré.
- Périmètre notifications actuel confirmé à Arthur (7 déclencheurs, doctrine « une notification =
  une information qui appelle un geste ») ; les candidats du lot 5 (planning republié, rappel
  veille de garde, campagne d'indispos) restent NON câblés, à décider après la v2.0.
- Désactivation des notifications : chemin Réglages iOS documenté, purge automatique des
  abonnements morts déjà en place ; un bouton « désactiver » dans le portail attendra une
  demande réelle (lot 5).

### OUVERTURE ANTICIPÉE (14/08, décision d'Arthur) — `ouvrirEchanges()` exécuté AVANT le staff

Seconde révision du plan le même jour, sur un constat d'Arthur qui invalidait la prémisse :
**personne n'a de code d'accès avant le 4/09** (codes distribués la veille du staff), hormis le
pilote — l'« invisibilité jusqu'après le staff » ne protégeait donc personne et ne faisait que
casser la chronologie de démo voulue (installer l'app en séance → activer les notifications →
génération en direct → TOUTE la salle sonne en même temps). Décision : tout ouvrir tout de suite,
zéro code nouveau (l'interrupteur double envisagé devient inutile). Arthur exécute
`ouvrirEchanges()`, supprime `ECHANGES_PILOTES`, relance `synchroniserEtatEchanges()`.
Conséquences assumées : un MAR curieux peut créer un vrai échange dès le 4/09 (c'est la
fonctionnalité) ; les demandes créées sur le bac à sable 2027 deviendraient orphelines à sa
suppression (échec propre en `impossible`) → **nettoyage `_2027` le soir même du staff** ; le
secrétariat peut s'abonner aux notifications (les échanges lui restent fermés par rôle) ; la
capture `assets/dashboard-accueil.png` projetée ne montre PAS la carte Échanges que la salle
verra — à re-capturer avant le 4/09 (Arthur fournit la capture, une session la pousse).
La v2.0 reste une montée de numéro symbolique APRÈS le staff (décision maintenue).
Diapos alignées en v1.34.8 : le geste d'activation ajouté à la diapo d'installation (2 gestes,
notes orateur : ne pas déflorer le clou de la démo), diapo de fin passée de « la semaine
prochaine » à « dès aujourd'hui ».

### GEL LEVÉ LE 14/08 (décision d'Arthur) — sw.js v4 DÉPLOYÉ, le push 2 se réduit à la v2.0

Arthur a renversé l'arbitrage, avec un argument que la prudence initiale n'avait pas pesé
à sa juste valeur : toucher au moteur des notifications APRÈS l'ouverture, quand 23 personnes
s'équipent, c'est risquer de casser au vu de tous — alors que le déployer MAINTENANT le fait
éprouver trois semaines en conditions réelles par les deux pilotes avant le staff. Le risque
résiduel (5 lignes dans un try silencieux ; un échec de pastille laisse la bannière intacte,
comme en v3) est pris en petit comité. sw.js v4 + banc_notif.mjs sont donc EN LIGNE depuis le
14/08, SANS montée de version site (aucune page ne change — même règle que « GAS seul »),
et le dossier d'attente `deploiement-v2/` est supprimé.

**Le PUSH 2 du 5/09 devient purement symbolique** : montée **v2.0** — depuis le 14/08 c'est
**une seule ligne dans `version.js`**, plus aucun marqueur à recompter —, consignation
ROADMAP/CONTEXTE de l'ouverture, rien d'autre. Puis Arthur : `ouvrirEchanges()`, suppression
de `ECHANGES_PILOTES`, annonce aux 23. La spécification historique ci-dessous reste pour
mémoire (elle décrivait la v4 avant son déploiement).
1. **`sw.js`** : `VERSION = 'chpg-sw-v4'` + dans le gestionnaire `push`, avant `showNotification` :
   si `d.pastille` est un nombre et `navigator.setAppBadge` existe → `navigator.setAppBadge(d.pastille)`
   dans un try silencieux (commentaire : bannière et pastille sont deux mécanismes séparés sur
   iPhone, iOS 16.4+, app installée ; effacée par le portail via le `clearAppBadge` DÉJÀ poussé).
2. **`banc/banc_notif.mjs`** : attendre `chpg-sw-v4` (au lieu de v3) + une vérification
   « v4 : la pastille est posée » (`/setAppBadge\(d\.pastille\)/` sur sw.js).
3. **Montée v2.0** : une ligne dans `version.js` (la source unique depuis le 14/08).
4. ROADMAP + CONTEXTE : consigner l'ouverture.
Toute la chaîne amont de la pastille (compteur GAS → miroir → Worker) est DÉJÀ en production
depuis le push du 14/08. Après le push : Arthur exécute `ouvrirEchanges()`, vide
`ECHANGES_PILOTES`, annonce aux 23 (app sur l'écran d'accueil + carte notifications + guide
section 10), envoie les codes manquants.

### Reste à faire (dans l'ordre)
Phase 5 : test à deux avec le pilote (don, refus, échange, don de samedi avec R qui suit,
refus immédiat sur indispo). Phase 6 : remise à zéro du bac à sable. 28/08 : répétition
générale. 4/09 : staff (rien à faire). Phase 8 : nettoyage post-démo (+ lignes ECHANGES de
test, LIENS_R_2027). Phase 9 : push 2 + `ouvrirEchanges()` = v2.0.

---

## 14 août 2026 (matin) — v1.34.2 → v1.34.6 : cinq défauts vus sur un iPhone, dont un qui attendait 2027

Session déclenchée par trois captures d'écran d'Arthur, pas par une relecture de code. Cinq push
atomiques, tous vérifiés en ligne par comparaison SHA-256 après relecture. Banc 1085 → **1098**.

| Version | Commit | Ce qui change |
|---|---|---|
| v1.34.2 | `0046953` | Vue Année : le nom du mois s'écrit en entier |
| v1.34.4 | `e656516` | Le bandeau du haut ne peut plus déborder de sa hauteur (6 pages) |
| v1.34.5 | `663e891` | La fiche d'un MAR tient dans l'écran du téléphone |
| v1.34.6 | `8c86878` | Absences du vocabulaire 2027, journée 18h lisible, récup de samedi visible |

*(v1.34.3 vient d'une autre session : les icônes `bell`, `plus`, `repeat` ajoutées au bundle local.
Elle s'est intercalée pendant celle-ci — d'où la règle « repartir de la version en ligne » appliquée
littéralement à chaque lot.)*

### Le défaut qui comptait vraiment : les absences de 2027

Question d'Arthur, pas une découverte de relecture : *« pour 2027 il n'y aura plus de code A, ce
sera TP, V… donc il va tout écrire ? »* Réponse mesurée : **l'inverse, il n'aurait rien écrit.**

Les trois compteurs d'absences de l'onglet Médecins (carte du MAR, case « Absences » de la fiche,
récapitulatif annuel) additionnaient `A + CP + F` **en dur**. Relevé dans le classeur le même jour :

| Code | GARDES_2026 | GARDES_2027 |
|---|---|---|
| A | 855 | **0** |
| CP | 23 | **0** |
| F | 114 | 207 |
| V | 3 | **1013** |
| TP | 131 | **224** |
| CL | 124 | **56** |

À partir de janvier 2027, un mois entier de vacances se serait affiché « aucune absence », et le
récapitulatif serait tombé sur son repli « X jours présents » — **déjà visible sur la capture
d'Arthur : « Janvier 2027 · 1j »**. Corrigé en dérivant `ABSENT_COMPTEUR` de `ABSENT_PANNEAU`, la
liste juste qui vivait déjà dans le fichier ; `R` en est retiré puisqu'il a désormais sa propre
pastille. **Plus aucune liste de codes écrite à la main dans `index.html`.**

C'est la **sixième** liste divergente de cette famille — les cinq autres avaient été unifiées le
13/08 au soir. Celle-ci avait échappé à l'inventaire parce qu'elle ne ressemble pas aux autres :
ce n'est pas un tableau de codes, ce sont trois additions `A + CP + F` noyées dans du calcul.
**Chercher les listes ne suffit pas : il faut chercher aussi les additions de codes.**

Contre-épreuve faite avant le push, sur le code alors EN LIGNE, avec un mois au vocabulaire 2027
(10 V, 2 TP, 1 CL, 1 F, 2 gardes, 1 journée 18h, 1 récup) : en ligne « **1 abs.** », récapitulatif
`2G 1h 1A` ; après patch « **14 abs.** », récapitulatif `2G 1×18 1R 14A`.

### Deux libellés qui mentaient

1. **`1h` ne voulait pas dire une heure.** La pastille verte du récapitulatif comptait les
   **journées 8 h – 18 h** (code `18`) et collait un `h` derrière le nombre. Vérifié sur la ligne
   d'Arthur au classeur : février, mars, avril, mai, juillet, octobre, décembre → une journée 18 h
   chacun, ce qui correspond exactement aux « 1h » de son écran. Devient **`1×18`** (« 1×18h » a été
   refusé par Arthur : trop long).
2. **La récupération de samedi n'apparaissait nulle part** dans le récapitulatif — sept dans
   l'année pour Arthur, aucune pastille. Elle en a une désormais, et **une teinte propre**
   (`--recup`, bleu-canard, déclarée dans les deux thèmes) : elle partageait le vert du 18 h dans
   le mini-calendrier ET dans la vue Année. **Le 18 reste vert**, comme sur la vue Planning
   (`.chip-h18` / `.name-tag.h18`) — vérifié dans le fichier, et le banc le verrouille pour que
   personne ne le déplace plus tard.

### Trois défauts de mise en page sur téléphone

1. **Vue Année** : la bande du haut affichait `Aoû` alors que la colonne couvre tout le mois
   (31 × 20 px). Nom complet dès que le mois affiché fait 6 jours ou plus ; en deçà (janvier 2027 =
   3 jours, fin de l'année de planning) l'abrégé reste, sinon le titre élargirait ses colonnes.
2. **Bandeau du haut** : `absences.html` et `suivi-liberal.html` n'avaient AUCUNE des protections
   qu'`index.html` et `dashboard.html` ont depuis longtemps. Titre et sous-titre s'enroulaient sur
   trois lignes ; la hauteur étant figée par `height`, le débordement partait **au-dessus du bord
   de l'écran**. Règle unique appliquée aux 6 pages : `min-height` au lieu de `height`, titre en
   `nowrap` + `ellipsis`, `min-width:0` sur la zone du titre (sans quoi l'ellipsis ne se déclenche
   jamais dans un conteneur flex), `flex-shrink:0` sur les boutons. Sous 640 px : sous-titre masqué,
   pastilles réduites, et sur `suivi-liberal.html` — seule page à porter TROIS boutons à droite —
   « Retour au portail » devient « Portail ». **`index.html` et `dashboard.html` gardaient eux aussi
   une hauteur figée** : ils s'en sortaient par l'ellipsis seule, le garde-fou manquait. C'est le
   test écrit AVANT le patch qui les a dénoncés.
3. **Fiche d'un MAR** (`.doc-panel`) : `width: 480px` en dur sur un écran de 390 px — l'avatar
   sortait à gauche — et `height: 100vh` **collé en bas** de son enveloppe (`align-items: flex-end`),
   donc tout dépassement partait vers le haut et coupait le nom, le secteur et la croix. Devient
   `min(480px, 100%)`, étiré (`stretch`), `height: 100%` de l'enveloppe qui est déjà
   `position:fixed; inset:0`. Place réservée pour la barre d'état iOS en haut
   (`env(safe-area-inset-top)`) et la barre home en bas. **`admin.html` porte exactement le même
   panneau** (`.panel`, 420 px, `100vh`, collé en bas) : NON traité, écran comité sur PC — le défaut
   y est identique si on l'ouvre un jour sur téléphone.

### Bancs

Trois scénarios nouveaux, tous écrits avant leur correctif :
- `banc_pages_mar.js` **28o** — vue Année rendue pour de vrai : « Août » en entier, « Jan 2027 »
  abrégé, la bande couvre bien les 34 jours.
- `banc_docs.js` **§9** — le bandeau des 6 pages : hauteur minimale, titre coupé par « … », zone du
  titre capable de rétrécir, boutons non écrasables, sous-titre effacé sous 640 px.
- `banc_docs.js` **§10** — la fiche d'un MAR : enveloppe, étirement, largeur plafonnée, hauteur,
  barres d'état.
- `banc_pages_mar.js` **28p** (13 vérifs) — vocabulaire 2027 rendu dans un navigateur simulé, les
  deux libellés, et le verrou « le 18 reste vert sur la vue Planning ».

⚠️ **Ce que ces tests ne prouvent PAS.** jsdom ne calcule aucune largeur ni hauteur : un test de
mise en page y vérifie que la RÈGLE CSS est écrite, jamais que ça tient à l'écran. La preuve reste
le téléphone d'Arthur. Ne jamais présenter « le banc est vert » comme « l'affichage est bon ».

### Trois fautes de méthode de cette session, à ne pas refaire

1. **Un push est parti sans accord explicite.** La question posée était « je code et je lance le
   banc ? » ; le « Ok » d'Arthur portait sur ça, pas sur la livraison. Le patch a été poussé dans la
   foulée (v1.34.5). Signalé immédiatement, retour en arrière proposé, refusé par Arthur. La règle
   ne souffre aucune interprétation : **coder ≠ livrer**, et un « ok » ne vaut que pour la question
   effectivement posée.
2. **Un défaut a été affirmé sur la foi d'une capture d'écran.** Une image zoomée du récapitulatif
   a été lue comme un débordement horizontal, et présentée comme « un défaut que j'ai créé ».
   Arthur : *« non c'est une capture zoomée, rien ne dépasse »*. **Une capture ne se mesure pas :
   elle motive une hypothèse, elle ne la conclut jamais.**
3. **Le tableau des porteurs de version, dans ce fichier, était périmé** (4 fichiers au lieu de 5) ;
   la session s'y est fiée et a oublié `docs/roadmap.html`. C'est le banc qui a refusé le push.
   Tableau corrigé ci-dessous, avec son historique — il a désormais eu faux deux fois.

### Au passage

`docs/roadmap.html` annonçait **723 vérifications** alors que le banc en comptait 1048 : compteur
remis à jour à chaque push de la session (1053 → 1079 → 1085 → 1093 → 1098).

---

## 13-14 août 2026 (nuit) — échanges de gardes : TOUT est construit, prouvé au banc, en attente du push

**Décision d'Arthur (13/08)** : tout doit être déployé et éprouvé AVANT le staff du 4/09, mais
INVISIBLE pour les 23 ; test réel à deux (Arthur + un MAR pilote) sur le bac à sable 2027 ; mise en
service juste après le staff, en un geste. Les phases 1-4 de la Priorité 2 ter sont donc TOUTES
construites, hors production, dans une copie de travail complète — **rien n'est poussé**.

### Ce qui est prêt (banc complet AU VERT, 28 scripts)

1. **Lot 1 — lien samedi → R** (`generateur_gardes.gs`) : le couple est écrit dans un onglet
   `LIENS_R_{année}` (SAMEDI · MEDECIN · DATE R, 104 lignes en 2027 = 52 samedis × 2 tenants),
   collecté aux DEUX chemins de pose, ajouté à l'archiveur. `banc_liens_r.js` (15 vérifs) exécute le
   VRAI générateur via `simulateur/harness.js` (chemins absolus corrigés en relatifs au passage).
   **Appris au banc : 22 R sur 104 sont posés AVANT leur samedi** — voulu (repli quand la fenêtre
   2-16 semaines est mangée par les vacances scolaires ou la fin d'année). Conséquence intégrée à la
   phase 3 : un R déjà pris ne se transfère pas, comité notifié.
2. **Nouveau `gas/echanges.gs`** — cycle complet : `creerEchange` (contrôles joués dès la création
   par `applyModification` en **dryRun** — writeCell neutralisé, contrôles intacts, doctrine
   2026-08-05.12), `repondreEchange` (rejoue tout ; planning bougé entre-temps → état `impossible`,
   5e état ajouté, grille INTACTE, les deux prévenus), `expirerEchanges` (48 h, rappel unique 24 h,
   déclencheur horaire via `installerDeclencheurEchanges`), `_transfererR_` via LIENS_R (échec = don
   valide + comité notifié, JAMAIS de R créé ; samedi↔samedi : aucun R ne bouge, les lignes LIENS_R
   gardent alors leur tenant d'origine — assumé), poussée KV `echanges` à chaque écriture.
3. **L'INTERRUPTEUR** : propriétés de script `ECHANGES_OUVERTS` ('O') et `ECHANGES_PILOTES`
   ('ID1,ID2' — AUCUN nom dans le dépôt), répliquées au KV sous `notif_config` (poussable, JAMAIS
   lisible par /read). `ouvrirEchanges()` / `fermerEchanges()` / `synchroniserEtatEchanges()` depuis
   l'éditeur — effet dans la minute, sans redéploiement. Le Worker applique le MÊME interrupteur à
   la lecture de la clé `echanges` ET à `/notif-abonner` (l'élargissement promis « ICI et nulle part
   ailleurs » est branché). Circuit fermé : le RECEVEUR d'une demande doit aussi être autorisé.
4. **`Indispos.gs`** : dryRun, type `transfertR` (mêmes garde-fous cellule à cellule), routage
   `creerEchange`/`repondreEchange` (rôles mar + admin, demandeur = user.id TOUJOURS, verrou
   d'écriture, verrou d'interrupteur), `echanges.gs` au contrôle de dérive.
5. **`miroir.gs`** : `notifierPush_(titre, corps, url, cible)` — cible {id} ou {role:'admin'},
   rétrocompatible ; famille `echanges` câblée aux 4 endroits ; transport de `pastille`.
6. **`cloudflare/worker.js`** : clé `echanges` (lecture soumise à l'interrupteur), `notif_config`,
   `/notif-envoyer` ciblé par id (clé nominative directe) ou rôle (via `acces`), `pastille` dans la
   charge chiffrée (plafonnée 99).
7. **Écran « Mes échanges »** (`dashboard.html`, v1.33.2 → **v1.34**, 9 marqueurs sur 5 fichiers) :
   carte d'accueil avec compteur de demandes en attente, vue liste (« Mes demandes » par défaut /
   « Tout voir »), Accepter/Refuser, panneau Proposer (don/échange, avertissement samedi 2026),
   contrat visuel = maquette-notifications. **PERF : la clé `echanges` voyage dans l'appel
   d'ouverture existant (miroirBootDash) — ZÉRO requête ajoutée au chargement, refus = coût nul.**
   L'invisibilité avant ouverture est CÔTÉ SERVEUR (clé refusée → carte absente, aucune logique
   d'ouverture dans la page). Guides MAR (section 10) et comité (section 04 réécrite) dans le lot.
8. **Pastille d'icône (demande Arthur du 13/08)** : chaîne complète compteur GAS
   (`_echangesEnAttentePour_`) → miroir → Worker → **`sw.js` v4** (`setAppBadge` dans le
   gestionnaire push) → effacée à l'ouverture du portail (`clearAppBadge`, déjà dans dashboard,
   inoffensif sous v3). ⚠️ **`sw.js` v4 NE PART PAS avec le premier push** : le gel du canal tient
   jusqu'au 4/09 — il partira dans un second micro-push le 5/09 avec `ouvrirEchanges()`. La pastille
   ne sert qu'aux 23 ; le test pilote s'en passe.

### Bancs nouveaux
`banc_echanges.js` (87 vérifs : cycle, sécurité, R, interrupteur, pastille) ·
`banc_ecran_echanges.js` (21 vérifs : dashboard RÉEL en navigateur simulé contre le VRAI Worker —
interrupteur fermé = rien à l'écran, pilote = carte + compteur + Accepter qui écrit et rafraîchit,
Proposer = bon verbe, bonnes valeurs, et AUCUNE requête miroir ajoutée au boot) ·
`banc_liens_r.js` (15). Doublures corrigées : `stubs.js` (setValue/setValues rechaînés,
getSpreadsheetTimeZone), harnais du simulateur (chemins relatifs). Deux tests d'inventaire
assouplis (`banc_ordre_vac.js` : ils exigeaient la POSITION dans une liste au lieu de
l'APPARTENANCE — cassés par tout ajout légitime derrière).

### Séquence de déploiement (prévue ~25-27/08, AVANT le staff)
Push atomique 1 (tout SAUF sw.js) → Arthur : ① Worker (Cloudflare, EN PREMIER) ② les .gs + le
NOUVEAU fichier echanges.gs ③ propriété `ECHANGES_PILOTES` = 2 identifiants, puis
`installerDeclencheurEchanges`, `synchroniserEtatEchanges`, `miroirSyncComplet` ④ test à deux sur
2027. Le 5/09 : push 2 (sw.js v4 seul) + `ouvrirEchanges()`.
**Nettoyage post-démo, AJOUTS** : lignes de test de l'onglet ECHANGES, onglet LIENS_R_2027,
vider ECHANGES_PILOTES après l'ouverture.

---

## 13 août 2026 (soir) — v1.33.2 : plus rien n'attend Google, et trois listes qui mentaient

Sept commits de plus : `c544d19f`, `87e8ce41`, `c439bb25`, `8e2198ef`, `4b5e2532`, `9ddf3766`
(et `a134d6e1` pour la documentation). Banc 807 → 863.

### Plus aucune lecture systématique chez Google

Inventaire fait écran par écran, en remontant chaque appel jusqu'à la fonction qui le déclenche.

**Côté MAR** — il restait `getStatsLive`, l'onglet Instantané. C'est le calcul le plus lourd du
portail : il recompte les gardes réellement faites sur toute l'année, échanges et dons compris.
Il était payé par CHAQUE MAR à CHAQUE clic. Nouvelle clé `equite_live_{Y}`, construite aux mêmes
moments que la famille `stats` — un échange de gardes la republie dans la minute.

**Mesure préalable, et c'est elle qui a levé la seule réserve** : depuis le 05/08, une écriture du
comité se contente de NOTER la poussée ; un déclencheur pousse ensuite. La charge du recalcul ne
tombe donc ni dans la requête d'un MAR, ni dans l'écriture du comité.

**Contrepartie assumée** : l'écran n'est plus exact à la seconde mais à la minute. La légende le dit
(« à la minute près » remplace « à l'instant T ») et un lien **recalculer maintenant** force le
calcul frais. Arthur : « si c'est à la minute ça va, personne ne va analyser ça à la loupe toutes
les 5 minutes. »

**Côté comité** — même bascule pour l'onglet Instantané, avec la garde des 90 s désormais étendue
aux DEUX sources. Et deux données qui étaient **déposées depuis le 04/08 sans que personne ne les
lise** : `vacances_admin` (périodes, seuils, groupes) alimente maintenant l'onglet Équipe.

### Trois défauts de fond, chacun caché derrière un symptôme plus petit

**1. L'appel fantôme aux vacances.** `loadVacancesValidation()` appelait Google à chaque ouverture
de l'onglet Équité pour écrire dans `#vacContent` — le conteneur de l'onglet ÉQUIPE, le seul de la
page à porter ce nom. Le tableau n'était donc jamais visible, et il écrasait au passage l'affichage
d'un autre onglet. Elle manipulait en outre `#vacEmpty`, absent de la page : toute erreur levait là,
silencieusement. Retiré, avec une trace en commentaire de ce qu'il faudrait pour un vrai suivi.

**2. Un appel Apps Script à l'ouverture, rattrapé par le banc.** La première version de la pastille
des indisponibilités se rabattait sur Google quand la copie rapide était vide. Le scénario 18
(« AUCUN appel Apps Script à l'ouverture », v1.25) l'a signalé immédiatement. Corrigé : à
l'ouverture, la copie rapide et rien d'autre ; l'appel direct n'a lieu que sur le clic.
**C'est le banc qui a vu ce que je n'avais pas vu.**

**3. Les codes d'absence — le plus grave.** Arthur signale qu'un MAR mis en « V » pour le lendemain
apparaît dans les absents côté comité, pas côté MAR. `index.html` portait CINQ listes de codes
recopiées à la main, divergentes, et aucune ne connaissait `V`, `TP` ni `CL`.

Relevé du classeur, le même jour :

| | `A` | `V` | `TP` | `CL` |
|---|---|---|---|---|
| `GARDES_2026` | 855 | 1 | 131 | 126 |
| `GARDES_2027` | **0** | **1013** | 224 | 56 |

Le vocabulaire a **changé entre les années** : 2026 note les vacances `A`, 2027 les note `V`. Les
deux sont désormais retenus — 2026 reste consultable.

**La portée dépassait de loin le panneau signalé** : les QUATRE compteurs de présents employaient la
même liste incomplète. Sur 2027, ils comptaient comme présents 1013 cases de vacances, 224 de temps
partiel et 56 de congé long. Les chiffres de présence de la vue MAR étaient faux sur toute l'année
à venir, et rien ne l'aurait révélé avant que quelqu'un ne compte à la main.

Une seule liste désormais, `ABSENT_PANNEAU` (+ `RG` pour `ABSENT_STATUSES`), avec le relevé du
classeur inscrit en commentaire.

### La pastille des indisponibilités

Le comité ne savait qui avait saisi qu'à l'étape 1 de l'assistant de génération — en novembre, trop
tard pour relancer sans bousculer. Une pastille discrète, à droite de la barre d'onglets, affiche
« Indispos 2028 · 17/23 » **pendant la campagne seulement** ; au clic, la liste des manquants.

**Règle posée par Arthur** : chacun doit poser AU MOINS une ligne, même sans contrainte — c'est ce
qui distingue « rien à déclarer » de « pas encore regardé ». Et la pastille réutilise
`marsDansAnnee()`, la MÊME règle que le contrôle bloquant, sinon elle annoncerait 23/23 pendant que
la génération refuserait de démarrer.

### Ce qui reste ouvert

- **Le panneau de mesure lisible sur téléphone.** Arthur hésite à charger l'interface d'un outil de
  diagnostic — réserve légitime. Il pourrait n'apparaître que sur une adresse spéciale.
- **Le suivi des vacances du comité** (qui a obtenu quoi) : il lui faudrait son propre conteneur, et
  `getVacValidation` n'est PAS dans le miroir — c'est un calcul croisant indispos et seuils.
- **Les indisponibilités des assistants** : déposées mais non lues. Volontairement laissées ainsi —
  deux usages par an, et ce sont les écrans où une donnée en retard d'une minute serait la plus
  gênante, puisqu'on y lance une génération sur ce qu'on vient de lire.

---

## 13 août 2026 — v1.32.6 : chacun voit son tour de vacances, et deux affichages menteurs tombent

Huit commits poussés : `9a23862e`, `917474ce`, `f677abb6`, `b1c73fd8`, `ed227434`, `744a5a9b`,
`f7d79e99`, `174b03b1`. Banc 707 → 807.

### Le besoin

Avant le staff du 4 septembre, chaque MAR doit pouvoir anticiper ses vacances : à quel tour
vais-je choisir, et qui passe avant moi ? L'information existait, mais seulement sur l'écran
d'arbitrage du comité, projeté le jour du staff. Trop tard pour réfléchir.

### Ce qui a été livré

**Le guide MAR lisible sur téléphone.** Il n'avait qu'une seule règle mobile (les colonnes du
sommaire). Bloc `@media (max-width:600px)` : marges 36/20 → 20/13 px, titre 30 → 24 px, première
colonne des tableaux qui revient à la ligne au lieu de déborder, démonstration du planning
recalibrée — sa colonne « Secteur » était figée à 118 px sur 284 px utiles. Retrait au passage de
46 lignes de CSS mort : les habillages de deux démonstrations animées qui n'existent que dans le
guide du comité, et deux règles d'impression écrites trois fois.

**Le tableau de l'ordre des groupes dans le guide** (§06), année en cours et suivante, sans aucun
nom. Écrit en dur ET recalculé au chargement : il ne périme jamais, et si le script ne s'exécute
pas, le tableau écrit reste juste.

**Le bandeau « mon ordre de passage » dans « Mes congés »** — le rang nominatif, derrière le code.
Deux bandeaux, l'année en cours et la suivante. Un appui ouvre la file de la période : les trois
premiers, un trou, puis vos deux prédécesseurs, vous, et votre suivant. « Voir les 21 » déplie tout.

**Les étiquettes de comptage remises au propre.** Elles disaient « 67 Vacances j » ; elles disent
« Vacances 67 j ». Posées en grille de largeurs égales : une étiquette seule sur sa ligne occupe
toute la largeur au lieu de flotter à gauche.

**Les onglets Initiale / Instantané de la vue Équité**, pleine largeur, actif souligné au rouge du
service. Ils étaient calés à 32 px du bord gauche et épousaient la largeur de leur texte :
décentrés sur téléphone, touche de 27 px. Désormais 42 px. La barre n'a plus de marge latérale
propre — elle partage le bord gauche de `.eq-wrap`, son voisin dans `#equiteView`, donc
l'alignement tient quelle que soit la marge du conteneur.

**Le sélecteur de mois disparaît des vues Équité, Affectations et Année.** Sur grand écran les
steppers le savaient déjà ; sur mobile les deux listes restaient côte à côte, et choisir un mois
dans la vue Équité ne produisait rien.

### Trois décisions d'architecture

**1. `getOrdreVacances` est une fonction SÉPARÉE de `getVacConfig`, et ce n'est pas un doublon.**
`getVacConfig` part de `PERIODES_VAC` — qui ne contient que les périodes de l'année de campagne,
vérifié dans le classeur : uniquement des lignes 2027 — et de `INDISPOS_{Y}`, qui n'existe pas
encore pour l'année suivante. Répondre pour DEUX années par cette voie était impossible. L'ordre de
passage, lui, ne dépend que de `GROUPES_VAC` et de l'année : calculable pour n'importe quelle
année, même sans campagne ouverte.

**2. La bascule du 1er septembre est tranchée au serveur.** Jusqu'au 31 août l'année en cours est
mise en avant ; à partir du 1er septembre, la suivante — le staff se rapproche. C'est la date de
Monaco qui décide, jamais celle du téléphone.

**3. Rien de nominatif n'entre dans le dépôt.** Le guide est une page publique sans code d'accès :
un formulaire de code n'y protégerait rien, le fichier étant téléchargeable par
`raw.githubusercontent.com`. Le guide porte donc les lettres A/B/C ; les noms transitent à
l'affichage, derrière le code, comme sur le portail.

### Le miroir : deux clés nouvelles

**`ordre_vac`** — composition ORDONNÉE des trois groupes et ordre des groupes par période, pour
deux années. Copie COMMUNE : aucun rang personnel dedans, la page s'y cherche par son identifiant.
Elle voyage dans le MÊME `miroirRead` que le planning à l'ouverture du dashboard — zéro requête
supplémentaire, bandeau prêt avant l'ouverture de la tuile.

**`stats_{Y}` ouverte aux MAR.** La vue Équité d'`index.html` allait chercher les cibles — le trait
de chaque barre, pour les 21 MAR — par un appel Apps Script : les barres s'affichaient, les traits
une seconde plus tard. La clé `stats_{Y}` existait déjà, réservée au comité ; elle passe aux MAR.

**Ce n'est pas un élargissement, et la vérification compte plus que l'intuition.** J'avais d'abord
fabriqué une clé dédiée `cibles_{Y}`, par prudence — donner le strict nécessaire — et je l'avais
présentée à Arthur comme un fait acquis. Reproche justifié de sa part : c'est une décision de
service, pas un choix technique. En allant vérifier, le fondement de ma prudence est tombé :
**`getStatsLive` ne porte AUCUN contrôle de rôle** dans `Indispos.gs`, et l'onglet « Instantané »
affiche déjà ces compteurs nominatifs à tout MAR. La clé dédiée aurait coûté une recopie Apps
Script de plus pour protéger une donnée déjà accessible. `cibles_{Y}` a été abandonnée, `miroir.gs`
remis à l'identique de la version en ligne. Le banc vérifie désormais l'absence de contrôle de rôle
sur `getStatsLive` : le jour où elle sera ajoutée, la vérification tombera et rappellera de
refermer la clé.

**Ce qui reste au comité** : `gardes_{Y}`, `joursferies_{Y}`, `config_admin`, `vacances_admin`,
`mail_nonlus`, `liberal_{Y}`.

**L'onglet « Instantané » n'est PAS servi par la copie rapide** et ne peut pas l'être tel quel :
`stats_{Y}` est la photographie figée à la génération, tandis que l'instantané recompte les gardes
réellement faites, échanges et dons inclus. Le déporter demanderait de faire tourner ce calcul à
chaque republication de la copie — envisageable, non fait.

**Garde-fou des années.** `ordre_vac` fige l'année en cours et la suivante au moment de la poussée.
Le 1er janvier, la clé est fausse jusqu'à la synchro horaire. La page compare donc les années reçues
à celles qu'elle attend et bascule sur l'appel direct si ça ne colle pas. Mieux vaut une seconde
d'attente qu'un rang faux.

**Ordre de mise en service, non négociable** : le Worker D'ABORD (sinon `CLE_VALIDE` refuse la clé
en silence et le miroir pousse dans le vide), puis les `.gs`, puis `miroirSyncComplet`. Et
`miroir.gs` a besoin de `getOrdreVacances`, qui vit dans `Indispos.gs` : recopier l'un sans l'autre
fait OMETTRE la clé, sans le moindre message.

### Ce que le banc a gagné (+100)

- `banc_docs.js` §6 : la table de référence des vacances et le SENS de rotation doivent concorder
  entre `gas/Indispos.gs`, `staff.html`, `admin.html` et le guide — **six copies au total**, une de
  plus que ce qu'on croyait (`Indispos.gs` en porte trois, dont une de diagnostic). Le tableau écrit
  du guide est comparé au calcul, année par année. Le test ne fige pas le NOMBRE de copies : il
  exige qu'elles s'accordent.
- `banc_ordre_vac.js` (nouveau, 65 vérifications) : serveur sur classeur simulé de 21 MAR inventés,
  page pilotée au clic, récapitulatif par type, cache de session, chaîne complète du miroir.
- `banc_pages_mar.js` §28h, §28i, §28j, §28k : onglets d'équité, sélecteur de mois, ouverture de
  `stats_{Y}` (avec la garde sur l'absence de contrôle de rôle de `getStatsLive`), le redessin des
  vues au changement d'année, et l'ordre des recours pour les affectations manquantes.

Chaque test a été éprouvé par l'échec : sens de rotation inversé dans le `.gs` → 4 vérifications
tombent ; une ligne du tableau du guide inversée → le banc dit « Hiver 2026 : ABC ≠ CAB ».

### Le défaut le plus grave de la journée, trouvé par accident

**Changer d'année ne redessinait que la vue « Médecins ».** Le sélecteur passait à 2027 et l'écran
Équité continuait d'afficher 2026 — totaux ET cibles — sous le libellé de la nouvelle année. Le
certificat annonçait « À examiner — 19 écart(s) au-delà de 2 gardes » sur un planning 2027 qui n'en
compte **aucun** : écart maximal réel 1,4 garde, zéro dépassement.

**Comment il a été identifié.** Arthur signale un affichage faux sur 2027. Première hypothèse — la
mienne — : la copie rapide sert une photographie périmée des cibles, donc retour en arrière sur le
raccourci du jour. Arthur refuse le retour en arrière et exige une correction. C'est ce refus qui a
mené au vrai coupable : en téléchargeant le planning 2026 publié et en recalculant les écarts avec
ses propres cibles, les **six** valeurs de la capture tombent exactement — Albouy −2,4 samedis,
Armando −4,0 total, Catineau −3,0 total, Frohlich +2,2 jeudis, Ferriero +5,0 total, Guerin −3,0
total. Six sur six : l'écran affichait 2026.

**Trois leçons.**

1. **Accuser le changement du jour est un réflexe, pas un diagnostic.** Le raccourci par la copie
   rapide était innocent ; le défaut lui était antérieur, et touchait aussi Affectations et Année,
   plus silencieusement.
2. **Reproduire hors ligne vaut mieux que raisonner.** Les six valeurs recalculées ont tranché en
   une commande ce que trois hypothèses n'avaient pas su départager.
3. **Un affichage faux est pire qu'un affichage absent.** Un écran vide se remarque ; un certificat
   rouge, chiffré et nominatif, se croit. Celui-ci aurait pu se révéler **le 4 septembre**, pendant
   la démonstration de Wajdi, sur le planning 2027 généré — c'est-à-dire sur la preuve même que le
   générateur produit un planning équitable.

Correctif : toute vue dérivée de `DATA` est redessinée au changement d'année, ordinateur et mobile.
Les flèches ‹ Année › passent par le même chemin (`stepYear` appelle `onchange`). `banc_pages_mar`
§28k, 7 vérifications.

### Le second défaut : une année préchargée à moitié

Le correctif précédent restait **inatteignable** : il redessine la vue APRÈS le chargement de
l'année, et le chargement de 2027 ne se terminait pas. Témoin d'activité allumé deux à quatre
minutes, écran figé sur 2026.

**La chaîne.** `dashboard.html` précharge le planning de l'année SUIVANTE et le range dans la
mémoire de session partagée (`chpgPlan:{Y}`) — mais pas ses affectations, dont il n'a que faire.
`index.html` trouvait donc le planning tout de suite (`fromSS`) et partait chercher les affectations
chez Google : appel lent, rejoué une fois, et **attendu avant `render()`**. L'année en cours n'en
souffrait pas, `miroirBoot()` chargeant planning ET affectations dans le même appel. C'est le
**demi-remplissage du cache par une AUTRE page** qui piégeait — une optimisation utile ailleurs.

Correctif : les affectations manquantes sont demandées au miroir d'abord, à Google ensuite ; le
cache mémoire reste prioritaire sur les deux ; le résultat est réécrit dans la mémoire de session
AVEC les affectations, pour que le piège ne se reforme pas. `banc_pages_mar` §28l, 7 vérifications.
Confirmé en production par Arthur.

**Trois fausses pistes avant celle-là**, toutes plausibles, aucune vérifiable depuis ma place : une
copie rapide périmée, une purge d'année malheureuse, un paquet de dépôt en échec. La méthode qui a
fini par payer : lire le producteur ET le consommateur du cache, page par page, au lieu d'accuser la
dernière modification.

**La règle à retenir : quand je ne peux pas mesurer, je dois fournir le moyen de mesurer, pas
empiler les hypothèses.** Le portail est instrumenté (`chrono()`), mais uniquement vers la console —
inaccessible depuis un iPhone. Un affichage de mesure lisible sur téléphone est le chantier que
cette soirée a rendu évident.

### Ce qui reste ouvert

- **La liste nominative est visible par tous les MAR.** Choix assumé — c'est ce que le comité
  projette déjà au staff — mais à ANNONCER le 4 septembre plutôt qu'à laisser découvrir.
- **Le rang affiché n'a pas été recoupé avec le classeur.** Le banc prouve la mécanique sur des MAR
  inventés ; seul Arthur a vérifié son propre cas. Un contrôle croisé sur deux ou trois collègues
  avant le staff serait prudent.
- **Le diagnostic de maintenance renvoie parfois un 404.** Ce n'est pas une panne : c'est le travers
  documenté depuis le 28/07 (Google perd l'accusé de réception sur les exécutions longues), et le
  diagnostic est le plus long appel du portail — il recalcule les gardes réellement faites, année
  par année. Une relance passe. Correctif possible et refusé le 13/08 : ajouter `diagComplet` aux
  appels rejouables, ou découper le contrôle de l'historique.
- **Le « +0.0 garde · · » et le « (, ) » de la carte Équité** sont l'état AVANT réception des
  cibles, pas un défaut : le nom du MAR et l'axe restent vides tant que le calcul n'a pas de cibles.
  Arthur a refusé la correction — l'affichage se remplit seul, et la clé `cibles_{Y}` réduit encore
  la fenêtre.

---

## 12 août 2026 (nuit) — échanges et dons de gardes entre MAR : décisions de conception

**Objectif fixé par Arthur** : les échanges et dons de gardes se font **directement entre MAR depuis le
dashboard**, avec notification, **sans passage par le comité**. Le comité n'est pas dans la boucle, mais son
planning reste juste en permanence.

**Rien n'est implémenté. Ce bloc consigne les décisions et les questions ouvertes, avant tout code.**

### Ce qui existe déjà, et qui rend le projet plus court que prévu

- **Le chemin d'écriture est le bon.** `donGarde`, `echangeGarde` et `echangeGardeJours` (`Indispos.gs`
  l.1775-1830) écrivent déjà dans `GARDES_{année}` et republient. « Le comité voit le planning à jour en
  direct » est donc acquis sans rien construire — il suffit de changer qui déclenche.
- **Les règles dures sont côté serveur** : jamais deux gardes d'affilée, receveur libre le jour ET le
  lendemain pour son repos de garde, tout vérifié AVANT la première écriture (correctif 2026-08-05.12 :
  un geste est entièrement fait ou entièrement refusé). Elles s'appliqueront quel que soit l'appelant.
- **Le canal de notification existe** depuis le 12/08 (`notifierPush_` dans `miroir.gs` → Worker →
  abonnés, clés stockées par personne `notif_sub_{id}`).
- **Le contrôle des récups existe** (`admin.html` l.5461) : « chaque samedi tenu a sa récup, chaque récup
  son samedi ». Il deviendra le tableau de bord des R à replacer, sans rien ajouter.

### Décisions arrêtées

| sujet | décision |
|---|---|
| Circuit | MAR ↔ MAR, **aucune validation du comité** |
| Écriture | `GARDES_{année}`, chemin actuel inchangé |
| Récup du samedi, 2027+ | **suit automatiquement** — le lien samedi → R sera enregistré à la génération |
| Récup du samedi, 2026 | reste **manuelle** ; outil d'échange ouvert quand même |
| R impossible chez le receveur | **le comité tranche et le place à la main** |
| Unité vendredi-dimanche | contrainte de **génération seulement** ; après publication, chacun échange librement |
| Périmètre de départ | **le don à un collègue nommé**, pas la bourse ouverte |

**Pourquoi le don nommé et pas la bourse.** Chez Petal, la bourse aux gardes est précisément la
fonctionnalité qui suscite le plus de plaintes (règles de publication mal comprises, parcours mobile
pénible sur les cas complexes). « Je propose ma garde du 12 à Untel, il accepte » couvre l'essentiel et se
comprend sans notice.

### Le lien samedi → R : plus simple qu'attendu

**Vérifié, `generateur_gardes.gs` l.1274-1313** : le générateur parcourt `recupDue[id]` — la liste des
samedis tenus par chacun — et pose un R pour chacun, sous contraintes fortes (hors week-end, hors férié,
hors vacances scolaires, 2 à 16 semaines après le samedi, jamais deux R du même MAR à moins de 3 jours,
effectif minimum présent respecté). **Le couple samedi → date du R existe donc en mémoire à la génération,
et n'est jamais écrit.** L'enregistrer est un ajout de quelques lignes, sans toucher à la logique de
placement.

Aujourd'hui, faute de ce lien, `applyModification` déplace la garde et le repos du lendemain **mais jamais
le R** — le donneur garde sa récup, le receveur n'en a aucune. `admin.html` l.5071-5077 le documente et
avertit le comité au moment du geste. Ce garde-fou tient parce que le comité est dans la boucle et que le
volume est faible ; **il ne tiendra pas à 21 personnes sur téléphone.**

Note : un R transféré **à la même date** ne change pas l'effectif présent ce jour-là — ce critère de
placement est neutre lors d'un transfert.

### Règle d'échange retenue

Le nombre de samedis ne bouge que si **exactement un** des deux jours échangés est un samedi :

| échange | samedis modifiés | R à déplacer |
|---|---|---|
| samedi ↔ samedi | non | non |
| samedi ↔ autre jour | **oui** | **oui** |
| autre ↔ autre | non | non |

### Ce qui reste à construire

1. **Générateur** : enregistrer le lien samedi → R. GAS seul, testable au banc. ⚠️ **À livrer AVANT la
   génération de novembre**, sinon 2027 n'aura pas la correspondance et le mécanisme ne servira qu'à partir
   de 2028.
2. **Worker** : ouvrir l'abonnement aux notifications au rôle `mar` (`cloudflare/worker.js` l.407 —
   « phase 1 : rôle admin seul, à élargir à la phase 4, ICI et nulle part ailleurs »), et ajouter un
   **destinataire** à `/notif-envoyer`, qui diffuse aujourd'hui à tous les abonnés. Les clés étant déjà
   nominatives, c'est un argument à ajouter, pas une refonte. ⚠️ Déploiement du Worker **manuel** (tableau
   de bord Cloudflare) : chaque modification demande une manipulation d'Arthur.
3. **Demandes en attente** : état intermédiaire proposé / accepté / refusé / expiré — la seule pièce
   entièrement neuve. Onglet dédié au classeur.
4. **Écran dashboard** : proposer, accepter, refuser. Avertissement explicite au donneur d'un samedi en
   2026 : « votre récupération ne suit pas, le comité la replacera ».

### Question encore ouverte

**2026 : faut-il autoriser le don d'un samedi côté MAR ?** Décision d'Arthur : oui, les échanges et dons
sont ouverts dès 2026, la récup restant manuelle. Il reste une vingtaine de samedis sur l'année, volume
tenable à la main. À reconsidérer si le comité se retrouve débordé de R à replacer.

---

## 12 août 2026 (nuit) — la passe d'optimisation mesurée, et ce qu'un concurrent a fait découvrir

**D'où ça vient.** Comparaison avec Hopia, éditeur français de planification hospitalière (70+ établissements
annoncés, levée de 3,5 M€ en janvier 2025). Leur argument central est l'explicabilité : chaque décision de
l'algorithme doit pouvoir être justifiée. Point de départ d'un audit de notre propre générateur — dont trois
idées sur quatre ont été **écartées après mesure ou parce qu'elles existaient déjà**. Ce qui suit est le
résidu utile : des faits sur l'algorithme, pas des fonctionnalités.

### La borne de temps de l'optimiseur — mesurée, pas supposée

`generateur_gardes.gs` l.1160 : la recherche locale s'arrête sur `!changed` (convergence), 60 tours,
**ou 20 secondes**. Cette troisième porte est imprévisible : elle dépend de la charge du serveur Google.
Mesure sur **24 générations** (2027, 2028, 2029, 2032 × 6 tirages de congés, effectif démographique réel),
instrumentation appliquée **en mémoire** — le fichier du dépôt n'a pas été modifié :

| | |
|---|---|
| arrêts sur convergence | **24 / 24** |
| arrêts sur la borne de temps | **0** |
| tours effectués | 5 à 17 |
| durée de la passe | 1 854 à 6 519 ms (médiane 3 603) |
| marge avant la borne, pire cas | **3,1×** |

**Déterminisme vérifié** : 4 générations sur 2 jeux d'indispos → planning identique au caractère près
(empreinte SHA-256 des 728 affectations), même nombre de tours, même nombre de transferts. Cohérent avec
l'observation d'Arthur en production : mêmes données, même planning.

**Ce qu'on n'a PAS pu mesurer, et pourquoi.** La génération réelle du 10/08 tourne en **27,3 s**
(`doPost`, Version 262 ; 25,8 s de serveur au `chronoAPI`), contre 3 à 6,5 s au banc — mais ces 25,8 s
incluent la lecture des onglets et l'écriture de `GARDES_2027`, neutralisées au banc. Le facteur applicable
à la seule boucle d'optimisation (calcul pur, aucun accès tableur) est donc compris entre 1× et 5,7×.
**À 3× la borne des 20 s serait atteinte.** L'incertitude n'est pas levée.

⚠️ **Et le journal ne permettra pas de la lever.** Les exécutions de l'application web (`doPost`,
Version 262) **ne se déplient pas** dans le panneau Exécutions — seules celles lancées sur *Head* le font,
et « Journaux Cloud » est grisé faute de projet Cloud rattaché (constat d'observation du 12/08, non
recoupé avec la documentation Google). **Conséquence de méthode : ajouter un `Logger.log` pour diagnostiquer
l'application web ne sert à rien.** Tout chiffre de diagnostic doit revenir **dans la réponse**, jamais dans
le journal.

→ **À faire après le 04/09 — patch validé par Arthur le 12/08, à livrer dans le même lot GAS que le lien
samedi → R.** La borne n'est pas supprimée : elle cesse d'être silencieuse.

**Pourquoi ne PAS supprimer la borne.** Un tour coûte environ 380 ms au pire mesuré. Soixante tours font
23 s au banc, et jusqu'à trois fois plus en production : l'optimiseur seul dépasserait la minute, alors que
le navigateur abandonne à 90 s (`admin.html`). Le filet doit rester.

**AVANT** (`generateur_gardes.gs` l.1131-1162, version `2026-08-12.1`) :

```js
    const t0=Date.now();let moves=0;
    for(let pass=0;pass<60;pass++){
      let changed=false;
      …
      if(!changed||Date.now()-t0>20000)break;
    }
    Logger.log('Optimiseur: '+moves+' transferts');
```

**APRÈS** :

```js
    const t0=Date.now();let moves=0,tours=0,arret='convergence';
    for(let pass=0;pass<60;pass++){
      let changed=false;
      …
      tours=pass+1;
      if(!changed) break;
      if(Date.now()-t0>20000){ arret='limite de temps'; break; }
      if(pass===59) arret='plafond de 60 tours';
    }
    const _msOpt=Date.now()-t0;
    Logger.log('Optimiseur: '+moves+' transferts');
    logAction('Optimiseur '+year+' : '+moves+' transferts, '+tours+' tours, '+
              Math.round(_msOpt/1000)+' s — '+arret+'.');
    if(arret!=='convergence')
      warnings.push('Le calcul d\'équilibrage a été interrompu avant la fin. Le planning reste '+
        'valide, mais la répartition peut être un peu moins régulière. Prévenez l\'administrateur '+
        'du portail.');
```

**Deux destinations, et c'est le point.** Le chiffre technique part dans `logAction()` (`Indispos.gs`
l.789), qui écrit dans l'onglet **`LOGS`** du classeur — horodaté, 500 lignes conservées. Le comité ne le
voit jamais ; Arthur l'ouvre quand il veut. L'avertissement, lui, ne s'affiche **que si l'arrêt est
anormal**, en français de tous les jours, avec la conduite à tenir. Version initiale du patch rejetée par
Arthur, à juste titre : « Optimiseur : 312 transferts en 9 tours » dans l'encadré jaune n'aurait eu aucun
sens pour le comité.

**Et ça règle le problème de mesure de la nuit.** `Logger.log` est inaccessible pour les appels de
l'application web (exécutions `doPost` non dépliables) ; `logAction` écrit dans le classeur, donc lisible.
Après quelques générations, l'onglet `LOGS` donnera la série réelle en production — tours, transferts,
durée — et la variabilité d'Apps Script, aujourd'hui inconnue, se mesurera d'elle-même.

**Conditions de livraison** : incrémenter `GAS_VERSION_GENERATEUR` · banc complet lancé et annoncé chiffré
AVANT de livrer · GAS seul, donc pas de montée de version du site · Arthur recopie dans l'éditeur Apps
Script et déploie une nouvelle version.

### Sept mécanismes de placement, pas un seul

Relevé dans le code : rotation Noël/Jour de l'an (l.570), jours critiques résolus par série avec retour
arrière (l.687), souhaits (l.796), unité vendredi-dimanche (l.919), passe ordinaire par score (l.951),
ajustement de couverture (l.975), optimiseur global (l.1130), passe confort (l.1164).
**Seule la passe ordinaire répond littéralement à « X était mieux classé que Y ».**

### Un tiers des gardes sont déplacées après coup

Comparaison du planning **avant** et **après** l'optimiseur, sur 5 années simulées :
**222 à 267 affectations changées sur 728, soit 30 à 37 %**. Ce n'est pas un défaut — c'est ce qui fait
passer l'écart maximal de 5,0 à 1,3. Mais c'est un fait à connaître avant d'affirmer quoi que ce soit sur
« la règle qui a désigné untel ».

Un prototype de trace a été exécuté (six ancres d'instrumentation en mémoire) : sur **241 journées tracées**,
**66** ont retenu exactement les deux premiers du classement initial, **149** non — optimiseur ou passe
confort passés après. Une fiche « pourquoi ce MAR » aurait donc donné une réponse décevante deux fois sur
trois. **Idée écartée**, prototype non conservé.

### Deux idées écartées parce qu'elles existaient déjà

- **Le « mur des empêchés »** (qui pouvait prendre la garde ce jour-là, et pourquoi les autres non) :
  `admin.html` l.7335-7400 le fait déjà, et mieux — l'audit de couverture du W2 compte les MAR disponibles
  chaque jour de l'année, seuils 🔴 <4 / 🟠 4-5 / ✅ ≥6 calibrés sur 400 années simulées, **et liste qui
  libérer en priorité** par rang de vacances. Un outil d'action, pas seulement de constat.
- **La diapo « ce que dit la littérature »** : elle est dans `docs/presentation-staff.html` depuis juillet,
  avec ses trois chiffres sourcés et sa règle d'exclusion des données commerciales.

**Leçon de méthode, la même que d'habitude** : lire le dépôt avant de proposer. Les deux idées ont été
construites (maquettes HTML) avant d'être reconnues comme déjà présentes.

### Ce qui reste ouvert du côté concurrent

**Afficher l'horizon.** Hopia met en avant le passage de 3 semaines à 3 mois d'anticipation ; nous produisons
douze mois, et ce chiffre n'apparaît nulle part dans l'interface. Une ligne sur le dashboard MAR
(« planning publié jusqu'à fin 2027 ») suffirait — le bootstrap renvoie déjà `_boot.anneeSuivante`
(consommé dans `admin.html` l.3447). Petit patch, 3ᵉ chiffre. **Non fait, non urgent.**

**Ce qu'il ne faut PAS copier** : l'interopérabilité SIH/GTA (50+ flux : leur modèle économique, sans objet
pour 23 MAR) et le vocabulaire « IA » (leur moteur est un solveur de contraintes, comme le nôtre ; dire
« algorithme » reste plus juste devant des médecins).

---

## 12 août 2026 (soir) — v1.31.14 : identité visuelle, bandeaux mobiles, écrans de connexion

**Ce qui a changé pour l'utilisateur.** Le drapeau monégasque, qui servait d'icône et de logo
depuis l'origine, est remplacé par une marque propre au service : un groupe de silhouettes
surmontant un tracé de monitorage, blanc sur le rouge `#CE1126` déjà utilisé partout dans le site.

**Cinq fichiers d'icône remplacés** (`assets/`) : `favicon.svg`, `icon-192.png`, `icon-512.png`,
`icon-maskable-512.png`, `apple-touch-icon.png`, plus un `assets/logo.png` (144 px, 17,6 Ko)
pour les bandeaux. Le drapeau était dessiné en CSS (deux `<div>` empilés) à **11 endroits sur
8 pages** — tous remplacés par une balise `<img>`, sans toucher aux dimensions ni aux arrondis
existants.

**Trois pièges rencontrés, tous mesurés :**

1. **Coins arrondis peints dans l'image.** Le premier rendu avait un squircle dessiné avec des
   coins noirs. iOS et Android appliquent leur propre masque par-dessus : liseré noir garanti.
   L'icône doit être **carrée, le fond jusqu'au dernier pixel**.
2. **Zone de sécurité maskable.** Android rogne les bords : le motif de `icon-maskable-512.png`
   est réduit à 76 % pour obtenir 20 % de marge (mesuré : 19,9 % / 19,7 %).
3. **Le rouge généré n'est pas le rouge du site.** Mesuré `#DC0D1D` puis `#F0212E` selon les
   rendus, contre `#CE1126`. Recalé par décalage de la moyenne des pixels non blancs.

**Ce qui n'a pas marché** : la vectorisation automatique du dessin (potrace) ne ressort qu'un seul
contour. `favicon.svg` contient donc l'image en base64 — 19,6 Ko. Choix assumé : aucune balise
`<link>` à modifier dans les 7 pages qui la référencent.

**Bandeau du dashboard.** « Portail CHPG Monaco » passait sur 3 lignes et débordait du bandeau de
52 px sur iPhone. Remplacé par « CHPG » + « Anesthésie-Réa », logo porté de 28 à 34 px, et surtout
le bloc titre reçoit `min-width: 0` + troncature : **il ne peut plus structurellement déborder sur
les boutons**. Le sous-titre reste visible sur mobile et ne s'efface qu'en dessous de 360 px.

**Tuile « Mes gardes ».** La ligne principale faisait 50 caractères et passait sur 2 lignes.
L'étiquette disait « MES GARDES » et la ligne répétait « Prochaine garde ». Nouveau découpage :
étiquette « PROCHAINE GARDE », ligne principale `Mardi 01/09 · Réa` (17 caractères), sous-ligne
`Dans 20 jours · 45 autres à venir`. Fonction dédiée `_mgDateCourte()` : `staffDateParts()` sert
ailleurs et n'est **pas** modifiée. Le « voir tout » disparaît, redondant avec le chevron.

**Pastille du bandeau : les initiales, pas le nom.** Sur `dashboard.html`, la pastille affichait
« Dr Frohlich » alors que « Bonjour Dr Frohlich » est écrit trois centimètres plus bas. Elle
affiche désormais les initiales du classeur (`AFR`), repli sur les 3 premières lettres de
l'identifiant, `ADMIN` pour le comité. **Aucune modification serveur** : `initials` transitait
déjà dans la réponse de connexion (`gas/Indispos.gs` l. 2178 et `gas/miroir.gs` l. 836, colonne 3
de MEDECINS — la même source que le tableau de `staff.html`). Gain mesuré : la pastille passe de
134 à 67 pt.

**`index.html` : le bandeau portait 7 éléments.** Mesuré sur capture réelle (échelle 3 px/pt) :
logo 24 + Aide 75 + thème 30 + pastille 26 + année 68 + mois 97 = **320 pt sur 390**. La pastille
était compressée à zéro par `flex-shrink: 1` — les initiales y étaient déjà implémentées depuis
longtemps (l. 915), mais invisibles. Les sélecteurs année/mois ont été sortis du bandeau vers une
**barre « période » propre**, visible sous 768 px, sélecteurs centrés ; la barre de jour descend de
52 à 99 px. Les éléments sont **déplacés dans le DOM, jamais dupliqués** (`appendChild` du même
nœud selon la largeur, branché sur `checkMobile()`), ce qui préserve `id` et gestionnaires.
Le nom du service est ensuite revenu sur mobile (« CHPG / Anesthésie-Réa »), le bandeau est centré
et le logo porté à 34 px, comme le dashboard.

**Ce que le banc a apporté** (643 → 723 vérifications) :
- il a **détecté tout seul** la refonte de la tuile : un test cherchait « Prochaine garde » dans la
  ligne principale ; adapté, puis complété par 2 vérifications sur l'étiquette et le sous-titre ;
- il a **rattrapé une erreur de méthode** : le test « les 5 porteurs annoncent la MÊME version »
  a échoué et révélé que les 3 guides étaient restés en `v1.31.4` après un push. La recherche des
  porteurs n'avait porté que sur les pages racine, pas sur `docs/` ;
- 10 vérifications ajoutées sur le déplacement des sélecteurs : les deux sens, l'absence de
  duplication après 3 rotations d'écran, la conservation de la valeur choisie ;
- 11 vérifications sur la connexion (champ masqué, clé de session commune, code refusé retiré,
  `staff.html` qui ne doit **pas** lire la session MAR) et 5 sur la largeur de la barre d'onglets.

**Un faux défaut, à ne pas rechercher à nouveau.** Le thème « automatique » affichait toujours la
version sombre : l'iPhone était réglé en mode sombre. `matchMedia('(prefers-color-scheme: dark)')`
fonctionne. Le sélecteur reste à 3 positions (auto / clair / sombre), inchangé.

**Trois collisions en deux heures avec une autre conversation.** Deux sessions ont travaillé sur le
dépôt en parallèle. Résultat : un push refusé en 422 (sans dégât), puis une situation où **mes
fichiers auraient effacé en silence** les corrections « réponse perdue » de l'autre session — le
push aurait réussi, sans erreur visible. Seul le contrôle « la branche a-t-elle bougé depuis mon
clone ? » juste avant le PUT l'a évité. **Ce contrôle n'est pas facultatif.**

### Les écrans de connexion, et trois défauts trouvés en production

**Le drapeau se cachait ailleurs.** Après le premier lot, Arthur a vu que les écrans de connexion
portaient encore le drapeau. Cause : ces drapeaux-là étaient écrits **en style directement dans la
balise, sans classe** — une recherche par nom de classe ne pouvait pas les trouver. Cinq écrans
concernés (`index`, `dashboard`, `absences`, `crh`, `suivi-liberal`), bloc strictement identique
dans les cinq. `admin` et `staff` étaient déjà traités : ils utilisaient une classe.

**Les 8 écrans de connexion sont désormais identiques** : logo 48 px, coins 12 px, même ombre.
`admin` est passé de 40 à 48 px, `indispos` a quitté son cadenas dans un carré rouge, et
`docs/staff_gardes_demographie.html` est aligné. **Décision : pas de pastille « ADMIN »** — l'écran
admin annonce déjà « Espace Admin » et « CODE ADMIN », une pastille ferait redite.

**Nettoyage** : 18 règles CSS des bandes du drapeau supprimées sur 8 pages, plus `.login-logo svg`
devenue inutile. Vérifié classe par classe : plus aucune n'est utilisée dans le HTML.

**Deux défauts d'`indispos.html`, vus en production, pas par le banc :**

1. **Le code s'affichait en clair pendant la saisie** — `type="text"` au lieu de `type="password"`.
   Seule page du portail dans ce cas.
2. **La page redemandait le code alors que le MAR venait du dashboard.** Relevé complet des clés de
   session : `chpgViewCode` sur `index`, `dashboard`, `absences`, `crh`, `suivi-liberal` ;
   `adminCode` sur `admin` ; **rien du tout** sur `indispos` et `staff`. `indispos` lit et écrit
   désormais `chpgViewCode` ; `doLogin()` accepte un code repris en paramètre, et un code refusé
   est retiré sans laisser de message parasite.

**`staff.html` reste volontairement à l'écart** — vérifié dans son `doLogin` : il n'accepte que
`role === 'admin'` (le miroir renvoie `nonAdmin` sinon). Lui faire lire la session MAR n'aurait
servi qu'à tenter un code voué au refus. Le banc verrouille ce point.

**Défaut introduit par cette correction, et corrigé dans la foulée.** La reprise de session
appelait `doLogin()`, qui commence par **désactiver le bouton** et afficher « Connexion… ». Tant
que le serveur ne répondait pas — jusqu'à 20 s au réveil d'Apps Script — l'écran de saisie était
**figé** : le MAR ne pouvait même plus taper son code à la main. Vu en production par Arthur,
capture à l'appui.

**Troisième défaut d'`indispos`, trouvé par Arthur : on pouvait poser une indispo hors de
l'année de planning.** À partir du lundi 3 janvier 2028 pour l'année 2027. Les cases étaient bien
grisées, mais **`applyTool()` ne vérifiait jamais les bornes** — elle contrôlait les congés du
comité, les jours de TP et le quota, pas la date. Or le **serveur ignore ces dates en silence**
(banc T072) : le MAR croyait avoir déclaré, rien n'était enregistré. Le trou existait aussi avant
le début d'année (1er au 3 janvier 2027).

Correction : une fonction `bornesAnneePlanning(y)` — **une seule définition, utilisée par
l'affichage ET par la pose**, elles ne peuvent plus diverger — et un refus explicite dans
`applyTool()` avec le message « Hors de l'année de planning ». Bornes vérifiées sur cinq années :
2027 va du 04/01/2027 au 02/01/2028.

**Le banc a rattrapé un effet de bord** : `banc_tp.js` extrait `applyTool` seule et l'exécute
isolée ; les deux fonctions de bornes lui manquaient. Elles sont extraites de la page elles aussi,
jamais recopiées.

**Piège de méthode dans le test lui-même** : `YEAR` et `indispos` sont des variables de script
(`let`), invisibles depuis l'extérieur de la page. Un premier test les affectait depuis `window` —
sans rien toucher, et il « passait » pour de mauvaises raisons. On pilote la page par son propre
contexte (`window.eval`).

**Règle qui en découle : une tentative automatique ne touche JAMAIS à l'interface.** `doLogin()`
prend un second argument `silencieux` ; en mode silencieux il ne modifie ni le bouton, ni le champ,
ni le message d'erreur, et renvoie `true`/`false`. Si le MAR se connecte à la main pendant la
tentative, c'est sa saisie qui gagne. Reproduit puis vérifié au banc avec **un serveur qui ne
répond jamais** — le pire cas.

### La barre d'onglets du bas débordait de l'écran

**Mesure** : les 5 onglets exigeaient **410 pt** pour 390 pt d'écran (mot le plus long
« Médecins », 56 pt de texte à 12 px, plus 20 de padding et 3 de bordure). Le texte passait déjà à
la ligne sous l'émoji — non par choix, mais faute de place.

**La cause de fond n'est pas la taille de police** : un élément `flex: 1` **refuse par défaut de
descendre sous la largeur de son contenu**. Sans `min-width: 0`, aucun réglage de police ne
garantit quoi que ce soit. Correction : `min-width: 0`, police 12 → 11 px, padding 10 → 8,
écart 8 → 6, marge 16 → 12. **410 → 355 pt**, 35 pt de réserve. La barre n'existe que sur
`index.html` (vérifié sur tout le dépôt).

**Erreur d'analyse à ne pas répéter** : j'ai d'abord proposé de « passer l'icône au-dessus du
texte », ce qui se produisait déjà à l'écran. Le HTML écrit `📋 Planning` sur une seule ligne ;
c'est le rendu qui repliait. Lire le HTML ne suffit pas — il faut regarder la capture.

**Reste ouvert.** Les bandeaux d'`indispos`, `staff`, `absences`, `crh` et `suivi-liberal` n'ont
pas reçu le traitement d'`index` et `dashboard` : **trois styles coexistent**. Et `staff.html` et
`admin.html` utilisent tous deux un code admin sans partager leur session (`adminCode` n'est lu
que par `admin`) : le comité ressaisit son code en passant de l'un à l'autre.
Une adresse en nom de domaine propre a été chiffrée (`.mc` inaccessible — réservé aux entités
monégasques, 85 à 190 €/an ; `.fr` ≈ 10 €/an) mais écartée avant le 4 septembre : changer l'adresse
avec des codes déjà distribués est un risque gratuit.

---

## 11 août 2026 — v1.31 : les jours de temps partiel entrent dans l'équité des gardes

**Le défaut, trouvé en conversation, pas en production.** Les MAR à temps partiel posent leurs
jours de TP eux-mêmes, dans les indispos, après le staff — 26 jours pour un 90 %, 52 pour un 80 %,
soit **260 jours** pour le service. Or ces jours arrivent AVANT la génération des gardes, et
personne n'avait mesuré ce que l'algorithme en faisait à cette échelle : le banc n'en semait que
8 ou 9 par MAR, dispersés.

**Mesure faite sur le vrai générateur**, année 2027 complète (364 jours), effectif de même
structure que le service, congés et formations posés, puis 260 jours de TP ajoutés selon quatre
façons de poser (dispersés · même jour chaque semaine · semaines de 5 · accolés aux vacances) :

| profil de pose | jours non pourvus | « Manque MAR » | écart total max |
|---|---|---|---|
| aucun TP (référence) | 0 | 0 | 1,1 garde |
| dispersés | 0 | 0 | 0,8 |
| même jour chaque semaine | 0 | 0 | 0,7 |
| semaines de 5 d'affilée | 0 | 0 | 0,8 |
| accolés aux vacances | 0 | 0 | 0,8 |

**Conclusion : l'algorithme tient.** Les MAR peuvent — et doivent — poser leurs TP en même temps
que leurs indispos. Une seule faille, et elle est précise : dans le profil « même jour chaque
semaine », le 80 % qui pose ses 52 jours tous les jeudis a une cible de 5 jeudis et en fait **0** ;
ses 5 gardes retombent sur les autres. Idem pour le vendredi et l'axe vendredi-dimanche. Les 90 %
absorbent sans rien déplacer : 26 jours ne bloquent qu'un jeudi sur deux.

**Cause, vérifiée dans `generateur_gardes.gs`** : un jour fixe déclaré dans `MEDECINS`
(`tp_jours_fixes`) réduit la cible de cet axe-jour ; un TP posé dans les indispos ne la réduit
pas. `structAvail` ne regarde que date d'arrivée, date de départ et `CL`. Deux mécanismes pour la
même réalité, traités différemment.

**Poussé (1 commit, 8 fichiers)** :
- `indispos.html` — l'outil Temps partiel refuse samedi, dimanche et jours fériés. Un TP est un
  jour travaillé en moins : posé un samedi, il ne retire aucune journée de travail, il écarte
  seulement son auteur des gardes les plus lourdes.
- `admin.html` — `tpDesequilibres()` mesure, par MAR et par axe (samedi · vendredi-dimanche ·
  jeudi), le report que sa pose produirait sur les autres. Le récap d'ouverture du W2 l'affiche et
  **désactive le bouton Générer** au-delà d'une garde. Un TP posé un week-end ou un férié bloque
  dès le premier jour. Fonction globale et non repliée dans le wizard : pour être éprouvable au banc.
- `banc/banc_tp.js` — 17 vérifications neuves, sur le code réel des deux pages (extraction de
  fonction depuis le HTML, même principe que `extraireFonction` pour les `.gs`).

**Correctif v1.31.1, le jour même — la place restante compte TOUTES les cases occupées.**
Première version : seuls les jours de TP étaient comptés comme pris. Défaut découvert en préparant
le jeu de démonstration : un 80 % a ~7 jeudis déjà occupés par ses vacances, il ne peut donc poser
des TP que sur les 44 autres, et le calcul concluait qu'il gardait 7 jeudis de marge — c'étaient
ses congés, où il ne peut prendre aucune garde. Sa place réelle est zéro. Le contrôle laissait
donc passer le cas qu'il devait arrêter, et le « cas bloquant » était impossible à fabriquer.
Corrigé : sont comptés `TP`, `CTP`, `VAC`, `FORM`, `INDISPO`, `I`, `CL` — les mêmes codes que
`ABSENT_STRUCT` dans le générateur. `SOUHAIT` en est exclu : c'est une demande de garde, pas une
absence. Effet de bord voulu : quelqu'un qui concentre ses **vacances** sur un axe est désormais vu
lui aussi, avec un message adapté. Banc porté de 606 à 612.

**Le seuil a été corrigé par la mesure.** La première formule — cible × part bloquée — alertait dès
26 jours sur le même jour, alors que le générateur ne déplace rien à ce niveau. Règle retenue :
ce qui coûte aux autres n'est pas la part bloquée, c'est **la place restante**. Tant qu'il lui
reste au moins autant de jours de cet axe que sa cible, il tient sa part. 26 jeudis bloqués sur
51 → silence ; 51 sur 51 → 5 gardes reportées, blocage.

**Enseignement de méthode.** Le banc semait des TP, donc le cas semblait couvert ; il en semait un
tiers du volume et sans aucune concentration. *Un scénario qui contient le bon code de statut ne
prouve rien sur le volume ni sur la forme de la pose.* Le défaut n'est sorti ni du code ni du
banc : il est sorti d'une question sur le sens métier d'une case vide.

**Reste ouvert :**
- **Correctif de fond, décidé le 11/08 — dans l'AUTRE sens.** La première rédaction de cette entrée
  proposait de faire réduire la cible d'axe par les TP. **C'est interdit** : aucune façon de poser
  ses jours ne doit alléger sa part de gardes, sinon l'équité n'existe plus. Le blocage du W2 n'est
  donc pas un pis-aller en attendant mieux, c'est la réponse définitive.
  Ce qui reste à corriger est l'entorse inverse, déjà présente dans le code : un jour fixe déclaré
  dans `MEDECINS` (`tp_jours_fixes`) **met à zéro la cible de cet axe-jour** (`generateur_gardes.gs`,
  variable `_tpA`). Quelqu'un avec « jeudi » déclaré ne doit aucun jeudi ; ses jeudis vont aux
  autres. Sans effet aujourd'hui — la seule personne concernée ne prend pas de gardes — mais à
  supprimer. **Règle actée : un jour fixe de temps partiel ne peut pas tomber sur un jour surveillé**
  (samedi, jeudi, vendredi, férié) pour un MAR qui prend des gardes ; seuls lundi, mardi et mercredi
  sont admissibles. Trois gestes : retirer la réduction d'axe du générateur, refuser la saisie d'un
  jour surveillé dans la fiche MAR, et signaler toute configuration existante non conforme au
  diagnostic. Générateur → après le 4 septembre, avec mesure d'écart par axe avant/après.
- **Harnais de charge** — le banc qui exécute le vrai générateur sur une année complète avec
  260 jours de TP existe (il a produit le tableau ci-dessus) mais n'est pas intégré : il ajoute
  ~15 s au lancement. À trancher.
- **Guides** — la règle « un jour de TP se pose sur un jour ouvré » n'est écrite dans aucun guide.


## 10 août 2026 — refonte du guide technique

**Poussé** : `docs/guide-technique.html` réécrit intégralement (1 commit, page `docs/`, pas de
montée de version du site). 24 sections en 4 parcours (architecture · cycle annuel · exploitation ·
livrer/dépanner), chacune ouverte par un « En 2 minutes » et refermée sur un dépliable gris
« Repères techniques » qui isole les noms de fichiers et de fonctions.

**Motif de la réécriture** : la première version, livrée le matin, a été refusée — trop
technique, jargon non expliqué, schémas en caractères ASCII illisibles. Enseignement à garder :
*le guide technique est lu par un non-informaticien*. Le jargon va dans les blocs gris, les
schémas sont des boîtes CSS en couleurs, et un lexique de 10 mots ouvre le document.

**Faits réalignés sur la production** (l'ancien guide, du 15/07, était périmé sur cinq points) :
9 fichiers backend et non 5 · contrôle de dérive sur 9 fichiers et non 7 · 3 sauvegardes et non 2
(dont 2 non surveillées par `diagHebdo`) · journal d'intentions et veille refondue absents ·
marques Lu/★ décrites comme communes alors qu'elles sont par MAR depuis la v1.30. Le « livreur »
est volontairement omis tant qu'il n'est pas installé.

**Banc relevé le même jour : 546 vérifications, 25 scripts, tout au vert** (le chiffre de 440 en
tête de ce document datait du 05/08).

**Reste à faire, identifié en vérifiant les autres guides** — voir l'entrée « documentation » du
4 septembre : `guide-mar.html` annonce un mail de changement de planning que les MARs ne
reçoivent pas (mode test), `guide-comite.html` emploie le vocabulaire interdit (« Miroir »,
« Worker », « Journal d'intentions »), et `guide-fichier-maitre.html` ne documente pas l'onglet
`VEILLE_MARQUES`.

---

## 10 août 2026 — génération 2027 réelle : zéro défaut, et le piège de l'année planning

**Le nettoyage du miroir livré la veille a fonctionné en réel** (confirmé par Arthur) : suppression des
onglets et des JSON 2027 → synchronisation → disparition effective. Le banc prouvait la logique ;
l'infrastructure est maintenant vérifiée.

**Génération complète auditée** sur le `planning_2027.json` republié, fraîchement généré, **sans aucune
retouche** — donc exploitable, contrairement au relevé du 09/08 fait sur un planning servant de terrain
de test.

| contrôle | résultat |
|---|---|
| couverture | **364 jours, 1 G + 1 G2 chacun — aucun trou, aucun doublon** |
| équité (attribué vs fait) | **écart nul sur les 24 MAR** |
| samedis − récupérations | **solde nul sur les 24 MAR** (104 samedis, 104 récups) |
| jours portant 2 récups | **0** |
| gardes placées | 728 |

Parts : 34,6 à temps plein ; temps partiels à 29,3 · 31,1 · 27,7 · 17,3. PRUNET à 44 gardes, aucun
samedi ni dimanche ni férié — souhaits garantis, hors axes d'équité, conforme au code. BONNET et
BOUREGBA à zéro.

⚠️ **LE PIÈGE — une année de planning n'est PAS une année civile.** `GARDES_2027` court du **lundi
4 janvier 2027 au dimanche 2 janvier 2028** (semaines entières). Les 1ᵉʳ au 3 janvier 2027 appartiennent
au planning **2026**, où ils sont bien pourvus ; les 1ᵉʳ et 2 janvier 2028 appartiennent au planning
**2027** et sont comptés dans `STATS_GARDES_2027`.
Analysé à tort sur l'année civile, le même planning affiche **4 MAR en écart d'équité** et **2 MAR avec
une récup en trop** — tous artefacts. Recompté sur la fenêtre planning : **zéro partout**. Deux fausses
alertes émises puis rétractées le même soir.

✅ **Le seuil du contrôle des récups est donc bien ZÉRO, sans tolérance** — jusqu'ici déduit du code,
désormais mesuré sur une génération réelle. Et **`computeStatsLive` lit déjà la bonne fenêtre** (les
colonnes de l'onglet, pas une année civile) : aucune correction à faire au Diagnostic, contrairement à
ce qui a été envisagé.

---

## 9 août 2026 (après-midi) — répétition de vitesse sur PC : les trois pages sous 800 ms

**Rien poussé côté production.** Mesures seules (`chrono()`, navigation privée, PC).

| page | médiane | pire | sous 2 s |
|---|---|---|---|
| `dashboard.html` | 295 ms | 511 ms | 9/9 |
| `index.html` | 406 ms | 766 ms | 11/11 |
| `indispos.html` | ~215 ms (page 150 + miroir 65) | — | 1 ouverture décomposée |

31 ouvertures, **aucun repli Apps Script, aucun échec**. Le Worker a répondu entre 65 et
190 ms à chaque fois. Ressenti d'Arthur : « chargement quasi instantané » — c'était l'objectif.
**Téléphone (données mobiles, wifi coupé) : vérifié le 09/08 — aucune ouverture ressentie
comme une attente, sur les trois pages.** Contrôle **à l'œil, non chronométré** : le seuil de
2 s est justement celui où l'attente devient perceptible, et un raté se compte en secondes,
pas en millisecondes. Le jalon est donc clos, sans chiffre mobile au dossier.

**Piège de mesure, à connaître avant de recommencer.** Une première ouverture en navigation
privée contient la **frappe du code**, pas une lenteur : le dashboard affichait 5 788 ms pour
une page prête en 45 ms. Ne jamais lire le temps absolu d'un jalon — lire *page prête + durée
des appels*. Trois mesures ont d'abord été interprétées à tort comme des défauts.

**Mesure de l'écart attribué / fait sur 2026** (lecture du `planning_2026.json` servi, Drive).
2026 n'ayant pas été produite par le générateur, l'instantané `STATS_GARDES_2026` porte
l'attribution manuelle initiale ; le planning porte le résultat après une année d'échanges et de
dons. Cible et attribué collent partout (−5 à +8,4) ; **c'est le fait qui diverge : de +25 à −18
gardes, 18 MARs sur 23 concernés, 5 à zéro.** Ces écarts ne sont donc pas exploitables comme
mesure des échanges : ils mélangent l'héritage manuel et les mouvements réels. **La vraie mesure
sera possible fin 2027**, en comparant `GARDES_2027` à son propre instantané — première année où
les deux sortent du même générateur.

**Constats vérifiés en lecture de code sur `indispos.html`** (aucun n'est un défaut de vitesse) :
- **Le code d'accès n'y est jamais mémorisé** — aucun `sessionStorage` dans le fichier, alors
  que `dashboard.html` écrit `chpgViewCode`. Chaque rechargement impose de retaper le code.
  Aspérité d'usage pour la campagne d'octobre, à trancher, pas un défaut technique.
- `getVacConfig` = **4,4 s** (Apps Script, volontairement non bloquant). Le calendrier n'attend
  pas — mais **le quota de vacances affiché et le bouton CTP**, si : un MAR à temps partiel n'a
  pas son bouton pendant 4,4 s et voit son compteur changer sous ses yeux.
- Journal de connexion `login` = **3,0 s**, en appel classique. `dashboard.html` est passé à
  l'envoi à fond perdu le 06/08, `indispos.html` non. Sans effet visible ici (cette page n'a
  aucun témoin d'activité — vérifié). Qu'il ralentisse `getVacConfig`, parti à la même
  milliseconde, est une **hypothèse non mesurée**.
- **La page n'appelle jamais `PERF.jalon(...)`** : le bloc « Étapes » de `chrono()` y est
  toujours vide. Lire le journal des appels à la place.
- `_reveilAPI()` (l.740) est **défini et jamais appelé** (retiré le 01/08, décision documentée) —
  fonction morte de 3 lignes, à ranger avec le lot `OVERRIDES`. Ne pas rouvrir la décision.

---

## 9 août 2026 — audit des sauvegardes et des comptes, dépôt rangé

**Rien poussé côté production.** Trois commits, tous de documentation.

**Fait**
- **Cartes du dépôt remises d'aplomb.** `gas/README.md` annonçait 5 fichiers dans
  l'éditeur : il y en a 11, répartis sur 3 emplacements du dépôt. `docs/README.md`
  corrigé de même. C'était le vrai risque de désorientation après une pause, pas le
  nombre de fichiers.
- **Doublon retiré** : un `gas/hors-compte/` créé à tort, `docs/sauvegarde-compte-perso.md`
  couvrant déjà le sujet. Dépôt ramené à 126 fichiers.
- **`docs/roadmap.html`** : l'encadré ne décrivait qu'une sauvegarde sur trois et
  affirmait que le classeur n'était pas sauvegardé — faux pour deux des trois filets.
- **Worker Cloudflare comparé au dépôt** : identiques au caractère près
  (`miroir 2026-08-08.1`, même filtre de clés, mêmes 6 chemins, mêmes 11 fonctions).
  Premier contrôle de ce type possible.
- **Trois sauvegardes constatées actives** avec leurs dates réelles.

**Écarté pour l'instant**
- **Déploiement depuis le téléphone** : préparé, non installé (voir CONTEXTE).
  Arthur a jugé l'installation trop lourde avant le 4 septembre. On garde le
  copier-coller sur ordinateur.
- **`clasp`** : écarté définitivement — exige un ordinateur, ce qui est justement
  ce qu'on cherche à éviter.

**En suspens, sans urgence**
- Worker de test oublié chez Cloudflare (`cold-term-c753`, créé le 29/07, sans données) :
  à supprimer au tableau de bord, le connecteur ne sait pas le faire.
- Projet Apps Script homonyme dans le compte personnel : vestige à identifier.
- `backupHebdo` et `sauvegardeHebdo` divergent de conventions (compte de copies contre
  nombre de jours, Europe/Paris contre Europe/Monaco). Sans conséquence.
- Le classeur a triplé de taille en une semaine (89 Ko le 3 août, 260 Ko le 9) :
  cohérent avec les fichiers de démo 2027, à revérifier après le ménage.

---

## 8 août 2026 (soir) — v1.30.2 : l'année suivante ne coûte plus rien

**Défaut trouvé en partant d'une question d'Arthur** (« pourquoi chercher l'année
d'après ? »), pas d'une relecture.

`dashboard.html` allait chercher le planning N+1 **dès octobre**, pour la transition
décembre → janvier des tuiles « prochaine garde » et « mes congés ». Deux conséquences :

- Du 1<sup>er</sup> octobre à la génération de novembre, `planning_{N+1}` **n'existe pas** :
  le miroir répond vide, le code retombait sur Apps Script, et la tuile **attendait la
  réponse** (plancher mesuré ~2,5 s). Deux appels par ouverture, par MAR, pendant six
  semaines — en pleine campagne d'indisponibilités.
- Du 1<sup>er</sup> au 3 janvier, l'année de planning est encore la précédente alors que le
  mois vaut 0 : le seuil était faux, les gardes de janvier n'apparaissaient pas.

**Correctif (v1.30.2)** : plus aucune date en dur. La clé `planning_{active+1}` rejoint
**l'appel d'ouverture déjà existant** (`miroirBootDash`) — une clé de plus dans le même
aller-retour, donc zéro coût — et les deux tuiles la lisent **sans réseau**
(`_planDejaLa`). Tant que l'année suivante n'est pas générée, la clé revient vide et il n'y
a rien à afficher.

**Banc : 510 → 524 vérifications** (`banc/banc_annee_suivante.js`, 3 scénarios : année
suivante absente, présente, et absence du seuil dans le code). Contrôle négatif fait.
⚠️ Le contrôle « aucun appel Apps Script » est vert sur l'ancien code aussi — on est en
août. C'est le contrôle sur le code source qui épingle le défaut.

**Non prouvé** : que Cloudflare servira bien `planning_2027` le jour venu. Le banc prouve
la logique, jamais l'infrastructure — à confirmer en réel après la génération de novembre.

**Aussi livré ce soir** : illustrations des guides MAR et comité (6 images WebP, 59 Ko
au total, v1.29.1 puis réduites en vignettes v1.30.1) et **`docs/roadmap.html`**, vue de
pilotage courte, liée depuis ce document et depuis `docs/README.md`.

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

### Écraser son propre travail avec une copie locale — 10/08/2026

**Ce qui s'est passé.** La copie de travail du dépôt est extraite UNE FOIS en
début de session (`curl .../tarball/main`). Le matin, `docs/roadmap.html` a été
patché **directement en ligne** (commit `a119f5aa`). L'après-midi, la montée de
version v1.30.3 a reconstruit le même fichier **depuis la copie locale du
matin** — qui ne contenait pas le patch. Le commit `6e613794` a donc effacé une
carte entière de la vue courte. Constaté par Arthur, pas par le contrôle.

**Pourquoi le contrôle après push ne l'a pas vu.** Il comparait l'empreinte en
ligne à celle du fichier construit : les deux correspondaient, donc « vert ».
Ce contrôle prouve que le push a abouti, **jamais que le contenu poussé était à
jour**. C'est un contrôle de transmission, pas de contenu.

**La règle, deja écrite mais enfreinte** : repartir TOUJOURS de la version en
ligne, jamais d'une copie locale. À compléter par ceci : **une copie de travail
vieillit dès le premier push de la session** — y compris de ses propres pushs.

**Contrôle à ajouter avant tout push d'un lot** : pour chaque fichier, comparer
la version EN LIGNE à la version de la copie locale AVANT d'appliquer le patch.
Si elles diffèrent, re-télécharger et rejouer le patch dessus. Un `assert
live == base` par fichier suffit — il était présent sur les lots construits
directement depuis le live, absent sur celui construit depuis le tarball.

**Périmètre de la perte, vérifié fichier par fichier** : une seule carte. Les
quatre autres fichiers du lot (`admin.html`, `dashboard.html`, les deux guides)
n'avaient pas bougé depuis le 08/08, la copie locale était donc juste pour eux.
Rétabli par `ab82eee9`.

ℹ️ Au passage : l'API `contents` peut servir une version **en cache** juste
après un push (empreinte différente de celle attendue). Relire avec
`?ref=<sha du commit>` pour trancher — c'est ce qui a levé le doute ici.

### Reproposer ce qui existe déjà — deux cas le 09/08/2026

Dans une même séance, deux fonctionnalités ont été proposées ou analysées alors qu'elles
existaient : le **bilan personnel du MAR** (la vue Équité d'`index.html` a déjà ses boutons
« Initiale » et « Instantané ») et le **solde des récups de samedi** (déjà dans le Diagnostic
depuis le 01/08). Même cause dans les deux cas : **le ROADMAP a été lu à la place du code.**
Le document décrivait un chantier ouvert que la production avait déjà refermé.
→ Avant toute proposition : chercher la fonction dans le code, pas dans ce fichier.

### Le quota de temps de calcul — épée de Damoclès mesurée le 10/08/2026

**90 minutes par jour de tâches de fond** sur un compte gmail ordinaire
(6 heures sur un compte Workspace) — chiffre **vérifié à la source officielle**
Google, page mise à jour le 22/07/2026. Les requêtes des pages n'y comptent pas.

**Où on en est.** `journalAppliquer` tourne **toutes les minutes** (1 440 fois
par jour) à **3,5 s de moyenne** relevés sur 90 exécutions → **~84 minutes**.
Plus la synchro horaire, la veille, les sauvegardes. **Et pourtant rien ne
casse** : 2 échecs isolés en 7 jours sur ~10 000 exécutions, aucune rafale,
aucun message de dépassement.

**Hypothèse NON VÉRIFIÉE** expliquant l'écart : la durée affichée est le temps
**écoulé**, le quota parle de temps **machine**. `journalAppliquer` passe sa vie
à attendre (verrou 5 s max, puis appel réseau) sans calculer. Indice : les
durées vont de 1,3 à 14,3 s pour un travail identique — une dispersion qui ne
peut venir que de l'attente. Trancher demanderait d'instrumenter la fonction ;
**décision d'Arthur : ne pas complexifier**.

**Le symptôme, s'il tombe un jour** : « Service using too much computer time for
one day ». Les tâches de fond s'arrêtent **jusqu'au lendemain**, les pages
continuent normalement, **rien n'est perdu** — les intentions en attente
s'appliquent au passage suivant. Le dégât est un retard.

**Le remède, sans code, 30 secondes** : dans l'éditeur, passer le déclencheur de
`journalAppliquer` de 1 minute à 5 → coût divisé par 5. Prix : une action du
comité met jusqu'à 5 min à s'appliquer. **Sortie définitive** : compte Workspace
(90 min → 6 h, ~20 €/mois).

⚠️ Les quotas repartent **24 h après la première requête**, pas à minuit :
observer une continuité à travers minuit ne prouve rien.

**Autres plafonds passés en revue le 10/08 — aucun ne menace.** Emails 100/jour :
**déjà surveillé** à trois endroits (diagnostic, avant tout envoi groupé, avant
notifications) avec refus propre. Appels réseau 20 000/jour : ~1 500 utilisés.
Exécutions simultanées 30 : 24 MARs se connectant ensemble tiennent, et un
dépassement ne perdrait qu'une ligne de journal de connexion, l'affichage venant
du miroir. Versions de déploiement 200/script : Apps Script prévient.
Trace `PLANNING_CADUCS` plafonnée à 200 entrées pour une limite de 9 Ko
(~120 entrées) : l'écriture échouerait en silence et la liste du diagnostic
figerait — mais il faut qu'un placement soit contredit par un congé posé APRÈS,
soit quelques cas par an. **Non-sujet, à corriger si on touche le fichier.**

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
La version du site vit dans **un seul fichier : `version.js`** (`window.SITE_VERSION`, centralisé
le 14/08/2026). Les pages qui l'affichent chargent ce fichier et posent un élément `data-version` ;
aucune n'écrit plus de numéro en dur, et le banc comme le Diagnostic refusent qu'on y revienne.
Deux chiffres, pas trois : le troisième ne disait rien à personne dans le service.
Patch → 2ᵉ chiffre · **v2.0 réservée au 5/09**, jour où le portail s'ouvre aux 23 (l'ouverture vaut
un premier chiffre ; la version est un repère pour les utilisateurs, pas pour le développeur).
**Version en cours : v1.46** (17/08/2026).

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
2. ✅ **Répétition à blanc chronométrée — FAITE le 10/08. Le deck était faux d'un facteur trois.**
   Mesure réelle (`chronoAPI()`, génération 2027 complète) : `generateGardes` **28,5 s** (dont 25,8 s
   de calcul serveur), `publishPlanning` **9,5 s**, `envoyerRecapIndispos` **6,4 s** — soit **~45 s**
   du clic au récapitulatif parti. Le deck annonçait « 15 secondes » à **cinq** endroits ; corrigé en
   « moins d'une minute », notes d'orateur portées à ~45 s avec le détail.
   ⚠️ **Ne PAS toucher la 6ᵉ occurrence** (« chacun vérifie, en 15 secondes ») : elle parle du temps de
   lecture humaine du certificat, pas de la machine.
   **Le péage Apps Script est mesuré et constant : 1,7 à 2,9 s par appel, douze fois de suite**, quelle
   que soit la charge (19 ms de serveur pour `getJoursFeries`, 2,0 s d'attente). Les 9 appels de
   préparation du wizard coûtent **30 s dont 19 s de péage pur**, parce que `admin.html` sérialise ses
   appels (`_fileAPI`). Paralléliser les LECTURES les ramènerait à quelques secondes — chantier
   d'après le 04/09, jamais avant.
   ℹ️ Le message « toujours en cours, patience… » s'affiche automatiquement à **45 s** (`admin.html`) :
   à 28 s la marge est confortable, mais si Google traîne le jour J il apparaîtra. C'est prévu — noté
   dans les notes d'orateur : **ne pas recliquer**.
   ⚠️ **Une seule mesure** : la variabilité d'Apps Script n'est pas connue.
3. ✅ **Relecture du deck — FAITE le 09/08 (Arthur) : visuel correct.** Restait le seul contrôle
   qu'aucune machine ne fait. Ne subsiste, non vérifié, que le rendu **au vidéoprojecteur** de la
   diapo 16 (le rosé du repos du lendemain peut passer pour du blanc) — à regarder le jour même,
   sur le matériel de la salle.
4. Vérifier que les **profils indispos 2027 des autres MARs sont remplis** (annoncé à la salle).
5. **Notification de génération sur le téléphone d'Arthur** — ✅ **canal livré et prouvé le
   12/08** (notification de test reçue sur téléphone réel). Déjà câblé sur la fin de génération :
   rien à faire le jour J. Check-list d'avant-séance et détail : voir Priorité 2 ter, phase 1.
   La démo n'en dépend pas.
   `PERIODES_VAC` : ✅ déjà réglé sur 2027 (Arthur, 30/07).
   📌 **`PERIODES_VAC` ne contient qu'UNE année à la fois — celle qu'on prépare, et c'est normal.**
   `savePeriodes` (Indispos.gs l.1765) efface tout l'onglet et réécrit les périodes envoyées. Rien à
   sauvegarder, rien à restaurer : les deux seuls consommateurs (`getVacConfig` via `getIndisposYear()`,
   `getConflitsAll` via l'année passée en paramètre) travaillent **toujours sur l'année préparée, jamais
   sur l'année en cours** — vérifié en lecture de code le 30/07. Ne pas chercher 2026 dedans.

### La séquence du 04/09 — avant, pendant, après *(écrite le 17/08/2026)*

Trois moments, trois listes. Celle du soir (le ménage) existait déjà ; celles d'avant et de pendant
manquaient, et **deux points vérifiés dans le code feraient rater la démonstration** s'ils restaient
implicites.

#### AVANT — le 1ᵉʳ au soir (tout dans la foulée), puis le matin du 4

*(Réaligné le 19/08 sur la décision d'Arthur : « je fais tout dans la foulée de la démo —
démo puis effacement pendant ma garde du 01/09 ». L'ancien découpage J-7 (28/08) / J-1 (03/09)
est caduc.)*

**LE 1ᵉʳ SEPTEMBRE — répétition générale, seul, en 4G, pendant la garde** (détail en tête de
document). Elle génère 2027 pour de bon. **Donc remise à zéro LE SOIR MÊME, dans la foulée** —
les deux gestes sont indissociables : interrompu entre les deux, le bac à sable resterait généré.

**LE SOIR MÊME DU 1ᵉʳ — remise à zéro du bac à sable. ⚠️ POINT CRITIQUE, vérifié dans le code.**
Supprimer `GARDES_2027`, `STATS_GARDES_2027` et `LIENS_R_2027` — **garder `INDISPOS_2027`**, c'est la
matière première de la génération.
Pourquoi c'est critique : le wizard 2 contient une **garde d'idempotence** (`Indispos.gs`, action
`generateGardes`) — si `GARDES_{Y}` **et** `STATS_GARDES_{Y}` existent et sont cohérents, il **ne
régénère pas** : il renvoie les statistiques existantes et enchaîne sur publication et récapitulatifs.
Ce garde-fou est excellent en production (il empêche de détruire un planning valide après une réponse
perdue) mais **en démonstration il est fatal** : la salle verrait « 730 gardes » s'afficher
instantanément sans qu'aucun calcul n'ait eu lieu, et la répétition du 1ᵉʳ aurait justement laissé
les onglets en place. *Aucun message d'erreur n'apparaît : c'est un succès silencieux.*

**LE MATIN DU 04/09 — les 24 adresses mail, puis l'envoi des codes à 12 h 30.**
*(décidé par Arthur le 17/08 : le staff débute à 14 h, les codes partent en début d'après-midi.)*
*(Décidé le 19/08 : les adresses sont préparées À L'AVANCE dans une **colonne de garage** tout à
droite de `MEDECINS`, après PRENOM, en-tête « EMAILS_EN_ATTENTE » — vérifié : le code lit l'onglet
par positions fixes, une colonne au-delà de la 20ᵉ est invisible pour lui. Ne jamais INSÉRER de
colonne au milieu de l'onglet. Le matin du 4 : copier cette colonne dans EMAIL — en **valeurs** —
puis lancer le 🔍 Diagnostic : son contrôle « Emails au format douteux » sert de filet avant
l'envoi.)*
Les 24 MAR actifs sans adresse sont collés dans `MEDECINS`, colonne EMAIL, puis
Maintenance → **Envoyer aux MARs sélectionnés**. Les codes existent déjà (un seul MAR n'en a pas :
TRAN) — l'envoi **ne régénère rien**, il transmet le code en place.

**Ce que ce choix règle, et ce qu'il crée.** Envoyer une heure et demie avant la séance supprime
*entièrement* la fenêtre de curiosité : personne ne peut se connecter avant, donc plus aucun risque
qu'un MAR tombe sur des gardes 2027 fictives, et l'ordre nettoyage → envoi cesse d'être critique.
En contrepartie, **il n'y a plus de nuit pour rattraper une adresse fausse** : si un code ne
fonctionne pas à 14 h 05, c'est devant la salle. D'où la marge de 1 h 20 et le contrôle préalable.

| Heure | Geste |
|---|---|
| Matin | Nettoyage du bac à sable, JSON du Drive, synchronisation, désactivation de TRAN, saisie des 24 adresses |
| Matin, **en dernier** | **Diagnostic** — la ligne « MARs actifs sans code d'accès » doit dire **aucun**. Seul contrôle qui garantit que les 25 envois auront un code à transmettre |
| 12 h 30 | **Envoi d'essai à un seul destinataire** (Arthur). Vérifier la réception *et le dossier* |
| 12 h 40 | Envoi aux autres |
| 12 h 45 | Lire le compte rendu : il **nomme** ceux qui n'ont rien reçu, faute d'adresse ou de code |
| 14 h | Staff |

Quatre points vérifiés :

- **Lecture fraîche.** `sendCodes` relit `MEDECINS` directement (`getDataRange`), sans mémoire
  intermédiaire : une adresse saisie une minute avant est prise en compte. *Aucun délai à respecter.*
- **Quota.** Compte Google gratuit = 100 envois/jour. Avec 25 destinataires, `_quotaEmailInsuffisant_`
  laisse passer et il reste de quoi refaire un envoi complet le même jour. Le Diagnostic affiche le
  reste avant de partir.
- **L'ordre nettoyage → envoi reste la règle**, même s'il devient peu risqué à cette heure-là :
  `dashboard.html` demande `planning_{année active + 1}` **à chaque ouverture** depuis la v1.30.2, donc
  des fichiers 2027 encore publiés montreraient des gardes fictives au premier MAR qui se connecte.
- **TRAN** part le 01/09 : le désactiver avant l'envoi, sinon il figure dans la liste et le compte
  rendu le signalera « sans code ».

**Prudence sur l'envoi groupé** : 25 messages identiques partant d'une adresse Gmail en quelques
secondes, c'est le profil type de ce que les filtres écartent. L'envoi d'essai de 12 h 30 dit **dans
quel dossier** chercher — et permet de l'annoncer avec certitude plutôt que d'espérer.

**À dire dès l'ouverture de la séance, avant même la diapo 7** : « vous avez reçu il y a une heure un
mail de *planningchpg@gmail.com*, objet **[Planning CHPG Monaco] Votre code d'accès**. Sortez-le
maintenant — et regardez vos indésirables. »

#### PENDANT — ce qui doit être vrai au moment de la démonstration

| Ce qui doit être en place | Pourquoi |
|---|---|
| `INDISPOS_2027` présent et rempli | matière première de la génération en direct |
| `GARDES_2027` **absent** | sinon le wizard ne génère pas (garde d'idempotence) |
| Canal de notifications **ouvert** | fait le 16/08 par Arthur — sans quoi l'abonnement de la diapo 7 est refusé et aucun téléphone ne sonne à la diapo 28 |
| Codes reçus (envoyés à 12 h 30) | la diapo 7 leur demande d'installer l'app **et** de s'y connecter |
| Quota email disponible | les récapitulatifs de génération partent en fin de démonstration |

Deux gestes pendant la séance : **diapo 7**, faire installer l'app et activer les notifications
(vérifier à la voix) ; **diapo 28**, laisser sonner les téléphones avant de commenter.

#### APRÈS — le soir même

C'est la check-list ci-dessous, en 9 étapes numérotées. Un point change avec la distribution des
codes : à partir du 04/09, les 23 peuvent se connecter **et** échanger des gardes — l'interrupteur
d'ouverture ayant été posé le 16/08. L'annonce du 05/09 décrira donc une possibilité déjà active
depuis la veille.

### Ménage post-démo — check-list (à exécuter le 04/09 au soir, puis supprimer cette section)

> **Révisée le 16/08/2026.** Elle était complète le 10/08 ; trois choses sont entrées dans le système
> depuis (`LIENS_R_{Y}` le 13/08, l'onglet `ECHANGES` le 13-14/08, l'oubli des années au miroir le
> 09/08) et la dernière **impose un ordre**. Les étapes sont désormais numérotées dans l'ordre
> d'exécution : le ménage se termine par la synchro, jamais l'inverse.
>
> **Contexte 04/09 (confirmé par Arthur le 16/08)** : après la présentation on repart de zéro — tout
> le 2027 de démonstration est effacé — puis le **W1 s'ouvre le jour du staff vacances**, sur
> `staff.html`. La campagne qui s'ouvre en octobre est donc bien celle de **2027**.

**1. Supprimer les cinq onglets `_2027`** : `INDISPOS_2027`, `AFFECTATIONS_2027`, `GARDES_2027`,
`STATS_GARDES_2027`, **`LIENS_R_2027`** *(ajouté le 16/08 : cet onglet n'existait pas quand la liste a
été écrite — il est créé par le générateur depuis le 13/08 et suit le même cycle de vie annuel que les
quatre autres, `archiveMoveTabs_` le traite déjà comme tel)*.
Impératif, pas cosmétique : `initYear` (Indispos.gs l.≈2613) **refuse de tourner** si `INDISPOS_2027`
existe (« INDISPOS_2027 existe déjà ») → le W1 serait bloqué. Vérifié le 16/08 : c'est sa **seule**
précondition. Et `AFFECTATIONS_2027` n'étant recréé que s'il est **absent**, les affectations fictives
resteraient en place.

**2. `PLANNING_OVERRIDES` : supprimer les lignes datées 2027** — *constat du 10/08/2026, effet de bord
jamais anticipé.* Cet onglet est **UNIQUE, sans année dans son nom** : une simple liste
`DATE | MAR_ID | SECTEUR_MATIN | SECTEUR_AM | COMMENTAIRE`. Supprimer les onglets, les JSON du Drive et
relancer la synchro **ne le touche pas**. Or les overrides sont appliqués comme **dernier calque** à la
construction du planning (`code.gs` l.≈1075) : ils se recollent sur toute grille régénérée.
**Constaté par Arthur le 10/08** : après suppression des onglets, des JSON, synchro complète ET
régénération de 2027, ses placements de test étaient toujours là. **38 lignes datées 2027** au relevé du
16/08 (le Diagnostic les compte : bloc « Overrides planning », dates hors année en cours).
**Le risque n'est pas la démo, c'est NOVEMBRE** : ces lignes se colleraient sur la **vraie** génération
2027, indiscernables de vraies affectations. Silencieux, durable.
**Geste** : ouvrir `PLANNING_OVERRIDES`, trier par DATE, supprimer les lignes 2027. À la main.
⛔ **TRANCHÉ le 10/08/2026 : ce cas restera MANUEL. Ne pas le reproposer.** Supprimer une année à venir
est un geste rare et volontaire ; on est déjà dans le classeur à ce moment-là, un tri par DATE rend les
lignes évidentes, et cela ne justifie pas d'écrire du code qui efface des données. *(Une purge existe,
`setup_annee.gs` l.≈590, mais ne couvre que l'année archivée à la clôture — pas une année à venir
servant de terrain d'essai.)*

**3. `ECHANGES` : supprimer les lignes d'année 2027** — *ajouté le 16/08/2026, même piège que le point 2.*
Onglet **UNIQUE, sans année dans son nom**, créé par le circuit d'échanges le 13/08. Au relevé du 16/08 :
4 lignes réelles, dont **3 dons acceptés portant sur 2027**, faits pendant le test à deux du 14/08.
Vérifié dans le code : `getEchangesEnveloppe` publie **toutes** les lignes au miroir, sans filtre d'année
ni d'état — les 23 verraient donc, dans leur écran d'échanges, des dons portant sur une année qui
n'existe plus. Même geste : trier par ANNEE, supprimer les lignes 2027.

**4. `CONFIG` : retirer `INDISPOS_ACTIVE = 2027`** (bouton du wizard = `clearIndisposYear`, ou
suppression de la ligne). Deux raisons, dont une découverte le 16/08 :
- tant qu'elle est là, la tuile « Mes indispos » est ouverte aux 23 MARs sur une année fictive ;
- ⚠️ **elle bloque l'oubli du miroir** : `_miroirPurgerAnnees_` protège explicitement l'année de
  campagne (garde-fou 3, `getIndisposYear()`). Si la synchro tourne avant que cette ligne soit retirée,
  **aucune clé 2027 n'est effacée du miroir, et rien ne le signale.** D'où sa position ici, AVANT
  l'étape 6.

**5. JSON du Drive** (dossier « Planning-CHPG-JSON ») : supprimer `planning_2027.json`,
`affectations_2027.json` **et `planning_2027_notifie.json`** *(le notifieur dépose cette photo de
référence à chaque publication, même éteint)*. **Butoir dur : avant le 1er octobre.**
Tracé dans le code le 30/07 :
- `index.html` l.≈1119 sonde les années `2026 → année+1` avec `getAffectationsJson` : c'est
  **`affectations_2027.json` qui ouvre la porte**. Dès qu'il existe, **2027 apparaît dans le sélecteur
  de tous les MARs**.
- `dashboard.html` : depuis la v1.30.2 la demande de `planning_{active+1}` part à **chaque ouverture**
  (le seuil « dès octobre » a sauté le 08/08). Des JSON de démo laissés en place afficheraient des
  **gardes 2027 fictives** dans « prochaine garde » et « Mes congés ».
- `admin.html` : `anneeSuivante` n'ajoute que « 2027 — N+1 » au sélecteur du comité et fait passer le
  bandeau de clôture de ⛔ à 📦 — bandeau invisible avant le premier lundi de 2027. Sans effet en septembre.
- Session secrétariat : `getPlanningJson` n'est pas dans la liste blanche → aucun accès.
- ⚠️ Non prouvé en réel : supprimer les fichiers ne vide pas le cache `sessionStorage` (`chpgPlan:2027`)
  d'un onglet déjà ouvert — la copie en cache survit jusqu'à la fermeture de l'onglet.

**6. Lancer `miroirSyncComplet` — APRÈS les étapes 1 à 5, jamais avant.** C'est cette passe qui efface
du miroir les clés de l'année retirée (`planning_2027`, `affectations_2027`, `indispos_2027`,
`gardes_2027`, `stats_2027`, `equite_live_2027`, `joursferies_2027`, `liberal_2027`). Elle tranche sur
la **structure** — quels onglets `GARDES_{Y}` existent — donc l'étape 1 la conditionne, et l'étape 4
la débloque. Sans elle, supprimer onglets et JSON ne retire rien du miroir : c'est le défaut constaté
en production le 09/08.
*(`equite_live_` a été ajouté à la liste des clés effaçables le 16/08 — il manquait depuis sa création
le 13/08. Le banc compare désormais cette liste aux clés réellement construites par année : une famille
qui échapperait à l'oubli fait échouer le banc.)*

**7. Code d'accès de WS** : saisi devant la salle → « Régénérer le code » dans MEDECINS (`resetCodeMar`) :
nouveau code envoyé par mail, ancien tracé dans `HISTORIQUE`. Idem `ADMIN_CODE` (CONFIG, à la main) s'il
a été projeté.

**8. Mails : rien ne part tout seul.** Vérifié dans le code : `setIndisposYear` n'envoie aucun message ;
les envois sont des actions explicites (`sendCodesWithRecap`, `envoyerRecapIndispos`, `envoyerRecapGardes`).
Contrôler seulement qu'aucun bouton d'envoi n'a été cliqué — journal `HISTORIQUE` en cas de doute.

**9. Terminer par 🔍 Diagnostic système** (onglet Maintenance) : onglets, JSON du Drive, overrides hors
année en cours (doit retomber à 0), version du site.

**Avant le W1 d'octobre, indépendamment du ménage** : ⚠️ **24 MAR actifs sur 25 n'ont aucune adresse mail**
dans `MEDECINS` (relevé au classeur le 16/08). L'assistant 1 envoie les codes par mail — la campagne 2027
ne peut pas partir en l'état. Rien dans le code ne contourne une case vide.

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

### Priorité 2 ter — Échanges et dons de gardes entre MAR, par notification *(conception arrêtée le 11/08/2026 — phase 1 AVANCÉE avant la démo, décision Arthur du 11/08 ; phases 2-5 après le 04/09)*

**But.** Un MAR propose à un autre un don ou un échange de garde depuis son téléphone. L'autre
reçoit une notification, accepte ou refuse. S'il accepte, le planning s'écrit tout seul — le
comité n'intervient pas.

**Maquette du parcours : `docs/maquette-notifications.html`** *(11/08)* — 6 scènes (activation,
pastille, bannière, écran « Mes échanges », acceptation, double notification avec R déplacé).
C'est le **contrat visuel des phases 3-4** : les libellés exacts s'y figeront. Noms fictifs
uniquement, couleurs du portail.

**Existant (lu dans le dépôt le 11/08, pas dans un document)** :
- `applyModification` (`Indispos.gs` l.1617) sait déjà faire don, échange même date, échange deux
  dates, échange de secteur — avec les garde-fous d'août : rien n'écrase une garde existante, pas
  de gardes adjacentes, tout vérifié avant la première écriture. Fermée aux MAR par
  `if (user.role !== 'admin')` l.2216.
- Le portail est déjà une application installable (`manifest.webmanifest` complet, `sw.js` en place).
- Le Worker a son stockage (`env.KV`) et son jeton : c'est lui qui portera abonnements et envois.

**Manque** :
- `sw.js` : aucun gestionnaire `push` (vérifié : 0 occurrence).
- Worker : deux routes à créer — s'abonner, envoyer (la seconde protégée par le jeton existant).
- `donGarde` ne vérifie pas que le receveur est disponible : donner une garde à quelqu'un en congé
  écraserait son V sans un mot. **Lu, non testé.** Aujourd'hui c'est l'œil du comité qui l'attrape.

**Décisions arrêtées** :
1. **Expiration d'une demande sans réponse : 48 h**, rappel unique à 24 h ; au-delà, état
   « expirée » et demandeur notifié.
2. **Filtre par défaut de l'écran : mes demandes seulement.** Tout voir = un bouton.
3. **Les demandes vivent dans un onglet `ECHANGES` du classeur** (journalisé, relisable, cohérent
   avec le reste). Le Worker ne porte que les abonnements push (KV) et l'envoi. Le GAS orchestre :
   il écrit la demande, puis demande au Worker de notifier.
4. **Aucun plafond, aucune limite de concentration** : chacun est libre de ses gardes.
5. **Samedi qui change de mains : transfert d'un R futur** du donneur vers le receveur, jamais
   création d'un R neuf (les sept contraintes de pose vivent dans le générateur, l.1274-1310 —
   ne pas les dupliquer). Si le donneur n'a plus de R à venir : la demande se crée quand même, le
   comité est notifié. La notification annonce le R déplacé, aux deux.
6. **Bouton d'activation des notifications dans `dashboard.html`** (rôle admin d'abord) — pas dans
   `admin.html`, atteignable seulement par Safari, où iOS refuse le push hors installation.

**Contrainte posée par Arthur : les chargements restent quasi instantanés.** Conséquences :
- **Lecture : jamais le GAS, toujours le miroir.** L'écran « Mes échanges » et le badge du
  dashboard lisent le KV ; le GAS pousse l'état d'`ECHANGES` vers le KV à chaque écriture
  (création, réponse, expiration) — copie du mécanisme existant. Coût à l'ouverture : une lecture
  KV, quelques millisecondes.
- **Écriture : GAS, 2-4 s, assumé** — geste volontaire avec bouton et spinner, pas un chargement
  de page.
- **Le miroir peut être en retard, jamais faux au moment qui compte** : l'acceptation rejoue tous
  les contrôles côté GAS avant d'écrire. **Interdit** : toute « vérification fraîche » au GAS à
  l'ouverture d'un écran.

**Plan en 5 phases — 1 push par phase, chacun confirmé en production avant le suivant** :
1. **Prouver le canal — ✅ LIVRÉE ET PROUVÉE LE 12/08/2026** (16 jours avant le gel du 28/08).
   Commit `f0462dc`, site v1.31.4, banc 626 vérifications (591 + 35 nouvelles dans
   `banc/banc_notif.mjs`). **Test réel réussi** : notification `testNotificationPush` reçue et
   affichée sur l'iPhone d'Arthur (app installée, code admin), chaîne complète GAS → Worker →
   Apple → téléphone.
   **Ce qui est en place** :
   - `cloudflare/worker.js` (`miroir 2026-08-12.1`) : `/notif-cle` (clé publique), `/notif-abonner`
     (authentifié par code, **rôle admin seul, refusé côté serveur** — l'élargissement aux MAR se
     fera à la phase 4, à cet endroit et nulle part ailleurs), `/notif-envoyer` (jeton
     `PUSH_TOKEN`, chiffrement Web Push complet VAPID + aes128gcm exigé par iOS, abonnements
     morts 404/410 purgés au passage). Abonnements en KV sous `notif_sub_<id>`, préfixe absent
     de `CLE_VALIDE` : illisibles par `/read`, inatteignables par `/push` — prouvé au banc.
   - `sw.js` v3 : gestionnaires `push` + `notificationclick`, rien d'autre. Purge des caches
     des 23 faite une fois au passage v2→v3, sans incident. L'API GAS reste non interceptée.
   - `dashboard.html` (v1.31.4) : carte « Activer les notifications », visible **rôle admin
     seul** et si le navigateur sait faire. ⚠️ La carte n'apparaît qu'avec un **code admin** —
     un code de consultation MAR ne la voit pas (vécu le 12/08, premier réflexe si « je ne vois
     pas la carte »).
   - `gas/miroir.gs` (`2026-08-12.1`) : `notifierPush_()` **jamais bloquante** (tout échec avalé
     et journalisé) + `testNotificationPush()` lançable depuis l'éditeur.
   - `gas/generateur_gardes.gs` (`2026-08-12.1`) : notification « Les gardes {année} sont
     générées » en fin de génération réussie, dans un `try` séparé — une notification ratée ne
     fait jamais échouer une génération.
   - Secrets Worker : `VAPID_PUBLIC` + `VAPID_PRIVATE` posés dans Cloudflare (Settings →
     Variables and Secrets) le 12/08. La privée n'existe **nulle part ailleurs**. En cas de
     fuite : régénérer une paire, remplacer les secrets, chacun se réabonne — rien de grave.
   - Le banc joue l'iPhone : il s'abonne avec ses propres clés, reçoit la charge chiffrée et la
     **déchiffre réellement** (RFC 8291) ; signature du JWT VAPID vérifiée à la clé publique.
   **Marche de redéploiement** (si le Worker ou les .gs doivent être repris un jour) :
   ① coller `cloudflare/worker.js` dans le tableau de bord Cloudflare → Deploy ② recopier les
   .gs dans l'éditeur Apps Script → Déployer → Nouvelle version ③ les secrets VAPID survivent
   aux redéploiements, ne pas y toucher.
   **Scénario démo du 04/09** : à la fin de la génération devant la salle, le téléphone
   d'Arthur, posé face visible, reçoit « Les gardes 2027 sont générées » ; un toucher ouvre la
   page comité. Déjà câblé, rien à faire le jour J côté code. **La démo n'en dépend jamais** :
   si la notification n'arrive pas, personne dans la salle ne le sait.
   Check-list d'avant-séance : téléphone connecté avec le **code admin**, luminosité au max,
   notifications en mode « bannière sur écran verrouillé » (sinon arrivée silencieuse dans le
   centre de notifications).
   **Gel** : plus aucune modification de `sw.js` ni du canal avant le 04/09.
   **Décision du 12/08 (soir)** : l'ouverture du canal aux 23 avant le staff a été envisagée
   puis écartée — le canal est prouvé, ça suffit pour la démo ; l'ouverture se fera à la
   phase 4 avec l'écran, comme prévu. La phase 3 se construira hors production (code + banc
   complets, poussée seulement après le 04/09 avec son écran).
2. **Boucher `donGarde` — ✅ LIVRÉE LE 12/08/2026.** `Indispos.gs` `2026-08-12.1` :
   `refuseSiIndisponible` vérifie AVANT toute écriture que le receveur est disponible le jour
   de la garde ET le lendemain (son repos). Absences bloquantes : INDISPO, VAC, FORM, TP, CL,
   CTP, CP, A (même liste que le générateur). Un SOUHAIT ne bloque pas. Banc : 8 scénarios
   (5 refus feuille intacte, 3 non-régressions), total 634 vérifications.
   **Décisions du 12/08** : `gardeExceptionnelle` reste sans ce contrôle (jamais 3 MAR de
   garde le même jour — impossible en pratique, dixit Arthur) ; `echangeGardeJours` recevra
   le sien à la phase 3, avec les contrôles joués à la création des demandes.
   **Échange de gardes ADJACENTES — ✅ LIVRÉ LE 12/08/2026** (demande Arthur du même jour).
   `Indispos.gs` `2026-08-12.2` : le cas `date2 = lendemain de date` est traité à part dans
   `echangeGardeJours`. Les contrôles jugent l'état d'ARRIVÉE (vraies adjacences, disponibilité
   des jours reçus — règle de la phase 2 appliquée) et exigent l'état de départ exact du
   générateur (repos en place, cases libres), sinon « à traiter manuellement » — on ne devine
   jamais. Écriture de l'état final cellule par cellule : le repos de chacun suit sa nouvelle
   garde, les rôles G/G2 restent attachés aux dates. L'échange non adjacent est inchangé.
   Banc : 9 scénarios (nominal 6 cellules vérifiées, ordre inversé, G2, 5 refus feuille
   intacte, non-régression), total 643 vérifications. La dette technique « bug d'échange
   adjacent » est soldée par ce chemin.
3. **Cycle demande/réponse** (le gros morceau). Onglet `ECHANGES` : id, type (don/échange), dates,
   secteurs, demandeur, receveur, état (en attente / acceptée / refusée / expirée), horodatages.
   GAS : créer (contrôles de la phase 2 joués **dès la création**), accepter (rejoue les contrôles
   puis appelle `applyModification`), refuser, expirer (déclencheur horaire). Cas samedi : transfert
   de R (comité notifié si aucun R à venir). Poussée d'`ECHANGES` vers le KV. Notifications :
   réception d'une demande, réponse, rappel 24 h, R déplacé (aux deux). Banc : cycle complet,
   expiration et samedi-sans-R compris.
4. **Écran et ouverture aux MAR.** « Mes échanges » dans `dashboard.html` (lecture miroir
   exclusivement), bouton notifications ouvert à tous, levée du `if (user.role !== 'admin')`
   l.2216 **en dernier**. Montée de version site (2e chiffre) ; guides dans le même push.
   **Sas entre 4a et 4b** : quelques vrais échanges avec 1-2 volontaires (RW, WS) avant les 23 —
   un défaut à 3 utilisateurs se corrige tranquillement, à 23 il génère des appels.
   **Pastille d'icône (constat du 12/08, décision : phase 4)** : une notification web ne pose
   PAS de pastille toute seule sur iPhone — bannière et pastille sont deux mécanismes séparés,
   la pastille se demande explicitement (API de badge, iOS 16.4+, app installée). À brancher
   ici, où elle a un sens : posée à l'arrivée d'une demande (2 lignes dans le gestionnaire push
   de `sw.js`), comptée sur les demandes en attente, effacée à l'ouverture du portail (1 ligne
   dashboard). Volontairement PAS fait en phase 1 : toucher `sw.js` pour un confort sans rôle
   dans la démo violerait le gel — un seul chantier cohérent vaut mieux que deux retouches.
5. **Brancher le reste sur le tuyau** (plus tard). Planning republié, génération annuelle,
   ouverture de campagne, rappel de garde la veille — chacun un simple appel à la route d'envoi.
   Préférences par MAR (quoi, par quel canal) en dernier.

**Rollback** : chaque commit autonome, revenir = re-pousser le fichier précédent. Seule exception :
`sw.js` — une fois la version montée, on ne redescend pas, on remonte. Raison de plus pour que la
phase 1 soit minuscule.

**Les deux risques réels** : iOS et l'installation sur écran d'accueil (à vérifier tôt, phase 1) ·
le transfert de R (la seule logique neuve, phase 3 — le reste réutilise `applyModification` tel quel).

⚠️ **`sw.js` est servi aux 23 : toute montée de version purge leurs caches.** La seule montée
autorisée avant le 04/09 est celle de la phase 1 (18-20 août, un soir calme). Aucune autre.

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
- **Code mort — INVENTAIRE REFAIT SUR LE CODE EN LIGNE le 10/08/2026** (la description
  précédente était périmée : elle annonçait un lot de trois morceaux dont un n'existe plus).
  État réel, à traiter **après le 04/09** :
  - `gardeExceptionnelle` — action serveur **complète** (`Indispos.gs` l.1750), qu'aucun bouton
    n'appelle. Le morceau le plus substantiel et le plus délicat : c'est une **écriture dans le
    planning**. Avant de retirer, vérifier qu'aucun chemin ne l'atteint — pas seulement qu'aucun
    bouton ne la nomme.
  - `PLANNING_OVERRIDES` — **18 occurrences**, 9 dans `code.gs` et 9 dans `Indispos.gs`. C'est la
    partie sérieuse : elle touche l'écriture du planning dans les deux fichiers les plus critiques.
    Piège nommé le 30/07 et toujours valable : `_localOverrides` ne dit pas de quel système elle
    relève (`OVERRIDES` ancien, dont l'onglet n'existe plus, vs `PLANNING_OVERRIDES` actuel).
    Conséquence visible aujourd'hui : le panneau « Modifications en attente » d'`admin.html`
    affiche **toujours** « ✅ Aucune modification en attente ».
  - `_reveilAPI()` — 3 lignes dans `indispos.html` (l.740), définie et **jamais appelée** ; son
    appel est commenté depuis le 01/08, décision prise après mesure. Ne pas rouvrir la décision,
    juste retirer la fonction.
  - ✅ **L'écran « Paramètres » n'existe PLUS** dans `admin.html` — il n'en reste qu'un titre de
    section en commentaire. Le lot annoncé était donc surdimensionné d'un tiers.

  **Pourquoi ce n'est pas urgent** : rien n'est ralenti, rien n'est faux, aucun MAR n'est gêné.
  Le seul coût est de la confusion à la lecture, plus le panneau trompeur ci-dessus. En face, le
  risque est réel — 18 points d'écriture du planning. **Banc solide + vérification en production**,
  pas une fin de session.
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

### Jours de congé accordés en sureffectif — équité à surveiller *(piste du 10/08/2026)*

**D'où ça vient.** La bande de présence montre au comité, pour chaque jour ouvré, le nombre de
médecins présents en journée et les jours de sureffectif. Elle rend possible une décision qui était
auparavant un pari : accorder un jour de congé supplémentaire un jour où l'effectif le permet.

**Le risque, soulevé par Arthur.** Ces jours sont un avantage réel. S'ils profitent toujours aux
mêmes — les plus rapides à demander, les plus proches du comité, ceux qui pensent à regarder — le
mécanisme censé améliorer les choses crée une inéquité. Et **invisible** : ces jours ne sont ni
des gardes, ni des récupérations, ni des congés statutaires. Ils n'entrent dans aucun compteur.

> Le principe qui a fait l'équité des gardes s'applique tel quel :
> **ce qui se compte se répartit, ce qui ne se compte pas dérive.**

**Piste, non instruite** : tracer ces jours avec un motif distinct, et exposer un compteur par MAR
au même titre que les gardes et les récupérations.

**⚠️ Trois précautions avant toute ligne de code :**
1. **Vérifier d'abord que ça n'existe pas déjà.** Il y a des statuts de congés, une gestion des
   absences longues et un suivi par MAR — la recherche n'a pas été faite. Reproposer l'existant est
   l'anti-pattern nommé plus haut, commis plusieurs fois cette semaine.
2. **La question n'est pas technique.** C'est au comité de décider si ces jours doivent être
   équilibrés ou relever du cas par cas. Le système peut compter ; il ne peut pas trancher ça.
3. **Rien avant le 04/09.**

**À mesurer pour le retour d'expérience** (poster SFAR 2027) : nombre de congés supplémentaires
accordés avant et après. Ce serait un chiffre du service, pas un chiffre emprunté à la littérature.

### Valoriser le travail : poster SFAR 2027, puis article *(cadrage du 10/08/2026)*

**Objectif énoncé par Arthur : que le projet ne meure pas une fois en place.** Une publication est
la seule forme de survie qui ne dépend de personne — un système tenu par une seule personne
s'éteint avec elle, un travail publié reste citable et reproductible.

#### Ce qui a été décidé, et ce qui a été écarté

**Format retenu : retour d'expérience sur une année complète d'usage.** Cible : **poster / résumé
au congrès SFAR 2027**, puis éventuellement un article. Le poster d'abord, délibérément : format
court, on voit en direct si le sujet intéresse, et on rencontre ceux qui ont le même problème.

⛔ **ÉCARTÉ — l'enquête de satisfaction avant/après. Ne pas la reproposer.** Trois raisons, dans
l'ordre où elles sont apparues :
1. **Un avant-après juge l'état antérieur**, produit pendant des années à la main par des collègues
   du service. Demander à 24 médecins de le noter, même anonymement, revient à leur faire évaluer
   le travail de quelques-uns d'entre eux. Arthur va cosigner avec ces personnes.
2. **Biais d'annonce** : au moment où la mesure initiale aurait dû partir, l'équipe savait déjà
   qu'un changement était en préparation.
3. **Une mesure initiale après le 04/09 est impossible** — biais de rappel massif, les répondants
   reconstruiraient leur souvenir de l'ancien système à la lumière du nouveau.

*Une enquête reste possible en 2027-2028, comme travail distinct : sur le fonctionnement en place,
sans comparaison à ce qu'il a remplacé, et portée par le comité.*

**Conséquence pratique : aucune échéance avant le 04/09.** L'abandon de l'enquête supprime la seule
contrainte de calendrier du projet de publication.

#### Ce que le retour d'expérience rapportera — que des données calculées

| Donnée | Source | Quand |
|---|---|---|
| Équité de l'attribution initiale, 2026 vs 2027 | `STATS_GARDES_*` | **déjà relevé** (voir plus bas) |
| Couverture : jours sans effectif de garde complet | planning publié | déjà : **0** sur 364 en 2027 |
| Consultation de l'écran d'équité (combien de MAR) | journal | 2027 |
| Échanges et dons de gardes | journal | 2027 |
| Congés supplémentaires accordés en sureffectif | à définir | 2027, voir section précédente |
| Temps de production du planning par le comité | déclaratif, porte sur une **tâche** | sept.-oct. 2026 |
| Taux de complétion de la campagne d'indispos | système | nov. 2026 |

**Chiffres d'équité déjà mesurés (10/08/2026), sur l'attribution initiale avant tout échange :**

| | 2026, manuel | 2027, algorithmique |
|---|---|---|
| écart maximal à la part théorique | **8,4 gardes** | **1,3 garde** |
| écart absolu moyen | 3,06 | 0,55 |
| MAR à ±1 garde de leur part | 19 % (4/21) | 95 % (21/22) |

⚠️ **Mesurer sur l'attribution initiale, jamais sur le réel.** Les échanges et dons sont volontaires
et souhaités : certains MAR veulent moins de gardes, d'autres davantage. Les compter comme des
écarts mesurerait la liberté laissée aux gens, pas la qualité de l'attribution. *Le système
garantit un point de départ équitable ; ce qui suit appartient aux médecins.* Cette distinction
n'apparaît dans aucune publication existante — c'est un apport du travail, à expliciter.

#### L'angle : ce que personne n'a publié

**L'équité de TOUTE l'équipe est consultable par chaque MAR, à tout moment.** Ailleurs, l'équité
est une propriété que le logiciel garantit et que l'encadrement constate ; ici c'est une
information interne publique. Aucune des publications identifiées ne décrit cela.

S'y ajoutent : la règle d'attribution **publiée** plutôt qu'enfouie chez un éditeur · la
description complète du **coût réel** (0 €, du temps) · et la **dépendance à une personne**, à
écrire comme un résultat et non comme un aveu — c'est la première question d'un chef de service
qui lit l'article.

#### Modalités SFAR (vérifiées le 10/08, à reconfirmer)

- **3 500 caractères** maximum, espaces compris, pour l'ensemble du résumé.
- L'orateur doit être **à jour de sa cotisation SFAR** ou avoir réglé son inscription ; aucune
  communication n'est définitivement acceptée avant paiement de l'inscription.
- Recevabilité examinée sur les **dispositions éthiques** — préparer la réponse : données
  d'organisation interne, aucune donnée patient, aucune donnée de santé.
- ⚠️ **Ne pas venir présenter un résumé accepté expose à une interdiction de soumission de trois
  ans.** On ne soumet que si on est certain d'y aller.
- L'appel à communications 2027 n'était pas publié au 10/08/2026. **À surveiller vers décembre.**

#### Contexte bibliographique — INCOMPLET, à refaire

Identifié : Sumrall (*Ochsner J* 2025, anesthésie, logiciel commercial — sa limite déclarée est un
instrument de satisfaction **propriétaire**, ni items ni taux de réponse publiables) · Biot
(*Cureus* 2026, pédiatrie, système fait maison par un non-informaticien) · un outil en médecine
interne mesurant satisfaction et perception d'équité · Afonso (*Anesthesiology* 2021).

⚠️ **Cette revue est partielle** : pas d'accès à une base bibliographique depuis l'environnement de
travail (`eutils.ncbi.nlm.nih.gov` bloqué). À refaire avec des équations MeSH sur
`"Personnel Staffing and Scheduling"[Mesh]` **avant toute rédaction** — ne pas construire sur cette
bibliographie.

⚠️ **Que d'autres aient publié n'empêche rien** : l'amélioration de la qualité vit de la
réplication, et les auteurs d'Ochsner appellent explicitement d'autres services à reproduire avec
une méthodologie plus solide. Un tel travail n'a pas à être le premier, il doit être rigoureux et
transposable.

#### Signature

**Cosignature du comité recommandée** — non pour la méthode, mais pour le projet : un travail signé
du service ancre l'outil dans l'institution ; signé d'une seule personne, il reste l'affaire de
cette personne. C'est aussi la meilleure réponse au risque de dépendance à une personne.

### Notés le 19/08 — rien avant le 04/09

1. **La pastille « À publier » qui s'explique au clic** : liste des écarts (date, MAR, valeur
   locale / valeur publiée) + mention « publiés il y a X min, propagation en cours » quand c'est
   le cas. Supprime le « orange sans savoir pourquoi ».
2. **Battement de cœur du journal dans le Diagnostic** : horodatage du dernier passage de
   `journalAppliquer` (propriété de script), pour rendre visible un déclencheur arrêté — LOGS ne
   trace pas les passages à vide, il ne peut pas le faire.
3. **« Affectations sans fil fragile », volet B** *(le volet A — l'envoi différentiel — est LIVRÉ
   le 19/08 après-midi, v1.63)*. Reste pour septembre : **lecture depuis la copie rapide**
   (affichage instantané — le différentiel a rendu la fraîcheur de la base sans importance),
   **dépôt de l'Enregistrer au journal** (fiche « affectations », la republication quitte la
   requête du client), et **diagnostic déposé dans une clé miroir** relue par la page. Neutralise
   la classe entière des « Délai dépassé » sur réponses perdues, vécue le 19/08. Ordre de
   déploiement non négociable : Worker → `.gs` → synchro. Un fil de conversation dédié.
4. **Nettoyage opportuniste des `.gs` restants** (~35 lignes de tests jetables dans `code.gs`,
   `portail.gs`, `veille.gs`, `generateur_gardes.gs`) : à la prochaine recopie de chacun, jamais
   pour eux-mêmes.
5. **Éclaircir `pushFileToGitHub`** (`code.gs` l.1244) : le commentaire dit « sert encore à pousser
   les pages HTML », aucun appelant trouvé — trancher, puis supprimer ou documenter.

#### À ne pas perdre

1. **Temps de production du planning par le comité** — à demander en septembre-octobre, pendant
   qu'on s'en souvient.
2. **Figer les données 2026 complètes en janvier 2027**, quand l'année de planning sera close.

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

**Veille — FAIT le 08/08/2026 :**
- ~~Supprimer `gas/veille_dryrun.gs`~~ **fait** (dépôt le 08/08 au soir ; Arthur
  l'a retiré d'Apps Script avec la fonction `mesureEpubdate`, + nouvelle version).
- **Lu/★ par MAR — LIVRÉ et VALIDÉ EN PRODUCTION le 08/08** (v1.30 ; `veille.gs`
  2026-08-08.5, `portail.gs` .2, `miroir.gs` 2026-08-08.1, Worker 2026-08-08.1).
  Tests passés : solo (marques visibles dans `VEILLE_MARQUES`) et **croisé à deux
  vrais codes** (deux MARs, deux états indépendants). Les 6 points du plan tenus :
  ① onglet `VEILLE_MARQUES` creux (une ligne par couple MAR×article touché) ;
  ② clé `veille_marques` filtrée par le Worker **pour tous les rôles, admin
  compris** ; ③ accroche miroir après `markVeille` ; ④ colonnes LU/STAR partagées
  abandonnées (plus lues ni écrites — retrait physique plus tard) ; ⑤ v1.30 avec
  retrait de l'option morte « Thèmes » ; ⑥ **file locale de marques** rejouée
  jusqu'à confirmation — le dernier « à fond perdu avec échec avalé » portant des
  données utilisateur est fermé (doctrine des écritures). Banc : deux MARs isolés,
  admin filtré, transport coupé → rejeu à la réouverture — 510 vérifications.
  **Gel jusqu'au 4/09 : plus rien ne bouge.**
- ✅ **Audit des écritures — CLOS le 09/08/2026.** L'appelant était dans
  `docs/module-liberal/estimateur-liberal.html` (l.1053 et 1068). `declareLiberal` et
  `deleteLiberal` relèvent de la **catégorie 2 : attendues, erreur visible** — bouton désactivé
  pendant l'appel, message « Échec : … » / « Suppression impossible : … » en cas d'échec, puis
  relecture de la liste **depuis le serveur** (pas de confirmation optimiste). Le `catch` d'`apiLib`
  n'avale rien : il rend `{success:false, error:'réseau'}`, que l'appelant affiche. Délai max 20 s.
  ⚠️ **Réserve, à traiter avant l'ouverture du module aux 19 autres** : ni journal ni file de rejeu
  local. Réseau coupé au moment de valider → le MAR voit l'erreur mais **sa saisie est perdue et
  doit être refaite**. Acceptable tant qu'Arthur est seul ; à revoir le jour de l'ouverture.

### Ouverture des topos/protocoles — LIVRÉ le 10/08/2026 (v1.30.3)
**Le geste le plus cher du portail est supprimé.** Mesure du 08/08 :
`getProtocole` **6,1 s**, `getTopo` **11,5 s**, quand tout le reste de la page
arrivait du miroir en 100-270 ms — 50 à 100 fois plus cher que n'importe quel
autre geste, et le seul appel lourd que 23 MARs pouvaient empiler.

**Livré en trois étapes séparées, la dernière seule touchant une page :**
1. **Inventaire** (aucun code). Voir plus bas : le chiffre annoncé était faux.
2. **Copie** (`worker.js` + `miroir.gs` 2026-08-10.1). `miroirDocuments` dépose
   au miroir **UN document par heure** dont la date de modification a changé,
   sous la clé `doc_<idDrive>`, avec **exactement la forme de `getTopo`**
   ({success,name,mimeType,dataB64}) — d'où une bascule qui ne change que la
   SOURCE. Un seul par passage : encoder puis transmettre plusieurs Mo est long,
   et cette tâche ne doit jamais saturer le quota de déclencheurs. À la fin de
   cette étape, les copies existent et **personne ne les lit** : régression
   impossible.
3. **Bascule** (`dashboard.html` v1.30.3). `_lireDoc` lit la copie ; **si elle
   manque, repli sur l'ancien chemin**. Un document non copié reste LENT,
   jamais cassé. Vaut pour topos et protocoles.

**Installation (faite le 10/08)** : Worker d'abord → `miroir.gs` recopié (pas
besoin de déployer : tâche de fond) → `miroirDocumentsInstallerDeclencheur()`
une fois → 18 appels manuels de `miroirDocuments` pour tout copier d'un coup
(les exécutions manuelles ne comptent pas dans le quota des déclencheurs).
Résultat : `restants: 0`, 0 écarté, 0 erreur.

⚠️ **L'inventaire d'étape 1 était FAUX : 18 documents, pas 17.** Cause : la
recherche Drive interrogeait le **type déclaré**, alors que le code accepte
aussi tout nom finissant par `.pdf` quel que soit son type. Le code est plus
large que la recherche — et c'est lui qui fait foi. Conséquence : le total de
30,6 Mo est un **minorant**, le 18ᵉ document n'a pas été identifié.

**LIMITE POUR LES DÉPÔTS À VENIR : 8 Mo par PDF, viser 2-3 Mo.** Ce n'est pas
le stockage qui contraint (25 Mo par clé) mais la **mémoire du Worker**
(128 Mo) : recevoir un envoi le fait lire, analyser puis contrôler, soit ~3
copies en mémoire. À 14 Mo on frôlait 120 Mo. Au-delà de 8 Mo le document est
**écarté** (jamais cassé : il reste servi par l'ancien chemin) et signalé.

**Compression — ce qui marche et ce qui ne marche pas.** « Ablation de la FA »
est passé de **14,08 à 5,67 Mo** (÷2,5) : c'était un export PowerPoint, ses
images étaient des PNG non compressés. À l'inverse **« Échographie » (4,27 Mo)
GROSSIT** quand on le comprime — ses 236 images sont déjà optimales. Un PDF
déjà optimisé ne descendra pas : ne pas insister, il passe de toute façon.

⚠️ **RESTE À FAIRE : éprouver le repli en réel.** Le banc le prouve, pas
l'infrastructure. Protocole : supprimer un PDF du Drive → lancer
`miroirDocuments` (la copie s'efface) → remettre le fichier → l'ouvrir avant la
copie suivante. Il doit s'ouvrir, lentement.

- Rappel d'exploitation : après re-collecte ou modification de `getVeille()`,
  lancer `miroirSyncComplet()` — la clé `veille` n'est rafraîchie que par la
  synchro horaire.
- **Entretien des onglets VEILLE et VEILLE_MARQUES (à concevoir ~novembre 2026,
  chiffres en main)** : constat du 08/08 — AUCUN auto-nettoyage, la fenêtre de
  180 j ne borne que la collecte ; ~2 000 articles/semestre s'accumulent sans
  fin, l'instantané miroir les charge tous. Prévoir une fonction **MANUELLE**
  `purgerVeille()` (jamais un déclencheur : règle de l'archivage — aucune
  suppression automatisée) : retire les articles au-delà de `PURGE_MOIS`
  (VEILLE_CFG, ~12 mois) ET leurs marques dans VEILLE_MARQUES, annonce le
  compte au journal, et ne touche JAMAIS un article encore ★ chez quelqu'un.
  À lancer par Arthur quelques fois par an, comme l'archivage.

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

⚠️ **Pour bumper la version : 5 fichiers, 11 emplacements.** *(Historique de ce compte, qui a
faux deux fois : le paragraphe annonçait « 5 fichiers, 9 emplacements » en comptant
`docs/guide-technique.html`, qui ne porte aucune version — corrigé le 29/07/2026 en « 4 fichiers,
10 emplacements ». Ce chiffre-là était juste le jour où il a été écrit, puis `docs/roadmap.html`
a été créé et personne n'a rouvert la table : le 14/08/2026, une session s'y est fiée et a oublié
ce cinquième porteur. **C'est le banc qui a refusé le push**, pas la relecture. Morale inchangée
et vérifiée deux fois : chercher les marqueurs dans le dépôt, ne jamais recopier ce tableau.)*

| Fichier | Emplacements |
|---|---|
| `dashboard.html` | `const SITE_VERSION = 'vX.Y'` · badge `id="verBadge"` en dur · marqueur `// SITE_VERSION:` |
| `admin.html` | idem (3 emplacements) |
| `docs/guide-mar.html` | `Version <strong>vX.Y</strong>` · marqueur `<!-- SITE_VERSION: -->` |
| `docs/guide-comite.html` | idem (2 emplacements) |
| `docs/roadmap.html` | bloc « État vérifié », ligne `Site` (1 emplacement) |

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
- [x] 🪞 **Répétition générale chiffrée — CLOSE le 09/08.** PC (chiffres en tête de document) :
  dashboard 295 ms médiane / 511 ms pire · index 406 / 766 · indispos ~215. 31 ouvertures,
  0 repli, 0 échec. Téléphone en données mobiles : vérifié à l'œil, aucune attente perceptible.
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
  1. ✅ **Solde des récupérations de samedi — LIVRÉ le 01/08, dans le Diagnostic système.**
     `Indispos.gs` l.393-412 calcule `sat − recupR` par MAR via `computeStatsLive` et signale
     nominativement « X récups manquantes » / « X récups en trop — à corriger dans l'onglet
     Statuts ». Conditionné à `Y >= PREMIERE_ANNEE_STATS_FIABLES` : muet sur 2026, actif sur 2027.
     **Le replacement du R reste MANUEL** (décision Arthur) : l'outil affiche, il ne corrige pas.
     ⛔ **La calibration annoncée ici est SANS OBJET — le seuil est ZÉRO.** Le générateur garantit
     la pose de tous les R par son repli en deux passes sur toute l'année (section 9), y compris
     pour les samedis de fin d'année : la phrase « les samedis de novembre-décembre repartent sans
     R », écrite le 01/08, était **fausse**. Vérifié deux fois le 09/08 — en lecture du code, et sur
     `planning_2027.json` : **104 R posés pour 102 samedis tenus, aucun jour à deux R**.
     Tout écart non nul est donc un geste manuel resté à faire, jamais du bruit de calendrier.
     ⚠️ Ce relevé porte sur un planning déjà retouché (terrain de test admin d'Arthur) : seul le
     TOTAL est exploitable, la répartition par MAR ne l'est pas. Sans conséquence, le seuil vient
     du code, pas de la mesure.
     ✅ **Réglé le 01/08 : un samedi couplé à un jeudi ou un lundi férié ouvre bien un R** — l'unité
     de 3 jours donne une récup, pas deux. Rien à changer.
  2. ⛔ **Dette inter-annuelle — TRANCHÉ le 09/08/2026 : elle reste calculée sur le PLANNING
     GÉNÉRÉ, pas sur les gardes finales.** Le point avait été ouvert le 01/08 comme un défaut à
     corriger (`computeStatsLive` avant la copie vers `HISTORIQUE`) ; il est **écarté**.
     **Raison :** un don comme un échange est **volontaire des deux côtés**. La dette existe pour
     rattraper ce que l'algorithme n'a pas pu donner, pas pour défaire un arrangement entre
     collègues. Qui prend des gardes en plus par choix ne doit pas voir sa part baisser l'année
     suivante ; qui donne a été soulagé, il n'a pas à être remboursé.
     **Ordre de grandeur, à connaître avant de rouvrir :** la dette est écrêtée à ±2 par axe puis
     amortie par `DETTE_AMORTI = 0.6` (`generateur_gardes.gs` l.301-302) — l'effet maximal sur une
     cible est de **±1,2 garde**, quel que soit l'écart d'origine. L'enjeu du choix n'a jamais été
     de 25 gardes, il est de 1,2.
     ⚠️ **Conséquence à tenir** : tout écran qui montrerait l'écart attribué/fait doit dire que ces
     gardes **ne modifient pas la part de l'année suivante**. Si la décision change un jour, cette
     phrase change avec elle.
  3. ⛔ **Bilan personnel annuel du MAR — ABANDONNÉ le 09/08/2026, la fonction existe déjà.**
     La vue Équité d'`index.html` porte **deux boutons, « Initiale » et « Instantané »** (l.797-798),
     le second appelant `getStatsLive` — donc le recomptage échanges et dons compris. Chaque MAR
     peut déjà voir l'écart entre ce qui lui a été attribué et ce qu'il a fait, en un clic, depuis
     le planning. Le bilan proposé n'était qu'un habillage. Deux maquettes produites puis jetées.
     Le cas PRUNET (souhaits garantis, jours choisis = cible, hors axes d'équité) est lui aussi
     déjà traité, l.2429. **Erreur de méthode à retenir : la faisabilité avait été vérifiée dans le
     producteur des données avant de regarder si l'écran existait.**

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

- [x] **Étape 3 — FAITE le 29/07** (case cochée le 19/08, elle contredisait le ✅ trois écrans plus haut) : retirer les tables en dur (`SECTEURS`, `CS_TYPES`, `CS_REQUIRED`,
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
