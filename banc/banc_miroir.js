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

console.log('\n═══ 56. Inventaire des onglets écoutés (06/08/2026) ═══');
{
  /* Chaque famille du miroir a une source dans le classeur. Si un onglet
     source n'est pas écouté, une correction manuelle y attend la synchro
     HORAIRE — sans que rien ne le signale. Trois manquaient. */
  const fs2 = require('fs');
  const src = fs2.readFileSync('../gas/miroir.gs', 'utf8');
  const table = src.match(/const MIROIR_ONGLETS_SUIVIS = \{([\s\S]*?)\};/)[1];
  const suivis = {};
  table.replace(/(\w+):\s*\[([^\]]*)\]/g, (m, o, f) => { suivis[o] = f.replace(/['\s]/g, '').split(','); });

  const ATTENDU = {
    GARDES: 'gardes', STATS_GARDES: 'stats', INDISPOS: 'indispos', MEDECINS: 'config_admin',
    SECTEURS: 'secteurs', AFFECTATIONS: 'affectations', PLANNING_OVERRIDES: 'config_admin',
    CS_TEMPLATE: 'config_admin', SEUILS: 'config_admin', LIBERAL: 'liberal',
    PERIODES_VAC: 'vacances_admin', GROUPES_VAC: 'vacances_admin',
  };
  Object.entries(ATTENDU).forEach(([onglet, famille]) => {
    V(`${onglet} est écouté (famille « ${famille} »)`,
      suivis[onglet] && suivis[onglet].includes(famille), suivis[onglet]);
  });

  // les trois oublis du 05/08, nommément
  V('AFFECTATIONS — l\'oubli qui masquait les cases à pourvoir', !!suivis.AFFECTATIONS);
  V('STATS_GARDES — l\'équité de référence et la dette', !!suivis.STATS_GARDES);
  V('CS_TEMPLATE et SEUILS — consultations et bornes de tension', !!suivis.CS_TEMPLATE && !!suivis.SEUILS);

  // toute famille construite par le miroir doit avoir au moins une source écoutée
  const construites = [...src.matchAll(/if \(uniq\['(\w+)'\]\)/g)].map(m => m[1]);
  const couvertes = new Set(Object.values(suivis).flat());
  const SANS_SOURCE = ['annees', 'planning', 'affectations', 'tuiles', 'joursferies', 'mail'];
  const orphelines = construites.filter(f => !couvertes.has(f) && !SANS_SOURCE.includes(f));
  V('aucune famille sans onglet source écouté', orphelines.length === 0, orphelines);
}

/* ═══ OUBLI DES ANNEES RETIREES (2026-08-09) ═══════════════════════════
   Defaut trouve en production le 09/08 : supprimer les onglets et les JSON
   2027 ne retirait PAS `planning_2027` du miroir — les 23 MARs auraient
   continue de voir des gardes fictives. On verifie les deux sens :
   ce qui doit partir part, et surtout ce qui ne doit PAS partir reste. */
{
  console.log('\n═══ 6 bis. Le miroir sait oublier une année retirée ═══');
  const fs2 = require('fs');
  const src2 = fs2.readFileSync('../gas/miroir.gs', 'utf8');

  const monter = (onglets, archives, opts) => {
    opts = opts || {};
    const actif = new Classeur();
    onglets.forEach(n => actif.ajouter(n, [[]]));
    const arch = new Classeur();
    (archives || []).forEach(n => arch.ajouter(n, [[]]));
    const c = vm.createContext({
      console, JSON, Date, Number, String, Object, Array, Set, Math, Error, RegExp,
      SpreadsheetApp: {
        getActiveSpreadsheet: () => { if (opts.actifKO) throw new Error('classeur injoignable'); return actif; },
        openById: () => { if (opts.archiveKO) throw new Error('archive injoignable'); return arch; },
      },
      ARCHIVE_SS_ID: 'ARCH',
      getActiveYear: () => opts.active || 2026,
      getIndisposYear: () => opts.indispos || null,
    });
    c.globalThis = c;
    ['MIROIR_PURGE_APRES', 'MIROIR_PURGE_MAX_ANNEES', 'MIROIR_CLES_PAR_ANNEE']
      .forEach(n => vm.runInContext(src2.match(new RegExp('const ' + n + ' *=[^;]+;'))[0], c));
    ['_miroirAnneesAttendues_', '_miroirPurgerAnnees_'].forEach(n =>
      vm.runInContext(extraireFonction('../gas/miroir.gs', n), c));
    return c;
  };
  const purger = (c, items, annee) => {
    c.__items = items || {};
    const r = vm.runInContext('_miroirPurgerAnnees_(__items, ' + annee + ')', c);
    return { rapport: r, items: c.__items };
  };

  // 1. Le cas reel : 2027 retire du classeur → ses cles sont effacees
  {
    const c = monter(['GARDES_2026', 'MEDECINS'], [], { active: 2026 });
    const { rapport, items } = purger(c, {}, 2026);
    V('2027 retiré : la purge le désigne', (rapport.annees || []).indexOf(2027) >= 0, rapport);
    V('planning_2027 marqué pour effacement', items.planning_2027 === null, Object.keys(items));
    V('affectations_2027 aussi', items.affectations_2027 === null);
    V('indispos_2027 aussi', items.indispos_2027 === null);
    V('l\'effacement se fait par la valeur null (contrat du Worker)',
      Object.keys(items).every(k => items[k] === null));
    V('2026 (année active) n\'est JAMAIS effacée', !('planning_2026' in items), Object.keys(items));
  }

  // 2. Le garde-fou qui compte : une panne ne doit rien effacer
  {
    const c = monter(['GARDES_2026'], [], { active: 2026, archiveKO: true });
    const { rapport, items } = purger(c, {}, 2026);
    V('archive injoignable → AUCUN effacement', Object.keys(items).length === 0, rapport);
    V('le refus est tracé', !!rapport.refus, rapport);
  }
  {
    const c = monter(['GARDES_2026'], [], { active: 2026, actifKO: true });
    const { items } = purger(c, {}, 2026);
    V('classeur principal injoignable → AUCUN effacement', Object.keys(items).length === 0);
  }

  // 3. Une année archivée reste servie
  {
    const c = monter(['GARDES_2026'], ['GARDES_2025', 'GARDES_2024'], { active: 2026 });
    const { items } = purger(c, {}, 2026);
    V('une année ARCHIVÉE n\'est pas effacée', !('planning_2025' in items) && !('planning_2024' in items),
      Object.keys(items));
  }

  // 4. L'année de campagne (INDISPOS_ACTIVE) est protégée même sans GARDES_
  {
    const c = monter(['GARDES_2026'], [], { active: 2026, indispos: 2027 });
    const { items } = purger(c, {}, 2026);
    V('l\'année de campagne est protégée même sans onglet GARDES_',
      !('indispos_2027' in items), Object.keys(items));
  }

  // 5. Structure anormale : aucun onglet d'année → on n'efface rien
  {
    const c = monter(['MEDECINS'], [], { active: 2026 });
    const { rapport, items } = purger(c, {}, 2026);
    V('classeur sans aucun onglet GARDES_ → refus', !!rapport.refus, rapport);
    V('et donc aucune clé effacée', Object.keys(items).length === 0);
  }

  // 5 bis. Le défaut trouvé au banc le 09/08 : la fenêtre ne doit pas
  // remonter avant la plus ancienne année connue, sinon le plafond saute
  // et la purge ne s'exécute JAMAIS.
  {
    const c = monter(['GARDES_2026'], ['GARDES_2025', 'GARDES_2024'], { active: 2026 });
    const { rapport, items } = purger(c, {}, 2026);
    V('avec 3 années connues, la purge s\'exécute (pas de refus)', !rapport.refus, rapport);
    V('elle ne vise que l\'après (2027, 2028)',
      JSON.stringify(rapport.annees) === JSON.stringify([2027, 2028]), rapport.annees);
    V('aucune année connue n\'est touchée',
      !('planning_2024' in items) && !('planning_2025' in items) && !('planning_2026' in items));
  }

  // 5 ter. Plafond réel : trop d'années à effacer d'un coup → refus
  {
    const c = monter(['GARDES_2020'], [], { active: 2026 });
    const { rapport, items } = purger(c, {}, 2026);
    V('un écart anormal déclenche le plafond', !!rapport.refus, rapport);
    V('et rien n\'est effacé', Object.keys(items).length === 0);
  }

  // 6. Une clé construite dans la même passe n'est jamais écrasée par null
  {
    const c = monter(['GARDES_2026'], [], { active: 2026 });
    const { items } = purger(c, { planning_2027: '{"months":[]}' }, 2026);
    V('une clé déjà construite n\'est pas remplacée par un effacement',
      items.planning_2027 === '{"months":[]}', items.planning_2027);
  }

  // 7. Les listes communes ne sont JAMAIS effaçables
  {
    const listes = ['topos', 'protocoles', 'annuaire', 'secteurs', 'acces', 'veille', 'staffs'];
    const parAnnee = src2.match(/const MIROIR_CLES_PAR_ANNEE *=[\s\S]*?\];/)[0];
    V('aucune liste commune dans les clés effaçables',
      listes.every(l => !new RegExp("'" + l + "'").test(parAnnee)), parAnnee);
    V('toutes les clés effaçables se terminent par un séparateur d\'année',
      (parAnnee.match(/'[a-z_]+_'/g) || []).length >= 5, parAnnee);
  }

  // 8. La purge n'est câblée QUE dans la synchro complète
  {
    V('la purge n\'est appelée que si toutesAnnees',
      /if \(toutesAnnees\) \{[\s\S]{0,200}_miroirPurgerAnnees_/.test(src2));
  }
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
