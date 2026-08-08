// ══════════════════════════════════════════════════════════════════════
//  VEILLE — DRY RUN (MESURE SEULE)
//  ⚠️ FICHIER TEMPORAIRE — À SUPPRIMER une fois les réglages arrêtés.
//
//  N’ÉCRIT RIEN, NULLE PART : ni onglet VEILLE, ni VEILLE_CFG, ni Drive.
//  VEILLE_CFG est relu à la main (getOrCreateVeilleTabs, elle, écrirait).
//  Interroge seulement PubMed et affiche des volumes dans le journal
//  d'exécution (Apps Script → Exécutions → voir le log).
//
//  4 fonctions à lancer à la main, dans cet ordre :
//   1. veilleDryRun()         → compare config ACTUELLE vs PROPOSÉE (30 et 90 j)
//   2. veilleDryRunRevues()   → volume revue par revue (90 j) → pour élaguer
//   3. veilleDryRunThemes()   → volume thème par thème (90 j) → pour élaguer
//   4. veilleDryRunApercu()   → 25 titres au hasard de la config proposée
//
//  Détail technique : les requêtes passent en POST (la liste de 46 revues
//  dépasse la longueur sûre d'une URL en GET → troncature silencieuse).
//  La fenêtre est calculée sur `edat` (date d'entrée dans PubMed), comme
//  la veille en production — et non sur la date de parution du numéro,
//  qui peut être dans le futur (d'où les « 05/11/2026 » vus à l'écran).
// ══════════════════════════════════════════════════════════════════════

// ── Univers de revues PROPOSÉ ───────────────────────────────────────────
// DIRECT = tout ce que la revue publie (dans les types retenus) remonte.
// Retirées le 08/08/2026 : BJA Educ (revue de formation, 4,7/mois),
// J Cardiothorac Vasc Anesth (9,3/mois, pas de chir cardiaque au CHPG),
// Acad Emerg Med (2,7/mois, hors périmètre).
const DRY_REVUES_DIRECT = [
  // Anesthésie (15)
  'Anesthesiology', 'Br J Anaesth', 'Anaesthesia', 'Anesth Analg', 'Eur J Anaesthesiol',
  'Anaesth Crit Care Pain Med', 'Can J Anaesth', 'Acta Anaesthesiol Scand', 'J Clin Anesth',
  'Reg Anesth Pain Med', 'Minerva Anestesiol', 'Paediatr Anaesth',
  'Int J Obstet Anesth',
  // Réanimation (11)
  'Intensive Care Med', 'Crit Care Med', 'Crit Care', 'Ann Intensive Care',
  'Am J Respir Crit Care Med', 'J Crit Care', 'Shock', 'Crit Care Explor',
  'Thorax',
  // Urgences / arrêt cardiaque (3)
  'Resuscitation', 'Ann Emerg Med',
  // Périopératoire (1)
  'Perioper Med',
];

// THEMED = la revue ne remonte QUE si l'article touche un de tes thèmes.
const DRY_REVUES_THEMED = [
  // Généralistes (7)
  'N Engl J Med', 'JAMA', 'Lancet', 'BMJ', 'Ann Intern Med', 'JAMA Intern Med', 'Nat Med',
  // Chirurgie (3)
  'Ann Surg', 'JAMA Surg', 'Br J Surg',
  // Transversales (6)
  'Pain', 'Transfusion', 'J Thromb Haemost', 'Circulation', 'Eur Heart J', 'Clin Infect Dis',
  // Pneumo / réa respiratoire — basculées du direct au croisé le 08/08/2026
  // (périmètre trop large : mucoviscidose, bronchiectasies, HTAP)
  'Chest', 'Lancet Respir Med',
];

// ── Thèmes PROPOSÉS (identiques à l'actuel, sauf « Voies aériennes ») ────
const DRY_THEMES = [
  { cle: 'Sepsis',                   val: '"sepsis"[MeSH Terms] OR "shock, septic"[MeSH Terms]' },
  { cle: 'Voies aériennes',          val: '"intubation, intratracheal"[MeSH Terms] OR "airway extubation"[MeSH Terms] OR "laryngeal masks"[MeSH Terms] OR "difficult airway"[Title/Abstract] OR "videolaryngoscopy"[Title/Abstract] OR "preoxygenation"[Title/Abstract]' },
  { cle: 'SDRA / ventilation',       val: '"respiratory distress syndrome"[MeSH Terms] OR "respiration, artificial"[MeSH Terms]' },
  { cle: 'Délire post-op',           val: '"delirium"[MeSH Terms] AND "postoperative"[All Fields]' },
  { cle: 'Monitorage hémodynamique', val: '"hemodynamic monitoring"[MeSH Terms] OR "vasoconstrictor agents"[MeSH Terms]' },
  { cle: 'Anesthésie locorégionale', val: '"anesthesia, conduction"[MeSH Terms]' },
  { cle: 'Hémorragie / transfusion', val: '"blood transfusion"[MeSH Terms] OR "hemorrhage"[MeSH Terms]' },
  { cle: 'Arrêt cardiaque',          val: '"heart arrest"[MeSH Terms] OR "cardiopulmonary resuscitation"[MeSH Terms]' },
];

// ── Types d'article retenus (Review REMIS À O : dans un univers fermé,
//    la mise au point redevient le meilleur format) ───────────────────────
const DRY_PUBTYPES = [
  'Randomized Controlled Trial', 'Meta-Analysis', 'Systematic Review',
  'Practice Guideline', 'Guideline', 'Review',
];

// ── Exclusions dures (protocoles d'essai, éditos, lettres, cas, rétractations)
const DRY_EXCLUSIONS =
  '"comment"[Publication Type] OR "editorial"[Publication Type] OR "letter"[Publication Type] ' +
  'OR "case reports"[Publication Type] OR "retracted publication"[Publication Type] ' +
  'OR "preprint"[Publication Type] OR "study protocol"[Title] OR "protocol for a"[Title] ' +
  'OR "trial protocol"[Title] OR "rationale and design"[Title]';

const DRY_LANGS  = ['eng', 'fre'];
const DRY_HUMANS = 'souple';   // mode retenu pour les mesures de detail
const DRY_SLEEP  = 400;   // ms entre deux appels PubMed (politesse NCBI)

// ══════════════════════════════════════════════════════════════════════
//  Briques bas niveau
// ══════════════════════════════════════════════════════════════════════

function _drPost(endpoint, params) {
  const payload = params + '&tool=' + EUTILS_TOOL + '&email=' + encodeURIComponent(EUTILS_EMAIL);
  const res = UrlFetchApp.fetch(EUTILS_BASE + endpoint, {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) throw new Error('PubMed ' + endpoint + ' HTTP ' + res.getResponseCode());
  return JSON.parse(res.getContentText());
}

// Nombre total de résultats, sans rapatrier les identifiants (rapide).
function _drCount(term, jours) {
  if (!term) return 0;
  const j = _drPost('esearch.fcgi',
    'db=pubmed&retmode=json&retmax=0&datetype=edat&reldate=' + encodeURIComponent(jours) +
    '&term=' + encodeURIComponent(term));
  Utilities.sleep(DRY_SLEEP);
  return parseInt((j && j.esearchresult && j.esearchresult.count) || '0', 10);
}

// Identifiants (jusqu'à 2000) — nécessaire pour dédoublonner entre axes.
function _drIds(term, jours) {
  if (!term) return [];
  const j = _drPost('esearch.fcgi',
    'db=pubmed&retmode=json&retmax=2000&datetype=edat&reldate=' + encodeURIComponent(jours) +
    '&term=' + encodeURIComponent(term));
  Utilities.sleep(DRY_SLEEP);
  const r = (j && j.esearchresult) || {};
  const ids = r.idlist || [];
  const total = parseInt(r.count || '0', 10);
  if (total > ids.length) Logger.log('   ⚠️ tronqué : ' + total + ' résultats, ' + ids.length + ' rapatriés');
  return ids;
}

function _drOrJournals(list) { return list.map(function (j) { return '"' + j + '"[Journal]'; }).join(' OR '); }
function _drOrThemes(list)   { return list.map(function (t) { return '(' + t + ')'; }).join(' OR '); }

// Filtre commun.
//  humansMode : false      → aucun filtre espece
//               'strict'   → "humans"[MeSH] EXIGE  (= config actuelle)
//               'souple'   → rejette seulement l'animal PUR
//  Pourquoi ce choix : "humans"[MeSH] n'est attribue qu'a l'indexation
//  MEDLINE, plusieurs semaines apres la parution. L'exiger revient a
//  rejeter 100 % des articles du mois en cours (mesure du 03/08/2026 :
//  0 article sur 14 dans les 6 grandes revues). La forme souple laisse
//  passer le non-encore-indexe et n'ecarte que l'animal avere.
function _drFiltre(pubtypes, humansMode, langs, excl) {
  const parts = [];
  if (pubtypes.length) parts.push('(' + pubtypes.map(function (p) { return '"' + p + '"[Publication Type]'; }).join(' OR ') + ')');
  if (humansMode === 'strict') parts.push('"humans"[MeSH Terms]');
  if (langs.length) parts.push('(' + langs.map(function (l) { return l + '[la]'; }).join(' OR ') + ')');
  let s = parts.join(' AND ');
  const nots = [];
  if (humansMode === 'souple') nots.push('"animals"[MeSH Terms] NOT "humans"[MeSH Terms]');
  if (excl) nots.push(DRY_EXCLUSIONS);
  nots.forEach(function (n) { s += (s ? ' NOT (' : 'NOT (') + n + ')'; });
  return s;
}

function _drAvec(base, filtre) { return filtre ? '(' + base + ') AND ' + filtre : base; }

function _drPad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + Array(n - s.length + 1).join(' '); }
function _drPadL(s, n) { s = String(s); return s.length >= n ? s : Array(n - s.length + 1).join(' ') + s; }

// ══════════════════════════════════════════════════════════════════════
//  1. COMPARATIF : config actuelle vs config proposée
// ══════════════════════════════════════════════════════════════════════

// Lecture STRICTEMENT passive de VEILLE_CFG.
// On n'appelle PAS _readVeilleCfg() : elle passe par getOrCreateVeilleTabs(),
// qui CRÉE les onglets manquants et RÉ-AJOUTE les lignes de config par défaut
// supprimées. Ici on veut zéro écriture, donc on relit l'onglet à la main.
function _drCfgActuelle() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VEILLE_CFG_TAB);
  if (!sh) return null;
  const data = sh.getDataRange().getValues();
  const cfg = { revues: [], general: [], themes: [], themesFull: [], pubtypes: [], params: {} };
  for (let r = 1; r < data.length; r++) {
    const type   = String(data[r][0] || '').trim().toUpperCase();
    const cle    = String(data[r][1] || '').trim();
    const valeur = String(data[r][2] || '').trim();
    const actif  = String(data[r][3] || '').trim().toUpperCase() !== 'N';
    if (!type) continue;
    if (type === 'PARAM') { cfg.params[cle.toUpperCase()] = valeur; continue; }
    if (!actif || !valeur) continue;
    if (type === 'REVUE')   cfg.revues.push(valeur);
    if (type === 'GENERAL') cfg.general.push(valeur);
    if (type === 'THEME')   { cfg.themes.push(valeur); cfg.themesFull.push({ cle: cle, valeur: valeur }); }
    if (type === 'PUBTYPE') cfg.pubtypes.push(valeur);
  }
  return cfg;
}

// Reconstitue les axes de la config ACTUELLE (lue dans VEILLE_CFG).
function _drAxesActuels(jours) {
  const cfg = _drCfgActuelle();
  if (!cfg) { Logger.log('⚠️ Onglet VEILLE_CFG introuvable — comparatif impossible.'); return null; }
  const filtre = _drFiltre(cfg.pubtypes, String(cfg.params.HUMANS || 'O').toUpperCase() === 'O' ? 'strict' : false,
    String(cfg.params.LANGS || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean), false);
  const union = {}, parAxe = { revues: 0, general: 0, themes: 0 };

  if (cfg.revues.length) {
    const ids = _drIds(_drAvec(_drOrJournals(cfg.revues), filtre), jours);
    parAxe.revues = ids.length;
    ids.forEach(function (i) { union[i] = 1; });
  }
  if (cfg.general.length && cfg.themes.length) {
    const ids = _drIds(_drAvec('(' + _drOrJournals(cfg.general) + ') AND (' + _drOrThemes(cfg.themes) + ')', filtre), jours);
    parAxe.general = ids.length;
    ids.forEach(function (i) { union[i] = 1; });
  }
  cfg.themesFull.forEach(function (th) {
    const ids = _drIds(_drAvec(th.valeur, filtre), jours);
    parAxe.themes += ids.length;
    ids.forEach(function (i) { union[i] = 1; });
  });
  return { total: Object.keys(union).length, parAxe: parAxe };
}

// Axes de la config PROPOSÉE.
function _drAxesProposes(jours, humansMode) {
  const filtre = _drFiltre(DRY_PUBTYPES, humansMode, DRY_LANGS, true);
  const themesVals = DRY_THEMES.map(function (t) { return t.val; });
  const union = {}, parAxe = { direct: 0, themed: 0 };

  const idsD = _drIds(_drAvec(_drOrJournals(DRY_REVUES_DIRECT), filtre), jours);
  parAxe.direct = idsD.length;
  idsD.forEach(function (i) { union[i] = 1; });

  const idsT = _drIds(_drAvec('(' + _drOrJournals(DRY_REVUES_THEMED) + ') AND (' + _drOrThemes(themesVals) + ')', filtre), jours);
  parAxe.themed = idsT.length;
  idsT.forEach(function (i) { union[i] = 1; });

  return { total: Object.keys(union).length, parAxe: parAxe };
}

function veilleDryRun() {
  Logger.log('═══ DRY RUN VEILLE — aucune écriture ═══');
  [30, 90].forEach(function (j) {
    Logger.log('');
    Logger.log('── Fenêtre ' + j + ' jours ──');

    const a = _drAxesActuels(j);
    if (a) Logger.log('ACTUELLE  : ' + _drPadL(a.total, 5) + ' articles uniques' +
      '   (revues ' + a.parAxe.revues + ' · généralistes×thèmes ' + a.parAxe.general +
      ' · thèmes ' + a.parAxe.themes + ')');

    const ps = _drAxesProposes(j, 'strict');
    Logger.log('PROPOSÉE humans STRICT : ' + _drPadL(ps.total, 5) + ' uniques' +
      '   (directes ' + ps.parAxe.direct + ' · croisées ' + ps.parAxe.themed + ')');

    const p = _drAxesProposes(j, 'souple');
    Logger.log('PROPOSÉE humans SOUPLE : ' + _drPadL(p.total, 5) + ' uniques' +
      '   (directes ' + p.parAxe.direct + ' · croisées ' + p.parAxe.themed + ')');

    if (ps.total >= 0) Logger.log('→ articles rendus visibles par le passage en souple : ' +
      (p.total - ps.total));
    Logger.log('→ config souple ≈ ' + (p.total / (j / 7)).toFixed(1) + ' articles/semaine' +
      '   (cible visée : 15–20)');
    if (a && a.total > 0) Logger.log('→ vs config actuelle : ' +
      Math.round((1 - p.total / a.total) * 100) + ' % de volume en moins');
  });
  Logger.log('');
  Logger.log('Suite : veilleDryRunRevues() puis veilleDryRunThemes() pour élaguer.');
}

// ══════════════════════════════════════════════════════════════════════
//  2. Volume revue par revue (90 jours) — pour retirer les bavardes
// ══════════════════════════════════════════════════════════════════════

function veilleDryRunRevues() {
  const jours = 90;
  const filtre = _drFiltre(DRY_PUBTYPES, DRY_HUMANS, DRY_LANGS, true);
  const themesOr = _drOrThemes(DRY_THEMES.map(function (t) { return t.val; }));

  Logger.log('═══ VOLUME PAR REVUE — 90 jours, config proposée ═══');
  Logger.log('(colonne « /mois » = ce que la revue ajouterait chaque mois)');
  Logger.log('');
  Logger.log('── Revues en accès DIRECT ──');
  let totD = 0;
  DRY_REVUES_DIRECT.forEach(function (r) {
    const n = _drCount(_drAvec('"' + r + '"[Journal]', filtre), jours);
    totD += n;
    Logger.log('  ' + _drPad(r, 30) + _drPadL(n, 5) + ' /90j' + _drPadL((n / 3).toFixed(1), 8) + ' /mois');
  });
  Logger.log('  ' + _drPad('TOTAL direct (avec doublons)', 30) + _drPadL(totD, 5));

  Logger.log('');
  Logger.log('── Revues CROISÉES aux thèmes ──');
  let totT = 0;
  DRY_REVUES_THEMED.forEach(function (r) {
    const n = _drCount(_drAvec('"' + r + '"[Journal] AND (' + themesOr + ')', filtre), jours);
    totT += n;
    Logger.log('  ' + _drPad(r, 30) + _drPadL(n, 5) + ' /90j' + _drPadL((n / 3).toFixed(1), 8) + ' /mois');
  });
  Logger.log('  ' + _drPad('TOTAL croisé (avec doublons)', 30) + _drPadL(totT, 5));
}

// ══════════════════════════════════════════════════════════════════════
//  3. Volume thème par thème (90 jours), à l'intérieur de l'univers
// ══════════════════════════════════════════════════════════════════════

function veilleDryRunThemes() {
  const jours = 90;
  const filtre = _drFiltre(DRY_PUBTYPES, DRY_HUMANS, DRY_LANGS, true);
  const universOr = _drOrJournals(DRY_REVUES_DIRECT.concat(DRY_REVUES_THEMED));

  Logger.log('═══ VOLUME PAR THÈME — 90 jours, DANS l\'univers de revues ═══');
  DRY_THEMES.forEach(function (t) {
    const n = _drCount(_drAvec('(' + universOr + ') AND (' + t.val + ')', filtre), jours);
    Logger.log('  ' + _drPad(t.cle, 30) + _drPadL(n, 5) + ' /90j' + _drPadL((n / 3).toFixed(1), 8) + ' /mois');
  });

  Logger.log('');
  Logger.log('═══ VOLUME PAR TYPE D\'ARTICLE — 90 jours, univers complet ═══');
  const themesOr = _drOrThemes(DRY_THEMES.map(function (t) { return t.val; }));
  const base = '(' + _drOrJournals(DRY_REVUES_DIRECT) + ') OR ((' +
               _drOrJournals(DRY_REVUES_THEMED) + ') AND (' + themesOr + '))';
  DRY_PUBTYPES.forEach(function (pt) {
    const f = _drFiltre([pt], DRY_HUMANS, DRY_LANGS, true);
    const n = _drCount(_drAvec(base, f), jours);
    Logger.log('  ' + _drPad(pt, 30) + _drPadL(n, 5) + ' /90j' + _drPadL((n / 3).toFixed(1), 8) + ' /mois');
  });
}

// ══════════════════════════════════════════════════════════════════════
//  4. Aperçu : 25 titres réels que la config proposée aurait retenus (30 j)
// ══════════════════════════════════════════════════════════════════════

function veilleDryRunApercu() {
  const jours = 30;
  const filtre = _drFiltre(DRY_PUBTYPES, DRY_HUMANS, DRY_LANGS, true);
  const themesOr = _drOrThemes(DRY_THEMES.map(function (t) { return t.val; }));
  const union = {};
  _drIds(_drAvec(_drOrJournals(DRY_REVUES_DIRECT), filtre), jours).forEach(function (i) { union[i] = 1; });
  _drIds(_drAvec('(' + _drOrJournals(DRY_REVUES_THEMED) + ') AND (' + themesOr + ')', filtre), jours)
    .forEach(function (i) { union[i] = 1; });

  const ids = Object.keys(union).slice(0, 25);
  if (!ids.length) { Logger.log('Aucun article.'); return; }
  const j = _drPost('esummary.fcgi', 'db=pubmed&retmode=json&id=' + ids.join(','));
  const res = (j && j.result) || {};
  Logger.log('═══ APERÇU — ' + ids.length + ' titres sur ' + Object.keys(union).length + ' retenus (30 j) ═══');
  ids.forEach(function (pmid, k) {
    const o = res[pmid];
    if (!o || o.error) return;
    Logger.log((k + 1) + '. [' + String(o.source || '') + '] ' + String(o.title || '').replace(/\.$/, ''));
  });
}

// ══════════════════════════════════════════════════════════════════════
//  5. Vérification des NOMS de revues
//     Une revue qui rend 0 SANS AUCUN filtre sur 90 jours n'est pas une
//     revue silencieuse : c'est un nom que PubMed ne reconnaît pas. Elle
//     est alors absente de la veille sans le moindre message d'erreur.
// ══════════════════════════════════════════════════════════════════════

function veilleDryRunNoms() {
  const jours   = 90;
  const filtre  = _drFiltre(DRY_PUBTYPES, DRY_HUMANS, DRY_LANGS, true);
  const themesOr = _drOrThemes(DRY_THEMES.map(function (t) { return t.val; }));

  const liste = DRY_REVUES_DIRECT.map(function (r) { return { nom: r, axe: 'direct' }; })
    .concat(DRY_REVUES_THEMED.map(function (r) { return { nom: r, axe: 'croisé' }; }));

  Logger.log('═══ VÉRIFICATION DES NOMS DE REVUES — 90 jours ═══');
  Logger.log('brut   = tout ce que la revue a publié, sans aucun filtre');
  Logger.log('gardé  = ce que la veille en retiendrait');
  Logger.log('');

  const suspects = [];
  liste.forEach(function (o) {
    const j = '"' + o.nom + '"[Journal]';
    const brut = _drCount(j, jours);
    const base = (o.axe === 'direct') ? j : '(' + j + ') AND (' + themesOr + ')';
    const garde = _drCount(_drAvec(base, filtre), jours);
    const flag = (brut === 0) ? '   ⚠️ NOM NON RECONNU PAR PUBMED'
               : (garde === 0) ? '   ⚠️ nom ok mais rien ne passe les filtres'
               : '';
    if (brut === 0 || garde === 0) suspects.push(o.nom + ' (' + o.axe + ', brut ' + brut + ')');
    Logger.log('  ' + _drPad(o.nom, 28) + _drPad(o.axe, 8) +
               'brut ' + _drPadL(brut, 5) + '   gardé ' + _drPadL(garde, 4) + flag);
  });

  Logger.log('');
  if (!suspects.length) {
    Logger.log('Aucune anomalie : les ' + liste.length + ' noms sont reconnus et productifs.');
  } else {
    Logger.log('À REVOIR (' + suspects.length + ') :');
    suspects.forEach(function (x) { Logger.log('  · ' + x); });
  }
}
