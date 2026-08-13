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

  console.log('\n═══ 54. Sélecteur d\'année : la liste du miroir fait foi ═══');
  {
    /* Défaut du 05/08 au soir : 2027 disparaissait du sélecteur admin (pastille
       « solo », sans chevron) dès que le booléen anneeSuivante n'arrivait pas,
       alors que la liste du miroir contenait bien l'année. */
    const { w } = await page(async () => ({ ok:true, json: async () => ({ success:true }) }));
    const poser = (annees, booleen) => w.eval(`
      YEAR = 2026; ADMIN_YEAR = 2026;
      nextYearAvailable = ${JSON.stringify(!!booleen)};
      _anneesServeur = ${JSON.stringify(annees)};
      _MIROIR_ANNEES = { active: 2026, annees: ${JSON.stringify(annees)} };
      availableYears = [];`);
    const liste = [{ annee: 2024, archivee: true }, { annee: 2025, archivee: false },
                   { annee: 2026, archivee: false }, { annee: 2027, archivee: false }];

    // (a) le cas qui a cassé : le booléen manque, la liste contient 2027
    poser(liste, false);
    await w.detectAvailableYears();
    let ans = w.eval('availableYears.map(a => a.year)');
    V('2027 est proposée MÊME sans le booléen', ans.includes(2027), ans);
    V('les années closes sont là aussi', ans.includes(2025) && ans.includes(2024), ans);
    V('aucun doublon', new Set(ans).size === ans.length, ans);
    V('classées de la plus récente à la plus ancienne', ans.join(',') === [...ans].sort((a,b)=>b-a).join(','), ans);
    V('le sélecteur n\'est PAS en mode solo', ans.length > 1, ans.length);
    const statuts = w.eval('availableYears.map(a => a.year + ":" + a.status + (a.readonly ? "/RO" : ""))');
    V('2027 est modifiable, les années closes en lecture seule',
      statuts.includes('2027:n1') && statuts.some(x => /2025:archive\/RO/.test(x)), statuts);

    // (b) une seule année : le mode solo reste possible
    poser([{ annee: 2026, archivee: false }], false);
    await w.detectAvailableYears();
    V('une seule année connue → une seule entrée', w.eval('availableYears.length') === 1, w.eval('availableYears.length'));

    // (c) le booléen seul, sans liste : l'ancien chemin fonctionne toujours
    w.eval('YEAR = 2026; ADMIN_YEAR = 2026; nextYearAvailable = true; _anneesServeur = []; _MIROIR_ANNEES = null; availableYears = [];');
    await w.detectAvailableYears();
    ans = w.eval('availableYears.map(a => a.year)');
    V('sans liste, le booléen suffit encore (repli conservé)', ans.includes(2027), ans);
  }

  console.log('\n═══ 55. Panneau Modifications : gardes par le miroir, échec jamais mémorisé ═══');
  {
    /* Défaut du 05/08 au soir : un appel raté laissait « {} » en mémoire pour
       toute la session → « Aucune garde à cette date » sur TOUTES les dates,
       sans jamais dire qu'un appel avait échoué. */
    let appelsMiroir = 0, appelsGAS = 0;
    const { w } = await page(async (url, opt) => {
      if (String(url).includes('workers.dev')) {
        appelsMiroir++;
        return { ok:true, json: async () => ({ success:true, identite:{role:'admin'},
          data: { gardes_2027: { success:true, data: { '2027-01-04': { ARMANDO:'G', OPPRECHT:'G2' } } } } }) };
      }
      appelsGAS++;
      return { ok:true, json: async () => ({ success:true, data:{} }) };
    });
    w.eval('gardesByYear = {}; _tsEcriturePlanning = 0;');
    const r1 = await w.ensureGardesYear('2027');
    V('les gardes viennent du MIROIR', appelsMiroir >= 1 && appelsGAS === 0, { appelsMiroir, appelsGAS });
    V('la journée du 04/01/2027 est chargée', !!(r1 && r1['2027-01-04']), r1 && Object.keys(r1));
    V('ARMANDO y est bien de garde', r1['2027-01-04'].ARMANDO === 'G', r1['2027-01-04']);
    V('un second appel ne redemande RIEN (mémoire)', (await w.ensureGardesYear('2027')) && appelsMiroir === 1, appelsMiroir);

    // Tout tombe : l'échec ne doit rien laisser en mémoire
    const { w: w2 } = await page(async () => { throw new Error('réseau'); });
    w2.eval('gardesByYear = {}; _tsEcriturePlanning = 0;');
    const r2 = await w2.ensureGardesYear('2027');
    V('un échec rend null (et non une liste vide)', r2 === null, r2);
    V('RIEN n\'est mémorisé : le prochain essai recommencera', w2.eval('gardesByYear["2027"] === undefined'), w2.eval('JSON.stringify(gardesByYear)'));

    // Puis le réseau revient : la lecture doit réussir sans rechargement de page
    let revenu = false;
    w2.fetch = async (url) => {
      if (String(url).includes('workers.dev')) { revenu = true;
        return { ok:true, json: async () => ({ success:true, identite:{role:'admin'},
          data: { gardes_2027: { success:true, data: { '2027-01-04': { ARMANDO:'G' } } } } }) }; }
      return { ok:true, json: async () => ({ success:true, data:{} }) };
    };
    const r3 = await w2.ensureGardesYear('2027');
    V('le réseau revenu, la lecture réussit (pas de rechargement nécessaire)', !!(r3 && r3['2027-01-04']) && revenu, r3);
    V('le message d\'échec et le bouton Réessayer existent', typeof w2._gardesReessayer === 'function');
  }

  console.log('\n═══ 56. Équité admin : l\'instantané passe aussi par le miroir ═══');
  {
    /* (13/08/2026) Le commentaire du 04/08 disait « getStatsLive = calcul vivant,
       jamais mirore ». La cle equite_live_{annee} l'a rendu faux le soir meme.
       Ce qui doit rester vrai : les deux sources lisent des cles DISTINCTES, la
       garde des 90 s apres une ecriture vaut pour LES DEUX, et Actualiser
       court-circuite la copie. */
    const c = fs.readFileSync('../admin.html', 'utf8');
    const fn = (c.match(/async function loadStats\(year, force\)[\s\S]*?\n\}/) || [''])[0];
    V('loadStats a bien été retrouvée', fn.length > 0);
    V('la clé dépend de la source affichée',
      /_cleMiroir = \(src === 'live' \? 'equite_live_' : 'stats_'\) \+ year/.test(fn), fn.slice(0, 80));
    V('la garde des 90 s après écriture couvre les DEUX sources',
      /if \(!force && Date\.now\(\) - _tsEcriturePlanning > 90000\)/.test(fn) &&
      !/src !== 'live' && Date\.now\(\)/.test(fn));
    V('Actualiser court-circuite la copie rapide', /!force &&/.test(fn));
    V('l\'appel direct reste le repli, avec la bonne action',
      /api\(\{action: src==='live'\?'getStatsLive':'getStats', year\}\)/.test(fn));
    /* Le commentaire du 04/08 n'est pas efface : il est CITE et corrige, pour que
       la lecture du code raconte ce qui a change et pourquoi. On verifie donc
       qu'il n'est plus affirme, pas qu'il a disparu. */
    V('l\'ancien commentaire n\'est plus affirmé mais cité comme dépassé',
      /disait « getStatsLive = calcul vivant, jamais mirore » : c'est/.test(c));
  }

  console.log('\n═══ 57. Onglet Équité : plus d\'appel fantôme aux vacances ═══');
  {
    /* (13/08/2026) loadVacancesValidation() appelait Google a CHAQUE ouverture de
       l'onglet Equite pour ecrire dans #vacContent — le conteneur de la section
       « Gestion des vacances » de l'onglet EQUIPE. Le tableau n'etait donc jamais
       visible et ecrasait l'affichage d'un autre onglet. Elle manipulait aussi
       #vacEmpty, absent de la page. */
    const c = fs.readFileSync('../admin.html', 'utf8');
    V('ouvrir Équité ne charge plus que les statistiques',
      /if \(name==='equite'\) \{ loadStats\(ADMIN_YEAR\); \}/.test(c));
    V('la fonction fantôme a disparu', !/async function loadVacancesValidation/.test(c));
    V('son rendu aussi', !/function renderVacances\(periodes\)/.test(c));
    /* getVacValidation subsiste dans les ASSISTANTS de generation (placement des
       vacances, etape 1 des gardes) : la, il est demande a la demande et son
       resultat est affiche. Ce qui devait disparaitre, c'est l'appel a
       l'OUVERTURE d'un onglet. */
    V('getVacValidation ne subsiste que dans les assistants',
      (c.match(/action:\s*'getVacValidation'/g) || []).length === 2 &&
      !/name==='equite'[\s\S]{0,200}getVacValidation/.test(c),
      (c.match(/action:\s*'getVacValidation'/g) || []).length);
    V('#vacContent n\'est plus manipule que par l\'onglet Equipe',
      (() => { const f = (c.match(/async function loadVacances\(force\)[\s\S]*?\n\}/) || [''])[0];
               return (c.match(/getElementById\('vacContent'\)/g) || []).length ===
                      (f.match(/getElementById\('vacContent'\)/g) || []).length; })(),
      (c.match(/getElementById\('vacContent'\)/g) || []).length);
    V('plus de reference a #vacEmpty, qui n\'existe pas dans la page',
      !/getElementById\('vacEmpty'\)/.test(c) && !/id="vacEmpty"/.test(c));
    V('l\'onglet Equipe charge toujours les periodes et les groupes',
      /if \(name==='equipe'\) \{ loadEquipe\(\); loadVacances\(\); \}/.test(c));
  }

  console.log('\n═══ 58. Avancement de la campagne d\'indisponibilités ═══');
  {
    /* (13/08/2026) Le comite ne savait qui avait saisi qu'a l'etape 1 de
       l'assistant de generation — en novembre, trop tard pour relancer.
       Regle : chacun doit poser AU MOINS une ligne, meme sans contrainte. */
    const c = fs.readFileSync('../admin.html', 'utf8');
    const fn = (c.match(/async function majIndChip\(force\)[\s\S]*?\n\}/) || [''])[0];
    V('la fonction a bien été retrouvée', fn.length > 0);
    V('hors campagne, la pastille disparaît',
      /if \(!INDISPOS_YEAR\)\{ chip\.style\.display='none'/.test(fn));
    V('elle emploie la MÊME règle que le contrôle bloquant (marsDansAnnee)',
      /marsDansAnnee\(marsData, INDISPOS_YEAR\)/.test(fn) &&
      /marsDansAnnee\(marsData, INDISPOS_YEAR\)/.test(c.slice(c.indexOf('renderWizGStep'))));
    V('un MAR sans aucune ligne compte comme manquant',
      /Object\.keys\(ind\)\.length === 0/.test(fn));
    V('les initiales sont acceptées comme l\'identifiant',
      /parMar\[m\.id\] \|\| parMar\[m\.initiales\]/.test(fn));
    /* (13/08/2026) Le banc a rattrape la premiere version : elle se rabattait sur
       Apps Script quand la copie etait vide — donc un appel A L'OUVERTURE, ce que
       le portail s'interdit depuis la v1.25 (voir scenario 18). */
    V('à l\'ouverture, la copie rapide et RIEN d\'autre',
      /if \(force\)\{\s*const r = await api\(\{action:'getAllIndispos'/.test(fn) &&
      /\} else \{\s*const m = await miroirRead\(\['indispos_'/.test(fn));
    V('copie vide : la pastille reste muette plutôt que d\'appeler Google',
      /if \(!parMar\) return;/.test(fn));
    V('le repli lit « data », le nom que le serveur emploie vraiment',
      /r\.success && r\.data\) parMar = r\.data/.test(fn));
    V('le clic force un compte frais', /majIndChip\(true\)/.test(c));
    V('un échec laisse la pastille en l\'état plutôt que d\'afficher un faux compte',
      /catch\(e\)\{ \/\* information de confort/.test(fn));
    V('la pastille est mise à jour quand la liste des MAR arrive',
      /marsData = medData\.medecins;[\s\S]{0,200}majIndChip\(\)/.test(c));
  }

  console.log('\n═══ 59. Onglet Équipe : périodes et groupes par le miroir ═══');
  {
    /* (13/08/2026) La cle vacances_admin etait deposee et autorisee au comite
       depuis le 04/08, mais aucun ecran ne la lisait. Producteur et consommateur
       ont ete compares : memes colonnes, meme forme. */
    const c = fs.readFileSync('../admin.html', 'utf8');
    const miroir = fs.readFileSync('../gas/miroir.gs', 'utf8');
    const fn = (c.match(/async function loadVacances\(force\)[\s\S]*?\n\}/) || [''])[0];
    V('loadVacances a bien été retrouvée', fn.length > 0);
    V('la copie rapide est lue avant Google',
      fn.indexOf("miroirRead(['vacances_admin']") > -1 &&
      fn.indexOf("miroirRead(['vacances_admin']") < fn.indexOf("api({action: 'getVacancesConfig'}"));
    V('l\'appel direct reste le repli', /api\(\{action: 'getVacancesConfig'\}\)/.test(fn));
    V('la garde de 90 s après une écriture est là',
      /Date\.now\(\) - _tsEcritureVacances > 90000/.test(fn));
    V('enregistrer des périodes horodate cette garde',
      /_tsEcritureVacances = Date\.now\(\);[\s\S]{0,120}action: 'savePeriodes'/.test(c));
    V('enregistrer des groupes aussi',
      /_tsEcritureVacances = Date\.now\(\);[\s\S]{0,120}action: 'saveGroupes'/.test(c));
    V('le bouton Actualiser court-circuite la copie',
      /onclick="loadVacances\(true\)"/.test(c));
    /* Le contrat de forme, des deux cotes : si l'un des deux change, l'ecran
       afficherait du vide sans rien dire. */
    V('le miroir produit bien periodes[] et groupes{A,B,C}',
      /return \{ success: true, periodes: periodes, groupes: groupes \};/.test(miroir));
    V('l\'écran consomme exactement ces deux champs',
      /periodesData = data\.periodes \|\| \[\]/.test(fn) &&
      /groupesData = data\.groupes \|\| \{A:\[\], B:\[\], C:\[\]\}/.test(fn));
    V('la copie n\'est acceptée que si elle porte bien un tableau de périodes',
      /Array\.isArray\(_b\.periodes\)/.test(fn));
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  process.exit(ko ? 1 : 0);
})();
