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
    case 'listStaffs': return _portailJson(listStaffs());
    case 'getVeille':  return _portailJson(getVeille());
    case 'markVeille': return _portailJson(markVeille(payload && payload.pmid, payload && payload.field, payload && payload.value));
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


// ══════════════════════════════════════════════════════════════════════
//  STAFFS À VENIR
//  Source = onglet STAFFS du classeur (1 ligne = 1 staff). Auto-créé avec
//  ses en-têtes s'il manque. Seuls les staffs à venir (date >= aujourd'hui)
//  sont renvoyés, triés du plus proche au plus lointain.
//  Colonnes : DATE | HEURE | THÈME | INTERVENANT | LIEU
//  (seules DATE + THÈME sont requises ; HEURE/INTERVENANT/LIEU facultatives)
// ══════════════════════════════════════════════════════════════════════

const STAFFS_TAB = 'STAFFS';

function getOrCreateStaffsTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(STAFFS_TAB);
  if (!sh) {
    sh = ss.insertSheet(STAFFS_TAB);
    sh.getRange(1, 1, 1, 5).setValues([['DATE', 'HEURE', 'THÈME', 'INTERVENANT', 'LIEU']]);
    sh.getRange(1, 1, 1, 5).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 320);
  }
  return sh;
}

// Normalise une valeur de cellule (Date OU texte) en 'yyyy-MM-dd'. Gère les
// formats FR (jj/mm/aaaa, jj-mm-aa…). Renvoie '' si non interprétable.
function _staffDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let d = m[1], mo = m[2], y = m[3];
    if (y.length === 2) y = '20' + y;
    return y + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? '' : Utilities.formatDate(d2, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function _staffTabUrl(sh) {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl() + '#gid=' + sh.getSheetId();
}

function listStaffs() {
  const sh = getOrCreateStaffsTab();
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const data = sh.getDataRange().getValues();
  const staffs = [];
  for (let r = 1; r < data.length; r++) {
    const iso = _staffDate(data[r][0]);
    if (!iso) continue;                                   // pas de date valide → ignoré
    const theme = String(data[r][2] || '').trim();
    const interv = String(data[r][3] || '').trim();
    if (!theme && !interv) continue;                      // ligne vide → ignorée
    if (iso < today) continue;                            // staff passé → masqué
    staffs.push({
      date:        iso,
      heure:       String(data[r][1] || '').trim(),
      theme:       theme,
      intervenant: interv,
      lieu:        String(data[r][4] || '').trim(),
    });
  }
  staffs.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return String(a.heure).localeCompare(String(b.heure));
  });
  return { success: true, tabUrl: _staffTabUrl(sh), count: staffs.length, staffs: staffs };
}

// ── À exécuter UNE FOIS dans l'éditeur après recopie ──
// Crée l'onglet STAFFS s'il manque et journalise son URL + les staffs à venir.
function testStaffs() {
  const r = listStaffs();
  Logger.log('🗓️ Onglet STAFFS : ' + r.tabUrl);
  Logger.log('📋 Staffs à venir : ' + r.count);
  r.staffs.forEach(function (s) {
    Logger.log('  • ' + s.date + (s.heure ? ' ' + s.heure : '') + ' — ' + s.theme + (s.intervenant ? ' (' + s.intervenant + ')' : ''));
  });
  Logger.log('✅ testStaffs OK — remplis l\'onglet STAFFS (1 ligne = 1 staff), puis relance.');
}


// ══════════════════════════════════════════════════════════════════════
//  VEILLE BIBLIOGRAPHIQUE (PubMed E-utilities)
//  Deux onglets pilotent tout (contenu vivant, code figé) :
//   • VEILLE_CFG : revues cœur, thèmes MeSH, paramètres. Colonnes :
//       TYPE | CLE | VALEUR | ACTIF
//       - REVUE  : CLE=libellé,  VALEUR=nom journal PubMed → "VALEUR"[Journal]
//       - THEME  : CLE=libellé,  VALEUR=fragment de requête PubMed (OR entre thèmes)
//       - PARAM  : CLE=nom,      VALEUR=valeur   (JOURS, ENRICH, ENRICH_MAX, MODEL)
//   • VEILLE : cache des articles (1 ligne = 1 article, clé = PMID). Colonnes :
//       PMID | DATE_PUB | TITRE | AUTEURS | REVUE | DOI | SOURCE | SCORE | RESUME | LU | STAR | AJOUTE_LE
//
//  Le TRIGGER hebdo appelle runVeille() → interroge PubMed, dédoublonne par
//  PMID, n'ajoute que le nouveau. getVeille() (appelé par le dashboard) lit
//  juste l'onglet VEILLE → rapide. L'enrichissement IA (SCORE/RESUME) est
//  volontairement DÉSACTIVÉ tant qu'aucune clé API Anthropic n'est posée :
//  PARAM ENRICH=N. Les colonnes SCORE/RESUME restent vides d'ici là.
// ══════════════════════════════════════════════════════════════════════

const VEILLE_CFG_TAB = 'VEILLE_CFG';
const VEILLE_TAB     = 'VEILLE';
const EUTILS_BASE    = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const EUTILS_TOOL    = 'PlanningCHPG';
const EUTILS_EMAIL   = 'planningchpg@gmail.com';

// ── Onglets : création + pré-remplissage standard (idempotent) ──────────
function getOrCreateVeilleTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let cfg = ss.getSheetByName(VEILLE_CFG_TAB);
  if (!cfg) {
    cfg = ss.insertSheet(VEILLE_CFG_TAB);
    cfg.getRange(1, 1, 1, 4).setValues([['TYPE', 'CLE', 'VALEUR', 'ACTIF']]);
    cfg.getRange(1, 1, 1, 4).setFontWeight('bold');
    cfg.setFrozenRows(1);
    cfg.setColumnWidth(3, 360);
    cfg.getRange(2, 1, VEILLE_DEFAULT_CFG.length, 4).setValues(VEILLE_DEFAULT_CFG);
  }

  let v = ss.getSheetByName(VEILLE_TAB);
  if (!v) {
    v = ss.insertSheet(VEILLE_TAB);
    v.getRange(1, 1, 1, 12).setValues([[
      'PMID', 'DATE_PUB', 'TITRE', 'AUTEURS', 'REVUE', 'DOI',
      'SOURCE', 'SCORE', 'RESUME', 'LU', 'STAR', 'AJOUTE_LE',
    ]]);
    v.getRange(1, 1, 1, 12).setFontWeight('bold');
    v.setFrozenRows(1);
    v.setColumnWidth(3, 420);
  }
  return { cfg: cfg, veille: v };
}

// Config standard AR — Arthur ajuste ensuite dans l'onglet.
const VEILLE_DEFAULT_CFG = [
  ['REVUE', 'Anesthesiology',            'Anesthesiology',              'O'],
  ['REVUE', 'Br J Anaesth',              'Br J Anaesth',                'O'],
  ['REVUE', 'Anaesthesia',               'Anaesthesia',                 'O'],
  ['REVUE', 'Anesth Analg',              'Anesth Analg',                'O'],
  ['REVUE', 'Intensive Care Med',        'Intensive Care Med',          'O'],
  ['REVUE', 'Crit Care Med',             'Crit Care Med',               'O'],
  ['REVUE', 'Crit Care',                 'Crit Care',                   'O'],
  ['REVUE', 'Ann Intensive Care',        'Ann Intensive Care',          'O'],
  ['REVUE', 'Anaesth Crit Care Pain Med','Anaesth Crit Care Pain Med',  'O'],
  ['REVUE', 'Eur J Anaesthesiol',        'Eur J Anaesthesiol',          'O'],
  ['THEME', 'Sepsis',                    '"sepsis"[MeSH Terms]',                           'O'],
  ['THEME', 'Voies aériennes',           '"airway management"[MeSH Terms]',                'O'],
  ['THEME', 'SDRA / ventilation',        '"respiratory distress syndrome"[MeSH Terms]',    'O'],
  ['THEME', 'Délire post-op',            '"delirium"[MeSH Terms] AND "postoperative"[All Fields]', 'O'],
  ['THEME', 'Monitorage hémodynamique',  '"hemodynamic monitoring"[MeSH Terms]',           'O'],
  ['THEME', 'Anesthésie locorégionale',  '"anesthesia, conduction"[MeSH Terms]',           'O'],
  ['THEME', 'Hémorragie / transfusion',  '"blood transfusion"[MeSH Terms] AND "hemorrhage"[MeSH Terms]', 'O'],
  ['THEME', 'Arrêt cardiaque',           '"heart arrest"[MeSH Terms]',                     'O'],
  ['PARAM', 'JOURS',       '30',                 'O'],
  ['PARAM', 'ENRICH',      'N',                  'O'],
  ['PARAM', 'ENRICH_MAX',  '60',                 'O'],
  ['PARAM', 'MODEL',       'claude-haiku-4-5',   'O'],
];

// ── Lecture de la config ────────────────────────────────────────────────
function _readVeilleCfg() {
  const cfg = getOrCreateVeilleTabs().cfg;
  const data = cfg.getDataRange().getValues();
  const revues = [], themes = [], params = {};
  for (let r = 1; r < data.length; r++) {
    const type   = String(data[r][0] || '').trim().toUpperCase();
    const cle    = String(data[r][1] || '').trim();
    const valeur = String(data[r][2] || '').trim();
    const actif  = String(data[r][3] || '').trim().toUpperCase() !== 'N';
    if (!type) continue;
    if (type === 'PARAM') { params[cle.toUpperCase()] = valeur; continue; }
    if (!actif || !valeur) continue;
    if (type === 'REVUE') revues.push({ cle: cle || valeur, valeur: valeur });
    if (type === 'THEME') themes.push({ cle: cle || valeur, valeur: valeur });
  }
  return { revues: revues, themes: themes, params: params };
}

// ── Appels PubMed ────────────────────────────────────────────────────────
function _eutils(endpoint, query) {
  const url = EUTILS_BASE + endpoint + '?' + query +
              '&tool=' + EUTILS_TOOL + '&email=' + encodeURIComponent(EUTILS_EMAIL);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    throw new Error('PubMed ' + endpoint + ' HTTP ' + res.getResponseCode());
  }
  return JSON.parse(res.getContentText());
}

// esearch : renvoie la liste des PMID pour un term + fenêtre de JOURS.
function _esearch(term, jours) {
  if (!term) return [];
  const q = 'db=pubmed&retmode=json&retmax=200&sort=date' +
            '&datetype=edat&reldate=' + encodeURIComponent(jours) +
            '&term=' + encodeURIComponent(term);
  const json = _eutils('esearch.fcgi', q);
  return (json && json.esearchresult && json.esearchresult.idlist) || [];
}

// esummary : métadonnées pour un lot de PMID (max ~200).
function _esummary(pmids) {
  if (!pmids.length) return {};
  const json = _eutils('esummary.fcgi', 'db=pubmed&retmode=json&id=' + pmids.join(','));
  return (json && json.result) || {};
}

function _fmtAuthors(authors) {
  if (!authors || !authors.length) return '';
  const names = authors.filter(function (a) { return a && a.name; })
                       .map(function (a) { return a.name; });
  if (!names.length) return '';
  return names.length <= 3 ? names.join(', ') : names.slice(0, 3).join(', ') + ' et al.';
}

function _extractDoi(obj) {
  if (obj.articleids) {
    for (let i = 0; i < obj.articleids.length; i++) {
      if (String(obj.articleids[i].idtype).toLowerCase() === 'doi') {
        return String(obj.articleids[i].value || '').trim();
      }
    }
  }
  const el = String(obj.elocationid || '');
  const m = el.match(/10\.\d{4,}\/\S+/);
  return m ? m[0] : '';
}

function _fmtPubDate(obj) {
  const raw = String(obj.sortpubdate || obj.epubdate || obj.pubdate || '').trim();
  if (!raw) return '';
  const m = raw.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  return raw;   // "2026 Jul" etc. — laissé lisible tel quel
}

// ── RUN hebdo : PubMed → dédoublonnage → append (appelé par le trigger) ──
function runVeille() {
  const tabs = getOrCreateVeilleTabs();
  const sh   = tabs.veille;
  const cfg  = _readVeilleCfg();
  const jours = parseInt(cfg.params.JOURS, 10) || 30;

  // PMID déjà connus (dédoublonnage)
  const existing = {};
  const cur = sh.getDataRange().getValues();
  for (let r = 1; r < cur.length; r++) {
    const p = String(cur[r][0] || '').trim();
    if (p) existing[p] = true;
  }

  // 1) revues cœur → un term OR ; 2) thèmes → un term OR. Tag SOURCE distinct.
  const termRevues = cfg.revues.map(function (x) { return '"' + x.valeur + '"[Journal]'; }).join(' OR ');
  const termThemes = cfg.themes.map(function (x) { return '(' + x.valeur + ')'; }).join(' OR ');

  const source = {};   // pmid → 'REVUE' | 'THEME'
  function collect(term, tag) {
    if (!term) return;
    const ids = _esearch(term, jours);
    ids.forEach(function (id) { if (!source[id]) source[id] = tag; });
    Utilities.sleep(400);   // < 3 req/s, courtoisie NCBI
  }
  collect(termRevues, 'REVUE');
  collect(termThemes, 'THEME');

  // Ne garder que les PMID nouveaux
  const nouveaux = Object.keys(source).filter(function (id) { return !existing[id]; });
  if (!nouveaux.length) {
    return { success: true, added: 0, scanned: Object.keys(source).length };
  }

  // esummary par lots de 200
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const rows = [];
  for (let i = 0; i < nouveaux.length; i += 200) {
    const lot = nouveaux.slice(i, i + 200);
    const res = _esummary(lot);
    lot.forEach(function (pmid) {
      const o = res[pmid];
      if (!o || o.error) return;
      rows.push([
        pmid,
        _fmtPubDate(o),
        String(o.title || '').replace(/\.$/, ''),
        _fmtAuthors(o.authors),
        String(o.source || o.fulljournalname || '').trim(),
        _extractDoi(o),
        source[pmid],
        '',        // SCORE  (rempli par l'enrichissement IA, plus tard)
        '',        // RESUME (idem)
        'N',       // LU
        'N',       // STAR
        today,     // AJOUTE_LE
      ]);
    });
    Utilities.sleep(400);
  }

  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  }
  return { success: true, added: rows.length, scanned: Object.keys(source).length };
}

// ── Lecture pour le dashboard (rapide : lit juste l'onglet) ─────────────
function getVeille() {
  const tabs = getOrCreateVeilleTabs();
  const cfg  = _readVeilleCfg();
  const data = tabs.veille.getDataRange().getValues();
  const items = [];
  for (let r = 1; r < data.length; r++) {
    const pmid = String(data[r][0] || '').trim();
    if (!pmid) continue;
    items.push({
      pmid:    pmid,
      date:    String(data[r][1] || ''),
      titre:   String(data[r][2] || ''),
      auteurs: String(data[r][3] || ''),
      revue:   String(data[r][4] || ''),
      doi:     String(data[r][5] || ''),
      source:  String(data[r][6] || ''),
      score:   data[r][7] === '' ? null : Number(data[r][7]),
      resume:  String(data[r][8] || ''),
      lu:      String(data[r][9]  || 'N').toUpperCase() === 'O',
      star:    String(data[r][10] || 'N').toUpperCase() === 'O',
      ajoute:  String(data[r][11] || ''),
    });
  }
  // Tri : score (desc, nuls en dernier) puis date (desc). En V1 sans IA, tous
  // les scores sont nuls → tri effectif par date décroissante.
  items.sort(function (a, b) {
    const sa = a.score == null ? -1 : a.score, sb = b.score == null ? -1 : b.score;
    if (sa !== sb) return sb - sa;
    return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
  });
  return {
    success: true,
    count: items.length,
    enrich: String(cfg.params.ENRICH || 'N').toUpperCase() === 'O',
    items: items,
  };
}

// ── Marquage lu / favori (toggle depuis le dashboard) ───────────────────
function markVeille(pmid, field, value) {
  pmid = String(pmid || '').trim();
  const col = field === 'star' ? 11 : (field === 'lu' ? 10 : 0);
  if (!pmid || !col) return { success: false, error: 'champ invalide' };
  const sh = getOrCreateVeilleTabs().veille;
  const data = sh.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0] || '').trim() === pmid) {
      sh.getRange(r + 1, col).setValue(value ? 'O' : 'N');
      return { success: true };
    }
  }
  return { success: false, error: 'PMID absent' };
}

// ── Trigger hebdomadaire (idempotent) : lundi ~06h ──────────────────────
function installVeilleTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runVeille') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runVeille')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).create();
  Logger.log('⏰ Trigger hebdo posé : runVeille, lundi ~06h.');
}

// ── À lancer UNE FOIS après recopie : crée les onglets, fait un 1er run ──
function testVeille() {
  getOrCreateVeilleTabs();
  const cfg = _readVeilleCfg();
  Logger.log('⚙️ Config : ' + cfg.revues.length + ' revues, ' + cfg.themes.length +
             ' thèmes, JOURS=' + (cfg.params.JOURS || '30') + ', ENRICH=' + (cfg.params.ENRICH || 'N'));
  const r = runVeille();
  Logger.log('📚 runVeille : ' + r.added + ' nouveaux / ' + r.scanned + ' scannés.');
  Logger.log('✅ testVeille OK — vérifie l\'onglet VEILLE, puis lance installVeilleTrigger().');
}
