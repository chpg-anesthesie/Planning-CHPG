/* ═══════════════════════════════════════════════════════════════════════
   MESURE DE PERFORMANCE — outil de diagnostic (28/07/2026)
   ═══════════════════════════════════════════════════════════════════════
   POURQUOI. Le 28/07, les executions doPost ont ete mesurees entre 2,1 et
   4,7 s (mediane 3,3 s) alors que la connexion du poste est a 88,9 Mbit/s
   et 12 ms de latence : le temps est passe DANS le serveur. Restait a
   savoir OU. Ce fichier repond a cette question par la mesure, et non par
   la lecture du code.

   USAGE. Editeur Apps Script -> choisir « mesurerPerf » dans la liste des
   fonctions -> Executer. Puis lire le « Journal d'execution ».
   Aucun deploiement n'est necessaire : une fonction lancee depuis
   l'editeur tourne immediatement.

   GARANTIE. LECTURE SEULE. Aucun setValue, aucun appendRow, aucun
   deleteRow, aucun envoi de mail. Rien n'est modifie dans le classeur.
   Les fonctions getSecteurs / getCsTemplate passent par un
   getOrCreate... : elles CREERAIENT l'onglet s'il manquait. Les deux
   existent en production, donc en pratique la lecture reste pure.

   CONFIDENTIALITE. Le code administrateur est lu pour mesurer checkCode,
   mais il n'est JAMAIS ecrit dans le journal.

   A SUPPRIMER une fois le diagnostic termine : ce fichier n'a aucun role
   en production et ne doit pas s'installer dans le paysage.
   ═══════════════════════════════════════════════════════════════════════ */

const GAS_VERSION_MESURE_PERF = '2026-07-28.1';

function mesurerPerf() {
  const lignes = [];
  let totalMesure = 0;

  // Chronometre une operation et retient sa duree. Renvoie ce que rend l'operation.
  function chrono(libelle, operation) {
    const debut = new Date().getTime();
    let resultat = null, souci = '';
    try { resultat = operation(); }
    catch (e) { souci = ' [ECHEC : ' + e.message + ']'; }
    const duree = new Date().getTime() - debut;
    totalMesure += duree;
    lignes.push(_perfLigne_(libelle, duree) + souci);
    return resultat;
  }

  const departGlobal = new Date().getTime();
  lignes.push('══ MESURE DE PERFORMANCE — ' + new Date().toLocaleString('fr-FR') + ' ══');
  lignes.push('');
  lignes.push('── 1. Cout d\'ouverture ────────────────────────────────');

  let ss = null;
  chrono('Ouverture du classeur', function () {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    return ss.getName();
  });

  lignes.push('');
  lignes.push('── 2. Lecture des onglets du chemin chaud ──────────────');

  // CONFIG lu DEUX fois de suite : la 2e mesure donne le cout d'une relecture
  // inutile. C'est exactement ce que fait aujourd'hui une requete (CONFIG est
  // relu par TEST_YEAR, checkCode, getIndisposYear et _indisposOuverte_).
  chrono('CONFIG — 1re lecture', function () {
    const sh = ss.getSheetByName('CONFIG');
    return sh ? sh.getDataRange().getValues().length : 0;
  });
  chrono('CONFIG — 2e lecture (identique)', function () {
    const sh = ss.getSheetByName('CONFIG');
    return sh ? sh.getDataRange().getValues().length : 0;
  });
  chrono('MEDECINS — lecture', function () {
    const sh = ss.getSheetByName('MEDECINS');
    return sh ? sh.getDataRange().getValues().length : 0;
  });

  lignes.push('');
  lignes.push('── 3. Ce que coute un login (toutes les pages) ─────────');

  // Le code admin sert a mesurer checkCode dans ses conditions reelles.
  // Il n'est jamais journalise.
  let codeAdmin = '';
  try {
    const cfg = ss.getSheetByName('CONFIG').getDataRange().getValues();
    for (let r = 1; r < cfg.length; r++) {
      if (String(cfg[r][0]).trim() === 'ADMIN_CODE') { codeAdmin = String(cfg[r][1]).trim(); break; }
    }
  } catch (e) {}

  chrono('getActiveYear()', function () { return getActiveYear(); });
  chrono('checkCode() — role admin', function () { return codeAdmin ? !!checkCode(codeAdmin) : 'code absent'; });
  chrono('getIndisposYear()', function () { return getIndisposYear(); });
  chrono('_indisposOuverte_()', function () { return _indisposOuverte_(); });

  lignes.push('');
  lignes.push('── 4. Ce que coute l\'ouverture d\'admin ─────────────────');

  chrono('_buildMedecins_()', function () { const m = _buildMedecins_(); return (m.medecins || []).length; });
  chrono('_buildOverrides_()', function () { return _buildOverrides_().total; });
  chrono('getSecteurs()', function () { return getSecteurs().length; });
  chrono('getCsTemplate()', function () { return (getCsTemplate().types || []).length; });

  lignes.push('');
  lignes.push('── 5. Lecture des fichiers du Drive ────────────────────');

  const annee = getActiveYear();
  chrono('readPlanningFromDrive(planning_' + annee + ')', function () {
    const brut = readPlanningFromDrive('planning_' + annee + '.json');
    return brut ? Math.round(brut.length / 1024) + ' Ko' : 'absent';
  });
  chrono('  puis JSON.parse du meme fichier', function () {
    const brut = readPlanningFromDrive('planning_' + annee + '.json');
    return brut ? (JSON.parse(brut).months || []).length + ' mois' : 'absent';
  });
  chrono('readPlanningFromDrive(affectations_' + annee + ')', function () {
    const brut = readPlanningFromDrive('affectations_' + annee + '.json');
    return brut ? Math.round(brut.length / 1024) + ' Ko' : 'absent';
  });

  lignes.push('');
  lignes.push('── 6. Taille du classeur ───────────────────────────────');

  chrono('Inventaire des onglets', function () {
    const feuilles = ss.getSheets();
    let cellules = 0;
    const detail = [];
    feuilles.forEach(function (sh) {
      const c = sh.getMaxRows() * sh.getMaxColumns();
      cellules += c;
      detail.push({ nom: sh.getName(), lignes: sh.getMaxRows(), colonnes: sh.getMaxColumns(), cellules: c });
    });
    detail.sort(function (a, b) { return b.cellules - a.cellules; });
    lignes.push('   ' + feuilles.length + ' onglets · ' + cellules.toLocaleString('fr-FR') + ' cellules au total');
    lignes.push('   Les 8 plus gros :');
    detail.slice(0, 8).forEach(function (d) {
      lignes.push('     · ' + _perfCadre_(d.nom, 24) + d.lignes + ' x ' + d.colonnes
                  + '  = ' + d.cellules.toLocaleString('fr-FR') + ' cellules');
    });
    return feuilles.length;
  });

  const totalReel = new Date().getTime() - departGlobal;

  lignes.push('');
  lignes.push('══ SYNTHESE ═══════════════════════════════════════════');
  lignes.push('Total des operations chronometrees : ' + totalMesure + ' ms');
  lignes.push('Duree totale de cette fonction     : ' + totalReel + ' ms');
  lignes.push('');
  lignes.push('A COMPARER avec la colonne « Duree » de l\'onglet Executions');
  lignes.push('pour CETTE execution. L\'ecart entre les deux est le cout FIXE');
  lignes.push('de demarrage : compilation des ~490 Ko de code des 5 fichiers,');
  lignes.push('liaison au classeur, et le code global d\'Indispos.gs ligne 9');
  lignes.push('(TEST_YEAR = getActiveYear()), qui joue avant toute fonction.');
  lignes.push('');
  lignes.push('Si cet ecart est GROS : le probleme est le demarrage, pas les');
  lignes.push('lectures — et optimiser les lectures ne servira presque a rien.');

  Logger.log(lignes.join('\n'));
  return lignes.join('\n');
}

// Aligne le libelle sur une largeur fixe pour que les durees soient lisibles en colonne.
function _perfLigne_(libelle, duree) {
  return '   ' + _perfCadre_(libelle, 42) + String(duree).padStart(6, ' ') + ' ms';
}
function _perfCadre_(texte, largeur) {
  let s = String(texte);
  if (s.length > largeur) s = s.slice(0, largeur - 1) + '…';
  while (s.length < largeur) s += ' ';
  return s;
}
/* ═══════════════════════════════════════════════════════════════════════
   MESURE DU DRIVE — complement de mesure_perf.gs (28/07/2026)
   ═══════════════════════════════════════════════════════════════════════
   POURQUOI. Apres les correctifs A, B et C, la lecture des deux fichiers
   JSON du Drive represente 53 % du temps serveur mesure (693 + 616 + 630
   = 1 939 ms). C'est desormais le premier poste. Avant de le toucher, il
   faut savoir ce qui coute : CHERCHER le fichier, ou le LIRE.

   Ce que fait readPlanningFromDrive aujourd'hui, par fichier :
     1. DriveApp.getFilesByName(nom) — une RECHERCHE dans tout le Drive
     2. pour chaque resultat, f.getParents() — un appel Drive de plus,
        pour verifier que le fichier est bien dans le bon dossier
     3. f.getLastUpdated() sur chacun, pour trier
     4. f.getBlob().getDataAsString() — le telechargement proprement dit
   Si l'essentiel du temps est en 1-3, memoriser l'identifiant du fichier
   supprimerait la recherche. Si c'est en 4, il n'y a rien a gagner : c'est
   le poids du planning.

   USAGE. Editeur Apps Script -> choisir « mesurerDrive » -> Executer,
   puis lire le Journal d'execution.

   GARANTIE. LECTURE SEULE. Aucune creation, aucune modification, aucune
   mise a la corbeille. Rien n'est ecrit, ni dans le Drive ni dans le
   classeur.
   ═══════════════════════════════════════════════════════════════════════ */

const GAS_VERSION_MESURE_DRIVE = '2026-07-28.1';

function mesurerDrive() {
  const journal = [];
  const annee = getActiveYear();

  journal.push('══ MESURE DU DRIVE — ' + new Date().toLocaleString('fr-FR') + ' ══');

  ['planning_' + annee + '.json', 'affectations_' + annee + '.json'].forEach(function (nom) {
    journal.push('');
    journal.push('── ' + nom + ' ──');

    let t = new Date().getTime();
    const trouves = [];
    const it = DriveApp.getFilesByName(nom);
    while (it.hasNext()) trouves.push(it.next());
    journal.push(_mdLigne_('1. Recherche par nom dans le Drive', new Date().getTime() - t)
                 + '   (' + trouves.length + ' resultat(s))');

    t = new Date().getTime();
    let retenu = null;
    trouves.forEach(function (f) {
      if (f.isTrashed && f.isTrashed()) return;
      const ps = f.getParents();
      while (ps.hasNext()) {
        if (ps.next().getName() === DRIVE_JSON_FOLDER) { if (!retenu) retenu = f; break; }
      }
    });
    journal.push(_mdLigne_('2. Verification du dossier parent', new Date().getTime() - t));

    if (!retenu) { journal.push('   fichier absent du dossier ' + DRIVE_JSON_FOLDER); return; }

    t = new Date().getTime();
    const idem = retenu.getId();
    const poids = retenu.getSize();
    journal.push(_mdLigne_('3. Lecture des metadonnees (id, taille)', new Date().getTime() - t)
                 + '   (' + Math.round(poids / 1024) + ' Ko)');

    t = new Date().getTime();
    const contenu = retenu.getBlob().getDataAsString();
    journal.push(_mdLigne_('4. Telechargement du contenu', new Date().getTime() - t)
                 + '   (' + Math.round(contenu.length / 1024) + ' Ko)');

    // LA question : si l'identifiant etait deja connu, que resterait-il ?
    t = new Date().getTime();
    const direct = DriveApp.getFileById(idem).getBlob().getDataAsString();
    journal.push(_mdLigne_('5. MEME LECTURE par identifiant direct', new Date().getTime() - t)
                 + '   (' + Math.round(direct.length / 1024) + ' Ko)');

    t = new Date().getTime();
    JSON.parse(contenu);
    journal.push(_mdLigne_('6. JSON.parse', new Date().getTime() - t));
  });

  journal.push('');
  journal.push('══ LECTURE DU RESULTAT ═══════════════════════════════');
  journal.push('Comparer la ligne 5 a la somme des lignes 1+2+3+4.');
  journal.push('Si 5 est NETTEMENT plus rapide : memoriser l\'identifiant du');
  journal.push('fichier fait gagner la difference, sur chaque lecture, sur');
  journal.push('toutes les pages qui affichent le planning.');
  journal.push('Si 5 est du meme ordre : le temps est dans le telechargement');
  journal.push('lui-meme, et il n\'y a rien a optimiser de ce cote-la.');
  journal.push('');
  journal.push('⚠️ Les lignes 4 et 5 lisent le MEME fichier a la suite : le');
  journal.push('second passage peut beneficier d\'un cache cote Google. Relancer');
  journal.push('la fonction une deuxieme fois pour verifier la stabilite.');

  Logger.log(journal.join('\n'));
  return journal.join('\n');
}

function _mdLigne_(libelle, duree) {
  let s = String(libelle);
  while (s.length < 42) s += ' ';
  return '   ' + s + String(duree).padStart(6, ' ') + ' ms';
}
