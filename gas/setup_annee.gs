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
  if (indSheet) ss.deleteSheet(indSheet);
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

  SpreadsheetApp.getUi().alert(
    `✅ Setup ${year} terminé !\n\n` +
    `• ${indisposName} créé (${allDays.length} jours)\n` +
    `• ${affName} créé (à remplir)\n` +
    `• CONFIG : ANNEE_ACTIVE = ${year}\n\n` +
    `Prochaines étapes :\n` +
    `1. Remplir ${affName} avec les secteurs des MAR\n` +
    `2. Les MAR saisissent leurs indispos sur indispos.html\n` +
    `3. Lancer generateGardes()`
  );
}

// ── ARCHIVAGE ANNÉE N ──────────────────────────────────────────────────
// Phase 1 (active)  : push stats_N.json + indispos_N.json sur GitHub
// Phase 2 (commentée) : suppression des onglets N du GSheet — à décommenter en janvier N+1
function archiveYear(year) {
  if (!year) {
    SpreadsheetApp.getUi().alert('❌ Préciser l\'année à archiver. Ex : archiveYear(2026)');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const GITHUB_USER = 'chpg-anesthesie';
  // (C3) getGithubToken() imbriqué retiré — on utilise la version globale (code.gs).
  const GITHUB_REPO = 'Planning-CHPG';
  const GITHUB_BRANCH = 'main';
  const results = [];

  // ── HELPER PUSH GITHUB ──────────────────────────────────────────────
  function pushFile(fileName, content) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${fileName}`;
    let sha = '';
    try {
      const getResp = UrlFetchApp.fetch(apiUrl, {
        headers: {Authorization: `token ${getGithubToken()}`},
        muteHttpExceptions: true
      });
      if (getResp.getResponseCode() === 200) sha = JSON.parse(getResp.getContentText()).sha;
    } catch(e) {}

    const body = {
      message: `Archive ${year} — ${fileName} — ${new Date().toISOString()}`,
      content: Utilities.base64Encode(Utilities.newBlob(content).getBytes()),
      branch: GITHUB_BRANCH,
    };
    if (sha) body.sha = sha;

    const resp = UrlFetchApp.fetch(apiUrl, {
      method: 'PUT',
      headers: {Authorization: `token ${getGithubToken()}`, 'Content-Type': 'application/json'},
      payload: JSON.stringify(body),
      muteHttpExceptions: true
    });
    const code = resp.getResponseCode();
    if (code === 200 || code === 201) {
      Logger.log(`✅ ${fileName} pushé sur GitHub`);
      return true;
    } else {
      Logger.log(`❌ GitHub error ${code} pour ${fileName}: ${resp.getContentText().slice(0,200)}`);
      return false;
    }
  }

  // ── 1. PUSH stats_N.json ────────────────────────────────────────────
  const statsSheet = ss.getSheetByName(`STATS_GARDES_${year}`);
  const gardesSheet = ss.getSheetByName(`GARDES_${year}`);
  if (!statsSheet) {
    results.push(`❌ Onglet STATS_GARDES_${year} introuvable`);
  } else {
    // ── Stats initiales depuis STATS_GARDES_YYYY ──
    const statsData = statsSheet.getDataRange().getValues();
    const headers = statsData[0].map(h => String(h).trim());
    const statsInitiales = {};
    for (let r = 1; r < statsData.length; r++) {
      const id = String(statsData[r][0]).trim();
      if (!id) continue;
      statsInitiales[id] = {};
      headers.forEach((h, i) => { statsInitiales[id][h] = statsData[r][i]; });
    }

    // ── Stats réelles recomptées depuis GARDES_YYYY ──
    const statsReelles = {};
    if (gardesSheet) {
      const gardesData = gardesSheet.getDataRange().getValues();

      // Reconstruire les jours avec dates
      const joursFeries = getJoursFeries(year);
      const joursFeriesNext = getJoursFeries(year + 1);
      const allJoursFeries = new Set([...joursFeries, ...joursFeriesNext]);

      const NOEL_AN = new Set([
        `${year}-12-24`,`${year}-12-25`,`${year}-12-31`,
        `${year+1}-01-01`,`${year+1}-12-24`,`${year+1}-12-25`,
      ]);

      // (C3) Reconstruction robuste via buildDateToCol (positionnel) au lieu du
      // parse fragile new Date(cell) sur en-têtes texte ("Janvier") → stats à 0.
      const _dtc = buildDateToCol(gardesData, year);
      const colDates = {};
      Object.keys(_dtc).forEach(d => { colDates[_dtc[d]] = d; });

      // Initialiser compteurs
      for (let r = 3; r < gardesData.length; r++) {
        const id = String(gardesData[r][0]).trim();
        if (!id) continue;
        statsReelles[id] = {
          total:0, g:0, g2:0,
          lun:0, mar:0, mer:0, jeu:0, ven:0, sat:0, dim:0,
          jf:0, veilleJf:0, noelAn:0
        };
      }

      // Compter
      Object.entries(colDates).forEach(([c, date]) => {
        const dt = new Date(date+'T12:00:00');
        const dow = dt.getDay();
        const isJF = allJoursFeries.has(date);
        const lendemain = (() => {
          const d2 = new Date(dt); d2.setDate(d2.getDate()+1);
          return `${d2.getFullYear()}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
        })();
        const isVeille = !isJF && allJoursFeries.has(lendemain);

        for (let r = 3; r < gardesData.length; r++) {
          const id = String(gardesData[r][0]).trim();
          if (!id || !statsReelles[id]) continue;
          const val = String(gardesData[r][Number(c)]||'').trim();
          if (val !== 'G' && val !== 'G2') continue;

          const s = statsReelles[id];
          s.total++;
          if (val === 'G')  s.g++;
          if (val === 'G2') s.g2++;
          if (dow === 1) s.lun++;
          if (dow === 2) s.mar++;
          if (dow === 3) s.mer++;
          if (dow === 4) s.jeu++;
          if (dow === 5) s.ven++;
          if (dow === 6) s.sat++;
          if (dow === 0) s.dim++;
          if (isJF)     s.jf++;
          if (isVeille) s.veilleJf++;
          if (NOEL_AN.has(date)) s.noelAn++;
        }
      });
    }

    // ── Construire le rapport comparatif ──
    const stats = [];
    Object.keys(statsInitiales).forEach(id => {
      const ini = statsInitiales[id];
      const reel = statsReelles[id] || {};
      const we_ini = (Number(ini['SAM'])||0) + (Number(ini['DIM'])||0);
      const we_reel = (reel.sat||0) + (reel.dim||0);

      stats.push({
        medecin: id,
        cible: ini['CIBLE'] || '—',
        // Stats initiales
        ini_total:    Number(ini['TOTAL G'])  || 0,
        ini_g:        Number(ini['G (REA)'])  || 0,
        ini_g2:       Number(ini['G2 (MAT)']) || 0,
        ini_we:       we_ini,
        ini_jeu:      Number(ini['JEU'])      || 0,
        ini_jf:       Number(ini['JF'])       || 0,
        ini_veilleJf: Number(ini['VEILLE JF'])|| 0,
        ini_noelAn:   Number(ini['NOEL/AN'])  || 0,
        // Stats réelles
        reel_total:    reel.total    || 0,
        reel_g:        reel.g        || 0,
        reel_g2:       reel.g2       || 0,
        reel_we:       we_reel,
        reel_jeu:      reel.jeu      || 0,
        reel_jf:       reel.jf       || 0,
        reel_veilleJf: reel.veilleJf || 0,
        reel_noelAn:   reel.noelAn   || 0,
        // Écarts
        ecart_total:    (reel.total||0)   - (Number(ini['TOTAL G'])||0),
        ecart_g:        (reel.g||0)       - (Number(ini['G (REA)'])||0),
        ecart_g2:       (reel.g2||0)      - (Number(ini['G2 (MAT)'])||0),
        ecart_we:       we_reel           - we_ini,
        ecart_jeu:      (reel.jeu||0)     - (Number(ini['JEU'])||0),
        ecart_noelAn:   (reel.noelAn||0)  - (Number(ini['NOEL/AN'])||0),
      });
    });

    const ok = pushFile(`stats_${year}.json`, JSON.stringify({year, stats}, null, 2));
    results.push(ok ? `✅ stats_${year}.json pushé` : `❌ Échec push stats_${year}.json`);
  }

  // ── 2. PUSH indispos_N.json ─────────────────────────────────────────
  const indSheet = ss.getSheetByName(`INDISPOS_${year}`);
  if (!indSheet) {
    results.push(`⚠️ Onglet INDISPOS_${year} introuvable — ignoré`);
  } else {
    const indData = indSheet.getDataRange().getValues();
    const indispos = {};
    const dates = reconstruireDatesHeaders(indData, year); // (C3b) helper unifié

    for (let r = 3; r < indData.length; r++) {
      const id = String(indData[r][0]).trim();
      if (!id) continue;
      indispos[id] = {};
      dates.forEach((date, i) => {
        if (!date) return;
        const val = String(indData[r][i + 1] || '').trim();
        if (val) indispos[id][date] = val;
      });
    }

    const ok = pushFile(`indispos_${year}.json`, JSON.stringify({year, indispos}, null, 2));
    results.push(ok ? `✅ indispos_${year}.json pushé` : `❌ Échec push indispos_${year}.json`);
  }

  // ── 3. SUPPRESSION ONGLETS N — décommenter en janvier N+1 ──────────
  /*
  const ongletsASupprimer = [
    `GARDES_${year}`,
    `INDISPOS_${year}`,
    `AFFECTATIONS_${year}`,
    `STATS_GARDES_${year}`,
  ];
  ongletsASupprimer.forEach(name => {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.deleteSheet(sheet);
      results.push(`🗑️ Onglet ${name} supprimé`);
      Logger.log(`🗑️ ${name} supprimé`);
    } else {
      results.push(`⚠️ Onglet ${name} introuvable — ignoré`);
    }
  });
  */

  // ── RAPPORT FINAL ───────────────────────────────────────────────────
  const rapport = results.join('\n');
  Logger.log(`\n── Archivage ${year} ──\n${rapport}`);
  try {
    SpreadsheetApp.getUi().alert(`Archivage ${year}\n\n${rapport}`);
  } catch(e) {
    // Appelé depuis API web — pas d'UI disponible
    Logger.log('✅ Archivage terminé (appelé depuis API)');
  }
  return rapport;
}

// ── TRIGGER ARCHIVAGE FIN D'ANNÉE ──────────────────────────────────────
function createArchiveTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'archiveAnnee') ScriptApp.deleteTrigger(t);
  });
  const now = new Date();
  const triggerDate = new Date(now.getFullYear(), 11, 31, 23, 0, 0);
  if (triggerDate < now) triggerDate.setFullYear(now.getFullYear() + 1);
  ScriptApp.newTrigger('archiveAnnee').timeBased().at(triggerDate).create();
  SpreadsheetApp.getUi().alert(`✅ Trigger archivage créé pour le 31/12/${triggerDate.getFullYear()} à 23h00`);
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
