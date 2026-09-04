/* ═══ BANC — CALCUL À BLANC DU GÉNÉRATEUR (04/09/2026) ═══════════════════
   POURQUOI CE SCÉNARIO EXISTE.
   Depuis l'ouverture du portail au service, générer une année ne se voit plus
   seulement du comité : l'onglet créé fait apparaître l'année dans le sélecteur
   des 23, et la génération se termine par une notification push sur leur
   téléphone. Il n'existait donc plus aucun endroit où éprouver le générateur
   sur les VRAIES données — et c'est précisément ce qu'il faut pour mesurer la
   durée d'une génération dans Apps Script.

   CE QUE CES VÉRIFICATIONS TIENNENT.
   1. Le calcul à blanc ne crée AUCUN onglet — la promesse d'invisibilité.
   2. Il produit EXACTEMENT le même planning qu'une vraie génération, comparé
      compteur par compteur, MAR par MAR. Sans cette preuve, la mesure ne
      mesurerait pas ce qu'on croit.
   3. Il rend la durée, les écarts par axe et les jours sans binôme.
   4. Le verrou anti-régénération ne le bloque pas — il protège un planning
      contre l'écrasement, et rien n'est écrasé ici.
   5. …mais il protège TOUJOURS une vraie génération. C'est la vérification qui
      compte le plus : desserrer le verrou pour le calcul à blanc ne doit pas
      l'avoir desserré pour tout le monde.

   Le vrai générateur du dépôt est exécuté, jamais recopié.  */
const path = require('path');
const H = require(path.join(__dirname, '..', 'simulateur', 'harness.js'));

let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); }
  else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 200) : '')); } };

const YEAR = 2027;
const roster = H.defaultRoster();
function monde() {
  const sheets = [
    H.makeSheet('MEDECINS', H.medecinsRows(roster)),
    H.makeSheet(`INDISPOS_${YEAR}`, H.indisposRows(YEAR, roster, {})),
    H.makeSheet('PERIODES_VAC', H.periodesRows(YEAR)),
    H.makeSheet('CONFIG', [['CLE', 'VALEUR']]),
  ];
  const ss = H.makeSpreadsheet(sheets);
  const logs = [];
  return { ss, logs, ctx: H.buildContext(ss, logs),
           onglets: () => ss.getSheets().map(s => s.getName()).sort() };
}

/* ═══ 1. Le calcul à blanc n'écrit rien ════════════════════════════════ */
console.log('\n═══ 1. Un calcul à blanc ne laisse aucune trace dans le classeur ═══');
const A = monde();
const avant = A.onglets();
const dry = A.ctx.generateGardes(YEAR, { dryRun: true });
const apres = A.onglets();

V('le calcul à blanc se déclare comme tel', dry && dry.dryRun === true);
V('aucun onglet n\'a été créé', JSON.stringify(avant) === JSON.stringify(apres), { avant, apres });
V('…en particulier pas l\'onglet des gardes', apres.indexOf(`GARDES_${YEAR}`) < 0);
V('…ni celui des statistiques d\'équité', apres.indexOf(`STATS_GARDES_${YEAR}`) < 0);
V('…ni celui des liens samedi vers récupération', apres.indexOf(`LIENS_R_${YEAR}`) < 0);
/* La notification est le geste le plus visible des quatre : elle sonne sur le
   téléphone des 23. Le monde simulé journalise tout appel — s'il en restait un,
   il apparaîtrait ici. */
V('aucune notification n\'est partie vers les MAR',
  !A.logs.some(l => /notifierPush|planning .* est disponible/i.test(String(l))), A.logs.slice(0, 5));

/* ═══ 2. Il rend de quoi mesurer ═══════════════════════════════════════ */
console.log('\n═══ 2. Ce que le calcul à blanc rapporte ═══');
V('une durée en millisecondes', typeof dry.ms === 'number' && dry.ms > 0);
V('le nombre de médecins réellement servis', dry.gardeurs > 0);
V('le compte des jours sans binôme', typeof dry.sansBinome === 'number');
V('l\'année de démonstration en couvre 365 sur 365', dry.sansBinome === 0, dry.jours);
['total', 'sam', 'jeu', 'vd', 'vjf', 'jf'].forEach(ax => {
  V('l\'écart réel−cible est rendu pour l\'axe ' + ax,
    dry.ecarts && dry.ecarts[ax] && typeof dry.ecarts[ax].ecart === 'number');
});
V('chaque écart nomme le MAR concerné (sinon il n\'est pas actionnable)',
  Object.keys(dry.ecarts).every(k => typeof dry.ecarts[k].mar === 'string'));
V('les avertissements sont rendus, pas seulement journalisés',
  Array.isArray(dry.warnings) && typeof dry.nbWarnings === 'number');

/* ═══ 3. Même planning qu'une vraie génération ═════════════════════════ */
console.log('\n═══ 3. À blanc et pour de vrai produisent le MÊME planning ═══');
/* La comparaison porte sur les compteurs BRUTS, en entiers. Comparer les écarts
   réel−cible ne prouverait rien : l'onglet STATS arrondit la cible au dixième,
   deux plannings identiques y afficheraient des écarts différents de 0,02. */
const B = monde();
B.ctx.generateGardes(YEAR);
const st = H.readStats(B.ss, YEAR);
V('la génération réelle, elle, crée bien les trois onglets',
  B.onglets().indexOf(`GARDES_${YEAR}`) >= 0 &&
  B.onglets().indexOf(`STATS_GARDES_${YEAR}`) >= 0 &&
  B.onglets().indexOf(`LIENS_R_${YEAR}`) >= 0);

const COL = { total: 'TOTAL G', g: 'G (REA)', g2: 'G2 (MAT)',
              sam: 'SAM', jeu: 'JEU', vd: 'VD', vjf: 'VEILLE JF' };
const num = v => Number(String(v).replace(/^'/, '')) || 0;
const ids = Object.keys(dry.compteurs);
V('le calcul à blanc rend les compteurs de chaque MAR', ids.length > 0);
let ecarts = [];
ids.forEach(id => {
  const ligne = st.byId[id]; if (!ligne) { ecarts.push(id + ' absent des STATS'); return; }
  Object.keys(COL).forEach(k => {
    if (num(ligne[COL[k]]) !== dry.compteurs[id][k])
      ecarts.push(`${id}.${k} : à blanc ${dry.compteurs[id][k]} vs écrit ${num(ligne[COL[k]])}`);
  });
});
V('chaque MAR a EXACTEMENT les mêmes gardes des deux côtés (7 compteurs × ' + ids.length + ' MAR)',
  ecarts.length === 0, ecarts.slice(0, 8));

/* ═══ 4. Le verrou : levé pour le calcul à blanc, INTACT pour le reste ══ */
console.log('\n═══ 4. Le verrou anti-régénération reste entier ═══');
/* B a déjà généré 2027 pour de vrai : son onglet existe. */
let relance = null;
try { relance = B.ctx.generateGardes(YEAR, { dryRun: true }); } catch (e) { relance = { err: e.message }; }
V('on peut relancer un calcul à blanc sur une année DÉJÀ générée',
  relance && relance.dryRun === true, relance);
V('…et il ne touche toujours à rien',
  B.onglets().filter(n => /^(GARDES|STATS_GARDES|LIENS_R)_/.test(n)).length === 3);

let bloque = false, msg = '';
try { B.ctx.generateGardes(YEAR); } catch (e) { bloque = true; msg = e.message; }
V('une VRAIE régénération reste refusée, verrou intact', bloque, msg);
V('…et le refus explique quoi faire', /supprimez d'abord manuellement/i.test(msg), msg);

/* ═══ 5. Contrat de code ═══════════════════════════════════════════════ */
console.log('\n═══ 5. La frontière entre calculer et écrire est explicite ═══');
const fs = require('fs');
const src = fs.readFileSync(path.join(__dirname, '..', 'gas', 'generateur_gardes.gs'), 'utf8');
V('la sortie à blanc précède le premier geste visible',
  src.indexOf('if(DRY){') > 0 &&
  src.indexOf('if(DRY){') < src.indexOf('// ── 12. Écrire GARDES_YYYY'));
V('le verrou n\'est levé QUE pour le calcul à blanc',
  /if\(!DRY && ss\.getSheetByName\(`GARDES_\$\{year\}`\)\)\{/.test(src));
V('l\'enveloppe lançable depuis l\'éditeur existe',
  /function essaiGenerationGardes\(year\)/.test(src));
V('…et elle passe bien par le mode à blanc',
  /generateGardes\(an, \{ dryRun: true \}\)/.test(src));
V('la version du fichier a été montée', /GAS_VERSION_GENERATEUR = '2026-09-04\.1'/.test(src));

console.log('\n' + ok + ' OK · ' + ko + ' en échec');
if (ko) process.exit(1);
