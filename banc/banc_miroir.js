const vm = require('vm');
const { Classeur, fabriqueVerrou, VERROUS, extraireFonction } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d) : '')); } };

console.log('\n═══ 6. Notes du miroir : coalescence et éditions manuelles ═══');
VERROUS.script = false;
const PROPS = {}; const triggers = []; const pousses = [];
const cl = new Classeur();
const ctx = vm.createContext({
  console, JSON, Date, Number, String, Object, Array, Set, Math, Error,
  PropertiesService: { getScriptProperties: () => ({
    getProperty: k => (k in PROPS ? PROPS[k] : null),
    setProperty: (k, v) => { PROPS[k] = String(v); },
    deleteProperty: k => { delete PROPS[k]; } }) },
  LockService: { getScriptLock: () => fabriqueVerrou('script') },
  ScriptApp: {
    getProjectTriggers: () => triggers.slice(),
    newTrigger: nom => ({ timeBased: () => ({ after: () => ({ create: () => triggers.push({ h: nom, getHandlerFunction: () => nom }) }) }) }),
    deleteTrigger: t => { const i = triggers.findIndex(x => x.h === t.h); if (i >= 0) triggers.splice(i, 1); },
  },
  Logger: { log: () => {} },
  SpreadsheetApp: { getActiveSpreadsheet: () => cl },
  getActiveYear: () => 2026,
  miroirPousserFamilles_: (f, y) => pousses.push({ familles: f.slice().sort(), annee: y }),
});
ctx.globalThis = ctx;
vm.runInContext('const MIROIR_CLE_ATTENTE = "MIROIR_POUSSEES_EN_ATTENTE";', ctx);
['_miroirNoterPoussee_', 'miroirRattrapage', 'miroirSurEdition'].forEach(n =>
  vm.runInContext(extraireFonction('../gas/miroir.gs', n), ctx));
vm.runInContext(extraireFonction('../gas/miroir.gs', 'miroirSurEdition').includes('MIROIR_ONGLETS_SUIVIS')
  ? require('fs').readFileSync('../gas/miroir.gs','utf8').match(/const MIROIR_ONGLETS_SUIVIS = \{[\s\S]*?\};/)[0] : '', ctx);

// rafale de 5 écritures → UNE note, UN déclencheur
vm.runInContext(`_miroirNoterPoussee_(['config_admin'], 2027)`, ctx);
vm.runInContext(`_miroirNoterPoussee_(['config_admin'], 2027)`, ctx);
vm.runInContext(`_miroirNoterPoussee_(['gardes','indispos'], 2027)`, ctx);
vm.runInContext(`_miroirNoterPoussee_(['config_admin'], 2026)`, ctx);
V('un seul déclencheur pour 4 écritures', triggers.length === 1, triggers.length);
V('la note cumule les familles', JSON.parse(PROPS.MIROIR_POUSSEES_EN_ATTENTE).familles.config_admin === true);
vm.runInContext('miroirRattrapage()', ctx);
V('une seule poussée par année (2 années touchées)', pousses.length === 2, pousses);
V('les familles sont fusionnées', pousses[0].familles.join(',') === 'config_admin,gardes,indispos', pousses[0]);
V('la note est purgée', !PROPS.MIROIR_POUSSEES_EN_ATTENTE);
V('aucun déclencheur orphelin', triggers.length === 0, triggers);

// édition manuelle du classeur
const edition = nom => vm.runInContext(`miroirSurEdition({ range: { getSheet: () => ({ getName: () => ${JSON.stringify(nom)} }) } })`, ctx);
pousses.length = 0; triggers.length = 0;
edition('GARDES_2027');
V('éditer GARDES_2027 pose une note', !!PROPS.MIROIR_POUSSEES_EN_ATTENTE);
const note = JSON.parse(PROPS.MIROIR_POUSSEES_EN_ATTENTE);
V('la bonne année est déduite du nom d\'onglet', note.annees['2027'] === true, note.annees);
V('les bonnes familles sont notées', note.familles.gardes && note.familles.indispos, note.familles);
edition('PLANNING_OVERRIDES');
V('éditer PLANNING_OVERRIDES note config_admin', JSON.parse(PROPS.MIROIR_POUSSEES_EN_ATTENTE).familles.config_admin === true);
const avant = JSON.stringify(PROPS.MIROIR_POUSSEES_EN_ATTENTE);
edition('LOGS');
V('éditer un onglet non suivi ne note RIEN', JSON.stringify(PROPS.MIROIR_POUSSEES_EN_ATTENTE) === avant);
edition('CONNEXIONS');
V('éditer CONNEXIONS ne note rien non plus', JSON.stringify(PROPS.MIROIR_POUSSEES_EN_ATTENTE) === avant);
vm.runInContext('miroirRattrapage()', ctx);
V('la poussée suit l\'édition manuelle', pousses.length >= 1, pousses);

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
