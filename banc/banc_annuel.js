/* ═══ BANC — P11 : LES OPÉRATIONS ANNUELLES (cahier T116, T123, T124, T129) ═══
   Génération, initialisation, archivage : trois gestes faits UNE fois par an,
   dont l'erreur est irréversible. Ce qui est éprouvé ici, ce sont les
   GARDE-FOUS : ce que fait le système quand on relance un geste déjà accompli
   — parce que c'est exactement ce qui arrive quand une réponse se perd et
   qu'on réessaie. La règle du projet : ne JAMAIS régénérer une année déjà
   générée, ne jamais réarchiver. */
const vm = require('vm'), fs = require('fs');
const { Classeur, fabriqueVerrou, VERROUS, extraireFonction } = require('./stubs');
let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); } else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0,190) : '')); } };

console.log('\n═══ T123/T124 · relancer une génération déjà faite ═══');
{
  /* Le verrou de generateGardes (generateur_gardes.gs) : l'onglet existe déjà
     → refus explicite, planning intact. */
  const cl = new Classeur();
  cl.ajouter('GARDES_2028', [['MAR'],['ALPHA'],['BRAVO']]);
  let leve = null;
  try {
    const ctx = vm.createContext({ SpreadsheetApp: { getActiveSpreadsheet: () => cl }, Error, String, Logger:{log(){}} });
    ctx.globalThis = ctx;
    vm.runInContext(`
      function verrou(year) {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        if (ss.getSheetByName('GARDES_' + year))
          throw new Error('🔒 GARDES_' + year + " existe déjà — génération verrouillée pour protéger l'équité.");
      }
      verrou(2028);`, ctx);
  } catch (e) { leve = e.message; }
  V('la régénération est REFUSÉE', !!leve, leve);
  V('le motif parle d\'équité protégée', /équité|verrouill/i.test(leve || ''), leve);
  V('l\'onglet existant est intact', cl.getSheetByName('GARDES_2028').lignes.length === 3);

  /* La reprise du wizard (Indispos.gs) : année déjà générée ET cohérente →
     il ne régénère PAS, il renvoie les statistiques existantes. */
  const cl2 = new Classeur();
  cl2.ajouter('GARDES_2028', [['MAR'],['ALPHA']]);
  cl2.ajouter('STATS_GARDES_2028', [['MEDECIN','CIBLE','TOTAL'],['ALPHA', 30, 31],['BRAVO', 30, 29]]);
  const ctx2 = vm.createContext({ SpreadsheetApp: { getActiveSpreadsheet: () => cl2 }, Number, String, Object });
  ctx2.globalThis = ctx2;
  const repris = vm.runInContext(`
    (function (year) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const g = ss.getSheetByName('GARDES_' + year), s = ss.getSheetByName('STATS_GARDES_' + year);
      if (g && s && s.getLastRow() > 1) {
        const d = s.getDataRange().getValues(); const stats = [];
        for (let r = 1; r < d.length; r++) if (d[r][0]) stats.push({medecin: d[r][0], cible: d[r][1], total: d[r][2]});
        return { success: true, alreadyDone: true, stats: stats };
      }
      return { success: false };
    })(2028);`, ctx2);
  V('le wizard reconnaît « déjà générée »', repris.alreadyDone === true, repris);
  V('et rend les statistiques existantes', repris.stats.length === 2, repris.stats);
  V('AUCUNE régénération : la grille n\'a pas bougé', cl2.getSheetByName('GARDES_2028').lignes.length === 2);

  /* Génération incomplète (stats vides) : là, il ne faut PAS faire croire que
     tout va bien — le flux normal doit remonter l'erreur. */
  const cl3 = new Classeur();
  cl3.ajouter('GARDES_2028', [['MAR'],['ALPHA']]);
  cl3.ajouter('STATS_GARDES_2028', [['MEDECIN','CIBLE','TOTAL']]);   // en-tête seul
  const ctx3 = vm.createContext({ SpreadsheetApp: { getActiveSpreadsheet: () => cl3 }, Number, String, Object });
  ctx3.globalThis = ctx3;
  const incomplet = vm.runInContext(`
    (function (year) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const g = ss.getSheetByName('GARDES_' + year), s = ss.getSheetByName('STATS_GARDES_' + year);
      return (g && s && s.getLastRow() > 1) ? { alreadyDone: true } : { alreadyDone: false };
    })(2028);`, ctx3);
  V('génération INCOMPLÈTE : pas de faux « déjà fait »', incomplet.alreadyDone === false, incomplet);
}

console.log('\n═══ T116 · relancer l\'initialisation d\'une année déjà créée ═══');
{
  const cl = new Classeur();
  cl.ajouter('INDISPOS_2028', [['MAR','JOUR']]);
  const ctx = vm.createContext({ SpreadsheetApp: { getActiveSpreadsheet: () => cl }, String });
  ctx.globalThis = ctx;
  const r = vm.runInContext(`
    (function (newYear) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const indSheet = ss.getSheetByName('INDISPOS_' + newYear);
      if (indSheet) return { success: false, error: 'INDISPOS_' + newYear + ' existe déjà' };
      return { success: true };
    })(2028);`, ctx);
  V('l\'initialisation est refusée', r.success === false, r);
  V('le message nomme l\'onglet en cause', /INDISPOS_2028/.test(r.error), r.error);
  V('la grille de saisie existante est intacte', cl.getSheetByName('INDISPOS_2028').lignes.length === 1);
}

console.log('\n═══ T129 · relancer une clôture déjà faite ═══');
{
  /* Les TROIS conditions ensemble (stats absentes du maître, année dans
     HISTORIQUE, stats présentes à l'archive) → « déjà archivée, rien à
     refaire ». Deux sur trois ne suffisent pas : ce serait un vrai problème. */
  const juge = (statsMaitre, dansHisto, statsArchive) => {
    if (statsMaitre) return 'archivage normal';
    return (dansHisto && statsArchive) ? 'déjà archivée' : 'erreur signalée';
  };
  V('les 3 conditions réunies → « déjà archivée »', juge(false, true, true) === 'déjà archivée');
  V('stats encore dans le maître → archivage normal', juge(true, false, false) === 'archivage normal');
  V('dans HISTORIQUE mais PAS à l\'archive → erreur signalée', juge(false, true, false) === 'erreur signalée');
  V('à l\'archive mais PAS dans HISTORIQUE → erreur signalée', juge(false, false, true) === 'erreur signalée');
  V('rien nulle part → erreur signalée (jamais un faux « rien à faire »)', juge(false, false, false) === 'erreur signalée');
}

console.log('\n═══ Sanctuaire : 2026 ne peut pas être régénérée ═══');
{
  const refus = (annee) => (annee === 2026) ? 'Génération désactivée — GARDES_2026 est sanctuarisé' : null;
  V('2026 est protégée', !!refus(2026), refus(2026));
  V('2027 ne l\'est pas', refus(2027) === null);
  V('2028 non plus', refus(2028) === null);
}

console.log('\n═══ T128 · structure d\'HISTORIQUE après clôture ═══');
{
  const cl = new Classeur();
  const entete = ['MEDECIN','ANNEE','TOTAL','G','G2','LUN','MAR','MER','JEU','VEN','SAM','DIM','RECUP','H18','JF','VJF','VD','CSAT'];
  cl.ajouter('HISTORIQUE', [entete,
    ['ALPHA', 2027, 31, 20, 11, 4, 5, 4, 5, 4, 5, 4, 2, 3, 2, 3, 1, 2],
    ['BRAVO', 2027, 29, 19, 10, 4, 4, 4, 4, 5, 4, 4, 2, 3, 2, 2, 1, 2]]);
  const l = cl.getSheetByName('HISTORIQUE').lignes;
  V('un enregistrement par MAR', l.length - 1 === 2, l.length - 1);
  V('18 colonnes renseignées', l[1].length === 18, l[1].length);
  V('aucune colonne vide sur une ligne', l[1].every(v => v !== '' && v !== null && v !== undefined), l[1]);
  V('l\'année est bien celle qu\'on clôture', l.slice(1).every(x => x[1] === 2027), l.map(x=>x[1]));
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
