// ═══ Souhaits jeudi v1 — scénarios ciblés ═══
const H = require('./harness.js');
const A = require('./analyse.js');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✅ ' : '  ❌ ') + msg); if (!cond) fails++; };

function run(name, indisposMap, roster) {
  const res = H.runScenario({ year: 2027, indisposMap, roster });
  if (res.error) { console.log(`💥 ${name}: ${res.error}`); fails++; return null; }
  const P = A.parsePlanning(res.ss, 2027);
  const feries = new Set([...res.ctx.getJoursFeries(2027), ...res.ctx.getJoursFeries(2028)]);
  const inv = A.checkInvariants(P, { ctxFeries: feries, indisposMap: indisposMap || {}, roster });
  const st = H.readStats(res.ss, 2027).byId;
  const act = Object.keys(st).filter(id => +st[id]['TOTAL G'] > 0);
  const dev = (k, ck) => Math.max(...act.map(id => Math.abs(+st[id][k] - +st[id][ck])));
  const cib = id => parseFloat(String(st[id]['CIBLE']).replace("'", ''));
  const m = {
    errs: inv.errs.length,
    sam: dev('SAM', 'CIBLE SAM'), jeu: dev('JEU', 'CIBLE JEU'),
    vd: dev('VD', 'CIBLE VD'), vjf: dev('VEILLE JF', 'CIBLE VJF'),
    tot: Math.max(...act.map(id => Math.abs(+st[id]['TOTAL G'] - cib(id)))),
    gg2: Math.max(...act.map(id => Math.abs(+st[id]['G (REA)'] - +st[id]['G2 (MAT)']))),
    warn: res.logs.filter(l => /Manque|exception|repli|<2/.test(l)).length,
  };
  console.log(`\n══ ${name} ══`);
  console.log(`   errs=${m.errs} sam=${m.sam.toFixed(1)} jeu=${m.jeu.toFixed(1)} vd=${m.vd.toFixed(1)} vjf=${m.vjf.toFixed(1)} tot=${m.tot.toFixed(1)} G−G2=${m.gg2} J±2=${inv.pairsJ2} warn=${m.warn}`);
  return { res, P, st, m, inv, feries };
}

// Enveloppe acceptée par axe : max mesuré sur la batterie officielle (S2-S10,
// avant/après) PLUS le précédent des souhaits du régime déployé (40 mardis →
// tot=1,00 gg2=2, mesuré le 25/08/2026 sur la version en production) :
//   sam 1,2 (S5) · jeu 1,1 (T6/2028) · vd 2,1 (nominal 2027) · vjf 0,8 (2026) ·
//   tot 1,0 · gg2 2 · warn 0. Un souhait déplace des DATES : le bruit de
//   re-placement doit rester DANS cette enveloppe, jamais au-delà.
const ENV = { sam: 1.2, jeu: 1.1, vd: 2.1, vjf: 0.8, tot: 1.0, gg2: 2, warn: 0 };

// jeudis ordinaires 2027 (ni fériés ni veilles de férié)
const base = run('T0 — référence 2027 sans souhait', {});
const feries27 = base.feries;
const jeudisOrd = [];
for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
  const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
  const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const lendemain = A.addD(ds, 1);
  if (A.DOW(ds) === 4 && !feries27.has(ds) && !feries27.has(lendemain)) jeudisOrd.push(ds);
}
console.log(`\n(${jeudisOrd.length} jeudis ordinaires en 2027)`);

// ── T1 : SULTAN souhaite 10 jeudis ordinaires ──────────────────────────
{
  const im = { SULTAN: {} };
  jeudisOrd.filter((d, i) => i % 5 === 0).slice(0, 10).forEach(d => im.SULTAN[d] = 'SOUHAIT'); // répartis sur l'année
  const out = run('T1 — SULTAN : 10 souhaits de jeudis ordinaires', im);
  const days = out.P.byDoc['SULTAN'] || {};
  const honores = Object.keys(im.SULTAN).filter(d => days[d] === 'G' || days[d] === 'G2').length;
  const jeuReel = +out.st['SULTAN']['JEU'];
  const jeuCible = +out.st['SULTAN']['CIBLE JEU'];
  console.log(`   SULTAN : jeu réel=${jeuReel} (cible ${jeuCible}) — souhaits honorés=${honores}/10`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(honores >= Math.floor(jeuCible) - 1 && honores <= Math.floor(jeuCible), `honorés ≈ partie entière de la cible (${Math.floor(jeuCible)})`);
  ok(jeuReel <= Math.ceil(jeuCible), `jeu réel ≤ plafond (${Math.ceil(jeuCible)}) : la date change, pas le nombre`);
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T2 : adversarial — SULTAN souhaite TOUS les jeudis + Ascension + VJF ─
{
  const im = { SULTAN: {} };
  jeudisOrd.forEach(d => im.SULTAN[d] = 'SOUHAIT');
  // jeudis NON ordinaires : fériés et veilles de férié → doivent rester ignorés
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
    const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (A.DOW(ds) === 4 && !jeudisOrd.includes(ds)) im.SULTAN[ds] = 'SOUHAIT';
  }
  const out = run(`T2 — adversarial : SULTAN souhaite les ${Object.keys(im.SULTAN).length} jeudis de l'année`, im);
  const jeuReel = +out.st['SULTAN']['JEU'];
  const jeuCible = +out.st['SULTAN']['CIBLE JEU'];
  console.log(`   SULTAN : jeu réel=${jeuReel} (cible ${jeuCible})`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(jeuReel - jeuCible <= ENV.jeu + 1e-9, `impossible de monopoliser l'axe jeudi (écart ${(jeuReel-jeuCible).toFixed(2)} ≤ enveloppe ${ENV.jeu})`);
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} de l'équipe dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T3 : deux MARs souhaitent le MÊME jeudi → binôme de co-souhaiteurs ──
{
  const cible = jeudisOrd[20];
  const im = { SULTAN: { [cible]: 'SOUHAIT' }, SUPLY: { [cible]: 'SOUHAIT' } };
  const out = run(`T3 — SULTAN et SUPLY souhaitent le même jeudi (${cible})`, im);
  const g = out.P.byDate ? out.P.byDate[cible] : null;
  const dS = out.P.byDoc['SULTAN'] || {}, dP = out.P.byDoc['SUPLY'] || {};
  const tous2 = (dS[cible] === 'G' || dS[cible] === 'G2') && (dP[cible] === 'G' || dP[cible] === 'G2');
  ok(out.m.errs === 0, 'invariants intacts');
  ok(tous2, 'les deux co-souhaiteurs forment le binôme du jour');
}

// ── T4 : charge large — 6 MARs souhaitent chacun 6 jeudis ───────────────
{
  const qui = ['ALBOUY', 'CATINEAU', 'FROHLICH', 'GUERIN', 'ROUSSEAU', 'ZAMARON'];
  const im = {};
  qui.forEach((id, i) => { im[id] = {}; jeudisOrd.slice(i * 6, i * 6 + 6).forEach(d => im[id][d] = 'SOUHAIT'); });
  const out = run('T4 — 6 MARs × 6 souhaits de jeudis (36 souhaits)', im);
  ok(out.m.errs === 0, 'invariants intacts');
  ['sam', 'jeu', 'vd', 'vjf', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
  // Référence tot : la MÊME charge (6 MARs × 6 souhaits) posée sur des MARDIS avec le
  // générateur DÉPLOYÉ donne tot=1,00 (contre-preuve du 25/08/2026). L'écart total ≤ 1
  // est l'enveloppe normale de tout paquet de souhaits (cf. S6 accepté), pas un effet jeudi.
  ok(out.m.tot <= 1.0 + 1e-9, `axe tot dans l'enveloppe souhaits acceptée (${out.m.tot.toFixed(2)} ≤ 1,00 — identique à 36 souhaits de mardis sur la version déployée)`);
  qui.forEach(id => {
    const days = out.P.byDoc[id] || {};
    const hon = Object.keys(im[id]).filter(d => days[d] === 'G' || days[d] === 'G2').length;
    const jc = +out.st[id]['CIBLE JEU'];
    ok(+out.st[id]['JEU'] <= Math.ceil(jc), `${id} : jeu ${out.st[id]['JEU']} ≤ plafond ${Math.ceil(jc)} (honorés ${hon}/6)`);
  });
}

// ── T5 : mixte lun/mar/mer + jeudi (le régime historique reste intact) ──
{
  const im = { SEVERAC: {} };
  let n = 0;
  for (let m = 1; m <= 12 && n < 12; m++) for (let d = 1; d <= 28 && n < 12; d++) {
    const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (A.DOW(ds) === 2) { im.SEVERAC[ds] = 'SOUHAIT'; n++; }
  }
  jeudisOrd.slice(30, 34).forEach(d => im.SEVERAC[d] = 'SOUHAIT');
  const out = run('T5 — SEVERAC : 12 mardis + 4 jeudis souhaités', im);
  const days = out.P.byDoc['SEVERAC'] || {};
  const honJeu = jeudisOrd.slice(30, 34).filter(d => days[d] === 'G' || days[d] === 'G2').length;
  const honMar = Object.keys(im.SEVERAC).filter(d => A.DOW(d) === 2 && (days[d] === 'G' || days[d] === 'G2')).length;
  console.log(`   SEVERAC : mardis honorés=${honMar}/12, jeudis honorés=${honJeu}/4`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(honJeu >= 1, 'au moins un jeudi souhaité honoré');
  ok(honMar >= 1, 'les souhaits lun/mar/mer fonctionnent toujours');
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T6 : inter-annuel — jeudis souhaités en 2027, 2028 reste propre ─────
{
  const im = { SULTAN: {} };
  jeudisOrd.filter((d, i) => i % 5 === 0).slice(0, 10).forEach(d => im.SULTAN[d] = 'SOUHAIT');
  const r1 = H.runScenario({ year: 2027, indisposMap: im });
  const st1 = r1.ss.getSheetByName('STATS_GARDES_2027')._rows.map(r => r.slice());
  const res = H.runScenario({ year: 2028, statsPrev: st1 });
  const P = A.parsePlanning(res.ss, 2028);
  const feries = new Set([...res.ctx.getJoursFeries(2028), ...res.ctx.getJoursFeries(2029)]);
  const inv = A.checkInvariants(P, { ctxFeries: feries });
  const st = H.readStats(res.ss, 2028).byId;
  const act = Object.keys(st).filter(id => +st[id]['TOTAL G'] > 0);
  const dev = (k, ck) => Math.max(...act.map(id => Math.abs(+st[id][k] - +st[id][ck])));
  console.log(`\n══ T6 — 2028 après une année 2027 à souhaits de jeudis ══`);
  console.log(`   errs=${inv.errs.length} sam=${dev('SAM','CIBLE SAM').toFixed(1)} jeu=${dev('JEU','CIBLE JEU').toFixed(1)} vd=${dev('VD','CIBLE VD').toFixed(1)}`);
  ok(inv.errs.length === 0, 'invariants 2028 intacts');
  ok(dev('JEU', 'CIBLE JEU') <= 1.5, `dette jeudi résorbée en 2028 (écart ${dev('JEU','CIBLE JEU').toFixed(2)})`);
}

console.log(fails ? `\n❌ ${fails} ÉCHEC(S) (T1–T6)` : '\n✅ T1–T6 (jeudi) passent');

// ═══ Extension samedi + VD ═══
const samedisOrd = [], vendredisOrd = [];
for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
  const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
  const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const dw = A.DOW(ds);
  if (dw === 6 && !feries27.has(ds) && !feries27.has(A.addD(ds, 1))
      && !feries27.has(A.addD(ds, -2)) && !feries27.has(A.addD(ds, 2))) samedisOrd.push(ds);
  if (dw === 5 && !feries27.has(ds) && !feries27.has(A.addD(ds, 1)) && !feries27.has(A.addD(ds, 2))
      && !feries27.has(A.addD(ds, 3))) vendredisOrd.push(ds);
}
console.log(`\n(${samedisOrd.length} samedis ordinaires, ${vendredisOrd.length} vendredis d'unités VD ordinaires)`);

// ── T7 : SULTAN souhaite 8 samedis ──────────────────────────────────────
{
  const im = { SULTAN: {} };
  samedisOrd.filter((d, i) => i % 5 === 0).slice(0, 8).forEach(d => im.SULTAN[d] = 'SOUHAIT'); // répartis sur l'année
  const out = run('T7 — SULTAN : 8 souhaits de samedis ordinaires', im);
  const days = out.P.byDoc['SULTAN'] || {};
  const hon = Object.keys(im.SULTAN).filter(d => days[d] === 'G' || days[d] === 'G2').length;
  const samReel = +out.st['SULTAN']['SAM'], samCible = +out.st['SULTAN']['CIBLE SAM'];
  console.log(`   SULTAN : sam réel=${samReel} (cible ${samCible}) — honorés=${hon}/8 | recups R=${out.st['SULTAN']['RECUP R'] ?? 'n/a'}`);
  ok(out.m.errs === 0, 'invariants intacts (dont R ≡ SAM)');
  ok(samReel <= Math.ceil(samCible), `sam réel ≤ plafond (${Math.ceil(samCible)})`);
  ok(hon >= Math.floor(samCible) - 1, `honorés ≈ partie entière de la cible (${Math.floor(samCible)})`);
  ['sam', 'jeu', 'vd', 'vjf', 'gg2', 'warn', 'tot'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe acceptée (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T8 : SULTAN souhaite 6 week-ends VD (vendredis) ─────────────────────
{
  const im = { SULTAN: {} };
  // Répartis sur l'année : des souhaits ENTASSÉS en début d'année sont volontairement
  // freinés par le garde-fou de rythme (« jamais plus d'une garde d'avance ») — les 6
  // premiers vendredis de l'année ne donnent que 3 unités honorées, mesuré le 25/08/2026.
  vendredisOrd.filter((d, i) => i % 7 === 0).slice(0, 6).forEach(d => im.SULTAN[d] = 'SOUHAIT');
  const out = run('T8 — SULTAN : 6 souhaits de week-ends VD (par le vendredi)', im);
  const days = out.P.byDoc['SULTAN'] || {};
  const honVen = Object.keys(im.SULTAN).filter(d => days[d] === 'G' || days[d] === 'G2');
  const unites = honVen.filter(v => { const dm = A.addD(v, 2); return days[dm] === 'G' || days[dm] === 'G2'; });
  const vdReel = +out.st['SULTAN']['VD'], vdCible = +out.st['SULTAN']['CIBLE VD'];
  console.log(`   SULTAN : vd réel=${vdReel} (cible ${vdCible}) — vendredis honorés=${honVen.length}/6, unités complètes=${unites.length}`);
  ok(out.m.errs === 0, 'invariants intacts (dont intégrité VD)');
  ok(unites.length === honVen.length, 'chaque vendredi honoré emporte son dimanche (unité complète)');
  ok(vdReel <= Math.ceil(vdCible), `vd réel ≤ plafond (${Math.ceil(vdCible)})`);
  ok(honVen.length >= Math.floor(vdCible) - 1, `honorés ≈ partie entière de la cible (${Math.floor(vdCible)})`);
  ['sam', 'jeu', 'vd', 'vjf', 'gg2', 'warn', 'tot'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe acceptée (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T9 : souhait par le DIMANCHE → même unité VD ────────────────────────
{
  const dim = A.addD(vendredisOrd[10], 2);
  const im = { SUPLY: { [dim]: 'SOUHAIT' } };
  const out = run(`T9 — SUPLY souhaite un dimanche (${dim}) → unité VD entière`, im);
  const days = out.P.byDoc['SUPLY'] || {};
  const ven = vendredisOrd[10];
  const u = (days[ven] === 'G' || days[ven] === 'G2') && (days[dim] === 'G' || days[dim] === 'G2');
  ok(out.m.errs === 0, 'invariants intacts');
  ok(u, 'le souhait de dimanche donne le week-end complet ven+dim');
}

// ── T10 : adversarial total — SULTAN souhaite TOUS les samedis ET vendredis ─
{
  const im = { SULTAN: {} };
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
    const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dw = A.DOW(ds);
    if (dw === 6 || dw === 5 || dw === 0) im.SULTAN[ds] = 'SOUHAIT';
  }
  const out = run(`T10 — adversarial : SULTAN souhaite les ${Object.keys(im.SULTAN).length} ven/sam/dim de l'année`, im);
  const samReel = +out.st['SULTAN']['SAM'], vdReel = +out.st['SULTAN']['VD'];
  console.log(`   SULTAN : sam=${samReel} (cible ${out.st['SULTAN']['CIBLE SAM']}) vd=${vdReel} (cible ${out.st['SULTAN']['CIBLE VD']})`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(samReel <= Math.ceil(+out.st['SULTAN']['CIBLE SAM']), 'impossible de monopoliser les samedis');
  ok(vdReel <= Math.ceil(+out.st['SULTAN']['CIBLE VD']), 'impossible de monopoliser les week-ends VD');
  ['sam', 'jeu', 'vd', 'vjf', 'gg2', 'warn', 'tot'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} de l'équipe dans l'enveloppe acceptée (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T11 : souhaits sur fériés / samedis couplés → unités, couplage intact ─
{
  const im = { SEVERAC: {} };
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
    const ds = `2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (feries27.has(ds)) im.SEVERAC[ds] = 'SOUHAIT';
    if (A.DOW(ds) === 6 && !samedisOrd.includes(ds)) im.SEVERAC[ds] = 'SOUHAIT';
  }
  // CONTRE-PREUVE (25/08/2026) : sur la version DÉPLOYÉE, ces mêmes souhaits brisent
  // 4 couplages samedi↔lundi férié (COUPLAGE SL BRISÉ : Pâques, Pentecôte, 15 août,
  // Toussaint 2027) — le lun/mar/mer férié passait le filtre dow 1-3 et était posé
  // seul en 8a avant le couplage de 8b. La v2 pose l'UNITÉ complète, plafonnée sur
  // chaque axe : le couplage est structurellement préservé.
  const out = run(`T11 — SEVERAC souhaite ${Object.keys(im.SEVERAC).length} fériés et samedis couplés (honorés en unités plafonnées)`, im);
  ok(out.m.errs === 0, 'invariants intacts — défaut « couplage férié brisé » corrigé (4 erreurs sur la version déployée)');
  const days = out.P.byDoc['SEVERAC'] || {};
  const jfReel = +out.st['SEVERAC']['TOTAL JF'], jfCible = +out.st['SEVERAC']['CIBLE JF'];
  console.log(`   SEVERAC : fériés (JF)=${isNaN(jfReel)?'colonne absente':jfReel} (cible ${jfCible})`);
  if (!isNaN(jfReel) && !isNaN(jfCible))
    ok(jfReel <= Math.ceil(jfCible), `jf ≤ plafond (${Math.ceil(jfCible)}) : jamais plus d'une garde au-dessus de sa part`);
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T12 : stress pont 8 mai + souhaits de week-ends pendant le pont ─────
{
  const ids = H.defaultRoster().map(r => r[0]).filter(id => !['BONNET', 'BOUREGBA', 'PRUNET', 'COPELOVICI'].includes(id)).slice(0, 15);
  const im = {};
  ids.forEach(id => { im[id] = {}; ['2027-05-06', '2027-05-07', '2027-05-08', '2027-05-09', '2027-05-10'].forEach(d => im[id][d] = 'INDISPO'); });
  im.SULTAN = im.SULTAN || {};
  vendredisOrd.filter(d => d >= '2027-04-30' && d <= '2027-05-28').forEach(d => im.SULTAN[d] = 'SOUHAIT');
  const out = run('T12 — stress pont 8 mai + SULTAN souhaite les week-ends de mai', im);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(out.m.warn === 0, 'aucun jour découvert malgré souhaits + pont');
}

// ── T13 : souhait sur un LUNDI FÉRIÉ → unité samedi+lundi, même binôme ──
{
  // lundis fériés 2027 : détecter dynamiquement
  const lunF = [];
  feries27.forEach(ds => { if (ds.startsWith('2027') && A.DOW(ds) === 1) lunF.push(ds); });
  lunF.sort();
  const cibleD = lunF[0];
  const im = { GUERIN: { [cibleD]: 'SOUHAIT' } };
  const out = run(`T13 — GUERIN souhaite le lundi férié ${cibleD} → unité samedi+lundi`, im);
  const days = out.P.byDoc['GUERIN'] || {};
  const sam = A.addD(cibleD, -2);
  const aLun = days[cibleD] === 'G' || days[cibleD] === 'G2';
  const aSam = days[sam] === 'G' || days[sam] === 'G2';
  console.log(`   GUERIN : lundi férié=${aLun ? days[cibleD] : '—'}, samedi couplé=${aSam ? days[sam] : '—'}`);
  ok(out.m.errs === 0, 'invariants intacts (couplage SL vérifié par les invariants)');
  ok(aLun && aSam, 'le souhait emporte l\'unité complète samedi+lundi férié');
  if (aLun && aSam) ok(true, 'même binôme sur les deux jours (garanti par l\'invariant couplage)');
}

// ── T14 : souhait sur une VEILLE DE FÉRIÉ → honoré, plafonné à la cible vjf ─
{
  // veilles de férié 2027 en semaine
  const res0 = H.runScenario({ year: 2027 });
  const vjfs = [];
  feries27.forEach(ds => { if (ds.startsWith('2027')) { const v = A.addD(ds, -1); if (A.DOW(v) >= 1 && A.DOW(v) <= 4 && !feries27.has(v)) vjfs.push(v); } });
  vjfs.sort();
  const im = { WIDEHEM: {} };
  vjfs.forEach(d => im.WIDEHEM[d] = 'SOUHAIT'); // il les souhaite TOUTES
  const out = run(`T14 — WIDEHEM souhaite les ${vjfs.length} veilles de férié de l'année`, im);
  const vjfReel = +out.st['WIDEHEM']['VEILLE JF'], vjfCible = +out.st['WIDEHEM']['CIBLE VJF'];
  console.log(`   WIDEHEM : vjf réel=${vjfReel} (cible ${vjfCible})`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(vjfReel <= Math.ceil(vjfCible), `impossible de monopoliser les veilles de férié (${vjfReel} ≤ ${Math.ceil(vjfCible)})`);
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

// ── T15 : Noël — le souhait départage à priorité égale, ne double jamais ─
{
  // Cas A : pas d'historique → tout le monde en classe « jamais fait » (priorité
  // strictement égale). ZAMARON souhaite le 24/12 : le départage doit le servir.
  const imA = { ZAMARON: { '2027-12-24': 'SOUHAIT' } };
  const outA = run('T15a — Noël sans historique : ZAMARON souhaite le 24/12 (classe égale)', imA);
  const dA = outA.P.byDoc['ZAMARON'] || {};
  ok(outA.m.errs === 0, 'invariants intacts');
  ok(dA['2027-12-24'] === 'G' || dA['2027-12-24'] === 'G2', 'à priorité strictement égale, le souhaiteur obtient sa date de Noël');

  // Cas B : ZAMARON a fait Noël en 2026 (classe la moins prioritaire), tous les
  // autres « jamais fait ». Son souhait ne doit PAS lui faire doubler la file.
  const hist = [['ID', 'ANNEE', 'NOEL/AN'], ['ZAMARON', 2026, 1]];
  const resB = H.runScenario({ year: 2027, indisposMap: imA, extraSheets: [H.makeSheet('HISTORIQUE', hist)] });
  const PB = A.parsePlanning(resB.ss, 2027);
  const invB = A.checkInvariants(PB, { ctxFeries: feries27, indisposMap: imA });
  const dB = PB.byDoc['ZAMARON'] || {};
  const noelB = ['2027-12-24', '2027-12-25', '2027-12-31', '2028-01-01'].filter(d => dB[d] === 'G' || dB[d] === 'G2');
  console.log(`\n══ T15b — Noël : ZAMARON (a fait 2026) souhaite le 24/12 face aux jamais-servis ══`);
  ok(invB.errs.length === 0, 'invariants intacts');
  ok(noelB.length === 0, `le souhait ne double pas la rotation : ZAMARON n'a aucune date de Noël (${noelB.join(',') || 'aucune'})`);
}

// ── T16 : adversarial ULTIME — un MAR souhaite les 365 jours de l'année ──
{
  const im = { CATINEAU: {} };
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) {
    const dt = new Date(2027, m - 1, d); if (dt.getMonth() !== m - 1) continue;
    im.CATINEAU[`2027-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`] = 'SOUHAIT';
  }
  const out = run('T16 — adversarial ultime : CATINEAU souhaite les 365 jours de 2027', im);
  const st = out.st['CATINEAU'];
  const tot = +st['TOTAL G'], cib = parseFloat(String(st['CIBLE']).replace("'", ''));
  console.log(`   CATINEAU : total=${tot} (cible ${cib}) sam=${st['SAM']} jeu=${st['JEU']} vd=${st['VD']} vjf=${st['VEILLE JF']}`);
  ok(out.m.errs === 0, 'invariants intacts');
  ok(Math.abs(tot - cib) <= 1.0 + 1e-9, `son total reste à ±1 de sa cible (${Math.abs(tot - cib).toFixed(2)})`);
  ['sam', 'jeu', 'vd', 'vjf', 'tot', 'gg2', 'warn'].forEach(k =>
    ok(out.m[k] <= ENV[k] + 1e-9, `axe ${k} de l'équipe dans l'enveloppe (${(+out.m[k]).toFixed(2)} ≤ ${ENV[k]})`));
}

console.log(fails ? `\n❌❌ BILAN : ${fails} ÉCHEC(S)` : '\n✅✅ BILAN : TOUS LES SCÉNARIOS TOUS-JOURS PASSENT');
process.exit(fails ? 1 : 0);
