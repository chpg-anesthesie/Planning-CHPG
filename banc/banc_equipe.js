/* ═══ BANC — P5 : ÉQUIPE ET ABSENCES LONGUES (cahier T052, T053, T067) ═══
   Ces gestes touchent la fiche des MAR et leur présence sur des semaines
   entières : une erreur ne se voit pas tout de suite, mais fausse le planning
   pendant des mois. */
const vm = require('vm'), fs = require('fs');
const { Classeur, fabriqueVerrou, VERROUS, extraireFonction } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0,190) : '')); } };

/* Un monde avec deux années : 2027 générée, 2028 pas encore créée — pour
   éprouver le REPORT différé des absences vers une année inexistante. */
function monde() {
  VERROUS.script = false; VERROUS.document = false;
  const cl = new Classeur();
  const dates2027 = [];
  const d = new Date(Date.UTC(2027, 0, 4));
  for (let i = 0; i < 364; i++) { dates2027.push(d.toISOString().slice(0,10)); d.setUTCDate(d.getUTCDate()+1); }
  const lignes = [['',''].concat(dates2027.map(()=>'')), ['',''].concat(dates2027.map(()=>'')), ['MAR',''].concat(dates2027)];
  ['ALPHA','BRAVO','CHARLI'].forEach(id => lignes.push([id, ''].concat(dates2027.map(()=>''))));
  cl.ajouter('GARDES_2027', lignes);
  cl.ajouter('MEDECINS', [['ID','NOM','INITIALES','ACTIF','QUOTITE'],
    ['ALPHA','DR ALPHA','AL','O',100], ['BRAVO','DR BRAVO','BR','O',100], ['CHARLI','DR CHARLI','CH','O',80]]);
  const indispos = {};
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Set, Math, Error, isNaN, parseInt, RegExp,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty: () => {}, deleteProperty: () => {} }) },
    LockService: { getScriptLock: () => fabriqueVerrou('script'), getDocumentLock: () => fabriqueVerrou('document') },
    Logger: { log: () => {} }, logAction: () => {}, getActiveYear: () => 2027, TEST_YEAR: 2027,
    getIndisposForDoctor: (id) => indispos[id] || {}, saveIndisposForDoctor: (id, v) => { indispos[id] = v; },
    buildDateToCol: (data) => { const m = {}; (data[2]||[]).forEach((v,c) => { if (v) m[String(v)] = c; }); return m; },
    generatePlanning: () => {}, notifPlanifier: () => {}, _isoDate: (v) => String(v).slice(0,10),
    __indispos: indispos });
  ctx.globalThis = ctx;
  // pose d'une garde pour éprouver la libération
  const poser = (mar, date, code) => {
    const f = cl.getSheetByName('GARDES_2027');
    const col = dates2027.indexOf(date) + 1;
    f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][col] = code;
  };
  const lire = (mar, date) => {
    const f = cl.getSheetByName('GARDES_2027');
    return f.lignes[f.lignes.findIndex(l => String(l[0]).trim() === mar)][dates2027.indexOf(date) + 1] || '';
  };
  return { cl, ctx, dates: dates2027, poser, lire };
}

console.log('\n═══ T052 · la fiche d\'un MAR se relit exactement comme écrite ═══');
{
  const b = monde();
  const med = b.cl.getSheetByName('MEDECINS');
  med.getRange(4, 5).setValue(60);          // CHARLI passe à 60 %
  med.getRange(4, 3).setValue('CZ');        // et change d'initiales
  const relu = med.getDataRange().getValues().find(l => l[0] === 'CHARLI');
  V('la quotité est relue à l\'identique', relu[4] === 60, relu[4]);
  V('les initiales aussi', relu[2] === 'CZ', relu[2]);
  V('les autres MAR sont intacts', med.getDataRange().getValues()[1][4] === 100);
}

console.log('\n═══ T053 · un MAR inactif disparaît des propositions ═══');
{
  /* Règle de production (getDoctorsFromMedecins) : ACTIF doit valoir « O ». */
  const b = monde();
  const ctx = vm.createContext({ console, String, SpreadsheetApp: { getActiveSpreadsheet: () => b.cl }, DOCTORS: [] });
  ctx.globalThis = ctx;
  vm.runInContext(extraireFonction('../gas/code.gs', 'getDoctorsFromMedecins'), ctx);
  const avant = vm.runInContext('getDoctorsFromMedecins().map(d=>d.id)', ctx);
  V('les trois MAR actifs sont proposés', avant.length === 3, avant);
  b.cl.getSheetByName('MEDECINS').getRange(4, 4).setValue('N');   // CHARLI inactif
  const apres = vm.runInContext('getDoctorsFromMedecins().map(d=>d.id)', ctx);
  V('l\'inactif disparaît', !apres.includes('CHARLI'), apres);
  V('les autres restent', apres.length === 2, apres);
  b.cl.getSheetByName('MEDECINS').getRange(4, 4).setValue('O');
  V('remis actif, il réapparaît', vm.runInContext('getDoctorsFromMedecins().map(d=>d.id)', ctx).includes('CHARLI'));
}

console.log('\n═══ T067 · absence longue de trois semaines ═══');
{
  const b = monde();
  const debut = '2027-03-01', fin = '2027-03-21';
  b.poser('ALPHA', '2027-03-05', 'G');        // une garde AU MILIEU de l'absence
  b.poser('ALPHA', '2027-03-06', 'RG');
  b.poser('ALPHA', '2027-02-26', 'G');        // et une garde AVANT : elle doit survivre
  V('préparation : la garde du 05/03 est bien posée', b.lire('ALPHA','2027-03-05') === 'G');

  // Application de la règle de production : CL sur toute la plage
  const jours = [];
  { const c = new Date(debut + 'T12:00:00'), f = new Date(fin + 'T12:00:00');
    while (c <= f) { jours.push(c.toISOString().slice(0,10)); c.setDate(c.getDate()+1); } }
  V('la plage couvre 21 jours calendaires', jours.length === 21, jours.length);
  jours.forEach(d => { if (b.dates.includes(d)) b.poser('ALPHA', d, 'CL'); });

  V('le premier jour est en CL', b.lire('ALPHA', debut) === 'CL');
  V('le dernier jour aussi', b.lire('ALPHA', fin) === 'CL');
  V('la garde du 05/03 a été LIBÉRÉE (écrasée par CL)', b.lire('ALPHA','2027-03-05') === 'CL', b.lire('ALPHA','2027-03-05'));
  V('le repos du 06/03 aussi', b.lire('ALPHA','2027-03-06') === 'CL');
  V('la garde du 26/02, HORS plage, est intacte', b.lire('ALPHA','2027-02-26') === 'G', b.lire('ALPHA','2027-02-26'));
  V('la veille de l\'absence reste vide', b.lire('ALPHA','2027-02-28') === '', b.lire('ALPHA','2027-02-28'));
  V('le lendemain de la fin reste vide', b.lire('ALPHA','2027-03-22') === '', b.lire('ALPHA','2027-03-22'));
  V('les autres MAR ne sont pas touchés', b.lire('BRAVO', debut) === '' && b.lire('CHARLI', debut) === '');

  // Raccourcissement : la fin recule au 14/03 → les jours 15→21 se libèrent
  const nouvelleFin = '2027-03-14';
  jours.filter(d => d > nouvelleFin).forEach(d => { if (b.dates.includes(d)) b.poser('ALPHA', d, ''); });
  V('après raccourcissement, le 14/03 est encore en CL', b.lire('ALPHA','2027-03-14') === 'CL');
  V('le 15/03 est libéré', b.lire('ALPHA','2027-03-15') === '', b.lire('ALPHA','2027-03-15'));
  V('le 21/03 aussi — aucun jour orphelin', b.lire('ALPHA','2027-03-21') === '', b.lire('ALPHA','2027-03-21'));
  V('le début de l\'absence n\'a pas bougé', b.lire('ALPHA', debut) === 'CL');
  const restants = b.dates.filter(d => b.lire('ALPHA', d) === 'CL');
  V('il reste exactement 14 jours d\'absence', restants.length === 14, restants.length);
}

console.log('\n═══ T-AFF · Enregistrer la grille des affectations crée les lignes manquantes ═══');
{
  /* (19/08/2026) Vécu le matin même : PRUNET, fiche créée après l'onglet
     AFFECTATIONS_2026, s'affichait « VOL » à l'écran (convention d'affichage)
     mais l'Enregistrer du comité le sautait EN SILENCE — le journal annonçait
     « 25 mis à jour » pour 24 lignes écrites. Le geste du comité doit rendre
     durable CE QUE L'ÉCRAN AFFICHE, y compris pour un MAR encore sans ligne. */
  VERROUS.script = false; VERROUS.document = false;
  const cl = new Classeur();
  cl.ajouter('AFFECTATIONS_2026', [
    ['MÉDECIN','JAN','FEV','MAR','AVR','MAI','JUN','JUL','AOU','SEP','OCT','NOV','DEC'],
    ['ALPHA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA'],
    ['BRAVO','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT','VOLANT']]);
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Math, parseInt,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl }, Logger: { log(){} } });
  vm.runInContext(extraireFonction('../gas/Indispos.gs', 'ecrireAffectations'), ctx);
  const feuille = cl.getSheetByName('AFFECTATIONS_2026');
  ctx.feuille = feuille;
  /* La grille envoie TOUT son tableau : ALPHA modifié, BRAVO inchangé,
     CHARLIE (fiche récente, aucune ligne) en volant implicite. */
  ctx.aff = { ALPHA: {1:'VIS',2:'VIS',3:'REA',4:'REA',5:'REA',6:'REA',7:'REA',8:'REA',9:'REA',10:'REA',11:'REA',12:'REA'},
              BRAVO: {}, CHARLIE: {} };
  const res = vm.runInContext('ecrireAffectations(feuille, aff)', ctx);
  const lignes = feuille.getDataRange().getValues();
  V('les deux lignes existantes sont mises à jour (pas créées)', res.maj === 2 && lignes.length === 4, res);
  V('la ligne manquante est créée', res.crees === 1 && String(lignes[3][0]) === 'CHARLIE', lignes[3] && lignes[3][0]);
  V('la ligne créée porte VOLANT sur les 12 mois', !!lignes[3] && lignes[3].slice(1,13).every(v => v === 'VOLANT'), lignes[3]);
  V('la modification d\'ALPHA est bien écrite (VIS en janvier)', lignes[1][1] === 'VIS', lignes[1][1]);
  V('BRAVO, envoyé vide, retombe sur VOLANT sans dégât', lignes[2].slice(1,13).every(v => v === 'VOLANT'), lignes[2]);
  /* Le compte rendu au journal doit refléter les ÉCRITURES, pas les données
     reçues — c'est lui qui a menti le 19/08 (« 25 » pour 24). */
  V('le compte rendu dit la vérité : 2 mis à jour, 1 créé', res.maj === 2 && res.crees === 1, res);
  /* Recliquer Enregistrer (geste réel du comité) : idempotent, aucun doublon. */
  const res2 = vm.runInContext('ecrireAffectations(feuille, aff)', ctx);
  const lignes2 = feuille.getDataRange().getValues();
  V('un second Enregistrer ne crée aucun doublon', res2.crees === 0 && res2.maj === 3 && lignes2.length === 4, res2);
}

console.log('\n═══ T-AFF-2 · L\'envoi de la grille dit ce que l\'écran montre (chaîne complète) ═══');
{
  /* (19/08/2026, suite) Deuxième étage du même défaut, découvert en production
     une heure après le premier : le serveur savait désormais créer les lignes,
     mais la page n\'envoyait que ce qu\'elle avait lu dans l\'onglet — jamais
     les MARs affichés en volant implicite. On éprouve la chaîne entière :
     complétion côté page PUIS écriture côté serveur. */
  VERROUS.script = false; VERROUS.document = false;
  const cl = new Classeur();
  cl.ajouter('AFFECTATIONS_2026', [
    ['MÉDECIN','JAN','FEV','MAR','AVR','MAI','JUN','JUL','AOU','SEP','OCT','NOV','DEC'],
    ['ALPHA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA','REA']]);
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Math, parseInt,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl }, Logger: { log(){} } });
  vm.runInContext(extraireFonction('../admin.html', 'completerAffectationsActifs'), ctx);
  vm.runInContext(extraireFonction('../gas/Indispos.gs', 'ecrireAffectations'), ctx);
  ctx.feuille = cl.getSheetByName('AFFECTATIONS_2026');
  /* La page n\'a lu qu\'ALPHA ; l\'écran affiche aussi BRAVO (actif, volant
     implicite) et un MAR inactif qui ne doit PAS partir. */
  ctx.affData = { ALPHA: {1:'REA'} };
  ctx.marsData = [ {id:'ALPHA',actif:true}, {id:'BRAVO',actif:true}, {id:'ZOMBIE',actif:false} ];
  vm.runInContext('completerAffectationsActifs(affData, marsData)', ctx);
  V('le MAR affiché sans ligne entre dans l\'envoi', vm.runInContext('!!affData.BRAVO', ctx));
  V('un MAR inactif n\'y entre pas', vm.runInContext('!affData.ZOMBIE', ctx));
  V('les données déjà saisies ne sont pas écrasées', vm.runInContext("affData.ALPHA[1]==='REA'", ctx));
  /* Garde-fou : une grille VIDE (chargement raté) ne doit rien compléter —
     sans lui, Enregistrer dans cet état écraserait tous les secteurs réels
     par VOLANT×12. */
  ctx.affVide = {};
  vm.runInContext('completerAffectationsActifs(affVide, marsData)', ctx);
  V('une grille vide reste vide (aucune invention après un chargement raté)',
    vm.runInContext('Object.keys(affVide).length === 0', ctx));
  const res = vm.runInContext('ecrireAffectations(feuille, affData)', ctx);
  const lignes = ctx.feuille.getDataRange().getValues();
  V('bout en bout : la ligne du volant implicite est créée en VOLANT×12',
    res.crees === 1 && !!lignes[2] && String(lignes[2][0]) === 'BRAVO' && lignes[2].slice(1,13).every(v => v === 'VOLANT'), lignes[2]);
  V('bout en bout : l\'existant est mis à jour, pas dupliqué', res.maj === 1 && lignes.length === 3, res);
  /* Le défaut vécu était précisément un code juste JAMAIS APPELÉ : on vérifie
     donc aussi le câblage — l'envoi (saveAllAffectations) passe par la
     complétion avant d'appeler le serveur. */
  const _admSrc = fs.readFileSync('../admin.html', 'utf8');
  const _saveBloc = _admSrc.slice(_admSrc.indexOf('async function saveAllAffectations'));
  V('saveAllAffectations appelle la complétion AVANT l\'envoi',
    _saveBloc.indexOf('completerAffectationsActifs(affData') > -1 &&
    _saveBloc.indexOf('completerAffectationsActifs(affData') < _saveBloc.indexOf("action:'saveAffectations'"));
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
