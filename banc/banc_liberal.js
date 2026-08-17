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

console.log('\n═══ 6. La page de cotation ne dit rien qu\'elle ne sache ═══');
/* (17/08/2026) Trois défauts corrigés le même jour, tous invisibles au banc
   parce qu'aucune vérification ne lisait cette page :
   - deux « socles » écrits en dur (50 000 € à 25 %) alimentaient des cadrans
     « % projeté » et « marge » : chacun y lisait une position qui n'était pas
     la sienne ;
   - un texte promettait un bouton « Déclarer » sur chaque parcours, qui
     n'existe pas ;
   - aucune sortie vers le portail.
   Contre-preuve faite à la main sur la version précédente du fichier :
   ces cinq vérifications y échouent. */
{
  const page = fs.readFileSync('../docs/module-liberal/estimateur-liberal.html', 'utf8');
  V('aucun socle financier écrit en dur',
    !/id="(Tc|Pc|Tn|Pn)"/.test(page));
  V('aucun cadran « % projeté » sur la page de cotation',
    !/id="(pctC|pctN|mrgC|mrgN)"/.test(page) && !/projAxis/.test(page));
  V('une sortie vers le portail existe',
    /href="\.\.\/\.\.\/dashboard\.html"/.test(page));
  V('la page ne promet plus un bouton « Déclarer » par parcours',
    !/bouton <b>📅 Déclarer<\/b> d'un parcours/.test(page));
  V('elle renvoie vers la page qui, elle, connaît la position',
    /Suivi des 30 %/.test(page));

  /* Le guide décrit le même geste : s'il continue d'annoncer un bouton par
     parcours, l'utilisateur le cherchera. */
  const guide = fs.readFileSync('../docs/guide-liberal.html', 'utf8');
  V('le guide décrit l\'encadré de déclaration, pas un bouton de parcours',
    !/📅 Déclarer<\/span> sur le parcours/.test(guide) && /Déclarer une intervention/.test(guide));

  /* Le suivi des 30 %, lui, DOIT garder ses chiffres : c'est sa raison d'être.
     Sans cette vérification, « retirer les cadrans » pourrait un jour être
     appliqué à la mauvaise page. */
  const suivi = fs.readFileSync('../suivi-liberal.html', 'utf8');
  V('la page de suivi garde bien, elle, la position par axe',
    /Axe CCAM/.test(suivi) && /Axe NGAP/.test(suivi) && /getReleveLiberal/.test(suivi));

  /* (17/08/2026) L'index CCAM etait retelecharge a CHAQUE ouverture (cache
     'no-store') : ~160 Ko sur le reseau du telephone, en consultation, par
     patient. Il ne change que deux fois par an. */
  V('le référentiel CCAM n\'est plus retéléchargé à chaque ouverture',
    !/fetch\(u,\s*\{\s*cache:'no-store'\s*\}\)/.test(page) && /ccam_actes\.json\?v=/.test(page));
  const meta = JSON.parse(fs.readFileSync('../docs/module-liberal/ccam_actes.json', 'utf8')).meta;
  V('l\'étiquette de version du fichier suit la version CCAM',
    new RegExp('ccam_actes\\.json\\?v=' + String(meta.version).replace(/\D+/g, '')).test(page),
    [meta.version, (page.match(/ccam_actes\.json\?v=\d+/) || [])[0]]);

  /* Les deux cles ajoutees au relais doivent etre lisibles par un MAR, sans
     quoi la page repart sur les quatre appels d'avant. */
  const worker = fs.readFileSync('../cloudflare/worker.js', 'utf8');
  V('le relais connaît les deux nouvelles listes',
    /specialites\|cotations_type/.test(worker) && /cle === 'specialites' \|\| cle === 'cotations_type'/.test(worker));
  const mir = fs.readFileSync('../gas/miroir.gs', 'utf8');
  V('elles sont rafraîchies quand on modifie leur onglet',
    /SPECIALITES:\s*\['specialites'\]/.test(mir) && /COTATIONS_TYPE:\s*\['cotations_type'\]/.test(mir));
  V('et la synchronisation complète les pousse',
    /'specialites', 'cotations_type'/.test(mir));
}

/* ═══════════════════════════════════════════════════════════════════
   7. LA PAGE, PILOTÉE AU CLIC (17/08/2026)

   La page de cotation n'avait AUCUNE vérification : c'est pourtant la seule
   que les dix-neuf membres du groupement toucheront. On la charge ici telle
   quelle, servie par le VRAI Worker, et on refait le geste complet d'une
   consultation : contexte → cotation type → jour du bloc → déclarer.
   ═══════════════════════════════════════════════════════════════════ */
(async () => {
  const { JSDOM, VirtualConsole } = require('jsdom');
  const vm2 = require('vm');
  const dodo = ms => new Promise(r => setTimeout(r, ms));
  console.log('\n═══ 7. La consultation, du premier clic à la déclaration ═══');

  // ── Le vrai Worker, sur un KV en mémoire ──
  const wsrc = fs.readFileSync('../cloudflare/worker.js', 'utf8').replace('export default', 'globalThis.__W =');
  const wctx = vm2.createContext({ globalThis:{}, console, crypto, TextEncoder, Response, Request, URL,
                                   JSON, Date, Math, Object, Array, String, Number, Set, Promise });
  wctx.globalThis = wctx; vm2.runInContext(wsrc, wctx);
  const WK = wctx.__W, M = new Map();
  const KV = { get: async k => (M.has(k) ? M.get(k) : null), put: async (k,v) => { M.set(k,v); },
               delete: async k => { M.delete(k); },
               list: async ({prefix,limit}) => ({ keys:[...M.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit||1000).map(name=>({name})) }) };
  const sha = async t => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
                           return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); };
  const CODE = 'MARCODE77';
  M.set('acces', JSON.stringify({ indisposYear: 2026, users: [
    { h: await sha(CODE), role:'mar', id:'ALPHA', name:'Dr ALPHA', initials:'AL', prenom:'Jean', liberal:true, rpps:'10000000001' }]}));
  M.set('secteurs', JSON.stringify([
    { code:'END', label:'Endoscopies',        ordre:5, actif:true, aff:true, rendement:'FORT'  },
    { code:'ORL', label:'ORL / Ophtalmologie', ordre:4, actif:true, aff:true, rendement:'FORT' },
    { code:'REA', label:'Réanimation',        ordre:2, actif:true, aff:true, rendement:'REA'   }]));
  M.set('specialites', JSON.stringify([
    { code:'END', label:'Endoscopies digestives', actif:true },
    { code:'OPH', label:'Ophtalmologie (cataracte)', actif:true },
    { code:'ORL', label:'ORL / stomatologie', actif:true }]));
  M.set('cotations_type', JSON.stringify([
    { groupe:'Endoscopie', nom:'Gastro + colo', lc:'CS', lignes:[
      { code:'HHQE002', ordre:1, role:'principal', mod7:true, modA:false },
      { code:'ZZLP025', ordre:2, role:'associe',   mod7:true, modA:false }]}]));
  const env = { KV, PUSH_TOKEN:'JETON' };

  // ── La page réelle ──
  const html = fs.readFileSync('../docs/module-liberal/estimateur-liberal.html', 'utf8');
  const vc = new VirtualConsole(); const erreurs = [];
  vc.on('jsdomError', e => erreurs.push(e.message));
  const envois = [];                       // ce qui part vers Apps Script
  const dom = new JSDOM(html, { runScripts:'dangerously', virtualConsole:vc, pretendToBeVisual:true,
    url:'https://chpg-anesthesie.github.io/Planning-CHPG/docs/module-liberal/estimateur-liberal.html',
    beforeParse(win) {
      win.scrollTo = () => {};
      win.alert = () => {};
      win.confirm = () => true;
      win.sessionStorage.setItem('chpgViewCode', CODE);
      win.fetch = async (url, opt) => {
        const u = String(url);
        if (u.includes('workers.dev')) {
          const chemin = u.replace(/^https:\/\/[^/]+/, '');
          return WK.fetch(new Request('https://worker' + chemin, { method:'POST', body: opt.body }), env);
        }
        if (u.includes('ccam_actes.json')) {
          const j = JSON.parse(fs.readFileSync('../docs/module-liberal/ccam_actes.json', 'utf8'));
          return { ok:true, json: async () => j };
        }
        const p = JSON.parse(opt.body || '{}');
        envois.push(p);
        if (p.action === 'declareLiberal') return { ok:true, json: async () => ({ success:true, id:'L-TEST' }) };
        if (p.action === 'listLiberal')    return { ok:true, json: async () => ({ success:true, year:2026, items:[] }) };
        return { ok:true, json: async () => ({ success:false, error:'Apps Script ne doit pas être appelé ici' }) };
      };
    } });
  const w = dom.window, d = w.document;
  /* `let` au premier niveau d'un script ne se pose PAS sur window : les
     variables d'état de la page (builder, CCAM_INDEX…) se lisent par eval. */
  const ev = expr => w.eval(expr);
  await dodo(900);

  V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
  V('le référentiel CCAM est chargé et allégé aux actes tarifés',
    ev('CCAM_INDEX.length') > 3000 && ev('CCAM_INDEX.every(a => a.t > 0)'), ev('CCAM_INDEX.length'));

  /* Le point de départ de toute la refonte : UN aller-retour au démarrage.
     Les quatre appels lancés ensemble faisaient tomber les derniers. */
  V('aucun appel à Apps Script pour les listes du démarrage',
    !envois.some(p => ['getSecteurs','getSpecialites','getCotationsType','login'].indexOf(p.action) >= 0),
    envois.map(p => p.action));

  V('l\'identité est pré-remplie', d.getElementById('cfgPrat').value === 'Jean ALPHA', d.getElementById('cfgPrat').value);
  V('le RPPS aussi', d.getElementById('cfgRPPS').value === '10000000001');
  const secs = [...d.getElementById('dclSec').options].map(o => o.value).filter(Boolean);
  V('les secteurs sont proposés', secs.indexOf('END') >= 0 && secs.indexOf('ORL') >= 0, secs);
  V('la réanimation, sans libéral, n\'est pas proposée', secs.indexOf('REA') < 0, secs);
  V('les spécialités sont proposées',
    [...d.getElementById('dclSpec').options].map(o => o.value).indexOf('OPH') >= 0);
  V('la barre des cotations types est visible',
    d.getElementById('cotTypeBar').style.display === 'flex', d.getElementById('cotTypeBar').style.display);

  // ── Le geste : contexte → cotation type ──
  w.choisirGroupeCotType('Endoscopie');
  const btns = d.getElementById('cotTypeBtns').querySelectorAll('button');
  V('le contexte Endoscopie propose sa cotation', btns.length === 1, btns.length);
  btns[0].click();
  await dodo(60);
  V('un clic pose la cotation entière (2 actes)', ev('builder.length') === 2, ev('builder.map(l=>l.code)'));
  V('le modificateur 7 est posé', ev('builder.every(l => l.m7 === true)'));
  V('la chirurgie se pré-remplit depuis l\'acte', d.getElementById('dclChir').value.length > 3, d.getElementById('dclChir').value);

  // ── Déclarer sans jour de bloc : refusé, et la page dit pourquoi ──
  V('sans jour de bloc, le bouton Déclarer reste gris', d.getElementById('dclBtn').disabled === true);
  V('et la page dit ce qui manque', /jour du bloc/i.test(d.getElementById('dclPrev').textContent),
    d.getElementById('dclPrev').textContent);

  d.getElementById('dInt').value = '2026-09-15';
  w.renderDateHint(); w.majBarre();
  await dodo(30);
  V('le secteur et la spécialité manquants bloquent encore',
    d.getElementById('dclBtn').disabled === true || d.getElementById('dclSpec').value !== '');

  // ── Le piège de la cataracte ──
  d.getElementById('dclSec').value = 'ORL'; w.dclSecChange();
  V('un secteur qui mélange ORL et ophtalmo ne devine PAS la spécialité',
    d.getElementById('dclSpec').value !== 'ORL', d.getElementById('dclSpec').value);
  V('et la page le dit à l\'écran',
    /ophtalmo/i.test(d.getElementById('specMemo').textContent), d.getElementById('specMemo').textContent);
  V('déclarer sans spécialité est refusé', d.getElementById('dclBtn').disabled === true);

  // ── Le cas courant : endoscopie ──
  d.getElementById('dclSec').value = 'END'; w.dclSecChange();
  await dodo(30);
  V('un secteur non ambigu déduit la spécialité', d.getElementById('dclSpec').value === 'END');
  V('le bouton Déclarer devient actif', d.getElementById('dclBtn').disabled === false);

  /* Le devis part de la cotation AFFICHEE : il n'y a plus de liste ou aller le
     chercher. Le generateur de devis lui-meme n'a pas ete touche. */
  w.ouvrirDevisCourant();
  await dodo(60);
  const ov = d.getElementById('devisOverlay');
  V('le bouton Devis ouvre le devis du patient affiché', !!ov && ov.style.display !== 'none',
    ov && ov.style.display);
  V('le devis porte le nom du praticien, pas celui d\'un patient',
    /ALPHA/.test(d.body.innerHTML) && !/dclPatient/.test(d.body.innerHTML));
  if (typeof w.closeDevis === 'function') w.closeDevis();
  await dodo(30);

  const avant = envois.length;
  await w.declarer();
  await dodo(120);
  const decl = envois.slice(avant).find(p => p.action === 'declareLiberal');
  V('la déclaration part', !!decl, envois.slice(avant).map(p => p.action));
  if (decl) {
    V('elle porte le jour du bloc saisi dans la cotation', decl.dateBloc === '2026-09-15', decl.dateBloc);
    V('la date de consultation est celle du jour', /^\d{4}-\d{2}-\d{2}$/.test(decl.dateConsult), decl.dateConsult);
    V('elle porte le secteur et la spécialité', decl.secteur === 'END' && decl.specialite === 'END', [decl.secteur, decl.specialite]);
    V('elle porte la BR CCAM calculée par la cotation', decl.brCcam > 0, decl.brCcam);
    V('et la BR de la consultation associée', decl.brNgap > 0, decl.brNgap);
    /* Ce qui NE doit jamais partir : le module ne transporte ni patient ni code d'acte. */
    const brut = JSON.stringify(decl);
    V('aucun code d\'acte ne part avec la déclaration', !/HHQE002|ZZLP025/.test(brut), brut.slice(0,160));
    V('aucun identifiant de MAR n\'est envoyé par la page', !decl.marId && !decl.mar, brut.slice(0,160));
  }

  // ── Patient suivant : écran vide ──
  V('les actes du patient précédent ont disparu', ev('builder.length') === 0, ev('builder.length'));
  V('le jour du bloc est effacé', d.getElementById('dInt').value === '', d.getElementById('dInt').value);
  V('la chirurgie est effacée', d.getElementById('dclChir').value === '');
  V('la date de consultation reste à aujourd\'hui', d.getElementById('dCs').value.length === 10);
  V('le secteur, lui, RESTE : dix endoscopies d\'affilée, zéro geste',
    d.getElementById('dclSec').value === 'END', d.getElementById('dclSec').value);

  /* ═══════════════════════════════════════════════════════════════
     8. LE RELEVÉ DANS LA COPIE RAPIDE (17/08/2026)
     La liste rouge a été révisée : le relevé financier du groupement y est
     désormais admis. C'est la porte qui compte — ces vérifications sont le
     seul garde-fou entre « les membres » et « tout le monde ».
     ═══════════════════════════════════════════════════════════════ */
  console.log('\n═══ 8. Le relevé du groupement : qui peut le lire ═══');
  {
    const CODE_HORS = 'HORSGROUPE9', CODE_ADM = 'ADMINCODE9';
    M.set('acces', JSON.stringify({ indisposYear:2026, users:[
      { h: await sha(CODE),      role:'mar',   id:'ALPHA', name:'Dr ALPHA', initials:'AL', prenom:'Jean', liberal:true,  rpps:'1' },
      { h: await sha(CODE_HORS), role:'mar',   id:'BRAVO', name:'Dr BRAVO', initials:'BR', prenom:'Luc',  liberal:false, rpps:'2' },
      { h: await sha(CODE_ADM),  role:'admin', id:'COMITE', name:'Comité',  initials:'CO', prenom:'',     liberal:false, rpps:'' }]}));
    M.set('releve_liberal_2026', JSON.stringify({ success:true, year:2026, moisCourant:8,
      affectations:{}, items:[{ mois:'2026-07', marId:'ALPHA', nom:'Dr ALPHA', initiales:'AL',
        tCcam:1, pctCcam:2, excCcam:3, tNgap:4, pctNgap:5, excNgap:6 }] }));
    const lire = async (code) => {
      const r = await WK.fetch(new Request('https://worker/read', { method:'POST',
        body: JSON.stringify({ code, keys:['releve_liberal_2026'] }) }), env);
      return r.json();
    };
    const membre = await lire(CODE);
    V('un membre du groupement obtient le relevé',
      !!(membre.data && membre.data.releve_liberal_2026), membre.refuses);
    const horsG = await lire(CODE_HORS);
    V('un MAR HORS groupement ne l\'obtient pas',
      !(horsG.data && horsG.data.releve_liberal_2026), Object.keys(horsG.data || {}));
    const adm = await lire(CODE_ADM);
    V('le comité ne l\'obtient pas non plus — le libéral n\'est pas son ressort',
      !(adm.data && adm.data.releve_liberal_2026), Object.keys(adm.data || {}));
    const inconnu = await lire('PASUNCODE');
    V('un code inconnu n\'obtient rien du tout', inconnu.success === false, inconnu.error);

    /* La liste rouge n'a bouge que d'un cran : ce qui reste dehors doit le rester. */
    const wk = fs.readFileSync('../cloudflare/worker.js', 'utf8');
    V('PARAMETRES et les journaux restent hors du relais',
      !/parametres|journal_/i.test(wk.match(/const CLE_VALIDE[^;]+;/)[0]));
    V('la révision de la liste rouge est écrite dans les deux fichiers',
      /LISTE ROUGE, révisée/.test(wk) &&
      /LISTE ROUGE RÉVISÉE/.test(fs.readFileSync('../gas/miroir.gs', 'utf8')));

    const suivi = fs.readFileSync('../suivi-liberal.html', 'utf8');
    V('la page du suivi lit la copie rapide en premier',
      /releve_liberal_/.test(suivi) && /miroirRead/.test(suivi));
    V('elle garde Apps Script en repli', /getReleveLiberal/.test(suivi));
    V('un échec ne s\'affiche plus « aucun relevé »',
      /function panne\(/.test(suivi) && /Réessayer/.test(suivi));

    const mir = fs.readFileSync('../gas/miroir.gs', 'utf8');
    V('le relevé est daté sur l\'année CIVILE, pas l\'année active du planning',
      /releve_liberal_' \+ anneeCivile/.test(mir) && /new Date\(\)\.getFullYear\(\)/.test(mir));
    V('saisir le relevé rafraîchit le relevé, pas le volet du comité',
      mir.indexOf("LIBERAL_CA:") > mir.indexOf("LIBERAL:      ['liberal']"));
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  if (ko) process.exit(1);
})();
