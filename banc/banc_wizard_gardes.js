/* ═══ BANC — LE W2 « GÉNÉRER LES GARDES », REMANIÉ LE 03/09/2026 ═══════════

   TROIS DÉCISIONS D'ARTHUR, prises après lecture de l'écran en production :

   1. Le total de jours par MAR (« ✓ 127 jour(s) ») ne veut rien dire : il
      additionne VAC, FORM, INDISPO, SOUHAIT, TP et CL sans distinction, donc
      il mesure une quotité et un historique d'absences, pas une saisie. Et il
      n'entrait dans aucun calcul — le seul test a toujours été « zéro ou pas
      zéro ». Il disparaît.

   2. L'écran « Vacances » rejouait EXACTEMENT le calcul des conflits de
      l'étape précédente : même rotation des groupes, même seuil, même test
      `rang du jour > seuil`. Vérifié ligne à ligne entre getVacConfig et
      getVacValidation. Si l'étape 1 laissait passer, il était vert par
      construction. Il est supprimé — seul son rappel des dates et des seuils
      survit, sur l'écran de lancement.

   3. L'ancienne étape 1 était un mur : le bloquant s'y noyait dans les
      tableaux d'information. Elle est coupée en deux — ce qui EMPÊCHE de
      générer d'abord, ce qui RENSEIGNE ensuite.

   Ce fichier joue la VRAIE page, avec un serveur simulé. */
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 240) : '')); } };
const dodo = ms => new Promise(r => setTimeout(r, ms));

const SRC = fs.readFileSync('../admin.html', 'utf8');

const MARS = [
  { id:'ALPHA', initiales:'AL', nom:'DR ALPHA', actif:true, pctGardes:100, quotite:100 },
  { id:'BETA',  initiales:'BE', nom:'DR BETA',  actif:true, pctGardes:100, quotite:100 },
  { id:'GAMMA', initiales:'GA', nom:'DR GAMMA', actif:true, pctGardes:100, quotite:100 },
];
const PERIODES = [
  { nom:'Hiver', debut:'2027-02-20', fin:'2027-03-07', seuil:8, mars:[] },
  { nom:'Été',   debut:'2027-07-03', fin:'2027-08-31', seuil:10, mars:[] },
];
const FERIES = ['2027-01-01','2027-05-06','2027-07-14','2027-12-25'];

/* Une saisie quelconque, suffisante pour que le MAR ne soit pas « à zéro ». */
function saisies(n) { const o = {}; for (let i = 1; i <= n; i++) o['2027-03-' + String(i).padStart(2,'0')] = 'INDISPO'; return o; }

/* `vides` = liste des ID que le serveur renvoie SANS aucune saisie. */
async function ouvrir(vides) {
  const vc = new VirtualConsole(); const erreurs = [];
  vc.on('jsdomError', e => erreurs.push(e.message));
  const dom = new JSDOM(SRC, { runScripts:'dangerously', virtualConsole:vc,
    url:'https://chpg-anesthesie.github.io/Planning-CHPG/admin.html', pretendToBeVisual:true });
  const w = dom.window;
  await dodo(500);
  w.eval('ADMIN_CODE="CODE99"; YEAR=2026; INDISPOS_YEAR=2027; marsData=' + JSON.stringify(MARS) + ';');
  const ind = {};
  MARS.forEach((m, i) => { ind[m.id] = (vides || []).indexOf(m.id) > -1 ? {} : saisies(3 + i); });
  const appels = [];
  w.fetch = async (url, opt) => {
    const p = JSON.parse(opt.body); appels.push(p.action);
    const rep = {
      getAllIndispos:      { success:true, data: ind },
      getConflitsAll:      { success:true, conflits: [], nbConflits: 0, total: MARS.length },
      getJoursFeries:      { success:true, joursFeries: FERIES },
      getVacValidation:    { success:true, data: PERIODES },
      getNoelAnEligibles:  { success:true, eligibles: [] },
    }[p.action] || { success:true };
    return { ok:true, status:200, json: async () => rep };
  };
  return { w, appels, erreurs };
}
const corps = w => (w.document.getElementById('wizGBody').textContent || '').replace(/\s+/g, ' ');
const brut  = w => w.document.getElementById('wizGBody').innerHTML;

(async () => {
  console.log('\n═══ 1. Le fil d\'étapes annonce ce que chaque écran fait ═══');
  {
    const { w } = await ouvrir([]);
    const lab = i => w.document.querySelector('#wizGStep' + i + ' .wizard-step-label').textContent.trim();
    V('étape 1 : Contrôles', lab(0) === 'Contrôles', lab(0));
    V('étape 2 : Couverture', lab(1) === 'Couverture', lab(1));
    V('étape 3 : Lancer', lab(2) === 'Lancer', lab(2));
  }

  console.log('\n═══ 2. Écran 1 — uniquement ce qui empêche de générer ═══');
  {
    const { w } = await ouvrir([]);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    const t = corps(w);
    V('le point sur les indispos y est', /ont saisi leurs indispos/.test(t), t.slice(0, 200));
    V('le point sur les conflits vacances y est', /Aucun conflit vacances/.test(t));
    V('le point sur les profils bloquants y est', /profil/.test(t));
    V('les tableaux d\'information n\'y sont PLUS', !/Indispos sur jours à enjeu/.test(t));
    V('la couverture par semaine n\'y est plus non plus', !/Couverture des gardes par semaine/.test(t));
    V('le repère de coupure ne fuit pas dans la page', !/WIZG-SPLIT/.test(brut(w)));
  }

  console.log('\n═══ 3. Écran 1 — la liste des MAR ne compte plus les jours ═══');
  {
    const { w } = await ouvrir([]);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    const t = corps(w);
    V('chaque MAR saisi porte un simple « Saisi »', (t.match(/✓ Saisi/g) || []).length === 3, t);
    V('plus aucun total de jours n\'est affiché', !/\d+ jour\(s\)/.test(t), t);
    V('les trois MAR sont bien tous listés',
      /AL/.test(t) && /BE/.test(t) && /GA/.test(t));
  }

  console.log('\n═══ 4. Écran 1 — le verrou tient toujours ═══');
  {
    const { w } = await ouvrir(['GAMMA']);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    const t = corps(w);
    V('un MAR sans aucune saisie est signalé', /n'ont pas encore saisi/.test(t), t.slice(0, 220));
    V('il est nommé', /GA/.test(t));
    V('et il porte la mention rouge', /Pas encore saisi/.test(t));
    V('le bouton Suivant est verrouillé',
      w.document.getElementById('wizGNextBtn').disabled === true);
  }

  console.log('\n═══ 5. Écran 2 — la couverture, et rien qui bloque ═══');
  {
    const { w, appels } = await ouvrir([]);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    V('rien ne bloque quand tout le monde a saisi',
      w.document.getElementById('wizGNextBtn').disabled === false);
    const avant = appels.length;
    await w.wizGNext();
    const t = corps(w);
    V('on est bien passé à l\'écran 2', w.eval('wizGCurrentStep') === 1);
    V('les tableaux d\'information sont ici', /Indispos sur jours à enjeu/.test(t), t.slice(0, 200));
    V('les souhaits aussi', /Souhaits sur jours à enjeu/.test(t));
    V('la couverture jour par jour aussi', /Couverture/.test(t));
    V('cet écran ne verrouille jamais le bouton',
      w.document.getElementById('wizGNextBtn').disabled === false);
    V('et il ne coûte AUCUN appel au serveur', appels.length === avant, appels.slice(avant));
  }

  console.log('\n═══ 6. L\'ancien écran « Vacances » a disparu, son rappel survit ═══');
  {
    const { w, appels } = await ouvrir([]);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    await w.wizGNext();       // → Couverture
    const tCouv = corps(w);
    V('l\'écran 2 n\'est plus la validation des vacances',
      !/Périodes de vacances 2027 — validation/.test(tCouv));
    V('le mot VALIDE ne s\'affiche plus nulle part', !/VALIDE/.test(tCouv), tCouv.slice(0, 200));
    await w.wizGNext();       // → Lancer
    const tLancer = corps(w);
    V('on est bien à l\'écran de lancement', w.eval('wizGCurrentStep') === 2);
    V('les périodes y sont rappelées', /Hiver/.test(tLancer) && /Été/.test(tLancer), tLancer);
    V('avec leurs dates', /2027-02-20/.test(tLancer));
    V('avec leurs seuils', /8/.test(tLancer) && /10/.test(tLancer));
    V('mais sans statut : le contrôle a déjà eu lieu', !/VALIDE/.test(tLancer));
    V('le bouton propose de générer', /Générer les gardes/.test(w.document.getElementById('wizGNextBtn').textContent));
    /* getVacValidation reste appelée UNE fois, dans le lot d'ouverture : le
       rappel des périodes ne coûte donc aucun aller-retour supplémentaire. */
    V('getVacValidation n\'est appelée qu\'une seule fois',
      appels.filter(a => a === 'getVacValidation').length === 1, appels);
  }

  console.log('\n═══ 7. Retour en arrière : rien ne se perd, rien ne se rejoue ═══');
  {
    const { w, appels } = await ouvrir([]);
    w.eval('wizGCurrentStep = 0;');
    await w.renderWizGStep();
    await w.wizGNext(); await w.wizGNext();
    const avant = appels.length;
    await w.wizGPrev();
    V('on revient bien sur la couverture', w.eval('wizGCurrentStep') === 1);
    V('elle est toujours affichée', /Indispos sur jours à enjeu/.test(corps(w)));
    await w.wizGPrev();
    V('puis sur les contrôles', w.eval('wizGCurrentStep') === 0);
    V('eux aussi intacts', /ont saisi leurs indispos/.test(corps(w)));
    V('aucun appel serveur n\'a été rejoué', appels.length === avant, appels.slice(avant));
  }

  console.log(`\n${ok} OK · ${ko} en échec`);
  process.exit(ko ? 1 : 0);
})();
