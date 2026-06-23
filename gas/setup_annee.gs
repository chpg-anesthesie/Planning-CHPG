// ═══ Détection du "concept" d'une période d'après son nom ═══
function conceptDe(s){
  s = String(s||'');
  if (/toussaint/i.test(s)) return 'toussaint';
  if (/no[eë]l/i.test(s)) return 'noel';
  if (/hiver|f[ée]vrier/i.test(s)) return 'hiver';
  if (/printemps|p[âa]ques/i.test(s)) return 'printemps';
  if (/[ée]t[ée]/i.test(s)) return 'ete';
  return null;
}
var _NOMS_VAC = { toussaint:'Toussaint', noel:'Noël', hiver:'Hiver', printemps:'Printemps', ete:'Été' };

// Calcule les périodes proposées pour `year` (API Nice/Zone B + filet). LECTURE SEULE.
function proposerVacances(year, zone) {
  zone = zone || 'Zone B';
  const out = [];
  function present(concept, anchorYear) {
    return out.some(function(p){ return conceptDe(p.nom) === concept && String(p.debut).startsWith(String(anchorYear) + '-'); });
  }
  const base = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records';
  [(year-1)+'-'+year, year+'-'+(year+1)].forEach(function(as) {
    const url = base + '?limit=20'
      + '&refine=' + encodeURIComponent('zones:"' + zone + '"')
      + '&refine=' + encodeURIComponent('population:"Élèves"')
      + '&refine=' + encodeURIComponent('population:"-"')
      + '&refine=' + encodeURIComponent('annee_scolaire:"' + as + '"');
    let data;
    try {
      const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (resp.getResponseCode() !== 200) { Logger.log('API ' + resp.getResponseCode() + ' ' + as); return; }
      data = JSON.parse(resp.getContentText());
    } catch (e) { Logger.log('Échec API ' + as + ' : ' + e.message); return; }
    (data.results || []).forEach(function(r) {
      if (!r.start_date || !r.end_date) return;
      const concept = conceptDe(r.description || '');
      const isEte = concept === 'ete';
      const startRaw = new Date(r.start_date), endRaw = new Date(r.end_date);
      if ((endRaw - startRaw)/86400000 < 2 && !isEte) return;
      const debut = Utilities.formatDate(startRaw, 'Europe/Paris', 'yyyy-MM-dd');
      if (!debut.startsWith(String(year))) return;
      let fin;
      if (isEte) { fin = debut.slice(0,4) + '-08-31'; }
      else {
        const f = new Date(Utilities.formatDate(endRaw, 'Europe/Paris', 'yyyy-MM-dd') + 'T12:00:00');
        f.setDate(f.getDate() - 1); fin = toDateStr(f);
      }
      const anchorYear = Number(debut.slice(0,4));
      if (concept && present(concept, anchorYear)) return;
      out.push({ nom: _NOMS_VAC[concept] || (r.description || 'Vacances'), debut: debut, fin: fin, seuil: isEte ? 12 : 8, estime: false });
    });
  });
  const REPERES = [
    { concept:'hiver',     nom:'Hiver',     debut:year+'-02-08', fin:year+'-02-23',     seuil:8  },
    { concept:'printemps', nom:'Printemps', debut:year+'-04-05', fin:year+'-04-20',     seuil:8  },
    { concept:'ete',       nom:'Été',       debut:year+'-07-05', fin:year+'-08-31',     seuil:12 },
    { concept:'toussaint', nom:'Toussaint', debut:year+'-10-18', fin:year+'-11-02',     seuil:8  },
    { concept:'noel',      nom:'Noël',      debut:year+'-12-19', fin:(year+1)+'-01-04', seuil:8  }
  ];
  REPERES.forEach(function(p){ if (!present(p.concept, year)) out.push({ nom:p.nom, debut:p.debut, fin:p.fin, seuil:p.seuil, estime:true }); });
  out.sort(function(a,b){ return a.debut < b.debut ? -1 : 1; });
  return out;
}

// Écrit dans PERIODES_VAC les périodes de `year` absentes (non destructif). Sans popup.
function importerVacancesScolaires_core(year, zone) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PERIODES_VAC');
  if (!sheet) { sheet = ss.insertSheet('PERIODES_VAC'); sheet.getRange(1,1,1,4).setValues([['NOM','DEBUT','FIN','SEUIL']]).setFontWeight('bold'); }
  const existing = sheet.getDataRange().getValues().slice(1).map(function(r){
    const d = r[1] instanceof Date ? toDateStr(r[1]) : String(r[1]).trim();
    return { concept: conceptDe(r[0]), debut: d };
  }).filter(function(x){ return x.debut; });
  const propose = proposerVacances(year, zone);
  const ajout = []; const estimes = [];
  propose.forEach(function(p){
    const concept = conceptDe(p.nom);
    const anchorYear = Number(String(p.debut).slice(0,4));
    const dejaLa = existing.some(function(x){ return x.concept === concept && String(x.debut).startsWith(anchorYear + '-'); })
                || ajout.some(function(a){ return conceptDe(a[0]) === concept && String(a[1]).startsWith(anchorYear + '-'); });
    if (dejaLa) return;
    ajout.push([p.nom, p.debut, p.fin, p.seuil]);
    if (p.estime) estimes.push(p.nom);
  });
  if (ajout.length) {
    ajout.sort(function(a,b){ return a[1] < b[1] ? -1 : 1; });
    sheet.getRange(sheet.getLastRow()+1, 1, ajout.length, 4).setValues(ajout);
  }
  return { ajoutes: ajout.length, estimes: estimes };
}

// Lanceur manuel (popup), pour l'éditeur
function importerVacancesScolaires(year, zone) {
  const res = importerVacancesScolaires_core(year, zone);
  let msg = res.ajoutes ? ('✅ ' + res.ajoutes + ' période(s) ajoutée(s) pour ' + year + '.') : 'ℹ️ Rien à ajouter (tout est déjà présent).';
  if (res.estimes.length) msg += '\n\nDates estimées (à caler) : ' + res.estimes.join(', ') + '.';
  SpreadsheetApp.getUi().alert(msg);
}
function IMPORT_vac() { importerVacancesScolaires(2027); }
// ── SETUP ANNÉE ────────────────────────────────────────────────────────
function setupAnnee(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  year = year || 2027;

  const medSheetSetup = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('MEDECINS');
  const DOCTORS_LIST = [];
  if (medSheetSetup) {
    const medDataSetup = medSheetSetup.getDataRange().getValues();
    for (let r = 1; r < medDataSetup.length; r++) {
      const id = String(medDataSetup[r][0]).trim();
      const actif = String(medDataSetup[r][3]).trim().toUpperCase() === 'O';
      if (id && actif) DOCTORS_LIST.push(id);
    }
  }

  // Générer tous les jours de l'année planning (premier lundi jan → veille premier lundi jan N+1)
  const jan1 = new Date(year, 0, 1);
  const dow1 = jan1.getDay();
  const offsetJ1 = dow1 === 1 ? 7 : dow1 === 0 ? 1 : 8 - dow1;
  const startDate = new Date(year, 0, 1 + offsetJ1, 12, 0, 0);

  const jan1Next = new Date(year + 1, 0, 1);
  const dow1Next = jan1Next.getDay();
  const offsetNext = dow1Next === 1 ? 7 : dow1Next === 0 ? 1 : 8 - dow1Next;
  const endDate = new Date(year + 1, 0, offsetNext); // veille du premier lundi N+1

  const allDays = [];
  const dt = new Date(startDate);
  while (dt <= endDate) {
    allDays.push({
      date: `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`,
      day: dt.getDate(),
      month: dt.getMonth(),
      dow: dt.getDay(),
      isWeekend: dt.getDay() === 0 || dt.getDay() === 6,
    });
    dt.setDate(dt.getDate() + 1);
  }

  const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin',
                     'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const DAYS_INIT = ['D','L','M','M','J','V','S'];
  const RED = '#CE1126';
  const WHITE = '#FFFFFF';
  const GREY_WE = '#CFD8DC';
  const BLANC = '#FFFFFF';

  // ── 1. INDISPOS_YYYY ────────────────────────────────────────────────
  const indisposName = `INDISPOS_${year}`;
  let indSheet = ss.getSheetByName(indisposName);
  if (indSheet) {
    // Garde-fou : ne JAMAIS écraser des indispos déjà saisies sans confirmation.
    const last = indSheet.getLastRow(), lastC = indSheet.getLastColumn();
    let saisies = 0;
    if (last >= 4 && lastC >= 2) {
      const vals = indSheet.getRange(4, 2, last - 3, lastC - 1).getValues();
      saisies = vals.reduce((n, row) => n + row.filter(c => String(c).trim()).length, 0);
    }
    if (saisies > 0) {
      const ui = SpreadsheetApp.getUi();
      const rep = ui.alert(`⚠️ ${indisposName} contient déjà ${saisies} saisie(s)`,
        `Relancer W1 va TOUT effacer et recréer une grille vide.\n\nContinuer quand même ?`,
        ui.ButtonSet.YES_NO);
      if (rep !== ui.Button.YES) { ui.alert('Annulé — la grille existante est conservée.'); return; }
    }
    ss.deleteSheet(indSheet);
  }
  indSheet = ss.insertSheet(indisposName);
  indSheet.setFrozenRows(3);

  const nCols = allDays.length + 1;

  // Ligne 1 : mois fusionnés
  const row1 = ['MÉDECIN']; allDays.forEach(() => row1.push(''));
  indSheet.getRange(1, 1, 1, nCols).setValues([row1]);
  indSheet.getRange(1, 1).setFontWeight('bold').setBackground(RED).setFontColor(WHITE);

  let mStart = 2, prevMonth = allDays[0].month;
  allDays.forEach((day, i) => {
    const col = i + 2, isLast = i === allDays.length - 1;
    if (day.month !== prevMonth || isLast) {
      const mEnd = (day.month !== prevMonth) ? col - 1 : col;
      if (mEnd >= mStart) indSheet.getRange(1, mStart, 1, mEnd - mStart + 1).merge();
      indSheet.getRange(1, mStart).setValue(`${MONTHS_FR[prevMonth]} ${prevMonth < allDays[0].month || mStart === 2 ? year : year + 1}`)
        .setBackground(RED).setFontColor(WHITE).setFontWeight('bold').setHorizontalAlignment('center');
      mStart = col; prevMonth = day.month;
    }
  });

  // Ligne 2 : initiales jours
  const row2 = ['JOUR']; allDays.forEach(d => row2.push(DAYS_INIT[d.dow]));
  indSheet.getRange(2, 1, 1, nCols).setValues([row2]);
  indSheet.getRange(2, 1).setFontWeight('bold').setBackground(RED).setFontColor(WHITE);

  // Ligne 3 : numéros jours
  const row3 = ['N°']; allDays.forEach(d => row3.push(d.day));
  indSheet.getRange(3, 1, 1, nCols).setValues([row3]);
  indSheet.getRange(3, 1).setFontWeight('bold').setBackground(RED).setFontColor(WHITE);

  // Données MAR
  const medRows = DOCTORS_LIST.map(id => [id, ...Array(allDays.length).fill('')]);
  indSheet.getRange(4, 1, medRows.length, nCols).setValues(medRows);

  // Weekends en gris + bordures mensuelles
  const jfSetup = getJoursFeries(year);
  const jfSetupNext = getJoursFeries(year + 1);
  allDays.forEach((day, i) => {
    const col = i + 2;
    const isWE = day.dow === 0 || day.dow === 6;
    const isFerie = jfSetup.has(day.date) || jfSetupNext.has(day.date);
    if (isWE || isFerie) indSheet.getRange(1, col, 3 + medRows.length, 1).setBackground(GREY_WE);
    const nextDay = allDays[i + 1];
    if (!nextDay || nextDay.month !== day.month) {
      indSheet.getRange(1, col, 3 + medRows.length, 1)
        .setBorder(null, null, null, true, null, null, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  });

  indSheet.setColumnWidth(1, 120);
  for (let c = 2; c <= nCols; c++) indSheet.setColumnWidth(c, 35);
  indSheet.getRange(1, 2, 3 + medRows.length, nCols - 1).setHorizontalAlignment('center');
  Logger.log(`✅ ${indisposName} créé (${allDays.length} jours)`);

  // ── 2. AFFECTATIONS_YYYY ────────────────────────────────────────────
  const affName = `AFFECTATIONS_${year}`;
  let affSheet = ss.getSheetByName(affName);
  if (affSheet) ss.deleteSheet(affSheet);
  affSheet = ss.insertSheet(affName);

  const MONTHS_SHORT = ['JAN','FEV','MARS','AVRIL','MAI','JUIN',
                        'JUILLET','AOUT','SEPT','OCT','NOV','DEC'];
  const affHeaders = ['MÉDECIN', ...MONTHS_SHORT.map(m => `${m} ${year}`)];
  affSheet.getRange(1, 1, 1, affHeaders.length).setValues([affHeaders]);
  affSheet.getRange(1, 1, 1, affHeaders.length)
    .setFontWeight('bold').setBackground(RED).setFontColor(WHITE).setHorizontalAlignment('center');
  affSheet.setColumnWidth(1, 140);
  for (let c = 2; c <= affHeaders.length; c++) affSheet.setColumnWidth(c, 90);
  affSheet.setFrozenRows(1);
  affSheet.setFrozenColumns(1);

  const affRows = DOCTORS_LIST.map(id => [id, ...Array(12).fill('VOLANT')]);
  affSheet.getRange(2, 1, affRows.length, affHeaders.length).setValues(affRows);
  affSheet.getRange(2, 2, affRows.length, 12).setFontColor('#64748B').setHorizontalAlignment('center');
  Logger.log(`✅ ${affName} créé`);

  // ── 3. CONFIG ────────────────────────────────────────────────────────
  let configSheet = ss.getSheetByName('CONFIG');
  if (!configSheet) {
    configSheet = ss.insertSheet('CONFIG');
    configSheet.getRange(1,1,1,2).setValues([['PARAMETRE','VALEUR']]);
    configSheet.getRange(1,1,1,2).setFontWeight('bold').setBackground(RED).setFontColor(WHITE);
    configSheet.getRange(2,1,1,2).setValues([['ANNEE_ACTIVE', year]]);
    configSheet.setColumnWidth(1, 180);
    configSheet.setColumnWidth(2, 120);
  } else {
    const configData = configSheet.getDataRange().getValues();
    let found = false;
    for (let r = 1; r < configData.length; r++) {
      if (configData[r][0] === 'ANNEE_ACTIVE') {
        configSheet.getRange(r+1, 2).setValue(year);
        found = true; break;
      }
    }
    if (!found) configSheet.appendRow(['ANNEE_ACTIVE', year]);
  }
  Logger.log(`✅ CONFIG : ANNEE_ACTIVE = ${year}`);

  // ── 4. PERIODES_VAC : import (proposition) des vacances scolaires ──
  const _vac = importerVacancesScolaires_core(year);
  let _vacMsg = `• PERIODES_VAC : ${_vac.ajoutes} période(s) ajoutée(s)`;
  if (_vac.estimes.length) _vacMsg += ` (à caler : ${_vac.estimes.join(', ')})`;
  _vacMsg += `\n`;

  SpreadsheetApp.getUi().alert(
    `✅ Setup ${year} terminé !\n\n` +
    `• ${indisposName} créé (${allDays.length} jours)\n` +
    `• ${affName} créé (à remplir)\n` +
    `• CONFIG : ANNEE_ACTIVE = ${year}\n` +
    _vacMsg + `\n` +
    `Prochaines étapes :\n` +
    `1. Vérifier/ajuster PERIODES_VAC (dates de vacances)\n` +
    `2. Remplir ${affName} avec les secteurs des MAR\n` +
    `3. Les MAR saisissent leurs indispos sur indispos.html\n` +
    `4. Lancer generateGardes()`
  );
}

// ── ARCHIVAGE ANNÉE N ──────────────────────────────────────────────────

function archiveYear(year, moveSheets) {
  if (moveSheets === undefined) moveSheets = true;
  if (!year) { try{SpreadsheetApp.getUi().alert("❌ Préciser l'année. Ex : archiveYear(2026)");}catch(e){} return "❌ année manquante"; }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const GITHUB_USER='chpg-anesthesie', GITHUB_REPO='Planning-CHPG', GITHUB_BRANCH='main';
  const results = [];

  function pushFile(path, content){
    const apiUrl=`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
    let sha='';
    try{ const g=UrlFetchApp.fetch(apiUrl,{headers:{Authorization:`token ${getGithubToken()}`},muteHttpExceptions:true});
      if(g.getResponseCode()===200) sha=JSON.parse(g.getContentText()).sha; }catch(e){}
    const body={message:`Archive ${year} — ${path} — ${new Date().toISOString()}`,
      content:Utilities.base64Encode(Utilities.newBlob(content).getBytes()), branch:GITHUB_BRANCH};
    if(sha) body.sha=sha;
    const r=UrlFetchApp.fetch(apiUrl,{method:'PUT',headers:{Authorization:`token ${getGithubToken()}`,'Content-Type':'application/json'},payload:JSON.stringify(body),muteHttpExceptions:true});
    const c=r.getResponseCode();
    if(c===200||c===201){Logger.log(`✅ ${path} poussé`);return true;}
    Logger.log(`❌ GitHub ${c} ${path}: ${r.getContentText().slice(0,200)}`); return false;
  }

  // ── 1. STATS_GARDES_N → HISTORIQUE (append idempotent) + sauvegarde JSON ──
  const st = ss.getSheetByName(`STATS_GARDES_${year}`);
  if (!st) {
    results.push(`❌ STATS_GARDES_${year} introuvable — archivage interrompu`);
  } else {
    const d = st.getDataRange().getValues();
    const Hd = d[0].map(x=>String(x).trim());
    const get = (r,n)=>{ const i=Hd.indexOf(n); return i<0?'':d[r][i]; };
    const num = (r,n)=>Number(get(r,n))||0;

    // a) Alimenter HISTORIQUE (créé si absent)
    let h = ss.getSheetByName('HISTORIQUE');
    if (!h) { h = ss.insertSheet('HISTORIQUE');
      h.getRange(1,1,1,18).setValues([['ID','ANNEE','TOTAL','G','G2','LUN','MAR','MER','JEU','VEN','SAM','DIM','VD','VEILLE JF','JF','NOEL/AN','RECUP R','18H']]).setFontWeight('bold');
      h.setFrozenRows(1); h.setColumnWidth(1,140); }
    const hd = h.getDataRange().getValues();
    const seen = new Set();
    for (let r=1;r<hd.length;r++){ const id=String(hd[r][0]).trim(); if(id) seen.add(`${id}|${hd[r][1]}`); }
    const hrows=[];
    for (let r=1;r<d.length;r++){
      const id=String(d[r][0]).trim(); if(!id) continue;
      if (seen.has(`${id}|${year}`)) continue;
      hrows.push([id,year, num(r,'TOTAL G'),num(r,'G (REA)'),num(r,'G2 (MAT)'),
        num(r,'LUN'),num(r,'MAR'),num(r,'MER'),num(r,'JEU'),num(r,'VEN'),num(r,'SAM'),num(r,'DIM'),
        num(r,'VD'),num(r,'VEILLE JF'),num(r,'JF'),num(r,'NOEL/AN'),num(r,'RECUP R'),num(r,'18H')]);
    }
    if (hrows.length){ h.getRange(h.getLastRow()+1,1,hrows.length,18).setValues(hrows);
      results.push(`✅ HISTORIQUE : ${hrows.length} ligne(s) ${year} ajoutée(s)`); }
    else results.push(`ℹ️ HISTORIQUE : ${year} déjà présent`);

    // b) Sauvegarde JSON (rangée dans archives/)
    const statsObj = d.slice(1).filter(row=>String(row[0]).trim()).map(row=>{ const o={}; Hd.forEach((hn,i)=>o[hn]=row[i]); return o; });
    const ok1 = pushFile(`archives/stats_${year}.json`, JSON.stringify({year, stats:statsObj}, null, 2));
    results.push(ok1?`✅ archives/stats_${year}.json`:`❌ push stats échoué`);
  }

  // ── 2. INDISPOS_N → sauvegarde JSON ──
  const ind = ss.getSheetByName(`INDISPOS_${year}`);
  if (ind) {
    const idd = ind.getDataRange().getValues();
    const dates = reconstruireDatesHeaders(idd, year);
    const indispos={};
    for (let r=3;r<idd.length;r++){ const id=String(idd[r][0]).trim(); if(!id) continue; indispos[id]={};
      dates.forEach((dt,i)=>{ if(!dt) return; const v=String(idd[r][i+1]||'').trim(); if(v) indispos[id][dt]=v; }); }
    const ok2 = pushFile(`archives/indispos_${year}.json`, JSON.stringify({year, indispos}, null, 2));
    results.push(ok2?`✅ archives/indispos_${year}.json`:`❌ push indispos échoué`);
  } else results.push(`⚠️ INDISPOS_${year} introuvable — ignoré`);

  // ── 3. Déplacer les onglets de l'année vers le classeur d'archive ──
  // Le maître reste propre ; la dette N+1 retrouve STATS_GARDES_N via le repli ARCHIVE_SS_ID.
  const archiveOk = results.every(r=>!r.startsWith('❌'));
  if (moveSheets && archiveOk) {
    let arch=null;
    try{ arch=SpreadsheetApp.openById(ARCHIVE_SS_ID); }catch(e){ results.push(`⚠️ Classeur d'archive inaccessible — onglets conservés`); }
    if (arch) {
      [`GARDES_${year}`,`INDISPOS_${year}`,`AFFECTATIONS_${year}`,`STATS_GARDES_${year}`].forEach(name=>{
        const sh=ss.getSheetByName(name);
        if(!sh){ results.push(`⚠️ ${name} introuvable — ignoré`); return; }
        try{ const old=arch.getSheetByName(name); if(old) arch.deleteSheet(old);
          sh.copyTo(arch).setName(name); ss.deleteSheet(sh); results.push(`📦 ${name} → archive`); }
        catch(e){ results.push(`⚠️ Transfert ${name} échoué : ${e.message}`); }
      });
    }
  } else if (moveSheets) results.push(`⏸️ Transfert suspendu (archivage incomplet)`);

  const rapport = results.join('\n');
  Logger.log(`\n── Archivage ${year} ──\n${rapport}`);
  try{ SpreadsheetApp.getUi().alert(`Archivage ${year}\n\n${rapport}`); }catch(e){}
  return rapport;
}
function archiveYear2026() {
  archiveYear(2026);
}
function normalizeAffectations2026() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('AFFECTATIONS_2026');
  if (!sheet) { Logger.log('❌ AFFECTATIONS_2026 introuvable'); return; }

  const data = sheet.getDataRange().getValues();
  const MONTH_HEADERS = ['JAN 2026','FEV 2026','MARS 2026','AVRIL 2026','MAI 2026','JUIN 2026',
                         'JUILLET 2026','AOUT 2026','SEPT 2026','OCT 2026','NOV 2026','DEC 2026'];
  const SECTOR_MAP = {
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
  const ID_MAP = {
    'DR ALBOUY':'ALBOUY','DR ARMAND':'ARMAND','DR ARMANDO':'ARMANDO',
    'DR BONNET':'BONNET','DR BOUREGBA':'BOUREGBA','DR CATINEAU':'CATINEAU',
    'DR FROHLICH':'FROHLICH','DR FERRIERO':'FERRIERO','DR GHIGLIONE':'GHIGLIONE',
    'DR GUERIN':'GUERIN','DR LEVASSEUR':'LEVASSEUR','DR LEY':'LEY',
    'DR MENADE':'MENADE','DR OPPRECHT':'OPPRECHT','DR PARTOUCHE':'PARTOUCHE',
    'DR ROUSSEAU':'ROUSSEAU','DR SALA':'SALA','DR SEVERAC':'SEVERAC',
    'DR SULTAN':'SULTAN','DR SUPLY':'SUPLY','DR WIDEHEM':'WIDEHEM',
    'DR ZAMARON':'ZAMARON','DR TRAN':'TRAN','PR PRUNET':'PRUNET',
    'DR GARCIA':'GARCIA',
  };

  // Réécrire ligne 1 : en-têtes
  sheet.getRange(1, 1, 1, 13).setValues([['MÉDECIN', ...MONTH_HEADERS]]);

  // Réécrire les lignes de données
  for (let r = 1; r < data.length; r++) {
    const rawName = String(data[r][0] || '').trim();
    if (!rawName) continue;
    const id = ID_MAP[rawName.toUpperCase()] || 
               ID_MAP['DR ' + rawName.toUpperCase()] ||
               rawName.toUpperCase().replace('DR ','').replace('PR ','').trim();
    sheet.getRange(r + 1, 1).setValue(id);

    // Normaliser les 12 secteurs
    for (let c = 1; c <= 12; c++) {
      const raw = String(data[r][c] || '').trim().toUpperCase();
      const normalized = SECTOR_MAP[raw] || (raw ? 'VOLANT' : '');
      if (normalized) sheet.getRange(r + 1, c + 1).setValue(normalized);
    }
  }

  Logger.log('✅ AFFECTATIONS_2026 normalisé');
  SpreadsheetApp.getUi().alert('✅ AFFECTATIONS_2026 normalisé — noms et secteurs mis à jour.');
}
// ── AMORÇAGE (une fois) : crée HISTORIQUE et le remplit avec l'existant ──
function creerHistorique() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName('HISTORIQUE');
  if (!h) { h = ss.insertSheet('HISTORIQUE');
    h.getRange(1,1,1,18).setValues([['ID','ANNEE','TOTAL','G','G2','LUN','MAR','MER','JEU','VEN','SAM','DIM','VD','VEILLE JF','JF','NOEL/AN','RECUP R','18H']]).setFontWeight('bold');
    h.setFrozenRows(1); h.setColumnWidth(1,140); }
  const hd = h.getDataRange().getValues();
  const seen = new Set();
  for (let r=1;r<hd.length;r++){ const id=String(hd[r][0]).trim(); if(id) seen.add(`${id}|${hd[r][1]}`); }
  const rows=[];

  // 1) Lignes complètes depuis chaque STATS_GARDES_YYYY présent
  ss.getSheets().forEach(sh=>{
    const m = sh.getName().match(/^STATS_GARDES_(\d{4})$/); if(!m) return;
    const year=Number(m[1]);
    const d=sh.getDataRange().getValues(); const Hd=d[0].map(x=>String(x).trim());
    const num=(r,n)=>{ const i=Hd.indexOf(n); return i<0?0:(Number(d[r][i])||0); };
    for(let r=1;r<d.length;r++){ const id=String(d[r][0]).trim(); if(!id||seen.has(`${id}|${year}`)) continue;
      rows.push([id,year,num(r,'TOTAL G'),num(r,'G (REA)'),num(r,'G2 (MAT)'),
        num(r,'LUN'),num(r,'MAR'),num(r,'MER'),num(r,'JEU'),num(r,'VEN'),num(r,'SAM'),num(r,'DIM'),
        num(r,'VD'),num(r,'VEILLE JF'),num(r,'JF'),num(r,'NOEL/AN'),num(r,'RECUP R'),num(r,'18H')]);
      seen.add(`${id}|${year}`); }
  });

  // 2) Mémoire Noël/An antérieure (NOEL_AN_HISTORIQUE) : lignes minimales NOEL/AN=1
  //    pour les années sans STATS (ex. 2023-2025). Les autres colonnes restent vides.
  const nh = ss.getSheetByName('NOEL_AN_HISTORIQUE');
  if (nh){ const nd=nh.getDataRange().getValues();
    for(let r=1;r<nd.length;r++){ const id=String(nd[r][0]).trim(); const y=Number(nd[r][1])||0;
      if(!id||!y||seen.has(`${id}|${y}`)) continue;
      rows.push([id,y,'','','','','','','','','','','','','',1,'','']); seen.add(`${id}|${y}`); }
  }

  if(rows.length) h.getRange(h.getLastRow()+1,1,rows.length,18).setValues(rows);
  try{ SpreadsheetApp.getUi().alert(`✅ HISTORIQUE amorcé : ${rows.length} ligne(s) ajoutée(s).`); }catch(e){}
  return `${rows.length} lignes`;
}
// ═══════ TEST — À SUPPRIMER AVANT LA MISE EN SERVICE ═══════
function TEST_remplirIndispos(year, scenario) {
  scenario = scenario || 'normal';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(`INDISPOS_${year}`);
  if (!sh) { SpreadsheetApp.getUi().alert(`❌ INDISPOS_${year} absent — lance d'abord W1.`); return; }
  const data = sh.getDataRange().getValues();
  const dates = reconstruireDatesHeaders(data, year);
  const nCol = dates.length;
  const dow = dates.map(d => d ? new Date(d+'T12:00:00').getDay() : -1);
  const P = ({normal:{vac:6,form:3,ind:4,souh:4}, charge:{vac:8,form:5,ind:7,souh:6},
              leger:{vac:4,form:1,ind:2,souh:2}})[scenario] || {vac:6,form:3,ind:4,souh:4};
  const rint = n => Math.floor(Math.random()*n);
  const lundis = []; for (let c=0;c<nCol;c++) if (dow[c]===1) lundis.push(c);
  for (let r=3; r<data.length; r++) {
    const id = String(data[r][0]).trim(); if (!id) continue;
    const row = []; for (let c=0;c<nCol;c++) row[c] = String(data[r][c+1]||'');
    let posees=0; const ls=lundis.slice();
    for (let k=ls.length-1;k>0;k--){const j=rint(k+1);[ls[k],ls[j]]=[ls[j],ls[k]];}
    for (const L of ls) { if (posees>=P.vac) break; const dur=(Math.random()<0.5?1:2); let ok=true;
      for (let c=L;c<Math.min(L+dur*7,nCol);c++) if (row[c]) ok=false;
      if (!ok) continue; for (let c=L;c<Math.min(L+dur*7,nCol);c++) if(dates[c]) row[c]='VAC'; posees+=dur; }
    for (let k=0;k<P.form;k++){ const c=rint(nCol); if(dates[c]&&!row[c]&&dow[c]>=1&&dow[c]<=5) row[c]='FORM'; }
    for (let k=0;k<P.ind;k++){ const c=rint(nCol); if(dates[c]&&!row[c]) row[c]='INDISPO'; }
    let s=P.souh; for (let t=0;t<80 && s>0;t++){ const c=rint(nCol);
      if(dates[c]&&!row[c]&&dow[c]>=1&&dow[c]<=3){ row[c]='SOUHAIT'; s--; } }
    sh.getRange(r+1, 2, 1, nCol).setValues([row]);
  }
  SpreadsheetApp.getUi().alert(`✅ INDISPOS_${year} rempli (« ${scenario} »). Lance W2 puis W3.`);
}
function TEST_run() {
  const ANNEE    = 2027;       // ← change l'année ici
  const SCENARIO = 'charge';   // 'normal' | 'charge' | 'leger'
  TEST_remplirIndispos(ANNEE, SCENARIO);
}
function TEST_W2() { generateGardes(2029); }      // génère le planning
function TEST_W3_safe()  { archiveYear(2029, false); }  // itération rapide
function TEST_W3_reel()  { archiveYear(2027, true);  }  // test du déplacement réel
