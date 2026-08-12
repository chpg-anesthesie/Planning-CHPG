/* ═══ BANC — LES PAGES DES MAR (celles de la démo du 4 septembre) ═══
   index.html, dashboard.html, indispos.html : chargées telles quelles, servies
   par le vrai Worker. Ce que le comité montrera au staff doit s'ouvrir vite et
   sans erreur, avec le rôle MAR (droits réduits). */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), vm = require('vm');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0,160) : '')); } };
const dodo = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  // Worker réel + données minimales
  const src = fs.readFileSync('../cloudflare/worker.js','utf8').replace('export default','globalThis.__W =');
  const wctx = vm.createContext({ globalThis:{}, console, crypto, TextEncoder, Response, Request, URL, JSON, Date, Math, Object, Array, String, Number, Set, Promise });
  wctx.globalThis = wctx; vm.runInContext(src, wctx);
  const WK = wctx.__W, M = new Map();
  const KV = { get: async k => (M.has(k)?M.get(k):null), put: async (k,v)=>{M.set(k,v);}, delete: async k=>{M.delete(k);},
    list: async ({prefix,limit}) => ({ keys:[...M.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit||1000).map(name=>({name})) }) };
  const sha = async t => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); };
  const CODE_MAR = 'MARCODE77';
  M.set('acces', JSON.stringify({ indisposYear: 2027, indisposOuverte: true, users: [
    { h: await sha(CODE_MAR), role: 'mar', id: 'ALPHA', name: 'ALPHA', initials: 'AL', prenom: 'Test' }]}));
  M.set('annees', JSON.stringify({ success:true, active: 2027, annees:[{annee:2027, statut:'ACTIF'}] }));
  M.set('planning_2027', JSON.stringify({ months: [], equiteInitiale: {} }));
  M.set('indispos_2027', JSON.stringify({ parMar: { ALPHA: [], BRAVO: ['2027-02-02'] } }));
  M.set('config_admin', JSON.stringify({ medecins: [] }));
  const env = { KV, PUSH_TOKEN: 'JETON' };

  for (const fichier of ['index.html', 'dashboard.html', 'indispos.html']) {
    console.log(`\n═══ 28. ${fichier} ═══`);
    let contenu;
    try { contenu = fs.readFileSync('../' + fichier, 'utf8'); }
    catch (e) { console.log('  (absent du banc local — ignoré)'); continue; }
    const vc = new VirtualConsole(); const erreurs = [];
    vc.on('jsdomError', e => erreurs.push(e.message));
    const dom = new JSDOM(contenu, { runScripts:'dangerously', virtualConsole:vc,
      url:'https://chpg-anesthesie.github.io/Planning-CHPG/' + fichier, pretendToBeVisual:true,
      /* Compléments injectés AVANT l'exécution des scripts : jsdom n'implémente
         pas matchMedia ni scrollIntoView, que les pages utilisent au chargement. */
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.HTMLElement.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
      } });
    const w = dom.window;
    w.Element.prototype.scrollIntoView = function () {};
    if (!w.navigator.sendBeacon) w.navigator.sendBeacon = () => true;
    let gas = 0;
    w.fetch = async (url, opt) => {
      const u = String(url);
      if (u.includes('workers.dev')) {
        const chemin = u.replace(/^https:\/\/[^/]+/, '');
        return WK.fetch(new Request('https://worker' + chemin, { method:'POST', body: opt.body }), env);
      }
      gas++;
      return { ok:true, json: async () => ({ success:false, error:'GAS indisponible dans le banc' }) };
    };
    await dodo(700);
    V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
    V('elle expose une lecture par le miroir', typeof w.miroirRead === 'function' || /workers\.dev/.test(contenu));
    // droits : un MAR ne doit jamais obtenir les clés réservées
    const r = await WK.fetch(new Request('https://worker/read', { method:'POST',
      body: JSON.stringify({ code: CODE_MAR, keys: ['config_admin','gardes_2027','vacances_admin','mail_nonlus','planning_2027'] }) }), env);
    const j = await r.json();
    V('le MAR obtient le planning', !!(j.data && j.data.planning_2027));
    V('le MAR n\'obtient AUCUNE clé réservée au comité',
      !j.data.config_admin && !j.data.gardes_2027 && !j.data.vacances_admin && !j.data.mail_nonlus,
      Object.keys(j.data));
    V('les refus sont signalés explicitement', Array.isArray(j.refuses) && j.refuses.length === 4, j.refuses);
  }

  /* Les selecteurs annee/mois quittent le bandeau sur mobile (il y etait trop
     etroit, la pastille du MAR s'y compressait a zero) et reviennent au-dessus
     de 768 px. Regle vitale : ils sont DEPLACES, jamais dupliques. */
  console.log('\n═══ 28b. index.html · les sélecteurs période changent de place, sans jamais se dupliquer ═══');
  {
    const contenu = fs.readFileSync('../index.html', 'utf8');
    const vc = new VirtualConsole(); const erreurs = [];
    vc.on('jsdomError', e => erreurs.push(e.message));
    const dom = new JSDOM(contenu, { runScripts:'dangerously', virtualConsole:vc,
      url:'https://chpg-anesthesie.github.io/Planning-CHPG/index.html', pretendToBeVisual:true,
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.HTMLElement.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
      } });
    const w = dom.window;
    if (!w.navigator.sendBeacon) w.navigator.sendBeacon = () => true;
    w.fetch = async () => ({ ok:true, json: async () => ({ success:false }) });
    await dodo(400);
    const D = w.document;
    const compte = id => D.querySelectorAll('#' + id).length;
    const parent = id => { const e = D.getElementById(id); return e && e.parentNode ? e.parentNode.id : null; };

    const largeur = px => { Object.defineProperty(w, 'innerWidth', { value: px, configurable: true }); w.checkMobile(); };

    largeur(390);
    V('sur mobile, l\'année passe dans la barre période', parent('yearSelect') === 'mobilePeriod', parent('yearSelect'));
    V('sur mobile, le mois aussi', parent('monthSelect') === 'mobilePeriod', parent('monthSelect'));
    V('un seul #yearSelect existe', compte('yearSelect') === 1, compte('yearSelect'));
    V('un seul #monthSelect existe', compte('monthSelect') === 1, compte('monthSelect'));

    largeur(1200);
    V('sur grand écran, l\'année revient dans le bandeau', parent('yearSelect') === 'headerRight', parent('yearSelect'));
    V('sur grand écran, le mois revient aussi', parent('monthSelect') === 'headerRight', parent('monthSelect'));

    // rotation du telephone : plusieurs allers-retours ne doivent rien casser
    for (let i = 0; i < 3; i++) { largeur(390); largeur(1200); }
    largeur(390);
    V('après 3 rotations, toujours un seul exemplaire de chaque',
      compte('yearSelect') === 1 && compte('monthSelect') === 1,
      [compte('yearSelect'), compte('monthSelect')]);
    V('après 3 rotations, ils sont au bon endroit',
      parent('yearSelect') === 'mobilePeriod' && parent('monthSelect') === 'mobilePeriod',
      [parent('yearSelect'), parent('monthSelect')]);
    V('la valeur choisie survit au déplacement',
      (() => { const e = D.getElementById('yearSelect'); const v = e.value; largeur(1200); largeur(390); return D.getElementById('yearSelect').value === v; })());
    V('aucune erreur JavaScript pendant les déplacements', erreurs.length === 0, erreurs.slice(0,2));
  }

  /* Deux defauts vus en production le 12/08 sur indispos.html : le code
     s'affichait en clair pendant la saisie, et la page redemandait le code
     alors que le MAR etait deja connecte au portail. */
  console.log('\n═══ 28c. indispos.html · code masqué et session partagée avec le portail ═══');
  {
    const contenu = fs.readFileSync('../indispos.html', 'utf8');
    V('le champ de code est de type password (jamais en clair)',
      /id="codeInput"[^>]*type="password"/.test(contenu),
      (contenu.match(/id="codeInput"[^>]*type="[a-z]+"/) || [''])[0]);
    V('la page mémorise le code sous la clé commune du portail',
      /sessionStorage\.setItem\('chpgViewCode'/.test(contenu));
    V('elle relit cette clé à l\'ouverture',
      /sessionStorage\.getItem\('chpgViewCode'/.test(contenu));
    V('un code refusé est retiré de la session',
      /removeItem\('chpgViewCode'\)/.test(contenu));
    V('doLogin accepte un code repris (paramètre)',
      /async function doLogin\(codeAuto\)/.test(contenu));

    /* La cle doit etre la MEME que sur les autres pages MAR, sinon la session
       ne se partage pas. staff.html et admin.html sont exclus : ils exigent
       le role admin, leur code n'est pas celui des MAR. */
    for (const p of ['index.html', 'dashboard.html', 'absences.html', 'crh.html', 'suivi-liberal.html']) {
      const c = fs.readFileSync('../' + p, 'utf8');
      V(`${p} utilise la même clé de session`, /chpgViewCode/.test(c));
    }
    const st = fs.readFileSync('../staff.html', 'utf8');
    V('staff.html ne lit PAS la session MAR (réservé au comité)',
      !/chpgViewCode/.test(st));
  }

  console.log('\n═══ 29. Confidentialité des indispos (règle du secrétariat) ═══');
  {
    const r = await WK.fetch(new Request('https://worker/read', { method:'POST',
      body: JSON.stringify({ code: CODE_MAR, keys: ['indispos_2027'] }) }), env);
    const j = await r.json();
    const parMar = j.data && j.data.indispos_2027 && j.data.indispos_2027.parMar;
    V('un MAR reçoit SES indispos', !!(parMar && parMar.ALPHA), parMar && Object.keys(parMar));
    V('il ne reçoit PAS celles des autres', !(parMar && parMar.BRAVO), parMar && Object.keys(parMar));
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  process.exit(ko ? 1 : 0);
})();
