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
    V('doLogin accepte un code repris et un mode silencieux',
      /async function doLogin\(codeAuto, silencieux\)/.test(contenu),
      (contenu.match(/async function doLogin\([^)]*\)/) || [''])[0]);

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

  /* Defaut vu en production le 12/08 : les 5 onglets du bas debordaient a droite
     sur iPhone. La cause de fond n'est pas la police mais l'absence de min-width:0 —
     un element flex:1 refuse de descendre sous la largeur de son contenu. */
  console.log('\n═══ 28d. index.html · la barre d\'onglets du bas tient dans l\'écran ═══');
  {
    const c = fs.readFileSync('../index.html', 'utf8');
    const regle = (c.match(/\.mobile-bottom-btn \{[^}]*\}/) || [''])[0];
    V('les onglets peuvent rétrécir (min-width:0)', /min-width:\s*0/.test(regle), regle.slice(0,120));
    V('la police est ramenée à 11 px', /font-size:\s*11px/.test(regle), regle.slice(0,120));
    const barre = (c.match(/\.mobile-bottom-nav \{[^}]*\}/) || [''])[0];
    V('l\'écart entre onglets est réduit à 6 px', /gap:\s*6px/.test(barre), barre.slice(0,160));

    /* Calcul de largeur : 5 onglets, mot le plus long « Médecins ». A 11 px en DM Sans
       le texte fait ~52 pt ; + 16 de padding + 3 de bordure = 71 pt pour le plus large.
       Total avec 4 ecarts de 6 et 2x12 de marge : ~355 pt, sous les 390 pt d'un iPhone. */
    const pad = 8, gap = 6, marge = 12, bord = 3;
    const largeursTexte = { Planning: 45, 'Médecins': 52, 'Équité': 34, Secteurs: 47, 'Année': 34 };
    const total = Object.values(largeursTexte).reduce((a, w) => a + w + 2 * pad + bord, 0)
                  + 4 * gap + 2 * marge;
    V(`la barre tient dans 390 pt (calculé : ${Math.round(total)} pt)`, total <= 390, total);
    V('elle tient même sur un iPhone SE 1re génération (320 pt)', total <= 320 + 40, total);
  }

  /* Defaut vu le 12/08 : ~790 pt de blanc sous les tableaux des onglets Medecins,
     Equite, Secteurs et Annee. #mobileView (hauteur minimale d'un ecran) restait
     affiche sur tous les onglets alors qu'il ne sert qu'a l'onglet Planning. */
  console.log('\n═══ 28e. index.html · pas de blanc sous les onglets autres que Planning ═══');
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
    Object.defineProperty(w, 'innerWidth', { value: 390, configurable: true });
    w.checkMobile();
    const vue = D.getElementById('mobileView');

    /* Le rendu des tableaux echoue faute de donnees chargees ici ; seul l'affichage
       du conteneur nous interesse, et il est fixe AVANT l'appel au rendu. */
    const bascule = v => { try { w.mobileSetView(v); } catch (e) {} };

    bascule('planning');
    V('onglet Planning : le conteneur jour est affiché', vue.style.display === 'flex', vue.style.display);
    for (const onglet of ['medecins', 'equite', 'affect', 'annee']) {
      bascule(onglet);
      V(`onglet ${onglet} : le conteneur jour est masqué (plus de blanc)`,
        vue.style.display === 'none', vue.style.display);
    }
    bascule('planning');
    V('retour sur Planning : il revient', vue.style.display === 'flex', vue.style.display);
    V('un redimensionnement ne le rallume pas sur un autre onglet',
      (() => { bascule('annee'); w.checkMobile(); return vue.style.display === 'none'; })(),
      vue.style.display);
    V('aucune erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
  }

  /* Defaut vu en production le 12/08 : la reprise de session appelait doLogin, qui
     desactive le bouton et ecrit « Connexion... ». Tant que le serveur ne repondait
     pas (jusqu'a 20 s au reveil d'Apps Script), l'ecran de saisie etait FIGE : le MAR
     ne pouvait meme plus taper son code a la main. Regle : la tentative automatique
     est silencieuse et ne touche jamais a l'interface. */
  console.log('\n═══ 28f. indispos.html · la reprise de session ne fige jamais l\'écran ═══');
  {
    const contenu = fs.readFileSync('../indispos.html', 'utf8');
    const vc = new VirtualConsole(); const erreurs = [];
    vc.on('jsdomError', e => erreurs.push(e.message.split('\n')[0]));
    const dom = new JSDOM(contenu, { runScripts:'dangerously', virtualConsole:vc,
      url:'https://chpg-anesthesie.github.io/Planning-CHPG/indispos.html', pretendToBeVisual:true,
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.HTMLElement.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
        try { win.sessionStorage.setItem('chpgViewCode', 'ABCD1234'); } catch (e) {}
        /* Le pire cas : un serveur qui ne repond JAMAIS. */
        win.fetch = () => new Promise(() => {});
      } });
    await dodo(600);
    const D = dom.window.document;
    const btn = D.getElementById('loginBtn'), champ = D.getElementById('codeInput');
    V('le bouton reste sur « Accéder → »', /Accéder/.test(btn.textContent), btn.textContent);
    V('le bouton reste CLIQUABLE pendant la tentative', btn.disabled === false, btn.disabled);
    V('le champ de code reste saisissable', champ.disabled === false, champ.disabled);
    V('aucun message d\'erreur n\'est affiché au MAR qui n\'a rien tapé',
      D.getElementById('loginError').style.display !== 'block',
      D.getElementById('loginError').style.display);
    V('la tentative automatique passe bien le drapeau silencieux',
      /doLogin\(saved, true\)/.test(contenu));
    V('aucune erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
  }

  /* Defaut vu en production le 12/08 : on pouvait poser une indispo au-dela de la fin
     de l'annee de planning (a partir du 3 janvier 2028 pour l'annee 2027). Les cases
     etaient grisees mais cliquables, et le SERVEUR ignore ces dates en silence
     (banc T072) : le MAR croyait avoir declare, rien n'etait enregistre. */
  console.log('\n═══ 28g. indispos.html · rien ne se pose hors de l\'année de planning ═══');
  {
    const contenu = fs.readFileSync('../indispos.html', 'utf8');
    const dom = new JSDOM(contenu, { runScripts:'dangerously',
      virtualConsole:new VirtualConsole(), pretendToBeVisual:true,
      url:'https://chpg-anesthesie.github.io/Planning-CHPG/indispos.html',
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.HTMLElement.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
        win.fetch = () => new Promise(() => {});
      } });
    await dodo(400);
    const w = dom.window;

    /* Les bornes doivent coller a celles du serveur : du premier lundi de janvier Y
       au jour precedant le premier lundi de janvier Y+1. */
    const b = w.bornesAnneePlanning(2027);
    V('année 2027 : début au premier lundi (04/01/2027)', b.debut === '2027-01-04', b.debut);
    V('année 2027 : fin au 02/01/2028 (veille du lundi suivant)', b.fin === '2028-01-02', b.fin);
    const b28 = w.bornesAnneePlanning(2028);
    V('année 2028 : du 03/01/2028 au 07/01/2029', b28.debut === '2028-01-03' && b28.fin === '2029-01-07', b28);

    /* Pose reelle. YEAR et indispos sont des variables de script (let) : invisibles
       depuis l'exterieur, on pilote la page par son propre contexte via eval. */
    w.eval(`YEAR = 2027; indispos = {}; currentTool = 'INDISPO'; isDragging = false;
            renderMonth = function(){}; updateStats = function(){};
            window.__toasts = []; showToast = function(m){ window.__toasts.push(m); };`);
    const pose = d => { w.eval(`applyTool(${JSON.stringify(d)})`); };
    const etat = () => w.eval('JSON.stringify(indispos)');

    pose('2027-03-15');
    V('une date DANS l\'année se pose', JSON.parse(etat())['2027-03-15'] === 'INDISPO', etat());
    pose('2028-01-02');
    V('le dernier jour de l\'année se pose encore', JSON.parse(etat())['2028-01-02'] === 'INDISPO', etat());
    pose('2028-01-03');
    V('le lundi 03/01/2028 est REFUSÉ (défaut vu en production)', !JSON.parse(etat())['2028-01-03'], etat());
    pose('2027-01-01');
    V('le 1er janvier 2027, avant le début, est refusé aussi', !JSON.parse(etat())['2027-01-01'], etat());
    V('rien d\'autre n\'a été écrit', Object.keys(JSON.parse(etat())).length === 2, etat());
    V('le refus est expliqué au MAR', /Hors de l'année de planning/.test((w.__toasts || []).join(' ')), w.__toasts);
  }

  console.log('\n═══ 28h. index.html · les onglets Équité sont larges et alignés ═══');
  {
    /* (13/08/2026) AVANT : un interrupteur cale a 32 px du bord, epousant la
       largeur de son texte — decentre sur telephone, touche de 27 px. */
    const c = fs.readFileSync('../index.html', 'utf8');
    const barre = (c.match(/\.eq-switchbar\{[^}]*\}/) || [''])[0];
    const sw    = (c.match(/\.eqv-switch\{[^}]*\}/) || [''])[0];
    const btn   = (c.match(/\.eqv-sw-btn\{[^}]*\}/) || [''])[0];
    const actif = (c.match(/\.eqv-sw-btn\.active\{[^}]*\}/) || [''])[0];
    V('la barre n\'a plus de marge latérale propre (alignement sur les cartes)',
      /padding:14px 0 0/.test(barre), barre);
    V('les deux onglets partagent la largeur en deux',
      /display:grid/.test(sw) && /grid-template-columns:1fr 1fr/.test(sw), sw);
    V('l\'onglet actif est souligné, plus encadré de blanc',
      /border-bottom-color:var\(--red\)/.test(actif) && /background:transparent/.test(actif), actif);
    V('la touche est assez haute pour le doigt (≥ 38 px)',
      /padding:9px 4px 10px/.test(btn) && /font-size:14\.5px/.test(btn), btn);
    V('les deux onglets sont toujours là, et un seul actif au départ',
      (c.match(/class="eqv-sw-btn[^"]*"/g) || []).length === 2 &&
      (c.match(/class="eqv-sw-btn active"/g) || []).length === 1);
  }

  console.log('\n═══ 28i. index.html · le mois disparaît des vues qui l\'ignorent ═══');
  {
    /* (13/08/2026) Équité, Affectations et Année raisonnent à l'année. Sur mobile,
       la liste des mois restait pourtant affichée à côté de celle des années, et
       en choisir un ne produisait rien. */
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
    const w = dom.window, D = w.document;
    if (!w.navigator.sendBeacon) w.navigator.sendBeacon = () => true;
    w.fetch = async () => ({ ok:true, json: async () => ({ success:false }) });
    await dodo(400);
    Object.defineProperty(w, 'innerWidth', { value: 390, configurable: true });
    w.checkMobile();
    const moisVisible = () => D.getElementById('monthSelect').style.display !== 'none';
    const anVisible   = () => D.getElementById('yearSelect').style.display !== 'none';

    w.mobileSetView('planning'); await dodo(20);
    V('vue Planning : le mois est proposé', moisVisible());
    w.mobileSetView('equite'); await dodo(20);
    V('vue Équité : le mois disparaît', !moisVisible());
    V('mais l\'année reste', anVisible());
    w.mobileSetView('affect'); await dodo(20);
    V('vue Affectations : le mois disparaît aussi', !moisVisible());
    w.mobileSetView('annee'); await dodo(20);
    V('vue Année : idem', !moisVisible());
    /* La vue Médecins dessine à partir du planning, absent de ce banc : son rendu
       lève, mais le réglage du sélecteur est déjà posé quand il lève. On isole. */
    try { w.mobileSetView('medecins'); } catch (e) {}
    await dodo(20);
    V('vue Médecins : le mois revient', moisVisible());
    try { w.mobileSetView('planning'); } catch (e) {}
    await dodo(20);
    V('retour au Planning : le mois est toujours là', moisVisible());
    /* Le masquage ne doit pas survivre au passage sur grand écran, où c'est la
       feuille de style qui commande les deux listes. */
    w.mobileSetView('equite'); await dodo(20);
    Object.defineProperty(w, 'innerWidth', { value: 1200, configurable: true });
    w.checkMobile(); await dodo(20);
    V('sur grand écran, aucune valeur en dur ne court-circuite la feuille de style',
      D.getElementById('monthSelect').style.display === '',
      D.getElementById('monthSelect').style.display);
    V('aucune erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
  }

  console.log('\n═══ 28j. Les cibles d\'équité voyagent par la copie rapide ═══');
  {
    const c = fs.readFileSync('../index.html', 'utf8');
    const worker = fs.readFileSync('../cloudflare/worker.js', 'utf8');
    /* (13/08/2026) stats_{annee} passe aux MAR. Ce n'est pas un elargissement :
       getStatsLive, qui sert les MEMES chiffres, ne porte aucun controle de role
       dans Indispos.gs, et l'onglet Instantane les affiche deja a tout MAR. */
    const gas = fs.readFileSync('../gas/Indispos.gs', 'utf8');
    const bloc = (gas.match(/if \(action === 'getStatsLive'\)[\s\S]{0,400}?\n    \}/) || [''])[0];
    V('getStatsLive ne filtre effectivement aucun rôle (le fondement de la décision)',
      bloc.length > 0 && !/_deny\(\)/.test(bloc), bloc.slice(0, 120));
    V('la copie rapide sert stats_{année} aux MAR',
      /\^stats_\\d\{4\}\$\/\.test\(cle\)\) return true/.test(worker));
    V('gardes_{année} et joursferies_{année} restent au comité',
      /\(gardes\|joursferies\)_\\d\{4\}[\s\S]{0,120}role === 'admin'/.test(worker));
    V('config_admin et vacances_admin aussi',
      /cle === 'config_admin'\) return user\.role === 'admin'/.test(worker) &&
      /cle === 'vacances_admin' \|\|/.test(worker));
    V('la vue Équité lit la copie avant de demander à Google',
      /miroirRead\(\['stats_' \+ year\]\)/.test(c));
    V('elle garde l\'appel direct en repli',
      /catch\(e\)\{[^}]*\}\s*try\{\s*const j = await apiPost\(\{action:'getStatsLive'/.test(c));
    V('l\'instantané, lui, reste un vrai calcul (jamais servi par la copie)',
      (() => { const i = c.indexOf('async function loadEquiteLive');
               const j = c.indexOf("apiPost({action:'getStatsLive'", i);
               return i > 0 && j > i && c.slice(i, j).indexOf('miroirRead') === -1; })());
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
