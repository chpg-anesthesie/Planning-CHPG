/* ═══ BANC — VEILLE BIBLIOGRAPHIQUE ═══
   Défaut trouvé à la PREMIÈRE collecte réelle (08/08/2026) : la suppression
   de la liste blanche de types, justifiée pour les 23 revues d'anesthésie-
   réanimation, avait aussi été appliquée aux 18 généralistes. Résultat :
   axe croisé 1 040 articles/180 j au lieu de ~31/90 j, total 114/semaine
   pour une cible de 50-80.
   Ici on exécute le VRAI gas/veille.gs et on lit les requêtes envoyées à
   PubMed : la liste blanche doit figurer dans l'axe croisé, et SEULEMENT là. */
const vm = require('vm'), fs = require('fs');
const { Classeur } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 300) : '')); } };

const BLANCHE = '"Randomized Controlled Trial"[Publication Type]';
const NOIRE   = '"editorial"[Publication Type]';

/* Monte un monde où UrlFetchApp répond à esearch/esummary selon `plan`,
   en gardant la trace de chaque requête. */
function monde(plan) {
  const requetes = [];
  const journal = [];
  const ctx = vm.createContext({
    console, JSON, Date, Number, String, Object, Array, Math, Error, isNaN, parseInt, encodeURIComponent,
    SpreadsheetApp: { getActiveSpreadsheet: () => monde.cl },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ onWeekDay: () => ({ atHour: () => ({ create: () => {} }) }) }) }), WeekDay: { MONDAY: 1 }, deleteTrigger: () => {} },
    Utilities: { sleep: () => {}, formatDate: () => '2026-08-08' },
    Logger: { log: m => journal.push(String(m)) },
    _isoDate: v => String(v || ''),
    UrlFetchApp: { fetch: (url, opt) => {
      const params = new URLSearchParams(opt.payload);
      const endpoint = url.split('/').pop();
      requetes.push({ endpoint, term: params.get('term') || '', id: params.get('id') || '' });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify(plan(endpoint, params)) };
    } },
  });
  ctx.globalThis = ctx;
  monde.cl = new Classeur();
  vm.runInContext(fs.readFileSync('../gas/veille.gs', 'utf8'), ctx);
  return { ctx, requetes, journal, cl: monde.cl };
}

(async () => {
  console.log('\n═══ 1. La configuration par défaut porte la liste blanche ═══');
  {
    const { ctx } = monde(() => ({}));
    vm.runInContext('getOrCreateVeilleTabs()', ctx);
    const cfg = vm.runInContext('_readVeilleCfg()', ctx);
    V('les lignes PUBTYPE sont relues (5 types)', cfg.pubtypes.length === 5, cfg.pubtypes);
    V('essai randomisé, méta-analyse, revue systématique, recommandations',
      ['Randomized Controlled Trial', 'Meta-Analysis', 'Systematic Review', 'Practice Guideline', 'Guideline']
        .every(t => cfg.pubtypes.indexOf(t) !== -1), cfg.pubtypes);
    const clause = vm.runInContext('_veilleListeBlanche(_readVeilleCfg())', ctx);
    V('la clause assemble les 5 types en OU', (clause.match(/\[Publication Type\]/g) || []).length === 5 && clause.indexOf(BLANCHE) !== -1, clause);
    V('les 23 revues directes et 18 croisées sont toujours là', cfg.revues.length === 23 && cfg.general.length === 18, [cfg.revues.length, cfg.general.length]);
  }

  console.log('\n═══ 2. Le défaut du 08/08 : la liste blanche ne bride QUE l\'axe croisé ═══');
  {
    /* PubMed simulé : l'axe croisé SANS liste blanche rendrait 1 040 articles
       (le chiffre mesuré en production). Avec, il en rend 12. */
    const plan = (endpoint, params) => {
      if (endpoint === 'esearch.fcgi') {
        const term = params.get('term') || '';
        const direct  = term.indexOf('"Anesthesiology"[Journal]') !== -1;
        const general = term.indexOf('"N Engl J Med"[Journal]') !== -1;
        if (direct && general) return { esearchresult: { count: '0', idlist: [] } };       // étiquetage par thème
        if (direct)  return { esearchresult: { count: '3', idlist: ['101', '102', '103'] } };
        if (general) {
          if (term.indexOf(BLANCHE) === -1) {                                              // RÉGRESSION : sans bride
            const ids = []; for (let i = 0; i < 1000; i++) ids.push(String(2000 + i));
            return { esearchresult: { count: '1040', idlist: ids } };
          }
          return { esearchresult: { count: '1', idlist: ['201'] } };
        }
        return { esearchresult: { count: '0', idlist: [] } };
      }
      if (endpoint === 'esummary.fcgi') {
        const result = {};
        (params.get('id') || '').split(',').filter(Boolean).forEach(id => {
          result[id] = { title: 'Article ' + id, source: 'Rev', authors: [], pubtype: ['Journal Article'] };
        });
        return { result };
      }
      return {};
    };
    const { ctx, requetes, journal } = monde(plan);
    vm.runInContext('getOrCreateVeilleTabs()', ctx);
    const res = vm.runInContext('runVeille()', ctx);

    const qDirect  = requetes.filter(q => q.endpoint === 'esearch.fcgi' && q.term.indexOf('"Anesthesiology"[Journal]') !== -1 && q.term.indexOf('"N Engl J Med"[Journal]') === -1);
    const qGeneral = requetes.filter(q => q.endpoint === 'esearch.fcgi' && q.term.indexOf('"N Engl J Med"[Journal]') !== -1 && q.term.indexOf('"Anesthesiology"[Journal]') === -1);
    V('une requête par axe est bien partie', qDirect.length === 1 && qGeneral.length === 1, [qDirect.length, qGeneral.length]);
    V('l\'axe croisé PORTE la liste blanche', qGeneral.length && qGeneral[0].term.indexOf(BLANCHE) !== -1);
    V('l\'axe direct N\'EN porte AUCUNE', qDirect.length && qDirect[0].term.indexOf(BLANCHE) === -1, qDirect.length && qDirect[0].term.slice(0, 200));
    V('la liste NOIRE reste sur les deux axes', qDirect.length && qGeneral.length && qDirect[0].term.indexOf(NOIRE) !== -1 && qGeneral[0].term.indexOf(NOIRE) !== -1);
    V('résultat : axe croisé bridé (1 article, pas 1 040)', res.axeCroise === 1, res.axeCroise);
    V('le total en articles/semaine est calculé et rendu', typeof res.parSemaine === 'number' && res.parSemaine < 80, res.parSemaine);
    V('le journal annonce le total par semaine et la cible', journal.some(l => l.indexOf('articles/semaine') !== -1 && l.indexOf('cible 50-80') !== -1), journal.slice(-3));
    V('le journal détaille chaque axe en /sem', journal.some(l => l.indexOf('/sem') !== -1 && l.indexOf('axe direct') !== -1), journal.slice(-3));
  }

  console.log('\n═══ 3. Liste blanche vidée : l\'axe croisé tourne mais le journal prévient ═══');
  {
    const { ctx, requetes, journal, cl } = monde(() => ({ esearchresult: { count: '0', idlist: [] }, result: {} }));
    vm.runInContext('getOrCreateVeilleTabs()', ctx);
    const feuille = cl.getSheetByName('VEILLE_CFG');
    feuille.lignes = feuille.lignes.filter(l => String(l[0]).toUpperCase() !== 'PUBTYPE');
    const cfg = vm.runInContext('_readVeilleCfg()', ctx);
    V('plus aucune ligne PUBTYPE lue', cfg.pubtypes.length === 0, cfg.pubtypes);
    vm.runInContext('runVeille()', ctx);
    const qGeneral = requetes.filter(q => q.endpoint === 'esearch.fcgi' && q.term.indexOf('"N Engl J Med"[Journal]') !== -1 && q.term.indexOf('"Anesthesiology"[Journal]') === -1);
    V('l\'axe croisé part quand même, sans bride', qGeneral.length === 1 && qGeneral[0].term.indexOf(BLANCHE) === -1, qGeneral.length);
    V('mais le journal crie', journal.some(l => l.indexOf('PUBTYPE') !== -1 && l.indexOf('⚠️') !== -1), journal.slice(0, 3));
  }

  console.log('\n═══ 4. veilleReinitConfig réécrit bien les lignes PUBTYPE ═══');
  {
    const { ctx, cl } = monde(() => ({}));
    vm.runInContext('getOrCreateVeilleTabs()', ctx);
    const feuille = cl.getSheetByName('VEILLE_CFG');
    feuille.lignes = feuille.lignes.filter(l => String(l[0]).toUpperCase() !== 'PUBTYPE');   // ancienne config
    vm.runInContext('veilleReinitConfig()', ctx);
    const cfg = vm.runInContext('_readVeilleCfg()', ctx);
    V('après réécriture, les 5 types sont revenus', cfg.pubtypes.length === 5, cfg.pubtypes);
  }

  console.log('\n═══ 5. Contrat SOURCE : les codes que dashboard.html filtre, rien d\'autre ═══');
  {
    /* Défaut du 08/08 (15 h 44) : la refonte écrivait 'Revue'/'Généraliste',
       le filtre source de l'écran compare à 'REVUE'/'GENERAL'/'THEME' →
       aucun article affiché hors « Toutes sources ». Ici on lit le VRAI
       dashboard.html pour extraire les codes du filtre, et on exige que
       getVeille ne serve QUE ces codes-là. */
    const html = fs.readFileSync('../dashboard.html', 'utf8');
    const bloc = html.slice(html.indexOf('onVSource'), html.indexOf('vThemeSel'));
    const codes = [];
    (html.match(/onchange="onVSource[\s\S]{0,400}?<\/select>/) || [''])[0]
      .replace(/<option value="([^"]+)"/g, (m, v) => { codes.push(v); return m; });
    V('le filtre de l\'écran expose bien des codes', codes.length >= 2 && codes.indexOf('REVUE') !== -1 && codes.indexOf('GENERAL') !== -1, codes);

    const plan = (endpoint, params) => {
      if (endpoint === 'esearch.fcgi') {
        const term = params.get('term') || '';
        const direct  = term.indexOf('"Anesthesiology"[Journal]') !== -1;
        const general = term.indexOf('"N Engl J Med"[Journal]') !== -1;
        if (direct && general) return { esearchresult: { count: '0', idlist: [] } };
        if (direct)  return { esearchresult: { count: '2', idlist: ['301', '302'] } };
        if (general) return { esearchresult: { count: '1', idlist: ['401'] } };
        return { esearchresult: { count: '0', idlist: [] } };
      }
      if (endpoint === 'esummary.fcgi') {
        const result = {};
        (params.get('id') || '').split(',').filter(Boolean).forEach(id => {
          result[id] = { title: 'A' + id, source: 'Rev', authors: [], pubtype: [] };
        });
        return { result };
      }
      return {};
    };
    const { ctx, cl } = monde(plan);
    vm.runInContext('getOrCreateVeilleTabs()', ctx);
    vm.runInContext('runVeille()', ctx);
    const feuille = cl.getSheetByName('VEILLE');
    const colSrc = feuille.lignes.slice(1).map(l => l[6]);
    V('runVeille écrit les codes (REVUE×2, GENERAL×1)', colSrc.filter(v => v === 'REVUE').length === 2 && colSrc.filter(v => v === 'GENERAL').length === 1, colSrc);
    // Lignes héritées du réglage fautif (les 2 044 du 08/08) : normalisées à la lecture
    feuille.appendRow(['500', '2026-07-01', 'Hérité 1', '', 'NEJM', '', 'Généraliste', '', '', 'N', 'N', '2026-08-08', '', '']);
    feuille.appendRow(['501', '2026-07-02', 'Hérité 2', '', 'BJA',  '', 'Revue',       '', '', 'N', 'N', '2026-08-08', '', '']);
    const g = vm.runInContext('getVeille()', ctx);
    const sources = g.items.map(i => i.source);
    V('getVeille traduit les libellés hérités en codes', sources.indexOf('Généraliste') === -1 && sources.indexOf('Revue') === -1, sources);
    V('chaque source servie est un code que l\'écran sait filtrer', sources.every(v => codes.indexOf(v) !== -1), sources);
    const h1 = g.items.find(i => i.pmid === '500'), h2 = g.items.find(i => i.pmid === '501');
    V('Généraliste → GENERAL, Revue → REVUE', h1 && h1.source === 'GENERAL' && h2 && h2.source === 'REVUE', [h1 && h1.source, h2 && h2.source]);
  }

  console.log('\n═══ 6. Dates : epubdate au jour près prime, sinon repli (défaut des blocs par revue) ═══');
  {
    /* Mesuré le 08/08 : 925/2 044 articles datés au « 01 » par sortpubdate
       → blocs par revue à l'écran. epubdate au jour près pour 27/30. */
    const { ctx } = monde(() => ({}));
    const d = o => vm.runInContext('_veilleDatePub(' + JSON.stringify(o) + ')', ctx);
    V('epubdate "2026 Feb 7" prime sur le sortpubdate au 01',
      d({ epubdate: '2026 Feb 7', sortpubdate: '2026/06/01 00:00' }) === '2026-02-07',
      d({ epubdate: '2026 Feb 7', sortpubdate: '2026/06/01 00:00' }));
    V('jour sur un chiffre → zéro devant', d({ epubdate: '2026 Jun 1' }) === '2026-06-01', d({ epubdate: '2026 Jun 1' }));
    V('epubdate vide → repli sortpubdate', d({ epubdate: '', sortpubdate: '2026/04/01 00:00' }) === '2026-04-01');
    V('epubdate au mois seul ("2026 Feb") → repli', d({ epubdate: '2026 Feb', sortpubdate: '2026/05/01 00:00' }) === '2026-05-01');
    V('epubdate exotique ("2026 Jan-Feb") → repli', d({ epubdate: '2026 Jan-Feb', sortpubdate: '2026/05/01 00:00' }) === '2026-05-01');
    V('rien du tout → chaîne vide', d({}) === '');
  }

  console.log('\n═══ 7. Filtre par revues cochées (v1.29) — piloté au clic dans la vraie page ═══');
  {
    const { JSDOM, VirtualConsole } = require('jsdom');
    const vcons = new VirtualConsole(); const erreurs = [];
    vcons.on('jsdomError', e => erreurs.push(e.message));
    const dom = new JSDOM(fs.readFileSync('../dashboard.html', 'utf8'), {
      runScripts: 'dangerously', virtualConsole: vcons,
      url: 'https://chpg-anesthesie.github.io/Planning-CHPG/dashboard.html', pretendToBeVisual: true,
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
      } });
    const w = dom.window;
    w.fetch = async () => ({ ok:true, json: async () => ({ success:false }) });
    await new Promise(r => setTimeout(r, 400));
    V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0, 2));

    /* Trois articles, deux revues. VEILLE_ITEMS est un `let` de page,
       invisible depuis w.* : on passe par le chemin PUBLIC — miroirTuile
       remplacée (déclaration `function`, donc propriété de window),
       puis le vrai openVeille(). */
    w.miroirTuile = async () => ({ success:true, count:3, enrich:false, items: [
      { pmid:'1', date:'2026-08-01', titre:'Un',    auteurs:'', revue:'Anesthesiology', doi:'', source:'REVUE', score:null, resume:'', lu:false, star:false, ajoute:'', pubtype:'', themes:[] },
      { pmid:'2', date:'2026-08-02', titre:'Deux',  auteurs:'', revue:'Crit Care',      doi:'', source:'REVUE', score:null, resume:'', lu:false, star:false, ajoute:'', pubtype:'', themes:[] },
      { pmid:'3', date:'2026-08-03', titre:'Trois', auteurs:'', revue:'Anesthesiology', doi:'', source:'REVUE', score:null, resume:'', lu:false, star:false, ajoute:'', pubtype:'', themes:['NVPO'] },
    ] });
    await w.openVeille();
    const panneau = w.document.getElementById('vRevPanel');
    const cases = panneau.querySelectorAll('input[type=checkbox]');
    V('le panneau liste les 2 revues présentes', cases.length === 2, cases.length);
    V('rien de coché → 3 cartes affichées', w.document.querySelectorAll('.veille-card').length === 3);
    V('le bouton annonce « toutes »', /toutes/.test(w.document.getElementById('vRevBtn').textContent));

    // On coche Anesthesiology, AU CLIC.
    const caseAnesth = [...cases].find(c => c.value === 'Anesthesiology');
    caseAnesth.click();
    V('cocher une revue → 2 cartes, la bonne revue', w.document.querySelectorAll('.veille-card').length === 2
      && [...w.document.querySelectorAll('.vc-journal')].every(el => el.textContent === 'Anesthesiology'));
    V('le bouton annonce le compte', /1 cochée/.test(w.document.getElementById('vRevBtn').textContent), w.document.getElementById('vRevBtn').textContent);
    V('le choix est mémorisé sur l\'appareil', w.localStorage.getItem('chpgVeilleRevues') === '["Anesthesiology"]', w.localStorage.getItem('chpgVeilleRevues'));

    // « Toutes les revues » remet tout.
    panneau.querySelector('.vrev-clear').click();
    V('« Toutes les revues » → 3 cartes et mémoire vidée', w.document.querySelectorAll('.veille-card').length === 3
      && w.localStorage.getItem('chpgVeilleRevues') === '[]');

    // Cumul avec le filtre thème : Anesthesiology cochée ET thème NVPO
    // → seul l'article 3 (Anesthesiology + NVPO) reste.
    [...panneau.querySelectorAll('input[type=checkbox]')].find(c => c.value === 'Anesthesiology').click();
    w.onVTheme('NVPO');
    V('cumul revue + thème → seule la carte qui a les deux', w.document.querySelectorAll('.veille-card').length === 1
      && /Trois/.test(w.document.querySelector('.vc-title').textContent));
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  process.exit(ko ? 1 : 0);
})();
