/**
 * portail.gs — actions du PORTAIL équipe (dashboard.html).
 * 5e fichier du projet Apps Script. Ne touche PAS au planning.
 *
 * Routeur délégué appelé par doGet (Indispos.gs) via un bloc gardé
 * `typeof portailRoute === 'function'`. L'auth (checkCode) est déjà
 * faite en amont : toute action ci-dessous est donc code-gated d'office.
 *
 * Renvoie un ContentService (JSON) si l'action est gérée, sinon null
 * (doGet poursuit alors vers son rejet "Action inconnue" habituel).
 */

const TOPOS_FOLDER = 'Planning-CHPG-Topos';

function portailRoute(action, payload, user) {
  switch (action) {
    case 'listTopos': return _portailJson(listTopos());
    case 'getTopo':   return _portailJson(getTopo(payload && payload.id));
    default:          return null;   // pas une action portail → doGet continue
  }
}

function _portailJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Dossier Topos (auto-création si absent), rangé dans le Drive du compte
// planningchpg — même principe que Planning-CHPG-JSON.
function _getToposFolder() {
  const it = DriveApp.getFoldersByName(TOPOS_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(TOPOS_FOLDER);
}

function _isPdf(file) {
  if (file.getMimeType() === 'application/pdf') return true;
  return /\.pdf$/i.test(file.getName());
}
function _stripPdf(name) { return String(name).replace(/\.pdf$/i, ''); }

function _fileMeta(file) {
  return {
    id:    file.getId(),
    title: _stripPdf(file.getName()),
    date:  Utilities.formatDate(file.getLastUpdated(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    size:  file.getSize(),
  };
}

// Liste les topos : PDF à la racine = topo 1 doc ; sous-dossier = topo N docs
// (nom du sous-dossier = titre). UN SEUL niveau de sous-dossier. Tri alpha
// partout (topos entre eux + docs dans un sous-dossier).
function listTopos() {
  const root = _getToposFolder();
  const topos = [];

  // 1) PDF directement à la racine → topos à 1 document
  const files = root.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (!_isPdf(f)) continue;
    const m = _fileMeta(f);
    topos.push({ title: m.title, multi: false, date: m.date, docs: [m] });
  }

  // 2) sous-dossiers → topos à plusieurs documents
  const subs = root.getFolders();
  while (subs.hasNext()) {
    const sub = subs.next();
    const docs = [];
    const sf = sub.getFiles();
    while (sf.hasNext()) {
      const f = sf.next();
      if (_isPdf(f)) docs.push(_fileMeta(f));
    }
    if (!docs.length) continue;                        // sous-dossier sans PDF → ignoré
    docs.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    const lastDate = docs.reduce((mx, d) => (d.date > mx ? d.date : mx), docs[0].date);
    topos.push({ title: sub.getName(), multi: true, date: lastDate, docs: docs });
  }

  // tri des topos entre eux : alphabétique sur le titre
  topos.sort((a, b) => a.title.localeCompare(b.title, 'fr'));

  return { success: true, folderUrl: root.getUrl(), count: topos.length, topos: topos };
}

// Sert un PDF en base64 — le MAR ne touche JAMAIS au Drive directement
// (cohérent avec la façon dont le planning est servi).
// Sécurité : on n'accepte que les fichiers RÉELLEMENT situés dans le dossier
// Topos (racine ou sous-dossier direct), pour qu'un code valide ne puisse pas
// lire un fichier arbitraire du Drive via un id forgé.
function getTopo(id) {
  if (!id) return { success: false, error: 'Identifiant manquant' };
  let file;
  try { file = DriveApp.getFileById(id); }
  catch (e) { return { success: false, error: 'Document introuvable' }; }
  if (!_fileInTopos(file)) return { success: false, error: 'Accès refusé' };
  const blob = file.getBlob();
  return {
    success:  true,
    name:     file.getName(),
    mimeType: blob.getContentType() || 'application/pdf',
    dataB64:  Utilities.base64Encode(blob.getBytes()),
  };
}

// Vrai si le fichier est dans le dossier Topos, ou dans un sous-dossier direct
// de ce dossier (un seul niveau, cohérent avec listTopos).
function _fileInTopos(file) {
  const toposId = _getToposFolder().getId();
  const parents = file.getParents();
  while (parents.hasNext()) {
    const p = parents.next();
    if (p.getId() === toposId) return true;            // fichier à la racine Topos
    const grand = p.getParents();
    while (grand.hasNext()) {
      if (grand.next().getId() === toposId) return true; // fichier dans un sous-dossier direct
    }
  }
  return false;
}

// ── À exécuter UNE FOIS dans l'éditeur (menu Exécuter) après recopie ──
// Déclenche l'autorisation Drive, crée le dossier Topos s'il manque, et
// journalise l'URL du dossier + ce que listTopos voit.
function testPortail() {
  const r = listTopos();
  Logger.log('📁 Dossier Topos : ' + r.folderUrl);
  Logger.log('📚 Topos vus : ' + r.count);
  r.topos.forEach(function (t) {
    Logger.log('  • ' + t.title + ' (' + t.docs.length + ' doc' + (t.docs.length > 1 ? 's' : '') + ')');
  });
  Logger.log('✅ testPortail OK — dépose tes PDF dans le dossier ci-dessus, puis relance pour vérifier.');
}
