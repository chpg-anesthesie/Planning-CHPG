/* ═══ BANC — ÉCRAN DES STATISTIQUES D'USAGE (29/08/2026) ═════════════════
   Exécute le VRAI getStatsUsage de gas/portail.gs, et lit la page réelle
   docs/stats-usage.html plus la tuile de dashboard.html.

   CE QUE CE SCÉNARIO PROTÈGE, par ordre de gravité :
     1. L'action est REFUSÉE à tout rôle autre qu'admin. Masquer la tuile ne
        ferme rien : seul le serveur décide (même principe que getReleveLiberal).
     2. Aucun total de connexions PAR PERSONNE n'est renvoyé. La page dit qui
        n'a pas ouvert le portail, jamais qui l'ouvre le plus — décision
        d'Arthur du 29/08, et c'est ce que la fiche déclare au DPO.
     3. La page lit les compteurs FIGÉS, jamais l'onglet brut CONNEXIONS.
        Une page qui recalculerait depuis le brut afficherait une courbe qui
        rétrécit à mesure que la purge opère.
     4. Les médecins inactifs (ACTIF≠O) ne sont pas comptés dans l'effectif. */
const path = require('path'), fs = require('fs'), vm = require('vm');
const { Classeur, extraireFonction } = require(path.join(__dirname, 'stubs'));

let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); }
  else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0,200) : '')); } };

const GS   = path.join(__dirname, '..', 'gas', 'portail.gs');
const PAGE = fs.readFileSync(path.join(__dirname, '..', 'docs', 'stats-usage.html'), 'utf8');
const DASH = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
const IND  = fs.readFileSync(path.join(__dirname, '..', 'gas', 'Indispos.gs'), 'utf8');
const VJS  = fs.readFileSync(path.join(__dirname, '..', 'version.js'), 'utf8');

/* ── Le serveur ──────────────────────────────────────────────────────── */
function bac() {
  const cl = new Classeur();
  cl.ajouter('MEDECINS', [
    ['ID','NOM','INITIALES','ACTIF','SECTEUR','EMAIL','CODE','X','DECT','DERNIERE_CONNEXION'],
    ['DUPONT','DUPONT','DU','O','VIS','a@b.c','AAAA1111','','1001','2026-09-20'],
    ['MARTIN','MARTIN','MA','O','REA','d@e.f','BBBB2222','','1002',''],
    ['PARTI', 'PARTI', 'PA','N','ORT','g@h.i','CCCC3333','','1003','2026-09-01'],
  ]);
  cl.ajouter('STATS_SEMAINE', [['SEMAINE','CONNEXIONS','ACTIFS','FIGEE'],
    ['2026-09-07', 30, 2, 'O'], ['2026-09-14', 44, 2, 'O'], ['2026-09-21', 12, 1, 'N']]);
  const gh = [['JOUR'].concat(Array.from({length:24},(_,h)=>'H'+String(h).padStart(2,'0')))];
  ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].forEach((j,i)=>
    gh.push([j].concat(Array.from({length:24},(_,h)=> (i===6&&h===20)?9:(i+h)%3 ))));
  cl.ajouter('STATS_HEURES', gh);
  cl.ajouter('CONNEXIONS', [['HORODATAGE','NOM','INITIALES','ROLE'],
    [new Date('2026-09-21T08:00:00'), 'MARTIN', 'MA', 'mar']]);

  const lus = [];
  const cl2 = { getSheetByName(n){ lus.push(n); return cl.getSheetByName(n); },
                getSheets(){ return cl.getSheets(); }, insertSheet(n){ return cl.insertSheet(n); } };
  const ctx = { SpreadsheetApp: { getActiveSpreadsheet: () => cl2 }, Logger: { log(){} }, console };
  vm.createContext(ctx);
  vm.runInContext("const STATS_ORIGINE='2026-09-04';", ctx);
  vm.runInContext(extraireFonction(GS, 'getStatsUsage'), ctx);
  return { ctx, lus, cl };
}
const ADMIN = { id:'FROHLICH', role:'admin', name:'FROHLICH' };

console.log('\n═══ 1. L\'action est fermée à tout rôle sauf admin ═══');
{
  const { ctx } = bac();
  [null, {role:'mar', id:'DUPONT'}, {role:'secretariat', id:'SECRETARIAT'}, {role:'', id:'X'}]
    .forEach(function (u, i) {
      const r = ctx.getStatsUsage(u);
      V('refus pour ' + (u ? ('rôle « ' + u.role + ' »') : 'utilisateur absent'),
        r && r.success === false, r);
    });
  V('accepté pour l\'admin', ctx.getStatsUsage(ADMIN).success === true);
}

console.log('\n═══ 2. Aucun total par personne n\'est renvoyé ═══');
{
  const { ctx } = bac();
  const r = ctx.getStatsUsage(ADMIN);
  const brut = JSON.stringify(r);
  V('la réponse ne contient aucun compteur nominatif',
    r.medecins.every(function (m) {
      return Object.keys(m).every(function (k) { return k === 'i' || k === 'd'; });
    }), r.medecins);
  V('chaque médecin n\'expose QUE ses initiales et une date',
    r.medecins.every(function (m) { return typeof m.i === 'string' && typeof m.d === 'string'; }));
  V('aucun nom complet ne figure dans la réponse',
    brut.indexOf('DUPONT') < 0 && brut.indexOf('MARTIN') < 0, brut.slice(0, 160));
  V('aucun code d\'accès ne fuit', brut.indexOf('AAAA1111') < 0 && brut.indexOf('BBBB2222') < 0);
}

console.log('\n═══ 3. Le serveur ne lit JAMAIS les lignes brutes ═══');
{
  const { ctx, lus } = bac();
  ctx.getStatsUsage(ADMIN);
  V('l\'onglet CONNEXIONS n\'est pas ouvert', lus.indexOf('CONNEXIONS') < 0, lus);
  V('les compteurs figés sont bien lus',
    lus.indexOf('STATS_SEMAINE') >= 0 && lus.indexOf('STATS_HEURES') >= 0, lus);
  V('la page ne mentionne nulle part l\'onglet brut',
    !/getSheetByName\(.CONNEXIONS/.test(PAGE) && PAGE.indexOf("'CONNEXIONS'") < 0);
}

console.log('\n═══ 4. Le contenu renvoyé est juste ═══');
{
  const { ctx } = bac();
  const r = ctx.getStatsUsage(ADMIN);
  V('3 semaines sont renvoyées', r.semaines.length === 3, r.semaines.length);
  V('elles sont triées de la plus ancienne à la plus récente',
    r.semaines[0].s === '2026-09-07' && r.semaines[2].s === '2026-09-21', r.semaines.map(x=>x.s));
  V('les connexions de la 2e semaine valent 44', r.semaines[1].c === 44, r.semaines[1]);
  V('la grille fait 7 lignes de 24 heures',
    r.heures.length === 7 && r.heures.every(function (l) { return l.length === 24; }));
  V('l\'effectif ne compte que les médecins ACTIF=O', r.effectif === 2, r.effectif);
  V('le médecin parti est exclu', !r.medecins.some(function (m) { return m.i === 'PA'; }), r.medecins);
  V('celui qui ne s\'est jamais connecté a une date vide',
    r.medecins.filter(function (m) { return m.i === 'MA'; })[0].d === '', r.medecins);
  V('l\'origine du comptage est renvoyée', r.origine === '2026-09-04', r.origine);
}

console.log('\n═══ 5. La page et la tuile sont cohérentes avec le serveur ═══');
{
  V('la page appelle bien l\'action getStatsUsage', PAGE.indexOf("action:'getStatsUsage'") >= 0);
  V('la tuile existe dans le portail', DASH.indexOf("key:'stats'") >= 0);
  V('elle est réservée à FROHLICH',
    /key:'stats'[^}]*only:'FROHLICH'/.test(DASH),
    (DASH.match(/\{ key:'stats'[^}]*\}/) || [''])[0].slice(0, 160));
  V('elle pointe sur la page réelle', /key:'stats'[^}]*docs\/stats-usage\.html/.test(DASH));
  V('la page ne réclame aucun classement d\'assiduité',
    PAGE.indexOf('classement') < 0 || /aucun classement/.test(PAGE));
  /* Le numéro de version vit dans version.js et NULLE PART ailleurs : une page
     visible a changé, il doit avoir bougé. Contre-épreuve du 29/08 : remettre
     v1.93 fait tomber cette vérification. */
  const v = (VJS.match(/window\.SITE_VERSION = 'v([\d.]+)'/) || [])[1];
  V('version.js porte un numéro, une seule fois',
    !!v && (VJS.match(/window\.SITE_VERSION =/g) || []).length === 1, v);
  V('la version a dépassé v1.93 (une page visible a changé)',
    !!v && cmp(v, '1.93') > 0, v);
}
function cmp(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d;
  }
  return 0;
}

console.log('\n═══ 6. Les compteurs GAS ont bien été poussés avec ═══');
{
  V('CONNEXIONS_PLAFOND est à 10 000 dans Indispos.gs', /CONNEXIONS_PLAFOND\s*=\s*10000/.test(IND));
  V('statsRecalculer existe', /function statsRecalculer\(/.test(IND));
  V('portail.gs déclare l\'action', /case 'getStatsUsage'/.test(fs.readFileSync(GS, 'utf8')));
}

console.log('\n────────────────────────────────────');
console.log(ko === 0 ? `✅ ${ok} vérifications, 0 échec` : `❌ ${ko} échec(s) sur ${ok + ko}`);
process.exit(ko === 0 ? 0 : 1);
