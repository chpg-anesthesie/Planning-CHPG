# Sauvegarde hors-compte du classeur Planning-CHPG

> ⚠️ **Ce script ne fait PAS partie du projet Apps Script du planning.**
> Il s'installe dans le **compte Google personnel d'Arthur**. C'est tout l'intérêt :
> sur Drive, **un fichier appartient à celui qui le crée**. Une copie faite par le
> compte `planningchpg` lui appartiendrait encore, et disparaîtrait avec lui.
> Ne jamais le coller dans `gas/` ni dans l'éditeur Apps Script du classeur.

## Pourquoi

`backupHebdo()` (`code.gs`) copie déjà le classeur chaque lundi vers 4 h dans le dossier
Drive `Planning-CHPG-Backups`, avec rotation sur 8 copies. Mais cette copie est **dans le
même Drive, sous le même compte** que l'original : elle protège d'une fausse manœuvre ou
d'un onglet effacé, **pas** d'un compte compromis, suspendu ou fermé — dans ce cas
l'original et les 8 copies partent ensemble.

Principe retenu : **la sauvegarde va chercher, elle n'est pas envoyée.** Un compte tiers
tire la copie ; compromettre la source ne compromet pas les sauvegardes.

Une copie Drive emporte le **script attaché** au classeur, contrairement à un export XLSX —
c'est pourquoi l'envoi d'un XLSX par mail a été écarté.

## Installation

1. Se connecter au **compte Google personnel** (surtout pas `planningchpg`).
2. Aller sur <https://script.google.com> → **Nouveau projet**, le nommer
   « Sauvegarde Planning-CHPG ».
3. Coller le code ci-dessous, en remplaçant `ID_CLASSEUR` par l'identifiant du classeur
   maître — c'est la portion de son URL entre `/d/` et `/edit` :
   `https://docs.google.com/spreadsheets/d/`**`CETTE_PARTIE`**`/edit`
4. Depuis le compte `planningchpg`, **partager le classeur** avec le compte personnel.
   Voir « Niveau d'accès » ci-dessous.
5. Exécuter **une fois** `sauvegardeHebdo` à la main : Google demande l'autorisation
   d'accéder à Drive, l'accepter.
6. Exécuter **une fois** `installerDeclencheur` : la sauvegarde tournera ensuite toute
   seule chaque dimanche vers 5 h.

## Niveau d'accès — à vérifier au premier essai

Le point non tranché : **la lecture seule suffit-elle pour que le script attaché suive la
copie ?** Elle suffit certainement pour les données, pas forcément pour le script.

Marche à suivre : partager d'abord en **Lecteur**, lancer `sauvegardeHebdo`, ouvrir la
copie obtenue, puis **Extensions → Apps Script**.

- Le code est là → garder Lecteur, c'est le réglage le plus sûr.
- Le code est absent → repartager en **Éditeur** et refaire l'essai.

Passer en Éditeur élargit la surface d'exposition : le compte personnel pourrait alors
modifier les données de production. C'est un compte maîtrisé, mais autant le décider en
connaissance de cause plutôt que par défaut.

Rappel utile : **le code GAS est déjà à 100 % dans le dépôt GitHub.** Perdre le script
attaché est un coût de réinstallation, pas une perte de données. Le seul actif
irremplaçable est le **classeur** — indispos, gardes, historique, statistiques.

## Le code

```javascript
/**
 * Sauvegarde hebdomadaire HORS-COMPTE du classeur Planning-CHPG.
 * À installer dans le compte Google PERSONNEL, jamais dans le projet du planning.
 * La copie est créée par CE compte, donc elle lui appartient : rien de ce qui
 * arrive au compte planningchpg ne peut l'atteindre.
 */

const ID_CLASSEUR = 'COLLER_ICI_L_IDENTIFIANT_DU_CLASSEUR';
const NOM_DOSSIER = 'Sauvegardes Planning-CHPG';
const PREFIXE     = 'Planning-CHPG ';
const NB_COPIES   = 8;              // ≈ 2 mois de recul, comme BACKUP_KEEP côté planning

function sauvegardeHebdo() {
  const dossier = dossierSauvegardes_();
  const jour = Utilities.formatDate(new Date(), 'Europe/Monaco', 'yyyy-MM-dd');
  DriveApp.getFileById(ID_CLASSEUR).makeCopy(PREFIXE + jour, dossier);
  purger_(dossier);
}

function dossierSauvegardes_() {
  const it = DriveApp.getFoldersByName(NOM_DOSSIER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(NOM_DOSSIER);
}

/**
 * Ne garde que les NB_COPIES plus récentes. Le filtre sur PREFIXE évite de
 * supprimer un fichier étranger qui se trouverait dans le dossier.
 */
function purger_(dossier) {
  const copies = [];
  const it = dossier.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(PREFIXE) === 0) {
      copies.push({ f: f, t: f.getDateCreated().getTime() });
    }
  }
  copies.sort(function (a, b) { return b.t - a.t; });   // la plus récente d'abord
  copies.slice(NB_COPIES).forEach(function (c) { c.f.setTrashed(true); });
}

/** À exécuter UNE FOIS. Relancer cette fonction ne crée pas de doublon. */
function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'sauvegardeHebdo') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sauvegardeHebdo')
    .timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(5).create();
}
```

## Points de vigilance

- **Rotation indispensable côté compte personnel aussi.** Depuis 2021 les fichiers Google
  Sheets **comptent dans le quota de stockage** (15 Go partagés avec Gmail et Photos).
  Sans purge, l'accumulation est illimitée — d'où `NB_COPIES`.
- **Ne pas se limiter à une seule copie.** Une sauvegarde unique ne protège que de la perte
  brutale, pas de la **corruption silencieuse** : un onglet abîmé un mardi sans que personne
  ne le remarque, et la copie suivante écrase la seule version saine. La profondeur
  d'historique est ce qui rattrape ce cas.
- **Dimanche 5 h**, alors que `backupHebdo` tourne le lundi vers 4 h : les deux sauvegardes
  sont volontairement décalées et indépendantes.
- **En cas d'échec**, Google envoie automatiquement un mail au propriétaire du script.
- **Vérifier une fois par trimestre** qu'une copie récente existe bien dans le dossier.
  Une sauvegarde jamais vérifiée n'est pas une sauvegarde.
