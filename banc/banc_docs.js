/* ═══════════════════════════════════════════════════════════════════════
   BANC DOCUMENTAIRE — 2026-08-10
   Reprend à la machine des vérifications que le cahier de tests demandait
   À LA MAIN, et qui sont fastidieuses autant qu'automatisables :
     · T150 — concordance des numéros de version entre les pages et les guides
     · T151 — tous les liens internes des guides pointent vers quelque chose
   Plus deux règles du projet qui n'étaient contrôlées par rien :
     · le vocabulaire technique interdit dans les guides destinés aux MARs
       et au comité (règle : « toujours le geste, jamais le mécanisme ») ;
     · la présence du bloc « En 2 minutes » que ces guides doivent porter.

   POURQUOI CE FICHIER. Le cahier comptait 179 tests dont 144 à faire à la
   main. Chaque test repris ici est du temps rendu — et surtout une
   vérification qui, faite par la machine, ne sera plus jamais oubliée.
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

let ok = 0, ko = 0;
function V(nom, cond, detail) {
  if (cond) { ok++; console.log('  ✓ ' + nom); }
  else { ko++; console.log('  ✗ ' + nom + (detail !== undefined ? '  → ' + JSON.stringify(detail).slice(0, 240) : '')); }
}
const lire = (f) => fs.readFileSync(path.join('..', f), 'utf8');
const texte = (h) => h.replace(/<!--[\s\S]*?-->/g, ' ')
                      .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ');

const GUIDES = ['docs/guide-mar.html', 'docs/guide-comite.html'];
const PAGES  = ['index.html', 'dashboard.html', 'admin.html', 'indispos.html', 'staff.html'];
const DOCS   = fs.readdirSync('../docs').filter(f => f.endsWith('.html')).map(f => 'docs/' + f);

console.log('\n═══ 1. Concordance des numéros de version (remplace T150) ═══');
{
  /* Le marqueur vit dans 5 fichiers. Une montée de version oubliée quelque
     part est invisible à l'œil et fausse tout diagnostic ultérieur. */
  const PORTEURS = ['admin.html', 'dashboard.html',
                    'docs/guide-comite.html', 'docs/guide-mar.html', 'docs/roadmap.html'];
  const versions = {};
  PORTEURS.forEach(f => {
    const h = lire(f);
    /* On prend la version la PLUS HAUTE du fichier : admin.html cite des
       versions anciennes dans son historique de nouveautés, c'est normal. */
    const toutes = (h.match(/v1\.\d+(?:\.\d+)?/g) || []);
    const cle = (v) => v.slice(1).split('.').map(Number).concat([0]).slice(0, 3);
    toutes.sort((a, b) => { const x = cle(a), y = cle(b);
      return (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]); });
    versions[f] = toutes[toutes.length - 1] || '(aucune)';
  });
  const uniques = [...new Set(Object.values(versions))];
  V('les 5 porteurs annoncent la MÊME version', uniques.length === 1, versions);
  V('la version a bien la forme vX.Y ou vX.Y.Z', /^v\d+\.\d+(\.\d+)?$/.test(uniques[0]), uniques);
  console.log('    version courante : ' + uniques[0]);
}

console.log('\n═══ 2. Liens internes et liens de page (remplace T151) ═══');
{
  const casses = [];
  const ancresManquantes = [];
  DOCS.concat(PAGES).forEach(f => {
    let h; try { h = lire(f); } catch (e) { return; }
    const ids = new Set([...h.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
    const noms = new Set([...h.matchAll(/name="([^"]+)"/g)].map(m => m[1]));
    [...h.matchAll(/href="#([^"]+)"/g)].forEach(m => {
      if (m[1] && m[1] !== 'top' && !ids.has(m[1]) && !noms.has(m[1])) ancresManquantes.push(f + ' → #' + m[1]);
    });
    [...h.matchAll(/href="([A-Za-z0-9_\-./]+\.html)"/g)].forEach(m => {
      const rel = m[1];
      if (/^https?:/.test(rel)) return;
      const depuis = path.dirname(path.join('..', f));
      if (!fs.existsSync(path.join(depuis, rel)) && !fs.existsSync(path.join('..', rel))) casses.push(f + ' → ' + rel);
    });
  });
  V('aucun lien vers une page inexistante', casses.length === 0, casses.slice(0, 10));
  V('aucune ancre interne pointant dans le vide', ancresManquantes.length === 0, ancresManquantes.slice(0, 10));
  console.log('    ' + (DOCS.length + PAGES.length) + ' fichiers inspectés');
}

console.log('\n═══ 3. Vocabulaire technique interdit dans les guides ═══');
{
  /* Règle du projet : les guides destinés aux MARs et au comité expliquent
     LE GESTE, jamais le mécanisme. Les mots ci-dessous n'ont rien à y faire.

     EXCEPTIONS ASSUMÉES (guide-comité) : le Diagnostic système affiche
     littéralement les intitulés « Miroir », « Journal d'intentions » et
     « Worker » à l'écran. Le guide DOIT les nommer pour être utilisable —
     interdire le mot rendrait le tableau de lecture incompréhensible.
     La vraie correction serait de renommer ces lignes DANS le Diagnostic ;
     tant que ce n'est pas fait, l'exception est ici, visible et datée. */
  const INTERDITS = ['miroir', 'cloudflare', 'apps script', 'worker',
                     'journal d\'intentions', 'base64', 'endpoint', 'payload'];
  const EXCEPTIONS = {
    'docs/guide-comite.html': ['miroir', 'worker', 'journal d\'intentions'],
  };
  GUIDES.forEach(f => {
    const t = texte(lire(f)).toLowerCase();
    const trouves = INTERDITS.filter(m => {
      if ((EXCEPTIONS[f] || []).includes(m)) return false;
      /* limites de mot : « GAS » ne doit pas matcher « monégasques » */
      const re = new RegExp('(^|[^a-zà-ÿ])' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-zà-ÿ])', 'i');
      return re.test(t);
    });
    V(f.replace('docs/', '') + ' : aucun terme technique interdit', trouves.length === 0, trouves);
  });
  V('les exceptions sont limitées au guide comité et au vocabulaire du Diagnostic',
    Object.keys(EXCEPTIONS).length === 1 && EXCEPTIONS['docs/guide-comite.html'].length === 3);
}

console.log('\n═══ 4. Forme des guides ═══');
{
  GUIDES.forEach(f => {
    const t = texte(lire(f));
    V(f.replace('docs/', '') + ' : porte un bloc « En 2 minutes »', /En 2 minutes/i.test(t));
    V(f.replace('docs/', '') + ' : dépasse 3 000 caractères (pas une coquille vide)', t.length > 3000, t.length);
  });
}

console.log('\n═══ 5. Le cahier de tests ne décrit pas de fonctions disparues ═══');
{
  const cahier = texte(lire('docs/cahier-de-tests.html'));
  const admin = lire('admin.html');
  /* Piège du 09/08 et du 10/08 : la documentation décrivait des chantiers
     que la production avait refermés, et un écran qui n'existait plus. */
  V('le cahier ne renvoie pas vers l\'écran « Paramètres » (supprimé)',
    !/onglet Param[eè]tres/i.test(cahier));
  V('l\'écran « Paramètres » a bien disparu d\'admin.html',
    !/id="parametresView"/.test(admin) && !/function viewParametres/.test(admin));
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
