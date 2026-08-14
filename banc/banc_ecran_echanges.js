/* ═══ BANC — L'ÉCRAN « MES ÉCHANGES » (dashboard réel, piloté au clic) ═══
   Le vrai dashboard.html dans un navigateur simulé, servi par le VRAI
   Worker (interrupteur compris). Trois vérités d'écran :
   1. interrupteur fermé → RIEN n'apparaît (l'invisibilité est côté serveur) ;
   2. pilote → carte avec compteur, liste, Accepter qui écrit et se met à jour ;
   3. proposer → le bon verbe part au serveur avec les bonnes valeurs.
   La clé `echanges` voyage dans l'appel d'OUVERTURE : le banc vérifie
   aussi qu'aucune requête miroir supplémentaire n'est payée au chargement. */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs'), vm = require('vm'), path = require('path');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 200) : '')); } };
const dodo = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8').replace('export default', 'globalThis.__W =');
  const sha = async t => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); };
  const CODE = 'MARCODE77';

  /* Un planning 2027 minimal mais RÉALISTE : un mois, 6 jours, deux MAR,
     ALPHA tient une garde — la matière du panneau « Proposer ». */
  const jours = ['2027-03-08','2027-03-09','2027-03-10','2027-03-11','2027-03-12','2027-03-13'];
  const st = (arr) => jours.map((d,i)=>({ status: arr[i]||'' }));
  const planning = { months: [{
    days: jours.map(d => ({ date: d })),
    doctors: [
      { id:'ALPHA', days: st(['','G','RG','','','']) },
      { id:'BRAVO', days: st(['','','','','G','RG']) },
    ],
  }] };
  const demande = { id:'E1', creeLe:new Date().toISOString(), type:'don', annee:2027,
    date:'2027-03-12', date2:'', demandeur:'BRAVO', receveur:'ALPHA', etat:'attente', reponduLe:'', info:'' };

  async function monterPage(kvInitial, surGas) {
    const wctx = vm.createContext({ globalThis:{}, console, crypto, TextEncoder, Response, Request, URL, JSON, Date, Math, Object, Array, String, Number, Set, Promise });
    wctx.globalThis = wctx; vm.runInContext(src, wctx);
    const WK = wctx.__W, M = new Map();
    Object.keys(kvInitial).forEach(k => M.set(k, kvInitial[k]));
    const KV = { get: async k => (M.has(k)?M.get(k):null), put: async (k,v)=>{M.set(k,v);}, delete: async k=>{M.delete(k);},
      list: async ({prefix,limit}) => ({ keys:[...M.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit||1000).map(name=>({name})) }) };
    const env = { KV, PUSH_TOKEN:'JETON' };
    const contenu = fs.readFileSync(path.join(__dirname, '..', 'dashboard.html'), 'utf8');
    const vc = new VirtualConsole(); const erreurs = [];
    vc.on('jsdomError', e => erreurs.push(e.message));
    const appelsMiroir = [], appelsGas = [];
    const fauxFetch = async (url, opt) => {
      const u = String(url);
      if (u.includes('workers.dev')) {
        const chemin = u.replace(/^https:\/\/[^/]+/, '');
        if (chemin === '/read') { try { appelsMiroir.push(JSON.parse(opt.body).keys); } catch(e) { appelsMiroir.push(null); } }
        return WK.fetch(new Request('https://worker' + chemin, { method:'POST', body: opt.body }), env);
      }
      let charge = {}; try { charge = JSON.parse(opt.body); } catch(e) {}
      appelsGas.push(charge);
      const rep = surGas ? surGas(charge, M) : null;
      return { ok:true, json: async () => (rep || { success:false, error:'GAS indisponible dans le banc' }) };
    };
    const dom = new JSDOM(contenu, { runScripts:'dangerously', virtualConsole:vc,
      url:'https://chpg-anesthesie.github.io/Planning-CHPG/dashboard.html', pretendToBeVisual:true,
      beforeParse(win) {
        win.matchMedia = () => ({ matches:false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} });
        win.Element.prototype.scrollIntoView = function () {};
        win.scrollTo = () => {};
        /* Le faux réseau AVANT tout script : l'appel d'ouverture (viewAutoLogin
           → miroirBootDash) part pendant le chargement de la page. */
        win.fetch = fauxFetch;
        if (!win.navigator.sendBeacon) win.navigator.sendBeacon = () => true;
        /* Un navigateur « capable » de notifications : la carte ne dépend
           alors QUE de l'interrupteur côté serveur. */
        Object.defineProperty(win.navigator, 'serviceWorker', { value: { register: async () => ({}) } });
        win.PushManager = function () {};
        win.Notification = { permission: 'default' };
        try { win.sessionStorage.setItem('chpgViewCode', CODE); } catch(e) {}
      } });
    const w = dom.window;
    await dodo(900);
    return { w, M, erreurs, appelsMiroir, appelsGas };
  }

  const baseKV = async () => ({
    acces: JSON.stringify({ indisposYear:2027, indisposOuverte:false, users:[
      { h: await sha(CODE), role:'mar', id:'ALPHA', name:'ALPHA', initials:'AL', prenom:'Test' }]}),
    annees: JSON.stringify({ success:true, active:2027, annees:[{annee:2027, statut:'ACTIF'}] }),
    planning_2027: JSON.stringify(planning),
    echanges: JSON.stringify({ success:true, echanges:[demande] }),
  });

  console.log('\n═══ 1. Interrupteur FERMÉ : le dashboard d\'un MAR ne montre RIEN ═══');
  {
    const { w, erreurs, appelsMiroir } = await monterPage(await baseKV(), null); // pas de notif_config → fermé
    V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
    const hero = w.document.getElementById('echangesHero');
    V('la carte « Mes échanges » est INVISIBLE', hero && hero.style.display === 'none');
    V('la carte « Activer les notifications » aussi (même interrupteur)',
      w.document.getElementById('notifCard').style.display === 'none');
    V('la clé a bien été demandée dans l\'appel d\'ouverture (et refusée)',
      appelsMiroir.some(k => Array.isArray(k) && k.indexOf('echanges') > -1), appelsMiroir);
    V('AUCUNE requête miroir dédiée aux échanges (elle voyage avec le reste)',
      !appelsMiroir.some(k => Array.isArray(k) && k.length === 1 && k[0] === 'echanges'), appelsMiroir);
  }

  console.log('\n═══ 2. PILOTE : carte, compteur, liste — et Accepter écrit puis rafraîchit ═══');
  {
    const kv = await baseKV();
    kv.notif_config = JSON.stringify({ ouvert:false, pilotes:['ALPHA','BRAVO'] });
    const surGas = (charge, M) => {
      if (charge.action === 'repondreEchange') {
        const acc = Object.assign({}, demande, { etat:'acceptee', reponduLe:new Date().toISOString() });
        M.set('echanges', JSON.stringify({ success:true, echanges:[acc] }));   // le verbe réel pousse au KV avant de répondre
        return { success:true, etat:'acceptee' };
      }
      if (charge.action === 'login') return { success:true, role:'mar', id:'ALPHA', year:2027 };
      return { success:true };
    };
    const { w, erreurs, appelsGas } = await monterPage(kv, surGas);
    V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
    const hero = w.document.getElementById('echangesHero');
    V('la carte est VISIBLE pour le pilote', hero && hero.style.display !== 'none');
    V('la carte « Activer les notifications » se montre au pilote (correctif v1.34.1)',
      w.document.getElementById('notifCard').style.display !== 'none');
    V('le compteur annonce la demande en attente', /1 demande attend/.test(w.document.getElementById('echHeroMain').textContent));

    w.location.hash = '#echanges';
    w.route();
    await dodo(400);
    V('la vue s\'ouvre', w.document.getElementById('echangesView').style.display === 'block');
    const liste = w.document.getElementById('echList').innerHTML;
    V('la demande est affichée — don, les deux noms, la date', /Don de garde/.test(liste) && /Bravo/.test(liste) && /Alpha/.test(liste) && /12\/03\/2027/.test(liste), liste.slice(0,200));
    V('le délai d\'expiration est annoncé', /Expire dans \d+ h/.test(liste));
    const btn = [...w.document.querySelectorAll('.ech-accepter')][0];
    V('le receveur a son bouton Accepter', !!btn);

    btn.click();
    await dodo(500);
    const gas = appelsGas.find(c => c.action === 'repondreEchange');
    V('le verbe part au serveur avec l\'identifiant et la réponse', !!gas && gas.id === 'E1' && gas.reponse === 'accepter', gas);
    const apres = w.document.getElementById('echList').innerHTML;
    V('l\'écran se met à jour : Acceptée, plus aucun bouton', /Acceptée/.test(apres) && !/ech-accepter/.test(apres), apres.slice(0,200));
    V('le compteur de la carte s\'éteint', /Mes échanges/.test(w.document.getElementById('echHeroMain').textContent));
  }

  console.log('\n═══ 3. PROPOSER : le panneau construit le bon verbe, avec les bonnes valeurs ═══');
  {
    const kv = await baseKV();
    kv.notif_config = JSON.stringify({ ouvert:true, pilotes:[] });
    kv.echanges = JSON.stringify({ success:true, echanges:[] });
    let cree = null;
    const surGas = (charge, M) => {
      if (charge.action === 'creerEchange') {
        cree = charge;
        M.set('echanges', JSON.stringify({ success:true, echanges:[Object.assign({}, demande,
          { id:'E2', type:charge.type, date:charge.date, demandeur:'ALPHA', receveur:charge.receveur })] }));
        return { success:true, id:'E2' };
      }
      if (charge.action === 'login') return { success:true, role:'mar', id:'ALPHA', year:2027 };
      return { success:true };
    };
    const { w, erreurs } = await monterPage(kv, surGas);
    V('la page se charge sans erreur JavaScript', erreurs.length === 0, erreurs.slice(0,2));
    w.location.hash = '#echanges'; w.route();
    await dodo(400);
    V('le bouton Proposer est là (rôle MAR)', w.document.getElementById('echProposerBtn').style.display !== 'none');
    await w.echOuvrirProposition();
    await dodo(300);
    const selGarde = w.document.getElementById('echSelGarde');
    V('mes gardes à venir sont proposées (celle du 09/03/2027)', selGarde && /09\/03\/2027/.test(selGarde.innerHTML), selGarde && selGarde.innerHTML.slice(0,150));
    const selQui = w.document.getElementById('echSelQui');
    V('les collègues sont proposés, moi exclu', /BRAVO/.test(selQui.innerHTML) && !/>Dr Alpha</.test(selQui.innerHTML));
    selQui.value = 'BRAVO';
    await w.echMajProposition();
    w.document.getElementById('echEnvoyer').click();
    await dodo(500);
    V('creerEchange part avec type, année, date et receveur exacts',
      !!cree && cree.type === 'don' && cree.year === 2027 && cree.date === '2027-03-09' && cree.receveur === 'BRAVO', cree);
    V('la nouvelle demande apparaît dans la liste', /Don de garde/.test(w.document.getElementById('echList').innerHTML));
    V('le panneau se referme', w.document.getElementById('echProposition').style.display === 'none');
  }

  console.log('\n' + ok + ' OK · ' + ko + ' en échec');
  if (ko) process.exit(1);
})();
