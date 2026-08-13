/* ═══ BANC — MON ORDRE DE PASSAGE POUR LES VACANCES ═══════════════════════
   Le bandeau de « Mes congés » répond à la question qu'un MAR se pose avant le
   staff : à quel tour vais-je choisir, et qui passe avant moi ?

   Deux étages, éprouvés séparément :
     · le SERVEUR (getOrdreVacances, gas/Indispos.gs) — le vrai code, exécuté
       sur un classeur simulé de 21 MAR en trois groupes de 7 ;
     · l'ÉCRAN (dashboard.html) — la vraie page, chargée et pilotée au clic,
       avec une réponse serveur fabriquée.

   CE QUE CE FICHIER PROTÈGE. La règle de rotation est recopiée en six endroits.
   Le 30/07/2026, le serveur tournait à gauche et les écrans à droite : les deux
   ordres ne coïncidaient qu'une année sur trois, et le défaut n'a été vu qu'en
   réel, sur l'hiver 2027. On vérifie donc ici la SORTIE, année par année, et
   pas seulement la présence de la règle.
   ═══════════════════════════════════════════════════════════════════════ */
const vm = require('vm'), fs = require('fs');
const { Classeur, extraireFonction } = require('./stubs');
const { JSDOM, VirtualConsole } = require('jsdom');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); }
  else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 190) : '')); } };
const dodo = ms => new Promise(r => setTimeout(r, ms));

/* 21 identifiants inventés, 7 par groupe, dans l'ordre de base.
   MOI est 2e du groupe B en 2026 — donc 3e en 2027. */
const GROUPES = {
  A: ['A1','A2','A3','A4','A5','A6','A7'],
  B: ['B1','MOI','B3','B4','B5','B6','B7'],
  C: ['C1','C2','C3','C4','C5','C6','C7'],
};

function monde() {
  const cl = new Classeur();
  const lignes = [['GROUPE','ID','ORDRE']];
  Object.keys(GROUPES).forEach(g => GROUPES[g].forEach((id, i) => lignes.push([g, id, i + 1])));
  cl.ajouter('GROUPES_VAC', lignes);
  const ctx = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Math,
    SpreadsheetApp: { getActiveSpreadsheet: () => cl }, Logger: { log(){} } });
  ctx.globalThis = ctx;
  vm.runInContext(extraireFonction('../gas/Indispos.gs', 'getOrdreVacances'), ctx);
  return ctx;
}
const appel = (ctx, annees) => vm.runInContext(`getOrdreVacances('MOI', ${JSON.stringify(annees)})`, ctx);
const fileDe = (bloc, i) => {
  let f = []; bloc.periodes[i].ordre.forEach(g => { f = f.concat(bloc.groupes[g]); }); return f;
};

console.log('\n═══ 1. Le serveur : deux années répondues d\'un coup ═══');
{
  const ctx = monde();
  const r = appel(ctx, [2026, 2027]);
  V('deux années reviennent', (r.annees || []).length === 2, (r.annees || []).length);
  V('elles sont bien 2026 et 2027', r.annees[0].annee === 2026 && r.annees[1].annee === 2027);
  V('mon groupe est trouvé', r.annees[0].monGroupe === 'B', r.annees[0].monGroupe);
  V('taille du groupe annoncée', r.annees[0].tailleGroupe === 7, r.annees[0].tailleGroupe);
  V('mon rang recule d\'une place d\'une année sur l\'autre',
    r.annees[0].monRang === 2 && r.annees[1].monRang === 3,
    [r.annees[0].monRang, r.annees[1].monRang]);
  V('les cinq périodes sont là', r.annees[0].periodes.length === 5,
    r.annees[0].periodes.map(p => p.nom));
}

console.log('\n═══ 2. L\'ordre des groupes, période par période, année par année ═══');
{
  const ctx = monde();
  const r = appel(ctx, [2026, 2027, 2028, 2029]);
  const lu = an => r.annees.find(a => a.annee === an).periodes.map(p => p.ordre.join(''));
  /* Table de référence 2026, puis rotation à DROITE d'un cran par année. */
  V('2026 — la table de référence elle-même',
    lu(2026).join('|') === 'CAB|ABC|ABC|BCA|CAB', lu(2026));
  V('2027 — tout a reculé d\'un cran', lu(2027).join('|') === 'BCA|CAB|CAB|ABC|BCA', lu(2027));
  V('2028 — d\'un cran encore', lu(2028).join('|') === 'ABC|BCA|BCA|CAB|ABC', lu(2028));
  V('2029 — le cycle est bouclé, on retrouve 2026', lu(2029).join('|') === lu(2026).join('|'), lu(2029));
}

console.log('\n═══ 3. Ma place réelle dans la file des 21 ═══');
{
  const ctx = monde();
  const r = appel(ctx, [2026, 2027]);
  const place = (an, i) => fileDe(r.annees.find(a => a.annee === an), i).indexOf('MOI') + 1;
  /* Hiver · Printemps · Été · Toussaint · Noël */
  V('2026 : 16e, 9e, 9e, 2e, 16e',
    [0,1,2,3,4].map(i => place(2026, i)).join(',') === '16,9,9,2,16',
    [0,1,2,3,4].map(i => place(2026, i)));
  V('2027 : 3e, 17e, 17e, 10e, 3e',
    [0,1,2,3,4].map(i => place(2027, i)).join(',') === '3,17,17,10,3',
    [0,1,2,3,4].map(i => place(2027, i)));
  V('la file compte exactement 21 places', fileDe(r.annees[0], 0).length === 21);
  V('personne n\'y figure deux fois', new Set(fileDe(r.annees[0], 0)).size === 21);
  V('les 21 sont les mêmes d\'une période à l\'autre — seul l\'ordre change',
    new Set(fileDe(r.annees[0], 0)).size === new Set(fileDe(r.annees[0], 3)).size &&
    fileDe(r.annees[0], 0).join(',') !== fileDe(r.annees[0], 3).join(','));
}

console.log('\n═══ 4. Cas limites du serveur ═══');
{
  const ctx = monde();
  const inconnu = vm.runInContext(`getOrdreVacances('PERSONNE', [2027])`, ctx).annees[0];
  V('un MAR hors groupes n\'a ni groupe ni rang', inconnu.monGroupe === null && inconnu.monRang === 0);
  V('mais la composition des groupes est quand même donnée',
    (inconnu.groupes.A || []).length === 7);
  const vide = new Classeur();
  const ctx2 = vm.createContext({ console, JSON, Date, Number, String, Object, Array, Math,
    SpreadsheetApp: { getActiveSpreadsheet: () => vide }, Logger: { log(){} } });
  ctx2.globalThis = ctx2;
  vm.runInContext(extraireFonction('../gas/Indispos.gs', 'getOrdreVacances'), ctx2);
  const sansOnglet = vm.runInContext(`getOrdreVacances('MOI', [2027])`, ctx2);
  V('sans onglet GROUPES_VAC, la réponse est vide et ne lève rien',
    Array.isArray(sansOnglet.annees) && sansOnglet.annees.length === 0);
  V('aucune donnée sensible ne sort : identifiants seuls',
    JSON.stringify(appel(ctx, [2027])).indexOf('@') === -1);
}

console.log('\n═══ 5. L\'écran : le bandeau, puis la file au clic ═══');
(async () => {
  const contenu = fs.readFileSync('../dashboard.html', 'utf8');
  const ctx = monde();
  const rep = appel(ctx, [2026, 2027]);
  rep.success = true; rep.anneePrincipale = 2026;

  const vc = new VirtualConsole(); const erreurs = [];
  vc.on('jsdomError', e => erreurs.push(e.message));
  const dom = new JSDOM(contenu, { runScripts:'dangerously', virtualConsole:vc,
    url:'https://chpg-anesthesie.github.io/Planning-CHPG/dashboard.html', pretendToBeVisual:true,
    beforeParse(win) {
      win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
      win.Element.prototype.scrollIntoView = function () {};
      win.HTMLElement.prototype.scrollIntoView = function () {};
      win.scrollTo = () => {};
    } });
  const w = dom.window, D = w.document;
  if (!w.navigator.sendBeacon) w.navigator.sendBeacon = () => true;
  w.fetch = async () => ({ ok:true, json: async () => ({ success:false }) });
  await dodo(500);

  /* Session MAR simulée, puis la réponse serveur telle qu'elle arriverait.
     Les variables de la page sont déclarées en `let` : elles ne sont PAS des
     propriétés de window. On passe donc par eval, dans la portée de la page. */
  const dansLaPage = code => w.eval(code);
  dansLaPage("MY_ID='MOI'; VIEW_CODE='CODE';");
  dansLaPage('MY_ORDRE_VAC=' + JSON.stringify(rep) + '; renderOrdreVac();');
  const boite = D.getElementById('ordreVacBox');
  V('la vue Mes congés porte un emplacement pour le bandeau', !!boite);

  const bandeaux = boite.querySelectorAll('.ov-bd');
  V('deux bandeaux, un par année', bandeaux.length === 2, bandeaux.length);
  V('le premier annonce mon groupe et mon rang',
    /Groupe B/.test(bandeaux[0].textContent) && /2<sup>e<\/sup>/.test(bandeaux[0].innerHTML),
    bandeaux[0].textContent.replace(/\s+/g,' ').trim().slice(0,60));
  V('l\'année mise en avant est celle que dit le serveur',
    !bandeaux[0].className.includes('sec') && bandeaux[1].className.includes('sec'));
  V('la file est fermée au départ', boite.querySelectorAll('.ov-pan').length === 0);

  bandeaux[0].dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  V('un appui ouvre la file', boite.querySelectorAll('.ov-pan').length === 1);
  V('un seul panneau ouvert à la fois',
    boite.querySelectorAll('.ov-bd[aria-expanded="true"]').length === 1);

  const nomsAffiches = () => [...boite.querySelectorAll('.ov-l .ov-i')].map(e => e.textContent);
  V('la file replié montre les trois premiers, un trou, et mes voisins',
    nomsAffiches().some(t => /autres/.test(t)) && nomsAffiches().length < 21,
    nomsAffiches());
  V('je suis dans la liste, désigné par « Vous »',
    !!boite.querySelector('.ov-l.moi') && /Vous/.test(boite.querySelector('.ov-l.moi').textContent));
  V('mon rang affiché dans la file est le 16e (hiver 2026)',
    boite.querySelector('.ov-l.moi .ov-n').textContent.trim() === '16',
    boite.querySelector('.ov-l.moi .ov-n').textContent);

  /* Changer de période doit changer l'ordre — c'est tout l'intérêt de l'écran. */
  const onglets = boite.querySelectorAll('.ov-ong');
  V('les cinq périodes sont proposées', onglets.length === 5, onglets.length);
  onglets[3].dispatchEvent(new w.MouseEvent('click', { bubbles:true }));   /* Toussaint */
  V('à la Toussaint 2026, je passe 2e',
    boite.querySelector('.ov-l.moi .ov-n').textContent.trim() === '2',
    boite.querySelector('.ov-l.moi .ov-n').textContent);
  V('le compte de ceux qui passent avant suit', /1 avant vous/.test(boite.querySelector('.ov-q').textContent),
    boite.querySelector('.ov-q').textContent);

  boite.querySelector('.ov-tout').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  V('« Voir les 21 » déplie la file entière', boite.querySelectorAll('.ov-l').length === 21,
    boite.querySelectorAll('.ov-l').length);
  V('l\'ordre affiché est exactement celui du serveur',
    [...boite.querySelectorAll('.ov-l .ov-gg .ov-g')].map(e => e.textContent).join('').slice(0,7) === 'BBBBBBB',
    [...boite.querySelectorAll('.ov-l .ov-gg .ov-g')].map(e => e.textContent).join(''));

  /* Le bloc est redessiné à chaque geste : il faut reprendre le bandeau
     courant dans le document, l'ancien étant détaché. */
  boite.querySelector('.ov-bd').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  V('un second appui referme', boite.querySelectorAll('.ov-pan').length === 0);
  boite.querySelectorAll('.ov-bd')[1].dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
  V('ouvrir la seconde année ferme la première',
    boite.querySelectorAll('.ov-pan').length === 1 &&
    boite.querySelectorAll('.ov-bd')[1].getAttribute('aria-expanded') === 'true');
  V('et l\'année suivante donne bien mes rangs de 2027 (3e à l\'hiver)',
    boite.querySelector('.ov-l.moi .ov-n').textContent.trim() === '3',
    boite.querySelector('.ov-l.moi .ov-n').textContent);
  boite.querySelectorAll('.ov-bd')[1].dispatchEvent(new w.MouseEvent('click', { bubbles:true }));

  /* Un MAR sans groupe, et un serveur muet : l'écran ne doit rien casser. */
  dansLaPage('MY_ORDRE_VAC=' + JSON.stringify({ success:true, anneePrincipale:2026,
    annees:[{ annee:2026, monGroupe:null, monRang:0, tailleGroupe:0, groupes:{A:[],B:[],C:[]}, periodes:rep.annees[0].periodes }] })
    + '; renderOrdreVac();');
  V('un MAR hors groupes ne voit aucun bandeau (plutôt qu\'un bandeau faux)',
    D.getElementById('ordreVacBox').innerHTML === '');
  dansLaPage('MY_ORDRE_VAC=null; renderOrdreVac();');
  V('sans réponse du serveur, l\'emplacement reste vide',
    D.getElementById('ordreVacBox').innerHTML === '');
  V('aucune erreur JavaScript pendant toute la manipulation', erreurs.length === 0, erreurs.slice(0,2));

  console.log(`\n${ok} OK · ${ko} en échec`);
  if (ko) process.exit(1);
})();
