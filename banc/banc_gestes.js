/* ═══ BANC — LES GESTES ENCORE NON COUVERTS ═══
   Échanges et dons de garde, éditeur d'affectations, verrous d'année.
   Ce sont les gestes RARES mais ENGAGEANTS du comité : ils restent
   synchrones (verdict immédiat), donc leurs refus doivent être justes et
   leurs écritures exactes. */
const vm = require('vm'), fs = require('fs');
const { Classeur, fabriqueVerrou, VERROUS, extraireFonction } = require('./stubs');
const { MARS } = require('./jeu_donnees');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0,200) : '')); } };

/* GARDES_{annee} au format EXACT attendu par applyModification :
   colonne 1 = MAR (à partir de la ligne 4), colonnes suivantes = jours à
   partir du 1er lundi de janvier (buildDateIndex le recalcule seul). */
const ctxCompteurs = { republications: 0 };
function monde(annee) {
  VERROUS.script = false; VERROUS.document = false;
  ctxCompteurs.republications = 0;
  const jan1 = new Date(annee, 0, 1), dow = jan1.getDay();
  const off = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
  const debut = new Date(annee, 0, 1 + off, 12, 0, 0);
  const dates = [];
  for (let i = 0; i < 60; i++) { const d = new Date(debut); d.setDate(d.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
  const cl = new Classeur();
  const lignes = [['',''], ['',''], ['MAR',''].concat(dates.map(()=>''))];
  MARS.slice(0, 8).forEach(id => lignes.push([id, ''].concat(dates.map(() => ''))));
  cl.ajouter(`GARDES_${annee}`, lignes);
  cl.ajouter('PLANNING_OVERRIDES', [['DATE','MAR_ID','MATIN','APREM','COMMENTAIRE']]);
  const MOIS = ['JAN','FEV','MARS','AVRIL','MAI','JUIN','JUILLET','AOUT','SEPT','OCT','NOV','DEC'];
  cl.ajouter(`AFFECTATIONS_${annee}`, [['MAR'].concat(MOIS.map(m => `${m} ${annee}`))]
    .concat(MARS.slice(0, 8).map(id => [id].concat(MOIS.map(() => 'VOLANT')))));
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Set, Math, Error, isNaN, parseInt, RegExp,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} }) },
    LockService: { getScriptLock: () => fabriqueVerrou('script'), getDocumentLock: () => fabriqueVerrou('document') },
    Logger: { log: () => {} }, logAction: () => {}, getActiveYear: () => annee, TEST_YEAR: annee,
    getIndisposForDoctor: () => ({}), saveIndisposForDoctor: () => {},
    /* applyModification republie le planning en fin de geste (comportement de
       production) : on compte les republications au lieu de les exécuter. */
    generatePlanning: () => { ctxCompteurs.republications++; },
    notifPlanifier: () => {},
    buildDateToCol: (data) => { const m = {}; (data[2]||[]).forEach((v,c) => { if (v) m[String(v)] = c; }); return m; },
  });
  ctx.globalThis = ctx;
  ['applyModification'].forEach(n => vm.runInContext(extraireFonction('../gas/Indispos.gs', n), ctx));
  // pose directe d'un code dans GARDES (helper de test, pas du code de production)
  /* Le code de production indexe les colonnes en base 1 (getRange) ; le tableau
     de la doublure est en base 0. D'où le +1 et non le +2 : décalage attrapé
     par le banc lui-même au premier essai. */
  const colonne = date => dates.indexOf(date) + 1;
  const poser = (mar, date, code) => {
    const f = cl.getSheetByName(`GARDES_${annee}`);
    f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][colonne(date)] = code;
  };
  const lire = (mar, date) => {
    const f = cl.getSheetByName(`GARDES_${annee}`);
    return f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][colonne(date)] || '';
  };
  return { cl, ctx, dates, poser, lire, annee };
}

console.log('\n═══ 38. Échange de gardes entre deux MAR ═══');
{
  const b = monde(2027);
  const j = b.dates[10], lendemain = b.dates[11];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  vm.runInContext(`applyModification({ type:'echangeGarde', year:2027, date:${JSON.stringify(j)}, doctorId:'ALPHA', doctorId2:'BRAVO' })`, b.ctx);
  V('la garde change de titulaire', b.lire('BRAVO', j) === 'G' && b.lire('ALPHA', j) === '', { alpha: b.lire('ALPHA', j), bravo: b.lire('BRAVO', j) });
  V('le repos de garde suit la garde', b.lire('BRAVO', lendemain) === 'RG' && b.lire('ALPHA', lendemain) === '',
    { alpha: b.lire('ALPHA', lendemain), bravo: b.lire('BRAVO', lendemain) });
  V('le planning est republié après le geste (visible des MAR)', ctxCompteurs.republications === 1, ctxCompteurs.republications);
}

console.log('\n═══ 39. Refus : l\'échange écraserait une garde existante ═══');
{
  const b = monde(2027);
  const j = b.dates[10], lendemain = b.dates[11];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  b.poser('BRAVO', lendemain, 'G');            // BRAVO est de garde le lendemain
  let erreur = null;
  try { vm.runInContext(`applyModification({ type:'echangeGarde', year:2027, date:${JSON.stringify(j)}, doctorId:'ALPHA', doctorId2:'BRAVO' })`, b.ctx); }
  catch (e) { erreur = e.message; }
  V('l\'échange est REFUSÉ avec un motif lisible', !!erreur && /manuellement|garde/i.test(erreur), erreur);
  V('rien n\'a été écrit à moitié', b.lire('ALPHA', j) === 'G' && b.lire('BRAVO', lendemain) === 'G',
    { alphaJ: b.lire('ALPHA', j), bravoLendemain: b.lire('BRAVO', lendemain) });
  V('aucune republication après un refus', ctxCompteurs.republications === 0, ctxCompteurs.republications);
}

console.log('\n═══ 40. Don de garde ═══');
{
  const b = monde(2027);
  const j = b.dates[20], lendemain = b.dates[21];
  b.poser('CHARLI', j, 'G'); b.poser('CHARLI', lendemain, 'RG');
  vm.runInContext(`applyModification({ type:'donGarde', year:2027, date:${JSON.stringify(j)}, doctorId:'CHARLI', doctorId2:'DELTA' })`, b.ctx);
  V('le donneur est libéré', b.lire('CHARLI', j) === '' && b.lire('CHARLI', lendemain) === '');
  V('le receveur prend la garde ET son repos', b.lire('DELTA', j) === 'G' && b.lire('DELTA', lendemain) === 'RG',
    { garde: b.lire('DELTA', j), repos: b.lire('DELTA', lendemain) });
  let err = null;
  try { vm.runInContext(`applyModification({ type:'donGarde', year:2027, date:${JSON.stringify(b.dates[30])}, doctorId:'ECHO', doctorId2:'FOXTRO' })`, b.ctx); }
  catch (e) { err = e.message; }
  V('donner une garde qu\'on n\'a pas est refusé', !!err && /rien a donner|pas de garde/i.test(err), err);
}

console.log('\n═══ 41. Échange de gardes sur DEUX dates ═══');
{
  const b = monde(2027);
  const j1 = b.dates[5], j2 = b.dates[25];
  b.poser('GOLF', j1, 'G'); b.poser('GOLF', b.dates[6], 'RG');
  b.poser('HOTEL', j2, 'G'); b.poser('HOTEL', b.dates[26], 'RG');
  vm.runInContext(`applyModification({ type:'echangeGardeJours', year:2027, date:${JSON.stringify(j1)}, doctorId:'GOLF', date2:${JSON.stringify(j2)}, doctorId2:'HOTEL' })`, b.ctx);
  V('chaque date garde son rôle, les titulaires permutent',
    b.lire('HOTEL', j1) === 'G' && b.lire('GOLF', j2) === 'G', { j1_hotel: b.lire('HOTEL', j1), j2_golf: b.lire('GOLF', j2) });
  let err = null;
  const b2 = monde(2027);
  b2.poser('GOLF', b2.dates[5], 'G');
  try { vm.runInContext(`applyModification({ type:'echangeGardeJours', year:2027, date:${JSON.stringify(b2.dates[5])}, doctorId:'GOLF', date2:${JSON.stringify(b2.dates[5])}, doctorId2:'HOTEL' })`, b2.ctx); }
  catch (e) { err = e.message; }
  V('deux fois la même date est refusé', !!err && /différentes/i.test(err), err);
}

console.log('\n═══ 42. Année archivée : aucune modification possible ═══');
{
  const b = monde(2027);
  let err = null;
  try { vm.runInContext(`applyModification({ type:'echangeGarde', year:2019, date:${JSON.stringify(b.dates[3])}, doctorId:'ALPHA', doctorId2:'BRAVO' })`, b.ctx); }
  catch (e) { err = e.message; }
  V('le verrou d\'année archivée s\'applique', !!err && /archiv/i.test(err), err);
  V('le message est compréhensible par le comité', !!err && /consultation seule/i.test(err), err);
}

console.log('\n═══ 43. Éditeur d\'affectations : écriture exacte ═══');
{
  const b = monde(2027);
  const aff = { ALPHA: { 1:'REA', 2:'REA', 3:'VIS' }, BRAVO: { 1:'ORT' } };
  vm.runInContext(`
    (function(){
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('AFFECTATIONS_2027');
      var data = sheet.getDataRange().getValues();
      var idToRow = {};
      for (var r = 1; r < data.length; r++) { var id = String(data[r][0]).trim(); if (id) idToRow[id] = r + 1; }
      var aff = ${JSON.stringify(aff)};
      Object.keys(aff).forEach(function (docId) {
        var rowNum = idToRow[docId]; if (!rowNum) return;
        var vals = []; for (var m = 1; m <= 12; m++) vals.push(aff[docId][m] || 'VOLANT');
        sheet.getRange(rowNum, 2, 1, 12).setValues([vals]);
      });
    })();`, b.ctx);
  const f = b.cl.getSheetByName('AFFECTATIONS_2027').lignes;
  const ligneAlpha = f.find(l => l[0] === 'ALPHA'), ligneBravo = f.find(l => l[0] === 'BRAVO');
  V('les mois renseignés sont écrits', ligneAlpha[1] === 'REA' && ligneAlpha[3] === 'VIS', ligneAlpha.slice(1, 4));
  V('les mois vides deviennent VOLANT (jamais vides)', ligneAlpha[4] === 'VOLANT' && ligneBravo[2] === 'VOLANT',
    { alpha4: ligneAlpha[4], bravo2: ligneBravo[2] });
  V('les 12 mois sont couverts', ligneAlpha.slice(1, 13).every(v => !!v), ligneAlpha.slice(1, 13));
  V('un MAR non listé n\'est pas touché', b.cl.getSheetByName('AFFECTATIONS_2027').lignes.find(l => l[0] === 'CHARLI')[1] === 'VOLANT');
}

console.log('\n═══ 44. Atomicité : un refus ne laisse JAMAIS d\'écriture partielle ═══');
{
  /* Le défaut trouvé le 05/08 : l'échange écrivait avant de vérifier. On
     éprouve les cinq types de modification, chacun sur un cas refusé, en
     comparant l'état COMPLET de la feuille avant et après. */
  const etat = b => JSON.stringify(b.cl.getSheetByName('GARDES_2027').lignes);
  const cas = [
    ['echangeGarde — le receveur est de garde le lendemain', b => {
      b.poser('ALPHA', b.dates[10], 'G'); b.poser('ALPHA', b.dates[11], 'RG'); b.poser('BRAVO', b.dates[11], 'G');
      return `{ type:'echangeGarde', year:2027, date:${JSON.stringify(b.dates[10])}, doctorId:'ALPHA', doctorId2:'BRAVO' }`;
    }],
    ['donGarde — le receveur est déjà de garde ce jour-là', b => {
      b.poser('CHARLI', b.dates[12], 'G'); b.poser('CHARLI', b.dates[13], 'RG'); b.poser('DELTA', b.dates[12], 'G');
      return `{ type:'donGarde', year:2027, date:${JSON.stringify(b.dates[12])}, doctorId:'CHARLI', doctorId2:'DELTA' }`;
    }],
    ['echangeGardeJours — une garde existe déjà à la date d\'arrivée', b => {
      b.poser('ECHO', b.dates[5], 'G'); b.poser('FOXTRO', b.dates[25], 'G'); b.poser('ECHO', b.dates[25], 'G2');
      return `{ type:'echangeGardeJours', year:2027, date:${JSON.stringify(b.dates[5])}, doctorId:'ECHO', date2:${JSON.stringify(b.dates[25])}, doctorId2:'FOXTRO' }`;
    }],
    ['gardeExceptionnelle — le MAR est déjà de garde', b => {
      b.poser('GOLF', b.dates[15], 'G');
      return `{ type:'gardeExceptionnelle', year:2027, date:${JSON.stringify(b.dates[15])}, doctorId:'GOLF' }`;
    }],
    ['type inconnu', b => `{ type:'bidule', year:2027, date:${JSON.stringify(b.dates[8])}, doctorId:'ALPHA' }`],
  ];
  cas.forEach(([titre, preparer]) => {
    const b = monde(2027);
    const mod = preparer(b);
    const avant = etat(b);
    let refuse = false;
    try { vm.runInContext(`applyModification(${mod})`, b.ctx); } catch (e) { refuse = true; }
    const apres = etat(b);
    V(`${titre} : refusé ET feuille inchangée`, refuse && avant === apres,
      { refuse, identique: avant === apres });
  });
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
