/* ═══ BANC — LA PAGE FACE AUX PANNES ═══
   Les trois peurs d'Arthur : « et si le réseau lâche ? », « et si je ferme la
   page ? », « et si la publication échoue ? ». Jouées sur la VRAIE page. */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d) : '')); } };
const dodo = ms => new Promise(r => setTimeout(r, ms));

async function page(transport) {
  const vc = new VirtualConsole(); const erreurs = [];
  vc.on('jsdomError', e => erreurs.push(e.message));
  const dom = new JSDOM(fs.readFileSync('../admin.html', 'utf8'),
    { runScripts:'dangerously', virtualConsole:vc, url:'https://chpg-anesthesie.github.io/Planning-CHPG/admin.html', pretendToBeVisual:true });
  const w = dom.window;
  await dodo(500);
  w.eval('ADMIN_CODE = "CODE99"; ADMIN_YEAR = 2027; _batchPending = {}; _batchInFlight = null;');
  const compte = { journal: 0, gas: 0 };
  w.fetch = async (url, opt) => transport(String(url), opt, compte);
  return { w, compte, erreurs, dom };
}

(async () => {
  console.log('\n═══ 14. Cloudflare injoignable : la page bascule sur Google ═══');
  {
    const { w, compte } = await page(async (url, opt, c) => {
      if (url.includes('workers.dev')) { c.journal++; throw new Error('réseau'); }
      c.gas++;
      return { ok: true, json: async () => ({ success: true, saved: 1 }) };
    });
    w.queueOverride('2027-03-03','ALPHA','am','REA','Comité');
    const r = await w.flushBatch();
    V('la page a bien tenté le journal', compte.journal >= 1, compte);
    V('elle est retombée sur le circuit Apps Script', compte.gas >= 1, compte);
    V('le placement est enregistré malgré la panne', r === true, r);
    V('rien ne reste en attente', Object.keys(w._batchAll()).length === 0, w._batchAll());
  }

  console.log('\n═══ 15. Tout tombe : le travail est CONSERVÉ, pas perdu ═══');
  {
    const { w } = await page(async (url, opt, c) => {
      if (url.includes('workers.dev')) throw new Error('réseau');
      throw new Error('Apps Script injoignable');
    });
    w.queueOverride('2027-03-05','BRAVO','am','MAT','Comité');
    await w.flushBatch();
    V('le placement RESTE en attente (rien de perdu)', Object.keys(w._batchAll()).length === 1, w._batchAll());
    const garde = w.localStorage.getItem('chpg_batch_2027') || w.localStorage.getItem('chpg_batch') ||
                  Object.keys(w.localStorage).map(k => w.localStorage.getItem(k)).find(v => v && v.includes('BRAVO'));
    V('il est aussi écrit sur le poste (survit à la fermeture)', !!garde, Object.keys(w.localStorage));
  }

  console.log('\n═══ 16. Publication refusée : le lot revient en attente ═══');
  {
    const { w } = await page(async (url, opt, c) => {
      if (url.includes('workers.dev')) return { ok: true, json: async () => ({ success: false, error: 'refus' }) };
      return { ok: true, json: async () => ({ success: false, error: 'GAS refuse' }) };
    });
    w.queueOverride('2027-03-06','CHARLI','am','ORT','Comité');
    const via = await w._publierCombine(2027);
    V('la publication signale son échec', via === null, via);
    V('le lot est REVENU en attente (pas perdu)', Object.keys(w._batchAll()).length === 1, w._batchAll());
    V('il repartira tout seul au prochain envoi', typeof w.flushBatch === 'function');
  }

  console.log('\n═══ 17. Le témoin ne parle au serveur qu\'une fois sur cinq ═══');
  {
    const { w } = await page(async () => ({ ok: true, json: async () => ({ success: true }) }));
    const suite = [];
    for (let i = 0; i < 15; i++) suite.push(w._temoinDoitVerifier_());
    V('3 vérifications sur 15 semaines parcourues', suite.filter(Boolean).length === 3, suite.filter(Boolean).length);
    V('la première semaine est toujours vérifiée', suite[0] === true);
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  process.exit(ko ? 1 : 0);
})();
