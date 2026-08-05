// ⚠️ RÈGLE (détecteur de dérive dépôt↔Apps Script) : incrémenter cette version
// à CHAQUE push de ce fichier. Le diagnostic (admin → Maintenance) compare la
// version déployée ici avec celle du dépôt et signale toute recopie oubliée.
const GAS_VERSION_MIROIR = '2026-08-05.9';

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
/* (2026-08-04.5, AUDIT) Une famille = ce que l'action MODIFIE REELLEMENT.
   L'accroche tourne DANS la requete, avant la reponse : chaque famille en
   trop est du temps d'attente utilisateur. Constats de l'audit :
   - un lot de placements n'ecrit que PLANNING_OVERRIDES → config_admin seul
     (le fichier planning ne change qu'a la PUBLICATION) ;
   - setDailyStatus ecrit GARDES + le reflet INDISPOS, ne republie pas ;
   - la generation n'a pas encore publie → pas de famille planning.
   applyModification garde un perimetre large (action rare, doute documente
   sur la mise a jour du fichier). */
const MIROIR_APRES_ECRITURE = {
  publishPlanning:            ['planning', 'affectations', 'annees', 'config_admin', 'gardes', 'stats'],
  setDailyStatus:             ['gardes', 'indispos'],
  applyModification:          ['planning', 'config_admin', 'gardes', 'stats'],
  deleteOverride:             ['config_admin'],
  savePlanningOverridesBatch: ['config_admin'],
  generateGardes:             ['annees', 'config_admin', 'gardes', 'stats'],
  declareLiberal:             ['liberal'],   // (2026-08-05.9) un MAR déclare → le volet du comité suit
  deleteLiberal:              ['liberal'],
  archiveYear:                ['planning', 'affectations', 'annees', 'config_admin', 'gardes', 'stats'],
  setActiveYear:              ['annees', 'acces', 'config_admin'],
  initYear:                   ['annees', 'config_admin'],
  // Affectations sectorielles
  saveAffectations:           ['affectations'],
  saveAffectationsMar:        ['affectations'],
  // Médecins et codes d'accès
  saveMedecin:                ['acces', 'config_admin'],
  resetCodeMar:               ['acces', 'config_admin'],
  addMedecinToGroupe:         ['config_admin'],
  saveConfig:                 ['acces', 'config_admin'],
  savePeriodes:               ['config_admin', 'vacances_admin'],
  saveGroupes:                ['config_admin', 'vacances_admin'],
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
/* (2026-08-05.6) ACCROCHE DIFFEREE — mesure du 05/08 au matin : meme avec
   l'audit des familles (.5), la construction + l'envoi au miroir DANS la
   requete coutaient encore ~5 s a chaque ecriture (savePlanningOverridesBatch :
   6,9 s serveur, dont ~1,5-2 s d'ecriture reelle). Desormais la requete se
   contente de NOTER ce qu'il faudra pousser (fusion dans les proprietes du
   script, sous verrou) et de garantir UN declencheur unique : la reponse part
   tout de suite, le declencheur pousse dans la minute qui suit, la synchro
   horaire ramasse tout echec. Fraicheur MAR : ~1-2 min au lieu de ~1 —
   l'ecran qui vient d'ecrire relit de toute facon le circuit DIRECT. */
const MIROIR_CLE_ATTENTE = 'MIROIR_POUSSEES_EN_ATTENTE';

function miroirApresRequete_(e, outTexte) {
  try {
    const payload = JSON.parse((e && e.parameter && e.parameter.payload) || '{}');
    const familles = MIROIR_APRES_ECRITURE[payload.action];
    if (!familles) return;
    if (String(outTexte || '').indexOf('"success":true') === -1) return;
    const annee = Number(payload.year) || getActiveYear();
    _miroirNoterPoussee_(familles, annee);
  } catch (err) { /* jamais bloquant */ }
}

/* Fusionne familles + annee dans la file d'attente persistee, sous verrou
   (deux ecritures paralleles ne s'ecrasent pas), et garantit le declencheur. */
function _miroirNoterPoussee_(familles, annee) {
  const verrou = LockService.getScriptLock();
  try { verrou.waitLock(5000); } catch (e) { /* sans verrou : on note quand meme */ }
  try {
    const props = PropertiesService.getScriptProperties();
    let attente = {};
    try { attente = JSON.parse(props.getProperty(MIROIR_CLE_ATTENTE) || '{}'); } catch (e) { attente = {}; }
    attente.familles = attente.familles || {};
    attente.annees = attente.annees || {};
    var etaitVide = !Object.keys(attente.familles).length;
    familles.forEach(function (f) { attente.familles[f] = true; });
    attente.annees[String(annee)] = true;
    props.setProperty(MIROIR_CLE_ATTENTE, JSON.stringify(attente));
  } finally {
    try { verrou.releaseLock(); } catch (e) {}
  }
  /* Declencheur verifie SEULEMENT quand la file etait vide : une note deja
     presente implique un declencheur en attente (ou un cas d'echec couvert
     par la synchro horaire). L'ecriture typique ne paie ainsi que la note
     (~100 ms), pas l'inventaire des declencheurs.
     ── INVENTAIRE DES FENETRES DE PERTE (audit du 05/08) — toutes bornees :
     l'ECRITURE DU CLASSEUR, elle, est TOUJOURS synchrone dans l'action ;
     seul le rafraichissement de la COPIE de lecture peut etre retarde.
     (a) echec d'ecriture de la note (quota props) → miroir rattrape par la
         synchro HORAIRE ; (b) verrou indisponible 5 s + deux notes
         simultanees → la derniere gagne, l'autre rattrapee par la synchro ;
     (c) echec de creation du declencheur → idem. Pire cas absolu : copie de
     lecture en retard d'UNE heure, donnees du classeur intactes. */
  if (etaitVide) {
    const deja = ScriptApp.getProjectTriggers().some(function (t) {
      return t.getHandlerFunction() === 'miroirRattrapage';
    });
    if (!deja) {
      try { ScriptApp.newTrigger('miroirRattrapage').timeBased().after(1000).create(); } catch (e) {}
    }
  }
}

/* Execute par le declencheur (~30-60 s apres la note) : pousse le cumul,
   se nettoie. Un echec ici n'est pas grave : la synchro horaire repasse. */
function miroirRattrapage() {
  // Supprimer NOS declencheurs d'abord : meme si la pousse echoue, pas d'orphelins.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'miroirRattrapage') {
      try { ScriptApp.deleteTrigger(t); } catch (e) {}
    }
  });
  const verrou = LockService.getScriptLock();
  let attente = null;
  try { verrou.waitLock(10000); } catch (e) {}
  try {
    const props = PropertiesService.getScriptProperties();
    try { attente = JSON.parse(props.getProperty(MIROIR_CLE_ATTENTE) || 'null'); } catch (e) { attente = null; }
    props.deleteProperty(MIROIR_CLE_ATTENTE);
  } finally {
    try { verrou.releaseLock(); } catch (e) {}
  }
  if (!attente || !attente.familles) return;
  const familles = Object.keys(attente.familles);
  const annees = Object.keys(attente.annees || {}).map(Number);
  if (!annees.length) annees.push(getActiveYear());
  annees.forEach(function (y) {
    try { miroirPousserFamilles_(familles, y, false); } catch (e) { /* filet horaire */ }
  });
  Logger.log('miroirRattrapage : ' + familles.join(',') + ' / annees ' + annees.join(','));
  /* Course rare : une ecriture a note PENDANT cette pousse (sa file n'etait
     pas vide → elle n'a pas cree de declencheur, et le notre est deja
     supprime). On re-arme pour elle. */
  try {
    if (PropertiesService.getScriptProperties().getProperty(MIROIR_CLE_ATTENTE)) {
      ScriptApp.newTrigger('miroirRattrapage').timeBased().after(1000).create();
    }
  } catch (e) { /* synchro horaire */ }
}

/* ── SYNCHRO COMPLÈTE — filet horaire + amorçage initial ─────────────────
   À lancer UNE FOIS à la main depuis l'éditeur Apps Script (Exécuter >
   miroirSyncComplet) pour remplir le miroir, puis automatiquement chaque
   heure via miroirInstallerDeclencheur(). */
function miroirSyncComplet() {
  const familles = ['acces', 'annees', 'secteurs', 'config_admin',
                    'planning', 'affectations', 'indispos', 'tuiles',
                    'gardes', 'joursferies', 'stats', 'vacances_admin', 'mail', 'liberal'];
  try { PropertiesService.getScriptProperties().deleteProperty(MIROIR_CLE_ATTENTE); } catch (e) {}   // la synchro pousse un sur-ensemble : la note devient caduque
  const res = miroirPousserFamilles_(familles, getActiveYear(), true);   // synchro : toutes les annees consultables
  Logger.log('miroirSyncComplet : ' + JSON.stringify(res));
  return res;
}

/* Installe le déclencheur horaire (idempotent : supprime d'abord les
   déclencheurs existants de miroirSyncComplet pour ne jamais en empiler). */
/* (2026-08-05.8) MODIFICATIONS MANUELLES DU CLASSEUR. Constat du 05/08 :
   une correction faite directement dans le Google Sheet n'était vue par
   personne — aucune requête ne part, donc aucune note miroir ; la copie de
   lecture ne se réalignait qu'à la synchro HORAIRE (attente jusqu'à 1 h,
   affichages incohérents entre pages). Ce déclencheur écoute les éditions du
   classeur et pose la MÊME note que les écritures du portail : la copie suit
   dans la minute. Le planning PUBLIÉ, lui, ne bouge pas — c'est le rôle du
   bouton « Publier », qui reste un acte volontaire du comité. */
const MIROIR_ONGLETS_SUIVIS = {
  GARDES:    ['gardes', 'indispos', 'stats'],   // statuts et gardes
  INDISPOS:  ['indispos'],
  MEDECINS:  ['config_admin', 'annees'],
  SECTEURS:  ['secteurs'],
  PLANNING_OVERRIDES: ['config_admin'],
  LIBERAL:      ['liberal'],
  PERIODES_VAC: ['vacances_admin'],
  GROUPES_VAC:  ['vacances_admin'],
};

function miroirSurEdition(e) {
  try {
    const nom = String((e && e.range && e.range.getSheet().getName()) || '').trim().toUpperCase();
    let familles = null, annee = getActiveYear();
    Object.keys(MIROIR_ONGLETS_SUIVIS).forEach(function (prefixe) {
      if (nom === prefixe || nom.indexOf(prefixe + '_') === 0) {
        familles = MIROIR_ONGLETS_SUIVIS[prefixe];
        const m = nom.match(/_(\d{4})$/);            // GARDES_2027, INDISPOS_2026…
        if (m) annee = Number(m[1]);
      }
    });
    if (!familles) return;                            // onglet non concerné : rien à faire
    _miroirNoterPoussee_(familles, annee);            // même file que les écritures du portail
  } catch (err) { /* jamais bloquant pour l'utilisateur du classeur */ }
}

function miroirInstallerDeclencheur() {
  // (2026-08-05.8) Écoute des éditions manuelles, en plus du filet horaire.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'miroirSurEdition') ScriptApp.deleteTrigger(t);
  });
  try {
    ScriptApp.newTrigger('miroirSurEdition')
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onEdit().create();
    Logger.log('Déclencheur d\'édition installé sur miroirSurEdition.');
  } catch (e) { Logger.log('Déclencheur d\'édition NON installé : ' + e.message); }

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
/* (2026-08-04.5) `toutesAnnees` : true = synchro horaire (couverture de
   toutes les annees consultables) ; false/absent = accroche d'ecriture —
   SEULE l'annee concernee est reconstruite. C'etait la racine des ecritures
   lentes du 04/08 : chaque pose reconstruisait gardes+stats+planning de
   TOUTES les annees, dans la requete, avant de repondre. */
function miroirPousserFamilles_(familles, annee, toutesAnnees) {
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
    if (toutesAnnees) {
      try {
        _miroirConstruireAnnees_().annees.forEach(function (a) { annees.push(Number(a.annee)); });
      } catch (e) { /* repli ci-dessous : au minimum l'annee courante */ }
      try { if (_jsonFilesByName_('planning_' + (annee + 1) + '.json').length > 0 && annees.indexOf(annee + 1) === -1) annees.push(annee + 1); } catch (e) {}
    }
    if (annees.indexOf(annee) === -1) annees.push(annee);
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

  if (uniq['gardes'] || uniq['joursferies'] || uniq['stats']) {
    // Memes annees que le planning : toutes les annees consultables.
    const anneesOutils = [];
    if (toutesAnnees) {
      try { _miroirConstruireAnnees_().annees.forEach(function (a) { anneesOutils.push(Number(a.annee)); }); } catch (e) {}
    }
    if (anneesOutils.indexOf(annee) === -1) anneesOutils.push(annee);
    anneesOutils.forEach(function (y) {
      if (uniq['gardes'])      _miroirAjouteEnveloppe_(items, 'gardes_' + y,      function () { return _miroirConstruireGardes_(y); });
      if (uniq['joursferies']) _miroirAjouteEnveloppe_(items, 'joursferies_' + y, function () { return { success: true, joursFeries: getJoursFeries(y).concat(getJoursFeries(y + 1)), year: y }; });
      if (uniq['stats'])       _miroirAjouteEnveloppe_(items, 'stats_' + y,       function () { return _miroirConstruireStats_(y); });
    });
  }

  if (uniq['mail']) {
    /* (2026-08-05.7) Compteur de non-lus : un NOMBRE seul, jamais d'objet ni
       d'expediteur. Il vient du miroir pour que le badge s'affiche a
       l'ouverture SANS aucun appel Google — et pour qu'une panne Gmail ne
       laisse plus le comite aveugle (mesure du 05/08 : mailNonLus en echec a
       20 s, badge muet). La LISTE des messages, elle, reste a la demande. */
    _miroirAjouteEnveloppe_(items, 'mail_nonlus', function () {
      const lab = Gmail.Users.Labels.get('me', 'INBOX');
      return { success: true, nonLus: Number(lab.messagesUnread || 0), maj: new Date().toISOString() };
    });
  }

  if (uniq['liberal']) {
    /* (2026-08-05.9) Activité libérale du jour, pour le volet du panneau de
       placement. Contenu STRICTEMENT limité à ce que l'écran affiche : qui
       opère, dans quel secteur, quelle chirurgie. AUCUN montant — ils restent
       au classeur (voir listLiberalJour, portail.gs 2026-08-05.2).
       Clé admin seule. Objectif : le volet s'affiche instantanément au lieu
       des 3,8-9,6 s mesurés le 05/08. */
    _miroirAjouteEnveloppe_(items, 'liberal_' + annee, function () {
      return _miroirConstruireLiberal_(annee);
    });
  }

  if (uniq['vacances_admin']) {
    _miroirAjouteEnveloppe_(items, 'vacances_admin', _miroirConstruireVacancesAdmin_);
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
/* (2026-08-05.9) Déclarations libérales de l'année, groupées PAR DATE :
   { "2027-03-03": [{marId, secteur, chirurgie}, …], … }
   Même forme que ce que renvoie listLiberalJour, pour que le volet consomme
   l'un ou l'autre sans distinction. */
function _miroirConstruireLiberal_(annee) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('LIBERAL_' + annee);
  if (!sh || sh.getLastRow() < 2) return { success: true, annee: Number(annee), jours: {} };
  const data = sh.getDataRange().getValues();
  const jours = {};
  for (let r = 1; r < data.length; r++) {
    const brut = data[r][2];
    const date = brut instanceof Date
      ? `${brut.getFullYear()}-${String(brut.getMonth()+1).padStart(2,'0')}-${String(brut.getDate()).padStart(2,'0')}`
      : String(brut || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const marId = String(data[r][3]).trim();
    if (!marId) continue;
    (jours[date] = jours[date] || []).push({
      marId: marId,
      secteur: String(data[r][4]).trim().toUpperCase(),
      chirurgie: String(data[r][5] || '').trim(),
    });
  }
  Object.keys(jours).forEach(function (d) {
    jours[d].sort(function (a, b) { return String(a.marId).localeCompare(String(b.marId)); });
  });
  return { success: true, annee: Number(annee), jours: jours };
}

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


/* ── BUILDERS LOT B (04/08/2026) — outils du comite ──────────────────────
   ⚠️ FIDELITE : `gardes`, `stats` et `vacances_admin` sont des COPIES
   CONFORMES des blocs inline de _routeRequete_ (Indispos.gs : actions
   getGardes, getStats, getVacancesConfig SANS parametre year). Ces blocs
   sont de purs dumps d'onglets ; si l'un d'eux change dans Indispos.gs,
   REPERCUTER ICI. `joursferies` appelle la vraie fonction (code.gs) :
   zero duplication. Enveloppes identiques aux actions → le client les
   consomme comme une reponse api(). */

function _miroirConstruireGardes_(gYear) {
  const ss = _ssWithSheet('GARDES_' + gYear) || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('GARDES_' + gYear);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const dateToCol = buildDateToCol(data, gYear);
  const result = {};
  for (var r = 3; r < data.length; r++) {
    const id = String(data[r][0]).trim();
    if (!id) continue;
    Object.keys(dateToCol).forEach(function (date) {
      const val = String(data[r][dateToCol[date]] || '').trim();
      if (!val) return;
      if (!result[date]) result[date] = {};
      result[date][id] = val;
    });
  }
  return { success: true, data: result, year: gYear };
}

function _miroirConstruireStats_(statsYear) {
  const ss = _ssWithSheet('STATS_GARDES_' + statsYear) || SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('STATS_GARDES_' + statsYear);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const stats = [];
  for (var r = 1; r < data.length; r++) {
    if (!data[r][0]) continue;
    stats.push({medecin:data[r][0], cible:data[r][1], total:data[r][2],
      g:data[r][3], g2:data[r][4], lun:data[r][5], mar:data[r][6], mer:data[r][7],
      jeu:data[r][8], ven:data[r][9], sat:data[r][10], dim:data[r][11],
      recupR:data[r][12], h18:data[r][13],
      jf:data[r][14], vjf:data[r][15], vd:data[r][20], cSat:data[r][17], cJeu:data[r][18], cVd:data[r][19], cVjf:data[r][21]});
  }
  return { success: true, stats: stats };
}

function _miroirConstruireVacancesAdmin_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const perSheet = ss.getSheetByName('PERIODES_VAC');
  const periodes = [];
  if (perSheet) {
    const perData = perSheet.getDataRange().getValues();
    for (var r = 1; r < perData.length; r++) {
      const nom = String(perData[r][0]).trim();
      if (!nom) continue;
      const debutRaw = perData[r][1], finRaw = perData[r][2];
      const debut = debutRaw instanceof Date
        ? debutRaw.getFullYear() + '-' + String(debutRaw.getMonth()+1).padStart(2,'0') + '-' + String(debutRaw.getDate()).padStart(2,'0')
        : String(debutRaw).trim();
      const fin = finRaw instanceof Date
        ? finRaw.getFullYear() + '-' + String(finRaw.getMonth()+1).padStart(2,'0') + '-' + String(finRaw.getDate()).padStart(2,'0')
        : String(finRaw).trim();
      periodes.push({nom: nom, debut: debut, fin: fin, seuil: Number(perData[r][3]) || 8});
    }
  }
  const groupSheet = ss.getSheetByName('GROUPES_VAC');
  const groupes = {A: [], B: [], C: []};
  if (groupSheet) {
    const groupData = groupSheet.getDataRange().getValues();
    const tempGroups = {A: [], B: [], C: []};
    for (var r2 = 1; r2 < groupData.length; r2++) {
      const grp = String(groupData[r2][0]).trim(), id = String(groupData[r2][1]).trim();
      const ord = Number(groupData[r2][2]) || 0;
      if (!id || !tempGroups[grp]) continue;
      tempGroups[grp].push({id: id, ordre: ord});
    }
    ['A', 'B', 'C'].forEach(function (gk) {
      groupes[gk] = tempGroups[gk].sort(function (x, y) { return x.ordre - y.ordre; }).map(function (m) { return {id: m.id}; });
    });
  }
  return { success: true, periodes: periodes, groupes: groupes };
}
