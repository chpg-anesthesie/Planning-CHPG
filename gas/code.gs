// ── Reconstruire STATS_GARDES_2026 depuis GARDES_2026 (année reconstruite) ──
function buildStats2026() {
  const year = 2026;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gardes = ss.getSheetByName(`GARDES_${year}`);
  if (!gardes) throw new Error(`GARDES_${year} introuvable`);
  const data = gardes.getDataRange().getValues();
  const dateToCol = buildDateToCol(data, year);
  const colToDate = {};
  Object.keys(dateToCol).forEach(d => { colToDate[dateToCol[d]] = d; });
  const jf = getJoursFeries(year), jfn = getJoursFeries(year + 1);
  const NOEL = new Set([`${year}-12-24`,`${year}-12-25`,`${year}-12-31`,`${year+1}-01-01`]);
  const KEYS = ['dim','lun','mar','mer','jeu','ven','sam'];

  const rows = [];
  for (let r = 3; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    const c = {total:0,g:0,g2:0,lun:0,mar:0,mer:0,jeu:0,ven:0,sam:0,dim:0,recupR:0,h18:0,jf:0,noelAn:0};
    Object.keys(colToDate).forEach(col => {
      const date = colToDate[col];
      const val = String(data[r][Number(col)] || '').trim().toUpperCase();
      if (val === 'R')  c.recupR++;
      if (val === '18') c.h18++;
      if (val !== 'G' && val !== 'G2') return;
      const dow = new Date(date + 'T12:00:00').getDay();
      c.total++;
      if (val === 'G') c.g++; else c.g2++;
      c[KEYS[dow]]++;
      if (jf.has(date) || jfn.has(date)) c.jf++;
      if (NOEL.has(date)) c.noelAn++;
    });
    rows.push([id, '—', c.total, c.g, c.g2, c.lun, c.mar, c.mer, c.jeu, c.ven,
               c.sam, c.dim, c.recupR, c.h18, c.jf, 0, c.noelAn]);
  }

  let st = ss.getSheetByName(`STATS_GARDES_${year}`);
  if (st) ss.deleteSheet(st);
  st = ss.insertSheet(`STATS_GARDES_${year}`);
  st.getRange(1,1,1,17).setValues([['MEDECIN','CIBLE','TOTAL G','G (REA)','G2 (MAT)',
    'LUN','MAR','MER','JEU','VEN','SAM','DIM','RECUP R','18H','JF','VEILLE JF','NOEL/AN']]).setFontWeight('bold');
  if (rows.length) st.getRange(2,1,rows.length,17).setValues(rows);
  st.setColumnWidth(1,140);
  SpreadsheetApp.getUi().alert(`✅ STATS_GARDES_${year} reconstruit (${rows.length} MARs)`);
}

// Renvoie le classeur contenant l'onglet demandé : classeur actif si présent,
// sinon le classeur d'archive (année clôturée dont les onglets ont été déplacés).
function _ssWithSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(sheetName)) return ss;
  try { const arch = SpreadsheetApp.openById(ARCHIVE_SS_ID); if (arch.getSheetByName(sheetName)) return arch; } catch (e) {}
  return null;
}

// ── Stats LIVE : recalcule depuis GARDES_YYYY (échanges/dons inclus), cibles lues dans STATS_GARDES ──
function computeStatsLive(year) {
  const ss = _ssWithSheet(`GARDES_${year}`) || SpreadsheetApp.getActiveSpreadsheet();
  const gardes = ss.getSheetByName(`GARDES_${year}`);
  if (!gardes) throw new Error(`GARDES_${year} introuvable`);
  const data = gardes.getDataRange().getValues();
  const dateToCol = buildDateToCol(data, year);
  const colToDate = {};
  Object.keys(dateToCol).forEach(d => { colToDate[dateToCol[d]] = d; });
  const jf = getJoursFeries(year), jfn = getJoursFeries(year + 1);
  const isF = d => jf.has(d) || jfn.has(d);
  const NOEL = new Set([`${year}-12-24`,`${year}-12-25`,`${year}-12-31`,`${year+1}-01-01`]);
  const KEYS = ['dim','lun','mar','mer','jeu','ven','sam'];
  const nextDay = d => {
    const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + 1);
    return Utilities.formatDate(x, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  };
  const cibById = {};
  const stSheet = ss.getSheetByName(`STATS_GARDES_${year}`);
  if (stSheet) {
    const sd = stSheet.getDataRange().getValues();
    for (let r = 1; r < sd.length; r++) {
      const id = String(sd[r][0]).trim(); if (!id) continue;
      cibById[id] = { cible:Number(sd[r][1])||0, cSat:Number(sd[r][17])||0,
        cJeu:Number(sd[r][18])||0, cVd:Number(sd[r][19])||0, cVjf:Number(sd[r][21])||0 };
    }
  }
  const stats = [];
  for (let r = 3; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    const c = {total:0,g:0,g2:0,lun:0,mar:0,mer:0,jeu:0,ven:0,sam:0,dim:0,recupR:0,h18:0,jf:0,vjf:0,vd:0,noelAn:0};
    Object.keys(colToDate).forEach(col => {
      const date = colToDate[col];
      const val = String(data[r][Number(col)] || '').trim().toUpperCase();
      if (val === 'R')  c.recupR++;
      if (val === '18') c.h18++;
      if (val !== 'G' && val !== 'G2') return;
      const dow = new Date(date + 'T12:00:00').getDay();
      c.total++;
      if (val === 'G') c.g++; else c.g2++;
      c[KEYS[dow]]++;
      if (isF(date)) c.jf++;
      if (dow === 5) c.vd++;
      if (!isF(date) && isF(nextDay(date)) && dow >= 1 && dow <= 4) c.vjf++;
      if (NOEL.has(date)) c.noelAn++;
    });
    const cb = cibById[id] || {cible:0,cSat:0,cJeu:0,cVd:0,cVjf:0};
    stats.push({medecin:id, cible:cb.cible, total:c.total, g:c.g, g2:c.g2,
      lun:c.lun, mar:c.mar, mer:c.mer, jeu:c.jeu, ven:c.ven, sat:c.sam, dim:c.dim,
      recupR:c.recupR, h18:c.h18, jf:c.jf, vjf:c.vjf, vd:c.vd,
      cSat:cb.cSat, cJeu:cb.cJeu, cVd:cb.cVd, cVjf:cb.cVjf});
  }
  return stats;
}
// ── CONFIG ─────────────────────────────────────────────────────────────
const GITHUB_USER = 'chpg-anesthesie';

let _ghTokenCache = null;
function getGithubToken() {
  if (_ghTokenCache !== null) return _ghTokenCache;
  _ghTokenCache = '';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]).trim() === 'GITHUB_TOKEN') { _ghTokenCache = String(data[r][1]).trim(); break; }
    }
  }
  return _ghTokenCache;
}
const GITHUB_REPO = 'Planning-CHPG';
const GITHUB_BRANCH = 'main';

// ── MÉDECINS ───────────────────────────────────────────────────────────
// NOTE : sera chargé dynamiquement depuis l'onglet MEDECINS à terme (P-backlog)
const DOCTORS = [
  {id:'ALBOUY',    name:'DR ALBOUY',    initials:'SA'},
  {id:'ARMAND',    name:'DR ARMAND',    initials:'CA'},
  {id:'ARMANDO',   name:'DR ARMANDO',   initials:'GA'},
  {id:'BONNET',    name:'DR BONNET',    initials:'LB'},
  {id:'BOUREGBA',  name:'DR BOUREGBA',  initials:'MB'},
  {id:'CATINEAU',  name:'DR CATINEAU',  initials:'JC'},
  {id:'FROHLICH',  name:'DR FROHLICH',  initials:'AFR'},
  {id:'FERRIERO',  name:'DR FERRIERO',  initials:'AF'},
  {id:'GHIGLIONE', name:'DR GHIGLIONE', initials:'SG'},
  {id:'GUERIN',    name:'DR GUERIN',    initials:'JPG'},
  {id:'LEVASSEUR', name:'DR LEVASSEUR', initials:'LUL'},
  {id:'LEY',       name:'DR LEY',       initials:'LL'},
  {id:'MENADE',    name:'DR MENADE',    initials:'RM'},
  {id:'OPPRECHT',  name:'DR OPPRECHT',  initials:'NO'},
  {id:'PARTOUCHE', name:'DR PARTOUCHE', initials:'NP'},
  {id:'ROUSSEAU',  name:'DR ROUSSEAU',  initials:'GR'},
  {id:'SALA',      name:'DR SALA',      initials:'NS'},
  {id:'SEVERAC',   name:'DR SEVERAC',   initials:'MS'},
  {id:'SULTAN',    name:'DR SULTAN',    initials:'WS'},
  {id:'SUPLY',     name:'DR SUPLY',     initials:'CS'},
  {id:'WIDEHEM',   name:'DR WIDEHEM',   initials:'RW'},
  {id:'ZAMARON',   name:'DR ZAMARON',   initials:'FZ'},
  {id:'TRAN',      name:'DR TRAN',      initials:'DT'},
  {id:'PRUNET',    name:'PR PRUNET',    initials:'BP'},
  {id:'GARCIA',    name:'DR GARCIA',    initials:'PG'},
];
// ── C1 : roster dynamique depuis l'onglet MEDECINS ────────────────────
// La publication lit l'effectif réel (MAR actifs) au lieu de la liste en dur.
// Repli sur DOCTORS si MEDECINS absent/vide (sécurité).
function getDoctorsFromMedecins() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MEDECINS');
  if (!sheet) return DOCTORS;
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let r = 1; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    if (String(data[r][3]).trim().toUpperCase() !== 'O') continue; // ACTIF = O
    list.push({ id, name: String(data[r][1]).trim(), initials: String(data[r][2]).trim() });
  }
  return list.length ? list : DOCTORS;
}

// ── C1 : diagnostic de bascule — à lancer AVANT le reste de C1 ─────────
// Les DEUX lignes du log doivent être "(aucun ✅)" → publication identique (au tri près).
function diffRosterC1() {
  const dur = DOCTORS.map(d => d.id).sort();
  const dyn = getDoctorsFromMedecins().map(d => d.id).sort();
  const durSeul = dur.filter(id => !dyn.includes(id));
  const dynSeul = dyn.filter(id => !dur.includes(id));
  Logger.log('Dans DOCTORS (dur) mais PAS MEDECINS-actif : ' + (durSeul.join(', ') || '(aucun ✅)'));
  Logger.log('MEDECINS-actif mais PAS dans DOCTORS (dur)  : ' + (dynSeul.join(', ') || '(aucun ✅)'));
}
// ── C2 : flags par médecin externalisés dans l'onglet MEDECINS ─────────
// Colonnes (après dect=8) : 9 date_debut, 10 date_fin, 11 no_garde,
// 12 only_18, 13 no_weekend, 14 rythme_2sur2, 15 souhait_plafond,
// 16 tp_jours_fixes. Lit MEDECINS une seule fois ; repli vide si absent.
// Jours tp_jours_fixes : LUN=1 MAR=2 MER=3 JEU=4 VEN=5 SAM=6 DIM=0.
let _medFlagsCache = null;
function getMedecinFlags() {
  if (_medFlagsCache !== null) return _medFlagsCache; // (C2-D3) lecture unique de MEDECINS
  const flags = {
    noGarde: new Set(), only18: new Set(), noWeekend: new Set(),
    rythme2sur2: new Set(), souhaitPlafond: new Set(),
    dateDebut: {}, dateFin: {}, tpJoursFixes: {},
  };
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MEDECINS');
  if (!sheet) return flags;
  const data = sheet.getDataRange().getValues();
  const JOUR_NUM = { LUN:1, MAR:2, MER:3, JEU:4, VEN:5, SAM:6, DIM:0 };
  const isO = v => String(v).trim().toUpperCase() === 'O';
  const toDate = v => {
    if (!v) return '';
    if (v instanceof Date) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
    return String(v).trim();
  };
  for (let r = 1; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    if (isO(data[r][11])) flags.noGarde.add(id);
    if (isO(data[r][12])) flags.only18.add(id);
    if (isO(data[r][13])) flags.noWeekend.add(id);
    if (isO(data[r][14])) flags.rythme2sur2.add(id);
    if (isO(data[r][15])) flags.souhaitPlafond.add(id);
    const dd = toDate(data[r][9]);  if (dd) flags.dateDebut[id] = dd;
    const df = toDate(data[r][10]); if (df) flags.dateFin[id]   = df;
    const tp = String(data[r][16] || '').trim().toUpperCase();
    if (tp) {
      const jours = new Set();
      tp.split(/[,;\s]+/).forEach(tok => {
        const t = tok.trim();
        if (t && JOUR_NUM[t] !== undefined) jours.add(JOUR_NUM[t]);
      });
      if (jours.size) flags.tpJoursFixes[id] = jours;
    }
  }
  _medFlagsCache = flags;
  return flags;
}

// ── CODES ABSENTS EN JOURNÉE ───────────────────────────────────────────
// G, G2 = de garde (absent du planning journalier)
// RG = repos de garde
// V = vacances, F = formation, CTP = CTP, R = récup samedi
// A = absent cycle TRAN
// NB : I (indispo garde) → MAR PRÉSENT en journée dans son secteur
const ABSENT_CODES = new Set(['RG','V','F','CTP','CP','R','A','TP','CL']);
// (C2-D3) ARMAND_DEBUT_PLANNING / TRAN_FIN_PLANNING retirés — gates pilotées par
// date_debut/date_fin (MEDECINS), dans generatePlanningFromGardes + getMARsDispoJour.
// ── MAR HABILITÉS DVI (mardi matin uniquement) ─────────────────────────
const DVI_ALLOWED = ['BONNET','WIDEHEM','LEVASSEUR'];

// ── CS PAR JOUR (après-midi) ───────────────────────────────────────────
// Format : jour_semaine → [ [secteur_affilié, code_cs], ... ]
// Consultations : FALSE = créneaux vides par défaut, placés à la main par le comité
// (rotation libérale endo + placements comité passent par les overrides). TRUE = auto-affectation.
const GENERER_CONSULTATIONS = false;
const CS_RULES = {
  1: { am: [],                                      pm: [['VIS','CS-VIS'],['VIS','CS-VIS'],['END','CS-END'],['END','CS-END']] },
  2: { am: [['ORL','CS-ORL'],['MAT','CS-MAT']],     pm: [['VIS','CS-VIS'],['END','CS-END'],['ORT','CS-ORT']] },                       // ← CHOIX: 'MAT' ou 'VOLANT'
  3: { am: [['ORL','CS-ORL'],['VOLANT','CS-POLY']], pm: [['VIS','CS-VIS'],['END','CS-END'],['ORT','CS-ORT'],['CI','CS-INTER']] },
  4: { am: [['ORL','CS-ORL'],['MAT','CS-MAT']],     pm: [['VIS','CS-VIS'],['END','CS-END'],['END','CS-END'],['CI','CS-INTER']] },    // ← CHOIX: 'MAT' ou 'VOLANT'
  5: { am: [['ORT','CS-ORT'],['ORL','CS-ORL']],     pm: [] },
};

// ── LIRE L'ANNÉE ACTIVE ───────────────────────────────────────────────
function getActiveYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CONFIG');
  if (!sheet) return 2026;
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim() === 'ANNEE_ACTIVE') {
      const year = parseInt(String(data[r][1]).trim());
      if (!isNaN(year)) return year;
    }
  }
  return 2026;
}

// ── PREMIER JOUR DE L'ANNÉE PLANNING ─────────────────────────────────
function getPremierJourPlanning(year) {
  const jan1 = new Date(year, 0, 1);
  const dow = jan1.getDay();
  const offset = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
  return new Date(year, 0, 1 + offset, 12, 0, 0);
}

// ── SEMAINE ISO ───────────────────────────────────────────────────────
function getISOWeek(dateStr) {
  const dt = new Date(dateStr + 'T12:00:00');
  const tmp = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const ys = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil((((tmp - ys) / 86400000) + 1) / 7);
}

// (C3) getISOWeekTran supprimé — alias inutile de getISOWeek.

// ── JOURS FÉRIÉS MONACO ───────────────────────────────────────────────
function getJoursFeries(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19*a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2*e + 2*i - h - k) % 7;
  const m = Math.floor((a + 11*h + 22*l) / 451);
  const month = Math.floor((h + l - 7*m + 114) / 31);
  const day = ((h + l - 7*m + 114) % 31) + 1;
  const paques = new Date(year, month-1, day, 12, 0, 0);
  function addDays(date, days) {
    const d = new Date(date); d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function dateStr(m, d) {
    return `${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  const feteDieu = addDays(paques, 60);
  // Report au lundi si le férié tombe un dimanche (loi n°798) :
  // 1er janv., 1er mai, Assomption, Toussaint, Fête du Prince,
  // Immaculée Conception (08/12) et Noël.
  // PAS la Sainte Dévote (27/01).
  function reporte(mo, da) {
    const dt = new Date(year, mo - 1, da, 12, 0, 0);
    if (dt.getDay() === 0) dt.setDate(dt.getDate() + 1);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  }
  return new Set([
    reporte(1,1), dateStr(1,27), reporte(5,1), reporte(8,15),
    reporte(11,1), reporte(11,19), reporte(12,8), reporte(12,25),
    addDays(paques,1), addDays(paques,39), addDays(paques,50),
    feteDieu,
  ]);
}

// ── LIRE LES AFFECTATIONS SECTEUR ─────────────────────────────────────
function loadAffectations(yearArg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = yearArg || getActiveYear();
  const DOCTORS = getDoctorsFromMedecins(); // C1 : effectif réel (MEDECINS) au lieu de la liste en dur
  const sheetName = `AFFECTATIONS_${year}`;
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Onglet ${sheetName} introuvable`);

  const data = sheet.getDataRange().getValues();
  const monthHeaders = data[0].slice(1);

  const MONTH_NAMES = ['JAN','FEV','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPT','OCT','NOV','DEC'];
  const MONTH_MAP = {};
  for (let m = 1; m <= 12; m++) {
    const variants = [
      `${MONTH_NAMES[m-1]} ${year}`,
      `${MONTH_NAMES[m-1].toLowerCase()} ${year}`,
      `${MONTH_NAMES[m-1].charAt(0)+MONTH_NAMES[m-1].slice(1).toLowerCase()} ${year}`,
    ];
    variants.forEach(v => { MONTH_MAP[v] = m; });
  }
  MONTH_MAP[`SEPTEMBRE  ${year}`] = 9;
  MONTH_MAP[`OCTOBRE ${year}`] = 10;

  const getMonthNum = (hdr) => {
    if (!hdr) return null;
    if (hdr instanceof Date) return hdr.getMonth() + 1;
    return MONTH_MAP[String(hdr).trim()] || null;
  };

  const affectations = {};
  DOCTORS.forEach(d => { affectations[d.id] = {}; });

  for (let r = 1; r < data.length; r++) {
    const rawName = String(data[r][0] || '').trim().toUpperCase()
      .replace('DR ','').replace('PR ','').replace('  ',' ').trim();
    if (!rawName) continue;
    const doctor = DOCTORS.find(d =>
      d.name.toUpperCase().replace('DR ','').replace('PR ','').trim() === rawName ||
      d.id === rawName
    );
    if (!doctor) continue;
    monthHeaders.forEach((hdr, ci) => {
      const monthNum = getMonthNum(hdr);
      if (!monthNum) return;
      const secteur = String(data[r][ci+1] || '').trim().toUpperCase();
      if (secteur) affectations[doctor.id][monthNum] = secteur;
    });
  }

  return affectations;
}

// ── NORMALISER SECTEUR ────────────────────────────────────────────────
function normalizeAffectation(aff) {
  if (!aff) return 'VOLANT';
  const map = {
    'VISC':'VIS','VISCERAL':'VIS','VIS':'VIS',
    'ENDO':'END','END':'END','ENDOSCOPIES':'END',
    'ORL':'ORL',
    'REA':'REA','REANIMATION':'REA',
    'ORTH':'ORT','ORTHO':'ORT','ORT':'ORT',
    'CARDIO/INTER':'CI','CARDIO':'CI','CI':'CI',
    'RADIO/INTER':'RI','RI':'RI',
    'MATER':'MAT','MAT':'MAT','MATERNITE':'MAT',
    'VOLANT':'VOLANT',
  };
  return map[aff] || 'VOLANT';
}

// ── LIRE LES PLANNING OVERRIDES ───────────────────────────────────────
// Onglet PLANNING_OVERRIDES : DATE | MAR_ID | SECTEUR_MATIN | SECTEUR_AM | COMMENTAIRE
// Écrit par le comité via l'interface quand il comble une case flashante
function loadPlanningOverrides() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLANNING_OVERRIDES');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const overrides = {};
  for (let r = 1; r < data.length; r++) {
    const raw = data[r][0];
    if (!raw) continue;
    const date = raw instanceof Date
      ? `${raw.getFullYear()}-${String(raw.getMonth()+1).padStart(2,'0')}-${String(raw.getDate()).padStart(2,'0')}`
      : String(raw).trim();
    const docId  = String(data[r][1] || '').trim().toUpperCase();
    const matin  = String(data[r][2] || '').trim().toUpperCase();
    const aprem  = String(data[r][3] || '').trim().toUpperCase();
    if (!date || !docId) continue;
    if (!overrides[date]) overrides[date] = {};
    overrides[date][docId] = { morning: matin, afternoon: aprem, tag: String(data[r][4] || '').trim().toUpperCase() };
  }
  return overrides;
}

// (Horizon glissant) loadSemainesValidees supprimée — l'onglet SEMAINES_VALIDEES
// n'est plus utilisé et peut être supprimé du classeur.

// ── CONSTRUIRE dateToCol DEPUIS L'ONGLET GARDES ───────────────────────
// Mappe date→colonne par POSITION : colonne 1 = premier lundi de l'année
// planning, +1 jour par colonne. Robuste aux en-têtes texte ("Janvier"…)
// que new Date() ne sait pas parser (cause du bug post-reconstruction).
// ── HISTORIQUE NOËL / JOUR DE L'AN (source unique : rotation ET banderole) ──
// Dernière année (< beforeYear) où chaque MAR a fait Noël/An. Fusionne :
//  - l'onglet HISTORIQUE (années archivées, colonne NOEL/AN) ;
//  - les onglets GARDES_{Y} encore présents (années générées mais PAS encore
//    archivées : ex. 2027 quand on prépare 2028 — l'assignation existe déjà
//    mais n'est pas dans HISTORIQUE).
// Corrige le décalage d'un an : sans ça, générer N ré-attribuerait Noël à la
// personne qui fait déjà Noël N-1. On ne compte QUE les années < beforeYear
// (sinon régénérer une année compterait sa propre assignation) et on garde la
// plus récente par MAR.
function getNoelHistory(beforeYear) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lim = Number(beforeYear) || Infinity;
  const hist = {};
  const bump = (id, y) => { if (id && y < lim && (hist[id] == null || y > hist[id])) hist[id] = y; };

  // 1) HISTORIQUE (années archivées)
  const h = ss.getSheetByName('HISTORIQUE');
  if (h) {
    const hd = h.getDataRange().getValues();
    const H = hd[0].map(x => String(x).trim());
    const cId = H.indexOf('ID'), cAn = H.indexOf('ANNEE'), cNa = H.indexOf('NOEL/AN');
    if (cId >= 0 && cAn >= 0 && cNa >= 0) {
      for (let r = 1; r < hd.length; r++) {
        const id = String(hd[r][cId]).trim(); if (!id) continue;
        if ((Number(hd[r][cNa]) || 0) <= 0) continue;
        bump(id, Number(hd[r][cAn]) || 0);
      }
    }
  }

  // 2) Onglets GARDES_{Y} présents (années générées, pas encore archivées)
  ss.getSheets().forEach(sh => {
    const m = sh.getName().match(/^GARDES_(\d{4})$/);
    if (!m) return;
    const y = Number(m[1]);
    if (y >= lim) return;                       // on ne regarde que les années passées
    const data = sh.getDataRange().getValues();
    const dateToCol = buildDateToCol(data, y);
    const noelCols = [`${y}-12-24`, `${y}-12-25`, `${y}-12-31`, `${y + 1}-01-01`]
      .map(d => dateToCol[d]).filter(c => c != null);
    if (!noelCols.length) return;
    for (let r = 3; r < data.length; r++) {
      const id = String(data[r][0]).trim(); if (!id) continue;
      const did = noelCols.some(col => {
        const v = String(data[r][Number(col)] || '').trim().toUpperCase();
        return v === 'G' || v === 'G2';
      });
      if (did) bump(id, y);
    }
  });

  return hist;
}

function buildDateToCol(data, year) {
  const dateToCol = {};
  if (year) {
    const start = getPremierJourPlanning(year);
    for (let c = 1; c < data[0].length; c++) {
      const dt = new Date(start);
      dt.setDate(dt.getDate() + (c - 1));
      const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      dateToCol[ds] = c;
    }
    return dateToCol;
  }
  // Fallback historique (en-têtes Date) si year non fourni
  let currentYear = null, currentMonth = null;
  for (let c = 1; c < data[0].length; c++) {
    const cell = data[0][c];
    if (cell) {
      const dt = new Date(cell);
      if (!isNaN(dt)) { currentYear = dt.getFullYear(); currentMonth = dt.getMonth() + 1; }
    }
    const dayNum = data[2][c];
    if (!dayNum || !currentYear || !currentMonth) continue;
    dateToCol[`${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(Number(dayNum)).padStart(2,'0')}`] = c;
  }
  return dateToCol;
}
// ── (C3b) Reconstruction de dates depuis les en-têtes INDISPOS/GARDES ──
// Ligne 1 = mois/année ("Janvier 2026" texte ou Date), ligne 3 = numéros.
// dates[i] ↔ colonne i+1 (colonne 0 = libellés MAR) ; null si pas un jour valide.
function reconstruireDatesHeaders(data, yearFallback) {
  const MOIS_MAP = {
    'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
    'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
  };
  const dates = [];
  let curY = yearFallback || null, curM = null;
  for (let c = 1; c < data[0].length; c++) {
    const cell = data[0][c];
    if (cell) {
      if (cell instanceof Date) { curY = cell.getFullYear(); curM = cell.getMonth() + 1; }
      else {
        const lower = String(cell).toLowerCase();
        const match = String(cell).match(/(\d{4})/);
        if (match) curY = parseInt(match[1]);
        Object.entries(MOIS_MAP).forEach(([nom, num]) => { if (lower.includes(nom)) curM = num; });
      }
    }
    const dayNum = data[2][c];
    if (!dayNum || !curY || !curM) { dates.push(null); continue; }
    dates.push(`${curY}-${String(curM).padStart(2,'0')}-${String(Number(dayNum)).padStart(2,'0')}`);
  }
  return dates;
}
// ── GÉNÉRER LE PLANNING JSON ──────────────────────────────────────────
function generatePlanning(yearOverride) {
  const year = yearOverride || getActiveYear();
  const months = generatePlanningFromGardes(year);
  if (!months) return;

  // ── Mettre à jour CONFIG_TRANSITION ──────────────────────────────────
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gardesSheet = ss.getSheetByName(`GARDES_${year}`);
  if (gardesSheet) {
    const nextStart = getPremierJourPlanning(year + 1);
    const dernierJour = new Date(nextStart);
    dernierJour.setDate(dernierJour.getDate() - 1);
    const dernierJourStr = `${dernierJour.getFullYear()}-${String(dernierJour.getMonth()+1).padStart(2,'0')}-${String(dernierJour.getDate()).padStart(2,'0')}`;

    const gardesData = gardesSheet.getDataRange().getValues();
    const dateToCol = buildDateToCol(gardesData, year);
    const colIdx = dateToCol[dernierJourStr];
    let gardeG = '', gardeG2 = '';
    if (colIdx !== undefined) {
      for (let r = 3; r < gardesData.length; r++) {
        const id = String(gardesData[r][0]).trim();
        const val = String(gardesData[r][colIdx] || '').trim();
        if (val === 'G') gardeG = id;
        if (val === 'G2') gardeG2 = id;
      }
    }
    if (gardeG || gardeG2) {
      const transSheet = ss.getSheetByName('CONFIG_TRANSITION');
      if (transSheet) {
        const transData = transSheet.getDataRange().getValues();
        const nextYear = year + 1;
        let found = false;
        for (let r = 1; r < transData.length; r++) {
          if (Number(transData[r][0]) === nextYear) {
            transSheet.getRange(r + 1, 2).setValue(gardeG);
            transSheet.getRange(r + 1, 3).setValue(gardeG2);
            found = true; break;
          }
        }
        if (!found) transSheet.appendRow([nextYear, gardeG, gardeG2]);
      }
    }
  }

  // ── Snapshot d'équité figé à la génération (lu depuis STATS_GARDES) ──
  let equiteInitiale = null;
  try {
    const stSheet = ss.getSheetByName(`STATS_GARDES_${year}`);
    if (stSheet && stSheet.getLastRow() > 1) {
      const sd = stSheet.getDataRange().getValues();
      // colonnes : 0 MEDECIN · 2 TOTAL G · 5 LUN · 6 MAR · 7 MER · 8 JEU · 9 VEN · 10 SAM · 11 DIM · 14 JF · 15 VEILLE JF · 20 VD
      equiteInitiale = sd.slice(1).filter(r => r[0]).map(r => ({
        id: String(r[0]).trim(),
        total: Number(r[2]) || 0,
        lu: Number(r[5]) || 0, ma: Number(r[6]) || 0, me: Number(r[7]) || 0,
        je: Number(r[8]) || 0, ve: Number(r[9]) || 0, sa: Number(r[10]) || 0, di: Number(r[11]) || 0,
        vd: Number(r[20]) || 0, jf: Number(r[14]) || 0, vjf: Number(r[15]) || 0,
        cible: Number(r[1]) || 0, cSa: Number(r[17]) || 0, cJe: Number(r[18]) || 0, cVd: Number(r[19]) || 0, cVjf: Number(r[21]) || 0,
      }));
    }
  } catch(e) { Logger.log('equiteInitiale: ' + e.message); }

  // ── Push planning_YYYY.json ──────────────────────────────────────────
  const monthsMin = months.map(m => Object.assign({}, m, {
    doctors: (m.doctors || []).map(d => Object.assign({}, d, {
      days: (d.days || []).map(e => {
        if (!e || typeof e !== 'object') return e;
        const o = {};
        for (const k in e) { const v = e[k]; if (v !== '' && v != null) o[k] = v; }
        return o;
      })
    }))
  }));
  const _planningJson = JSON.stringify({months: monthsMin, equiteInitiale});
  // (Étape 3 confidentialité) Le Drive privé est le stockage UNIQUE du
  // planning — plus aucune copie publique sur GitHub. Un échec Drive
  // bloque la publication avec un message clair (même logique que le 401).
  try { savePlanningToDrive(`planning_${year}.json`, _planningJson); }
  catch(e) { throw new Error(`Publication échouée : enregistrement Drive impossible pour planning_${year}.json (${e.message}).`); }
  // ── Affectations_YYYY.json (Drive) ────────────────────────────────────
  try {
    const affectations = loadAffectations(year);
    savePlanningToDrive(`affectations_${year}.json`, JSON.stringify({year, affectations}));
  } catch(e) {
    Logger.log(`⚠️ Drive affectations échoué : ${e.message}`);
    logAction(`⚠️ Drive affectations_${year}.json : ${e.message}`);
  }
}

// ── NOUVEAU MOTEUR PLANNING V2 ────────────────────────────────────────
// Principe : MAR présent (pas dans ABSENT_CODES) → dans son secteur AFFECTATIONS_YYYY
// Plus de règles auto complexes. Le comité comble les cases vides via l'interface.
function generatePlanningFromGardes(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`GARDES_${year}`);
  if (!sheet) { Logger.log(`❌ Onglet GARDES_${year} introuvable`); return null; }
  const DOCTORS = getDoctorsFromMedecins(); // C1 : effectif réel (MEDECINS) au lieu de la liste en dur
  const FLAGS = getMedecinFlags(); // (C2-D3) flags/dates externalisés (cache → lecture unique)

  const data = sheet.getDataRange().getValues();
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const JOURS_WD = ['D','L','M','M','J','V','S'];

  const startDate = getPremierJourPlanning(year);
  const nextStart = getPremierJourPlanning(year + 1);
  const endDate = new Date(nextStart);
  endDate.setDate(nextStart.getDate() - 1);

  const jfYear = getJoursFeries(year);
  const jfNextYear = getJoursFeries(year + 1);

  // ── Construire la liste de tous les jours ────────────────────────────
  const allDays = [];
  const dtLoop = new Date(startDate);
  while (dtLoop <= endDate) {
    const dow = dtLoop.getDay();
    const m = dtLoop.getMonth() + 1;
    const d = dtLoop.getDate();
    const y = dtLoop.getFullYear();
    const ds = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    allDays.push({
      date: ds, day: d, weekday: JOURS_WD[dow], month: m, year: y, dow,
      isWeekend: dow === 0 || dow === 6,
      isFerie: jfYear.has(ds) || jfNextYear.has(ds),
    });
    dtLoop.setDate(dtLoop.getDate() + 1);
  }

  const dateToCol = buildDateToCol(data, year);

  // ── Lire les codes GARDES_YYYY par MAR ───────────────────────────────
  const doctorRows = {};
  for (let r = 3; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (id) doctorRows[id] = data[r];
  }

  // ── Charger les données annexes ──────────────────────────────────────
  const affectations = loadAffectations(year);
  const planningOverrides = loadPlanningOverrides();

  // ── Grouper par mois ─────────────────────────────────────────────────
  const monthsSet = [];
  const seenMonths = new Set();
  allDays.forEach(d => {
    const key = `${d.year}-${d.month}`;
    if (!seenMonths.has(key)) { seenMonths.add(key); monthsSet.push({year: d.year, month: d.month}); }
  });

  const months = [];

  monthsSet.forEach(({year: y, month: m}) => {
    const monthDays = allDays.filter(d => d.year === y && d.month === m);

    // ── Codes GARDES pour ce mois ──────────────────────────────────────
    const gardesCodes = {}; // gardesCodes[marId][dayIndex] = code
    DOCTORS.forEach(doc => {
      gardesCodes[doc.id] = monthDays.map(day => {
        const colIdx = dateToCol[day.date];
        if (colIdx === undefined) return '';
        // (C2-D3) hors période d'activité (date_debut/date_fin) → ni présence ni rythme.
        // Empêche le 'A' du rythme 2/2 avant l'arrivée (ex. LC avant le 28/09) / après le départ.
        const _dd0 = FLAGS.dateDebut[doc.id], _df0 = FLAGS.dateFin[doc.id];
        if ((_dd0 && day.date < _dd0) || (_df0 && day.date >= _df0)) return '';
        let code = String(doctorRows[doc.id]?.[colIdx] || '').trim();
        // Rythme 2/2 généralisé (TRAN, COPELOVICI…) : case vide en semaine "off" → A
        if (!code && estSemaineOff(doc.id, day.date)) code = 'A';
        // (C2-D3) jours fixes non travaillés (ex. BONNET jeu/ven) → TP, lus depuis MEDECINS
        const _tp = FLAGS.tpJoursFixes[doc.id];
        if (!code && !day.isFerie && _tp && _tp.has(day.dow)) code = 'TP';
        return code;
      });
    });

    // ── Construire le planning journalier ─────────────────────────────
    const days = monthDays.map(d => ({
      date: d.date, day: d.day, weekday: d.weekday, dow: d.dow,
      isWeekend: d.isWeekend, isFerie: d.isFerie,
    }));

    // result[marId][dayIdx] = {status, morning, afternoon, cs}
    const result = {};
    DOCTORS.forEach(doc => {
      result[doc.id] = days.map(() => ({status:'', morning:'', afternoon:'', cs:''}));
    });

    days.forEach((day, dayIdx) => {
      const isJourOuvre = !day.isWeekend && !day.isFerie;
      const dow = day.dow;

      // ── 1. Statuts depuis GARDES_YYYY ──────────────────────────────
      DOCTORS.forEach(doc => {
        const code = gardesCodes[doc.id][dayIdx];
        result[doc.id][dayIdx].status = code;
      });

      // ── 2. Weekend / férié : gardes uniquement ─────────────────────
      if (!isJourOuvre) {
        DOCTORS.forEach(doc => {
          const st = result[doc.id][dayIdx].status;
          if (st === 'G') { result[doc.id][dayIdx].morning = 'REA'; result[doc.id][dayIdx].afternoon = 'REA'; }
          if (st === 'G2') { result[doc.id][dayIdx].morning = 'MAT'; result[doc.id][dayIdx].afternoon = 'MAT'; }
        });
        // Appliquer overrides weekend aussi
        const dayOv = planningOverrides[day.date] || {};
        Object.entries(dayOv).forEach(([docId, ov]) => {
          if (!DOCTORS.find(d => d.id === docId)) return;
          if (ov.morning)   result[docId][dayIdx].morning   = ov.morning;
          if (ov.afternoon) result[docId][dayIdx].afternoon = ov.afternoon;
        });
        return;
      }

      // ── 3. Jour ouvré : affectation secteur ────────────────────────
      // Déterminer qui est présent en journée
      // Absent = code dans ABSENT_CODES (G, G2, RG, V, F, CTP, R, A)
      // I = indispo garde MAIS présent en journée → inclus
      const presentsPool = DOCTORS.filter(doc => {
        const code = gardesCodes[doc.id][dayIdx];
        if (ABSENT_CODES.has(code)) return false;
        // (C2-D3) gates ARMAND/TRAN → génériques date_debut/date_fin (MEDECINS)
        const _dd = FLAGS.dateDebut[doc.id], _df = FLAGS.dateFin[doc.id];
        if (_dd && day.date < _dd) return false; // pas encore actif
        if (_df && day.date >= _df) return false; // n'est plus actif
        return true;
      });

      const getSecteur = (docId) => normalizeAffectation(affectations[docId]?.[m]);

      // ── 3a. Affecter chaque MAR présent à son secteur ──────────────
      presentsPool.forEach(doc => {
        const secteur = getSecteur(doc.id);
        result[doc.id][dayIdx].morning   = secteur;
        result[doc.id][dayIdx].afternoon = secteur;
      });
// ── 3a-bis. Secteur interventionnel : le MAR affecté CI bascule en RI
      // le JEUDI matin (jeudi = radio inter). L'après-midi reste CI → consult CS-INTER.
      if (dow === 4) {
        presentsPool.forEach(doc => {
          if (getSecteur(doc.id) === 'CI' && result[doc.id][dayIdx].morning === 'CI') {
            result[doc.id][dayIdx].morning = 'RI';
          }
        });
      }
      // ── 3b. DVI (mardi matin uniquement) ──────────────────────────
      if (dow === 2) {
        const dviDoc = presentsPool.find(doc => DVI_ALLOWED.includes(doc.id));
        if (dviDoc) {
          result[dviDoc.id][dayIdx].morning = 'DVI';
          // L'après-midi reste sur son secteur d'affectation
        }
      }
// ── 3b-bis + 3c. Auto-affectation des consultations ─────────────
      // DÉSACTIVÉE par défaut (GENERER_CONSULTATIONS=false) : le comité place chaque
      // MAR à la main sur des créneaux vides « à pourvoir ». La rotation libérale endo
      // (ROT-LIB) et les placements comité arrivent via les overrides (§4 ci-dessous).
      if (GENERER_CONSULTATIONS) {
      const csAmRules = (CS_RULES[dow] || {am: []}).am || [];
      const csAmUsed = new Set();
      csAmRules.forEach(([secteurAffil, csCode]) => {
        // MAR affilié à ce secteur, posté là le matin, pas déjà pris
        let candidate = presentsPool.find(doc =>
          !csAmUsed.has(doc.id) &&
          getSecteur(doc.id) === secteurAffil &&
          result[doc.id][dayIdx].morning === secteurAffil
        );
        // Fallback : un VOLANT
        if (!candidate) {
          candidate = presentsPool.find(doc =>
            !csAmUsed.has(doc.id) &&
            getSecteur(doc.id) === 'VOLANT' &&
            result[doc.id][dayIdx].morning === 'VOLANT'
          );
        }
        if (candidate) {
          result[candidate.id][dayIdx].morning = csCode;   // consult le matin
          result[candidate.id][dayIdx].cs = csCode;
          // afternoon reste = secteur d'affiliation (posé en 3a) → retour secteur
          csAmUsed.add(candidate.id);
        }
        // sinon → case flash matin (géré côté frontend)
      });
      // ── 3c. CS après-midi ─────────────────────────────────────────
      const csRules = (CS_RULES[dow] || {pm: []}).pm;
      csRules.forEach(([secteurAffil, csCode]) => {
        // Chercher un MAR présent affecté à ce secteur
        let candidate = presentsPool.find(doc =>
          !String(result[doc.id][dayIdx].morning || '').startsWith('CS-') &&
          getSecteur(doc.id) === secteurAffil &&
          result[doc.id][dayIdx].afternoon === secteurAffil
        );
        // Fallback : un VOLANT
        if (!candidate) {
          candidate = presentsPool.find(doc =>
            !String(result[doc.id][dayIdx].morning || '').startsWith('CS-') &&
            getSecteur(doc.id) === 'VOLANT' &&
            result[doc.id][dayIdx].afternoon === 'VOLANT'
          );
        }
        if (candidate) {
          result[candidate.id][dayIdx].afternoon = csCode;
          result[candidate.id][dayIdx].cs = csCode;
        }
        // Si pas de candidate → case flash (cs reste vide, géré côté frontend)
      });
      } // fin if (GENERER_CONSULTATIONS) — sinon consultations laissées vides

      // ── 3d. CS-ORL → désormais géré en 3b-bis (consultation du matin) ─

      // ── 4. Appliquer PLANNING_OVERRIDES (dernier layer) ────────────
      const dayOv = planningOverrides[day.date] || {};
      Object.entries(dayOv).forEach(([docId, ov]) => {
        if (!DOCTORS.find(d => d.id === docId)) return;
        if (ov.morning)   result[docId][dayIdx].morning   = ov.morning;
        if (ov.afternoon) result[docId][dayIdx].afternoon = ov.afternoon;
        if (ov.tag === 'ROT-LIB') result[docId][dayIdx].lib = true;   // marque le soliste de la consult libérale endo
      });
    });

    // ── Calculer les semaines et leur statut de validation ─────────────
    const weeksInMonth = [];
    const seenWeeks = new Set();
    days.forEach(day => {
      const w = getISOWeek(day.date);
      if (!seenWeeks.has(w)) {
        seenWeeks.add(w);
        weeksInMonth.push({ isoWeek: w });
      }
    });

    // (C2-D3) Exclure du mois publié les MAR dont [date_debut, date_fin] ne recouvre
    // pas (y,m). Reproduit les anciennes gates ARMAND/TRAN et gère tout arrivant/partant
    // (ex. COPELOVICI : plus de rythme 'A' affiché avant le 28/09).
    const _firstDay = `${y}-${String(m).padStart(2,'0')}-01`;
    const _lastDom  = new Date(y, m, 0).getDate();
    const _lastDay  = `${y}-${String(m).padStart(2,'0')}-${String(_lastDom).padStart(2,'0')}`;
    const _horsMois = (id) => {
      const dd = FLAGS.dateDebut[id], df = FLAGS.dateFin[id];
      if (df && df <= _firstDay) return true; // parti avant/au 1er du mois (date_fin = 1er jour absent)
      if (dd && dd >  _lastDay)  return true; // arrive après la fin du mois
      return false;
    };
    const doctors = DOCTORS
      .filter(doc => !_horsMois(doc.id))
      .map(doc => ({ id: doc.id, initials: doc.initials, days: result[doc.id] }));

    const label = y === year
      ? `${MOIS_FR[m-1]} ${year}`
      : `${MOIS_FR[m-1]} ${y}`;

    months.push({
      id: `${y}-${String(m).padStart(2,'0')}`,
      label, year: y, month: m,
      days, doctors,
      weeks: weeksInMonth,
    });

    Logger.log(`✅ ${label} généré (${weeksInMonth.length} semaines)`);
  });

  return months;
}

// ── STOCKAGE PRIVÉ DRIVE (Étape 1 confidentialité) ────────────────────
// Les JSON du planning sont aussi rangés dans un dossier Drive PRIVÉ
// ("Planning-CHPG-JSON") du compte planningchpg. À terme (étape 3), ce
// stockage remplacera la copie publique GitHub. Fichier écrasé à chaque
// publication (une seule version par nom).
const DRIVE_JSON_FOLDER = 'Planning-CHPG-JSON';

function _getDriveJsonFolder() {
  const it = DriveApp.getFoldersByName(DRIVE_JSON_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_JSON_FOLDER);
}

// Tous les fichiers de ce nom situés dans UN dossier nommé DRIVE_JSON_FOLDER
// (gère les doublons de dossier ET de fichier — Drive les autorise).
function _jsonFilesByName_(fileName) {
  const out = [];
  const it = DriveApp.getFilesByName(fileName);
  while (it.hasNext()) {
    const f = it.next();
    if (f.isTrashed && f.isTrashed()) continue;
    const ps = f.getParents();
    let inFolder = false;
    while (ps.hasNext()) { if (ps.next().getName() === DRIVE_JSON_FOLDER) { inFolder = true; break; } }
    if (inFolder) out.push(f);
  }
  out.sort((a, b) => b.getLastUpdated() - a.getLastUpdated()); // plus récent d'abord
  return out;
}

function savePlanningToDrive(fileName, content) {
  const files = _jsonFilesByName_(fileName);
  if (files.length) {
    files[0].setContent(content);                              // met à jour le plus récent
    for (let i = 1; i < files.length; i++) files[i].setTrashed(true); // dédoublonne les anciens
  } else {
    _getDriveJsonFolder().createFile(fileName, content, 'application/json');
  }
  Logger.log(`✅ ${fileName} rangé dans Drive (${DRIVE_JSON_FOLDER}) — ${files.length} copie(s) préexistante(s)` + (files.length > 1 ? `, ${files.length - 1} ancienne(s) mise(s) à la corbeille` : ''));
}

function readPlanningFromDrive(fileName) {
  const files = _jsonFilesByName_(fileName);
  if (!files.length) return null;
  return files[0].getBlob().getDataAsString();               // lit toujours le plus récent
}

// ── DIAGNOSTIC : état des dossiers/fichiers JSON dans le Drive ──
// À lancer depuis l'éditeur Apps Script ; lire le journal (Ctrl+Entrée).
function diagDriveJson() {
  let nbFolders = 0;
  const fit = DriveApp.getFoldersByName(DRIVE_JSON_FOLDER);
  while (fit.hasNext()) { const f = fit.next(); nbFolders++; Logger.log(`📁 Dossier "${DRIVE_JSON_FOLDER}" #${nbFolders} — id=${f.getId()}`); }
  Logger.log(`→ ${nbFolders} dossier(s) nommé(s) "${DRIVE_JSON_FOLDER}"` + (nbFolders > 1 ? ' ⚠️ DOUBLON' : ''));
  ['planning_2026.json', 'planning_2027.json', 'affectations_2027.json'].forEach(name => {
    const files = _jsonFilesByName_(name);
    Logger.log(`\n📄 ${name} : ${files.length} copie(s)` + (files.length > 1 ? ' ⚠️ DOUBLON' : ''));
    files.forEach((f, i) => {
      let nbG = 0;
      try {
        const j = JSON.parse(f.getBlob().getDataAsString());
        (j.months || []).forEach(mo => (mo.doctors || []).forEach(d => (d.days || []).forEach(day => { if (day && (day.status === 'G' || day.status === 'G2')) nbG++; })));
      } catch (e) {}
      Logger.log(`   #${i} maj=${f.getLastUpdated().toISOString()} taille=${f.getSize()}o gardes=${nbG} id=${f.getId()}`);
    });
  });
}



// À exécuter UNE FOIS dans l'éditeur Apps Script après recopie :
// déclenche l'autorisation Drive + vérifie écriture/lecture.
function testDrivePlanning() {
  savePlanningToDrive('test_drive.json', JSON.stringify({ok: true, t: new Date().toISOString()}));
  const back = readPlanningFromDrive('test_drive.json');
  Logger.log('Lecture retour : ' + back);
  if (!back || JSON.parse(back).ok !== true) throw new Error('Test Drive ÉCHOUÉ');
  Logger.log('✅ Test Drive OK — autorisation accordée, écriture/lecture fonctionnelles');
}

// À exécuter UNE FOIS avant la suppression des JSON publics (étape 3b) :
// copie chaque planning_/affectations_ encore présent sur GitHub vers Drive.
function migrateJsonToDrive() {
  const out = [];
  const thisYear = new Date().getFullYear();
  for (let y = 2026; y <= thisYear + 2; y++) {
    ['planning', 'affectations'].forEach(kind => {
      const fn = `${kind}_${y}.json`;
      try {
        const r = UrlFetchApp.fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/${fn}`, {muteHttpExceptions: true});
        if (r.getResponseCode() === 200) { savePlanningToDrive(fn, r.getContentText()); out.push(`✅ ${fn} → Drive`); }
        else out.push(`ℹ️ ${fn} absent de GitHub (${r.getResponseCode()})`);
      } catch(e) { out.push(`❌ ${fn} : ${e.message}`); }
    });
  }
  Logger.log(out.join('\n'));
  return out;
}

// ── PUSH FICHIER GITHUB ───────────────────────────────────────────────
function pushFileToGitHub(fileName, content) {
  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`;
  let sha = '';
  try {
    const getResp = UrlFetchApp.fetch(apiUrl, {
      headers: {Authorization: `token ${getGithubToken()}`},
      muteHttpExceptions: true,
    });
    if (getResp.getResponseCode() === 200) sha = JSON.parse(getResp.getContentText()).sha;
  } catch(e) {}

  const body = {
    message: `Update ${fileName} - ${new Date().toISOString()}`,
    content: Utilities.base64Encode(Utilities.newBlob(content).getBytes()),
    branch: GITHUB_BRANCH,
  };
  if (sha) body.sha = sha;

  const resp = UrlFetchApp.fetch(apiUrl, {
    method: 'PUT',
    headers: {Authorization: `token ${getGithubToken()}`, 'Content-Type': 'application/json'},
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });
  const code = resp.getResponseCode();
  if (code === 200 || code === 201) {
    Logger.log(`✅ ${fileName} mis à jour sur GitHub`);
    return { ok: true, code: code };
  }
  const errBody = resp.getContentText().slice(0, 300);
  Logger.log(`❌ GitHub error ${code} pour ${fileName}: ${errBody}`);
  logAction(`❌ Push échoué ${fileName}: ${errBody.slice(0, 100)}`);
  return { ok: false, code: code, body: errBody };
}

// Message clair (pour l'utilisateur) à partir d'un push GitHub raté.
function _pushErrMsg(fileName, res) {
  const c = res && res.code;
  if (c === 401) return "Publication échouée : token GitHub invalide ou expiré. Vérifie / régénère la clé GITHUB_TOKEN dans l'onglet CONFIG.";
  if (c === 403) return "Publication échouée : accès refusé par GitHub (403) — le token n'a peut-être pas le droit « repo », ou la limite d'API est atteinte.";
  if (c === 404) return "Publication échouée : dépôt ou branche introuvable (404). Vérifie le dépôt et la branche dans le code.";
  if (c === 409 || c === 422) return "Publication échouée : conflit GitHub (" + c + ") sur " + fileName + ". Réessaie une fois.";
  return "Publication échouée sur " + fileName + " (code GitHub " + (c || "?") + ").";
}

// (Étape 3) pushToGitHub (rétrocompat) supprimé — aucun appelant.
// pushFileToGitHub est conservé : il sert encore à pousser les pages HTML.

// ── TRIGGERS ─────────────────────────────────────────────────────────
function onEdit(e) {
  const sheetName = e.source.getActiveSheet().getName();
  const year = getActiveYear();
  if (
    sheetName === `AFFECTATIONS_${year}` ||
    sheetName === `GARDES_${year}` ||
    sheetName === 'PLANNING_OVERRIDES' ||
    sheetName === 'SEMAINES_VALIDEES'
  ) {
    // Republication auto silencieuse : on log l'échec sans bloquer l'édition de la
    // feuille (c'est le bouton « Publier » qui, lui, remonte les erreurs à l'écran).
    try { generatePlanning(); } catch (err) { Logger.log('onEdit republication échouée : ' + err.message); }
  }
}

// (Horizon glissant) validerSemaine supprimée — plus de validation manuelle.

// ── ÉCRIRE UN PLANNING OVERRIDE (appelé depuis admin.html via API) ────
// Quand le comité place un MAR dans une case flash
function savePlanningOverride(date, marId, morning, afternoon, comment) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PLANNING_OVERRIDES');
  if (!sheet) {
    sheet = ss.insertSheet('PLANNING_OVERRIDES');
    sheet.getRange(1,1,1,5).setValues([['DATE','MAR_ID','MATIN','APREM','COMMENTAIRE']]);
    sheet.getRange(1,1,1,5).setFontWeight('bold');
    sheet.setColumnWidth(1,100); sheet.setColumnWidth(2,100);
    sheet.setColumnWidth(3,80); sheet.setColumnWidth(4,80); sheet.setColumnWidth(5,200);
  }
  const data = sheet.getDataRange().getValues();
  // Un demi-jour vaut null OU '' → « non modifié » : on NE touche PAS cette colonne.
  // (Le frontend n'envoie jamais '' comme valeur réelle : un retrait envoie 'VOLANT'.)
  // Plus aucune recopie matin→après-midi : les deux demi-journées sont indépendants.
  const setM = (morning != null && morning !== '');
  const setA = (afternoon != null && afternoon !== '');
  // Mise à jour si ligne existante pour ce MAR/date
  for (let r = 1; r < data.length; r++) {
    const rawDate = data[r][0];
    const existDate = rawDate instanceof Date
      ? `${rawDate.getFullYear()}-${String(rawDate.getMonth()+1).padStart(2,'0')}-${String(rawDate.getDate()).padStart(2,'0')}`
      : String(rawDate).trim();
    if (existDate === date && String(data[r][1]).trim().toUpperCase() === marId.toUpperCase()) {
      if (setM) sheet.getRange(r+1, 3).setValue(morning);
      if (setA) sheet.getRange(r+1, 4).setValue(afternoon);
      if (comment) sheet.getRange(r+1, 5).setValue(comment);
      Logger.log(`✅ Override mis à jour : ${marId} le ${date} → M:${setM?morning:'(inchangé)'} A:${setA?afternoon:'(inchangé)'}`);
      return;
    }
  }
  sheet.appendRow([date, marId.toUpperCase(), setM ? morning : '', setA ? afternoon : '', comment || '']);
  Logger.log(`✅ Override ajouté : ${marId} le ${date} → M:${setM?morning:'—'} A:${setA?afternoon:'—'}`);
}

// ── SUPPRIMER UN PLANNING OVERRIDE ───────────────────────────────────
function deletePlanningOverride(date, marId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLANNING_OVERRIDES');
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  for (let r = data.length - 1; r >= 1; r--) {
    const rawDate = data[r][0];
    const existDate = rawDate instanceof Date
      ? `${rawDate.getFullYear()}-${String(rawDate.getMonth()+1).padStart(2,'0')}-${String(rawDate.getDate()).padStart(2,'0')}`
      : String(rawDate).trim();
    if (existDate === date && String(data[r][1]).trim().toUpperCase() === marId.toUpperCase()) {
      sheet.deleteRow(r + 1);
      Logger.log(`✅ Override supprimé : ${marId} le ${date}`);
      return;
    }
  }
}
function reconstruireGardes2026() {
  const SOURCE_ID = '1cM6Ml6_6X4-wSSyl_pLi325ZS3zFXrzK2M-nvjDmB1g';
  const source = SpreadsheetApp.openById(SOURCE_ID);
  const dest = SpreadsheetApp.getActiveSpreadsheet();

  // Supprimer l'onglet GARDES_2026 corrompu s'il existe
  const existing = dest.getSheetByName('GARDES_2026');
  if (existing) dest.deleteSheet(existing);

  // Créer le nouvel onglet GARDES_2026
  const gs = dest.insertSheet('GARDES_2026');

  // Mapping ID MAR → nom dans le fichier source
  const MAR_MAP = {
    'DR ALBOUY':'ALBOUY', 'DR ARMANDO':'ARMANDO', 'DR ARMAND':'ARMAND',
    'DR BONNET':'BONNET', 'DR BOUREGBA':'BOUREGBA', 'DR CATINEAU':'CATINEAU',
    'DR FROHLICH':'FROHLICH', 'DR FERRIERO':'FERRIERO', 'DR GHIGLIONE':'GHIGLIONE',
    'DR GUERIN':'GUERIN', 'DR LEVASSEUR':'LEVASSEUR', 'DR LEY':'LEY',
    'DR MENADE':'MENADE', 'DR OPPRECHT':'OPPRECHT', 'DR PARTOUCHE':'PARTOUCHE',
    'DR ROUSSEAU':'ROUSSEAU', 'DR SALA':'SALA', 'DR SEVERAC':'SEVERAC',
    'DR SULTAN':'SULTAN', 'DR SUPLY':'SUPLY', 'DR WIDEHEM':'WIDEHEM',
    'DR ZAMARON':'ZAMARON', 'DR TRAN':'TRAN', 'PR PRUNET':'PRUNET',
    'DR GARCIA':'GARCIA', 'DR DRUGE':'DRUGE',
  };

  const MOIS = [
    {nom:'JANVIER_26',   mois:1,  year:2026, jours:31},
    {nom:'FEVRIER_26',   mois:2,  year:2026, jours:28},
    {nom:'MARS_26',      mois:3,  year:2026, jours:31},
    {nom:'AVRIL_26',     mois:4,  year:2026, jours:30},
    {nom:'MAI_26',       mois:5,  year:2026, jours:31},
    {nom:'JUIN_26',      mois:6,  year:2026, jours:30},
    {nom:'JUILLET_26',   mois:7,  year:2026, jours:31},
    {nom:'AOUT_26',      mois:8,  year:2026, jours:31},
    {nom:'SEPTEMBRE_26', mois:9,  year:2026, jours:30},
    {nom:'OCTOBRE_26',   mois:10, year:2026, jours:31},
    {nom:'NOVEMBRE_26',  mois:11, year:2026, jours:30},
    {nom:'DECEMBRE_26',  mois:12, year:2026, jours:31},
    {nom:'JANVIER_27',   mois:1,  year:2027, jours:4},
  ];

  // Construire la liste de tous les jours de l'année planning 2026
  // Premier lundi de janvier 2026
  const jan1 = new Date(2026, 0, 1);
  const dow1 = jan1.getDay();
  const offset = dow1 === 1 ? 7 : dow1 === 0 ? 1 : 8 - dow1;
  const startDate = new Date(2026, 0, 1 + offset);

  // Dernier jour = veille du premier lundi de janvier 2027
  const jan1Next = new Date(2027, 0, 1);
  const dow1Next = jan1Next.getDay();
  const offsetNext = dow1Next === 1 ? 7 : dow1Next === 0 ? 1 : 8 - dow1Next;
  const endDate = new Date(2027, 0, offsetNext - 1);

  const allDays = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    allDays.push({
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      day: d.getDate(),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      dow: d.getDay(),
    });
    d.setDate(d.getDate() + 1);
  }

  // Lire les données depuis chaque onglet mensuel
  const gardesData = {}; // gardesData[marId][date] = code

  MOIS.forEach(m => {
    const sheet = source.getSheetByName(m.nom);
    if (!sheet) { Logger.log(`⚠️ Onglet ${m.nom} introuvable`); return; }
    const data = sheet.getDataRange().getValues();
    const numRows = data.length;
    const numCols = data[0].length;

    // Lire toutes les couleurs de fond en une seule fois
    const backgrounds = sheet.getRange(1, 1, numRows, numCols).getBackgrounds();

    const dayNums = data[1]; // ligne 2 : numéros des jours

    for (let r = 3; r < numRows; r++) {
      const rawName = String(data[r][0] || '').trim();
      if (!rawName) continue;
      const marId = MAR_MAP[rawName];
      if (!marId) continue;
      if (!gardesData[marId]) gardesData[marId] = {};

      for (let c = 1; c < dayNums.length; c++) {
        const dayNum = Number(dayNums[c]);
        if (!dayNum) continue;
        const dateStr = `${m.year}-${String(m.mois).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
        const val = String(data[r][c] || '').trim();
        const bg = backgrounds[r][c].toLowerCase();

        let code = '';
        if (bg === '#00b0f0') code = 'G2';      // Anesth/MAT
        else if (bg === '#0070c0') code = 'G';   // Réa/REA
        else if (val) code = val;                 // RG, R, 18, V, F, A, I...

        if (code) gardesData[marId][dateStr] = code;
      }
    }
    Logger.log(`✅ ${m.nom} lu`);
  });

  // Écrire GARDES_2026
  const ROUGE = '#C0392B', GRIS_WE = '#CFD8DC', BLANC = '#FFFFFF';
  const JOURS_ABR = ['D','L','M','M','J','V','S'];
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const nCols = allDays.length + 1;
  gs.setFrozenRows(3);

  // Ligne 1 : mois
  const row1 = ['MEDECIN']; allDays.forEach(() => row1.push(''));
  gs.getRange(1, 1, 1, nCols).setValues([row1]);
  gs.getRange(1, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');

  let mStart = 2, prevMonth = allDays[0].month;
  allDays.forEach((day, i) => {
    const col = i + 2;
    const isLast = i === allDays.length - 1;
    if (day.month !== prevMonth || isLast) {
      const mEnd = (day.month !== prevMonth) ? col - 1 : col;
      if (mEnd >= mStart) gs.getRange(1, mStart, 1, mEnd - mStart + 1).merge();
      gs.getRange(1, mStart).setValue(MOIS_FR[prevMonth - 1])
        .setBackground(ROUGE).setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
      mStart = col; prevMonth = day.month;
    }
  });

  // Ligne 2 : initiales jours
  const row2 = ['JOUR']; allDays.forEach(d => row2.push(JOURS_ABR[d.dow]));
  gs.getRange(2, 1, 1, nCols).setValues([row2]);
  gs.getRange(2, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');

  // Ligne 3 : numéros
  const row3 = ['N°']; allDays.forEach(d => row3.push(d.day));
  gs.getRange(3, 1, 1, nCols).setValues([row3]);
  gs.getRange(3, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');

  // Données MAR
  const allMars = Object.values(MAR_MAP);
  const dRows = allMars.map(marId => {
    const row = [marId];
    allDays.forEach(day => {
      row.push((gardesData[marId] || {})[day.date] || '');
    });
    return row;
  });
  gs.getRange(4, 1, dRows.length, nCols).setValues(dRows);

  // Mise en forme
  allDays.forEach((day, i) => {
    const col = i + 2;
    const isWE = day.dow === 0 || day.dow === 6;
    gs.getRange(1, col, 3 + dRows.length, 1).setBackground(isWE ? GRIS_WE : BLANC);
    const nextDay = allDays[i + 1];
    if (!nextDay || nextDay.month !== day.month) {
      gs.getRange(1, col, 3 + dRows.length, 1)
        .setBorder(null, null, null, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  });

  gs.setColumnWidth(1, 120);
  for (let c = 2; c <= nCols; c++) gs.setColumnWidth(c, 35);
  gs.getRange(1, 2, 3 + dRows.length, nCols - 1).setHorizontalAlignment('center');

  Logger.log(`✅ GARDES_2026 reconstruit — ${allDays.length} jours, ${dRows.length} MARs`);
  SpreadsheetApp.getUi().alert('✅ GARDES_2026 reconstruit avec succès !');
}
function testGenerate2027() {
  generateGardes(2027);
}
function testSetDailyStatus() {
  const year = 2026, marId = 'FROHLICH', date = '2026-10-13';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = ss.getSheetByName(`GARDES_${year}`).getDataRange().getValues();
  const col = buildDateToCol(data, year)[date];
  let row = -1;
  for (let r = 3; r < data.length; r++) if (String(data[r][0]).trim().toUpperCase() === marId) { row = r; break; }
  Logger.log(`${marId} ${date} → row=${row} col=${col} valeur="${(row>=0&&col!==undefined)?data[row][col]:'INTROUVABLE'}"`);
}
function debugLCstatus() {
  const months = generatePlanningFromGardes(2026);
  const jul = months.find(mo => mo.year === 2026 && mo.month === 7); // juillet
  if (!jul) { Logger.log('juillet 2026 introuvable'); return; }
  const lc = jul.doctors.find(d => d.id === 'COPELOVICI');
  if (!lc) { Logger.log('✅ COPELOVICI absente de juillet (filtre mensuel OK → patchs en place)'); return; }
  Logger.log('COPELOVICI juillet : ' + lc.days.map(d => d.status || '·').join(' '));
}
