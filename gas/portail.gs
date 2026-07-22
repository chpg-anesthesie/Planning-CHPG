// ⚠️ RÈGLE (détecteur de dérive dépôt↔Apps Script) : incrémenter cette version
// à CHAQUE push de ce fichier. Le diagnostic (admin → Maintenance) compare la
// version déployée ici avec celle du dépôt et signale toute recopie oubliée.
const GAS_VERSION_PORTAIL = '2026-07-22.1';

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
    case 'listStaffsAll': return _portailJson(listStaffsAll());
    case 'listProtocoles': return _portailJson(listProtocoles());
    case 'getProtocole':   return _portailJson(getProtocole(payload && payload.id));
    case 'listAnnuaire':   return _portailJson(listAnnuaire());
    case 'getSecteurs':    return _portailJson(getSecteurs());
    case 'getCsTemplate':  return _portailJson(getCsTemplate());
    case 'getVeille':  return _portailJson(getVeille());
    case 'markVeille': return _portailJson(markVeille(payload && payload.pmid, payload && payload.field, payload && payload.value));
    case 'genererCRH': return _portailJson(genererCRH_(payload, user));
    // Declaration d'intervention liberale (onglet LIBERAL_{Y}). declareLiberal et
    // deleteLiberal ECRIVENT : elles sont dans WRITE_ACTIONS_LOCK (Indispos.gs), le
    // verrou etant pris AVANT cette delegation. listLiberal est une lecture.
    case 'declareLiberal': return _portailJson(declareLiberal(payload, user));
    case 'deleteLiberal':  return _portailJson(deleteLiberal(payload, user));
    case 'listLiberal':    return _portailJson(listLiberal(payload, user));
    // Lecture COMITE : toutes les declarations d'un jour, tous MAR confondus.
    // Reservee a l'admin (listLiberal, elle, filtre sur le MAR connecte). Lecture
    // seule => volontairement ABSENTE du WRITE_ACTIONS_LOCK.
    case 'listLiberalJour': return _portailJson(listLiberalJour(payload, user));
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

// Variante NON filtrée : tous les staffs (passés inclus), sans tri obligatoire.
// Utilisée par l'export Excel du planning pour retrouver le staff du vendredi
// de n'importe quelle semaine affichée (même passée).
function listStaffsAll() {
  const sh = getOrCreateStaffsTab();
  const data = sh.getDataRange().getValues();
  const staffs = [];
  for (let r = 1; r < data.length; r++) {
    const iso = _staffDate(data[r][0]);
    if (!iso) continue;
    const heure = String(data[r][1] || '').trim();
    const theme = String(data[r][2] || '').trim();
    if (!theme && !heure) continue;
    staffs.push({ date: iso, heure: heure, theme: theme });
  }
  return { success: true, staffs: staffs };
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
//  Onglet VEILLE_CFG (colonnes TYPE | CLE | VALEUR | ACTIF) :
//   • REVUE   : revue cœur AR → tout le solide de ces revues.
//   • GENERAL : revue généraliste (NEJM, JAMA…) → CROISÉE avec les thèmes
//               (un article ne remonte que s'il touche un thème AR).
//   • THEME   : fragment de requête PubMed (OR entre thèmes), toutes revues.
//   • PUBTYPE : type de publication PubMed conservé (whitelist). Option B =
//               essais randomisés, méta-analyses, revues systématiques,
//               recommandations. "Review" (mise au point) désactivé par défaut.
//   • PARAM   : JOURS, HUMANS (O/N), LANGS (codes langue PubMed, ex "eng,fre"),
//               ENRICH, ENRICH_MAX, MODEL.
//  Les filtres PUBTYPE + HUMANS + LANGS s'appliquent à TOUTES les requêtes.
//  Onglet VEILLE : cache (1 ligne = 1 article, clé = PMID). Colonnes :
//   PMID | DATE_PUB | TITRE | AUTEURS | REVUE | DOI | SOURCE | SCORE | RESUME | LU | STAR | AJOUTE_LE
//  Le trigger hebdo appelle runVeille() ; getVeille() (dashboard) lit le cache.
//  Enrichissement IA (SCORE/RESUME) OFF tant que PARAM ENRICH=N.
// ══════════════════════════════════════════════════════════════════════

const VEILLE_CFG_TAB = 'VEILLE_CFG';
const VEILLE_TAB     = 'VEILLE';
const EUTILS_BASE    = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const EUTILS_TOOL    = 'PlanningCHPG';
const EUTILS_EMAIL   = 'planningchpg@gmail.com';

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
  ['GENERAL', 'N Engl J Med',            'N Engl J Med',                'O'],
  ['GENERAL', 'JAMA',                    'JAMA',                        'O'],
  ['GENERAL', 'Lancet',                  'Lancet',                      'O'],
  ['GENERAL', 'BMJ',                     'BMJ',                         'O'],
  ['THEME', 'Sepsis',                    '"sepsis"[MeSH Terms]',                           'O'],
  ['THEME', 'Voies aériennes',           '"airway management"[MeSH Terms]',                'O'],
  ['THEME', 'SDRA / ventilation',        '"respiratory distress syndrome"[MeSH Terms]',    'O'],
  ['THEME', 'Délire post-op',            '"delirium"[MeSH Terms] AND "postoperative"[All Fields]', 'O'],
  ['THEME', 'Monitorage hémodynamique',  '"hemodynamic monitoring"[MeSH Terms]',           'O'],
  ['THEME', 'Anesthésie locorégionale',  '"anesthesia, conduction"[MeSH Terms]',           'O'],
  ['THEME', 'Hémorragie / transfusion',  '"blood transfusion"[MeSH Terms] AND "hemorrhage"[MeSH Terms]', 'O'],
  ['THEME', 'Arrêt cardiaque',           '"heart arrest"[MeSH Terms]',                     'O'],
  ['PUBTYPE', 'Essai randomisé',         'Randomized Controlled Trial', 'O'],
  ['PUBTYPE', 'Méta-analyse',            'Meta-Analysis',               'O'],
  ['PUBTYPE', 'Revue systématique',      'Systematic Review',           'O'],
  ['PUBTYPE', 'Recommandations',         'Practice Guideline',          'O'],
  ['PUBTYPE', 'Recommandations (guide)', 'Guideline',                   'O'],
  ['PUBTYPE', 'Revue / mise au point',   'Review',                      'N'],
  ['PARAM', 'JOURS',       '30',                 'O'],
  ['PARAM', 'HUMANS',      'O',                  'O'],
  ['PARAM', 'LANGS',       'eng,fre',            'O'],
  ['PARAM', 'ENRICH',      'N',                  'O'],
  ['PARAM', 'ENRICH_MAX',  '60',                 'O'],
  ['PARAM', 'MODEL',       'claude-haiku-4-5',   'O'],
];

// ── Onglets : création + pré-remplissage + migration idempotente ────────
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
  _ensureVeilleCfgRows(cfg);   // complète un onglet préexistant (généralistes, pubtypes, params)

  let v = ss.getSheetByName(VEILLE_TAB);
  if (!v) {
    v = ss.insertSheet(VEILLE_TAB);
    v.getRange(1, 1, 1, 14).setValues([[
      'PMID', 'DATE_PUB', 'TITRE', 'AUTEURS', 'REVUE', 'DOI',
      'SOURCE', 'SCORE', 'RESUME', 'LU', 'STAR', 'AJOUTE_LE', 'PUBTYPE', 'THEMES',
    ]]);
    v.getRange(1, 1, 1, 14).setFontWeight('bold');
    v.setFrozenRows(1);
    v.setColumnWidth(3, 420);
  } else {
    _ensureVeilleColumns(v);
  }
  return { cfg: cfg, veille: v };
}

// Migre un onglet VEILLE préexistant : ajoute en fin les colonnes manquantes
// (PUBTYPE, THEMES) sans décaler LU/STAR (référencés en dur par markVeille).
function _ensureVeilleColumns(v) {
  const need = ['PUBTYPE', 'THEMES'];
  let lastCol = Math.max(v.getLastColumn(), 1);
  const hdr = v.getRange(1, 1, 1, lastCol).getValues()[0].map(function (x) { return String(x || '').trim(); });
  need.forEach(function (name) {
    if (hdr.indexOf(name) === -1) {
      lastCol += 1;
      v.getRange(1, lastCol).setValue(name).setFontWeight('bold');
      hdr.push(name);
    }
  });
}

// Ajoute les lignes de config par défaut manquantes (clé = TYPE|CLE), sans
// toucher l'existant (les ACTIF=N choisis par Arthur sont préservés).
function _ensureVeilleCfgRows(cfg) {
  const data = cfg.getDataRange().getValues();
  const seen = {};
  for (let r = 1; r < data.length; r++) {
    seen[String(data[r][0] || '').trim().toUpperCase() + '|' + String(data[r][1] || '').trim().toUpperCase()] = true;
  }
  const missing = VEILLE_DEFAULT_CFG.filter(function (row) {
    return !seen[String(row[0]).toUpperCase() + '|' + String(row[1]).toUpperCase()];
  });
  if (missing.length) cfg.getRange(cfg.getLastRow() + 1, 1, missing.length, 4).setValues(missing);
  return missing.length;
}

// ── Lecture de la config ────────────────────────────────────────────────
function _readVeilleCfg() {
  const cfg = getOrCreateVeilleTabs().cfg;
  const data = cfg.getDataRange().getValues();
  const revues = [], general = [], themes = [], themesFull = [], pubtypes = [], params = {};
  for (let r = 1; r < data.length; r++) {
    const type   = String(data[r][0] || '').trim().toUpperCase();
    const cle    = String(data[r][1] || '').trim();
    const valeur = String(data[r][2] || '').trim();
    const actif  = String(data[r][3] || '').trim().toUpperCase() !== 'N';
    if (!type) continue;
    if (type === 'PARAM') { params[cle.toUpperCase()] = valeur; continue; }
    if (!actif || !valeur) continue;
    if (type === 'REVUE')   revues.push(valeur);
    if (type === 'GENERAL') general.push(valeur);
    if (type === 'THEME')   { themes.push(valeur); themesFull.push({ cle: cle, valeur: valeur }); }
    if (type === 'PUBTYPE') pubtypes.push(valeur);
  }
  return { revues: revues, general: general, themes: themes, themesFull: themesFull, pubtypes: pubtypes, params: params };
}

// ── Appels PubMed ────────────────────────────────────────────────────────
function _eutils(endpoint, query) {
  const url = EUTILS_BASE + endpoint + '?' + query +
              '&tool=' + EUTILS_TOOL + '&email=' + encodeURIComponent(EUTILS_EMAIL);
  const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('PubMed ' + endpoint + ' HTTP ' + res.getResponseCode());
  return JSON.parse(res.getContentText());
}

function _esearch(term, jours) {
  if (!term) return [];
  const q = 'db=pubmed&retmode=json&retmax=200&sort=date' +
            '&datetype=edat&reldate=' + encodeURIComponent(jours) +
            '&term=' + encodeURIComponent(term);
  const json = _eutils('esearch.fcgi', q);
  return (json && json.esearchresult && json.esearchresult.idlist) || [];
}

function _esummary(pmids) {
  if (!pmids.length) return {};
  const json = _eutils('esummary.fcgi', 'db=pubmed&retmode=json&id=' + pmids.join(','));
  return (json && json.result) || {};
}

function _fmtAuthors(authors) {
  if (!authors || !authors.length) return '';
  const names = authors.filter(function (a) { return a && a.name; }).map(function (a) { return a.name; });
  if (!names.length) return '';
  return names.length <= 3 ? names.join(', ') : names.slice(0, 3).join(', ') + ' et al.';
}

function _extractDoi(obj) {
  if (obj.articleids) {
    for (let i = 0; i < obj.articleids.length; i++) {
      if (String(obj.articleids[i].idtype).toLowerCase() === 'doi') return String(obj.articleids[i].value || '').trim();
    }
  }
  const m = String(obj.elocationid || '').match(/10\.\d{4,}\/\S+/);
  return m ? m[0] : '';
}

function _fmtPubDate(obj) {
  const raw = String(obj.sortpubdate || obj.epubdate || obj.pubdate || '').trim();
  if (!raw) return '';
  const m = raw.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  return m ? (m[1] + '-' + m[2] + '-' + m[3]) : raw;
}

// ── Filtres communs (type de publication + humains + langues) ───────────
function _veilleFilters(cfg) {
  const parts = [];
  if (cfg.pubtypes.length)
    parts.push('(' + cfg.pubtypes.map(function (p) { return '"' + p + '"[Publication Type]'; }).join(' OR ') + ')');
  if (String(cfg.params.HUMANS || 'O').toUpperCase() === 'O')
    parts.push('"humans"[MeSH Terms]');
  const langs = String(cfg.params.LANGS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (langs.length)
    parts.push('(' + langs.map(function (l) { return l + '[la]'; }).join(' OR ') + ')');
  return parts.join(' AND ');
}

// ── Type d'article : niveau de preuve (best-first) pour le tri pertinence ─
// esummary renvoie o.pubtype = liste (ex. ["Journal Article","Meta-Analysis"]).
// On retient le libellé le plus fort présent ; '' si aucun connu.
// Pour changer l'ordre du "best match", il suffit de réordonner cette liste.
const PUBTYPE_RANK = [
  'Meta-Analysis',
  'Systematic Review',
  'Randomized Controlled Trial',
  'Practice Guideline',
  'Guideline',
  'Review',
];
function _pickPubType(list) {
  if (!list || !list.length) return '';
  const set = {};
  list.forEach(function (t) { set[String(t).trim()] = true; });
  for (let i = 0; i < PUBTYPE_RANK.length; i++) {
    if (set[PUBTYPE_RANK[i]]) return PUBTYPE_RANK[i];
  }
  return '';
}

// Une cellule DATE_PUB peut avoir été convertie en objet Date par Sheets :
// on renormalise systématiquement en 'yyyy-MM-dd' (sinon String(Date) = texte long).
function _isoDate(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(v || '').trim();
  const m = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  return m ? (m[1] + '-' + m[2] + '-' + m[3]) : s;
}

function _joinThemes(obj) { return obj ? Object.keys(obj).join('; ') : ''; }
function _splitThemes(v) { return String(v || '').split(';').map(function (s) { return s.trim(); }).filter(Boolean); }

// ── RUN hebdo : 3 requêtes → dédoublonnage → append ─────────────────────
function runVeille() {
  const tabs  = getOrCreateVeilleTabs();
  const sh    = tabs.veille;
  const cfg   = _readVeilleCfg();
  const jours = parseInt(cfg.params.JOURS, 10) || 30;
  const filt  = _veilleFilters(cfg);
  const withFilt = function (base) { return filt ? '(' + base + ') AND ' + filt : base; };
  const orJournals = function (list) { return list.map(function (j) { return '"' + j + '"[Journal]'; }).join(' OR '); };
  const orThemes   = function (list) { return list.map(function (t) { return '(' + t + ')'; }).join(' OR '); };

  const existing = {};
  const cur = sh.getDataRange().getValues();
  for (let r = 1; r < cur.length; r++) { const p = String(cur[r][0] || '').trim(); if (p) existing[p] = true; }

  const source = {};   // pmid → REVUE | GENERAL | THEME (premier tag gagne)
  const themesByPmid = {};   // pmid → { libellé de thème: true }
  function collect(term, tag) {
    if (!term) return;
    _esearch(term, jours).forEach(function (id) { if (!source[id]) source[id] = tag; });
    Utilities.sleep(400);
  }
  if (cfg.revues.length) collect(withFilt(orJournals(cfg.revues)), 'REVUE');
  if (cfg.general.length && cfg.themes.length)
    collect(withFilt('(' + orJournals(cfg.general) + ') AND (' + orThemes(cfg.themes) + ')'), 'GENERAL');
  // Thèmes : une requête PAR thème → tag source THEME (si nouveau) + tag du sujet.
  cfg.themesFull.forEach(function (th) {
    if (!th.valeur) return;
    _esearch(withFilt(th.valeur), jours).forEach(function (id) {
      if (!source[id]) source[id] = 'THEME';
      (themesByPmid[id] = themesByPmid[id] || {})[th.cle] = true;
    });
    Utilities.sleep(400);
  });

  const nouveaux = Object.keys(source).filter(function (id) { return !existing[id]; });
  if (!nouveaux.length) return { success: true, added: 0, scanned: Object.keys(source).length };

  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const rows = [];
  for (let i = 0; i < nouveaux.length; i += 200) {
    const lot = nouveaux.slice(i, i + 200);
    const res = _esummary(lot);
    lot.forEach(function (pmid) {
      const o = res[pmid];
      if (!o || o.error) return;
      rows.push([
        pmid, _fmtPubDate(o), String(o.title || '').replace(/\.$/, ''), _fmtAuthors(o.authors),
        String(o.source || o.fulljournalname || '').trim(), _extractDoi(o), source[pmid],
        '', '', 'N', 'N', today, _pickPubType(o.pubtype), _joinThemes(themesByPmid[pmid]),
      ]);
    });
    Utilities.sleep(400);
  }
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 14).setValues(rows);
  return { success: true, added: rows.length, scanned: Object.keys(source).length };
}

// ── Lecture pour le dashboard ───────────────────────────────────────────
function getVeille() {
  const tabs = getOrCreateVeilleTabs();
  const cfg  = _readVeilleCfg();
  const data = tabs.veille.getDataRange().getValues();
  const items = [];
  for (let r = 1; r < data.length; r++) {
    const pmid = String(data[r][0] || '').trim();
    if (!pmid) continue;
    items.push({
      pmid: pmid, date: _isoDate(data[r][1]), titre: String(data[r][2] || ''),
      auteurs: String(data[r][3] || ''), revue: String(data[r][4] || ''), doi: String(data[r][5] || ''),
      source: String(data[r][6] || ''), score: data[r][7] === '' ? null : Number(data[r][7]),
      resume: String(data[r][8] || ''), lu: String(data[r][9] || 'N').toUpperCase() === 'O',
      star: String(data[r][10] || 'N').toUpperCase() === 'O', ajoute: _isoDate(data[r][11]),
      pubtype: String(data[r][12] || ''), themes: _splitThemes(data[r][13]),
    });
  }
  items.sort(function (a, b) {
    const sa = a.score == null ? -1 : a.score, sb = b.score == null ? -1 : b.score;
    if (sa !== sb) return sb - sa;
    return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
  });
  return { success: true, count: items.length, enrich: String(cfg.params.ENRICH || 'N').toUpperCase() === 'O', items: items };
}

// ── Marquage lu / favori ────────────────────────────────────────────────
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

// ── One-shot : renseigne PUBTYPE sur les articles déjà en cache ──────────
// À lancer une fois à la main après la mise à jour. Idempotent : ne retraite
// que les lignes dont la colonne PUBTYPE est vide.
function backfillPubTypes() {
  const sh = getOrCreateVeilleTabs().veille;
  const data = sh.getDataRange().getValues();
  const todo = [];
  for (let r = 1; r < data.length; r++) {
    const pmid = String(data[r][0] || '').trim();
    const pt   = String(data[r][12] || '').trim();
    if (pmid && !pt) todo.push({ row: r + 1, pmid: pmid });
  }
  if (!todo.length) { Logger.log('PUBTYPE : rien à compléter.'); return { success: true, updated: 0, scanned: 0 }; }
  let updated = 0;
  for (let i = 0; i < todo.length; i += 200) {
    const lot = todo.slice(i, i + 200);
    const res = _esummary(lot.map(function (x) { return x.pmid; }));
    lot.forEach(function (x) {
      const o = res[x.pmid];
      if (!o || o.error) return;
      const pt = _pickPubType(o.pubtype);
      if (pt) { sh.getRange(x.row, 13).setValue(pt); updated++; }
    });
    Utilities.sleep(400);
  }
  Logger.log('PUBTYPE complété : ' + updated + ' / ' + todo.length + ' scannés.');
  return { success: true, updated: updated, scanned: todo.length };
}

// ── One-shot : renseigne THEMES sur les articles déjà en cache ───────────
// Relance une recherche par thème (fenêtre large) et tague les PMID en cache.
// À lancer une fois à la main. Idempotent (réécrit la colonne THEMES).
function backfillThemes() {
  const tabs = getOrCreateVeilleTabs();
  const sh   = tabs.veille;
  const cfg  = _readVeilleCfg();
  const filt = _veilleFilters(cfg);
  const withFilt = function (b) { return filt ? '(' + b + ') AND ' + filt : b; };
  const data = sh.getDataRange().getValues();
  const rowByPmid = {}, inCache = {};
  for (let r = 1; r < data.length; r++) {
    const p = String(data[r][0] || '').trim();
    if (p) { rowByPmid[p] = r + 1; inCache[p] = true; }
  }
  const themesByPmid = {};
  cfg.themesFull.forEach(function (th) {
    if (!th.valeur) return;
    _esearch(withFilt(th.valeur), 400).forEach(function (id) {
      if (inCache[id]) (themesByPmid[id] = themesByPmid[id] || {})[th.cle] = true;
    });
    Utilities.sleep(400);
  });
  let updated = 0;
  Object.keys(themesByPmid).forEach(function (pmid) {
    sh.getRange(rowByPmid[pmid], 14).setValue(_joinThemes(themesByPmid[pmid]));
    updated++;
  });
  Logger.log('THEMES complété : ' + updated + ' articles tagués.');
  return { success: true, updated: updated };
}

// ── Trigger hebdomadaire (idempotent) : lundi ~06h ──────────────────────
function installVeilleTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'runVeille') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('runVeille').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(6).create();
  Logger.log('⏰ Trigger hebdo posé : runVeille, lundi ~06h.');
}

// ── Vider le cache VEILLE (garde l'en-tête) — pour repartir propre ───────
function resetVeille() {
  const sh = getOrCreateVeilleTabs().veille;
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  Logger.log('🗑️ Onglet VEILLE vidé (en-tête conservé). Lance runVeille() pour re-remplir avec le nouveau filtrage.');
}

// ── Compléter la config sur un onglet existant + récap ──────────────────
function upgradeVeille() {
  const n = _ensureVeilleCfgRows(getOrCreateVeilleTabs().cfg);
  Logger.log(n ? ('⬆️ ' + n + ' ligne(s) de config ajoutée(s) (généralistes, types de publication, params).')
               : '✅ Config VEILLE_CFG déjà à jour.');
}

// ── À lancer après recopie : complète la config, run, récap ─────────────
function testVeille() {
  getOrCreateVeilleTabs();
  const cfg = _readVeilleCfg();
  Logger.log('⚙️ ' + cfg.revues.length + ' revues cœur · ' + cfg.general.length + ' généralistes · ' +
             cfg.themes.length + ' thèmes · ' + cfg.pubtypes.length + ' types retenus · JOURS=' +
             (cfg.params.JOURS || '30') + ' · ENRICH=' + (cfg.params.ENRICH || 'N'));
  const r = runVeille();
  Logger.log('📚 runVeille : ' + r.added + ' nouveaux / ' + r.scanned + ' scannés.');
  Logger.log('✅ testVeille OK — vérifie l\'onglet VEILLE.');
}


// ══════════════════════════════════════════════════════════════════════
//  PROTOCOLES  (clone de Topos, mais sous-dossiers = SPÉCIALITÉS)
//  Dossier Drive Planning-CHPG-Protocoles (auto-créé). PDF à la racine =
//  protocole "Général" ; chaque sous-dossier = une spécialité, chaque PDF
//  dedans = un protocole. Servi en flux privé. Réutilise _isPdf/_fileMeta.
// ══════════════════════════════════════════════════════════════════════

const PROTOS_FOLDER = 'Planning-CHPG-Protocoles';

function _getProtosFolder() {
  const it = DriveApp.getFoldersByName(PROTOS_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PROTOS_FOLDER);
}

// Vrai si le fichier est dans le dossier donné (racine ou sous-dossier direct).
function _fileWithinFolder(file, folderId) {
  // Remonte toute la chaîne de dossiers parents (profondeur quelconque).
  const seen = {};
  let level = [file];
  let depth = 0;
  while (level.length && depth < 12) {
    const next = [];
    for (let i = 0; i < level.length; i++) {
      const parents = level[i].getParents();
      while (parents.hasNext()) {
        const p = parents.next();
        const id = p.getId();
        if (id === folderId) return true;
        if (!seen[id]) { seen[id] = true; next.push(p); }
      }
    }
    level = next;
    depth++;
  }
  return false;
}

function listProtocoles() {
  const root = _getProtosFolder();
  const groups = [];

  // PDF à la racine → groupe "Général"
  const rootDocs = [];
  const rf = root.getFiles();
  while (rf.hasNext()) { const f = rf.next(); if (_isPdf(f)) rootDocs.push(_fileMeta(f)); }
  if (rootDocs.length) {
    rootDocs.sort(function (a, b) { return a.title.localeCompare(b.title, 'fr'); });
    groups.push({ specialite: 'Général', protocoles: rootDocs });
  }

  // sous-dossiers = spécialités
  const subGroups = [];
  const subs = root.getFolders();
  while (subs.hasNext()) {
    const sub = subs.next();
    const docs = [];
    // PDF directement dans la spécialité
    const sf = sub.getFiles();
    while (sf.hasNext()) { const f = sf.next(); if (_isPdf(f)) docs.push(_fileMeta(f)); }
    // PDF dans les sous-sous-dossiers (thèmes) → titre préfixé "Thème \u203a "
    const deep = sub.getFolders();
    while (deep.hasNext()) {
      const d = deep.next();
      const theme = d.getName();
      const df = d.getFiles();
      while (df.hasNext()) {
        const f = df.next();
        if (!_isPdf(f)) continue;
        const meta = _fileMeta(f);
        meta.theme = theme;
        meta.title = theme + ' \u203a ' + meta.title;
        docs.push(meta);
      }
    }
    if (!docs.length) continue;
    docs.sort(function (a, b) { return a.title.localeCompare(b.title, 'fr'); });
    subGroups.push({ specialite: sub.getName(), protocoles: docs });
  }
  subGroups.sort(function (a, b) { return a.specialite.localeCompare(b.specialite, 'fr'); });

  const all = groups.concat(subGroups);
  const count = all.reduce(function (n, g) { return n + g.protocoles.length; }, 0);
  return { success: true, folderUrl: root.getUrl(), count: count, groups: all };
}

function getProtocole(id) {
  if (!id) return { success: false, error: 'Identifiant manquant' };
  let file;
  try { file = DriveApp.getFileById(id); }
  catch (e) { return { success: false, error: 'Document introuvable' }; }
  if (!_fileWithinFolder(file, _getProtosFolder().getId())) return { success: false, error: 'Accès refusé' };
  const blob = file.getBlob();
  return {
    success: true, name: file.getName(),
    mimeType: blob.getContentType() || 'application/pdf',
    dataB64: Utilities.base64Encode(blob.getBytes()),
  };
}

// À exécuter UNE FOIS après recopie : crée le dossier Protocoles + logue l'URL.
function testProtocoles() {
  const r = listProtocoles();
  Logger.log('📁 Dossier Protocoles : ' + r.folderUrl);
  Logger.log('📋 Protocoles vus : ' + r.count);
  r.groups.forEach(function (g) { Logger.log('  ▸ ' + g.specialite + ' (' + g.protocoles.length + ')'); });
  Logger.log('✅ testProtocoles OK — crée des sous-dossiers par spécialité et dépose les PDF dedans.');
}


// ══════════════════════════════════════════════════════════════════════
//  ANNUAIRE  (répertoire hôpital, onglet ANNUAIRE auto-créé)
//  + section "Équipe MAR" lue depuis MEDECINS (DECT = colonne 8, actifs).
//  Colonnes ANNUAIRE : CATÉGORIE | LIBELLÉ | NUMÉRO | INFO
// ══════════════════════════════════════════════════════════════════════

const ANNUAIRE_TAB = 'ANNUAIRE';

function getOrCreateAnnuaireTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ANNUAIRE_TAB);
  if (!sh) {
    sh = ss.insertSheet(ANNUAIRE_TAB);
    sh.getRange(1, 1, 1, 4).setValues([['CATÉGORIE', 'LIBELLÉ', 'NUMÉRO', 'INFO']]);
    sh.getRange(1, 1, 1, 4).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 260);
  }
  return sh;
}

function listAnnuaire() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── Équipe MAR depuis MEDECINS (actifs) : nom, initiales, DECT (col 8) ──
  const equipe = [];
  const med = ss.getSheetByName('MEDECINS');
  if (med) {
    const d = med.getDataRange().getValues();
    for (let r = 1; r < d.length; r++) {
      const id = String(d[r][0] || '').trim();
      if (!id) continue;
      if (String(d[r][3] || '').trim().toUpperCase() !== 'O') continue; // ACTIF = O
      equipe.push({
        name:     String(d[r][1] || '').trim() || id,
        initials: String(d[r][2] || '').trim(),
        dect:     String(d[r][8] || '').trim(),
      });
    }
    equipe.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
  }

  // ── Répertoire hôpital depuis ANNUAIRE, groupé par catégorie ──
  const sh = getOrCreateAnnuaireTab();
  const rows = sh.getDataRange().getValues();
  const map = {}; const order = [];
  for (let r = 1; r < rows.length; r++) {
    const lib = String(rows[r][1] || '').trim();
    const num = String(rows[r][2] || '').trim();
    if (!lib && !num) continue;
    const cat = String(rows[r][0] || '').trim() || 'Divers';
    if (!map[cat]) { map[cat] = []; order.push(cat); }
    map[cat].push({ libelle: lib, numero: num, info: String(rows[r][3] || '').trim() });
  }
  order.sort(function (a, b) { return a.localeCompare(b, 'fr'); });
  const categories = order.map(function (k) { return { categorie: k, entries: map[k] }; });

  return {
    success: true,
    tabUrl: ss.getUrl() + '#gid=' + sh.getSheetId(),
    equipe: equipe,
    categories: categories,
  };
}

// À exécuter UNE FOIS après recopie : crée l'onglet ANNUAIRE + logue l'état.
function testAnnuaire() {
  const r = listAnnuaire();
  Logger.log('🗂️ Onglet ANNUAIRE : ' + r.tabUrl);
  Logger.log('👥 Équipe MAR (DECT) : ' + r.equipe.length + ' actifs');
  Logger.log('☎️ Catégories répertoire : ' + r.categories.length);
  r.categories.forEach(function (c) { Logger.log('  ▸ ' + c.categorie + ' (' + c.entries.length + ')'); });
  Logger.log('✅ testAnnuaire OK — remplis l\'onglet ANNUAIRE (CATÉGORIE | LIBELLÉ | NUMÉRO | INFO).');
}


// ══════════════════════════════════════════════════════════════════════
//  GÉNÉRATEUR DE CRH DE RÉANIMATION (V1) — crh.html
//  Action portail `genererCRH` : synthèse d'un CR à partir des mots
//  d'évolution collés (anonymisés), via l'API Anthropic.
//  Auth : code-gated d'office (checkCode en amont dans doGet).
//  Clé API : ligne ANTHROPIC_TOKEN de l'onglet CONFIG (comme GITHUB_TOKEN).
//  Prompt calé sur les CR validés du service. Modèle configurable ci-dessous.
// ══════════════════════════════════════════════════════════════════════

const CRH_MODELS = {                     // choix manuel depuis l'interface
  sonnet: { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  opus:   { id: 'claude-opus-4-8',   label: 'Opus 4.8' }
};
const CRH_MODEL_DEFAULT = 'sonnet';      // par défaut ; Opus réservé aux séjours longs/complexes
const CRH_ALLOWED = ['FROHLICH'];      // ids MEDECINS autorisés à générer des CRH (accès nominatif)
const CRH_MAX_TOKENS = 8192;           // plafond de sortie

let _anthropicTokenCache = null;
function getAnthropicToken() {
  if (_anthropicTokenCache !== null) return _anthropicTokenCache;
  _anthropicTokenCache = '';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]).trim() === 'ANTHROPIC_TOKEN') { _anthropicTokenCache = String(data[r][1]).trim(); break; }
    }
  }
  return _anthropicTokenCache;
}

const CRH_EX_FAV_COURT = `L'évolution en réanimation est rapidement favorable après mise en place de séances de VNI permettant une eupnée et un passage aux lunettes d'O2 dès J1.

Introduction d'AUGMENTIN en probabiliste devant une hyperthermie à 38,5°C, pour une durée de 5 jours prévue (pas de germe retrouvé sur les différents prélèvements réalisés).

Le patient reste adéfaillant par ailleurs, va au fauteuil, mange et boit sans aide.

Il est transféré en pneumologie le 30/06/2026 pour la suite de la prise en charge.`;

const CRH_EX_APPAREIL = `Admission d'une patiente consciente, bien orientée, normotherme à 36,4°C, normotendue à 13/9 mmHg en RRS à 82/min, eupnéique et normoxique sous O2 à 4 L/min aux lunettes.

Les suites post-opératoires sont simples et marquées par :

  - Sur le plan hémodynamique : stabilité hémodynamique, rythme régulier sinusal.

  - Sur le plan respiratoire : sevrage de l'oxygène dans l'après-midi du 01/07/2026, la patiente restant eupnéique et normoxique en air ambiant par la suite.

  - Sur le plan infectieux : patiente apyrétique, sans sepsis clinique. À noter un syndrome inflammatoire très lentement évolutif (CRP à 96 mg/L le 03/07) pour lequel un ECBC est demandé à titre systématique.

  - Sur le plan neurologique : patiente bien orientée, sans signe de localisation. Ablation accidentelle du cathéter d'analgésie péridurale le 01/07/2026 (grattage sur lésion urticarienne au contact du pansement), relayée par une analgésie multimodale efficace.

  - Sur le plan néphrologique : diurèse spontanée, sans dégradation de la fonction rénale.

  - Sur le plan nutritionnel : reprise d'une alimentation normale à compter du 30/06/2026.

Mme X est transférée le 03/07/2026 en unité de chirurgie pour la suite de la prise en charge.`;

const CRH_EX_CHRONO_GRAVE = `Les 24 premières heures, la patiente reste sédatée sous ventilation protectrice devant une instabilité hémodynamique (NORADRENALINE jusqu'à 0,15 µg/kg/min, remplissage par ALBUMINE et RINGER LACTATE), avec une hyperlactatémie maximale à 3,6 mmol/L, une oligurie et une acidose (pH 7,17, HCO3 17 mmol/L) et des troubles électrolytiques. Drainage pleural bilatéral dans les 24 premières heures pour un épanchement de grande abondance.

Extubation à J1, sevrage de la NORADRENALINE à J2, reprise d'une diurèse spontanée et correction des troubles hydro-électrolytiques. Transfusion d'1 CGR.

Analgésie multimodale optimale avec cathéter péridural thoracique, retiré le 18/06. Ablation des drains le 18/06 avec radiographie thoracique de contrôle.

Reprise du transit aux gaz et ablation de la SNG le 14/06 ; alimentation parentérale débutée à J1 puis reprise progressive per os, marquée par des nausées et vomissements cédant sous prokinétiques.

Hors antibiotique, subfébrile, sans syndrome inflammatoire biologique.

Transfert en service de chirurgie le 23/06 pour la suite de la prise en charge.`;

const CRH_EX_CHRONO_DECES = `L'évolution en réanimation est initialement favorable, avec un patient rapidement stable hémodynamiquement sous TAZOCILLINE probabiliste introduite dans le cadre de la pose de prothèse biliaire en peropératoire.

Le scanner réalisé le 26/06 pour contrôle du montage chirurgical devant un syndrome inflammatoire met en évidence fortuitement une embolie pulmonaire distale du lobe inférieur droit, bien tolérée sur les plans hémodynamique et respiratoire, motivant l'introduction d'HNF IVSE.

L'antibiothérapie est adaptée aux prélèvements biliaires peropératoires (Escherichia coli, Enterobacter cloacae complex, Enterococcus faecalis, tous sensibles à la TAZOCILLINE).

À J5, devant une fonction rénale normale et une tolérance satisfaisante, l'anticoagulation curative par HNF IVSE est relayée par LOVENOX 6 000 UI × 2/j en sous-cutané. L'iléus postopératoire est pris en charge par aspiration gastrique et introduction d'ERYTHROMYCINE 250 mg × 2/j. L'alimentation parentérale exclusive est maintenue tout au long du séjour.

Le 30/06 à 7h15, appel pour dégradation hémodynamique brutale avec coma, tachycardie mal tolérée et hypotension, motivant une cardioversion pharmacologique par CORDARONE puis une intubation orotrachéale. Arrêt cardiaque à 7h42 sur bradycardie extrême, sans rythme choquable ; devant une suspicion d'embolie pulmonaire massive à l'échographie de débrouillage (cavités droites dilatées), injection d'ACTILYSE en cours de RCP (45 minutes, 7 mg d'ADRÉNALINE, GLUCONATE DE CALCIUM, BICARBONATE MOLAIRE). En accord avec l'équipe médicale, arrêt de la réanimation.

Le patient décède le 30/06/2026 à 08h30.`;

function crhSystemPrompt_() {
  return `Tu es un assistant de rédaction médicale spécialisé en réanimation, pour un anesthésiste-réanimateur.

RÈGLE ABSOLUE DE CONFIDENTIALITÉ : le texte d'entrée doit être anonymisé. Si tu y repères malgré tout un élément identifiant (nom de patient, date de naissance, numéro de dossier/IPP), NE PRODUIS PAS le compte rendu : réponds uniquement « ⚠️ Le texte contient un élément identifiant — retire-le puis relance. » Ne recopie jamais un tel élément dans ta réponse.

ENTRÉE : un bloc unique de mots d'évolution quotidiens ANONYMISÉS (motif/antécédents éventuels en tête, puis les journées repérables par « J1 », « J+3 », dates type 12/06). Repère-les et ordonne-les chronologiquement.

Tu produis un compte rendu d'hospitalisation (CRH) de réanimation dans le format demandé.

═══ PRINCIPE DIRECTEUR — BRIÈVETÉ ET PÉRIMÈTRE ═══
Document TRÈS SYNTHÉTIQUE, centré sur LE SÉJOUR EN RÉANIMATION. Un séjour simple tient en quelques phrases ; un séjour grave/complexe peut être un peu plus développé, mais reste synthétique.
IMPORTANT — SÉJOURS LONGS (plusieurs semaines) : ne rallonge PAS le compte rendu proportionnellement à la durée, et ne fais JAMAIS une chronique jour par jour. Regroupe l'évolution par grands problèmes (respiratoire, infectieux, chirurgical…) et par phases (initiale / complications / récupération), en ne retenant que les événements marquants et les tournants de prise en charge. Condense les périodes stables en une phrase (« évolution stable jusqu'au… »). Même un séjour de 40 à 50 jours doit tenir en une synthèse d'environ une à deux pages.
- Le motif d'admission/transfert en réa tient en une phrase ou est intégré à la synthèse. Ne reprends pas l'histoire ni les soins antérieurs à la réa, ni les découvertes incidentes de bilan (sauf si elles conditionnent le suivi — une demi-phrase).
- Une phrase par plan, uniquement pour les plans ayant présenté un événement notable EN réa. Omets les autres — n'écris JAMAIS « non renseigné ».
- Pas de chronique jour par jour datée. Dans le doute, COUPE.

═══ RÈGLES DE STYLE AFFINÉES (issues des corrections du médecin — à respecter absolument) ═══
1. INTRO sobre et fidèle à la chronologie : « L'évolution en réanimation est rapidement favorable. » Si le séjour se dégrade ou aboutit à un décès, écris « initialement favorable » et laisse le récit dérouler la dégradation — N'ANNONCE PAS l'issue ni le diagnostic complet dans la première phrase. N'accole pas le geste chirurgical à l'intro.
2. ÉTAT DE SORTIE : ne le mentionne QUE s'il est EXPLICITEMENT écrit dans les notes (autonomie, alimentation, mobilisation, absence de défaillance). Dans ce cas seulement, emploie « reste adéfaillant(e), va au fauteuil, mange et boit sans aide » (adéfaillant = sans défaillance d'organe), sans le paraphraser. Sinon, N'AJOUTE RIEN sur l'état de sortie — ne l'invente jamais, ne le déduis pas d'une évolution favorable.
3. ANTIBIOTHÉRAPIE : précise la durée (« pour une durée de X jours », « 48h ») et le résultat des prélèvements (germe identifié, ou « pas de germe retrouvé »).
4. CHIFFRES — distingue :
   • GARDE ceux qui justifient une décision/un geste (drain retiré devant un débit < 100 cc/j), les posologies notables (LOVENOX 6 000 UI × 2/j), les troubles électrolytiques, l'Hb de sortie, et — dans un séjour GRAVE — les marqueurs de défaillance (lactatémie, pH, dose d'amines en µg/kg/min, GDS).
   • SUPPRIME les chiffres purement descriptifs (volume d'un redon → « peu productif ») et les détails de titration progressive.
5. EXAMENS : ne mentionne un examen que s'il modifie la prise en charge, avec son MOTIF et le caractère de la découverte, SANS lister ses résultats exhaustifs. Exception : un examen central au motif d'hospitalisation (TDM cérébrale d'un trauma crânien) peut être décrit. Omets les examens de routine.
6. GESTES/DÉCISIONS : justifie-les brièvement (pourquoi ce switch d'antibiotique, pourquoi ce retrait de drain).
7. Garde les TROUBLES ÉLECTROLYTIQUES suivis (hypokaliémie, hypophosphatémie, hypomagnésémie « en cours de correction »).
8. SERVICE D'AVAL : indique le service de destination réel tel qu'il ressort des notes (« chirurgie viscérale », « urologie », « pneumologie », ou « service de chirurgie » si non précisé), date complète JJ/MM/AAAA. Ne l'invente pas, ne le sur-spécifie pas.
9. Pour un séjour simple, FUSIONNE admission et évolution initiale ; n'ouvre pas chaque segment par « À l'admission (date)… Dès J1 (date)… ».

═══ ÉLÉMENTS RÉCURRENTS (à inclure seulement s'ils sont documentés, jamais à inventer) ═══
- ANALGÉSIE : « Analgésie multimodale optimale / adaptée / efficace », avec le dispositif si présent (péridurale, cathéter de paroi/nerveux) et sa date d'ablation.
- RÉHABILITATION précoce / retour en service, quand mentionnée.
- Pour le format par appareil, si l'état et les constantes d'admission sont fournis, tu PEUX ouvrir par une phrase d'admission : « Admission d'un(e) patient(e) conscient(e), bien orienté(e), [température], [TA] en [rythme], eupnéique/normoxique sous [support O2] ».
- Intitulés d'appareils usuels (adapte à ceux qui sont actifs) : neurologique, respiratoire, hémodynamique, infectieux, rénal (ou rénal/métabolique, néphrologique), digestif (ou digestif/chirurgical), chirurgical, métabolique, nutritionnel.

═══ STYLE MAISON ═══
- Médicaments/molécules/antibiotiques TOUJOURS EN MAJUSCULES (NORADRENALINE, TAZOCILLINE, LINEZOLIDE, LOVENOX).
- Germes nommés précisément (genre + espèce) quand décisifs.
- Dates réelles JJ/MM (JJ/MM/AAAA entrée/sortie) si présentes ; sinon repères Jn. N'INVENTE aucune date.
- Patient : « Mr X » / « Mme X » (ou « le patient »/« la patiente » si genre indéterminable). Aucun identifiant.
- Abréviations médicales conservées (OHDN, VNI, FiO2, SpO2, NAD, KDIGO, IVSE, HNF, RRS, GDS, SNG, ECBU…).
- Phrases denses et causales (« motivant », « permettant », « devant »), 3e personne.
- Conclusion : devenir daté (domicile / transfert / décès daté avec heure si mentionnée), suivi et reprise du traitement personnel éventuels.

═══ FORMAT « PAR APPAREIL » (courts/simples) ═══
Intro brève (ou phrase d'admission si constantes fournies), puis la liste des plans, chacun sur sa propre ligne au format EXACT «   - Sur le plan [appareil] : … » (deux espaces, un tiret, une espace, l'intitulé, puis « : » avant le contenu), pour les seuls plans actifs, puis état de sortie éventuel et conclusion datée.
═══ FORMAT « CHRONOLOGIQUE » (longs/complexes) ═══
Récit synthétique daté regroupé par fil narratif (et non jour par jour), puis état de sortie éventuel et conclusion datée. Pour un séjour long, structure par phases et par problèmes plutôt que par journées ; condense les périodes stables en une phrase.

═══ SÉCURITÉ ═══
N'invente AUCUNE donnée absente. Ne réintroduis aucun identifiant. Brouillon destiné à être relu et validé par le médecin. Ne produis que le compte rendu, sans préambule ni commentaire.

═══ EXEMPLES DE RÉFÉRENCE (calque le ton, la longueur et le niveau ; ne réutilise JAMAIS leur contenu clinique) ═══

[Favorable court — transfert]
${CRH_EX_FAV_COURT}

[Par appareil complet — post-op, transfert]
${CRH_EX_APPAREIL}

[Chronologique — séjour grave, évolution favorable]
${CRH_EX_CHRONO_GRAVE}

[Chronologique — décès]
${CRH_EX_CHRONO_DECES}`;
}

function genererCRH_(payload, user) {
  if (!user || CRH_ALLOWED.indexOf(String(user.id)) === -1) {
    return { success: false, error: 'Accès réservé.' };
  }
  const texte  = String((payload && payload.texte)  || '').trim();
  const format = String((payload && payload.format) || 'appareil').trim();
  if (!texte) return { success: false, error: 'Aucun texte fourni.' };
  // (C1b) Traçabilité : la génération exige la confirmation explicite d'anonymisation.
  // On journalise l'usage (qui, quand) — JAMAIS le contenu clinique.
  if (!(payload && payload.confirmAnonyme === true)) {
    return { success: false, error: "Confirme d'abord l'anonymisation du texte (case à cocher)." };
  }
  try { logAction('CRH généré par ' + user.id + ' — anonymisation confirmée'); } catch (e) {}

  const token = getAnthropicToken();
  if (!token) return { success: false, error: "Cle API absente : ajoute une ligne ANTHROPIC_TOKEN dans l'onglet CONFIG." };

  const fmt = (format === 'chrono')
    ? 'CHRONOLOGIQUE (recit date synthetique)'
    : 'PAR APPAREIL (intro/admission breve puis liste «   - Sur le plan … : … », plans actifs seulement)';

  const userMsg = 'Format demande : ' + fmt + '.\n\n'
    + "Rappel : tres synthetique, centre rea ; applique les regles affinees (intro sans spoiler, "
    + "etat de sortie UNIQUEMENT s'il est explicitement ecrit, duree d'ATB, chiffres decisionnels seulement, "
    + "examens contextualises, service d'aval reel). N'invente rien.\n\n"
    + "Mots d'evolution du sejour (bloc unique a segmenter puis synthetiser) :\n\n" + texte;

  const mkey = (payload && payload.model === 'opus') ? 'opus' : CRH_MODEL_DEFAULT;
  const chosen = CRH_MODELS[mkey] || CRH_MODELS[CRH_MODEL_DEFAULT];

  const body = {
    model: chosen.id,
    max_tokens: CRH_MAX_TOKENS,
    system: crhSystemPrompt_(),
    messages: [{ role: 'user', content: userMsg }]
  };

  let res;
  try {
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-api-key': token, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
  } catch (e) {
    return { success: false, error: 'Appel API impossible : ' + e };
  }

  const code = res.getResponseCode();
  if (code !== 200) {
    let msg = 'Erreur API (' + code + ')';
    if (code === 401)      msg = "Cle API invalide : verifie ANTHROPIC_TOKEN dans l'onglet CONFIG.";
    else if (code === 429) msg = 'Credit epuise ou limite atteinte — recharge le compte API.';
    return { success: false, error: msg };
  }

  let data;
  try { data = JSON.parse(res.getContentText()); }
  catch (e) { return { success: false, error: 'Reponse illisible du serveur.' }; }

  const cr = (data.content || [])
    .filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; })
    .join('\n').trim();

  if (!cr) {
    var sr = data.stop_reason || '(non precise)';
    Logger.log('CRH reponse sans texte — stop_reason=' + sr + ' — brut(700c): ' + String(res.getContentText() || '').slice(0, 700));
    return { success: false, error: 'Reponse sans texte (raison : ' + sr + '). Detail dans les logs Apps Script (Executions).' };
  }
  return { success: true, cr: cr, truncated: data.stop_reason === 'max_tokens',
           out_tokens: (data.usage && data.usage.output_tokens) || null, cap: CRH_MAX_TOKENS,
           model_used: chosen.label };
}

// ── À exécuter UNE FOIS après recopie : vérifie la clé + un CR de test ──
function testCRH() {
  const t = getAnthropicToken();
  Logger.log(t ? '🔑 ANTHROPIC_TOKEN présent (longueur ' + t.length + ')' : '❌ ANTHROPIC_TOKEN absent — ajoute-le dans CONFIG.');
  if (!t) return;
  const r = genererCRH_({ texte: 'J1 : patient stable, eupnéique en air ambiant. Transfert en chirurgie le 10/07.', format: 'appareil' });
  Logger.log(r.success ? ('✅ CR de test :\n' + r.cr) : ('❌ ' + r.error));
}



// ════════════════════════════════════════════════════════════════════
//  DÉCLARATION D'INTERVENTION LIBÉRALE — onglet LIBERAL_{Y}
//  (à distinguer de la « déclaration de choix », le document signé par le
//   patient : ici il s'agit de la présence au bloc annoncée AU COMITÉ.)
//
//  Payload FERMÉ, 6 colonnes, AUCUNE donnée patient, AUCUN code CCAM :
//    ID | DATE_CONSULT | DATE_BLOC | MAR_ID | SECTEUR | CHIRURGIE
//  - ID          : poignée aléatoire, pour cibler une ligne (suppression / fusion)
//                  sans dépendre du numéro de ligne (fragile si l'onglet est trié).
//  - DATE_CONSULT: J0, informatif (suivi NGAP plus tard) — pris à aujourd'hui.
//  - DATE_BLOC   : jour de l'acte, ce que lit le comité. Détermine l'ANNÉE de l'onglet.
//  - MAR_ID      : TOUJOURS celui du code d'accès (user.id), jamais une valeur cliente.
//  - SECTEUR     : code SECTEURS, obligatoire (sans lui, rien à placer).
//  - CHIRURGIE   : libellé court libre, facultatif (idée de durée pour le comité).
//
//  Granularité : une ligne = une journée-bloc DANS UN SECTEUR pour un MAR.
//  Même MAR + même jour + même secteur => la ligne existante est MISE À JOUR
//  (libellé chirurgie cumulé), pas dupliquée. Deux secteurs le même jour => 2 lignes.
// ════════════════════════════════════════════════════════════════════
const LIBERAL_HEADER = ['ID', 'DATE_CONSULT', 'DATE_BLOC', 'MAR_ID', 'SECTEUR', 'CHIRURGIE'];

// Aujourd'hui en 'yyyy-MM-dd', fuseau du script.
function _todayISO_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function _libSheetName(year) { return 'LIBERAL_' + year; }

// Onglet de l'année du JOUR DE BLOC, créé à la volée (comme SECTEURS).
function _getOrCreateLiberalTab(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = _libSheetName(year);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, LIBERAL_HEADER.length).setValues([LIBERAL_HEADER]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() < 1) {
    sh.getRange(1, 1, 1, LIBERAL_HEADER.length).setValues([LIBERAL_HEADER]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// 'yyyy-MM-dd' → année (nombre). Rejette tout ce qui n'est pas une date ISO.
function _libYearOf(dateBloc) {
  const s = String(dateBloc || '').trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? parseInt(m[1], 10) : null;
}

function _libNewId() {
  return 'L-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

// ── ÉCRITURE : déclarer (ou compléter) une intervention ──────────────
function declareLiberal(payload, user) {
  if (!user || user.role !== 'mar') return { success: false, error: 'Réservé aux MAR identifiés.' };
  const marId  = user.id;                                    // JAMAIS payload : anti-usurpation
  // _isoDate() vit dans Indispos.gs (meme projet GAS). Attention : _isoDate(undefined)
  // renvoie la chaine "undefined" -> on ne l'appelle que si la valeur est presente.
  const dateBloc = (payload && payload.dateBloc) ? _isoDate(payload.dateBloc) : '';
  const secteur  = String((payload && payload.secteur) || '').trim().toUpperCase();
  const chir     = String((payload && payload.chirurgie) || '').trim().slice(0, 80);
  // _isoDate(undefined) renvoie la CHAINE "undefined" (String(undefined)), pas '' :
  // on ne lui passe donc que des valeurs presentes, sinon on prend aujourd'hui.
  const dateCons = (payload && payload.dateConsult) ? _isoDate(payload.dateConsult) : _todayISO_();

  if (!dateBloc)  return { success: false, error: 'Jour du bloc manquant ou invalide.' };
  const year = _libYearOf(dateBloc);
  if (!year)      return { success: false, error: 'Jour du bloc invalide.' };
  if (!secteur)   return { success: false, error: 'Secteur obligatoire.' };

  const sh = _getOrCreateLiberalTab(year);
  const data = sh.getDataRange().getValues();

  // Fusion : même MAR + même jour + même secteur → on complète la ligne existante.
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][3]).trim() === marId
        && _isoDate(data[r][2]) === dateBloc
        && String(data[r][4]).trim().toUpperCase() === secteur) {
      if (chir) {
        const prev = String(data[r][5] || '').trim();
        const parts = prev ? prev.split(' + ') : [];
        if (parts.indexOf(chir) === -1) {
          const merged = prev ? (prev + ' + ' + chir) : chir;
          sh.getRange(r + 1, 6).setValue(merged.slice(0, 120));
        }
      }
      return { success: true, merged: true, id: String(data[r][0]) };
    }
  }

  const id = _libNewId();
  sh.appendRow([id, dateCons, dateBloc, marId, secteur, chir]);
  return { success: true, merged: false, id: id };
}

// ── ÉCRITURE : supprimer une de SES lignes ───────────────────────────
function deleteLiberal(payload, user) {
  if (!user || user.role !== 'mar') return { success: false, error: 'Réservé aux MAR identifiés.' };
  const marId = user.id;
  const id    = String((payload && payload.id) || '').trim();
  const year  = parseInt(payload && payload.year, 10);
  if (!id)   return { success: false, error: 'Identifiant manquant.' };
  if (!year) return { success: false, error: 'Année manquante.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(_libSheetName(year));
  if (!sh) return { success: false, error: 'Aucune déclaration cette année.' };
  const data = sh.getDataRange().getValues();

  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim() === id) {
      // On ne supprime QUE si la ligne appartient au MAR connecté.
      if (String(data[r][3]).trim() !== marId) return { success: false, error: 'Cette déclaration n\'est pas la vôtre.' };
      sh.deleteRow(r + 1);
      return { success: true, id: id };
    }
  }
  return { success: false, error: 'Déclaration introuvable (déjà supprimée ?).' };
}

// ── LECTURE COMITÉ : toutes les déclarations d'UN JOUR ───────────────
// Sert au volet « Libéral » du planning (admin.html). Renvoie les MAR_ID bruts :
// admin.html tient déjà `marsData` en mémoire pour résoudre les noms, inutile de
// les transporter. AUCUN jugement de placement n'est calculé ici — le module
// énonce un fait, le comité décide seul.
function listLiberalJour(payload, user) {
  if (!user || user.role !== 'admin') return { success: false, error: 'Réservé au comité.' };
  const date = (payload && payload.date) ? _isoDate(payload.date) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, error: 'Date invalide.' };
  const year = _libYearOf(date);
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(_libSheetName(year));
  if (!sh) return { success: true, date: date, items: [] };   // année sans déclaration : liste vide, pas une erreur

  const data = sh.getDataRange().getValues();
  const items = [];
  for (let r = 1; r < data.length; r++) {
    if (_isoDate(data[r][2]) !== date) continue;
    items.push({
      id:        String(data[r][0]),
      marId:     String(data[r][3]).trim(),
      secteur:   String(data[r][4]).trim().toUpperCase(),
      chirurgie: String(data[r][5] || '').trim(),
    });
  }
  items.sort((a, b) => String(a.marId).localeCompare(String(b.marId)));
  return { success: true, date: date, items: items };
}

// ── LECTURE : MES déclarations de l'année (filtrées sur MON id) ───────
function listLiberal(payload, user) {
  if (!user || user.role !== 'mar') return { success: false, error: 'Réservé aux MAR identifiés.' };
  const marId = user.id;
  const year  = parseInt(payload && payload.year, 10) || _libYearOf(_todayISO_());
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(_libSheetName(year));
  if (!sh) return { success: true, year: year, items: [] };

  const data = sh.getDataRange().getValues();
  const items = [];
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][3]).trim() !== marId) continue;       // JAMAIS les lignes d'un autre
    items.push({
      id:        String(data[r][0]),
      dateBloc:  _isoDate(data[r][2]),
      secteur:   String(data[r][4]).trim().toUpperCase(),
      chirurgie: String(data[r][5] || '').trim(),
    });
  }
  items.sort((a, b) => String(a.dateBloc).localeCompare(String(b.dateBloc)));
  return { success: true, year: year, items: items };
}

/* ════════════════════════════════════════════════════════════════════
   SECTEURS — source unique externalisée (étape 2).
   Onglet 'SECTEURS' : redéfinir les secteurs sans toucher au code.
   Colonnes : ORDRE | CODE | LABEL | COURT | AFF | ICON | BG | FG | CS | ACTIF | RENDEMENT_LIB
   RENDEMENT_LIB (FORT/MOYEN/NUL/REA) : attribut de rendement libéral,
   consommé plus tard par le module libéral (réallocation). Éditable en cellule.
   ════════════════════════════════════════════════════════════════════ */
const SECTEURS_TAB = 'SECTEURS';

// En-tête + valeurs d'amorçage = les 9 secteurs actuels, à l'identique.
// (Les 4 valeurs RENDEMENT_LIB sont des défauts éditables : rien ne les
//  consomme encore. REA→REA et ORL→FORT sont établis ; le reste à ajuster.)
// XL_* (07/2026) : ce que l'EXPORT EXCEL doit écrire, qui diffère du web —
// le fichier reprend l'ancien tableau papier (noms courts en MAJUSCULES, couleurs
// franches, certains secteurs sur 1 seule ligne). Ajoutées EN FIN : les index de
// colonne 0-10 utilisés par getSecteurs() restent inchangés.
// Laisser vide = valeur par défaut (voir getSecteurs) : rien ne casse.
const _SECTEURS_HEADER = ['ORDRE','CODE','LABEL','COURT','AFF','ICON','BG','FG','CS','ACTIF','RENDEMENT_LIB',
                          'XL_LABEL','XL_BG','XL_ROWS'];

// Valeurs Excel des 9 secteurs actuels, pour l'amorçage et la migration.
const _SECTEURS_XL = {
  VIS: ['VISCERAL',        'FFE699', 2],
  REA: ['REANIMATION',     '9DC3E6', 2],
  ORT: ['ORTHO',           'F4B183', 2],
  DVI: ['DVI',             'F4B183', 1],
  ORL: ['ORL  OPHTALMO',   'FFF2CC', 2],
  END: ['ENDOSCOPIES',     'C6E0B4', 2],
  CI:  ['CARDIO INTERV.',  'E7E6E6', 1],
  RI:  ['RADIO / INTERV.', 'E7E6E6', 1],
  MAT: ['MATERNITE',       'FFA7A9', 2],
};
const _XL_BG_DEFAUT = 'F2F2F2';   // gris clair, pour un secteur sans couleur choisie
const _XL_ROWS_DEFAUT = 2;
const _SECTEURS_SEED = [
  [1,'VIS','Bloc viscéral',            'Viscéral', 'Viscéral',    'Activity',   '#EFF6FF','#1D4ED8','CS-VIS',   'O','MOYEN', 'VISCERAL'        , 'FFE699'  , 2],
  [2,'REA','Réanimation',              'Réa',      'Réanimation', 'HeartPulse', '#FFF1F2','#BE123C','',         'O','REA'  , 'REANIMATION'     , '9DC3E6'  , 2],
  [3,'ORT','Orthopédie',               'Ortho',    'Ortho',       'Bone',       '#FFF7ED','#C2410C','CS-ORT',   'O','FORT' , 'ORTHO'           , 'F4B183'  , 2],
  [4,'DVI','Pose DVI',                 'DVI',      '',            'Syringe',    '',       '',       '',         'O','NUL'  , 'DVI'             , 'F4B183'  , 1],
  [5,'ORL','ORL / Ophtalmologie',      'ORL',      'ORL',         'Eye',        '#FDF4FF','#7E22CE','CS-ORL',   'O','FORT' , 'ORL  OPHTALMO'   , 'FFF2CC'  , 2],
  [6,'END','Endoscopies',              'Endo',     'Endoscopies', 'Microscope', '#F0FDF4','#166534','CS-END',   'O','MOYEN', 'ENDOSCOPIES'     , 'C6E0B4'  , 2],
  [7,'CI', 'Cardio interventionnelle', 'Cardio',   'Cardio/Inter','Heart',      '#ECFDF5','#065F46','CS-INTER', 'O','MOYEN', 'CARDIO INTERV.'  , 'E7E6E6'  , 1],
  [8,'RI', 'Radio interventionnelle',  'Radio',    'Radio/Inter', 'Zap',        '#FFFBEB','#92400E','',         'O','MOYEN', 'RADIO / INTERV.' , 'E7E6E6'  , 1],
  [9,'MAT','Maternité',                'Maternité','Maternité',   'Baby',       '#FDF2F8','#9D174D','CS-MAT',   'O','NUL'  , 'MATERNITE'       , 'FFA7A9'  , 2],
];

// Crée l'onglet s'il manque, l'amorce s'il est vide. N'écrase JAMAIS des
// lignes existantes (les éditions manuelles font foi).
// ══════════════════════════════════════════════════════════════════════
//  ONGLET CS_TEMPLATE — créneaux de consultation de la semaine type
// ══════════════════════════════════════════════════════════════════════
// ÉTAPE 2a du chantier « secteurs » : on CRÉE l'onglet, on ne le consomme
// pas encore. `admin.html` continue d'utiliser sa table `CS_REQUIRED` : tant
// que l'étape 2c n'est pas faite, éditer cet onglet ne change RIEN à l'écran.
//
// Forme choisie : 1 ligne par type de consultation, 1 colonne par demi-journée
// — la semaine se lit d'un coup d'œil, et LABEL/OUVRABLE/ACTIF ne sont écrits
// qu'une fois (pas de répétition qui pourrait diverger).
//
// CODE     = clé TECHNIQUE. Écrite dans PLANNING_OVERRIDES et le planning publié :
//            ne JAMAIS la renommer sur un onglet en service (les affectations déjà
//            posées deviendraient orphelines). Pour changer d'organisation, ajouter
//            de nouvelles lignes et passer les anciennes à ACTIF=N.
// LABEL    = affichage seul, librement modifiable.
// OUVRABLE = O : le comité peut ouvrir ce créneau à la demande.
// ACTIF    = N : la ligne est ignorée sans être supprimée (garde l'historique).
//            C'est le mécanisme prévu pour le futur passage par secteur
//            (bloc court / bloc long) au lieu de par spécialité.
const CS_TEMPLATE_TAB = 'CS_TEMPLATE';

const _CS_TEMPLATE_HEADER = ['CODE','LABEL','OUVRABLE','ACTIF',
  'LUN_AM','LUN_PM','MAR_AM','MAR_PM','MER_AM','MER_PM','JEU_AM','JEU_PM','VEN_AM','VEN_PM',
  'XL_LABEL','XL_BG'];

// Libellés et couleurs de l'EXPORT EXCEL, qui diffèrent du web (le fichier reprend
// l'ancien tableau papier). Les mentions « / URO. » et « / OPHTALMO. » sont des
// abus de langage assumés : le bloc viscéral couvre viscéral ET uro, le bloc ORL
// couvre ORL ET ophtalmo — il n'existe PAS de code distinct pour ces spécialités.
const _CS_TEMPLATE_XL = {
  'CS-VIS':   [' VISC. / URO.',     'FFE699'],
  'CS-END':   [' ENDOSCOPIES',      'C6E0B4'],
  'CS-ORL':   [' ORL / OPHTALMO.',  'FFF2CC'],
  'CS-ORT':   [' ORTHO.',           'F4B183'],
  'CS-MAT':   [' MATERNITE',        'FFA7A9'],
  'CS-POLY':  [' POLYVALENT',       'F2F2F2'],
  'CS-INTER': [' INTERVENTIONNEL',  'E7E6E6'],
};

// Amorçage = les 23 créneaux actuels, repris À L'IDENTIQUE de CS_REQUIRED
// (admin.html), qui est la table réellement active aujourd'hui.
const _CS_TEMPLATE_SEED = [
  ['CS-VIS',   'CS Viscéral',        'O','O', 0,2, 0,1, 0,1, 0,1, 0,0, ' VISC. / URO.'     , 'FFE699'],
  ['CS-END',   'CS Endoscopies',     'O','O', 0,2, 0,1, 0,1, 0,2, 0,0, ' ENDOSCOPIES'      , 'C6E0B4'],
  ['CS-ORL',   'CS ORL',             'O','O', 0,0, 1,0, 1,0, 1,0, 1,0, ' ORL / OPHTALMO.'  , 'FFF2CC'],
  ['CS-ORT',   'CS Orthopédie',      'O','O', 0,0, 0,1, 0,1, 0,0, 1,0, ' ORTHO.'           , 'F4B183'],
  ['CS-MAT',   'CS Maternité',       'O','O', 0,0, 1,0, 0,0, 1,0, 0,0, ' MATERNITE'        , 'FFA7A9'],
  ['CS-POLY',  'CS Polyvalente',     'O','O', 0,0, 0,0, 1,0, 0,0, 0,0, ' POLYVALENT'       , 'F2F2F2'],
  ['CS-INTER', 'CS Interventionnel', 'O','O', 0,0, 0,0, 0,1, 0,1, 0,0, ' INTERVENTIONNEL'  , 'E7E6E6'],
];

// Crée l'onglet s'il manque, l'amorce s'il est vide. N'écrase JAMAIS de lignes
// existantes : une fois l'onglet rempli, les éditions manuelles font foi.
function getOrCreateCsTemplateTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CS_TEMPLATE_TAB);
  const amorcer = () => {
    sh.getRange(1, 1, 1, _CS_TEMPLATE_HEADER.length).setValues([_CS_TEMPLATE_HEADER]).setFontWeight('bold');
    sh.getRange(2, 1, _CS_TEMPLATE_SEED.length, _CS_TEMPLATE_HEADER.length).setValues(_CS_TEMPLATE_SEED);
    sh.setFrozenRows(1);
    sh.setFrozenColumns(2);
    sh.setColumnWidth(1, 90);
    sh.setColumnWidth(2, 170);
  };
  if (!sh) { sh = ss.insertSheet(CS_TEMPLATE_TAB); amorcer(); }
  else if (sh.getLastRow() < 2) { amorcer(); }
  else _migrerColonnesXlCs_(sh);   // onglet déjà rempli → compléter si besoin
  return sh;
}

// Migration douce (07/2026) : CS_TEMPLATE passe de 14 à 16 colonnes (XL_LABEL / XL_BG).
// Idempotente, n'écrase jamais une cellule déjà saisie.
function _migrerColonnesXlCs_(sh) {
  try {
    if (sh.getLastColumn() < _CS_TEMPLATE_HEADER.length) {
      sh.getRange(1, 1, 1, _CS_TEMPLATE_HEADER.length)
        .setValues([_CS_TEMPLATE_HEADER]).setFontWeight('bold');
      Logger.log('Onglet CS_TEMPLATE : colonnes XL_LABEL / XL_BG ajoutées.');
    }
    const rows = sh.getDataRange().getValues();
    for (let r = 1; r < rows.length; r++) {
      const code = String(rows[r][0] || '').trim().toUpperCase();
      const vals = _CS_TEMPLATE_XL[code];
      if (!code || !vals) continue;
      for (let k = 0; k < 2; k++) {
        const cur = rows[r][14 + k];
        if (cur === '' || cur == null) sh.getRange(r + 1, 15 + k).setValue(vals[k]);
      }
    }
  } catch (e) {
    Logger.log('_migrerColonnesXlCs_ : ' + e.message);
  }
}

// One-shot manuel : à lancer une fois dans l'éditeur Apps Script.
// Affiche le récapitulatif pour contrôle visuel avant toute bascule.
function initCsTemplate() {
  const sh = getOrCreateCsTemplateTab();
  const t = getCsTemplate();
  const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
  let total = 0;
  Logger.log('Onglet ' + CS_TEMPLATE_TAB + ' prêt : ' + t.types.length + ' type(s) de consultation.');
  Logger.log('── Semaine type ──');
  for (let d = 0; d < 5; d++) {
    ['am','pm'].forEach(function (half) {
      const m = t.required[d][half], codes = Object.keys(m);
      if (!codes.length) return;
      const txt = codes.map(function (c) {
        total += m[c];
        return c.replace('CS-', '') + (m[c] > 1 ? '×' + m[c] : '');
      }).join(', ');
      Logger.log('  ' + JOURS[d] + ' ' + (half === 'am' ? 'matin     ' : 'après-midi') + ' : ' + txt);
    });
  }
  Logger.log('── TOTAL : ' + total + ' créneaux/semaine (doit valoir 23 au premier amorçage) ──');
  Logger.log('ℹ️ Cet onglet n\'est PAS encore consommé : le modifier ne change rien à l\'écran.');
  return t.types.length;
}

// Lecture → { types:[{code,label,ouvrable,actif}], required:{0..4:{am:{},pm:{}}} }
// `required` a EXACTEMENT la forme de CS_REQUIRED (admin.html) pour que la
// bascule de l'étape 2c soit un simple remplacement de source.
// Les lignes ACTIF=N sont ignorées ; les effectifs à 0 ne sont pas écrits.
function getCsTemplate() {
  const sh = getOrCreateCsTemplateTab();
  const rows = sh.getDataRange().getValues();
  const types = [];
  const required = {};
  for (let d = 0; d < 5; d++) required[d] = { am: {}, pm: {} };

  for (let r = 1; r < rows.length; r++) {
    const code = String(rows[r][0] || '').trim();
    if (!code) continue;
    if (String(rows[r][3] || '').trim().toUpperCase() !== 'O') continue;   // ACTIF=N → ignoré
    types.push({
      code:     code,
      label:    String(rows[r][1] || '').trim(),
      ouvrable: String(rows[r][2] || '').trim().toUpperCase() === 'O',
      actif:    true,
      // Colonnes EXCEL. Vides = défauts, pour qu'une consultation créée sans les
      // remplir apparaisse quand même dans le fichier du vendredi.
      // PAS de .trim() sur le libellé : l'espace initial est VOULU, il décale le
      // texte dans la cellule Excel (' VISC. / URO.'). On ne nettoie qu'à droite.
      xlLabel:  String(rows[r][14] || '').replace(/\s+$/, '')
                || ' ' + String(rows[r][1] || code).replace(/^CS[- ]*/i, '').trim().toUpperCase(),
      xlBg:     String(rows[r][15] || '').trim().replace(/^#/, '').toUpperCase() || 'F2F2F2',
    });
    for (let d = 0; d < 5; d++) {
      ['am', 'pm'].forEach(function (half, hi) {
        const n = Number(rows[r][4 + d * 2 + hi]) || 0;   // col. 5 = LUN_AM, puis 2 par jour
        if (n > 0) required[d][half][code] = n;
      });
    }
  }
  return { types: types, required: required };
}

function getOrCreateSecteursTab() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SECTEURS_TAB);
  if (!sh) {
    sh = ss.insertSheet(SECTEURS_TAB);
    sh.getRange(1, 1, 1, _SECTEURS_HEADER.length).setValues([_SECTEURS_HEADER]).setFontWeight('bold');
    sh.getRange(2, 1, _SECTEURS_SEED.length, _SECTEURS_HEADER.length).setValues(_SECTEURS_SEED);
    sh.setFrozenRows(1);
    sh.setColumnWidth(3, 220);
  } else if (sh.getLastRow() < 2) {
    // Onglet présent mais vide (en-tête seul ou rien) → on amorce.
    sh.getRange(1, 1, 1, _SECTEURS_HEADER.length).setValues([_SECTEURS_HEADER]).setFontWeight('bold');
    sh.getRange(2, 1, _SECTEURS_SEED.length, _SECTEURS_HEADER.length).setValues(_SECTEURS_SEED);
    sh.setFrozenRows(1);
  } else {
    _migrerColonnesXL_(sh);   // onglet déjà rempli → compléter si besoin
  }
  return sh;
}

// Migration douce (07/2026) : l'onglet SECTEURS passe de 11 à 14 colonnes
// (XL_LABEL / XL_BG / XL_ROWS). Ajoute les colonnes à un onglet DÉJÀ REMPLI et
// pré-remplit les 9 secteurs connus avec leurs valeurs Excel actuelles.
// Idempotente, et n'écrase JAMAIS une cellule déjà saisie.
function _migrerColonnesXL_(sh) {
  try {
    if (sh.getLastColumn() < _SECTEURS_HEADER.length) {
      sh.getRange(1, 1, 1, _SECTEURS_HEADER.length)
        .setValues([_SECTEURS_HEADER]).setFontWeight('bold');
      Logger.log('Onglet SECTEURS : colonnes XL_LABEL / XL_BG / XL_ROWS ajoutées.');
    }
    // Remplir les cellules VIDES des codes connus (une saisie manuelle fait foi).
    const rows = sh.getDataRange().getValues();
    for (let r = 1; r < rows.length; r++) {
      const code = String(rows[r][1] || '').trim().toUpperCase();
      const vals = _SECTEURS_XL[code];
      if (!code || !vals) continue;          // secteur créé par Arthur → défauts de getSecteurs
      for (let k = 0; k < 3; k++) {
        const cur = rows[r][11 + k];
        if (cur === '' || cur == null) sh.getRange(r + 1, 12 + k).setValue(vals[k]);
      }
    }
  } catch (e) {
    Logger.log('_migrerColonnesXL_ : ' + e.message);
  }
}

// One-shot manuel : à lancer une fois dans l'éditeur Apps Script.
function initSecteurs() {
  const sh = getOrCreateSecteursTab();
  Logger.log('Onglet SECTEURS prêt : ' + (sh.getLastRow() - 1) + ' secteurs.');
  return sh.getLastRow() - 1;
}

// Lecture → tableau d'objets (miroir de l'ancien SECTEURS_CFG + rendement).
// '' → null pour aff/bg/fg/cs ; ACTIF 'O' → actif:true.
function getSecteurs() {
  const sh = getOrCreateSecteursTab();
  const rows = sh.getDataRange().getValues();
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const code = String(rows[r][1] || '').trim();
    if (!code) continue;
    const nn = v => { const s = String(v == null ? '' : v).trim(); return s ? s : null; };
    out.push({
      ordre:     Number(rows[r][0]) || (r),
      code:      code,
      label:     String(rows[r][2] || '').trim(),
      court:     String(rows[r][3] || '').trim(),
      aff:       nn(rows[r][4]),
      icon:      String(rows[r][5] || '').trim(),
      bg:        nn(rows[r][6]),
      fg:        nn(rows[r][7]),
      cs:        nn(rows[r][8]),
      actif:     String(rows[r][9] || '').trim().toUpperCase() === 'O',
      rendement: String(rows[r][10] || '').trim().toUpperCase() || null,
      // Colonnes EXCEL. Vides = défauts, pour qu'un secteur créé sans les remplir
      // apparaisse quand même dans le fichier du vendredi.
      xlLabel:   String(rows[r][11] || '').trim()
                 || String(rows[r][3] || code).trim().toUpperCase(),   // défaut : COURT en majuscules
      xlBg:      String(rows[r][12] || '').trim().replace(/^#/, '').toUpperCase()
                 || _XL_BG_DEFAUT,                                     // défaut : gris clair
      xlRows:    Math.max(1, Math.min(3, Number(rows[r][13]) || _XL_ROWS_DEFAUT)),
    });
  }
  out.sort((a, b) => a.ordre - b.ordre);
  return out;
}
