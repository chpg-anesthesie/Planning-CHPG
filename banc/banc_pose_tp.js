/* ═══ BANC — POSE DES TEMPS PARTIELS APRÈS GÉNÉRATION (lot 1, 22/08/2026) ═══
   Le socle serveur du chantier TP : phase déduite (_phaseTp_), routage d'année,
   verrou par type sur saveIndispos, et le juge de bande (_poserTp_) qui tranche
   chaque jour NOUVEAU sur l'état réel du classeur — vert ≥ 15 → TP validé,
   jaune 13-14 → TPA (sous réserve), noir ≤ 12 → refus.
   Tout le code exécuté ici est EXTRAIT des fichiers livrés, bloc routeur
   compris : recopier la logique dans le test prouverait le test, pas le code.
   Les seuils 15 / 13 / 12 sont VERROUILLÉS en dur dans les vérifications. */
const vm = require('vm'), fs = require('fs');
const { Classeur, extraireFonction } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 190) : '')); } };

const SRC_IND = fs.readFileSync('../gas/Indispos.gs', 'utf8');

/* Le bloc routeur `if (action === 'saveIndispos') { … }` est découpé du vrai
   fichier par appariement d'accolades, puis enveloppé dans une fonction. */
function extraireBlocHandler() {
  const marque = "if (action === 'saveIndispos') {";
  const i = SRC_IND.indexOf(marque);
  if (i < 0) throw new Error('bloc saveIndispos introuvable');
  let prof = 0, j = SRC_IND.indexOf('{', i);
  for (; j < SRC_IND.length; j++) {
    if (SRC_IND[j] === '{') prof++;
    else if (SRC_IND[j] === '}') { prof--; if (prof === 0) break; }
  }
  return 'function handlerSaveIndispos(action, payload, user) {\n' +
         SRC_IND.slice(i, j + 1) + '\n  return null;\n}';
}

/* Constantes réelles extraites du fichier livré (jamais recopiées à la main). */
function extraireConst(nom) {
  const m = SRC_IND.match(new RegExp('(?:const|let)\\s+' + nom + '[^;\\n]*;'));
  if (!m) throw new Error(nom + ' introuvable dans Indispos.gs');
  return m[0];
}

const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function ongletIndispos(annee, ids) {
  const dates = [], e1 = [''], e2 = [''];
  for (let m = 0; m < 12; m++) {
    const nb = new Date(annee, m + 1, 0).getDate();
    for (let j = 1; j <= nb; j++) {
      dates.push(`${annee}-${String(m + 1).padStart(2, '0')}-${String(j).padStart(2, '0')}`);
      e1.push(j === 1 ? `${MOIS[m]} ${annee}` : '');
      e2.push(j);
    }
  }
  const lignes = [e1, [''].concat(dates.map(() => '')), e2];
  ids.forEach(id => lignes.push([id].concat(dates.map(() => ''))));
  return { lignes, dates };
}

/* MEDECINS aux colonnes EXACTES de production (0 id, 3 actif, 4 quotité,
   14 rythme_2sur2, 16 tp_jours_fixes). */
function ligneMed(id, quotite, opts) {
  const l = [id, id, id.slice(0, 2), 'O', quotite, 100, 'C' + id, '', '', '', '', '', '', '',
             (opts && opts.rythme2sur2) ? 'O' : '', '', (opts && opts.tpFixes) || ''];
  return l;
}

/* Le monde : 16 MAR actifs (POSEUR 80 %, ZORRO 90 %, 14 pleins), année active
   2026, planning 2027 généré (GARDES + LIENS_R). Effectif simple à compter :
   ni rythme 2/2 ni jours fixes ici — l'éligibilité a son propre monde. */
function monde(opts) {
  opts = opts || {};
  const cl = new Classeur();
  const ids = ['POSEUR', 'ZORRO'];
  for (let i = 1; i <= 14; i++) ids.push('PLEIN' + String(i).padStart(2, '0'));
  const med = [['ID','NOM','INITIALES','ACTIF','QUOTITE','PCT_GARDES','CODE','EMAIL','DECT','date_debut','date_fin','no_garde','only_18','no_weekend','rythme_2sur2','souhait_plafond','tp_jours_fixes']];
  med.push(ligneMed('POSEUR', 80));
  med.push(ligneMed('ZORRO', 90));
  for (let i = 1; i <= 14; i++) med.push(ligneMed('PLEIN' + String(i).padStart(2, '0'), 100));
  if (opts.extras) opts.extras.forEach(l => { med.push(l); ids.push(l[0]); });
  cl.ajouter('MEDECINS', med);
  const cfg = [['CLE','VALEUR'], ['ANNEE_ACTIVE', '2026']];
  if (opts.campagne) cfg.push(['INDISPOS_ACTIVE', '2027']);
  cl.ajouter('CONFIG', cfg);
  cl.ajouter('CONFIG_CONGES', [['QUOTITE','VAC','FORM','CTP'], [100,33,10,0], [90,30,9,2], [80,26,8,3], [60,20,6,4], [50,17,5,4]]);
  const ind27 = ongletIndispos(2027, ids);
  (opts.indispos || []).forEach(([id, ds, code]) => {
    const r = 3 + ids.indexOf(id), c = 1 + ind27.dates.indexOf(ds);
    ind27.lignes[r][c] = code;
  });
  cl.ajouter('INDISPOS_2027', ind27.lignes);
  cl.ajouter('INDISPOS_2026', ongletIndispos(2026, ids).lignes);   // témoin anti-fuite
  if (opts.gardes2027 !== false) {
    /* GARDES_{Y} : colonnes positionnelles depuis le 1er jour planning
       (buildDateToCol), MAR dès la ligne 4. 04/01/2027 = colonne 1. */
    const nCols = 364;
    const g = [Array(nCols + 1).fill(''), Array(nCols + 1).fill(''), Array(nCols + 1).fill('')];
    const debut = new Date(2027, 0, 4, 12, 0, 0);
    const colDe = ds => {
      const dt = new Date(ds + 'T12:00:00');
      return Math.round((dt - debut) / 86400000) + 1;
    };
    ids.forEach(id => g.push([id].concat(Array(nCols).fill(''))));
    (opts.gardes || []).forEach(([id, ds, code]) => { g[3 + ids.indexOf(id)][colDe(ds)] = code; });
    cl.ajouter('GARDES_2027', g);
  }
  if (opts.liens2027 !== false) cl.ajouter('LIENS_R_2027', [['A']]);
  if (opts.gardes2026) cl.ajouter('GARDES_2026', [['A']]);

  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Math, Set, RegExp, parseInt, isNaN,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl }, Logger: { log() {} } });
  ctx.globalThis = ctx;
  /* Doublures d'infrastructure (jamais de logique métier) : journal, memo
     CONFIG (lecture directe, pas de cache à invalider), réponse HTTP. */
  vm.runInContext('function logAction(){}', ctx);
  vm.runInContext('function _configRows_(){ return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CONFIG").getDataRange().getValues(); }', ctx);
  vm.runInContext('const ContentService = { MimeType:{JSON:1}, createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }) };', ctx);
  // Fonctions RÉELLES des fichiers livrés
  ['getActiveYear', 'getPremierJourPlanning', 'reconstruireDatesHeaders', 'buildDateToCol', 'getJoursFeries'].forEach(n =>
    vm.runInContext('let _medFlagsCacheDummy;' === n ? '' : extraireFonction('../gas/code.gs', n), ctx));
  vm.runInContext('let _medFlagsCache = null;', ctx);
  vm.runInContext(extraireFonction('../gas/code.gs', 'getMedecinFlags'), ctx);
  vm.runInContext(extraireFonction('../gas/generateur_gardes.gs', 'estSemaineOff'), ctx);
  vm.runInContext('let _quotasCache = null;', ctx);
  vm.runInContext(extraireConst('CODES_COMITE'), ctx);
  ['_indisposOuverte_', 'getIndisposYear', '_phaseTp_', 'getIndisposForDoctor', 'saveIndisposForDoctor',
   '_fusionIndispos_', '_loadQuotasConges', 'getQuotasConges', '_tpFixeDe_', '_quotiteDe_',
   '_tpMondePresence_', '_poserTp_', '_error'].forEach(n =>
    vm.runInContext(extraireFonction('../gas/Indispos.gs', n), ctx));
  vm.runInContext(extraireBlocHandler(), ctx);
  const appel = (payload, user) => vm.runInContext(
    `handlerSaveIndispos('saveIndispos', ${JSON.stringify(payload)}, ${JSON.stringify(user)})`, ctx);
  const lireInd = (id, annee) => vm.runInContext(`getIndisposForDoctor('${id}', ${annee})`, ctx);
  return { cl, ctx, appel, lireInd };
}
const MAR = { role: 'mar', id: 'POSEUR' };
const ADMIN = { role: 'admin', id: 'ADMIN' };

console.log('\n═══ PT01 · la phase se DÉDUIT — GARDES seul ne suffit pas, LIENS_R non plus ═══');
{
  let b = monde({});
  let ph = vm.runInContext('_phaseTp_()', b.ctx);
  V('GARDES_2027 + LIENS_R_2027 → phase active pour 2027', ph.actif === true && ph.annee === 2027, ph);

  b = monde({ liens2027: false, gardes2026: true });
  ph = vm.runInContext('_phaseTp_()', b.ctx);
  V('année tenue à la main (GARDES sans LIENS_R) → phase FERMÉE', ph.actif === false, ph);

  b = monde({ gardes2027: false, gardes2026: true });
  ph = vm.runInContext('_phaseTp_()', b.ctx);
  V('GARDES_2027 supprimé pour régénérer → la phase se referme SEULE, sans retomber sur 2026', ph.actif === false, ph);
}

console.log('\n═══ PT02 · routage d\'année : les TP vont dans 2027, jamais dans l\'année de repli ═══');
{
  const b = monde({});   // campagne FERMÉE : getIndisposYear() se replie sur 2026
  const an = vm.runInContext('getIndisposYear()', b.ctx);
  V('témoin : getIndisposYear() répond bien 2026 (le repli silencieux)', an === 2026, an);
  const rep = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, MAR);
  V('la pose réussit', rep && rep.success === true, rep);
  V('la réponse annonce 2027', rep.annee === 2027, rep.annee);
  V('le TP est écrit dans INDISPOS_2027', b.lireInd('POSEUR', 2027)['2027-03-01'] === 'TP');
  V('INDISPOS_2026 est resté vierge — aucune fuite', Object.keys(b.lireInd('POSEUR', 2026)).length === 0, b.lireInd('POSEUR', 2026));
}

console.log('\n═══ PT03 · verrou par type : hors campagne, la saisie classique est refusée ═══');
{
  const b = monde({});
  const rep = b.appel({ indispos: { '2027-04-01': 'INDISPO' } }, MAR);
  V('rôle mar, hors campagne → refus explicite', rep && rep.success === false && /campagne/.test(rep.error || ''), rep);
  V('rien n\'a été écrit', Object.keys(b.lireInd('POSEUR', 2026)).length === 0);
  const b2 = monde({ campagne: true });
  const rep2 = b2.appel({ indispos: { '2027-04-01': 'INDISPO' } }, MAR);
  V('campagne ouverte → la même saisie passe', rep2 && rep2.success === true, rep2);
  V('…et va dans l\'année de campagne (2027)', b2.lireInd('POSEUR', 2027)['2027-04-01'] === 'INDISPO');
  const b3 = monde({});
  const rep3 = b3.appel({ doctorId: 'ZORRO', indispos: { '2026-04-02': 'VAC' } }, ADMIN);
  V('le comité, lui, n\'est pas verrouillé — il corrige l\'année active (2026), comportement historique', rep3 && rep3.success === true && b3.lireInd('ZORRO', 2026)['2026-04-02'] === 'VAC', [rep3, b3.lireInd('ZORRO', 2026)]);
}

console.log('\n═══ PT04 · le circuit campagne IGNORE les TP envoyés et PRÉSERVE ceux en base ═══');
{
  const b = monde({ campagne: true, indispos: [['POSEUR', '2027-03-09', 'TP'], ['POSEUR', '2027-03-15', 'INDISPO']] });
  const rep = b.appel({ indispos: { '2027-03-16': 'INDISPO', '2027-05-05': 'TP' } }, MAR);
  V('l\'enregistrement campagne réussit', rep && rep.success === true, rep);
  const relu = b.lireInd('POSEUR', 2027);
  V('le TP déjà en base a SURVÉCU au remplacement de famille', relu['2027-03-09'] === 'TP', relu['2027-03-09']);
  V('le TP envoyé par le circuit campagne est IGNORÉ (doctrine : plus de TP avant génération)', !relu['2027-05-05'], relu['2027-05-05']);
  V('l\'INDISPO retirée est bien partie, la nouvelle est là', !relu['2027-03-15'] && relu['2027-03-16'] === 'INDISPO', relu);
}

console.log('\n═══ PT05 · les trois bandes, seuils verrouillés : 16→TP · 15→TPA · 13→refus ═══');
{
  const b = monde({ indispos: [
    ['PLEIN01', '2027-03-02', 'VAC'],                                              // mardi : 15 présents
    ['PLEIN01', '2027-03-03', 'VAC'], ['PLEIN02', '2027-03-03', 'VAC'], ['PLEIN03', '2027-03-03', 'VAC'],  // mercredi : 13
  ] });
  const rep = b.appel({ tp: true, indispos: { '2027-03-01': 'TP', '2027-03-02': 'TP', '2027-03-03': 'TP' } }, MAR);
  V('16 présents → il resterait 15 → TP validé', rep.resultat['2027-03-01'] === 'TP', rep.resultat);
  V('15 présents → il resterait 14 → TPA, sous réserve', rep.resultat['2027-03-02'] === 'TPA', rep.resultat);
  V('13 présents → il resterait 12 → REFUSÉ, motif chiffré', /12/.test(rep.resultat['2027-03-03'] || ''), rep.resultat);
  const relu = b.lireInd('POSEUR', 2027);
  V('l\'onglet reflète exactement le verdict', relu['2027-03-01'] === 'TP' && relu['2027-03-02'] === 'TPA' && !relu['2027-03-03'], relu);
  V('le quota ne compte que le validé (1/3)', rep.quota.valides === 1 && rep.quota.total === 3, rep.quota);
}

console.log('\n═══ PT06 · G compte PRÉSENT, RG compte ABSENT — la définition du générateur ═══');
{
  const b = monde({ gardes: [['PLEIN01', '2027-03-01', 'G'], ['PLEIN02', '2027-03-02', 'RG']] });
  const rep = b.appel({ tp: true, indispos: { '2027-03-01': 'TP', '2027-03-02': 'TP' } }, MAR);
  V('un collègue de garde ne baisse pas l\'effectif : jour vert → TP', rep.resultat['2027-03-01'] === 'TP', rep.resultat);
  V('un collègue en repos de garde le baisse : 15 → TPA', rep.resultat['2027-03-02'] === 'TPA', rep.resultat);
}

console.log('\n═══ PT07 · refus individuels : garde, repos, week-end, férié, jour déjà pris ═══');
{
  const b = monde({
    gardes: [['POSEUR', '2027-03-04', 'G'], ['POSEUR', '2027-03-05', 'RG']],
    indispos: [['POSEUR', '2027-03-08', 'VAC']],
  });
  const jf = [...vm.runInContext('getJoursFeries(2027)', b.ctx)]
    .filter(d => { const w = new Date(d + 'T12:00:00').getDay(); return w >= 1 && w <= 5 && d > '2027-01-04' && d < '2027-12-31'; })[0];
  const envoi = { '2027-03-04': 'TP', '2027-03-05': 'TP', '2027-03-06': 'TP', '2027-03-08': 'TP' };
  envoi[jf] = 'TP';
  const rep = b.appel({ tp: true, indispos: envoi }, MAR);
  V('jour de garde → refusé', /garde/.test(rep.resultat['2027-03-04'] || ''), rep.resultat['2027-03-04']);
  V('repos de garde → refusé', /repos/.test(rep.resultat['2027-03-05'] || ''), rep.resultat['2027-03-05']);
  V('samedi → refusé', /week-end/.test(rep.resultat['2027-03-06'] || ''), rep.resultat['2027-03-06']);
  V('jour férié (' + jf + ') → refusé', /férié/.test(rep.resultat[jf] || ''), rep.resultat[jf]);
  V('jour déjà VAC → refusé avec le code en clair', /VAC/.test(rep.resultat['2027-03-08'] || ''), rep.resultat['2027-03-08']);
  V('aucun de ces jours n\'a été écrit', Object.keys(b.lireInd('POSEUR', 2027)).filter(d => b.lireInd('POSEUR', 2027)[d] === 'TP').length === 0);
}

console.log('\n═══ PT08 · quota : les TP validés le consomment, les TPA jamais ═══');
{
  const b = monde({ indispos: [['PLEIN01', '2027-03-05', 'VAC']] });   // vendredi 05/03 : 15 présents
  const rep = b.appel({ tp: true, indispos: {
    '2027-03-01': 'TP', '2027-03-02': 'TP', '2027-03-03': 'TP',   // 3 jours verts = quota 80 % plein
    '2027-03-04': 'TP',                                            // 4e jour vert → au-delà
    '2027-03-05': 'TP',                                            // jour jaune → TPA malgré le quota plein
  } }, MAR);
  V('les 3 premiers jours verts passent', ['2027-03-01', '2027-03-02', '2027-03-03'].every(d => rep.resultat[d] === 'TP'), rep.resultat);
  V('le 4e est refusé « quota atteint »', /quota/.test(rep.resultat['2027-03-04'] || ''), rep.resultat['2027-03-04']);
  V('le jour jaune devient TPA même quota plein — il ne compte pas', rep.resultat['2027-03-05'] === 'TPA', rep.resultat['2027-03-05']);
  V('quota annoncé : 3/3', rep.quota.valides === 3 && rep.quota.total === 3, rep.quota);
}

console.log('\n═══ PT09 · un jour validé est ACQUIS ; un retrait reste possible ═══');
{
  const b = monde({ indispos: [
    ['POSEUR', '2027-03-03', 'TP'],                                   // déjà validé…
    ['PLEIN01', '2027-03-03', 'VAC'], ['PLEIN02', '2027-03-03', 'VAC'], ['PLEIN03', '2027-03-03', 'VAC'],  // …sur un jour devenu noir
  ] });
  const rep = b.appel({ tp: true, indispos: { '2027-03-03': 'TP' } }, MAR);
  V('le jour conservé reste TP, jamais re-jugé', rep.resultat['2027-03-03'] === 'TP' && b.lireInd('POSEUR', 2027)['2027-03-03'] === 'TP', rep.resultat);
  const rep2 = b.appel({ tp: true, indispos: {} }, MAR);
  V('l\'omettre de l\'envoi le retire (rendre un jour reste possible)', rep2.success === true && !b.lireInd('POSEUR', 2027)['2027-03-03'], b.lireInd('POSEUR', 2027));
}

console.log('\n═══ PT10 · un MAR ne s\'auto-valide pas ; le comité, si — et c\'est annulable ═══');
{
  const b = monde({ indispos: [['POSEUR', '2027-03-02', 'TPA']] });
  const rep = b.appel({ tp: true, indispos: { '2027-03-02': 'TP' } }, MAR);
  V('le MAR envoie TP sur son TPA → reste TPA', rep.resultat['2027-03-02'] === 'TPA' && b.lireInd('POSEUR', 2027)['2027-03-02'] === 'TPA', rep.resultat);
  const rep2 = b.appel({ tp: true, doctorId: 'POSEUR', indispos: { '2027-03-02': 'TP' } }, ADMIN);
  V('le comité valide : TPA → TP', rep2.resultat['2027-03-02'] === 'TP' && b.lireInd('POSEUR', 2027)['2027-03-02'] === 'TP', rep2.resultat);
  const rep3 = b.appel({ tp: true, doctorId: 'POSEUR', indispos: { '2027-03-02': 'TPA' } }, ADMIN);
  V('…et peut revenir en arrière : TP → TPA (décision annulable)', rep3.success === true && b.lireInd('POSEUR', 2027)['2027-03-02'] === 'TPA', b.lireInd('POSEUR', 2027));
}

console.log('\n═══ PT11 · deux MAR, le même jour : la cascade juste ═══');
{
  // Jour VERT à 16 présents : le 1er valide (16→15), le 2e passe sous réserve (15→14).
  const b = monde({});
  b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, MAR);
  const rep = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, { role: 'mar', id: 'ZORRO' });
  V('après un TP VALIDÉ, le même jour glisse en TPA pour le suivant', rep.resultat['2027-03-01'] === 'TPA', rep.resultat);
  // Jour JAUNE à 15 présents : deux TPA ne se bloquent pas mutuellement.
  const b2 = monde({ indispos: [['PLEIN01', '2027-03-02', 'VAC']] });
  b2.appel({ tp: true, indispos: { '2027-03-02': 'TP' } }, MAR);
  const rep2 = b2.appel({ tp: true, indispos: { '2027-03-02': 'TP' } }, { role: 'mar', id: 'ZORRO' });
  V('un TPA ne baisse PAS l\'effectif : la 2e demande obtient aussi TPA', rep2.resultat['2027-03-02'] === 'TPA', rep2.resultat);
  V('les deux demandes coexistent dans l\'onglet', b2.lireInd('POSEUR', 2027)['2027-03-02'] === 'TPA' && b2.lireInd('ZORRO', 2027)['2027-03-02'] === 'TPA');
}

console.log('\n═══ PT12 · éligibilité SANS nom en dur : plein temps, jours fixes, rythme 2/2 ═══');
{
  const b = monde({ extras: [
    ligneMed('FIXE', 60, { tpFixes: 'JEU, VEN' }),
    ligneMed('CYCLE', 50, { rythme2sur2: true }),
  ] });
  const r1 = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, { role: 'mar', id: 'PLEIN01' });
  V('quotité 100 → refus', r1.success === false && /profil/.test(r1.error || ''), r1);
  const r2 = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, { role: 'mar', id: 'FIXE' });
  V('jours fixes déclarés → refus (BONNET s\'exclut par sa colonne)', r2.success === false, r2);
  const r3 = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, { role: 'mar', id: 'CYCLE' });
  V('rythme 2 semaines sur 2 → refus', r3.success === false, r3);
  const r4 = b.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, MAR);
  V('quotité 80 sans jours fixes → accepté', r4.success === true && r4.resultat['2027-03-01'] === 'TP', r4);
}

console.log('\n═══ PT13 · une date hors année ou la phase fermée n\'écrivent RIEN ═══');
{
  const b = monde({});
  const rep = b.appel({ tp: true, indispos: { '2026-06-01': 'TP', '2028-02-02': 'TP' } }, MAR);
  V('dates hors 2027 → refusées « hors année »', rep.resultat['2026-06-01'] === 'hors année' && rep.resultat['2028-02-02'] === 'hors année', rep.resultat);
  const b2 = monde({ gardes2027: false });
  const rep2 = b2.appel({ tp: true, indispos: { '2027-03-01': 'TP' } }, MAR);
  V('phase fermée → refus global, message clair', rep2 && rep2.success === false && /générée/.test(rep2.error || ''), rep2);
}

console.log(`\n${ko === 0 ? '✅' : '❌'} banc_pose_tp : ${ok} vérifications, ${ko} échec(s)`);
if (ko > 0) process.exit(1);
