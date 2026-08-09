/**
 * Sauvegarde hebdomadaire HORS-COMPTE du classeur Planning-CHPG.
 * À installer dans le compte Google PERSONNEL, jamais dans le projet du planning.
 * La copie est créée par CE compte, donc elle lui appartient : rien de ce qui
 * arrive au compte planningchpg ne peut l'atteindre.
 */

const ID_CLASSEUR = 'A_REMPLIR';   // dépôt public : identifiant volontairement retiré.
                                   // Le vrai se lit dans l'URL du classeur maître.
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