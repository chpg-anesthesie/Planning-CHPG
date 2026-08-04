// ⚠️ RÈGLE (détecteur de dérive dépôt↔Apps Script) : incrémenter cette version
// à CHAQUE push de ce fichier. Le diagnostic (admin → Maintenance) compare la
// version déployée ici avec celle du dépôt et signale toute recopie oubliée.
const GAS_VERSION_MIROIR = '2026-08-04.3';

/* ═══════════════════════════════════════════════════════════════════════
   MIROIR.GS — alimentation du miroir de lecture Cloudflare
   ═══════════════════════════════════════════════════════════════════════

   POURQUOI. Mesures du 03/08 : un appel Apps Script coûte 2,5 à 5 s quel
   que soit le travail serveur (compilation des ~575 Ko à CHAQUE requête,
   redirection 302, file d'attente par compte). Les pages qui LISENT via
   Apps Script ne peuvent donc jamais s'ouvrir vite. Le miroir Cloudflare
   sert les mêmes données en ~150 ms : ce fichier est le tuyau qui l'alimente.

   PRINCIPE. Apps Script reste le SEUL écrivain des données. Après chaque
   écriture réussie, il dépose une copie à jour chez Cloudflare (POST /push,
   jeton secret). En filet, une synchronisation complète horaire résorbe
   tout écart (envoi raté, modification à la main dans le classeur).

   SÉCURITÉ.
   - Le jeton d'écriture vit dans les PROPRIÉTÉS DU SCRIPT (clé
     MIROIR_PUSH_TOKEN), JAMAIS dans ce fichier ni dans le dépôt.
   - Les codes d'accès ne quittent jamais le script en clair : seules leurs
     empreintes SHA-256 sont déposées (clé `acces`), pour que le Worker
     authentifie sans détenir les codes.
   - Le code du SECRÉTARIAT n'est PAS déposé, même en empreinte : ce rôle
     n'a aucune lecture au miroir (règle de _routeRequete_ conservée), son
     empreinte n'y a donc aucun usage.
   - LISTE ROUGE inchangée : relevé libéral, marges, PARAMETRES/CONFIG,
     Gmail, journaux — rien de tout cela ne transite ici.

   JAMAIS BLOQUANT. Toute fonction de ce fichier avale ses erreurs : un
   miroir en panne ne doit JAMAIS faire échouer une écriture du portail.
   Le filet horaire rattrape ; le client, lui, se replie sur le circuit GAS.

   CONTRAT DES CLÉS (doit rester identique à CLE_VALIDE dans
   cloudflare/worker.js ; le Worker refuse toute clé hors liste) :
     acces, annees, secteurs, config_admin,
     planning_{Y}, affectations_{Y}, indispos_{Y}
   AJOUT 04/08 : clés `topos`, `staffs`, `veille`, `protocoles`, `annuaire`
   (tuiles du dashboard, enveloppes {success:true,…} stockées telles quelles).
   Pas d'accroche d'écriture pour elles : topos/protocoles vivent dans des
   dossiers Drive gérés à la main, veille via son déclencheur hebdo — la
   synchro HORAIRE est leur seule source de fraîcheur (délai assumé : ces
   contenus changent rarement). Décision vacances : getVacConfig est PAR MAR
   (quota, TP) et reste au GAS, appelé SANS bloquer l'affichage — pas de clé
   miroir.
   ═══════════════════════════════════════════════════════════════════ */

const MIROIR_URL = 'https://chpg-miroir.arthurfrohlich.workers.dev';

/* Quelles écritures rafraîchissent quelles clés. Table SÉPARÉE de
   WRITE_ACTIONS_LOCK : savePlanningOverridesBatch, par exemple, est une
   écriture avec verrou dédié (code.gs) qui ne figure pas dans LOCK.
   Principe : pousser un peu trop large plutôt que trop étroit — une clé
   repoussée à l'identique ne coûte qu'un envoi, une clé oubliée coûte une
   donnée périmée servie à 23 MARs. */
const MIROIR_APRES_ECRITURE = {
  // Planning et overrides (les overrides vivent dans config_admin)
  publishPlanning:            ['planning', 'affectations', 'annees', 'config_admin'],
  setDailyStatus:             ['planning', 'config_admin'],
  applyModification:          ['planning', 'config_admin'],
  deleteOverride:             ['planning', 'config_admin'],
  savePlanningOverridesBatch: ['planning', 'config_admin'],
  generateGardes:             ['planning', 'annees', 'config_admin'],
  archiveYear:                ['planning', 'affectations', 'annees', 'config_admin'],
  setActiveYear:              ['annees', 'acces', 'config_admin'],
  initYear:                   ['annees', 'config_admin'],
  // Affectations sectorielles
  saveAffectations:           ['affectations'],
  saveAffectationsMar:        ['affectations'],
  // Médecins et codes d'accès
  saveMedecin:                ['acces', 'config_admin'],
  resetCodeMar:               ['acces', 'config_admin'],
  addMedecinToGroupe:         ['config_admin'],
  saveGroupes:                ['config_admin'],
  saveConfig:                 ['acces', 'config_admin'],
  savePeriodes:               ['config_admin'],
  // Indisponibilités (l'année de campagne et son état vivent dans `acces`)
  saveIndispos:               ['indispos', 'acces'],
  saveIndisposBatch:          ['indispos', 'acces'],
  poserAbsenceLongue:         ['indispos', 'acces'],
  annulerAbsenceLongue:       ['indispos', 'acces'],
  clearIndisposYear:          ['indispos', 'acces'],
  setIndisposYear:            ['indispos', 'acces'],
};

/* ── POINT D'ACCROCHE — appelé par doGet (Indispos.gs) après le routage ──
   `e` : l'événement brut ; `outTexte` : la réponse déjà produite.
   Ne pousse que si l'action est une écriture connue ET que la réponse
   annonce un succès (une écriture refusée ne change rien au classeur).
   Coût pour les LECTURES : un lookup d'objet, ~0 ms. */
function miroirApresRequete_(e, outTexte) {
  try {
    const payload = JSON.parse((e && e.parameter && e.parameter.payload) || '{}');
    const familles = MIROIR_APRES_ECRITURE[payload.action];
    if (!familles) return;
    if (String(outTexte || '').indexOf('"success":true') === -1) return;
    const annee = Number(payload.year) || getActiveYear();
    miroirPousserFamilles_(familles, annee);
  } catch (err) { /* jamais bloquant */ }
}

/* ── SYNCHRO COMPLÈTE — filet horaire + amorçage initial ─────────────────
   À lancer UNE FOIS à la main depuis l'éditeur Apps Script (Exécuter >
   miroirSyncComplet) pour remplir le miroir, puis automatiquement chaque
   heure via miroirInstallerDeclencheur(). */
function miroirSyncComplet() {
  const familles = ['acces', 'annees', 'secteurs', 'config_admin',
                    'planning', 'affectations', 'indispos', 'tuiles'];
  const res = miroirPousserFamilles_(familles, getActiveYear());
  Logger.log('miroirSyncComplet : ' + JSON.stringify(res));
  return res;
}

/* Installe le déclencheur horaire (idempotent : supprime d'abord les
   déclencheurs existants de miroirSyncComplet pour ne jamais en empiler). */
function miroirInstallerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'miroirSyncComplet') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('miroirSyncComplet').timeBased().everyHours(1).create();
  Logger.log('Déclencheur horaire installé sur miroirSyncComplet.');
}

/* ── CONSTRUCTION + ENVOI ────────────────────────────────────────────────
   Traduit des familles logiques en clés concrètes, construit chaque valeur,
   pousse le tout en UN appel HTTP. Une famille qui échoue à se construire
   est simplement omise (le filet horaire retentera). */
function miroirPousserFamilles_(familles, annee) {
  const items = {};
  const uniq = {};
  familles.forEach(function (f) { uniq[f] = true; });

  if (uniq['acces'])        _miroirAjoute_(items, 'acces',        _miroirConstruireAcces_);
  if (uniq['annees'])       _miroirAjoute_(items, 'annees',       _miroirConstruireAnnees_);
  if (uniq['secteurs'])     _miroirAjoute_(items, 'secteurs',     function () { return getSecteurs(); });
  if (uniq['config_admin']) _miroirAjoute_(items, 'config_admin', function () { return _miroirConstruireConfigAdmin_(annee); });

  if (uniq['planning'] || uniq['affectations']) {
    /* (03/08/2026, correctif) TOUTES les annees consultables, pas « active
       + N+1 ». Constate en reel : annee active 2027, selecteur proposant
       2026 → planning_2026 jamais depose au miroir, repli GAS a chaque
       bascule d'annee. Source de la liste : le meme balayage que le
       selecteur (_miroirConstruireAnnees_ : GARDES_{Y} actifs + archives) ;
       chaque annee n'est poussee que si son fichier existe sur le Drive
       (_miroirAjouteFichierDrive_ saute silencieusement les absents). */
    const annees = [];
    try {
      _miroirConstruireAnnees_().annees.forEach(function (a) { annees.push(Number(a.annee)); });
    } catch (e) { /* repli ci-dessous : au minimum l'annee courante */ }
    if (annees.indexOf(annee) === -1) annees.push(annee);
    try { if (_jsonFilesByName_('planning_' + (annee + 1) + '.json').length > 0 && annees.indexOf(annee + 1) === -1) annees.push(annee + 1); } catch (e) {}
    annees.forEach(function (y) {
      if (uniq['planning'])     _miroirAjouteFichierDrive_(items, 'planning_' + y,     'planning_' + y + '.json');
      if (uniq['affectations']) _miroirAjouteFichierDrive_(items, 'affectations_' + y, 'affectations_' + y + '.json');
    });
  }

  if (uniq['tuiles']) {
    // Enveloppes {success:true,…} stockées TELLES QUELLES : le client les
    // consomme comme une réponse apiPost. Garde : jamais pousser un échec.
    _miroirAjouteEnveloppe_(items, 'topos',      function () { return listTopos(); });
    _miroirAjouteEnveloppe_(items, 'staffs',     function () { return listStaffs(); });
    _miroirAjouteEnveloppe_(items, 'veille',     function () { return getVeille(); });
    _miroirAjouteEnveloppe_(items, 'protocoles', function () { return listProtocoles(); });
    _miroirAjouteEnveloppe_(items, 'annuaire',   function () { return listAnnuaire(); });
  }

  if (uniq['indispos']) {
    const iy = (function () { try { return getIndisposYear(); } catch (e) { return annee; } })();
    _miroirAjoute_(items, 'indispos_' + iy, function () { return _miroirConstruireIndispos_(iy); });
  }

  if (!Object.keys(items).length) return { success: false, error: 'aucune clé construite' };
  return _miroirEnvoyer_(items);
}

/* Construit une valeur et l'ajoute aux items sous forme de chaîne JSON.
   Échec silencieux : la clé est omise, jamais poussée corrompue. */
function _miroirAjoute_(items, cle, construire) {
  try {
    const v = construire();
    if (v !== null && v !== undefined) items[cle] = JSON.stringify(v);
  } catch (err) { /* omise ; filet horaire */ }
}

/* Enveloppe d'action ({success:true,…}) : poussée telle quelle, mais JAMAIS
   si l'action a échoué — un échec figé au miroir serait servi en boucle. */
function _miroirAjouteEnveloppe_(items, cle, construire) {
  try {
    const v = construire();
    if (v && v.success === true) items[cle] = JSON.stringify(v);
  } catch (err) { /* omise ; filet horaire */ }
}

/* Les JSON du Drive sont DÉJÀ des chaînes JSON : envoi tel quel, sans
   parse/stringify inutile (le Worker valide l'analysabilité à la réception). */
function _miroirAjouteFichierDrive_(items, cle, nomFichier) {
  try {
    const brut = readPlanningFromDrive(nomFichier);
    if (brut) items[cle] = brut;
  } catch (err) { /* omise ; filet horaire */ }
}

function _miroirEnvoyer_(items) {
  const jeton = PropertiesService.getScriptProperties().getProperty('MIROIR_PUSH_TOKEN');
  if (!jeton) return { success: false, error: 'MIROIR_PUSH_TOKEN absent des propriétés du script' };
  try {
    const rep = UrlFetchApp.fetch(MIROIR_URL + '/push', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ token: jeton, items: items }),
      muteHttpExceptions: true,
    });
    const texte = rep.getContentText();
    try { return JSON.parse(texte); }
    catch (e) { return { success: false, error: 'réponse Worker illisible : ' + String(texte).slice(0, 120) }; }
  } catch (err) {
    return { success: false, error: 'envoi impossible : ' + err.message };
  }
}

/* ── BUILDERS ────────────────────────────────────────────────────────────

   `acces` : empreintes SHA-256 des codes + identité, MÊMES SOURCES que
   checkCode (Indispos.gs) : ADMIN_CODE dans CONFIG, codes MAR en colonne 7
   de MEDECINS, colonnes LIBERAL/RPPS/PRENOM repérées par EN-TÊTE.
   FIDÉLITÉ À checkCode, pas d'interprétation : checkCode ne filtre PAS sur
   la colonne « actif », donc ici non plus — un code présent dans l'onglet
   ouvre une session, au miroir comme au GAS. Le code secrétariat est
   volontairement ABSENT (aucune lecture miroir pour ce rôle). */
function _miroirConstruireAcces_() {
  const norm = function (v) { return String(v == null ? '' : v).trim().toUpperCase(); };
  const users = [];

  // ADMIN_CODE — première occurrence gagnante, comme checkCode.
  try {
    const cfg = _configRows_();
    for (var r = 1; r < cfg.length; r++) {
      if (String(cfg[r][0]).trim() === 'ADMIN_CODE') {
        const c = norm(cfg[r][1]);
        if (c) users.push({ h: _miroirSha256_(c), id: 'ADMIN', role: 'admin',
                            name: 'Comité', initials: 'ADM', prenom: '', liberal: false, rpps: '' });
        break;
      }
    }
  } catch (e) { /* sans ADMIN_CODE, l'admin passera par le repli GAS */ }

  // Codes MAR — colonne 7 ([6]) de MEDECINS, en-têtes pour le reste.
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MEDECINS');
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    const colParTitre = function (titre) {
      if (!data.length) return -1;
      for (var c = 0; c < data[0].length; c++) {
        if (String(data[0][c]).trim().toUpperCase() === titre) return c;
      }
      return -1;
    };
    const colLib = colParTitre('LIBERAL'), colRpps = colParTitre('RPPS'), colPre = colParTitre('PRENOM');
    for (var i = 1; i < data.length; i++) {
      const code = norm(data[i][6]);
      if (!code) continue;
      users.push({
        h: _miroirSha256_(code),
        id: String(data[i][0]).trim(), role: 'mar',
        name: data[i][1], initials: data[i][2],
        prenom: colPre >= 0 ? String(data[i][colPre] == null ? '' : data[i][colPre]).trim() : '',
        liberal: colLib >= 0 && String(data[i][colLib]).trim().toUpperCase() === 'O',
        rpps: colRpps >= 0 ? String(data[i][colRpps] == null ? '' : data[i][colRpps]).trim() : '',
      });
    }
  }

  const acces = { users: users, t: Date.now() };
  try { acces.indisposYear = getIndisposYear(); } catch (e) { acces.indisposYear = null; }
  try { acces.indisposOuverte = _indisposOuverte_(); } catch (e) { acces.indisposOuverte = false; }
  return acces;
}

function _miroirSha256_(texte) {
  const octets = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texte, Utilities.Charset.UTF_8);
  return octets.map(function (o) {
    const v = (o < 0 ? o + 256 : o).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

/* `annees` : même balayage que l'action getAnneesDisponibles (onglets
   GARDES_{Y} du classeur actif + classeur d'archives). */
function _miroirConstruireAnnees_() {
  const vues = {};
  const balaye = function (classeur, archivee) {
    try {
      classeur.getSheets().forEach(function (sh) {
        const m = sh.getName().match(/^GARDES_(\d{4})$/);
        if (!m) return;
        const y = Number(m[1]);
        if (vues[y] === undefined) vues[y] = archivee;
      });
    } catch (e) { /* classeur inaccessible : on garde ce qu'on a */ }
  };
  balaye(SpreadsheetApp.getActiveSpreadsheet(), false);
  try { balaye(SpreadsheetApp.openById(ARCHIVE_SS_ID), true); } catch (e) {}
  const annees = Object.keys(vues).map(Number).sort(function (a, b) { return a - b; })
    .map(function (y) { return { annee: y, archivee: vues[y] }; });
  return { active: getActiveYear(), annees: annees };
}

/* `config_admin` : la part CONFIGURATION du bootstrap admin — médecins,
   overrides, seuils, modèle CS, année stats fiables, existence N+1.
   Chaque morceau tolère l'échec, comme dans getAdminBootstrap.
   ⚠️ Servi par le Worker au SEUL rôle admin (les fiches médecins portent
   emails et RPPS). Les parts VIVANTES du bootstrap (Gmail, journal)
   restent sur le circuit GAS, chargées après l'affichage. */
function _miroirConstruireConfigAdmin_(annee) {
  const out = { t: Date.now(), annee: annee };
  try { const m = _buildMedecins_(); out.medecins = m.error ? [] : m.medecins; } catch (e) { out.medecins = []; }
  try { out.overrides = _buildOverrides_(); } catch (e) { out.overrides = null; }
  try { out.seuils = getSeuils(); } catch (e) { out.seuils = null; }
  try { out.csTemplate = getCsTemplate(); } catch (e) { out.csTemplate = null; }
  try { out.anneeStatsFiables = PREMIERE_ANNEE_STATS_FIABLES; } catch (e) { out.anneeStatsFiables = null; }
  try { out.anneeSuivante = _jsonFilesByName_('planning_' + (annee + 1) + '.json').length > 0; } catch (e) { out.anneeSuivante = null; }
  return out;
}

/* `indispos_{Y}` : même lecture que l'action getAllIndispos (onglet
   INDISPOS_{Y}, dates reconstruites par le helper unifié), emballée dans
   {parMar:{ID:{date:val}}} — le format que le Worker sait FILTRER par MAR. */
function _miroirConstruireIndispos_(annee) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('INDISPOS_' + annee);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const dates = reconstruireDatesHeaders(data, annee);
  const parMar = {};
  for (var r = 3; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    parMar[id] = {};
    dates.forEach(function (date, i) {
      if (!date) return;
      const val = String(data[r][i + 1] || '').trim();
      if (val) parMar[id][date] = val;
    });
  }
  return { parMar: parMar, annee: annee, t: Date.now() };
}
