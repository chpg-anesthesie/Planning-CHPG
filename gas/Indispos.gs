// ── CONFIG ─────────────────────────────────────────────────────────────
const GITHUB_USER_INDISPOS = 'chpg-anesthesie';
const GITHUB_REPO_INDISPOS = 'Planning-CHPG';
const ADMIN_CODE = 'CHPG2026ADMIN';
const TEST_YEAR = getActiveYear();

function getIndisposYear() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('CONFIG');
  if (!sheet) return getActiveYear();
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim() === 'INDISPOS_ACTIVE') {
      const y = parseInt(String(data[r][1]).trim());
      if (!isNaN(y)) return y;
    }
  }
  return getActiveYear();
}

// (C3) MEDECINS_LIST supprimé — l'effectif vient de l'onglet MEDECINS.

// ── LOG ───────────────────────────────────────────────────────────────
function logAction(message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('LOGS');
    if (!sheet) {
      sheet = ss.insertSheet('LOGS');
      sheet.getRange(1, 1, 1, 2).setValues([['TIMESTAMP','MESSAGE']]);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold');
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 400);
    }
    sheet.appendRow([new Date(), message]);
    if (sheet.getLastRow() > 501) sheet.deleteRows(2, sheet.getLastRow() - 501);
  } catch(e) {
    Logger.log('logAction error: ' + e.message);
  }
}

// ── JOURNAL DES CONNEXIONS (qui se connecte, quand, avec quel rôle) ────
function logConnexion(user) {
  try {
    if (!user) return;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('CONNEXIONS');
    if (!sheet) {
      sheet = ss.insertSheet('CONNEXIONS');
      sheet.getRange(1, 1, 1, 4).setValues([['HORODATAGE','NOM','INITIALES','ROLE']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      sheet.setColumnWidth(1, 160); sheet.setColumnWidth(2, 200);
    }
    sheet.appendRow([new Date(), user.name || '', user.initials || '', user.role || '']);
    if (sheet.getLastRow() > 2001) sheet.deleteRows(2, sheet.getLastRow() - 2001);
  } catch(e) {
    Logger.log('logConnexion error: ' + e.message);
  }
}

// ── GÉNÉRATION CODE ACCÈS ─────────────────────────────────────────────
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// (C3) setupIndispos supprimé — remplacé par initYear / setupAnnee.

// ── LIRE INDISPOS D'UN MAR ────────────────────────────────────────────
function getIndisposForDoctor(doctorId, year) {
  year = year || TEST_YEAR;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`INDISPOS_${year}`);
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const dates = reconstruireDatesHeaders(data, year); // (C3b) helper unifié
  // MARs à partir de la ligne 4 (index 3)
  for (let r = 3; r < data.length; r++) {
    if (String(data[r][0]).trim() === String(doctorId).trim()) {
      const indispos = {};
      dates.forEach((date, i) => {
        if (!date) return;
        const val = String(data[r][i+1]||'').trim();
        if (val) indispos[date] = val;
      });
      return indispos;
    }
  }
  return {};
}

// ── SAUVEGARDER INDISPOS D'UN MAR ────────────────────────────────────
function saveIndisposForDoctor(doctorId, indisposMap, year) {
  year = year || TEST_YEAR;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`INDISPOS_${year}`);
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  const dates = reconstruireDatesHeaders(data, year); // (C3b) helper unifié
  // MARs à partir de la ligne 4 (index 3)
  for (let r = 3; r < data.length; r++) {
    if (String(data[r][0]).trim() === String(doctorId).trim()) {
      const rowValues = dates.map(date => date ? (indisposMap[date] || '') : '');
      sheet.getRange(r + 1, 2, 1, rowValues.length).setValues([rowValues]);
      return true;
    }
  }
  return false;
}

// ── VÉRIFIER CODE ACCÈS ───────────────────────────────────────────────
function checkCode(code) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('CONFIG');
  let adminCode = 'CHPG2026ADMIN';
  if (configSheet) {
    const configData = configSheet.getDataRange().getValues();
    for (let r = 1; r < configData.length; r++) {
      if (String(configData[r][0]).trim() === 'ADMIN_CODE') {
        adminCode = String(configData[r][1]).trim();
        break;
      }
    }
  }
  if (code === adminCode) return {role: 'admin', id: 'ADMIN'};

  const sheet = ss.getSheetByName('MEDECINS');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][6]).trim() === String(code).trim()) {
      return {role:'mar', id:data[r][0], name:data[r][1], initials:data[r][2]};
    }
  }
  return null;
}

// ── JOURS FÉRIÉS ─────────────────────────────────────────────────────
// (C3) Définition unique : getJoursFeries() est global, défini dans code.gs.

// ── CALCUL PRIORITÉS VACANCES ─────────────────────────────────────────
// ── Cache PAR-EXÉCUTION des onglets partagés (process neuf à chaque requête →
// jamais de données périmées). Évite que getVacConfig relise GROUPES_VAC / PERIODES_VAC /
// INDISPOS / MEDECINS une fois PAR médecin (getConflitsAll boucle sur ~20 MARs).
var _VAC_SHARED = {};
function _getVacShared(year) {
  if (_VAC_SHARED[year]) return _VAC_SHARED[year];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const gs = ss.getSheetByName('GROUPES_VAC');
  const ps = ss.getSheetByName('PERIODES_VAC');
  const is_ = ss.getSheetByName(`INDISPOS_${year}`);
  const ms = ss.getSheetByName('MEDECINS');
  _VAC_SHARED[year] = {
    groupData: gs ? gs.getDataRange().getValues() : [],
    perData:   ps ? ps.getDataRange().getValues() : [],
    indData:   is_ ? is_.getDataRange().getValues() : null,
    medData:   ms ? ms.getDataRange().getValues() : [],
    jfYear:     getJoursFeries(year),
    jfNextYear: getJoursFeries(year + 1),
  };
  return _VAC_SHARED[year];
}

function getVacConfig(doctorId, year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const _ctx = _getVacShared(year);

  const ORDRE_BASE_2026 = {
    HIVER:'CAB', PRINTEMPS:'ABC', ETE:'ABC', TOUSSAINT:'BCA', NOEL:'CAB',
  };

  function premierJourAnneePlanning(y) {
    const jan1 = new Date(y, 0, 1);
    const dow = jan1.getDay();
    const offset = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
    const d = new Date(y, 0, 1 + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'00')}-${String(d.getDate()).padStart(2,'00')}`;
  }

  const groupData = _ctx.groupData;
  const groups = { A: [], B: [], C: [] };
  const ordre2026 = { A: {}, B: {}, C: {} };
  for (let r = 1; r < groupData.length; r++) {
    const grp = String(groupData[r][0]).trim();
    const id  = String(groupData[r][1]).trim();
    const ord = Number(groupData[r][2]);
    if (!id || !groups[grp]) continue;
    groups[grp].push(id);
    ordre2026[grp][id] = ord;
  }

  const offset = year - 2026;
  function getOrderedGroup(grp) {
    const sorted = [...groups[grp]].sort((a,b) => ordre2026[grp][a] - ordre2026[grp][b]);
    const shift = offset % sorted.length;
    return [...sorted.slice(shift), ...sorted.slice(0, shift)];
  }
  const orderedA = getOrderedGroup('A');
  const orderedB = getOrderedGroup('B');
  const orderedC = getOrderedGroup('C');

  const perData = _ctx.perData;
  const debutAnnee = premierJourAnneePlanning(year);
  const finAnnee = premierJourAnneePlanning(year + 1);

  const indData = _ctx.indData;
  if (!indData) return { periodes: [], quotaVac: 40, totalVacDoc: 0 };

  const jan1Ind = new Date(year, 0, 1);
  const dow1Ind = jan1Ind.getDay();
  const off1Ind = dow1Ind === 1 ? 7 : dow1Ind === 0 ? 1 : 8 - dow1Ind;
  const startInd = new Date(year, 0, 1 + off1Ind, 12, 0, 0);
  const jan1NextInd = new Date(year + 1, 0, 1);
  const dow1NextInd = jan1NextInd.getDay();
  const offNextInd = dow1NextInd === 1 ? 7 : dow1NextInd === 0 ? 1 : 8 - dow1NextInd;
  const endInd = new Date(year + 1, 0, offNextInd);
  const indDates = [];
  const dtInd = new Date(startInd);
  while (dtInd <= endInd) {
    indDates.push(`${dtInd.getFullYear()}-${String(dtInd.getMonth()+1).padStart(2,'00')}-${String(dtInd.getDate()).padStart(2,'00')}`);
    dtInd.setDate(dtInd.getDate() + 1);
  }

  const vacByDoc = {};
  for (let r = 3; r < indData.length; r++) {
    const id = String(indData[r][0]).trim();
    if (!id) continue;
    vacByDoc[id] = new Set();
    indDates.forEach((date, i) => {
      const val = String(indData[r][i+1]||'').trim();
      if (val === 'VAC' || val === 'FORM') vacByDoc[id].add(date);
    });
  }

  const medData = _ctx.medData;
  let quotite = 100;
  for (let r = 1; r < medData.length; r++) {
    if (String(medData[r][0]).trim() === doctorId) {
      quotite = Number(medData[r][4]) || 100;
      break;
    }
  }
  const quotas = getQuotasConges(quotite);
  const quotaVac = quotas.vac;

  const jfYear = _ctx.jfYear;
  const jfNextYear = _ctx.jfNextYear;
  const totalVacDoc = [...(vacByDoc[doctorId] || [])].filter(date => {
    const dow = new Date(date).getDay();
    return dow !== 0 && dow !== 6 && !jfYear.has(date) && !jfNextYear.has(date);
  }).length;

  const periodes = [];
  for (let r = 1; r < perData.length; r++) {
    const nom = String(perData[r][0]).trim();
    const debutRaw = perData[r][1];
    const finRaw   = perData[r][2];
    const debut = debutRaw instanceof Date
      ? `${debutRaw.getFullYear()}-${String(debutRaw.getMonth()+1).padStart(2,'00')}-${String(debutRaw.getDate()).padStart(2,'00')}`
      : String(debutRaw).trim();
    const fin = finRaw instanceof Date
      ? `${finRaw.getFullYear()}-${String(finRaw.getMonth()+1).padStart(2,'00')}-${String(finRaw.getDate()).padStart(2,'00')}`
      : String(finRaw).trim();
    const seuil = Number(perData[r][3]);

    if (debut < debutAnnee || debut >= finAnnee) continue;

    const nomNorm = nom.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
    const base = ORDRE_BASE_2026[nomNorm] || 'ABC';
    const grpArr = base.split('');
    const grpShift = offset % 3;
    const orderedGrps = [...grpArr.slice(grpShift), ...grpArr.slice(0, grpShift)];
    const orderedList = [];
    orderedGrps.forEach(g => {
      if (g === 'A') orderedList.push(...orderedA);
      else if (g === 'B') orderedList.push(...orderedB);
      else if (g === 'C') orderedList.push(...orderedC);
    });

    const rang = orderedList.indexOf(doctorId) + 1;
    const joursBloqués = [];
    const joursDisponibles = [];
    const dt = new Date(debut + 'T12:00:00');
    const dtFin = new Date(fin + 'T12:00:00');

    while (dt <= dtFin) {
      const dateStr = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'00')}-${String(dt.getDate()).padStart(2,'00')}`;
      const _dow = dt.getDay();
      if (_dow === 0 || _dow === 6 || jfYear.has(dateStr) || jfNextYear.has(dateStr)) {
        joursDisponibles.push(dateStr); dt.setDate(dt.getDate() + 1); continue;
      }
      const marEnVacCeJour = orderedList.filter(id => vacByDoc[id]?.has(dateStr));
      const nbEnVac = marEnVacCeJour.length;
      const rangDansCeJour = marEnVacCeJour.indexOf(doctorId) + 1;

      if (rangDansCeJour > 0 && rangDansCeJour > seuil) joursBloqués.push(dateStr);
else joursDisponibles.push(dateStr);

      dt.setDate(dt.getDate() + 1);
    }

    const aBloqueAuMoinsUnJour = joursBloqués.length > 0;
    const tousBloqués = joursBloqués.length === (joursDisponibles.length + joursBloqués.length);

    periodes.push({
      nom, debut, fin, seuil, rang,
      joursBloqués, joursDisponibles,
      bloque: aBloqueAuMoinsUnJour, tousBloqués,
      marAvantNonValides: 0, marEnVac: 0, seuilAtteint: tousBloqués,
    });
  }

  return { periodes, quotaVac, quotaForm: quotas.form, quotaCtp: quotas.ctp, totalVacDoc };
}
// ── R2 — Système de congés (quotas pilotés par CONFIG_CONGES) ──────────
function setupCongesConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('CONFIG_CONGES');
  if (sheet) { SpreadsheetApp.getUi().alert('CONFIG_CONGES existe déjà — rien modifié.'); return; }
  sheet = ss.insertSheet('CONFIG_CONGES');
  sheet.getRange(1, 1, 1, 4).setValues([['QUOTITE', 'VAC', 'FORM', 'CTP']]).setFontWeight('bold');
  const rows = [[100,33,10,0],[90,30,9,12],[80,26,8,26],[60,20,6,62],[50,17,5,104]];
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  sheet.setColumnWidth(1, 90); [2,3,4].forEach(c => sheet.setColumnWidth(c, 70));
  sheet.setFrozenRows(1);
  SpreadsheetApp.getUi().alert('✅ CONFIG_CONGES créé.\n\n⚠️ Chiffres à confirmer avec la DRH (surtout CTP).');
}

let _quotasCache = null;
function _loadQuotasConges() {
  if (_quotasCache !== null) return _quotasCache;
  _quotasCache = {};
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG_CONGES');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      const q = Number(data[r][0]); if (!q) continue;
      _quotasCache[q] = { vac:Number(data[r][1])||0, form:Number(data[r][2])||0, ctp:Number(data[r][3])||0 };
    }
  }
  return _quotasCache;
}

function getQuotasConges(quotite) {
  const q = Number(quotite) || 100;
  const table = _loadQuotasConges();
  if (table[q]) return { vac:table[q].vac, form:table[q].form, ctp:q>=100?0:table[q].ctp };
  const tiers = Object.keys(table).map(Number);
  if (tiers.length) {
    const n = tiers.reduce((a,b) => Math.abs(b-q)<Math.abs(a-q)?b:a);
    return { vac:table[n].vac, form:table[n].form, ctp:q>=100?0:table[n].ctp };
  }
  return { vac:Math.round(17+16*(q-50)/50), form:Math.round(5+5*(q-50)/50), ctp:0 };
}
// ── VALIDATION VACANCES ───────────────────────────────────────────────
function getVacValidation(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ORDRE_BASE_2026 = {
    HIVER:'CAB', PRINTEMPS:'ABC', ETE:'ABC', TOUSSAINT:'BCA', NOEL:'CAB',
  };

  function premierJourAnneePlanning(y) {
    const jan1 = new Date(y, 0, 1);
    const dow = jan1.getDay();
    const offset = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
    const d = new Date(y, 0, 1 + offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'00')}-${String(d.getDate()).padStart(2,'00')}`;
  }

  const groupSheet = ss.getSheetByName('GROUPES_VAC');
  const groupData = groupSheet.getDataRange().getValues();
  const groups = { A: [], B: [], C: [] };
  const ordre2026 = { A: {}, B: {}, C: {} };
  for (let r = 1; r < groupData.length; r++) {
    const grp = String(groupData[r][0]).trim();
    const id  = String(groupData[r][1]).trim();
    const ord = Number(groupData[r][2]);
    if (!id || !groups[grp]) continue;
    groups[grp].push(id);
    ordre2026[grp][id] = ord;
  }

  const offset = year - 2026;
  function getOrderedGroup(grp) {
    const sorted = [...groups[grp]].sort((a,b) => ordre2026[grp][a] - ordre2026[grp][b]);
    const shift = offset % sorted.length;
    return [...sorted.slice(shift), ...sorted.slice(0, shift)];
  }
  const orderedA = getOrderedGroup('A');
  const orderedB = getOrderedGroup('B');
  const orderedC = getOrderedGroup('C');

  const perSheet = ss.getSheetByName('PERIODES_VAC');
  const perData = perSheet.getDataRange().getValues();
  const debutAnnee = premierJourAnneePlanning(year);
  const finAnnee = premierJourAnneePlanning(year + 1);

  const indSheet = ss.getSheetByName(`INDISPOS_${year}`);
  if (!indSheet) return [];

  const jan1Ind = new Date(year, 0, 1);
  const dow1Ind = jan1Ind.getDay();
  const off1Ind = dow1Ind === 1 ? 7 : dow1Ind === 0 ? 1 : 8 - dow1Ind;
  const startInd = new Date(year, 0, 1 + off1Ind, 12, 0, 0);
  const jan1NextInd = new Date(year + 1, 0, 1);
  const dow1NextInd = jan1NextInd.getDay();
  const offNextInd = dow1NextInd === 1 ? 7 : dow1NextInd === 0 ? 1 : 8 - dow1NextInd;
  const endInd = new Date(year + 1, 0, offNextInd);
  const indDates = [];
  const dtInd = new Date(startInd);
  while (dtInd <= endInd) {
    indDates.push(`${dtInd.getFullYear()}-${String(dtInd.getMonth()+1).padStart(2,'00')}-${String(dtInd.getDate()).padStart(2,'00')}`);
    dtInd.setDate(dtInd.getDate() + 1);
  }

  const indData = indSheet.getDataRange().getValues();
  const vacByDoc = {};
  for (let r = 3; r < indData.length; r++) {
    const id = String(indData[r][0]).trim();
    if (!id) continue;
    vacByDoc[id] = new Set();
    indDates.forEach((date, i) => {
      const val = String(indData[r][i+1]||'').trim();
      if (val === 'VAC' || val === 'FORM') vacByDoc[id].add(date);
    });
  }

  const medSheet = ss.getSheetByName('MEDECINS');
  const medData = medSheet.getDataRange().getValues();
  const nomMap = {};
  for (let r = 1; r < medData.length; r++) {
    const id = String(medData[r][0]).trim();
    nomMap[id] = String(medData[r][1]).trim();
  }

  const jfYear = getJoursFeries(year);
  const jfNextYear = getJoursFeries(year + 1);

  const result = [];
  for (let r = 1; r < perData.length; r++) {
    const nom = String(perData[r][0]).trim();
    const debutRaw = perData[r][1];
    const finRaw   = perData[r][2];
    const debut = debutRaw instanceof Date
      ? `${debutRaw.getFullYear()}-${String(debutRaw.getMonth()+1).padStart(2,'00')}-${String(debutRaw.getDate()).padStart(2,'00')}`
      : String(debutRaw).trim();
    const fin = finRaw instanceof Date
      ? `${finRaw.getFullYear()}-${String(finRaw.getMonth()+1).padStart(2,'00')}-${String(finRaw.getDate()).padStart(2,'00')}`
      : String(finRaw).trim();
    const seuil = Number(perData[r][3]);

    if (debut < debutAnnee || debut >= finAnnee) continue;

    const nomNorm = nom.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
    const base = ORDRE_BASE_2026[nomNorm] || 'ABC';
    const grpArr = base.split('');
    const grpShift = offset % 3;
    const orderedGrps = [...grpArr.slice(grpShift), ...grpArr.slice(0, grpShift)];
    const orderedList = [];
    orderedGrps.forEach(g => {
      if (g === 'A') orderedList.push(...orderedA);
      else if (g === 'B') orderedList.push(...orderedB);
      else if (g === 'C') orderedList.push(...orderedC);
    });

    const mars = orderedList.map((id, idx) => {
      const rang = idx + 1;
      const joursVac = [...(vacByDoc[id] || [])].filter(d => d >= debut && d <= fin);
      const joursOuvres = joursVac.filter(d => {
        const dow = new Date(d).getDay();
        return dow !== 0 && dow !== 6 && !jfYear.has(d) && !jfNextYear.has(d);
      });

      let joursValides = 0, joursRefuses = 0;
      joursOuvres.forEach(date => {
        const marEnVacCeJour = orderedList.filter(mid => vacByDoc[mid]?.has(date));
        const rangCeJour = marEnVacCeJour.indexOf(id) + 1;
        if (rangCeJour > 0 && rangCeJour <= seuil) joursValides++;
        else if (rangCeJour > seuil) joursRefuses++;
      });

      let statut;
      if (joursOuvres.length === 0) statut = 'AUCUN';
      else if (joursRefuses === 0) statut = 'VALIDE';
      else if (joursValides === 0) statut = 'REFUSE';
      else statut = 'PARTIEL';

      return {id, nom:nomMap[id]||id, rang,
        joursVac:joursVac.length, joursOuvres:joursOuvres.length,
        joursValides, joursRefuses, statut};
    });

    result.push({ nom, debut, fin, seuil, mars });
  }

  return result;
}

// ── APPLY MODIFICATION (Comité) ───────────────────────────────────────
function applyModification(mod) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = Number(mod.year) || TEST_YEAR;

  function getSheet(name) {
    const s = ss.getSheetByName(name);
    if (!s) throw new Error(`Onglet ${name} introuvable`);
    return s;
  }

  function buildDateIndex(sheet) {
    const jan1 = new Date(year, 0, 1);
    const dow1 = jan1.getDay();
    const off1 = dow1 === 1 ? 7 : dow1 === 0 ? 1 : 8 - dow1;
    const startDate = new Date(year, 0, 1 + off1, 12, 0, 0);
    const nCols = sheet.getLastColumn() - 1;
    const index = {};
    for (let i = 0; i < nCols; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'00')}-${String(d.getDate()).padStart(2,'00')}`;
      index[key] = i + 2;
    }
    return index;
  }

  function getDateIndex(sheet, date) { return buildDateIndex(sheet)[date] || -1; }

  function getDoctorRow(sheet, doctorId) {
    const col = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues();
    for (let i = 3; i < col.length; i++) {
      if (String(col[i][0]).trim() === doctorId) return i + 1;
    }
    return -1;
  }

  function writeCell(sheetName, doctorId, date, value) {
    const sheet = getSheet(sheetName);
    const col = getDateIndex(sheet, date);
    const row = getDoctorRow(sheet, doctorId);
    if (col < 0) throw new Error(`Date ${date} introuvable dans ${sheetName}`);
    if (row < 0) throw new Error(`Médecin ${doctorId} introuvable dans ${sheetName}`);
    sheet.getRange(row, col).setValue(value);
  }

  function readCell(sheetName, doctorId, date) {
    const sheet = getSheet(sheetName);
    const col = getDateIndex(sheet, date);
    const row = getDoctorRow(sheet, doctorId);
    if (col < 0 || row < 0) return '';
    return String(sheet.getRange(row, col).getValue()).trim();
  }

  function nextDay(date) {
    const d = new Date(date + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'00')}-${String(d.getDate()).padStart(2,'00')}`;
  }

  const { type, date, doctorId, doctorId2, value, date2 } = mod;

  switch (type) {
    case 'echangeSecteur': {
      const valA = readCell(`INDISPOS_${year}`, doctorId,  date);
      const valB = readCell(`INDISPOS_${year}`, doctorId2, date);
      writeCell(`INDISPOS_${year}`, doctorId,  date, valB);
      writeCell(`INDISPOS_${year}`, doctorId2, date, valA);
      break;
    }
    case 'gardeExceptionnelle': {
      const lendemain = nextDay(date);
      writeCell(`GARDES_${year}`, doctorId, date, value || 'G');
      writeCell(`GARDES_${year}`, doctorId, lendemain, 'RG');
      break;
    }
    case 'echangeGarde': {
      const valGardeA = readCell(`GARDES_${year}`, doctorId,  date);
      const valGardeB = readCell(`GARDES_${year}`, doctorId2, date);
      writeCell(`GARDES_${year}`, doctorId,  date, valGardeB);
      writeCell(`GARDES_${year}`, doctorId2, date, valGardeA);
      const jourRG = date2 || nextDay(date);
      const valRGA = readCell(`GARDES_${year}`, doctorId,  jourRG);
      const valRGB = readCell(`GARDES_${year}`, doctorId2, jourRG);
      writeCell(`GARDES_${year}`, doctorId,  jourRG, valRGB);
      writeCell(`GARDES_${year}`, doctorId2, jourRG, valRGA);
      break;
    }
    case 'donGarde': {
      const valGarde = readCell(`GARDES_${year}`, doctorId, date);
      const jourRG = date2 || nextDay(date);
      writeCell(`GARDES_${year}`, doctorId,  date,   '');
      writeCell(`GARDES_${year}`, doctorId2, date,   valGarde);
      writeCell(`GARDES_${year}`, doctorId,  jourRG, '');
      writeCell(`GARDES_${year}`, doctorId2, jourRG, 'RG');
      break;
    }
    case 'echangeGardeJours': {
      // Échange de DEUX gardes sur deux dates : doctorId@date <-> doctorId2@date2 (le rôle reste attaché à sa date).
      if (date === date2) throw new Error('Les deux dates doivent être différentes');
      const codeA = readCell(`GARDES_${year}`, doctorId,  date);
      const codeB = readCell(`GARDES_${year}`, doctorId2, date2);
      if (!/^G2?$/.test(String(codeA).toUpperCase())) throw new Error(`Pas de garde G/G2 pour ${doctorId} le ${date}`);
      if (!/^G2?$/.test(String(codeB).toUpperCase())) throw new Error(`Pas de garde G/G2 pour ${doctorId2} le ${date2}`);
      const rg1 = nextDay(date), rg2 = nextDay(date2);
      if (rg1 === date2 || rg2 === date) throw new Error('Dates trop proches (gardes adjacentes) — à échanger manuellement');
      // refus si un MAR a déjà quelque chose à la date d'arrivée (évite d'écraser une garde existante)
      if (readCell(`GARDES_${year}`, doctorId, date2) || readCell(`GARDES_${year}`, doctorId2, date))
        throw new Error('Un des médecins a déjà une garde à l\'autre date — échange à traiter manuellement');
      // échange des gardes (chaque date conserve son rôle G/G2)
      writeCell(`GARDES_${year}`, doctorId,  date,  '');
      writeCell(`GARDES_${year}`, doctorId2, date,  codeA);
      writeCell(`GARDES_${year}`, doctorId2, date2, '');
      writeCell(`GARDES_${year}`, doctorId,  date2, codeB);
      // les repos de garde (RG) du lendemain suivent la personne
      writeCell(`GARDES_${year}`, doctorId,  rg1, '');
      writeCell(`GARDES_${year}`, doctorId2, rg1, 'RG');
      writeCell(`GARDES_${year}`, doctorId2, rg2, '');
      writeCell(`GARDES_${year}`, doctorId,  rg2, 'RG');
      break;
    }
    // (C3b) 'indispo'/'secteur'/'libre' retirés — écrivaient dans OVERRIDES (jamais lu).
    // Le placement secteur réel passe par savePlanningOverride → PLANNING_OVERRIDES.
    default:
      throw new Error(`Type de modification inconnu : ${type}`);
  }

  generatePlanning();
  return true;
}
// ── STATUT CYCLE PLANNING ────────────────────────────────────────────
function getPlanningStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = TEST_YEAR;
  const nextYear = year + 1;
  const indNextSheet = ss.getSheetByName('INDISPOS_' + nextYear);
  const indisposN1Exists = !!indNextSheet;
  let indisposN1Complete = false, marsManquants = 0;
  if (indNextSheet) {
    const medSheet = ss.getSheetByName('MEDECINS');
    const medData = medSheet ? medSheet.getDataRange().getValues() : [];
    const actifs = [];
    for (let r = 1; r < medData.length; r++) {
      if (String(medData[r][3]).trim().toUpperCase() === 'O') actifs.push(String(medData[r][0]).trim());
    }
    const indData = indNextSheet.getDataRange().getValues();
    const indById = {};
    for (let r = 3; r < indData.length; r++) {
      const id = String(indData[r][0]).trim();
      if (!id) continue;
      indById[id] = indData[r].slice(1).some(v => String(v).trim() !== '');
    }
    marsManquants = actifs.filter(id => !indById[id]).length;
    indisposN1Complete = marsManquants === 0;
  }
  const gardesNextSheet = ss.getSheetByName('GARDES_' + nextYear);
  const gardesN1Generated = !!(gardesNextSheet && gardesNextSheet.getLastRow() > 3);
  // Vérifier la présence de stats_N.json sur GitHub Pages
let gardesNClosed = false;
try {
  const checkUrl = 'https://chpg-anesthesie.github.io/Planning-CHPG/stats_' + year + '.json';
  const resp = UrlFetchApp.fetch(checkUrl, {muteHttpExceptions: true});
  gardesNClosed = resp.getResponseCode() === 200;
} catch(e) {
  gardesNClosed = false;
}
  return { indisposN1Exists, indisposN1Complete, marsManquants, gardesN1Generated, gardesNClosed, year, nextYear };
}
// ── API WEB APP — doGet ───────────────────────────────────────────────
function doGet(e) {
  try {
    const payload = JSON.parse(e.parameter.payload || '{}');
    const action = payload.action;
    const code = payload.code;

    if (action === 'getActiveYear') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, year: TEST_YEAR
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getStatus') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true, status: getPlanningStatus()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getStatsLive') {
      const statsYear = Number(payload.year) || TEST_YEAR;
      try {
        return ContentService.createTextOutput(JSON.stringify({success:true, stats:computeStatsLive(statsYear)}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch (err) { return _error(err.message); }
    }
    const user = checkCode(code);
    if (!user) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, error: 'Code invalide'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'login') {
      logConnexion(user);
      return ContentService.createTextOutput(JSON.stringify({
        success: true, role: user.role, id: user.id,
        name: user.name, initials: user.initials, 
        year: TEST_YEAR, indisposYear: getIndisposYear(),
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getNoelAnEligibles') {
      const yr = parseInt(payload.year) || getIndisposYear();
      return ContentService.createTextOutput(JSON.stringify({
        success: true, year: yr, eligibles: computeNoelAnEligibles(yr)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getIndispos') {
      const targetId = user.role === 'admin' ? payload.doctorId : user.id;
      return ContentService.createTextOutput(JSON.stringify({
        success: true, indispos: getIndisposForDoctor(targetId, getIndisposYear())
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveIndispos') {
      const targetId = user.role === 'admin' ? payload.doctorId : user.id;
      return ContentService.createTextOutput(JSON.stringify({
        success: saveIndisposForDoctor(targetId, payload.indispos, getIndisposYear())
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAllIndispos') {
  if (user.role !== 'admin') return _deny();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const indYear = Number(payload.year) || getIndisposYear();
  const sheet = ss.getSheetByName(`INDISPOS_${indYear}`);
      if (!sheet) return _error(`INDISPOS_${indYear} introuvable`);
      const data = sheet.getDataRange().getValues();
      const dates = reconstruireDatesHeaders(data, indYear); // (C3b) helper unifié
      const result = {};
      for (let r = 3; r < data.length; r++) {
        const id = String(data[r][0]).trim();
        if (!id) continue;
        result[id] = {};
        dates.forEach((date, i) => {
          if (!date) return;
          const val = String(data[r][i+1]||'').trim();
          if (val) result[id][date] = val;
        });
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true, data: result, year: indYear
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'applyModification') {
      if (user.role !== 'admin') return _deny();
      return ContentService.createTextOutput(JSON.stringify({
        success: applyModification(payload.modification)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getStats') {
  if (user.role !== 'admin') return _deny();
  const statsYear = Number(payload.year) || TEST_YEAR;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`STATS_GARDES_${statsYear}`);
  if (!sheet) return _error(`Onglet STATS_GARDES_${statsYear} introuvable`);
      const data = sheet.getDataRange().getValues();
      const stats = [];
      for (let r = 1; r < data.length; r++) {
        if (!data[r][0]) continue;
        stats.push({medecin:data[r][0], cible:data[r][1], total:data[r][2],
          g:data[r][3], g2:data[r][4], lun:data[r][5], mar:data[r][6], mer:data[r][7],
          jeu:data[r][8], ven:data[r][9], sat:data[r][10], dim:data[r][11],
          recupR:data[r][12], h18:data[r][13],
          jf:data[r][14], vjf:data[r][15], vd:data[r][20], cSat:data[r][17], cJeu:data[r][18], cVd:data[r][19], cVjf:data[r][21]});
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, stats}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'generateGardes') {
  if (user.role !== 'admin') return _deny();
  logAction('DEBUG generateGardes: payload.year=' + payload.year + ' TEST_YEAR=' + TEST_YEAR);
  const yearToGenerate = Number(payload.year) || TEST_YEAR;
  logAction('DEBUG yearToGenerate=' + yearToGenerate);
  if (yearToGenerate === 2026) return _error('Génération désactivée — GARDES_2026 est sanctuarisé');
if (yearToGenerate === 2026) return _error('Génération désactivée — GARDES_2026 est sanctuarisé');
try {
  generateGardes(yearToGenerate);
  generatePlanning(yearToGenerate);
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(`STATS_GARDES_${yearToGenerate}`);
        const data = sheet.getDataRange().getValues();
        const stats = [];
        for (let r = 1; r < data.length; r++) {
          if (!data[r][0]) continue;
          stats.push({medecin:data[r][0], cible:data[r][1], total:data[r][2],
            g:data[r][3], g2:data[r][4], lun:data[r][5], mar:data[r][6], mer:data[r][7],
            jeu:data[r][8], ven:data[r][9], sat:data[r][10], dim:data[r][11],
            recupR:data[r][12], h18:data[r][13],
            jf:data[r][14], vjf:data[r][15], vd:data[r][20], cSat:data[r][17], cJeu:data[r][18], cVd:data[r][19], cVjf:data[r][21]});
        }
        return ContentService.createTextOutput(JSON.stringify({success:true, stats}))
          .setMimeType(ContentService.MimeType.JSON);
      } catch(err) { return _error(err.message); }
    }
    if (action === 'getGardes') {
      if (user.role !== 'admin') return _deny();
      const gYear = Number(payload.year) || TEST_YEAR;              // (C3) année paramétrable
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(`GARDES_${gYear}`);
      if (!sheet) return _error(`Onglet GARDES_${gYear} introuvable`);
      const data = sheet.getDataRange().getValues();
      const dateToCol = buildDateToCol(data, gYear);                // (C3) ancré 1er lundi → fin du décalage + queue janvier N+1
      const result = {};
      for (let r = 3; r < data.length; r++) {
        const id = String(data[r][0]).trim();
        if (!id) continue;
        Object.keys(dateToCol).forEach(date => {
          const val = String(data[r][dateToCol[date]] || '').trim();
          if (!val) return;
          if (!result[date]) result[date] = {};
          result[date][id] = val;
        });
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, data:result, year:gYear}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getJoursFeries') {
      if (user.role !== 'admin') return _deny();
      const fYear = Number(payload.year) || TEST_YEAR;
      const jf = [...getJoursFeries(fYear), ...getJoursFeries(fYear + 1)];
      return ContentService.createTextOutput(JSON.stringify({success:true, joursFeries: jf, year: fYear}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getVacConfig') {
      const indYear = getIndisposYear();
      const cfg = getVacConfig(user.id, indYear);
      const jf = getJoursFeries(indYear);
      const jfNext = getJoursFeries(indYear + 1);
      const _f = getMedecinFlags();
      const tpFixe = _f.rythme2sur2.has(user.id) || !!_f.tpJoursFixes[user.id];
      return ContentService.createTextOutput(JSON.stringify({
        success: true, periodes: cfg.periodes, quotaVac: cfg.quotaVac,
        quotaForm: cfg.quotaForm, quotaCtp: cfg.quotaCtp, tpFixe: tpFixe,
        totalVacDoc: cfg.totalVacDoc, joursFeries: [...jf, ...jfNext],
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'setActiveYear') {
      if (user.role !== 'admin') return _deny();
      const newYear = Number(payload.year);
      if (!newYear || newYear < 2026) return _error('Année invalide');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      // (Onglet OVERRIDES retiré : registre inutilisé, jamais alimenté, non branché au planning.)
      const configSheet = ss.getSheetByName('CONFIG');
      const configData = configSheet.getDataRange().getValues();
      for (let r = 1; r < configData.length; r++) {
        if (String(configData[r][0]).trim() === 'ANNEE_ACTIVE') {
          configSheet.getRange(r + 1, 2).setValue(newYear); break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, year:newYear}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'initYear') {
      if (user.role !== 'admin') return _deny();
      const newYear = Number(payload.year);
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let indSheet = ss.getSheetByName(`INDISPOS_${newYear}`);
      if (indSheet) return _error(`INDISPOS_${newYear} existe déjà`);
      // ── Effectif = onglet MEDECINS (actifs), source unique (plus de MEDECINS_LIST en dur) ──
      const medSheetSrc = ss.getSheetByName('MEDECINS');
      const actifsIds = [];
      if (medSheetSrc) {
        const medSrcData = medSheetSrc.getDataRange().getValues();
        for (let r = 1; r < medSrcData.length; r++) {
          const id = String(medSrcData[r][0]).trim();
          const actif = String(medSrcData[r][3]).trim().toUpperCase() === 'O';
          if (id && actif) actifsIds.push(id);
        }
      }
      if (!actifsIds.length) return _error('Aucun MAR actif dans MEDECINS — vérifiez la colonne ACTIF (O/N)');
      indSheet = ss.insertSheet(`INDISPOS_${newYear}`);

      const jan1 = new Date(newYear, 0, 1);
      const dow1 = jan1.getDay();
      const offset = dow1 === 1 ? 7 : dow1 === 0 ? 1 : 8 - dow1;
      const startDate = new Date(newYear, 0, 1 + offset);
      const jan1Next = new Date(newYear + 1, 0, 1);
      const dow1Next = jan1Next.getDay();
      const offsetNext = dow1Next === 1 ? 7 : dow1Next === 0 ? 1 : 8 - dow1Next;
      const endDate = new Date(newYear + 1, 0, offsetNext);
      const days = [];
      const dLoop = new Date(startDate);
      while (dLoop <= endDate) { days.push(new Date(dLoop)); dLoop.setDate(dLoop.getDate() + 1); }

      const ROUGE = '#C0392B', GRIS_WE = '#CFD8DC', BLANC = '#FFFFFF';
      const JOURS_ABR = ['D','L','M','M','J','V','S'];
      const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                       'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      const nCols = days.length + 1;
      indSheet.setFrozenRows(3);

      const row1 = ['MÉDECIN']; days.forEach(() => row1.push(''));
      indSheet.getRange(1, 1, 1, nCols).setValues([row1]);
      indSheet.getRange(1, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor(BLANC);

      let mStart = 2, prevMonth = days[0].getMonth();
      days.forEach((day, i) => {
        const col = i + 2, isLast = i === days.length - 1;
        if (day.getMonth() !== prevMonth || isLast) {
          const mEnd = day.getMonth() !== prevMonth ? col - 1 : col;
          if (mEnd > mStart) indSheet.getRange(1, mStart, 1, mEnd - mStart + 1).merge();
          indSheet.getRange(1, mStart).setValue(MOIS_FR[prevMonth])
            .setBackground(ROUGE).setFontColor(BLANC).setFontWeight('bold').setHorizontalAlignment('center');
          mStart = col; prevMonth = day.getMonth();
        }
      });

      const row2 = ['JOUR']; days.forEach(d => row2.push(JOURS_ABR[d.getDay()]));
      indSheet.getRange(2, 1, 1, nCols).setValues([row2]);
      indSheet.getRange(2, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor(BLANC);

      const row3 = ['N°']; days.forEach(d => row3.push(d.getDate()));
      indSheet.getRange(3, 1, 1, nCols).setValues([row3]);
      indSheet.getRange(3, 1).setFontWeight('bold').setBackground(ROUGE).setFontColor(BLANC);

      const medRows = actifsIds.map(id => [id, ...Array(days.length).fill('')]);
      indSheet.getRange(4, 1, medRows.length, nCols).setValues(medRows);

      // ── Report des absences longues (CL) chevauchant cette année (registre ABSENCES_LONGUES) ──
      try {
        const absSheet = ss.getSheetByName('ABSENCES_LONGUES');
        if (absSheet && days.length) {
          const adata = absSheet.getDataRange().getValues();
          const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          const planStart = fmt(days[0]), planEnd = fmt(days[days.length - 1]);
          const rowOf = {}; actifsIds.forEach((id, i) => { rowOf[String(id).trim().toUpperCase()] = 4 + i; });
          for (let r = 1; r < adata.length; r++) {
            const id = String(adata[r][0]).trim().toUpperCase();
            const a  = _isoDate(adata[r][1]), b = _isoDate(adata[r][2]);
            if (!id || !a || !b || !(id in rowOf)) continue;
            if (b < planStart || a > planEnd) continue;     // ne chevauche pas l'année planning
            days.forEach((day, i) => { const ds = fmt(day); if (ds >= a && ds <= b) indSheet.getRange(rowOf[id], i + 2).setValue('CL'); });
          }
        }
      } catch(e) {}

      const jfY = getJoursFeries(newYear);
      const jfYn = getJoursFeries(newYear + 1);
      days.forEach((day, i) => {
        const col = i + 2, isWE = day.getDay() === 0 || day.getDay() === 6;
        const ds = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
        const isFerie = jfY.has(ds) || jfYn.has(ds);
        if (isWE || isFerie) indSheet.getRange(1, col, 3 + medRows.length, 1).setBackground(GRIS_WE);
        const nextDay = days[i + 1];
        if (!nextDay || nextDay.getMonth() !== day.getMonth()) {
          indSheet.getRange(1, col, 3 + medRows.length, 1)
            .setBorder(null, null, null, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
        }
      });
      indSheet.setColumnWidth(1, 120);
      for (let c = 2; c <= nCols; c++) indSheet.setColumnWidth(c, 35);
      indSheet.getRange(1, 2, 3 + medRows.length, nCols - 1).setHorizontalAlignment('center');
// ── Créer AFFECTATIONS_newYear si inexistant ──────────────────────
const affName = `AFFECTATIONS_${newYear}`;
let affSheet = ss.getSheetByName(affName);
if (!affSheet) {
  affSheet = ss.insertSheet(affName);
  const RED = '#C0392B', WHITE = '#FFFFFF';
  const MONTHS_SHORT = ['JAN','FEV','MARS','AVRIL','MAI','JUIN',
                        'JUILLET','AOUT','SEPT','OCT','NOV','DEC'];
  const affHeaders = ['MÉDECIN', ...MONTHS_SHORT.map(m => `${m} ${newYear}`)];
  affSheet.getRange(1, 1, 1, affHeaders.length).setValues([affHeaders]);
  affSheet.getRange(1, 1, 1, affHeaders.length)
    .setFontWeight('bold').setBackground(RED).setFontColor(WHITE).setHorizontalAlignment('center');
  affSheet.setColumnWidth(1, 140);
  for (let c = 2; c <= affHeaders.length; c++) affSheet.setColumnWidth(c, 90);
  affSheet.setFrozenRows(1);
  affSheet.setFrozenColumns(1);

  // Lire les MARs actifs depuis MEDECINS
  const medSheet2 = ss.getSheetByName('MEDECINS');
  const affRows = [];
  if (medSheet2) {
    const medData2 = medSheet2.getDataRange().getValues();
    for (let r = 1; r < medData2.length; r++) {
      const id = String(medData2[r][0]).trim();
      const actif = String(medData2[r][3]).trim().toUpperCase() === 'O';
      if (id && actif) affRows.push([id, ...Array(12).fill('VOLANT')]);
    }
  }
  if (affRows.length > 0) {
    affSheet.getRange(2, 1, affRows.length, affHeaders.length).setValues(affRows);
    affSheet.getRange(2, 2, affRows.length, 12)
      .setFontColor('#64748B').setHorizontalAlignment('center');
  }
  Logger.log(`✅ ${affName} créé (${affRows.length} MARs)`);
}
      return ContentService.createTextOutput(JSON.stringify({
        success: true, message: `INDISPOS_${newYear} créé avec ${days.length} jours`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'publishPlanning') {
      if (user.role !== 'admin') return _deny();
      try {
        generatePlanning(Number(payload.year) || TEST_YEAR);
        return ContentService.createTextOutput(JSON.stringify({
          success: true, message: `Planning ${TEST_YEAR} publié`
        })).setMimeType(ContentService.MimeType.JSON);
      } catch(err) { return _error(err.message); }
    }

    if (action === 'getVacValidation') {
      if (user.role !== 'admin') return _deny();
      return ContentService.createTextOutput(JSON.stringify({
        success: true, data: getVacValidation(getIndisposYear())
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getOverrides') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('OVERRIDES');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({
        success:true, overrides:[], total:0, passed:0, upcoming:0
      })).setMimeType(ContentService.MimeType.JSON);
      const data = sheet.getDataRange().getValues();
      const today = new Date(); today.setHours(0,0,0,0);
      const overrides = [];
      for (let r = 1; r < data.length; r++) {
        const raw = data[r][0];
        if (!raw) continue;
        let dateStr = raw instanceof Date
          ? `${raw.getFullYear()}-${String(raw.getMonth()+1).padStart(2,'00')}-${String(raw.getDate()).padStart(2,'00')}`
          : String(raw).trim();
        if (!dateStr) continue;
        const isFuture = new Date(dateStr + 'T00:00:00') >= today;
        overrides.push({rowIndex:r+1, date:dateStr,
          doctorId:String(data[r][1]||'').trim().toUpperCase(),
          morning:String(data[r][2]||'').trim().toUpperCase(),
          afternoon:String(data[r][3]||'').trim().toUpperCase(),
          comment:String(data[r][4]||'').trim(), isFuture});
      }
      return ContentService.createTextOutput(JSON.stringify({
        success:true, overrides,
        total:overrides.length,
        passed:overrides.filter(o=>!o.isFuture).length,
        upcoming:overrides.filter(o=>o.isFuture).length,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'deleteOverride') {
      if (user.role !== 'admin') return _deny();
      const rowIndex = Number(payload.rowIndex);
      if (!rowIndex || rowIndex < 2) return _error('Index invalide');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('OVERRIDES');
      if (!sheet) return _error('Onglet OVERRIDES introuvable');
      sheet.deleteRow(rowIndex);
      generatePlanning();
      return ContentService.createTextOutput(JSON.stringify({success:true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getMedecins') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('MEDECINS');
      if (!sheet) return _error('Onglet MEDECINS introuvable');
      const data = sheet.getDataRange().getValues();
      const isO = v => String(v).trim().toUpperCase() === 'O';
      const toDate = v => {
        if (!v) return '';
        if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        return String(v).trim();
      };
      const medecins = [];
      for (let r = 1; r < data.length; r++) {
        if (!data[r][0]) continue;
        medecins.push({id:String(data[r][0]).trim(), nom:String(data[r][1]).trim(),
          initiales:String(data[r][2]).trim(), actif:isO(data[r][3]),
          quotite:Number(data[r][4])||100, pctGardes:Number(data[r][5])||100,
          codeAcces:String(data[r][6]).trim(), email:String(data[r][7]).trim(), dect:String(data[r][8]).trim(),
          dateDebut:toDate(data[r][9]), dateFin:toDate(data[r][10]),
          noGarde:isO(data[r][11]), only18:isO(data[r][12]), noWeekend:isO(data[r][13]),
          rythme2sur2:isO(data[r][14]), souhaitPlafond:isO(data[r][15]),
          tpJoursFixes:String(data[r][16]||'').trim().toUpperCase()});
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, medecins}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveMedecin') {
      if (user.role !== 'admin') return _deny();
      const m = payload.medecin;
      if (!m || !m.id) return _error('Données invalides');
      const id = String(m.id).toUpperCase().trim();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('MEDECINS');
      const data = sheet.getDataRange().getValues();

      // ligne existante ? sinon valeurs par défaut
      let rowIdx = -1, ex = [];
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]).trim().toUpperCase() === id) { rowIdx = r; ex = data[r]; break; }
      }
      // fusion : valeur du formulaire si fournie, sinon on garde l'existant
      const old = i => (ex[i] !== undefined && ex[i] !== null) ? ex[i] : '';
      const str = (k, i) => (m[k] !== undefined && m[k] !== null) ? String(m[k]).trim() : old(i);
      const num = (k, i, d) => (m[k] !== undefined && m[k] !== null && m[k] !== '') ? (Number(m[k]) || d) : (old(i) !== '' ? old(i) : d);
      const yn  = (k, i) => (m[k] !== undefined) ? (m[k] ? 'O' : 'N') : (String(old(i)).trim().toUpperCase() === 'O' ? 'O' : 'N');

      const row = [
        id,                        // A id
        str('nom', 1),             // B nom
        str('initiales', 2),       // C initiales
        yn('actif', 3),            // D actif
        num('quotite', 4, 100),    // E quotité
        num('pctGardes', 5, 100),  // F % gardes
        str('codeAcces', 6),       // G code
        str('email', 7),           // H email
        str('dect', 8),            // I dect
        str('dateDebut', 9),       // J date_debut
        str('dateFin', 10),        // K date_fin
        yn('noGarde', 11),         // L no_garde
        yn('only18', 12),          // M only_18
        yn('noWeekend', 13),       // N no_weekend
        yn('rythme2sur2', 14),     // O rythme_2sur2
        yn('souhaitPlafond', 15),  // P souhait_plafond
        (m.tpJoursFixes !== undefined) ? String(m.tpJoursFixes).trim().toUpperCase() : String(old(16)).trim().toUpperCase()  // Q tp_jours_fixes
      ];
      if (rowIdx >= 0) sheet.getRange(rowIdx + 1, 1, 1, row.length).setValues([row]);
      else             sheet.appendRow(row);

      _medFlagsCache = null;  // invalider le cache des particularités
      return ContentService.createTextOutput(JSON.stringify({success:true, created: rowIdx < 0}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getAffectations') {
  if (user.role !== 'admin') return _deny();
  const affYear = Number(payload.year) || TEST_YEAR;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`AFFECTATIONS_${affYear}`);
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({success:true, affectations:{}}))
        .setMimeType(ContentService.MimeType.JSON);
      const data = sheet.getDataRange().getValues();
      const affectations = {};
      for (let r = 1; r < data.length; r++) {
        const id = String(data[r][0]).trim();
        if (!id) continue;
        affectations[id] = {};
        for (let m = 1; m <= 12; m++) {
          const val = String(data[r][m]||'').trim();
          if (val) affectations[id][m] = val;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, affectations}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveAffectations') {
  if (user.role !== 'admin') return _deny();
  const aff = payload.affectations;
  if (!aff) return _error('Données manquantes');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const affYear = Number(payload.year) || TEST_YEAR;
  const sheetName = `AFFECTATIONS_${affYear}`;
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return _error(`Onglet ${sheetName} introuvable`);
  const data = sheet.getDataRange().getValues();
  const idToRow = {};
  for (let r = 1; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (id) idToRow[id] = r + 1;
  }
  Object.keys(aff).forEach(doctorId => {
    const rowNum = idToRow[doctorId];
    if (!rowNum) return;
    const vals = [];
    for (let m = 1; m <= 12; m++) vals.push(aff[doctorId][m] || 'VOLANT');
    sheet.getRange(rowNum, 2, 1, 12).setValues([vals]);
  });
  logAction(`saveAffectations — ${Object.keys(aff).length} MAR(s) mis à jour`);
  
  // ← AJOUT : republier le planning après chaque modification d'affectation
  try { generatePlanning(affYear); } catch(e) { Logger.log('generatePlanning error: ' + e.message); }

  return ContentService.createTextOutput(JSON.stringify({success:true}))
    .setMimeType(ContentService.MimeType.JSON);
}

    if (action === 'getVacancesConfig') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const perSheet = ss.getSheetByName('PERIODES_VAC');
      let periodes = [];
      if (perSheet) {
        const perData = perSheet.getDataRange().getValues();
        for (let r = 1; r < perData.length; r++) {
          const nom = String(perData[r][0]).trim();
          if (!nom) continue;
          const debutRaw = perData[r][1], finRaw = perData[r][2];
          const debut = debutRaw instanceof Date
            ? `${debutRaw.getFullYear()}-${String(debutRaw.getMonth()+1).padStart(2,'00')}-${String(debutRaw.getDate()).padStart(2,'00')}`
            : String(debutRaw).trim();
          const fin = finRaw instanceof Date
            ? `${finRaw.getFullYear()}-${String(finRaw.getMonth()+1).padStart(2,'00')}-${String(finRaw.getDate()).padStart(2,'00')}`
            : String(finRaw).trim();
          periodes.push({nom, debut, fin, seuil:Number(perData[r][3])||8});
        }
      }
      // Année visée (wizard) : ne garder que ses périodes ; si aucune, proposer (API Nice + filet)
      const wizYear = Number(payload.year) || 0;
      if (wizYear) {
        const pourAnnee = periodes.filter(function(p){ return String(p.debut).startsWith(String(wizYear)); });
        periodes = pourAnnee.length ? pourAnnee : proposerVacances(wizYear);
      }
      const groupSheet = ss.getSheetByName('GROUPES_VAC');
      const groupes = {A:[],B:[],C:[]};
      if (groupSheet) {
        const groupData = groupSheet.getDataRange().getValues();
        const tempGroups = {A:[],B:[],C:[]};
        for (let r = 1; r < groupData.length; r++) {
          const grp = String(groupData[r][0]).trim(), id = String(groupData[r][1]).trim();
          const ord = Number(groupData[r][2])||0;
          if (!id||!tempGroups[grp]) continue;
          tempGroups[grp].push({id, ordre:ord});
        }
        ['A','B','C'].forEach(g => {
          groupes[g] = tempGroups[g].sort((a,b)=>a.ordre-b.ordre).map(m=>({id:m.id}));
        });
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, periodes, groupes}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'savePeriodes') {
      if (user.role !== 'admin') return _deny();
      const periodes = payload.periodes;
      if (!Array.isArray(periodes)) return _error('Données invalides');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName('PERIODES_VAC');
      if (!sheet) {
        sheet = ss.insertSheet('PERIODES_VAC');
        sheet.getRange(1,1,1,4).setValues([['NOM','DEBUT','FIN','SEUIL']]);
        sheet.getRange(1,1,1,4).setFontWeight('bold');
      }
      if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
      if (periodes.length > 0) {
        const rows = periodes.map(p => [p.nom, p.debut, p.fin, Number(p.seuil)||8]);
        sheet.getRange(2, 1, rows.length, 4).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({success:true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveGroupes') {
      if (user.role !== 'admin') return _deny();
      const groupes = payload.groupes;
      if (!groupes) return _error('Données invalides');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName('GROUPES_VAC');
      if (!sheet) {
        sheet = ss.insertSheet('GROUPES_VAC');
        sheet.getRange(1,1,1,3).setValues([['GROUPE','MEDECIN_ID','ORDRE']]);
        sheet.getRange(1,1,1,3).setFontWeight('bold');
      }
      if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
      const rows = [];
      ['A','B','C'].forEach(grp => {
        (groupes[grp]||[]).forEach((mar, idx) => rows.push([grp, mar.id, idx+1]));
      });
      if (rows.length > 0) sheet.getRange(2, 1, rows.length, 3).setValues(rows);
      return ContentService.createTextOutput(JSON.stringify({success:true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getConfig') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CONFIG');
      if (!sheet) return _error('Onglet CONFIG introuvable');
      const data = sheet.getDataRange().getValues();
      const config = [];
      for (let r = 1; r < data.length; r++) {
        const key = String(data[r][0]).trim();
        if (key) config.push({key, value:String(data[r][1]).trim()});
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, config}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'saveConfig') {
      if (user.role !== 'admin') return _deny();
      const key = String(payload.key||'').trim();
      const value = String(payload.value||'').trim();
      if (!key) return _error('Clé manquante');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CONFIG');
      if (!sheet) return _error('Onglet CONFIG introuvable');
      const data = sheet.getDataRange().getValues();
      let found = false;
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]).trim() === key) {
          sheet.getRange(r+1, 2).setValue(value); found = true; break;
        }
      }
      if (!found) sheet.appendRow([key, value]);
      return ContentService.createTextOutput(JSON.stringify({success:true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'getLogs') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('LOGS');
      if (!sheet || sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify({
        success:true, logs:['Aucun log disponible.']
      })).setMimeType(ContentService.MimeType.JSON);
      const data = sheet.getDataRange().getValues();
      const logs = [];
      const start = Math.max(1, data.length - 50);
      for (let r = data.length - 1; r >= start; r--) {
        const ts = data[r][0];
        const msg = data[r][1]!==undefined ? String(data[r][1]).trim() : String(data[r][0]).trim();
        if (!msg) continue;
        const tsStr = ts instanceof Date ? `[${ts.toLocaleString('fr-FR')}] ` : '';
        logs.push(tsStr + msg);
      }
      return ContentService.createTextOutput(JSON.stringify({success:true, logs}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'sendCodes') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const medSheet = ss.getSheetByName('MEDECINS');
      if (!medSheet) return _error('Onglet MEDECINS introuvable');
      const data = medSheet.getDataRange().getValues();
      let sent = 0;
      const errors = [];
      for (let r = 1; r < data.length; r++) {
        const id = String(data[r][0]).trim(), nom = String(data[r][1]).trim();
        const actif = String(data[r][3]).trim().toUpperCase() === 'O';
        const code = String(data[r][6]).trim(), email = String(data[r][7]).trim();
        if (!id || !actif || !email || !code) continue;
        try {
          MailApp.sendEmail({to:email,
            subject:`[Planning CHPG Monaco ${TEST_YEAR}] Votre code d'accès`,
            body:`Bonjour ${nom},\n\nVoici votre code d'accès personnel pour le planning ${TEST_YEAR} :\n\n    ${code}\n\nCe code vous permettra de saisir vos indisponibilités et congés sur :\nhttps://chpg-anesthesie.github.io/Planning-CHPG/indispos.html\n\nConservez ce code confidentiel.\n\nBonne journée,\nLe Comité Planning CHPG Monaco`});
          sent++;
        } catch(err) { errors.push(`${nom} (${email}) : ${err.message}`); }
      }
      logAction(`sendCodes — ${sent} emails envoyés${errors.length?', '+errors.length+' erreur(s)':''}`);
      return ContentService.createTextOutput(JSON.stringify({success:true, sent, errors}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'diagComplet') {
      if (user.role !== 'admin') return _deny();
      const results = [];
      let ok = true;
      function check(label, condition, warn) {
        if (condition) results.push(`✅ ${label}`);
        else if (warn) results.push(`⚠️ ${label}`);
        else { results.push(`❌ ${label}`); ok = false; }
      }
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      results.push('── Onglets requis ──────────────────');
      ['CONFIG','MEDECINS','PERIODES_VAC','GROUPES_VAC','OVERRIDES',
       `INDISPOS_${TEST_YEAR}`,`GARDES_${TEST_YEAR}`,
       `STATS_GARDES_${TEST_YEAR}`,`AFFECTATIONS_${TEST_YEAR}`].forEach(name => {
        check(`Onglet ${name}`, !!ss.getSheetByName(name));
      });
      results.push('── CONFIG ──────────────────────────');
      const configSheet = ss.getSheetByName('CONFIG');
      if (configSheet) {
        const cfgData = configSheet.getDataRange().getValues();
        const cfgMap = {};
        for (let r = 1; r < cfgData.length; r++) cfgMap[String(cfgData[r][0]).trim()] = String(cfgData[r][1]).trim();
        check('ANNEE_ACTIVE présente', !!cfgMap['ANNEE_ACTIVE']);
        check(`ANNEE_ACTIVE = ${TEST_YEAR}`, String(cfgMap['ANNEE_ACTIVE'])===String(TEST_YEAR));
        check('ADMIN_CODE présent', !!cfgMap['ADMIN_CODE']);
        check('GITHUB_TOKEN présent', !!cfgMap['GITHUB_TOKEN'], true);
        check('GITHUB_REPO présent', !!cfgMap['GITHUB_REPO']||!!cfgMap['GITHUB_REPO_INDISPOS'], true);
      }
      results.push('── Équipe ──────────────────────────');
      const medSheet = ss.getSheetByName('MEDECINS');
      if (medSheet) {
        const medData = medSheet.getDataRange().getValues();
        const actifs = [], sansEmail = [], sansCode = [];
        for (let r = 1; r < medData.length; r++) {
          const id = String(medData[r][0]).trim();
          const actif = String(medData[r][3]).trim().toUpperCase() === 'O';
          const code = String(medData[r][6]).trim(), email = String(medData[r][7]).trim();
          if (!id) continue;
          if (actif) {
            actifs.push(id);
            if (!email) sansEmail.push(id);
            if (!code) sansCode.push(id);
          }
        }
        check(`${actifs.length} MARs actifs`, actifs.length > 0);
        check(`MARs sans email : ${sansEmail.length||'aucun'}`, sansEmail.length===0, true);
        check(`MARs sans code d'accès : ${sansCode.length||'aucun'}`, sansCode.length===0, true);
        results.push('── Affectations ────────────────────');
        const affSheet = ss.getSheetByName(`AFFECTATIONS_${TEST_YEAR}`);
        if (affSheet) {
          const affData = affSheet.getDataRange().getValues();
          const affIds = new Set();
          for (let r = 1; r < affData.length; r++) { const id = String(affData[r][0]).trim(); if (id) affIds.add(id); }
          const sansAff = actifs.filter(id => !affIds.has(id));
          check(`MARs actifs sans affectation : ${sansAff.length||'aucun'}`, sansAff.length===0, true);
          if (sansAff.length) results.push(`  → ${sansAff.join(', ')}`);
        } else { results.push(`⚠️ Onglet AFFECTATIONS_${TEST_YEAR} absent`); }
      }
      results.push('── Overrides ───────────────────────');
      const ovSheet = ss.getSheetByName('OVERRIDES');
      if (ovSheet && ovSheet.getLastRow() > 1) {
        const ovData = ovSheet.getDataRange().getValues();
        const seen = new Set(), doublons = [];
        for (let r = 1; r < ovData.length; r++) {
          const key = `${ovData[r][0]}_${ovData[r][1]}`;
          if (seen.has(key)) doublons.push(key); seen.add(key);
        }
        const total = ovData.length - 1;
        const today = new Date(); today.setHours(0,0,0,0);
        const futures = ovData.slice(1).filter(row => {
          const raw = row[0];
          return (raw instanceof Date ? raw : new Date(String(raw)+'T00:00:00')) >= today;
        }).length;
        results.push(`ℹ️ ${total} override(s) au total, ${futures} à venir`);
        check(`Doublons dans OVERRIDES : ${doublons.length||'aucun'}`, doublons.length===0, true);
      } else { results.push('ℹ️ Aucun override enregistré'); }
      results.push('── Vacances ────────────────────────');
      const perSheet = ss.getSheetByName('PERIODES_VAC');
      if (perSheet) {
        const nbPer = perSheet.getDataRange().getValues().length - 1;
        check(`${nbPer} période(s) configurée(s)`, nbPer > 0);
      }
      const grpSheet = ss.getSheetByName('GROUPES_VAC');
      if (grpSheet) {
        const grpData = grpSheet.getDataRange().getValues();
        const counts = {A:0,B:0,C:0};
        for (let r = 1; r < grpData.length; r++) {
          const g = String(grpData[r][0]).trim();
          if (counts[g]!==undefined) counts[g]++;
        }
        check(`Groupes A/B/C peuplés (${counts.A}/${counts.B}/${counts.C})`,
          counts.A>0&&counts.B>0&&counts.C>0);
      }
      results.push('── Gardes ──────────────────────────');
      const gardesSheet = ss.getSheetByName(`GARDES_${TEST_YEAR}`);
      check(`Onglet GARDES_${TEST_YEAR} avec données`, gardesSheet&&gardesSheet.getLastRow()>3);
      const statsSheet = ss.getSheetByName(`STATS_GARDES_${TEST_YEAR}`);
      check(`Onglet STATS_GARDES_${TEST_YEAR} avec données`, statsSheet&&statsSheet.getLastRow()>1);
      results.push('────────────────────────────────────');
      results.push(ok ? '✅ Diagnostic OK' : '❌ Erreurs détectées');
      logAction(`diagComplet — ${ok?'OK':'ERREURS'} (${results.filter(l=>l.startsWith('❌')).length} erreur(s))`);
      return ContentService.createTextOutput(JSON.stringify({success:true, ok, results}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'archiveYear') {
      if (user.role !== 'admin') return _deny();
      const yearToArchive = Number(payload.year);
      if (!yearToArchive || yearToArchive < 2026) return _error('Année invalide');
      // ── Garde-fou : l'année SUIVANTE doit être prête (W1+W2) avant de clôturer ──
      const _ssArch = SpreadsheetApp.getActiveSpreadsheet();
      const _next = yearToArchive + 1;
      if (!_ssArch.getSheetByName(`INDISPOS_${_next}`))
        return _error(`Année ${_next} non préparée : lancez d'abord « Démarrer l'année » (étape 1) avant de clôturer ${yearToArchive}.`);
      if (!_ssArch.getSheetByName(`STATS_GARDES_${_next}`))
        return _error(`Gardes ${_next} non générées : lancez d'abord la génération des gardes (étape 2) avant de clôturer ${yearToArchive}.`);
      try {
        const rapport = archiveYear(yearToArchive);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: rapport || `Archivage ${yearToArchive} terminé`
        })).setMimeType(ContentService.MimeType.JSON);
      } catch(err) {
        return _error(err.message);
      }
    }
    if (action === 'saveAffectationsMar') {
  if (user.role !== 'admin') return _deny();
  const medecinId = String(payload.medecin || '').trim().toUpperCase();
  const aff = payload.affectations;
  if (!medecinId || !aff) return _error('Données manquantes');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(`AFFECTATIONS_${TEST_YEAR}`);
  if (!sheet) return _error(`Onglet AFFECTATIONS_${TEST_YEAR} introuvable`);
  const data = sheet.getDataRange().getValues();
  const vals = [];
  for (let m = 1; m <= 12; m++) vals.push(aff[m] || 'VOLANT');
  let found = false;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim().toUpperCase() === medecinId) {
      sheet.getRange(r + 1, 2, 1, 12).setValues([vals]);
      found = true; break;
    }
  }
  if (!found) {
    sheet.appendRow([medecinId, ...vals]);
  }
  logAction(`saveAffectationsMar — ${medecinId} mis à jour`);
  return ContentService.createTextOutput(JSON.stringify({success: true, created: !found}))
    .setMimeType(ContentService.MimeType.JSON);
}
if (action === 'addMedecinToGroupe') {
  if (user.role !== 'admin') return _deny();
  const medecinId = String(payload.medecin || '').trim().toUpperCase();
  const groupe = String(payload.groupe || '').trim().toUpperCase();
  if (!medecinId || !['A','B','C'].includes(groupe)) return _error('Données invalides');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('GROUPES_VAC');
  if (!sheet) {
    sheet = ss.insertSheet('GROUPES_VAC');
    sheet.getRange(1,1,1,3).setValues([['GROUPE','MEDECIN_ID','ORDRE']]);
    sheet.getRange(1,1,1,3).setFontWeight('bold');
  }
  const data = sheet.getDataRange().getValues();
  // Vérifier si le MAR est déjà dans un groupe
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][1]).trim().toUpperCase() === medecinId) {
      sheet.getRange(r + 1, 1).setValue(groupe);
      logAction(`addMedecinToGroupe — ${medecinId} déplacé vers groupe ${groupe}`);
      return ContentService.createTextOutput(JSON.stringify({success: true, moved: true}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  // Calculer l'ordre max dans ce groupe
  let maxOrdre = 0;
  for (let r = 1; r < data.length; r++) {
    if (String(data[r][0]).trim().toUpperCase() === groupe) {
      maxOrdre = Math.max(maxOrdre, Number(data[r][2]) || 0);
    }
  }
  sheet.appendRow([groupe, medecinId, maxOrdre + 1]);
  logAction(`addMedecinToGroupe — ${medecinId} ajouté au groupe ${groupe}`);
  return ContentService.createTextOutput(JSON.stringify({success: true, created: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
if (action === 'sendCodesMar') {
  if (user.role !== 'admin') return _deny();
  const medecinId = String(payload.medecin || '').trim().toUpperCase();
  if (!medecinId) return _error('Médecin manquant');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const medSheet = ss.getSheetByName('MEDECINS');
  if (!medSheet) return _error('Onglet MEDECINS introuvable');
  const data = medSheet.getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (id.toUpperCase() !== medecinId) continue;
    const nom = String(data[r][1]).trim();
    const code = String(data[r][6]).trim();
    const email = String(data[r][7]).trim();
    if (!email) return _error(`Pas d'email pour ${nom}`);
    if (!code) return _error(`Pas de code pour ${nom}`);
    try {
      MailApp.sendEmail({to: email,
        subject: `[Planning CHPG Monaco ${TEST_YEAR}] Votre code d'accès`,
        body: `Bonjour ${nom},\n\nVoici votre code d'accès personnel pour le planning ${TEST_YEAR} :\n\n    ${code}\n\nCe code vous permettra de saisir vos indisponibilités et congés sur :\nhttps://chpg-anesthesie.github.io/Planning-CHPG/indispos.html\n\nConservez ce code confidentiel.\n\nBonne journée,\nLe Comité Planning CHPG Monaco`});
      logAction(`sendCodesMar — email envoyé à ${nom} (${email})`);
      return ContentService.createTextOutput(JSON.stringify({success: true, sent: 1}))
        .setMimeType(ContentService.MimeType.JSON);
    } catch(err) {
      return _error(`Envoi échoué pour ${nom} : ${err.message}`);
    }
  }
  return _error(`Médecin ${medecinId} introuvable`);
}
if (action === 'getConflitsAll') {
      if (user.role !== 'admin') return _deny();
      const year = Number(payload.year) || TEST_YEAR;
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const medSheet = ss.getSheetByName('MEDECINS');
      if (!medSheet) return _error('Onglet MEDECINS introuvable');
      const medData = medSheet.getDataRange().getValues();
      const actifs = [];
      for (let r = 1; r < medData.length; r++) {
        const id = String(medData[r][0]).trim();
        const actif = String(medData[r][3]).trim().toUpperCase() === 'O';
        const email = String(medData[r][7]).trim();
        if (id && actif) actifs.push({id, nom: String(medData[r][1]).trim(), email});
      }
      const conflits = [];
      actifs.forEach(mar => {
        const cfg = getVacConfig(mar.id, year);
        const periodesConflits = [];
        cfg.periodes.forEach(p => {
          if (p.joursBloqués && p.joursBloqués.length > 0) {
            periodesConflits.push({
              periode: p.nom,
              debut: p.debut,
              fin: p.fin,
              joursBloqués: p.joursBloqués,
              joursDisponibles: p.joursDisponibles,
            });
          }
        });
        if (periodesConflits.length > 0) {
          conflits.push({
            id: mar.id,
            nom: mar.nom,
            email: mar.email,
            periodesConflits,
          });
        }
      });
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        conflits,
        total: actifs.length,
        nbConflits: conflits.length,
        nbResolus: actifs.length - conflits.length,
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'notifierConflits') {
      if (user.role !== 'admin') return _deny();
      const year = Number(payload.year) || getIndisposYear();
      const jfY = getJoursFeries(year), jfYn = getJoursFeries(year + 1);  // exempter WE/fériés du seuil
      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // ── Charger toutes les données une seule fois ──
      const medSheet = ss.getSheetByName('MEDECINS');
      if (!medSheet) return _error('Onglet MEDECINS introuvable');
      const medData = medSheet.getDataRange().getValues();

      const perSheet = ss.getSheetByName('PERIODES_VAC');
      if (!perSheet) return _error('PERIODES_VAC introuvable');
      const perData = perSheet.getDataRange().getValues();

      const groupSheet = ss.getSheetByName('GROUPES_VAC');
      if (!groupSheet) return _error('GROUPES_VAC introuvable');
      const groupData = groupSheet.getDataRange().getValues();

      const indSheet = ss.getSheetByName(`INDISPOS_${year}`);
      if (!indSheet) return _error(`INDISPOS_${year} introuvable`);
      const indData = indSheet.getDataRange().getValues();

      // Reconstruire les dates
      const dates = reconstruireDatesHeaders(indData, year); // (C3b) helper unifié

      // Construire vacByDoc
      const vacByDoc = {};
      for (let r = 3; r < indData.length; r++) {
        const id = String(indData[r][0]).trim();
        if (!id) continue;
        vacByDoc[id] = new Set();
        dates.forEach((date, i) => {
          if (!date) return;
          const val = String(indData[r][i+1]||'').trim();
          if (val === 'VAC' || val === 'FORM') vacByDoc[id].add(date);
        });
      }

      // Groupes + ordre
      const groups = {A:[],B:[],C:[]}, ordre2026 = {A:{},B:{},C:{}};
      for (let r = 1; r < groupData.length; r++) {
        const grp = String(groupData[r][0]).trim(), id = String(groupData[r][1]).trim(), ord = Number(groupData[r][2]);
        if (!id || !groups[grp]) continue;
        groups[grp].push(id); ordre2026[grp][id] = ord;
      }
      const offset = year - 2026;
      function getOrd(grp) {
        const sorted = [...groups[grp]].sort((a,b) => ordre2026[grp][a] - ordre2026[grp][b]);
        const sh = offset % sorted.length;
        return [...sorted.slice(sh), ...sorted.slice(0, sh)];
      }
      const ordA = getOrd('A'), ordB = getOrd('B'), ordC = getOrd('C');

      // Périodes
      const ORDRE_BASE = {HIVER:'CAB',PRINTEMPS:'ABC',ETE:'ABC',TOUSSAINT:'BCA',NOEL:'CAB'};
      function normP(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim(); }
      function premierJour(y) { const j = new Date(y,0,1); const d = j.getDay(); const o = d===1?7:d===0?1:8-d; const r = new Date(y,0,1+o); return `${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,'0')}-${String(r.getDate()).padStart(2,'0')}`; }
      const debutAnnee = premierJour(year), finAnnee = premierJour(year+1);

      const periodes = [];
      for (let r = 1; r < perData.length; r++) {
        const nom = String(perData[r][0]).trim();
        if (!nom) continue;
        const dr = perData[r][1], fr = perData[r][2];
        const debut = dr instanceof Date ? `${dr.getFullYear()}-${String(dr.getMonth()+1).padStart(2,'0')}-${String(dr.getDate()).padStart(2,'0')}` : String(dr).trim();
        const fin = fr instanceof Date ? `${fr.getFullYear()}-${String(fr.getMonth()+1).padStart(2,'0')}-${String(fr.getDate()).padStart(2,'0')}` : String(fr).trim();
        if (debut < debutAnnee || debut >= finAnnee) continue;
        const base = ORDRE_BASE[normP(nom)] || 'ABC';
        const ga = base.split(''); const gs = offset % 3;
        const og = [...ga.slice(gs), ...ga.slice(0, gs)];
        const ol = []; og.forEach(g => { if (g==='A') ol.push(...ordA); else if (g==='B') ol.push(...ordB); else ol.push(...ordC); });
        periodes.push({nom, debut, fin, seuil: Number(perData[r][3])||8, orderedList: ol});
      }

      // Calculer conflits par MAR
      const actifs = [];
      for (let r = 1; r < medData.length; r++) {
        const id = String(medData[r][0]).trim();
        if (!id || String(medData[r][3]).trim().toUpperCase() !== 'O') continue;
        actifs.push({id, nom: String(medData[r][1]).trim(), email: String(medData[r][7]).trim(), code: String(medData[r][6]).trim()});
      }

      let sent = 0, skipped = 0;
      const errors = [];

      actifs.forEach(mar => {
        const periodesConflits = [];
        periodes.forEach(p => {
          const joursBloqués = [];
          const joursDisponibles = [];
          const dt = new Date(p.debut + 'T12:00:00');
          const dtFin = new Date(p.fin + 'T12:00:00');
          while (dt <= dtFin) {
            const ds = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
            const _dow = dt.getDay();
            if (_dow === 0 || _dow === 6 || jfY.has(ds) || jfYn.has(ds)) { joursDisponibles.push(ds); dt.setDate(dt.getDate()+1); continue; }
            const marEnVac = p.orderedList.filter(id => vacByDoc[id]?.has(ds));
            const rang = marEnVac.indexOf(mar.id) + 1;
            if (rang > 0 && rang > p.seuil) joursBloqués.push(ds);
            else joursDisponibles.push(ds);
            dt.setDate(dt.getDate() + 1);
          }
          if (joursBloqués.length > 0) periodesConflits.push({periode: p.nom, debut: p.debut, fin: p.fin, joursBloqués, joursDisponibles});
        });
        if (periodesConflits.length === 0) return;
        if (!mar.email) { skipped++; return; }
        let body = `Bonjour ${mar.nom},\n\nCertaines de vos demandes de vacances pour ${year} sont en conflit.\n\n`;
        periodesConflits.forEach(p => {
          body += `── ${p.periode} (${p.debut} → ${p.fin}) ──\n`;
          body += `Jours en conflit : ${p.joursBloqués.join(', ')}\n`;
          if (p.joursDisponibles.length > 0) body += `Jours disponibles : ${p.joursDisponibles.join(', ')}\n`;
          body += '\n';
        });
        body += `Code d'accès : ${mar.code}\nIndispos : https://chpg-anesthesie.github.io/Planning-CHPG/indispos.html\n\nLe Comité Planning CHPG Monaco`;
        try {
          MailApp.sendEmail({to: mar.email, subject: `[Planning CHPG Monaco ${year}] Conflits vacances`, body});
          sent++;
        } catch(err) { errors.push(`${mar.nom} : ${err.message}`); }
      });

      logAction(`notifierConflits ${year} — ${sent} emails, ${skipped} sans email, ${errors.length} erreur(s)`);
      return ContentService.createTextOutput(JSON.stringify({success: true, sent, skipped, errors}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'envoyerRecapIndispos') {
      // (Remplace l'ancien récap indispos) — Récapitulatif des GARDES attribuées (G réa / G2 mat).
      if (user.role !== 'admin') return _deny();
      const year = Number(payload.year) || TEST_YEAR;
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const medSheet = ss.getSheetByName('MEDECINS');
      if (!medSheet) return _error('Onglet MEDECINS introuvable');
      const medData = medSheet.getDataRange().getValues();

      const gardesSheet = ss.getSheetByName(`GARDES_${year}`);
      if (!gardesSheet) return _error(`Onglet GARDES_${year} introuvable`);
      const gData = gardesSheet.getDataRange().getValues();
      const dateToCol = buildDateToCol(gData, year);
      const colToDate = {};
      Object.keys(dateToCol).forEach(d => { colToDate[dateToCol[d]] = d; });

      // Fériés : Set (depuis getJoursFeries déjà déployé) pour savoir QUELS jours, + mapping nom local (mêmes calculs).
      const feriesSet = getJoursFeries(year), feriesSetN = getJoursFeries(year + 1);
      const isF = d => feriesSet.has(d) || feriesSetN.has(d);
      const feriesNamed = (y) => {
        const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
        const h=(19*a+b-d-g+15)%30,ii=Math.floor(c/4),k=c%4,l=(32+2*e+2*ii-h-k)%7,mm=Math.floor((a+11*h+22*l)/451);
        const mo=Math.floor((h+l-7*mm+114)/31), da=((h+l-7*mm+114)%31)+1;
        const paques=new Date(y,mo-1,da,12,0,0);
        const fmt=dt=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        const add=(dt,n)=>{const x=new Date(dt);x.setDate(x.getDate()+n);return fmt(x);};
        const fix=(m2,d2)=>{const dt=new Date(y,m2-1,d2,12,0,0);if(dt.getDay()===0)dt.setDate(dt.getDate()+1);return fmt(dt);};
        const plain=(m2,d2)=>`${y}-${String(m2).padStart(2,'0')}-${String(d2).padStart(2,'0')}`;
        const M={};
        M[fix(1,1)]='Jour de l\'An'; M[plain(1,27)]='Sainte Dévote'; M[fix(5,1)]='Fête du Travail';
        M[fix(8,15)]='Assomption'; M[fix(11,1)]='Toussaint'; M[fix(11,19)]='Fête du Prince';
        M[fix(12,8)]='Immaculée Conception'; M[fix(12,25)]='Noël';
        M[add(paques,1)]='Lundi de Pâques'; M[add(paques,39)]='Ascension'; M[add(paques,50)]='Lundi de Pentecôte'; M[add(paques,60)]='Fête-Dieu';
        return M;
      };
      const fnames = Object.assign({}, feriesNamed(year), feriesNamed(year + 1));

      const site = 'https://chpg-anesthesie.github.io/Planning-CHPG/';
      const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
      const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      const dd = n => String(n).padStart(2,'0');

      let sent = 0, skipped = 0;
      const errors = [];

      for (let r = 1; r < medData.length; r++) {
        const id = String(medData[r][0]).trim();
        const nom = String(medData[r][1]).trim();
        const actif = String(medData[r][3]).trim().toUpperCase() === 'O';
        const email = String(medData[r][7]).trim();
        if (!id || !actif) continue;
        if (!email) { skipped++; continue; }

        // Gardes du MAR (G / G2 uniquement)
        const gardes = [];
        for (let ri = 3; ri < gData.length; ri++) {
          if (String(gData[ri][0]).trim() !== id) continue;
          Object.keys(colToDate).forEach(col => {
            const date = colToDate[col];
            const val = String(gData[ri][Number(col)] || '').trim().toUpperCase();
            if (val === 'G' || val === 'G2') gardes.push({ date, type: val });
          });
          break;
        }
        gardes.sort((x,y2) => x.date < y2.date ? -1 : (x.date > y2.date ? 1 : 0));

        let nRea=0, nMat=0, nWe=0, nFer=0;
        const byMonth = {};
        gardes.forEach(gg => {
          const dt = new Date(gg.date + 'T12:00:00'), dw = dt.getDay();
          if (gg.type === 'G') nRea++; else nMat++;
          if (dw === 0 || dw === 6) nWe++;
          if (isF(gg.date)) nFer++;
          const mo = Number(gg.date.slice(5,7)) - 1;
          (byMonth[mo] = byMonth[mo] || []).push(gg);
        });

        // ---------- HTML ----------
        const chips =
          `<span style="display:inline-block;background:#eef4ff;color:#1d4ed8;border:1px solid #dbe6ff;border-radius:999px;font-size:12px;font-weight:700;padding:4px 11px;margin:0 6px 6px 0">${nRea} réanimation</span>` +
          `<span style="display:inline-block;background:#ecfdf5;color:#0d9488;border:1px solid #cdeee6;border-radius:999px;font-size:12px;font-weight:700;padding:4px 11px;margin:0 6px 6px 0">${nMat} maternité</span>` +
          (nWe ? `<span style="display:inline-block;background:#fff7ed;color:#c2410c;border:1px solid #fde3cf;border-radius:999px;font-size:12px;font-weight:700;padding:4px 11px;margin:0 6px 6px 0">${nWe} week-end${nWe>1?'s':''}</span>` : '') +
          (nFer ? `<span style="display:inline-block;background:#fef2f2;color:#b91c1c;border:1px solid #fbd5d5;border-radius:999px;font-size:12px;font-weight:700;padding:4px 11px;margin:0 6px 6px 0">${nFer} férié${nFer>1?'s':''}</span>` : '');

        let rowsHtml = '';
        Object.keys(byMonth).map(Number).sort((p,q)=>p-q).forEach(mo => {
          rowsHtml += `<div style="font-size:12px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#94a3b8;margin:18px 0 8px 2px">${MOIS[mo]}</div>`;
          byMonth[mo].forEach(gg => {
            const dt = new Date(gg.date + 'T12:00:00'), dw = dt.getDay();
            const dlabel = `${JOURS[dw]} ${dd(dt.getDate())}/${dd(mo+1)}`;
            const ferie = isF(gg.date), we = (dw === 0 || dw === 6);
            const badge = gg.type === 'G'
              ? '<span style="display:inline-block;background:#eef4ff;color:#1d4ed8;border-radius:7px;font-size:12px;font-weight:700;padding:4px 10px">G &middot; Réa</span>'
              : '<span style="display:inline-block;background:#ecfdf5;color:#0d9488;border-radius:7px;font-size:12px;font-weight:700;padding:4px 10px">G2 &middot; Mat</span>';
            let rowStyle = 'border:1px solid #eef1f5;', tag = '';
            if (ferie) {
              const nm = fnames[gg.date];
              rowStyle = 'border:1px solid #fbd5d5;background:#fef6f6;';
              tag = `<span style="font-size:10.5px;font-weight:700;color:#b91c1c;background:#fdeaea;border-radius:5px;padding:2px 7px">Férié${nm?' &middot; '+nm:''}</span>`;
            } else if (we) {
              rowStyle = 'border:1px solid #fde3cf;background:#fffaf5;';
              tag = '<span style="font-size:10.5px;font-weight:700;color:#c2410c;background:#fff1e6;border-radius:5px;padding:2px 7px">Week-end</span>';
            }
            rowsHtml += `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;${rowStyle}border-radius:10px;margin-bottom:7px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:14px;font-weight:700;color:#0f172a">${dlabel}</span>${tag}</div>${badge}</div>`;
          });
        });

        const summaryHtml = gardes.length
          ? `<div style="background:#f8fafc;border:1px solid #eef1f5;border-radius:12px;padding:14px 16px;margin-bottom:22px"><div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:10px">${gardes.length} garde${gardes.length>1?'s':''} sur l'année</div><div>${chips}</div></div>`
          : '';
        const emptyHtml = '<div style="background:#f8fafc;border:1px solid #eef1f5;border-radius:12px;padding:18px;text-align:center;color:#64748b;font-size:14px">Aucune garde programmée pour vous en ' + year + '.</div>';
        const coreHtml = gardes.length ? (summaryHtml + rowsHtml) : emptyHtml;

        const html =
          '<div style="background:#e9edf1;padding:0;margin:0">' +
          '<div style="max-width:600px;margin:0 auto;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">' +
            '<div style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e3e8ef">' +
              '<div style="background:#0f172a;padding:22px 26px">' +
                '<div style="color:#cbd5e1;font-size:12px;font-weight:600;letter-spacing:.4px;text-transform:uppercase">Planning CHPG Monaco</div>' +
                '<div style="color:#ffffff;font-size:23px;font-weight:800;margin-top:12px">Vos gardes ' + year + '</div>' +
                '<div style="color:#94a3b8;font-size:14px;margin-top:3px">' + nom + '</div>' +
              '</div>' +
              '<div style="padding:22px 26px 8px">' +
                '<p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#334155">Bonjour ' + nom + ',<br>Le planning ' + year + ' vient d\'être généré. Voici vos gardes pour l\'année — à reporter dans votre agenda.</p>' +
                coreHtml +
                '<div style="border-top:1px solid #eef1f5;margin:8px 0 18px"></div>' +
                '<div style="text-align:center"><a href="' + site + '" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px">Voir le planning complet &rarr;</a>' +
                '<p style="margin:14px 0 0;font-size:12px;color:#9aa4b2;line-height:1.5">Une erreur ou un échange à signaler ? Contactez le comité planning.</p></div>' +
              '</div>' +
              '<div style="background:#f8fafc;border-top:1px solid #eef1f5;padding:14px;text-align:center"><div style="font-size:11px;color:#9aa4b2">Le Comité Planning CHPG Monaco</div></div>' +
            '</div>' +
          '</div>' +
          '</div>';

        // ---------- Texte brut (repli) ----------
        let bodyText = 'Bonjour ' + nom + ',\n\nLe planning ' + year + ' vient d\'être généré. Voici vos gardes :\n\n';
        if (!gardes.length) {
          bodyText += 'Aucune garde programmée pour vous en ' + year + '.\n';
        } else {
          bodyText += gardes.length + ' garde' + (gardes.length>1?'s':'') + ' — ' + nRea + ' réa / ' + nMat + ' mat'
            + (nWe ? ' \u00b7 ' + nWe + ' week-end' + (nWe>1?'s':'') : '')
            + (nFer ? ' \u00b7 ' + nFer + ' férié' + (nFer>1?'s':'') : '') + '\n\n';
          Object.keys(byMonth).map(Number).sort((p,q)=>p-q).forEach(mo => {
            bodyText += MOIS[mo] + ' :\n';
            byMonth[mo].forEach(gg => {
              const dt = new Date(gg.date + 'T12:00:00'), dw = dt.getDay();
              const nm = fnames[gg.date];
              const tag = isF(gg.date) ? ' [Férié' + (nm?' '+nm:'') + ']' : ((dw===0||dw===6) ? ' [week-end]' : '');
              bodyText += '  ' + JOURS[dw] + ' ' + dd(dt.getDate()) + '/' + dd(mo+1) + ' \u2014 ' + (gg.type==='G'?'G (réa)':'G2 (mat)') + tag + '\n';
            });
          });
        }
        bodyText += '\nVoir le planning : ' + site + '\n\nLe Comité Planning CHPG Monaco';

        try {
          MailApp.sendEmail({
            to: email,
            subject: `[Planning CHPG Monaco ${year}] Vos gardes ${year}`,
            htmlBody: html,
            body: bodyText,
          });
          sent++;
        } catch(err) {
          errors.push(`${nom} : ${err.message}`);
        }
      }

      logAction(`envoyerRecapGardes ${year} — ${sent} emails, ${skipped} sans email, ${errors.length} erreur(s)`);
      return ContentService.createTextOutput(JSON.stringify({
        success: true, sent, skipped, errors
      })).setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'setIndisposYear') {
      if (user.role !== 'admin') return _deny();
      const newYear = Number(payload.year);
      if (!newYear || newYear < 2026) return _error('Année invalide');
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CONFIG');
      if (!sheet) return _error('CONFIG introuvable');
      const data = sheet.getDataRange().getValues();
      let found = false;
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]).trim() === 'INDISPOS_ACTIVE') {
          sheet.getRange(r+1, 2).setValue(newYear);
          found = true; break;
        }
      }
      if (!found) sheet.appendRow(['INDISPOS_ACTIVE', newYear]);
      logAction(`setIndisposYear → ${newYear}`);
      return ContentService.createTextOutput(JSON.stringify({success:true, year:newYear}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'clearIndisposYear') {
      if (user.role !== 'admin') return _deny();
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName('CONFIG');
      if (!sheet) return _error('CONFIG introuvable');
      const data = sheet.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]).trim() === 'INDISPOS_ACTIVE') {
          sheet.deleteRow(r+1); break;
        }
      }
      logAction('clearIndisposYear — INDISPOS_ACTIVE supprimée');
      return ContentService.createTextOutput(JSON.stringify({success:true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

// ── ACTION : savePlanningOverride ─────────────────────────────────────
// Appelé quand le comité place un MAR dans une case flash
// payload : { action, code, date, marId, morning, afternoon, comment }
if (action === 'savePlanningOverride') {
  if (user.role !== 'admin') return _deny();
  const { date, marId, morning, afternoon, comment } = payload;
  if (!date || !marId) return _error('date et marId requis');
  try {
    savePlanningOverride(date, marId, morning || '', afternoon || morning || '', comment || '');
    logAction(`savePlanningOverride — ${marId} le ${date} → ${morning}`);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return _error(e.message);
  }
}

// ── ACTION : deletePlanningOverride ───────────────────────────────────
// Appelé pour supprimer un override (comité retire un MAR placé manuellement)
// payload : { action, code, date, marId }
if (action === 'deletePlanningOverride') {
  if (user.role !== 'admin') return _deny();
  const { date, marId } = payload;
  if (!date || !marId) return _error('date et marId requis');
  try {
    deletePlanningOverride(date, marId);
    logAction(`deletePlanningOverride — ${marId} le ${date}`);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return _error(e.message);
  }
}

// ── ACTION : applyRotationLib (rotation consultations libérales endo) ──
if (action === 'applyRotationLib') {
  if (user.role !== 'admin') return _deny();
  const year = Number(payload.year) || TEST_YEAR;
  const assignments = Array.isArray(payload.assignments) ? payload.assignments : [];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PLANNING_OVERRIDES');
  if (!sheet) {
    sheet = ss.insertSheet('PLANNING_OVERRIDES');
    sheet.getRange(1,1,1,5).setValues([['DATE','MAR_ID','MATIN','APREM','COMMENTAIRE']]);
    sheet.getRange(1,1,1,5).setFontWeight('bold');
  }
  const data = sheet.getDataRange().getValues();
  // 1) retirer les anciennes lignes de rotation (tag ROT-LIB), du bas vers le haut
  for (let r = data.length - 1; r >= 1; r--) {
    if (String(data[r][4]).trim() === 'ROT-LIB') sheet.deleteRow(r + 1);
  }
  // 2) écrire les nouvelles attributions : 1 MAR / date, consult endo l'après-midi
  const add = assignments
    .filter(a => a && a.date && a.marId)
    .map(a => [String(a.date), String(a.marId).toUpperCase(), '', 'CS-END', 'ROT-LIB']);
  if (add.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, add.length, 5).setValues(add);
  }
  // 3) republier le planning
  try { generatePlanning(year); } catch(e) { Logger.log('applyRotationLib generatePlanning: ' + e.message); }
  logAction(`applyRotationLib ${year} — ${add.length} créneaux libéraux endo`);
  return ContentService.createTextOutput(JSON.stringify({ success: true, count: add.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ACTION : getPlanningOverrides ─────────────────────────────────────
// Retourne tous les overrides pour une année donnée
// payload : { action, code, year? }
if (action === 'getPlanningOverrides') {
  if (user.role !== 'admin') return _deny();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PLANNING_OVERRIDES');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: true, overrides: []}))
    .setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const overrides = [];
  for (let r = 1; r < data.length; r++) {
    const raw = data[r][0];
    if (!raw) continue;
    const date = raw instanceof Date
      ? `${raw.getFullYear()}-${String(raw.getMonth()+1).padStart(2,'0')}-${String(raw.getDate()).padStart(2,'0')}`
      : String(raw).trim();
    overrides.push({
      date,
      marId:    String(data[r][1] || '').trim().toUpperCase(),
      morning:  String(data[r][2] || '').trim().toUpperCase(),
      afternoon:String(data[r][3] || '').trim().toUpperCase(),
      comment:  String(data[r][4] || '').trim(),
    });
  }
  return ContentService.createTextOutput(JSON.stringify({success: true, overrides}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ACTION : validerSemaine ───────────────────────────────────────────
// Valide ou dévalide une semaine → mise à jour SEMAINES_VALIDEES + push JSON
// payload : { action, code, year, isoWeek, valide (true/false) }
if (action === 'validerSemaine') {
  if (user.role !== 'admin') return _deny();
  const yearVal  = Number(payload.year) || TEST_YEAR;
  const isoWeek  = Number(payload.isoWeek);
  const valide   = payload.valide === true || payload.valide === 'true';
  if (!isoWeek) return _error('isoWeek requis');
  try {
    validerSemaine(yearVal, isoWeek, valide);
    logAction(`validerSemaine — S${isoWeek} ${yearVal} → ${valide ? 'VALIDÉE' : 'dévalidée'}`);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      isoWeek, year: yearVal, validated: valide
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return _error(e.message);
  }
}

// ── ACTION : getSemainesValidees ──────────────────────────────────────
// Retourne la liste des semaines validées pour une année
// payload : { action, code, year? }
if (action === 'getSemainesValidees') {
  if (user.role !== 'admin') return _deny();
  const yearVal = Number(payload.year) || TEST_YEAR;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('SEMAINES_VALIDEES');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: true, semaines: []}))
    .setMimeType(ContentService.MimeType.JSON);
  const data = sheet.getDataRange().getValues();
  const semaines = [];
  for (let r = 1; r < data.length; r++) {
    if (Number(data[r][0]) !== yearVal) continue;
    semaines.push({
      isoWeek:       Number(data[r][1]),
      validated:     String(data[r][2]).trim().toUpperCase() === 'O',
      dateValidation:data[r][3] ? String(data[r][3]) : '',
    });
  }
  return ContentService.createTextOutput(JSON.stringify({success: true, semaines, year: yearVal}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ACTION : getMARsDispoJour ─────────────────────────────────────────
// Retourne les MARs disponibles un jour donné pour le popup "combler case flash"
// Groupés par rôle : VOLANT / CTP / R / autres présents
// payload : { action, code, date }
if (action === 'getMARsDispoJour') {
  if (user.role !== 'admin') return _deny();
  const targetDate = String(payload.date || '').trim();
  if (!targetDate) return _error('date requise');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const year = Number(targetDate.slice(0,4));
  const gardesSheet = ss.getSheetByName(`GARDES_${year}`);
  if (!gardesSheet) return _error(`GARDES_${year} introuvable`);

  const gardesData = gardesSheet.getDataRange().getValues();
  const dateToCol = buildDateToCol(gardesData, year);
  const colIdx = dateToCol[targetDate];
  if (colIdx === undefined) return _error(`Date ${targetDate} introuvable dans GARDES_${year}`);

  const affSheet = ss.getSheetByName(`AFFECTATIONS_${year}`);
  const medSheet = ss.getSheetByName('MEDECINS');

  // Lire l'affectation de chaque MAR
  const affMap = {}; // marId → secteur
  if (affSheet) {
    const affData = affSheet.getDataRange().getValues();
    const dt = new Date(targetDate + 'T12:00:00');
    const monthIdx = dt.getMonth() + 1; // 1-12
    for (let r = 1; r < affData.length; r++) {
      const id = String(affData[r][0]).trim();
      if (!id) continue;
      // Colonne du mois (1=JAN, 2=FEV, ... 12=DEC)
      affMap[id] = normalizeAffectation(String(affData[r][monthIdx] || '').trim().toUpperCase());
    }
  }

  // Lire les actifs depuis MEDECINS
  const actifs = new Set();
  const initMap = {};
  if (medSheet) {
    const medData = medSheet.getDataRange().getValues();
    for (let r = 1; r < medData.length; r++) {
      const id = String(medData[r][0]).trim();
      if (!id) continue;
      initMap[id] = String(medData[r][2] || '').trim();   // colonne INITIALES
      if (String(medData[r][3]).trim().toUpperCase() === 'O') actifs.add(id);
    }
  }

  const FLAGS = getMedecinFlags(); // (C2-D2) date_debut/date_fin externalisées → MEDECINS
  const ABSENT_CODES_SET = new Set(['RG','V','CP','F','CTP','A','CL']);
  const dispo = [];

  // (C2-D2) Index des codes GARDES par MAR (un MAR sans ligne GARDES → code vide).
  const codeById = {};
  for (let r = 3; r < gardesData.length; r++) {
    const gid = String(gardesData[r][0]).trim();
    if (gid) codeById[gid] = String(gardesData[r][colIdx] || '').trim().toUpperCase();
  }

  // (C2-D2) Itérer sur l'effectif réel (MEDECINS actifs), PAS sur les lignes GARDES.
  // → un MAR actif récemment arrivé (ex. COPELOVICI, absente de GARDES_2026 reconstruit)
  //   apparaît quand même ; date_debut/date_fin gèrent arrivée/départ.
  Array.from(actifs).forEach(id => {
    let code = codeById[id] || '';
    // (C2-D3) jours fixes non travaillés (ex. BONNET jeu/ven) → TP, lus depuis MEDECINS
    const _tp = FLAGS.tpJoursFixes[id];
    if (!code && _tp && _tp.has(new Date(targetDate + 'T12:00:00').getDay())) code = 'TP';
    if (ABSENT_CODES_SET.has(code)) return; // absent
    const _dd = FLAGS.dateDebut[id], _df = FLAGS.dateFin[id];
    if (_dd && targetDate < _dd) return; // pas encore actif (ex. ARMAND avant le 1er nov)
    if (_df && targetDate >= _df) return; // n'est plus actif (ex. TRAN à partir du 1er sept)
    if (estSemaineOff(id, targetDate)) return; // rythme 2/2 (TRAN, COPELOVICI…) — semaine off

    const secteur = affMap[id] || 'VOLANT';
    let role;
    if (code === 'TP') role = 'TP';
    else if (code === 'R') role = 'R';
    else if (secteur === 'VOLANT') role = 'VOLANT';
    else role = 'PRESENT';

    dispo.push({ id, init: initMap[id] || id, role, secteur, code: code || 'PRESENT' });
  });

  // Trier : VOLANT d'abord, puis CTP, puis R, puis autres
  const roleOrder = {VOLANT:0, CTP:1, R:2, PRESENT:3, TP:4};
  dispo.sort((a,b) => (roleOrder[a.role]||3) - (roleOrder[b.role]||3));

  return ContentService.createTextOutput(JSON.stringify({
    success: true, date: targetDate, dispo
  })).setMimeType(ContentService.MimeType.JSON);
}
if (action === 'sendCodesWithRecap') {
  if (user.role !== 'admin') return _deny();
  const indYear = Number(payload.year) || getIndisposYear();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const medSheet = ss.getSheetByName('MEDECINS');
  if (!medSheet) return _error('Onglet MEDECINS introuvable');
  const medData = medSheet.getDataRange().getValues();

  const perSheet = ss.getSheetByName('PERIODES_VAC');
  const periodes = [];
  if (perSheet) {
    const perData = perSheet.getDataRange().getValues();
    for (let r = 1; r < perData.length; r++) {
      const nom = String(perData[r][0]).trim();
      if (!nom) continue;
      const dr = perData[r][1], fr = perData[r][2];
      const debut = dr instanceof Date
        ? dr.getFullYear()+'-'+String(dr.getMonth()+1).padStart(2,'0')+'-'+String(dr.getDate()).padStart(2,'0')
        : String(dr).trim();
      const fin = fr instanceof Date
        ? fr.getFullYear()+'-'+String(fr.getMonth()+1).padStart(2,'0')+'-'+String(fr.getDate()).padStart(2,'0')
        : String(fr).trim();
      periodes.push({nom, debut, fin});
    }
  }

  const indSheet = ss.getSheetByName('INDISPOS_'+indYear);
  if (!indSheet) return _error('INDISPOS_'+indYear+' introuvable');
  const indData = indSheet.getDataRange().getValues();

  const dates = reconstruireDatesHeaders(indData, indYear); // (C3b) helper unifié

  function fmtDate(ds) {
    const d = new Date(ds+'T12:00:00');
    return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear();
  }
const MOIS_ABR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  function fmtJour(ds){ const d=new Date(ds+'T12:00:00'); return d.getDate()+' '+MOIS_ABR[d.getMonth()]; }
  function fmtPlage(a,b){
    if(a===b) return fmtJour(a);
    const da=new Date(a+'T12:00:00'), db=new Date(b+'T12:00:00');
    if(da.getMonth()===db.getMonth()) return da.getDate()+' → '+db.getDate()+' '+MOIS_ABR[db.getMonth()];
    return fmtJour(a)+' → '+fmtJour(b);
  }
  const pillV = t => '<span style="display:inline-block;background:#eef4fb;border:1px solid #cfe0f2;border-radius:999px;padding:3px 11px;font-size:12px;font-weight:600;color:#1d6fb8;margin:0 5px 5px 0;white-space:nowrap">'+t+'</span>';
  const pillF = t => '<span style="display:inline-block;background:#fdf3e3;border:1px solid #f2d98a;border-radius:999px;padding:3px 11px;font-size:12px;font-weight:600;color:#b45309;margin:0 5px 5px 0;white-space:nowrap">'+t+'</span>';

  let sent = 0, skipped = 0;
  const errors = [];

  for (let r = 1; r < medData.length; r++) {
    const id    = String(medData[r][0]).trim();
    const nom   = String(medData[r][1]).trim();
    const actif = String(medData[r][3]).trim().toUpperCase() === 'O';
    const code  = String(medData[r][6]).trim();
    const email = String(medData[r][7]).trim();
    if (!id || !actif) continue;
    if (!email) { skipped++; continue; }

    const marVAC = {}, marFORM = {};
    for (let ri = 3; ri < indData.length; ri++) {
      if (String(indData[ri][0]).trim() !== id) continue;
      dates.forEach((date, i) => {
        if (!date) return;
        const val = String(indData[ri][i+1]||'').trim();
        if (val === 'VAC') marVAC[date] = true;
        else if (val === 'FORM') marFORM[date] = true;
      });
      break;
    }

    const _TV2={label:'Vacances',bg:'#eef4fb',fg:'#1d6fb8'}, _TF2={label:'Formation',bg:'#fdf3e3',fg:'#b45309'};
    const _blocks2 = []; let vacText = '';
    periodes.forEach(p => {
      const jV = Object.keys(marVAC).filter(d => d >= p.debut && d <= p.fin).sort();
      const jF = Object.keys(marFORM).filter(d => d >= p.debut && d <= p.fin).sort();
      if (!jV.length && !jF.length) return;
      _blocks2.push({title:p.nom, rows:[
        {label:_TV2.label,bg:_TV2.bg,fg:_TV2.fg,dates:jV},
        {label:_TF2.label,bg:_TF2.bg,fg:_TF2.fg,dates:jF},
      ]});
      if (jV.length) vacText += '  '+p.nom+' : '+jV.map(fmtJour).join(', ')+'\n';
    });
    const _hV2 = Object.keys(marVAC).filter(d => !periodes.some(p => d >= p.debut && d <= p.fin)).sort();
    const _hF2 = Object.keys(marFORM).filter(d => !periodes.some(p => d >= p.debut && d <= p.fin)).sort();
    if (_hV2.length || _hF2.length) {
      _blocks2.push({title:'Hors périodes', rows:[
        {label:_TV2.label,bg:_TV2.bg,fg:_TV2.fg,dates:_hV2},
        {label:_TF2.label,bg:_TF2.bg,fg:_TF2.fg,dates:_hF2},
      ]});
      if (_hV2.length) vacText += '  Autres : '+_hV2.map(fmtJour).join(', ')+'\n';
    }
    const formKeys = Object.keys(marFORM).sort();
    const nbVAC = Object.keys(marVAC).length;
    const nbFORM = formKeys.length;
    const link = 'https://chpg-anesthesie.github.io/Planning-CHPG/indispos.html';
    const congesBlocks = renderRecapMailBlocks_([
      {n:nbVAC,label:'jours vacances',bg:'#eef4fb',fg:'#1d6fb8'},
      {n:nbFORM,label:'jours formation',bg:'#fdf3e3',fg:'#b45309'},
    ], _blocks2);

    const html =
      '<div style="background:#f4f6f9;padding:0;margin:0">'+
      '<div style="max-width:560px;margin:0 auto;padding:24px 14px;font-family:Arial,Helvetica,sans-serif">'+
        '<div style="background:#ffffff;border:1px solid #e3e8ef;border-radius:14px;overflow:hidden">'+
          '<div style="background:#ce1126;padding:18px 22px">'+
            '<div style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">CHPG Monaco · Anesthésie-Réanimation</div>'+
            '<div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:4px">Vos congés &amp; ouverture des indispos '+indYear+'</div>'+
          '</div>'+
          '<div style="padding:22px">'+
            '<p style="margin:0 0 18px;font-size:14px;color:#3a4759">Bonjour <strong>'+nom+'</strong>,</p>'+
            '<div style="font-size:13px;font-weight:700;color:#16202e;margin-bottom:12px">📋 Vos congés posés au staff</div>'+
            congesBlocks+
            '<div style="border-top:1px solid #eef1f5;margin:22px 0 16px"></div>'+
            '<div style="font-size:13px;font-weight:700;color:#16202e;margin-bottom:10px">🔓 Saisissez vos indisponibilités</div>'+
            '<p style="margin:0 0 14px;font-size:13px;color:#3a4759">La saisie est maintenant ouverte. Connectez-vous avec votre code personnel :</p>'+
            '<div style="background:#f4f6f9;border:1px solid #e3e8ef;border-radius:10px;padding:12px 16px;margin-bottom:16px">'+
              '<div style="font-size:11px;color:#697789;text-transform:uppercase;letter-spacing:.5px">Votre code d\'accès</div>'+
              '<div style="font-size:22px;font-weight:700;letter-spacing:2px;color:#ce1126;font-family:monospace">'+code+'</div>'+
            '</div>'+
            '<a href="'+link+'" style="display:inline-block;background:#15803d;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:10px">Ouvrir la saisie →</a>'+
            '<p style="margin:16px 0 0;font-size:12px;color:#9aa4b2">Conservez ce code confidentiel. En cas d\'erreur dans vos congés, contactez le comité planning.</p>'+
          '</div>'+
        '</div>'+
        '<div style="text-align:center;font-size:11px;color:#9aa4b2;margin-top:14px">Le Comité Planning CHPG Monaco</div>'+
      '</div>'+
      '</div>';

    const bodyText =
      'Bonjour '+nom+',\n\n'+
      'Vos congés posés au staff '+indYear+' :\n'+
      'Vacances ('+nbVAC+' j) :\n'+(vacText||'  Aucune\n')+
      'Formations ('+nbFORM+' j) : '+(formKeys.map(fmtJour).join(', ')||'Aucune')+'\n\n'+
      'Saisie des indisponibilités ouverte. Code : '+code+'\n'+
      'Lien : '+link+'\n\n'+
      'Conservez ce code confidentiel.\nLe Comité Planning CHPG Monaco';

    try {
      MailApp.sendEmail({
        to: email,
        subject: '[Planning CHPG Monaco '+indYear+'] Vos congés + ouverture des indispos',
        htmlBody: html,
        body: bodyText,
      });
      sent++;
    } catch(err) {
      errors.push(nom+' : '+err.message);
    }
  }

  logAction('sendCodesWithRecap '+indYear+' — '+sent+' emails, '+skipped+' sans email, '+errors.length+' erreur(s)');
  return ContentService.createTextOutput(JSON.stringify({success:true, sent, skipped, errors}))
    .setMimeType(ContentService.MimeType.JSON);
}
if (action === 'setDailyStatus') {
      if (user.role !== 'admin') return _deny();
      const year   = Number(payload.year) || TEST_YEAR;
      const marId  = String(payload.marId || '').trim().toUpperCase();
      const statut = String(payload.statut || '').trim().toUpperCase(); // '' = effacer
      const dates  = Array.isArray(payload.dates)
        ? payload.dates
        : (payload.date ? [String(payload.date)] : []);
      if (!marId || !dates.length) return _error('marId et date(s) requis');

      const ALLOWED = new Set(['', 'V', 'I', 'F', 'TP', 'CL', 'A', '18']);
      if (!ALLOWED.has(statut)) return _error(`Statut non autorisé : ${statut}`);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(`GARDES_${year}`);
      if (!sheet) return _error(`GARDES_${year} introuvable`);
      const data = sheet.getDataRange().getValues();
      const dateToCol = buildDateToCol(data, year);

      let row = -1;
      for (let r = 3; r < data.length; r++) {
        if (String(data[r][0]).trim().toUpperCase() === marId) { row = r; break; }
      }
      if (row < 0) return _error(`${marId} introuvable dans GARDES_${year}`);

      const GARDE_BLOCK = new Set(['G', 'G2', 'RG']); // garde + récup → échange/don
      const applied = [], rejected = [];
      dates.forEach(d => {
        const col = dateToCol[d];
        if (col === undefined) { rejected.push(`${d} (hors planning)`); return; }
        const current = String(data[row][col] || '').trim().toUpperCase();
        if (GARDE_BLOCK.has(current)) { rejected.push(`${d} (${current} → échange/don)`); return; }
        sheet.getRange(row + 1, col + 1).setValue(statut);
        applied.push(d);
      });

      if (applied.length) {
        try {
          const indMap = {'':'', 'V':'VAC', 'I':'INDISPO', 'F':'FORM', 'TP':'TP', 'CL':'CL', 'A':'A', '18':'INDISPO'};
          const existing = getIndisposForDoctor(marId, year);
          applied.forEach(d => { existing[d] = indMap[statut]; });
          saveIndisposForDoctor(marId, existing, year);
        } catch(e) { Logger.log('Miroir INDISPOS: ' + e.message); }
        // (C3) plus d'auto-republication : déclenchée par le bouton « Publier » (action publishPlanning).
      }
      logAction(`setDailyStatus — ${marId} "${statut || '∅'}" ×${applied.length}, ${rejected.length} rejeté(s)`);
      return ContentService.createTextOutput(JSON.stringify({ success: true, applied, rejected }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'poserAbsenceLongue') {
      if (user.role !== 'admin') return _deny();
      const marId = String(payload.marId || '').trim().toUpperCase();
      const d1 = String(payload.dateDebut || '').trim();
      const d2 = String(payload.dateFin   || '').trim();
      if (!marId || !d1 || !d2) return _error('marId, dateDebut et dateFin requis');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d1) || !/^\d{4}-\d{2}-\d{2}$/.test(d2)) return _error('Dates au format YYYY-MM-DD');
      if (d1 > d2) return _error('La date de début est après la date de fin');

      const ss = SpreadsheetApp.getActiveSpreadsheet();

      // Registre persistant des absences longues -> permet le report auto vers les années pas encore créées (initYear le rejoue)
      {
        let absSheet = ss.getSheetByName('ABSENCES_LONGUES');
        if (!absSheet) { absSheet = ss.insertSheet('ABSENCES_LONGUES'); absSheet.appendRow(['MAR_ID','DATE_DEBUT','DATE_FIN','POSE_LE']); }
        absSheet.getRange('B:C').setNumberFormat('@');   // dates stockées en TEXTE (pas de coercition Date)
        const adata = absSheet.getDataRange().getValues();
        let exists = false;
        for (let r = 1; r < adata.length; r++) {
          if (String(adata[r][0]).trim().toUpperCase() === marId
              && _isoDate(adata[r][1]) === d1 && _isoDate(adata[r][2]) === d2) { exists = true; break; }
        }
        if (!exists) absSheet.appendRow([marId, d1, d2, new Date()]);
      }

      // Toutes les dates calendaires de la plage [d1, d2]
      const allDates = [];
      { const cur = new Date(d1 + 'T12:00:00'), end = new Date(d2 + 'T12:00:00');
        while (cur <= end) {
          allDates.push(`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`);
          cur.setDate(cur.getDate() + 1);
        } }
      const nextStr = (d) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate()+1);
        return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };

      // Années civiles couvrant la plage (1 ou 2 en pratique)
      const years = [];
      for (let y = Number(d1.slice(0,4)); y <= Number(d2.slice(0,4)); y++) years.push(y);

      const freed = [];                 // gardes libérées {date, role}
      const deferred = [];              // années de la plage pas encore créées (report différé à l'init)
      let nbCL = 0;
      const touched = [];

      years.forEach(year => {
        const gSheet = ss.getSheetByName(`GARDES_${year}`);
        if (gSheet) {
          // Année GÉNÉRÉE : CL écrase tout (gardes + RG), on note les gardes libérées
          const data = gSheet.getDataRange().getValues();
          const dateToCol = buildDateToCol(data, year);
          let row = -1;
          for (let r = 3; r < data.length; r++)
            if (String(data[r][0]).trim().toUpperCase() === marId) { row = r; break; }
          if (row < 0) return;
          const inYear = allDates.filter(dt => dateToCol[dt] !== undefined);
          if (!inYear.length) return;
          const indMap = getIndisposForDoctor(marId, year);
          inYear.forEach(dt => {
            const col = dateToCol[dt];
            const curv = String(data[row][col] || '').trim().toUpperCase();
            if (curv === 'G' || curv === 'G2') freed.push({ date: dt, role: curv });
            gSheet.getRange(row + 1, col + 1).setValue('CL');
            indMap[dt] = 'CL';
            nbCL++;
          });
          // Nettoie le RG du lendemain d'une garde libérée si ce lendemain est hors plage
          freed.forEach(f => {
            const lend = nextStr(f.date), lc = dateToCol[lend];
            if (lc !== undefined && inYear.indexOf(lend) < 0
                && String(data[row][lc] || '').trim().toUpperCase() === 'RG')
              gSheet.getRange(row + 1, lc + 1).setValue('');
          });
          saveIndisposForDoctor(marId, indMap, year);
          touched.push(`${year} (générée)`);
        } else {
          // Année NON générée : CL dans INDISPOS seulement (zéro garde à reprendre)
          const iSheet = ss.getSheetByName(`INDISPOS_${year}`);
          if (!iSheet) { deferred.push(year); return; }
          const idata = iSheet.getDataRange().getValues();
          const dset = new Set(reconstruireDatesHeaders(idata, year).filter(Boolean));
          const inYear = allDates.filter(dt => dset.has(dt));
          if (!inYear.length) return;
          const indMap = getIndisposForDoctor(marId, year);
          inYear.forEach(dt => { indMap[dt] = 'CL'; nbCL++; });
          saveIndisposForDoctor(marId, indMap, year);
          touched.push(`${year} (préparation)`);
        }
      });

      if (!nbCL && !deferred.length) return _error('Aucune date de la plage ne correspond à une année configurée (INDISPOS/GARDES).');
      freed.sort((a,b) => a.date < b.date ? -1 : 1);
      logAction(`poserAbsenceLongue — ${marId} ${d1} -> ${d2} : ${nbCL} j CL, ${freed.length} garde(s) liberee(s)${deferred.length ? ', reporté: ' + deferred.join('/') : ''}`);
      return ContentService.createTextOutput(JSON.stringify({ success: true, marId, nbCL, freed, touched, deferred }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success:false, error:'Action inconnue'}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error:err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── HELPERS INTERNES ─────────────────────────────────────────────────
function _deny() {
  return ContentService.createTextOutput(JSON.stringify({success:false, error:'Accès refusé'}))
    .setMimeType(ContentService.MimeType.JSON);
}
function _error(msg) {
  return ContentService.createTextOutput(JSON.stringify({success:false, error:msg}))
    .setMimeType(ContentService.MimeType.JSON);
}
// Normalise une valeur de cellule (texte OU objet Date) en 'yyyy-MM-dd' — évite la coercition date de Sheets.
function _isoDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ── doPost — même logique que doGet ──────────────────────────────────
function doPost(e) {
  // Réutiliser doGet en reconstituant e.parameter
  try {
    const payload = JSON.parse(e.postData.contents);
    return doGet({parameter: {payload: JSON.stringify(payload)}});
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success:false, error:err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
function testNotifierConflits() {
  const year = 2027;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const medSheet = ss.getSheetByName('MEDECINS');
  const medData = medSheet.getDataRange().getValues();
  const actifs = [];
  for (let r = 1; r < medData.length; r++) {
    const id = String(medData[r][0]).trim();
    if (!id || String(medData[r][3]).trim().toUpperCase() !== 'O') continue;
    actifs.push({id, nom: String(medData[r][1]).trim(), email: String(medData[r][7]).trim()});
  }
  Logger.log('MARs actifs: ' + actifs.length);
  
  const indSheet = ss.getSheetByName('INDISPOS_' + year);
  if (!indSheet) { Logger.log('INDISPOS_' + year + ' introuvable'); return; }
  const indData = indSheet.getDataRange().getValues();
  Logger.log('INDISPOS lignes: ' + indData.length + ' cols: ' + indData[0].length);
  
  const dates = [];
  let curY = year, curM = null;
  const MM = {'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12};
  for (let c = 1; c < indData[0].length; c++) {
    const cell = indData[0][c];
    if (cell) {
      if (cell instanceof Date) { curY = cell.getFullYear(); curM = cell.getMonth()+1; }
      else { const low = String(cell).toLowerCase(); const m2 = String(cell).match(/(\d{4})/); if (m2) curY = parseInt(m2[1]); Object.entries(MM).forEach(([n,v]) => { if (low.includes(n)) curM = v; }); }
    }
    const dn = indData[2][c];
    dates.push((dn && curY && curM) ? curY+'-'+String(curM).padStart(2,'0')+'-'+String(Number(dn)).padStart(2,'0') : null);
  }
  Logger.log('Dates non-nulles: ' + dates.filter(Boolean).length);
  
  const vacByDoc = {};
  for (let r = 3; r < indData.length; r++) {
    const id = String(indData[r][0]).trim();
    if (!id) continue;
    vacByDoc[id] = new Set();
    dates.forEach((date, i) => {
      if (!date) return;
      const val = String(indData[r][i+1]||'').trim();
      if (val === 'VAC' || val === 'FORM') vacByDoc[id].add(date);
    });
  }
  const nonVides = Object.entries(vacByDoc).filter(([k,v]) => v.size > 0);
  Logger.log('MARs avec VAC: ' + nonVides.length);

  const groupSheet = ss.getSheetByName('GROUPES_VAC');
  const groupData = groupSheet.getDataRange().getValues();
  const groups = {A:[],B:[],C:[]}, ordre2026 = {A:{},B:{},C:{}};
  for (let r = 1; r < groupData.length; r++) {
    const grp = String(groupData[r][0]).trim(), id = String(groupData[r][1]).trim(), ord = Number(groupData[r][2]);
    if (!id || !groups[grp]) continue;
    groups[grp].push(id); ordre2026[grp][id] = ord;
  }
  const offset = year - 2026;
  function getOrd(grp) {
    const sorted = [...groups[grp]].sort((a,b) => ordre2026[grp][a] - ordre2026[grp][b]);
    const sh = offset % sorted.length;
    return [...sorted.slice(sh), ...sorted.slice(0, sh)];
  }
  const ordA = getOrd('A'), ordB = getOrd('B'), ordC = getOrd('C');

  const testDate = '2027-02-22';
  const ORDRE_BASE = {HIVER:'CAB',PRINTEMPS:'ABC',ETE:'ABC',TOUSSAINT:'BCA',NOEL:'CAB'};
  const base = ORDRE_BASE['HIVER'];
  const ga = base.split(''); const gs = offset % 3;
  const og = [...ga.slice(gs), ...ga.slice(0, gs)];
  const ol = []; og.forEach(g => { if (g==='A') ol.push(...ordA); else if (g==='B') ol.push(...ordB); else ol.push(...ordC); });
  const marEnVac = ol.filter(id => vacByDoc[id] && vacByDoc[id].has(testDate));
  Logger.log('MARs en VAC le ' + testDate + ': ' + marEnVac.length);

  // Tester le filtre des périodes
  const perSheet = ss.getSheetByName('PERIODES_VAC');
  const perData = perSheet.getDataRange().getValues();

  function premierJour(y) {
    const j = new Date(y,0,1); const d = j.getDay(); 
    const o = d===1?7:d===0?1:8-d; 
    const r = new Date(y,0,1+o); 
    return r.getFullYear()+'-'+String(r.getMonth()+1).padStart(2,'0')+'-'+String(r.getDate()).padStart(2,'0');
  }
  const debutAnnee = premierJour(year);
  const finAnnee = premierJour(year+1);
  Logger.log('debutAnnee: ' + debutAnnee + ' finAnnee: ' + finAnnee);
  
  for (let r = 1; r < perData.length; r++) {
    const nom = String(perData[r][0]).trim();
    const dr = perData[r][1];
    const debut = dr instanceof Date 
      ? dr.getFullYear()+'-'+String(dr.getMonth()+1).padStart(2,'0')+'-'+String(dr.getDate()).padStart(2,'0') 
      : String(dr).trim();
    const passe = debut >= debutAnnee && debut < finAnnee;
    Logger.log('Periode ' + nom + ' debut=' + debut + ' → ' + (passe ? '✅ incluse' : '❌ EXCLUE'));
  }
}
function testSetDailyStatusWrite() {
  const ADMIN = 'ADMINPLANNING';   // ← ton code admin (CONFIG ▸ ADMIN_CODE)
  const payload = {
    action: 'setDailyStatus', code: ADMIN,
    year: 2027, marId: 'FROHLICH', statut: 'CL',
    dates: ['2027-03-10', '2027-03-11'],
  };
  Logger.log(doGet({ parameter: { payload: JSON.stringify(payload) } }).getContent());
}
// ── Rendu HTML d'un récap d'indispos pour mail : synthèse + blocs par période ──
// synth  = [{n, label, bg, fg}]   (cartes du haut, n=0 → masquée)
// blocks = [{title, rows:[{label, bg, fg, dates:[ISO,...]}]}]
function renderRecapMailBlocks_(synth, blocks) {
  const MOIS_ABR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const fmtJour = ds => { const d=new Date(ds+'T12:00:00'); return d.getDate()+' '+MOIS_ABR[d.getMonth()]; };
  const fmtPlage = (a,b) => { if(a===b) return fmtJour(a); const da=new Date(a+'T12:00:00'),db=new Date(b+'T12:00:00'); if(da.getMonth()===db.getMonth()) return da.getDate()+' → '+db.getDate()+' '+MOIS_ABR[db.getMonth()]; return fmtJour(a)+' → '+fmtJour(b); };
  const toRanges = arr => { const j=arr.slice().sort(); const out=[]; if(!j.length) return out; let deb=j[0],prev=j[0]; for(let i=1;i<j.length;i++){ const d1=new Date(prev+'T12:00:00'); d1.setDate(d1.getDate()+1); if(d1.toISOString().slice(0,10)!==j[i]){ out.push([deb,prev]); deb=j[i]; } prev=j[i]; } out.push([deb,prev]); return out; };
  const rangesText = arr => toRanges(arr).map(r=>fmtPlage(r[0],r[1])).join('&nbsp;&nbsp;·&nbsp;&nbsp;');

  let synthHtml = '';
  if (synth && synth.length) {
    const cells = synth.filter(x=>x.n).map(x =>
      '<td style="padding:0 6px 0 0"><div style="background:'+x.bg+';border-radius:9px;padding:8px 12px;text-align:center"><div style="font-size:18px;font-weight:800;color:'+x.fg+';line-height:1">'+x.n+'</div><div style="font-size:10px;font-weight:600;color:'+x.fg+';text-transform:uppercase;letter-spacing:.4px;margin-top:2px">'+x.label+'</div></div></td>'
    ).join('');
    if (cells) synthHtml = '<table cellpadding="0" cellspacing="0" style="margin:4px 0 18px;width:100%"><tr>'+cells+'<td style="width:99%"></td></tr></table>';
  }

  const blocksHtml = blocks.map(blk => {
    const rows = (blk.rows||[]).filter(r=>r.dates&&r.dates.length).map(r =>
      '<tr><td style="padding:7px 12px 7px 0;vertical-align:top;white-space:nowrap;width:96px"><span style="display:inline-block;background:'+r.bg+';color:'+r.fg+';font-size:11px;font-weight:700;border-radius:6px;padding:3px 9px">'+r.label+'</span></td>'
      +'<td style="padding:7px 0;vertical-align:top;font-size:13px;color:#334155;line-height:1.55">'+rangesText(r.dates)+'</td></tr>'
    ).join('');
    if (!rows) return '';
    return '<div style="margin:0 0 12px;border:1px solid #e8edf3;border-radius:12px;overflow:hidden">'
      +'<div style="background:#f7f9fc;border-left:4px solid #ce1126;padding:9px 14px;font-size:13px;font-weight:700;color:#16202e">'+blk.title+'</div>'
      +'<table cellpadding="0" cellspacing="0" style="width:100%;padding:4px 14px 8px"><tbody>'+rows+'</tbody></table></div>';
  }).join('');

  return synthHtml + (blocksHtml || '<div style="color:#9aa4b2;font-style:italic;font-size:13px">Aucune indisponibilité enregistrée.</div>');
}
// ── Éligibles Noël/Jour de l'An (bandeau staff.html) ───────────────────
// Réutilise la rotation overdueKey du générateur : jamais-fait d'abord,
// puis l'année la plus ancienne. Exclut no_garde et PRUNET (souhait_plafond),
// et les MAR hors année planning (date_debut/date_fin).
// Seuils ajustables via CONFIG : NOEL_SEUIL_ANS (3), NOEL_PLANCHER (4), NOEL_PLAFOND (8).
function computeNoelAnEligibles(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let SEUIL = 3, PLANCHER = 4, PLAFOND = 8;
  const cfg = ss.getSheetByName('CONFIG');
  if (cfg) {
    const cd = cfg.getDataRange().getValues();
    const getN = k => { for (let r=1;r<cd.length;r++){ if(String(cd[r][0]).trim()===k){ const v=parseInt(String(cd[r][1]).trim()); if(!isNaN(v)) return v; } } return null; };
    const a=getN('NOEL_SEUIL_ANS'); if(a!=null) SEUIL=a;
    const b=getN('NOEL_PLANCHER');  if(b!=null) PLANCHER=b;
    const c=getN('NOEL_PLAFOND');   if(c!=null) PLAFOND=c;
  }

  const FLAGS = getMedecinFlags();
  const planStart = toDateStr(getPremierJourPlanning(year));
  const planEnd   = toDateStr(new Date(getPremierJourPlanning(year + 1).getTime() - 86400000));
  const horsAnnee = id => { const dd=FLAGS.dateDebut[id], df=FLAGS.dateFin[id]; if(df && df<planStart) return true; if(dd && dd>planEnd) return true; return false; };

  // Effectif éligible : actifs − no_garde − PRUNET − hors année
  const initMap = {}, eligibles = [];
  const med = ss.getSheetByName('MEDECINS');
  if (med) {
    const md = med.getDataRange().getValues();
    for (let r=1;r<md.length;r++){
      const id = String(md[r][0]).trim(); if(!id || id==='DRUGE') continue;
      initMap[id] = String(md[r][2]||'').trim() || id;
      if (String(md[r][3]).trim().toUpperCase() !== 'O') continue;
      if (FLAGS.noGarde.has(id)) continue;
      if (FLAGS.souhaitPlafond.has(id)) continue;
      if (horsAnnee(id)) continue;
      eligibles.push(id);
    }
  }

  // Historique Noël/An : source unique getNoelHistory(year) = HISTORIQUE ∪ onglets
  // GARDES_{Y} présents (voir code.gs). Prend en compte l'année générée mais pas
  // encore archivée, pour ne pas re-proposer qui vient de faire Noël l'an passé.
  const noelHistory = getNoelHistory(year);

  const overdueKey = m => { const ly=noelHistory[m]; return ly==null ? [0,0,m] : [1,ly,m]; };
  const cmp = (a,b)=>a[0]-b[0]||a[1]-b[1]||(a[2]<b[2]?-1:a[2]>b[2]?1:0);
  eligibles.sort((a,b)=>cmp(overdueKey(a),overdueKey(b)));

  // "En retard" = jamais fait OU pas fait depuis ≥ SEUIL ans
  const enRetard = eligibles.filter(id => { const ly=noelHistory[id]; return ly==null || (year-ly)>=SEUIL; });
  let finalIds = enRetard.slice();
  if (finalIds.length < PLANCHER) finalIds = eligibles.slice(0, PLANCHER);
  finalIds = finalIds.slice(0, PLAFOND);

  return finalIds.map(id => ({ id, init: initMap[id]||id, last: (noelHistory[id]!=null ? noelHistory[id] : null) }));
}
