/* ═══ BANC — ÉCHANGES ET DONS DE GARDES ENTRE MAR (phase 3) ═══
   Le VRAI code : echanges.gs entier + applyModification (Indispos.gs),
   dans un classeur simulé. Les notifications et la poussée KV sont des
   doublures qui ENREGISTRENT les appels : on vérifie qui est notifié,
   jamais « qu'une fonction a été appelée quelque part ».

   Ce qui est éprouvé : le refus DÈS la création (dryRun sans écriture),
   le cycle accepter/refuser, la sécurité (seul le receveur répond, une
   seule fois), l'acceptation d'une demande devenue impossible (grille
   INTACTE), l'expiration 48 h et le rappel unique 24 h, le transfert du
   R d'un samedi via LIENS_R — et ses trois échecs prévus (pas de lien,
   R passé, receveur occupé) qui n'empêchent JAMAIS l'échange. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const { Classeur, fabriqueVerrou, VERROUS, extraireFonction } = require('./stubs');
const { MARS } = require('./jeu_donnees');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 200) : '')); } };

/* Monde : GARDES + INDISPOS (géométrie identique, comme en production),
   LIENS_R optionnel, echanges.gs + applyModification chargés en entier. */
function monde(annee, opts) {
  opts = opts || {};
  VERROUS.script = false; VERROUS.document = false;
  const jan1 = new Date(annee, 0, 1), dow = jan1.getDay();
  const off = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
  const debut = new Date(annee, 0, 1 + off, 12, 0, 0);
  const dates = [];
  for (let i = 0; i < 90; i++) { const d = new Date(debut); d.setDate(d.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`); }
  const cl = new Classeur();
  const grille = () => [['',''], ['',''], ['MAR',''].concat(dates.map(()=>''))]
    .concat(MARS.slice(0, 8).map(id => [id, ''].concat(dates.map(() => ''))));
  cl.ajouter(`GARDES_${annee}`, grille());
  cl.ajouter(`INDISPOS_${annee}`, grille());
  if (opts.liensR) cl.ajouter(`LIENS_R_${annee}`, [['SAMEDI','MEDECIN','DATE R']].concat(opts.liensR));

  const notifs = [], kv = [], journal = [];
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Set, Math, Error, isNaN, parseInt, RegExp,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k === 'MIROIR_PUSH_TOKEN' ? 'JETON' : (k === 'ECHANGES_OUVERTS' ? 'O' : null)), setProperty: () => {}, deleteProperty: () => {} }) },
    LockService: { getScriptLock: () => fabriqueVerrou('script'), getDocumentLock: () => fabriqueVerrou('document') },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyHours: () => ({ create: () => {} }) }) }), deleteTrigger: () => {} },
    Utilities: { formatDate: (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; } },
    Logger: { log: () => {} }, logAction: m => journal.push(String(m)),
    TEST_YEAR: annee,
    generatePlanning: () => { ctxCompteurs.republications++; },
    notifPlanifier: () => {},
    /* Doublures ENREGISTREUSES : le banc vérifie les destinataires réels. */
    notifierPush_: (titre, corps, url, cible) => { notifs.push({ titre, corps, url, cible }); return { success: true }; },
    _miroirEnvoyerLot_: (items) => { kv.push(Object.keys(items)); return { success: true }; },
  });
  ctx.globalThis = ctx;
  vm.runInContext(extraireFonction('../gas/Indispos.gs', 'applyModification'), ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'gas', 'echanges.gs'), 'utf8'), ctx);

  const colonne = date => dates.indexOf(date) + 1;
  const feuille = nom => cl.getSheetByName(nom);
  const poser = (mar, date, code, nom) => {
    const f = feuille(nom || `GARDES_${annee}`);
    f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][colonne(date)] = code;
  };
  const lire = (mar, date, nom) => {
    const f = feuille(nom || `GARDES_${annee}`);
    return f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][colonne(date)] || '';
  };
  const echanges = () => {
    const f = feuille('ECHANGES');
    return f ? f.lignes.slice(1).filter(l => l[0]) : [];
  };
  return { cl, ctx, dates, poser, lire, echanges, notifs, kv, journal, annee };
}
const ctxCompteurs = { republications: 0 };
const COL = { ID:0, CREE_LE:1, TYPE:2, ANNEE:3, DATE:4, DATE2:5, DEMANDEUR:6, RECEVEUR:7, ETAT:8, REPONDU_LE:9, RAPPEL_LE:10, INFO:11 };
const user = id => ({ id: id, role: 'mar', name: 'DR ' + id });

console.log('\n═══ 1. Créer un don : contrôles joués TOUT DE SUITE, rien d\'écrit avant l\'accord ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  V('la demande est créée avec un identifiant', !!r.id);
  const e = b.echanges();
  V('une ligne, état « attente »', e.length === 1 && e[0][COL.ETAT] === 'attente', e[0]);
  V('le demandeur est celui du CODE, le receveur celui du choix', e[0][COL.DEMANDEUR] === 'ALPHA' && e[0][COL.RECEVEUR] === 'BRAVO');
  V('la garde n\'a PAS bougé (personne n\'a encore accepté)', b.lire('ALPHA', j) === 'G' && b.lire('BRAVO', j) === '');
  V('le receveur est notifié — et LUI SEUL', b.notifs.length === 1 && b.notifs[0].cible && b.notifs[0].cible.id === 'BRAVO', b.notifs);
  V('la clé `echanges` est poussée au miroir', b.kv.some(cles => cles.indexOf('echanges') > -1), b.kv);
}

console.log('\n═══ 2. Créer vers un receveur indisponible : refus IMMÉDIAT, onglet vide ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  b.poser('BRAVO', j, 'VAC', `INDISPOS_2027`);
  let refus = null;
  try { vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx); }
  catch (e) { refus = e.message; }
  V('la création est refusée sur-le-champ', !!refus, refus);
  V('le motif nomme l\'indisponibilité', /indisponi|impossible/i.test(refus || ''), refus);
  V('AUCUNE ligne n\'est écrite', b.echanges().length === 0);
  V('AUCUNE notification ne part', b.notifs.length === 0);
  V('la grille est intacte (dryRun sans écriture)', b.lire('ALPHA', j) === 'G' && b.lire('BRAVO', j) === '');
}

console.log('\n═══ 3. Créer sans détenir la garde : refus ═══');
{
  const b = monde(2027);
  let refus = null;
  try { vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(b.dates[9])}, receveur:'BRAVO' })`, b.ctx); }
  catch (e) { refus = e.message; }
  V('refus « rien à donner »', /rien a donner/i.test(refus || ''), refus);
  V('se proposer une garde à soi-même est refusé', (() => {
    try { vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(b.dates[9])}, receveur:'ALPHA' })`, b.ctx); return false; }
    catch (e) { return /soi-même/i.test(e.message); }
  })());
}

console.log('\n═══ 4. Accepter : le planning s\'écrit tout seul, les DEUX sont prévenus ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  const rep = vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('état « acceptée »', rep.etat === 'acceptee' && b.echanges()[0][COL.ETAT] === 'acceptee');
  V('la garde a changé de mains', b.lire('BRAVO', j) === 'G' && b.lire('ALPHA', j) === '');
  V('le repos de garde suit', b.lire('BRAVO', lendemain) === 'RG' && b.lire('ALPHA', lendemain) === '');
  const cibles = b.notifs.map(n => n.cible && n.cible.id).sort();
  V('les deux MAR sont notifiés, chacun nommément', JSON.stringify(cibles) === JSON.stringify(['ALPHA', 'BRAVO']), b.notifs);
  V('l\'horodatage de réponse est posé', !!b.echanges()[0][COL.REPONDU_LE]);
}

console.log('\n═══ 5. Refuser : rien ne bouge au planning, le demandeur est prévenu ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'refuser' })`, b.ctx);
  V('état « refusée »', b.echanges()[0][COL.ETAT] === 'refusee');
  V('la garde n\'a pas bougé', b.lire('ALPHA', j) === 'G' && b.lire('BRAVO', j) === '');
  V('seul le demandeur est notifié du refus', b.notifs.length === 1 && b.notifs[0].cible.id === 'ALPHA', b.notifs);
}

console.log('\n═══ 6. Sécurité : seul le receveur répond, et une seule fois ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  let refus = null;
  try { vm.runInContext(`repondreEchange(${JSON.stringify(user('CHARLIE'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx); }
  catch (e) { refus = e.message; }
  V('un tiers ne peut pas répondre', /destinataire/i.test(refus || ''), refus);
  V('même le DEMANDEUR ne peut pas accepter sa propre demande', (() => {
    try { vm.runInContext(`repondreEchange(${JSON.stringify(user('ALPHA'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx); return false; }
    catch (e) { return /destinataire/i.test(e.message); }
  })());
  vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'refuser' })`, b.ctx);
  let refus2 = null;
  try { vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx); }
  catch (e) { refus2 = e.message; }
  V('répondre deux fois est refusé — l\'état ne se réécrit pas', /déjà/i.test(refus2 || '') && b.echanges()[0][COL.ETAT] === 'refusee', refus2);
}

console.log('\n═══ 7. Le planning a bougé entre création et acceptation : « impossible », grille INTACTE ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  // Entre-temps, BRAVO reçoit une garde la veille (comité, autre échange…)
  const veille = b.dates[8];
  b.poser('BRAVO', veille, 'G'); b.poser('BRAVO', j, '');
  b.poser('BRAVO', j, ''); b.notifs.length = 0;
  b.poser('BRAVO', b.dates[10], ''); // (le RG de sa veille n'importe pas ici)
  const avant = JSON.stringify([b.lire('ALPHA', j), b.lire('ALPHA', lendemain)]);
  const rep = vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('l\'acceptation rend « impossible » au lieu d\'écrire', rep.etat === 'impossible', rep);
  V('l\'état est posé avec son motif', b.echanges()[0][COL.ETAT] === 'impossible' && !!b.echanges()[0][COL.INFO]);
  V('la grille du demandeur est INTACTE', JSON.stringify([b.lire('ALPHA', j), b.lire('ALPHA', lendemain)]) === avant);
  const cibles = b.notifs.map(n => n.cible && n.cible.id).sort();
  V('les deux MAR sont prévenus de l\'impossibilité', JSON.stringify(cibles) === JSON.stringify(['ALPHA', 'BRAVO']), b.notifs);
}

console.log('\n═══ 8. Échange de deux gardes datées (echangeGardeJours par le circuit) ═══');
{
  const b = monde(2027);
  const j1 = b.dates[9],  l1 = b.dates[10];
  const j2 = b.dates[23], l2 = b.dates[24];
  b.poser('ALPHA', j1, 'G');  b.poser('ALPHA', l1, 'RG');
  b.poser('BRAVO', j2, 'G2'); b.poser('BRAVO', l2, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'echange', year:2027, date:${JSON.stringify(j1)}, date2:${JSON.stringify(j2)}, receveur:'BRAVO' })`, b.ctx);
  vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('chaque date garde son rôle : BRAVO prend G au j1', b.lire('BRAVO', j1) === 'G' && b.lire('ALPHA', j1) === '');
  V('ALPHA prend G2 au j2', b.lire('ALPHA', j2) === 'G2' && b.lire('BRAVO', j2) === '');
  V('les repos suivent chacun leur garde', b.lire('BRAVO', l1) === 'RG' && b.lire('ALPHA', l2) === 'RG');
}

console.log('\n═══ 9. Don d\'un samedi AVEC lien : le R suit, le lien est mis à jour ═══');
{
  const b = monde(2027);
  const samedi = b.dates.find(d => new Date(d + 'T12:00:00').getDay() === 6);
  const lendemain = b.dates[b.dates.indexOf(samedi) + 1];
  const dateR = b.dates[60]; // un jour de semaine lointain, PAS ENCORE PASSÉ (2027 > aujourd'hui)
  b.poser('ALPHA', samedi, 'G'); b.poser('ALPHA', lendemain, 'RG'); b.poser('ALPHA', dateR, 'R');
  b.cl.getSheetByName('LIENS_R_2027') || b.cl.ajouter('LIENS_R_2027', [['SAMEDI','MEDECIN','DATE R'], [samedi, 'ALPHA', dateR]]);
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(samedi)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  const rep = vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('l\'échange est accepté', rep.etat === 'acceptee', rep);
  V('le R a quitté le donneur', b.lire('ALPHA', dateR) === '');
  V('le R est chez le receveur, MÊME date', b.lire('BRAVO', dateR) === 'R');
  const lien = b.cl.getSheetByName('LIENS_R_2027').lignes[1];
  V('la ligne LIENS_R porte le nouveau tenant', lien[1] === 'BRAVO', lien);
  V('la notification annonce le R transféré, aux deux', b.notifs.filter(n => /récupération du/.test(n.corps)).length === 2, b.notifs);
  V('AUCUNE alerte au comité (le transfert a réussi)', !b.notifs.some(n => n.cible && n.cible.role === 'admin'), b.notifs);
}

console.log('\n═══ 10. Don d\'un samedi SANS lien (2026) : l\'échange aboutit, le comité replace ═══');
{
  const b = monde(2027); // pas d'onglet LIENS_R du tout
  const samedi = b.dates.find(d => new Date(d + 'T12:00:00').getDay() === 6);
  const lendemain = b.dates[b.dates.indexOf(samedi) + 1];
  b.poser('ALPHA', samedi, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(samedi)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  const rep = vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('l\'échange aboutit QUAND MÊME', rep.etat === 'acceptee' && b.lire('BRAVO', samedi) === 'G');
  const alerte = b.notifs.find(n => n.cible && n.cible.role === 'admin');
  V('le comité est notifié pour replacer le R', !!alerte, b.notifs);
  V('l\'alerte nomme le samedi et les deux MAR', alerte && alerte.corps.indexOf(samedi) > -1 && /ALPHA/.test(alerte.corps) && /BRAVO/.test(alerte.corps), alerte);
}

console.log('\n═══ 11. Samedi dont le receveur est occupé le jour du R : échange fait, comité prévenu ═══');
{
  const b = monde(2027);
  const samedi = b.dates.find(d => new Date(d + 'T12:00:00').getDay() === 6);
  const lendemain = b.dates[b.dates.indexOf(samedi) + 1];
  const dateR = b.dates[60];
  b.poser('ALPHA', samedi, 'G'); b.poser('ALPHA', lendemain, 'RG'); b.poser('ALPHA', dateR, 'R');
  b.poser('BRAVO', dateR, '18'); // occupé ce jour-là
  b.cl.ajouter('LIENS_R_2027', [['SAMEDI','MEDECIN','DATE R'], [samedi, 'ALPHA', dateR]]);
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(samedi)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  const rep = vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('l\'échange aboutit', rep.etat === 'acceptee');
  V('le R n\'a PAS bougé (rien d\'écrasé)', b.lire('ALPHA', dateR) === 'R' && b.lire('BRAVO', dateR) === '18');
  V('la ligne LIENS_R garde son tenant d\'origine', b.cl.getSheetByName('LIENS_R_2027').lignes[1][1] === 'ALPHA');
  V('le comité est prévenu, avec le motif', (() => {
    const a = b.notifs.find(n => n.cible && n.cible.role === 'admin');
    return !!a && /replacer/i.test(a.corps);
  })(), b.notifs);
}

console.log('\n═══ 12. Échange samedi ↔ samedi : AUCUN R ne bouge (décision du 12/08) ═══');
{
  const b = monde(2027);
  const samedis = b.dates.filter(d => new Date(d + 'T12:00:00').getDay() === 6);
  const s1 = samedis[0], s2 = samedis[2];
  const l1 = b.dates[b.dates.indexOf(s1) + 1], l2 = b.dates[b.dates.indexOf(s2) + 1];
  const r1 = b.dates[59], r2 = b.dates[60];
  b.poser('ALPHA', s1, 'G'); b.poser('ALPHA', l1, 'RG'); b.poser('ALPHA', r1, 'R');
  b.poser('BRAVO', s2, 'G'); b.poser('BRAVO', l2, 'RG'); b.poser('BRAVO', r2, 'R');
  b.cl.ajouter('LIENS_R_2027', [['SAMEDI','MEDECIN','DATE R'], [s1, 'ALPHA', r1], [s2, 'BRAVO', r2]]);
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'echange', year:2027, date:${JSON.stringify(s1)}, date2:${JSON.stringify(s2)}, receveur:'BRAVO' })`, b.ctx);
  b.notifs.length = 0;
  vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx);
  V('les gardes sont échangées', b.lire('BRAVO', s1) === 'G' && b.lire('ALPHA', s2) === 'G');
  V('les R restent en place', b.lire('ALPHA', r1) === 'R' && b.lire('BRAVO', r2) === 'R');
  V('aucune alerte comité', !b.notifs.some(n => n.cible && n.cible.role === 'admin'));
}

console.log('\n═══ 13. Expiration : rappel UNIQUE à 24 h, expirée à 48 h ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const r = vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  const f = b.cl.getSheetByName('ECHANGES');
  const ligne = f.lignes.findIndex(l => l[0] === r.id);
  const vieillir = h => { f.lignes[ligne][COL.CREE_LE] = new Date(Date.now() - h * 3600 * 1000).toISOString(); };

  b.notifs.length = 0;
  vieillir(10);
  vm.runInContext('expirerEchanges()', b.ctx);
  V('à 10 h : rien ne se passe', b.notifs.length === 0 && f.lignes[ligne][COL.ETAT] === 'attente');

  vieillir(30);
  vm.runInContext('expirerEchanges()', b.ctx);
  V('à 30 h : rappel au receveur, demande toujours en attente',
    b.notifs.length === 1 && b.notifs[0].cible.id === 'BRAVO' && f.lignes[ligne][COL.ETAT] === 'attente', b.notifs);
  V('l\'horodatage du rappel est posé', !!f.lignes[ligne][COL.RAPPEL_LE]);

  vm.runInContext('expirerEchanges()', b.ctx);
  V('relancer ne rappelle PAS une deuxième fois', b.notifs.length === 1);

  b.notifs.length = 0;
  vieillir(50);
  vm.runInContext('expirerEchanges()', b.ctx);
  V('à 50 h : expirée, demandeur notifié', f.lignes[ligne][COL.ETAT] === 'expiree'
    && b.notifs.length === 1 && b.notifs[0].cible.id === 'ALPHA', b.notifs);
  let refus = null;
  try { vm.runInContext(`repondreEchange(${JSON.stringify(user('BRAVO'))}, { id:${JSON.stringify(r.id)}, reponse:'accepter' })`, b.ctx); }
  catch (e) { refus = e.message; }
  V('une demande expirée ne s\'accepte plus', /expiree/i.test(refus || ''), refus);
}

console.log('\n═══ 14. La lecture pour le miroir reflète l\'onglet, telle quelle ═══');
{
  const b = monde(2027);
  /* Onglet ABSENT (état d'un classeur jamais utilisé) : la synchro horaire
     passe par cette lecture — elle doit renvoyer vide SANS créer l'onglet. */
  const env0 = vm.runInContext('getEchangesEnveloppe()', b.ctx);
  V('onglet absent : enveloppe vide, succès', env0.success === true && env0.echanges.length === 0);
  V('la LECTURE n\'a PAS créé l\'onglet', !b.cl.getSheetByName('ECHANGES'));
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  V('c\'est la CRÉATION d\'une demande qui crée l\'onglet', !!b.cl.getSheetByName('ECHANGES'));
  const env = vm.runInContext('getEchangesEnveloppe()', b.ctx);
  V('enveloppe {success:true, echanges:[…]}', env.success === true && Array.isArray(env.echanges) && env.echanges.length === 1);
  V('la ligne est complète et typée', (() => {
    const e = env.echanges[0];
    return e.type === 'don' && e.demandeur === 'ALPHA' && e.receveur === 'BRAVO' && e.etat === 'attente' && e.annee === 2027;
  })(), env.echanges[0]);
}

console.log('\n═══ 15. Le câblage de la clé `echanges` : Worker, miroir, synchro, accroches ═══');
{
  const worker = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8');
  const miroir = fs.readFileSync(path.join(__dirname, '..', 'gas', 'miroir.gs'), 'utf8');
  V('le Worker accepte la clé à l\'écriture', /\|echanges\|/.test(worker));
  V('le Worker la sert aux MAR comme aux admin', /cle === 'echanges'\) return true/.test(worker));
  V('le Worker sait cibler une notification par id et par rôle', /cible\.id/.test(worker) && /cible\.role/.test(worker));
  V('le miroir sait construire la famille', /_miroirAjouteEnveloppe_\(items, 'echanges'/.test(miroir));
  V('elle est reconstruite à la synchro horaire', /'echanges'[,\]]/.test(miroir));
  V('créer une demande la republie', /creerEchange:\s*\['echanges'\]/.test(miroir));
  V('répondre republie planning + echanges', /repondreEchange:\s*\[[^\]]*'echanges'/.test(miroir));
  V('une retouche manuelle de l\'onglet ECHANGES la republie', /ECHANGES:\s*\['echanges'\]/.test(miroir));
  V('notifierPush_ transmet la cible au Worker', /charge\.cible = cible/.test(miroir));
}

console.log('\n═══ 16. L\'interrupteur : fermé par défaut, pilotes nominatifs, ouverture en un geste ═══');
{
  /* Monde avec propriétés de script pilotables. */
  const b = monde(2027);
  const PROPS = {};
  b.ctx.PropertiesService = { getScriptProperties: () => ({
    getProperty: k => (k in PROPS ? PROPS[k] : (k === 'MIROIR_PUSH_TOKEN' ? 'JETON' : null)),
    setProperty: (k, v) => { PROPS[k] = String(v); },
    deleteProperty: k => { delete PROPS[k]; } }) };
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  const aut = (id, role) => vm.runInContext(`_echangesAutorise_(${JSON.stringify({ id: id, role: role || 'mar' })})`, b.ctx);

  V('fermé par défaut : un MAR n\'est pas autorisé', aut('ALPHA') === false);
  V('l\'admin passe toujours', aut('FROHLICH', 'admin') === true);

  PROPS.ECHANGES_PILOTES = 'ALPHA, BRAVO';
  V('les pilotes passent (liste hors dépôt, espaces tolérés)', aut('ALPHA') === true && aut('BRAVO') === true);
  V('les autres MAR restent dehors', aut('CHARLIE') === false);
  let refus = null;
  try { vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'CHARLIE' })`, b.ctx); }
  catch (e) { refus = e.message; }
  V('proposer à un NON-pilote est refusé (il ne verrait pas l\'écran)', /pas encore ouverts/.test(refus || ''), refus);
  V('proposer à un pilote passe', !!vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx).id);

  b.kv.length = 0;
  vm.runInContext('ouvrirEchanges()', b.ctx);
  V('ouvrirEchanges : tout le monde passe', aut('CHARLIE') === true);
  V('l\'état est répliqué au KV (notif_config)', b.kv.some(cles => cles.indexOf('notif_config') > -1), b.kv);
  V('l\'état poussé dit « ouvert »', PROPS.ECHANGES_OUVERTS === 'O');
  vm.runInContext('fermerEchanges()', b.ctx);
  V('fermerEchanges : retour au circuit pilotes', aut('CHARLIE') === false && aut('ALPHA') === true);
}

console.log('\n═══ 17. Le Worker applique le MÊME interrupteur (lecture `echanges` + abonnement) ═══');
{
  const worker = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8');
  V('notif_config est poussable par le GAS', /\|notif_config\|/.test(worker));
  V('notif_config n\'est JAMAIS servie par /read', /cle === 'notif_config'\) \{ refuses/.test(worker) || /\|\| cle === 'notif_config'/.test(worker));
  V('la clé `echanges` est soumise à l\'interrupteur', /cle === 'echanges' && !\(await echangesAutorise/.test(worker));
  V('l\'abonnement s\'ouvre par notif_config, pas par redéploiement', /notif_config/.test(worker.split('notifAbonner')[1] || ''));
}

console.log('\n═══ 18. La pastille d\'icône : la chaîne complète, du compteur au téléphone ═══');
{
  const b = monde(2027);
  const j = b.dates[9], lendemain = b.dates[10];
  b.poser('ALPHA', j, 'G'); b.poser('ALPHA', lendemain, 'RG');
  b.poser('ALPHA', b.dates[16], 'G'); b.poser('ALPHA', b.dates[17], 'RG');
  vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(j)}, receveur:'BRAVO' })`, b.ctx);
  V('1re demande : la notification porte pastille = 1', b.notifs[0].cible && b.notifs[0].cible.pastille === 1, b.notifs[0]);
  vm.runInContext(`creerEchange(${JSON.stringify(user('ALPHA'))}, { type:'don', year:2027, date:${JSON.stringify(b.dates[16])}, receveur:'BRAVO' })`, b.ctx);
  V('2e demande au même receveur : pastille = 2', b.notifs[1].cible && b.notifs[1].cible.pastille === 2, b.notifs[1]);

  const miroir = fs.readFileSync(path.join(__dirname, '..', 'gas', 'miroir.gs'), 'utf8');
  const worker = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8');
  const dash   = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
  V('le miroir transporte le nombre', /charge\.pastille = cible\.pastille/.test(miroir));
  V('le Worker le met dans la charge chiffrée (plafonné à 99)', /pastille:.*Math\.min\(corps\.pastille, 99\)/.test(worker));
  /* La pose par sw.js (v4) est vérifiée dans banc_notif.mjs : elle part avec
     lui dans le SECOND push (le gel du canal tient jusqu'au 4/09). */
  V('le portail l\'efface à l\'ouverture', /clearAppBadge/.test(dash));
}

console.log('\n' + ok + ' OK · ' + ko + ' en échec');
if (ko) process.exit(1);
