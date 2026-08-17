/* ═══ BANC — MODULE LIBÉRAL ═══
   Le relevé mensuel du groupement : ce que le classeur rend vraiment, et ce
   que les deux écrans qui le lisent (suivi-liberal.html, absences.html) en
   font. Défaut fondateur, constaté à l'écran le 17/08/2026 : le mois écrit
   « 2026-07 » revenait sous forme de DATE, la page affichait
   « cumul janvier → undefined Wed », et le « dernier mois » — choisi par un
   tri alphabétique — comparait des noms de jours anglais.
   Ce fichier fait tourner le VRAI getReleveLiberal du dépôt sur un classeur
   qui se comporte comme le vrai Sheets (la doublure coerce « 2026-07 » en
   date, exactement comme Google). */
const vm = require('vm'), fs = require('fs');
const { Classeur, extraireFonction } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 200) : '')); } };

/* Les constantes du fichier de production (en-têtes d'onglet) sont reprises
   TELLES QUELLES : les recopier ici les ferait diverger en silence. */
function extraireConst(fichier, nom) {
  const src = fs.readFileSync(fichier, 'utf8');
  const i = src.indexOf('const ' + nom);
  if (i < 0) throw new Error(nom + ' introuvable dans ' + fichier);
  let prof = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '[' || c === '(') prof++;
    else if (c === ']' || c === ')') prof--;
    else if (c === ';' && prof === 0) return src.slice(i, j + 1);
  }
  throw new Error(nom + ' : fin de déclaration introuvable');
}

const MEMBRES = ['ALPHA', 'BRAVO', 'CHARLIE'];

function monde(annee) {
  const cl = new Classeur();
  cl.ajouter('MEDECINS', [['ID', 'NOM', 'INITIALES', 'ACTIF', 'LIBERAL']]
    .concat(MEMBRES.map(id => [id, 'Dr ' + id, id.slice(0, 2), 'O', 'O']))
    .concat([['DELTA', 'Dr DELTA', 'DE', 'O', 'N']]));           // hors groupement
  const MOIS = ['JAN', 'FEV', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPT', 'OCT', 'NOV', 'DEC'];
  cl.ajouter('AFFECTATIONS_' + annee, [['MAR'].concat(MOIS.map(m => m + ' ' + annee))]
    .concat(MEMBRES.map(id => [id].concat(MOIS.map(() => 'ORL')))));

  const ctx = vm.createContext({
    console, JSON, Date, Number, String, Object, Array, Math, Error, isNaN, isFinite, parseInt, parseFloat, RegExp,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl },
    Logger: { log: () => {} },
    Session: { getScriptTimeZone: () => 'Europe/Monaco' },
    Utilities: { formatDate: (d, tz, f) => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) },
  });
  ctx.globalThis = ctx;
  ['LIBERAL_CA_HEADER'].forEach(n => vm.runInContext(extraireConst('../gas/portail.gs', n), ctx));
  ['_libCaSheetName', '_membresLiberal_', 'getOrCreateLiberalCaTab', '_libMoisISO_',
   '_todayISO_', '_libYearOf', 'getReleveLiberal']
    .forEach(n => vm.runInContext(extraireFonction('../gas/portail.gs', n), ctx));
  return { cl, ctx, annee };
}

/* Écrit une ligne de relevé comme Arthur le fait à la main : on ne touche QUE
   les six nombres, la colonne MOIS reste celle que le code a posée. */
function saisir(cl, annee, mois, marId, tCcam, pctCcam, excCcam) {
  const sh = cl.getSheetByName('LIBERAL_CA_' + annee);
  const cible = String(mois);
  for (let r = 1; r < sh.lignes.length; r++) {
    const m = sh.lignes[r][0];
    const iso = (m && typeof m.getFullYear === 'function')
      ? m.getFullYear() + '-' + ('0' + (m.getMonth() + 1)).slice(-2) : String(m);
    if (iso === cible && String(sh.lignes[r][1]).trim() === marId) {
      sh.lignes[r][2] = tCcam; sh.lignes[r][3] = pctCcam; sh.lignes[r][4] = excCcam;
      return true;
    }
  }
  return false;
}

console.log('\n═══ 1. Le relevé créé par le code se relit au bon format ═══');
{
  const { cl, ctx, annee } = monde(2026);
  vm.runInContext('getOrCreateLiberalCaTab(' + annee + ')', ctx);
  const sh = cl.getSheetByName('LIBERAL_CA_' + annee);
  V('l\'onglet est pré-rempli : 12 mois × 3 membres', sh.lignes.length === 1 + 36, sh.lignes.length);
  V('le non-membre du groupement n\'y figure pas',
    !sh.lignes.some(l => String(l[1]) === 'DELTA'));

  /* LE PIÈGE : la colonne MOIS n'est PAS du texte dans le classeur. La
     doublure coerce comme le vrai Sheets ; si un jour ce n'était plus vrai,
     cette vérification le dirait — sans elle, tout ce qui suit ne prouve rien. */
  V('⚠ le classeur a bien transformé « 2026-01 » en DATE (comme le vrai Sheets)',
    !!(sh.lignes[1][0] && typeof sh.lignes[1][0].getFullYear === 'function'), String(sh.lignes[1][0]));

  V('saisie de juin acceptée', saisir(cl, annee, '2026-06', 'ALPHA', 10000, 35.8, 1200));
  const r = vm.runInContext('getReleveLiberal({year:2026})', ctx);
  V('le relevé remonte la seule ligne saisie', r.items.length === 1, r.items.length);
  V('le mois revient au format AAAA-MM, jamais une date bavarde',
    /^\d{4}-\d{2}$/.test(r.items[0].mois), r.items[0].mois);
  V('c\'est bien juin', r.items[0].mois === '2026-06', r.items[0].mois);
  /* Ce que fait la page pour écrire « cumul janvier → juin » : sans un mois
     numérique, elle affichait « undefined ». */
  const mm = parseInt(r.items[0].mois.slice(5, 7), 10);
  V('la page peut en tirer un numéro de mois lisible (1-12)', mm === 6, mm);
  V('le nom du membre accompagne l\'identifiant', r.items[0].nom === 'Dr ALPHA', r.items[0].nom);
}

console.log('\n═══ 2. Le dernier mois saisi est le plus RÉCENT, pas le plus alphabétique ═══');
/* Cœur du défaut : les deux écrans retiennent le dernier mois par
   `items.map(i => i.mois).sort().pop()`. Avec des dates, ce tri comparait
   « Sat Aug… » à « Wed Jul… » et gardait juillet. On rejoue tous les couples
   de mois de 2026 : aucun ne doit se tromper. */
{
  const { cl, ctx, annee } = monde(2026);
  vm.runInContext('getOrCreateLiberalCaTab(' + annee + ')', ctx);
  for (let m = 1; m <= 12; m++) {
    const mois = '2026-' + ('0' + m).slice(-2);
    saisir(cl, annee, mois, 'ALPHA', 1000 * m, 30 + m, 100 * m);
  }
  const r = vm.runInContext('getReleveLiberal({year:2026})', ctx);
  V('les 12 mois saisis remontent', r.items.length === 12, r.items.length);
  const dernier = r.items.map(i => i.mois).sort().pop();     // la ligne exacte des deux pages
  V('le tri des pages retient DÉCEMBRE, pas juillet', dernier === '2026-12', dernier);

  const suite = r.items.map(i => i.mois).sort();
  V('les mois sortent dans l\'ordre du calendrier',
    suite.join(',') === Array.from({length:12}, (_,i) => '2026-' + ('0'+(i+1)).slice(-2)).join(','), suite);
}

console.log('\n═══ 3. Août ne doit plus se faire voler la vedette par juillet ═══');
/* Le cas exact qui allait se produire : le relevé d'août recopié en
   septembre, la page continuant d'afficher juillet sans rien dire. */
{
  const { cl, ctx, annee } = monde(2026);
  vm.runInContext('getOrCreateLiberalCaTab(' + annee + ')', ctx);
  saisir(cl, annee, '2026-07', 'ALPHA', 10000, 36.0, 1500);
  saisir(cl, annee, '2026-08', 'ALPHA', 12000, 34.0, 1300);
  const r = vm.runInContext('getReleveLiberal({year:2026})', ctx);
  const dernier = r.items.map(i => i.mois).sort().pop();
  V('août l\'emporte sur juillet', dernier === '2026-08', dernier);
  const lignes = r.items.filter(i => i.mois === dernier);
  V('la page n\'affiche que les lignes du mois retenu', lignes.length === 1 && lignes[0].pctCcam === 34.0, lignes);
}

console.log('\n═══ 4. Un mois saisi autrement reste lisible ═══');
{
  const { cl, ctx, annee } = monde(2026);
  vm.runInContext('getOrCreateLiberalCaTab(' + annee + ')', ctx);
  const sh = cl.getSheetByName('LIBERAL_CA_' + annee);
  // ligne 2 : mois réécrit à la main en TEXTE (format texte forcé dans Sheets)
  sh.lignes[1][0] = '2026-01'; sh.lignes[1][2] = 5000; sh.lignes[1][3] = 25;
  // ligne 3 : mois posé sur un jour quelconque du mois (saisie « 15/02/2026 »)
  sh.lignes[2][0] = new Date(2026, 1, 15); sh.lignes[2][2] = 6000; sh.lignes[2][3] = 26;
  const r = vm.runInContext('getReleveLiberal({year:2026})', ctx);
  const mois = r.items.map(i => i.mois).sort();
  V('un mois resté en texte est accepté tel quel', mois.indexOf('2026-01') >= 0, mois);
  V('une date au 15 du mois est ramenée au mois', mois.indexOf('2026-02') >= 0, mois);
  V('aucun mois illisible ne passe', r.items.every(i => /^\d{4}-\d{2}$/.test(i.mois)), mois);
}

console.log('\n═══ 5. Ce qui n\'est pas saisi n\'existe pas ═══');
{
  const { cl, ctx, annee } = monde(2026);
  vm.runInContext('getOrCreateLiberalCaTab(' + annee + ')', ctx);
  const r = vm.runInContext('getReleveLiberal({year:2026})', ctx);
  V('un onglet pré-rempli mais vierge ne remonte AUCUNE ligne', r.items.length === 0, r.items.length);
  V('la réponse reste un succès (ce n\'est pas une erreur)', r.success === true);
  const r2 = vm.runInContext('getReleveLiberal({year:2019})', ctx);
  V('une année sans onglet renvoie une liste vide, pas une panne',
    r2.success === true && r2.items.length === 0, r2);
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
