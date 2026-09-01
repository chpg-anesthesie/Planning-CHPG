/* ═══ BANC — STAFF VACANCES : VIVIER DES WEEK-ENDS ET PONTS ═════════════════
   (lots D et E, 01/09/2026)

   LOT D — les colonnes samedi et dimanche affichent enfin quelque chose.
   Elles n'avaient NI compteur NI couleur : la grille les grisait, et le comité
   posait à l'aveugle les seuls jours où deux gardes doivent être assurées avec
   un effectif réduit. Mesuré sur les vacances 2027 déjà saisies : le week-end
   des 10-11 juillet portait 19 MAR en congés pour un seuil de période de 10,
   invisible. Ce qui s'affiche désormais n'est pas le nombre d'absents (un seuil
   de période ne veut rien dire un samedi) mais le nombre de GARDEURS encore
   disponibles, face au minimum de 4 posé par Arthur — deux le samedi, deux le
   dimanche.

   LOT E — l'onglet « Ponts ». Un pont est le jour ouvré coincé entre un férié
   et le week-end : très rentable (un jour posé en rapporte quatre), c'était un
   libre-service. Il s'attribue désormais au staff, avant la génération.

   Les fonctions sont EXTRAITES de staff.html, jamais recopiées. */
const fs = require('fs'), vm = require('vm'), path = require('path');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 190) : '')); } };

const PAGE = path.join(__dirname, '..', 'staff.html');
const src = fs.readFileSync(PAGE, 'utf8');
function extraire(nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error(nom + ' introuvable dans staff.html');
  let prof = 0, j = src.indexOf('{', i);
  for (; j < src.length; j++) { if (src[j] === '{') prof++; else if (src[j] === '}') { prof--; if (!prof) break; } }
  return src.slice(i, j + 1);
}
function extraireConst(nom) {
  /* La déclaration est suivie d'un commentaire de fin de ligne dans la page :
     on s'arrête au premier point-virgule, pas à la fin de la ligne. */
  let i = src.indexOf('const ' + nom + ' =');
  if (i < 0) i = src.indexOf('const ' + nom + '=');
  if (i < 0) throw new Error('const ' + nom + ' introuvable');
  const j = src.indexOf(';', i);
  return src.slice(i, j + 1);
}

/* Contexte minimal : les DONNÉES sont fabriquées ici, le CODE vient de la page. */
function monde(medecins, saisies, feries) {
  const ctx = vm.createContext({ Date, Set, String, Object, Number, Math, Array, console, RegExp });
  ctx.globalThis = ctx;
  ctx.medecins = medecins;
  ctx.saisies = saisies || {};
  ctx.joursFeries = new Set(feries || []);
  ctx.currentYear = 2027;
  vm.runInContext(extraireConst('VIVIER_MINI'), ctx);
  vm.runInContext(extraireConst('VIVIER_CONFORT'), ctx);
  vm.runInContext(extraireConst('ANCRE_2SUR2'), ctx);
  vm.runInContext(extraireConst('JOURS_CODE'), ctx);
  vm.runInContext(extraire('isWeekend'), ctx);
  vm.runInContext(extraire('semaineOff2sur2'), ctx);
  vm.runInContext(extraire('gardeurDispo'), ctx);
  vm.runInContext(extraire('vivierGarde'), ctx);
  vm.runInContext(extraire('vivierClasse'), ctx);
  vm.runInContext(extraire('detecterPonts'), ctx);
  return ctx;
}
const M = (id, extra) => Object.assign({ id, initiales: id.slice(0, 2), actif: true,
  quotite: 100, pctGardes: 100, noGarde: false, noWeekend: false, rythme2sur2: false,
  souhaitPlafond: false, tpJoursFixes: '', dateDebut: '', dateFin: '' }, extra || {});

/* ═══ 1. Qui compte dans le vivier de garde ? ═══════════════════════════ */
console.log('\n═══ 1. Le compte ne retient que ceux qui peuvent réellement prendre la garde ═══');
{
  const SAM = '2027-07-10', LUN = '2027-07-12';
  const tous = [M('A'), M('B'), M('C'), M('D')];
  V('quatre médecins disponibles un samedi → vivier de 4',
    monde(tous, {}).vivierGarde(SAM) === 4);
  V('celui qui ne prend jamais de garde ne compte pas',
    monde([M('A'), M('B'), M('C'), M('NOG', { noGarde: true })], {}).vivierGarde(SAM) === 3);
  V('celui qui ne fait jamais de week-end ne compte pas un samedi',
    monde([M('A'), M('B'), M('WE', { noWeekend: true })], {}).vivierGarde(SAM) === 2);
  V('…mais il compte bien un lundi',
    monde([M('A'), M('B'), M('WE', { noWeekend: true })], {}).vivierGarde(LUN) === 3);
  V('le régime à part (souhaits plafonnés) ne compte pas un week-end',
    monde([M('A'), M('B'), M('P', { souhaitPlafond: true })], {}).vivierGarde(SAM) === 2);
  V('une part de gardes nulle ne compte pas',
    monde([M('A'), M('B'), M('Z', { pctGardes: 0 })], {}).vivierGarde(SAM) === 2);
  V('un médecin parti avant la date ne compte pas',
    monde([M('A'), M('B'), M('X', { dateFin: '2027-01-01' })], {}).vivierGarde(SAM) === 2);
  V('un médecin pas encore arrivé ne compte pas',
    monde([M('A'), M('B'), M('X', { dateDebut: '2027-12-01' })], {}).vivierGarde(SAM) === 2);
  V('des vacances retirent du vivier',
    monde(tous, { A: { [SAM]: 'VAC' } }).vivierGarde(SAM) === 3);
  V('une formation aussi',
    monde(tous, { A: { [SAM]: 'FORM' } }).vivierGarde(SAM) === 3);
  V('un jour de la semaine jamais travaillé retire du vivier ce jour-là',
    monde([M('A'), M('B'), M('F', { tpJoursFixes: 'LUN' })], {}).vivierGarde(LUN) === 2);
  V('…et ne change rien les autres jours',
    monde([M('A'), M('B'), M('F', { tpJoursFixes: 'LUN' })], {}).vivierGarde('2027-07-13') === 3);
  /* Le rythme deux semaines sur deux : une semaine sur deux compte, l'autre non.
     On n'affirme pas LAQUELLE — l'ancre est celle du générateur — mais les deux
     cas doivent exister, sinon le calcul est inerte. */
  const c = monde([M('R', { rythme2sur2: true })], {});
  const semaines = [];
  for (let d = new Date(2027, 0, 4); d < new Date(2027, 2, 1); d.setDate(d.getDate() + 7)) {
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    semaines.push(c.vivierGarde(s));
  }
  V('le rythme deux semaines sur deux alterne réellement',
    semaines.includes(0) && semaines.includes(1), semaines);
}

/* ═══ 2. Les seuils ═════════════════════════════════════════════════════ */
console.log('\n═══ 2. Les trois bandes : moins de 4 impossible · 4-5 sans marge · 6+ confortable ═══');
{
  const c = monde([M('A')], {});
  V('0 disponible → rouge', c.vivierClasse(0) === 'hot');
  V('3 disponibles → rouge (il en faut 4)', c.vivierClasse(3) === 'hot');
  V('4 disponibles → orange, le strict minimum', c.vivierClasse(4) === 'warn');
  V('5 disponibles → orange', c.vivierClasse(5) === 'warn');
  V('6 disponibles → vert', c.vivierClasse(6) === 'ok');
  V('20 disponibles → vert', c.vivierClasse(20) === 'ok');
  /* Une `const` déclarée dans un contexte n'en est pas une propriété : on
     l'évalue DANS le contexte plutôt que de la lire à côté. */
  const val = n => vm.runInContext(n, c);
  V('le minimum retenu est bien 4 (deux binômes distincts)', val('VIVIER_MINI') === 4);
  V('le confort commence à 6', val('VIVIER_CONFORT') === 6);
}

/* ═══ 3. La page affiche vraiment ce chiffre les week-ends ══════════════ */
console.log('\n═══ 3. staff.html · le week-end n\'est plus une colonne muette ═══');
{
  V('le compteur des week-ends est calculé dans l\'en-tête',
    src.includes('const viv=we?vivierGarde(date):null'));
  V('la couleur de tension s\'applique désormais AUSSI aux week-ends',
    src.includes("const ten=isFormMode?'':(' tension-'+(we?vivierClasse(viv):tension(date,seuil)))"));
  V('l\'ancienne exclusion des week-ends a disparu',
    !src.includes("const ten=we||isFormMode?''"));
  V('le chiffre est affiché dans la colonne du week-end',
    src.includes("gt-th-day-count gt-viv"));
  V('une infobulle explique ce que le chiffre veut dire',
    /médecin\(s\) encore disponible\(s\) pour la garde/.test(src));
  V('la légende dit qu\'il en faut 4',
    /le chiffre est le nombre de médecins encore disponibles[\s\S]{0,200}<strong>4<\/strong>/.test(src));
}

/* ═══ 4. La détection des ponts ═════════════════════════════════════════ */
console.log('\n═══ 4. Un pont, c\'est le jour ouvré coincé entre un férié et le week-end ═══');
{
  /* Fériés monégasques 2027 (calculés par getJoursFeries, servis par la copie
     rapide) : l'Ascension le jeudi 6 mai, la Fête-Dieu le jeudi 27 mai. */
  const F2027 = ['2027-01-01', '2027-01-27', '2027-03-29', '2027-05-01', '2027-05-06',
                 '2027-05-17', '2027-05-27', '2027-08-16', '2027-11-01', '2027-11-19',
                 '2027-12-08', '2027-12-25'];
  const c = monde([M('A')], {}, F2027);
  const ponts = c.detecterPonts(2027);
  V('2027 compte exactement deux ponts', ponts.length === 2, ponts);
  V('le vendredi 7 mai (après l\'Ascension) en est un',
    ponts.some(p => p.date === '2027-05-07'), ponts);
  V('le vendredi 28 mai (après la Fête-Dieu) aussi',
    ponts.some(p => p.date === '2027-05-28'), ponts);
  V('ils sont rendus dans l\'ordre du calendrier',
    ponts[0].date < ponts[1].date);
  V('chaque pont dit de quel férié il vient', ponts.every(p => F2027.includes(p.ferie)));

  /* Un lundi coincé avant un mardi férié est un pont aussi. 2028 : le 15 août
     tombe un mardi, le lundi 14 est donc un pont. */
  const F2028 = ['2028-01-27', '2028-05-25', '2028-06-15', '2028-08-15'];
  const p28 = monde([M('A')], {}, F2028).detecterPonts(2028);
  V('un lundi avant un mardi férié est reconnu comme pont',
    p28.some(p => p.date === '2028-08-14'), p28);
  V('un jeudi férié donne le vendredi qui suit',
    p28.some(p => p.date === '2028-01-28') && p28.some(p => p.date === '2028-05-26'), p28);

  /* Rien ne doit être inventé quand un férié encadre déjà le week-end. */
  V('un férié le vendredi ne crée pas de pont',
    monde([M('A')], {}, ['2027-11-19']).detecterPonts(2027).length === 0);
  V('un férié le mercredi ne crée pas de pont',
    monde([M('A')], {}, ['2027-12-08']).detecterPonts(2027).length === 0);
  V('deux fériés qui se suivent (jeudi + vendredi) ne créent pas de pont',
    monde([M('A')], {}, ['2027-05-06', '2027-05-07']).detecterPonts(2027).length === 0);
  V('sans jours fériés connus, aucun pont n\'est deviné',
    monde([M('A')], {}, []).detecterPonts(2027).length === 0);
  V('les fériés d\'une AUTRE année ne comptent pas',
    monde([M('A')], {}, ['2028-01-27']).detecterPonts(2027).length === 0);
}

/* ═══ 5. L'écran des ponts ══════════════════════════════════════════════ */
console.log('\n═══ 5. staff.html · ce que l\'écran des ponts met sous les yeux ═══');
{
  V('un onglet « Ponts » existe à côté de VAC, FORM et VAC année',
    src.includes('id="btnPONTS"') && src.includes("setType('PONTS')"));
  V('un pont est posé comme une vacance (il consomme le quota)',
    /pontsMode=\(t==='PONTS'\);[\s\S]{0,120}currentType=\(t==='FORM'\)\?'FORM':'VAC'/.test(src));
  V('l\'écran compte les ponts obtenus par chaque MAR',
    src.includes("const compte=m=>ponts.filter(p=>(saisies[m.id]||{})[p.date]==='VAC').length"));
  V('il nomme ceux qui n\'ont AUCUN pont cette année',
    src.includes('Aucun pont cette année pour'));
  V('il félicite quand tout le monde en a un',
    src.includes('Tous les médecins ont au moins un pont cette année'));
  V('il rappelle le vivier de garde de chaque pont (un vendredi est un demi-week-end)',
    /renderPonts[\s\S]{0,2200}vivierGarde\(p\.date\)/.test(src));
  V('il dit que le pont compte dans le quota de vacances',
    /compte dans le quota de vacances/.test(src));
  V('le mode ponts court-circuite la grille et le récap',
    src.includes('if(pontsMode){ renderPonts(); return; }'));
  V('les onglets de période sont neutralisés en mode ponts',
    /function buildPeriodeTabs[\s\S]{0,400}if\(pontsMode\)\{/.test(src));
  V('l\'écran se met en sommeil si les fériés manquent, au lieu de deviner',
    src.includes('Les jours fériés ne sont pas encore disponibles'));
}

/* ═══ 6. Les jours fériés viennent de la source unique ══════════════════ */
console.log('\n═══ 6. Aucune règle de calendrier n\'est recopiée dans la page ═══');
{
  V('les fériés sont lus dans la copie rapide (clé joursferies_{année})',
    src.includes("miroirRead(['joursferies_'+currentYear]"));
  V('la page ne recalcule JAMAIS la date de Pâques elle-même',
    !/paques|Paques|Pâques/.test(src));
  V('un échec de lecture laisse simplement l\'ensemble vide',
    /joursferies_[\s\S]{0,400}catch\(e\)\{\}/.test(src));
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
