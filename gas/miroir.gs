// ⚠️ RÈGLE (détecteur de dérive dépôt↔Apps Script) : incrémenter cette version
// à CHAQUE push de ce fichier. Le diagnostic (admin → Maintenance) compare la
// version déployée ici avec celle du dépôt et signale toute recopie oubliée.
const GAS_VERSION_MIROIR = '2026-08-13.3';

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
  creerEchange:               ['echanges'],   // (13/08/2026) une demande créée → l'écran des 23 suit
  repondreEchange:            ['planning', 'config_admin', 'gardes', 'stats', 'echanges'],   // acceptation = écriture planning
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
  saveGroupes:                ['config_admin', 'vacances_admin', 'ordre_vac'],
  // Indisponibilités (l'année de campagne et son état vivent dans `acces`)
  saveIndispos:               ['indispos', 'acces'],
  saveIndisposBatch:          ['indispos', 'acces'],
  poserAbsenceLongue:         ['indispos', 'acces'],
  annulerAbsenceLongue:       ['indispos', 'acces'],
  clearIndisposYear:          ['indispos', 'acces'],
  setIndisposYear:            ['indispos', 'acces'],
  // (2026-08-08.1) Lu/★ par MAR : la marque suit sur les autres appareils
  // en ~1-2 min (accroche différée) ; l'écran qui a marqué est déjà à jour
  // (optimisme + file locale du dashboard).
  markVeille:                 ['veille_marques'],
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
                    'gardes', 'joursferies', 'stats', 'vacances_admin', 'mail', 'liberal',
                    'veille_marques', 'ordre_vac', 'echanges'];
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
/* (2026-08-06.11) Liste établie par INVENTAIRE : pour chaque famille du
   miroir, on est remonté à l'onglet qui l'alimente réellement, au lieu de
   lister les onglets « qui viennent à l'esprit ». Trois manquaient —
   AFFECTATIONS (les cases à pourvoir), STATS_GARDES (l'équité et la dette),
   CS_TEMPLATE et SEUILS (modèle de consultations, bornes de tension) : une
   correction manuelle y attendait la synchro HORAIRE sans que rien ne le dise.
   Toute nouvelle famille du miroir impose de revoir cette table. */
const MIROIR_ONGLETS_SUIVIS = {
  GARDES:       ['gardes', 'indispos', 'stats'],   // statuts et gardes
  STATS_GARDES: ['gardes', 'stats'],               // équité de référence et dette
  INDISPOS:     ['indispos'],
  MEDECINS:     ['config_admin', 'annees', 'acces'],
  SECTEURS:     ['secteurs'],
  AFFECTATIONS: ['affectations', 'config_admin'],  // détermine les cases à pourvoir
  PLANNING_OVERRIDES: ['config_admin'],
  CS_TEMPLATE:  ['config_admin'],                  // modèle de consultations
  SEUILS:       ['config_admin'],                  // bornes de la carte de tension
  LIBERAL:      ['liberal'],
  PERIODES_VAC: ['vacances_admin', 'stats'],
  GROUPES_VAC:  ['vacances_admin', 'ordre_vac'],
  VEILLE_MARQUES: ['veille_marques'],              // (2026-08-08.1) correction manuelle d'une marque
  ECHANGES:     ['echanges'],                      // (13/08/2026) correction manuelle d'une demande
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

  if (uniq['echanges']) {
    // (13/08/2026 — phase 3) Même contrat que les tuiles : enveloppe stockée
    // telle quelle, jamais poussée en échec.
    _miroirAjouteEnveloppe_(items, 'echanges', function () { return getEchangesEnveloppe(); });
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
      /* (2026-08-13.2) INSTANTANE D'EQUITE. computeStatsLive recompte les gardes
         REELLEMENT faites sur toute l'annee, echanges et dons compris. C'est le
         calcul le plus lourd du portail : mesure du 13/08, plusieurs dizaines de
         secondes ressenties cote MAR, et c'est lui qui rend le diagnostic long.
         Le faire ici, c'est le payer UNE fois pour les 23, dans le declencheur
         differe — jamais dans la requete d'un MAR, jamais dans l'ecriture du
         comite (celle-ci se contente de noter la poussee depuis le 05/08).
         Memes declencheurs que la famille stats : un echange de garde republie
         donc l'instantane dans la minute. Contrepartie assumee : l'ecran n'est
         plus exact a la seconde mais a la minute — le lien « recalculer » de la
         page reste la pour qui veut la valeur fraiche. */
      if (uniq['stats'])       _miroirAjouteEnveloppe_(items, 'equite_live_' + y, function () {
        return { success: true, stats: computeStatsLive(y) };
      });
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

  if (uniq['ordre_vac']) {
    /* (2026-08-13.1) Ordre de passage des vacances, pour l'annee en cours et la
       suivante. Copie COMMUNE : elle ne contient aucun rang personnel — la page
       cherche son propre identifiant dans les listes ordonnees.
       Pourquoi au miroir : le bandeau de « Mes conges » attendait un
       aller-retour Apps Script a chaque ouverture. Ici il voyage dans le MEME
       appel que le planning, a l'ouverture du portail — aucune requete de plus.
       Les annees sont FIGEES a la poussee : la synchro horaire les reactualise
       au plus tard une heure apres le 1er janvier, et la page compare de toute
       facon les annees recues a celles qu'elle attend. */
    _miroirAjoute_(items, 'ordre_vac', function () {
      const y = new Date().getFullYear();
      const r = getOrdreVacances(null, [y, y + 1]);
      return {
        annees: (r.annees || []).map(function (a) {
          return { annee: a.annee, groupes: a.groupes, periodes: a.periodes };
        }),
        t: Date.now(),
      };
    });
  }

  if (uniq['veille_marques']) {
    // (2026-08-08.1) Meme format que les indispos : {parMar:{ID:…}}, filtré
    // par le Worker — chacun ne reçoit que ses marques, admin compris.
    _miroirAjoute_(items, 'veille_marques', function () {
      return { parMar: _veilleMarquesParMar(), t: Date.now() };
    });
  }

  /* (2026-08-09.1) OUBLI DES ANNEES RETIREES — voir _miroirPurgerAnnees_.
     UNIQUEMENT en synchro complete : une accroche d'ecriture ne connait qu'une
     annee et n'a aucune vue d'ensemble, elle n'a pas a decider d'un effacement. */
  var _purge = null;
  if (toutesAnnees) {
    try { _purge = _miroirPurgerAnnees_(items, annee); }
    catch (e) { _purge = { refus: 'exception : ' + e.message }; }
  }

  if (!Object.keys(items).length) return { success: false, error: 'aucune clé construite' };
  const _res = _miroirEnvoyer_(items);
  if (_purge) _res.purge = _purge;
  return _res;
}

/* ═══ COPIE DES DOCUMENTS (topos et protocoles) — 2026-08-10.1 ═══════════
   POURQUOI. Servir un PDF par Apps Script est le geste le plus cher du
   portail : mesure du 08/08, `getProtocole` 6,1 s et `getTopo` 11,5 s,
   quand tout le reste de la page arrive du miroir en 100-270 ms. C'est
   50 a 100 fois plus cher que n'importe quel autre geste, et c'est le seul
   appel lourd que 23 MARs peuvent empiler — d'ou la consigne actuelle de ne
   JAMAIS faire ouvrir un document collectivement en reunion.

   CE QUE FAIT CETTE TACHE. Une fois par heure, elle depose au miroir UN
   document dont la date de modification a change depuis sa derniere copie.
   Un seul par passage : encoder puis transmettre un PDF de plusieurs Mo est
   long, et cette tache ne doit jamais devenir celle qui sature le quota
   quotidien de declencheurs (90 min/jour sur un compte gmail — voir
   ROADMAP). Au premier lancement : 17 documents = 17 heures. Ensuite elle
   ne trouve plus rien et sort en une seconde.

   CE QU'ELLE NE FAIT PAS. Elle ne touche pas aux pages : tant que l'etape 3
   n'est pas livree, `getTopo`/`getProtocole` restent le chemin de lecture.
   Les copies sont deposees et inutilisees — donc aucune regression possible.

   FORME DE LA VALEUR. STRICTEMENT celle que renvoie `getTopo` aujourd'hui
   ({success, name, mimeType, dataB64}), pour que la bascule de l'etape 3 ne
   change QUE la source, jamais le traitement.

   POIDS. Inventaire du 10/08 : 17 PDF, 30,6 Mo, le plus lourd 5,7 Mo. La
   contrainte n'est pas le stockage (25 Mo par cle) mais la MEMOIRE du
   Worker (128 Mo) : recevoir un envoi le fait lire, analyser et controler,
   soit ~3 copies en memoire. A 8 Mo de PDF (10,7 Mo encodes) on reste sous
   la moitie ; au-dela on s'en approche. D'ou le plafond ci-dessous, qui
   ECARTE le document sans jamais le casser : il reste servi par l'ancien
   chemin, et le Diagnostic le signale. */
const DOC_DOSSIERS      = [TOPOS_FOLDER, PROTOS_FOLDER];   // definis dans portail.gs
const DOC_POIDS_MAX     = 8 * 1024 * 1024;                 // au-dela : laisse sur le chemin Apps Script
const DOC_PROP_DATES    = 'MIROIR_DOCS_DATES';             // { idDrive: 'AAAA-MM-JJTHH:MM:SSZ' }
const DOC_PAR_PASSAGE   = 1;                               // un document par heure

/* Recense les PDF des deux dossiers (racine + sous-dossiers, 2 niveaux :
   Topos = 1 niveau, Protocoles = specialite puis sous-dossier). Renvoie
   { ok:true, docs:[{id,nom,maj,taille}] } ou { ok:false } si UN dossier est
   injoignable — dans ce cas on ne conclut RIEN (regle 3 : « je n'ai pas pu
   lire » n'est pas « ca n'existe plus »). */
function _docsRecenser_() {
  const docs = [];
  let ok = true;
  const ajouterFichiers = function (dossier) {
    const it = dossier.getFiles();
    while (it.hasNext()) {
      const f = it.next();
      const nom = String(f.getName());
      if (f.getMimeType() !== 'application/pdf' && !/\.pdf$/i.test(nom)) continue;
      docs.push({ id: f.getId(), nom: nom, taille: f.getSize(),
                  maj: Utilities.formatDate(f.getLastUpdated(), 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'") });
    }
  };
  DOC_DOSSIERS.forEach(function (nomDossier) {
    try {
      const it = DriveApp.getFoldersByName(nomDossier);
      if (!it.hasNext()) return;                      // dossier absent : normal si jamais cree
      const racine = it.next();
      ajouterFichiers(racine);
      const n1 = racine.getFolders();
      while (n1.hasNext()) {
        const sous = n1.next();
        ajouterFichiers(sous);
        const n2 = sous.getFolders();                 // Protocoles : specialite > sous-dossier
        while (n2.hasNext()) ajouterFichiers(n2.next());
      }
    } catch (e) { ok = false; }
  });
  return { ok: ok, docs: docs };
}

function _docsDatesLues_() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty(DOC_PROP_DATES) || '{}'); }
  catch (e) { return {}; }
}
function _docsDatesEcrites_(obj) {
  /* Garde-fou de taille : une propriete est plafonnee a 9 Ko. ~60 octets par
     entree → ~150 documents. Au-dela on ne garde que les plus recentes, quitte
     a recopier les plus anciennes une fois de trop (sans dommage). */
  let txt = JSON.stringify(obj);
  if (txt.length > 8000) {
    const entrees = Object.keys(obj).map(function (k) { return [k, obj[k]]; })
      .sort(function (a, b) { return a[1] < b[1] ? 1 : -1; }).slice(0, 100);
    const reduit = {};
    entrees.forEach(function (e) { reduit[e[0]] = e[1]; });
    txt = JSON.stringify(reduit);
  }
  PropertiesService.getScriptProperties().setProperty(DOC_PROP_DATES, txt);
}

/* Tache horaire. Renvoie un compte rendu, ne leve jamais : un echec de copie
   ne doit pas empecher le passage suivant. */
function miroirDocuments() {
  const rec = _docsRecenser_();
  if (!rec.ok) {
    const m = { refus: 'un dossier de documents est injoignable — aucune copie, aucun effacement' };
    Logger.log('miroirDocuments : ' + JSON.stringify(m));
    return m;
  }

  const dates = _docsDatesLues_();
  const vus = {};
  const trop = [];
  const aFaire = [];
  rec.docs.forEach(function (d) {
    vus[d.id] = true;
    if (d.taille > DOC_POIDS_MAX) { trop.push(d.nom + ' (' + Math.round(d.taille / 1048576) + ' Mo)'); return; }
    if (dates[d.id] !== d.maj) aFaire.push(d);
  });

  /* Effacement des documents disparus du Drive (ou devenus trop lourds).
     Meme principe que la purge des annees : on n'efface que ce dont on est
     SUR qu'il n'a plus lieu d'etre, le recensement ayant reussi. */
  const items = {};
  const effaces = [];
  Object.keys(dates).forEach(function (id) {
    if (!vus[id]) { items['doc_' + id] = null; effaces.push(id); }
  });

  const copies = [];
  const erreurs = [];
  aFaire.slice(0, DOC_PAR_PASSAGE).forEach(function (d) {
    try {
      const blob = DriveApp.getFileById(d.id).getBlob();
      items['doc_' + d.id] = JSON.stringify({
        success: true,
        name: d.nom,
        mimeType: blob.getContentType() || 'application/pdf',
        dataB64: Utilities.base64Encode(blob.getBytes()),
      });
      copies.push(d);
    } catch (e) { erreurs.push(d.nom + ' : ' + e.message); }
  });

  /* (banc, 10/08) Ne JAMAIS renvoyer « rien a faire » quand une copie a
     echoue : le compte rendu serait rassurant a tort, et l'echec invisible.
     `erreurs` est toujours present dans le retour. */
  if (!Object.keys(items).length) {
    const m = { rien: !erreurs.length, total: rec.docs.length, ecartes: trop,
                erreurs: erreurs, copies: [], effaces: 0,
                restants: Math.max(0, aFaire.length - copies.length) };
    Logger.log('miroirDocuments : ' + JSON.stringify(m));
    return m;
  }

  const env = _miroirEnvoyer_(items);
  if (env && env.success) {
    copies.forEach(function (d) { dates[d.id] = d.maj; });
    effaces.forEach(function (id) { delete dates[id]; });
    try { _docsDatesEcrites_(dates); } catch (e) { erreurs.push('dates non enregistrees : ' + e.message); }
  }

  const m = {
    copies: copies.map(function (d) { return d.nom; }),
    effaces: effaces.length,
    restants: Math.max(0, aFaire.length - copies.length),
    ecartes: trop,
    erreurs: erreurs,
    envoi: env && env.success,
  };
  Logger.log('miroirDocuments : ' + JSON.stringify(m));
  return m;
}

/* Installe le declencheur horaire (idempotent). A lancer UNE FOIS a la main.
   Decale volontairement de miroirSyncComplet : deux taches lourdes qui
   partent ensemble se disputeraient la file d'execution. */
function miroirDocumentsInstallerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'miroirDocuments') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('miroirDocuments').timeBased().everyHours(1).create();
  Logger.log('Declencheur horaire installe sur miroirDocuments.');
}

/* ── OUBLI DES ANNEES RETIREES (2026-08-09.1) ────────────────────────────
   POURQUOI. Le miroir ne savait pas OUBLIER. `_miroirAjoute_`,
   `_miroirAjouteEnveloppe_` et `_miroirAjouteFichierDrive_` omettent la cle
   quand la source manque : elle n'est ni mise a jour, ni supprimee — elle
   reste servie telle quelle, sans fin. Constate le 09/08 : supprimer les
   onglets et les JSON 2027 ne retirait pas `planning_2027` du miroir, et les
   23 MARs auraient continue de voir des gardes fictives dans « prochaine
   garde » et « mes conges » — d'autant que dashboard.html demande
   `planning_{active+1}` a CHAQUE ouverture depuis la v1.30.2 (le seuil
   « des octobre » a saute le 08/08).

   PRINCIPE. Separer deux questions que le code confondait :
     « je n'ai pas reussi a lire »  → garder l'ancienne valeur (inchange) ;
     « cette donnee n'a plus lieu d'etre » → l'effacer.
   La seconde se tranche sur la STRUCTURE (quels onglets GARDES_{Y} existent),
   jamais sur le succes d'une lecture de donnees. Lister des onglets ne peut
   pas echouer a moitie : soit le classeur s'ouvre, soit il ne s'ouvre pas.

   GARDE-FOUS (un effacement automatique porte sur ce que lisent 23 MARs) :
     1. seules les cles PAR ANNEE sont effacables — jamais une liste commune
        (topos, protocoles, annuaire, secteurs, acces…) ;
     2. si le balayage d'UN des deux classeurs echoue, on n'efface RIEN ;
     3. l'annee active et l'annee de campagne ne sont jamais effacees, meme
        absentes du balayage ;
     4. plafond : au-dela de MIROIR_PURGE_MAX_ANNEES annees d'un coup, refus
        et trace — une annee qui sort est normal, cinq est un defaut.
   Envoyer `null` sur une cle deja absente est sans effet cote Worker. */
/* La fenetre de balayage part de la PLUS ANCIENNE annee reellement connue
   (jamais d'un nombre fixe : le projet date de 2026, remonter 5 ans en
   arriere designait 2021-2023, qui n'ont jamais existe — sept candidates
   pour un plafond de trois, donc refus systematique et fonction inerte.
   Defaut trouve au banc le 09/08, invisible en lecture). */
const MIROIR_PURGE_APRES       = 2;   // annees balayees au-dela de l'annee courante
const MIROIR_PURGE_MAX_ANNEES  = 3;   // plafond de securite par passe
const MIROIR_CLES_PAR_ANNEE    = ['planning_', 'affectations_', 'indispos_',
                                  'gardes_', 'stats_', 'joursferies_', 'liberal_'];

/* Balayage STRUCTUREL des deux classeurs. `complet` = les deux ont repondu.
   Volontairement distinct de `_miroirConstruireAnnees_` : celui-ci tolere
   l'echec en silence (c'est bon pour un selecteur, jamais pour un effacement). */
function _miroirAnneesAttendues_() {
  const vues = {};
  let complet = true;
  const balaye = function (ouvrir) {
    try {
      ouvrir().getSheets().forEach(function (sh) {
        const m = String(sh.getName()).match(/^GARDES_(\d{4})$/);
        if (m) vues[Number(m[1])] = true;
      });
    } catch (e) { complet = false; }
  };
  balaye(function () { return SpreadsheetApp.getActiveSpreadsheet(); });
  balaye(function () { return SpreadsheetApp.openById(ARCHIVE_SS_ID); });
  return { annees: vues, complet: complet };
}

/* Ajoute a `items` les cles a effacer (valeur null). Renvoie un compte rendu
   destine au journal — jamais une exception : le ménage ne doit pas empecher
   la poussee. */
function _miroirPurgerAnnees_(items, annee) {
  const att = _miroirAnneesAttendues_();
  if (!att.complet) return { refus: 'balayage incomplet (classeur inaccessible) — aucun effacement' };

  const gardees = {};
  Object.keys(att.annees).forEach(function (y) { gardees[Number(y)] = true; });
  gardees[Number(annee)] = true;                                   // garde-fou 3
  try { gardees[Number(getActiveYear())] = true; } catch (e) {}
  try { const iy = getIndisposYear(); if (iy) gardees[Number(iy)] = true; } catch (e) {}

  const connues = Object.keys(att.annees).map(Number);
  if (!connues.length) {
    return { refus: 'aucun onglet GARDES_{Y} dans les deux classeurs — structure anormale, aucun effacement' };
  }

  const base = Number(annee) || new Date().getFullYear();
  const debut = Math.min.apply(null, connues.concat([base]));
  const aEffacer = [];
  for (let y = debut; y <= base + MIROIR_PURGE_APRES; y++) {
    if (!gardees[y]) aEffacer.push(y);
  }
  if (aEffacer.length > MIROIR_PURGE_MAX_ANNEES) {
    return { refus: aEffacer.length + ' annees a effacer (plafond ' + MIROIR_PURGE_MAX_ANNEES
                    + ') — aucun effacement, verifier le classeur', annees: aEffacer };
  }

  const cles = [];
  aEffacer.forEach(function (y) {
    MIROIR_CLES_PAR_ANNEE.forEach(function (prefixe) {
      const cle = prefixe + y;
      if (!(cle in items)) { items[cle] = null; cles.push(cle); }   // jamais ecraser une cle construite
    });
  });
  return { annees: aEffacer, cles: cles.length };
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

/* (2026-08-05.10) ENVOI PAR PAQUETS. Le Worker refuse plus de 20 clés par
   appel — garde-fou volontaire contre les requêtes énormes. Or la synchro
   COMPLÈTE construit 11 clés globales + 5 par année consultable + 1 pour les
   indispos : 23 clés avec 2026 et 2027, et 28 dès que 2028 existera. Elle
   échouait donc EN BLOC (« 20 clés maximum », 05/08 17:42) — le filet horaire
   était hors service sans que rien ne le signale à l'écran.
   Découpage en lots de 20 : chaque lot part séparément, et le compte rendu
   agrège les résultats. Un lot en échec n'empêche pas les autres de passer,
   et le rapport dit lequel a échoué. */
const MIROIR_MAX_CLES = 20;

function _miroirEnvoyer_(items) {
  const jeton = PropertiesService.getScriptProperties().getProperty('MIROIR_PUSH_TOKEN');
  if (!jeton) return { success: false, error: 'MIROIR_PUSH_TOKEN absent des propriétés du script' };
  const cles = Object.keys(items || {});
  if (!cles.length) return { success: false, error: 'aucune clé à envoyer' };

  const lots = [];
  for (let i = 0; i < cles.length; i += MIROIR_MAX_CLES) {
    const lot = {};
    cles.slice(i, i + MIROIR_MAX_CLES).forEach(function (c) { lot[c] = items[c]; });
    lots.push(lot);
  }

  const echecs = [];
  let ecrites = 0;
  lots.forEach(function (lot, n) {
    const r = _miroirEnvoyerLot_(lot, jeton);
    if (r && r.success) ecrites += (typeof r.ecrites === 'number' ? r.ecrites : Object.keys(lot).length);
    else echecs.push('lot ' + (n + 1) + '/' + lots.length + ' : ' + ((r && r.error) || 'erreur inconnue'));
  });

  if (echecs.length) {
    return { success: false, error: echecs.join(' · '), lots: lots.length, ecrites: ecrites };
  }
  return { success: true, ecrites: ecrites, cles: cles.length, lots: lots.length };
}

function _miroirEnvoyerLot_(items, jeton) {
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


/* ═══ NOTIFICATIONS PUSH (12/08/2026 — phase 1) ══════════════════════
   Le GAS ne chiffre rien : il demande au Worker d'envoyer (jeton
   MIROIR_PUSH_TOKEN, le même que le miroir). JAMAIS bloquant : une
   notification qui rate ne doit jamais faire échouer le geste qui la
   déclenche — tout est avalé, le résultat est journalisé via Logger. */
function notifierPush_(titre, corps, url, cible) {
  try {
    const jeton = PropertiesService.getScriptProperties().getProperty('MIROIR_PUSH_TOKEN');
    if (!jeton) { Logger.log('notifierPush_ : MIROIR_PUSH_TOKEN absent'); return { success: false }; }
    /* (13/08/2026 — phase 3) `cible` optionnelle : { id: 'FROHLICH' } pour UNE
       personne, { role: 'admin' } pour le comité. Absente = tous les abonnés
       (comportement de la phase 1, inchangé — la génération annonce à tous). */
    const charge = { token: jeton, titre: titre, corps: corps, url: url };
    if (cible && (cible.id || cible.role)) charge.cible = cible;
    /* (pastille) Nombre à poser sur l'icône de l'app du destinataire —
       calculé par l'appelant, transporté tel quel jusqu'au téléphone. */
    if (cible && typeof cible.pastille === 'number') charge.pastille = cible.pastille;
    const rep = UrlFetchApp.fetch(MIROIR_URL + '/notif-envoyer', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(charge),
      muteHttpExceptions: true,
    });
    const r = JSON.parse(rep.getContentText());
    Logger.log('notifierPush_ : ' + rep.getResponseCode() + ' — ' + rep.getContentText().slice(0, 200));
    return r;
  } catch (err) {
    Logger.log('notifierPush_ : échec — ' + err.message);
    return { success: false, error: err.message };
  }
}

/* À lancer depuis l'éditeur Apps Script pour le test réel du canal. */
function testNotificationPush() {
  const r = notifierPush_('Test du canal', 'Si vous lisez ceci sur votre téléphone, le canal fonctionne.', './dashboard.html');
  Logger.log(JSON.stringify(r));
}
