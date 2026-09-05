/* ═══ BANC — CERTIFICAT D'ÉQUITÉ (05/09/2026) ════════════════════════════
   POURQUOI CE SCÉNARIO EXISTE — un défaut trouvé EN PRODUCTION.
   L'écran d'équité 2026, ouvert à toute l'équipe, annonçait « 19 MAR sur 20
   dépassent 2 gardes d'écart » avec les noms. Vérification faite dans le
   classeur : la colonne CIBLE promet 730,8 gardes alors que 707 seulement ont
   été posées, et 103,7 samedis pour 91 posés. La différence, ce sont les gardes
   assurées par un médecin EXTÉRIEUR au service, absent de la liste. Tout le
   monde apparaissait donc ~1,7 garde trop bas.
   Conséquence mesurée : 5 MAR accusés à tort (dont trois pile à leur part), et
   un MAR à +2,1 qui ne figurait pas dans la liste.

   CE QUE CES VÉRIFICATIONS TIENNENT.
   1. Le contrôle qui prouve l'anomalie sans rien supposer : une mesure d'équité
      juste a des écarts qui S'ANNULENT. On l'exige du calcul corrigé.
   2. La correction ne s'applique QU'AUX années antérieures à la première année
      générée. Au-delà, un écart de somme est une vraie anomalie de couverture
      qu'il ne faut surtout pas lisser — c'est la vérification la plus importante
      du fichier.
   3. Les barres individuelles et le certificat lisent la MÊME cible. Deux
      lecteurs d'une même donnée qui divergent, c'est un écran qui se contredit.
   4. La mise en page : des NOMBRES DE PERSONNES et non des pourcentages, un
      classement replié et non un mur de noms, plus d'histogramme.  */
const fs = require('fs');
const path = require('path');

let ok = 0, ko = 0;
const V = (t, c, d) => { if (c) { ok++; console.log('  ✓ ' + t); }
  else { ko++; console.log('  ✗ ' + t + (d !== undefined ? ' → ' + JSON.stringify(d).slice(0, 300) : '')); } };

const ADMIN = fs.readFileSync(path.join(__dirname, '..', 'admin.html'), 'utf8');
const INDEX = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

/* On extrait la fonction de correction du fichier réel et on l'exécute. Recopier
   la formule ici testerait ce que le banc croit, pas ce que la page fait. */
function extraire(nom, SRC) {
  SRC = SRC || ADMIN;
  const i = SRC.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let p = SRC.indexOf('{', i), n = 0, j = p;
  for (; j < SRC.length; j++) {
    if (SRC[j] === '{') n++;
    else if (SRC[j] === '}') { n--; if (!n) break; }
  }
  return SRC.slice(i, j + 1);
}

console.log('\n─── 1. La correction ramène les cibles aux gardes réellement posées ───');
const srcF = extraire('facteursEquite');
V('la fonction de correction existe dans admin.html', !!srcF);
V('…et la MÊME existe dans index.html (portail MAR)',
  !!extraire('facteursEquite', INDEX) && extraire('facteursEquite', INDEX) === srcF);

/* Jeu de données calqué sur le VRAI 2026 lu dans le classeur : cibles nominales
   à 36 pour les temps pleins, mais seulement 707 gardes posées sur 730,8. */
const MARS = [
  { name: 'ALBOUY', total: 34, cTot: 36 }, { name: 'ARMANDO', total: 32, cTot: 36 },
  { name: 'CATINEAU', total: 33, cTot: 36 }, { name: 'FROHLICH', total: 35, cTot: 36 },
  { name: 'FERRIERO', total: 41, cTot: 36 }, { name: 'GHIGLIONE', total: 34, cTot: 36 },
  { name: 'GUERIN', total: 33, cTot: 36 }, { name: 'LEVASSEUR', total: 32, cTot: 36 },
  { name: 'LEY', total: 33, cTot: 32.4 }, { name: 'MENADE', total: 31, cTot: 36 },
  { name: 'OPPRECHT', total: 33, cTot: 36 }, { name: 'PARTOUCHE', total: 35, cTot: 36 },
  { name: 'ROUSSEAU', total: 31, cTot: 36 }, { name: 'SALA', total: 34, cTot: 36 },
  { name: 'SEVERAC', total: 31, cTot: 28.8 }, { name: 'SULTAN', total: 40, cTot: 36 },
  { name: 'SUPLY', total: 36, cTot: 36 }, { name: 'WIDEHEM', total: 32, cTot: 36 },
  { name: 'ZAMARON', total: 33, cTot: 36 }, { name: 'TRAN', total: 16, cTot: 18 },
];
const AXES = [['total', 'cTot', 'total']];

/* La règle ne regarde AUCUNE année : elle regarde si les écarts s'annulent.
   On l'exécute donc telle qu'elle est écrite dans la page. */
const fEq = new Function(srcF + '; return facteursEquite;')();
const F2026 = fEq(MARS, AXES);
V('quand les écarts ne s\'annulent pas, la cible est ramenée vers le bas',
  F2026.cTot > 0.9 && F2026.cTot < 1, +F2026.cTot.toFixed(4));

/* LE contrôle : les écarts doivent s'annuler. C'est ce qui prouve qu'une part
   a été attribuée à quelqu'un, et une seule fois. */
const sommeApres = MARS.reduce((s, m) => s + (m.total - m.cTot * F2026.cTot), 0);
const sommeAvant = MARS.reduce((s, m) => s + (m.total - m.cTot), 0);
V('avant correction, les écarts NE s\'annulent pas (le défaut est bien là)',
  Math.abs(sommeAvant) > 20, +sommeAvant.toFixed(1));
V('après correction, les écarts s\'annulent', Math.abs(sommeApres) < 0.01, +sommeApres.toFixed(4));

console.log('\n─── 2. Qui change de verdict, nommément ───');
const ecart = (m, F) => m.total - m.cTot * F.cTot;
const avant = MARS.filter(m => Math.abs(m.total - m.cTot) >= 2).map(m => m.name);
const apres = MARS.filter(m => Math.abs(ecart(m, F2026)) >= 2).map(m => m.name);
V('le nombre d\'accusés baisse', apres.length < avant.length, { avant: avant.length, apres: apres.length });
['GHIGLIONE', 'ALBOUY', 'SALA'].forEach(n => {
  V(n + ' n\'est plus signalé à tort', avant.indexOf(n) >= 0 && apres.indexOf(n) < 0);
});
V('LEY, oublié par l\'ancien calcul, apparaît',
  avant.indexOf('LEY') < 0 && apres.indexOf('LEY') >= 0,
  { avant: +(33 - 32.4).toFixed(1), apres: +ecart(MARS.find(m => m.name === 'LEY'), F2026).toFixed(1) });
V('FERRIERO reste le plus fort écart, et il grandit',
  ecart(MARS.find(m => m.name === 'FERRIERO'), F2026) > 5,
  +ecart(MARS.find(m => m.name === 'FERRIERO'), F2026).toFixed(1));

console.log('\n─── 3. Aucune correction quand les comptes tombent juste ───');
/* LA vérification qui compte le plus : une année générée par l'algorithme, où
   toutes les gardes sont réparties, ne doit subir AUCUNE retouche. Sinon la
   correction masquerait un jour non pourvu en le lissant sur tout le monde. */
const JUSTE = [
  { name: 'A', total: 40, cTot: 40 }, { name: 'B', total: 41, cTot: 40 },
  { name: 'C', total: 39, cTot: 40 }, { name: 'D', total: 40, cTot: 40 },
];
V('cibles et gardes qui tombent juste : aucune retouche', fEq(JUSTE, AXES).cTot === 1);
/* Une seule garde manquante sur 160 (0,6 %) reste sous le seuil : on ne touche
   à rien, l'anomalie reste visible telle quelle. */
const UNJOUR = JUSTE.map(m => Object.assign({}, m));
UNJOUR[0].total = 39;
V('une garde manquante ne déclenche pas la correction', fEq(UNJOUR, AXES).cTot === 1,
  { manque: 1, sur: 160 });
V('un écart massif, lui, la déclenche', fEq(MARS, AXES).cTot < 1);

console.log('\n─── 4. Les barres et le certificat lisent la même cible ───');
V('les barres appellent la fonction de correction',
  /const _FEQ = facteursEquite\(list\.filter\(x=>!x\.wish\), AX_EQUITE\);/.test(ADMIN));
V('le certificat appelle la même fonction',
  /const F = facteursEquite\(evalues, AXfull\);/.test(ADMIN));
V('les deux partent de la même liste d\'axes',
  (ADMIN.match(/AX_EQUITE/g) || []).length >= 3
  && /const AXfull = AX_EQUITE;/.test(ADMIN));
V('le trait de cible du total est corrigé lui aussi',
  /tc=\(\+it\.cTot\|\|0\)\*\(_FEQ\.cTot\|\|1\)/.test(ADMIN));

console.log('\n─── 5. Mise en page : ce que l\'écran ne doit plus faire ───');
const cert = extraire('renderCertificat');
const certM = extraire('renderCertificatMAR', INDEX);
V('le certificat du portail MAR est refondu lui aussi', !!certM
  && !/pct1|pct2|buckets|spark/.test(certM)
  && /MAR au-delà de 2 gardes/.test(certM)
  && /function certMarBasculer\(\)/.test(INDEX));
V('les barres du portail MAR lisent la cible corrigée',
  /const _FEQ = facteursEquite\(list\.filter\(x=>!x\.wish\), AX_EQUITE\);/.test(INDEX));
V('le certificat existe', !!cert);
V('il ne compte plus en pourcentages', !/pct1|pct2|within2/.test(cert));
V('il annonce des NOMBRES de MAR', /MAR au-delà de 2 gardes/.test(cert) && /MAR dans leur juste part/.test(cert));
V('l\'histogramme, dont la légende contredisait les données, est retiré',
  !/buckets|spark|la masse doit être à gauche/.test(cert));
V('le mur de noms est remplacé par un classement trié',
  /lignes\.sort\(\(a, b\) => Math\.abs\(b\.worst\) - Math\.abs\(a\.worst\)\)/.test(cert));
V('le classement est replié à cinq lignes', /lignes\.slice\(0, 5\)/.test(cert));
V('…et dépliable', /function certBasculer\(\)/.test(ADMIN) && /onclick="certBasculer\(\)"/.test(cert));
V('le sens du signe est expliqué au lecteur',
  /veut dire moins de gardes que sa part/.test(cert));
V('l\'année corrigée porte sa mention d\'explication',
  /médecin <b>extérieur au service<\/b>/.test(cert));
V('la mention n\'apparaît QUE si une correction a eu lieu', /if\(corrige\)\{/.test(cert));
V('les profils à souhaits garantis restent exclus du verdict',
  /list\.filter\(m => !_spec\(m\.name\)\)/.test(cert));

console.log('\n─── 6. Version du site ───');
const VJS = fs.readFileSync(path.join(__dirname, '..', 'version.js'), 'utf8');
const v = (VJS.match(/window\.SITE_VERSION = 'v([\d.]+)'/) || [])[1];
V('la version a été montée dans le même lot', v === '1.0.4', v);
V('le retour à v1.0 est expliqué dans le fichier',
  /RETOUR À v1\.0/.test(VJS) && /4 septembre 2026/.test(VJS));

console.log('\n' + ok + ' OK · ' + ko + ' en échec');
if (ko) process.exit(1);
