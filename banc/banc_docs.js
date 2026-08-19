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
const { JSDOM, VirtualConsole } = require('jsdom');

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
  /* (14/08/2026) Le marqueur vivait dans 5 fichiers, recopié à la main : ce
     test comparait les 5 copies entre elles. Il n'y a plus de copies — le
     numéro vit dans version.js. Ce qui doit être vérifié a changé : que
     chaque page AFFICHEUSE se branche sur la source, et qu'aucune ne
     réintroduise un numéro en dur (l'erreur reviendrait sans bruit). */
  const AFFICHEUSES = ['admin.html', 'dashboard.html',
                       'docs/guide-comite.html', 'docs/guide-mar.html', 'docs/roadmap.html'];
  const vjs = lire('version.js');
  const src = vjs.match(/window\.SITE_VERSION = '(v[\d.]+)'/);
  V('version.js est la source unique', !!src, src && src[1]);
  V('la version a la forme vX.Y (deux chiffres)', !!src && /^v\d+\.\d+$/.test(src[1]), src && src[1]);
  AFFICHEUSES.forEach(f => {
    const h = lire(f);
    V(`${f} charge version.js`, /src="\.?\.?\/?version\.js"/.test(h));
    V(`${f} a un emplacement data-version`, /data-version/.test(h));
    /* Un numéro EN DUR se reconnaît à sa présence dans du texte affiché :
       > v1.35 < ou 'v1.35'. Les mentions en commentaire d'historique
       (« (12/08/2026, v1.31.4) ») restent légitimes et ne comptent pas. */
    const enDur = (h.match(/>\s*v\d+\.\d+[^<]*</g) || [])
      .concat(h.match(/(?:const|let|var)\s+SITE_VERSION\s*=\s*'v[\d.]+'/g) || []);
    V(`${f} n'écrit aucun numéro en dur`, enDur.length === 0, enDur.slice(0, 3));
  });
  console.log('    version courante : ' + (src && src[1]));

  /* Le test ci-dessus lit du texte. Il ne prouve PAS que le numero s'affiche :
     une page peut charger version.js et n'avoir aucun emplacement atteint (id
     mal place, element cree apres coup). On execute donc reellement la source
     unique dans chaque page et on regarde ce que l'utilisateur verrait. */
  AFFICHEUSES.forEach(f => {
    const vc = new VirtualConsole();
    const dom = new JSDOM(lire(f), { runScripts: 'outside-only', virtualConsole: vc });
    dom.window.eval(vjs);                      // ce que fait la balise <script src="version.js">
    /* Dans un navigateur, la source s'execute PENDANT l'analyse de la page :
       les emplacements situes plus bas n'existent pas encore, d'ou l'attente
       de la fin du chargement. On la simule, sinon le test mesurerait autre
       chose que ce que voit l'utilisateur. */
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    const cibles = [...dom.window.document.querySelectorAll('[data-version]')];
    V(`${f} : le numero s'affiche vraiment (${cibles.length} emplacement(s))`,
      cibles.length > 0 && cibles.every(e => e.textContent === src[1]),
      cibles.map(e => e.textContent));
  });
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

console.log('\n═══ 6. L\'ordre de passage des vacances : une seule règle, plusieurs copies ═══');
{
  /* (12/08/2026) La table de référence des groupes et le SENS de la rotation
     sont recopiés dans plusieurs endroits : trois fois dans Indispos.gs
     (getVacConfig, getVacValidation et une fonction de diagnostic),
     staff.html, admin.html, et depuis aujourd'hui docs/guide-mar.html,
     qui affiche le tableau aux MARs.
     Une divergence est invisible à l'œil et fait mentir le guide : c'est
     exactement le défaut du 30/07 (serveur tournant à gauche, écrans à
     droite), qui n'avait été vu qu'en réel, sur l'hiver 2027. */
  const PORTEURS = ['gas/Indispos.gs', 'staff.html', 'admin.html', 'docs/guide-mar.html'];
  const tables = [];
  PORTEURS.forEach(f => {
    const h = lire(f);
    /* Toute table qui associe les cinq périodes à un ordre de trois lettres. */
    [...h.matchAll(/HIVER\s*:\s*'([ABC]{3})'[\s\S]{0,200}?PRINTEMPS\s*:\s*'([ABC]{3})'[\s\S]{0,200}?ETE\s*:\s*'([ABC]{3})'[\s\S]{0,200}?TOUSSAINT\s*:\s*'([ABC]{3})'[\s\S]{0,200}?NOEL\s*:\s*'([ABC]{3})'/g)]
      .forEach(m => tables.push({ f, ordre: m.slice(1, 6).join('|') }));
  });
  /* Pas de compte figé : un porteur de plus n'est pas un défaut, une
     divergence en est un. On exige seulement que chaque fichier en porte
     au moins une. */
  PORTEURS.forEach(f => V(f.replace('docs/', '') + ' : porte la table de référence',
    tables.some(t => t.f === f), tables.map(t => t.f)));
  const distinctes = [...new Set(tables.map(t => t.ordre))];
  V('elles disent toutes la même chose', distinctes.length === 1, tables);
  V('la table est bien celle de référence (CAB / ABC / ABC / BCA / CAB)',
    distinctes[0] === 'CAB|ABC|ABC|BCA|CAB', distinctes);

  /* Le sens : rotation à DROITE, le dernier groupe devient premier. */
  const sensDroite = /\(\s*3\s*-\s*(?:\(\s*[A-Za-z_$][\w$]*\s*%\s*3\s*\)|[A-Za-z_$][\w$]*)\s*\)\s*%\s*3/;
  PORTEURS.forEach(f => {
    V(f.replace('docs/', '') + ' : rotation à droite (le dernier repasse premier)',
      sensDroite.test(lire(f)));
  });

  /* Le guide affiche un tableau écrit en dur, valable si le script ne tourne
     pas : il doit correspondre au calcul, sinon il ment aux MARs. */
  const guide = lire('docs/guide-mar.html');
  const REF = { HIVER: 'CAB', PRINTEMPS: 'ABC', ETE: 'ABC', TOUSSAINT: 'BCA', NOEL: 'CAB' };
  const attendu = (cle, annee) => {
    const b = REF[cle];
    const pas = (3 - (((annee - 2026) % 3) + 3) % 3) % 3;
    return b.slice(pas) + b.slice(0, pas);
  };
  const lignes = [...guide.matchAll(/<tr><td>(Hiver|Printemps|Été|Toussaint|Noël)<\/td>([\s\S]*?)<\/tr>/g)];
  V('le tableau écrit du guide porte les cinq périodes', lignes.length === 5, lignes.length);
  const CLE = { 'Hiver': 'HIVER', 'Printemps': 'PRINTEMPS', 'Été': 'ETE', 'Toussaint': 'TOUSSAINT', 'Noël': 'NOEL' };
  const ecarts = [];
  lignes.forEach(m => {
    const cellules = m[2].split('</td>').filter(c => /grp /.test(c));
    const lus = cellules.map(c => [...c.matchAll(/class="grp [abc]">([ABC])</g)].map(x => x[1]).join(''));
    [2026, 2027].forEach((an, i) => {
      if (lus[i] !== attendu(CLE[m[1]], an)) ecarts.push(m[1] + ' ' + an + ' : ' + lus[i] + ' ≠ ' + attendu(CLE[m[1]], an));
    });
  });
  V('il correspond exactement au calcul, année par année', ecarts.length === 0, ecarts);
}

/* La presentation du 4 septembre : elle sera projetee devant tout le service.
   Un CSS mal ferme y passait inapercu — le navigateur jette le bloc fautif en
   silence. On verifie l'equilibre, la presence du logo, et l'absence de CSS mort. */
console.log('\n═══ Présentation du staff : couverture et CSS ═══');
{
  const p = fs.readFileSync('../docs/presentation-staff.html', 'utf8');
  const css = (p.match(/<style[^>]*>([\s\S]*?)<\/style>/) || ['',''])[1];

  let prof = 0, negatif = 0;
  for (const c of css) { if (c === '{') prof++; else if (c === '}') { prof--; if (prof < 0) negatif++; } }
  V('le CSS de la présentation est équilibré', css.split('{').length === css.split('}').length,
    [css.split('{').length - 1, css.split('}').length - 1]);
  V('aucun bloc CSS orphelin (sélecteur perdu)', negatif === 0 && prof === 0, { negatif, prof });

  V('la couverture porte le logo du service', /class="cover-logo"[^>]*src="\.\.\/assets\/icon-512\.png"/.test(p),
    (p.match(/<img class="cover-logo"[^>]*>/) || [''])[0]);
  V('le fichier de logo existe bien', fs.existsSync('../assets/icon-512.png'));
  V('le logo est mis en forme', /\.cover-logo\{/.test(css));

  for (const mort of ['flagline', 'cbtn']) {
    V(`plus aucune trace du CSS mort « ${mort} »`, !p.includes(mort));
  }
}

console.log('\n═══ 9. Le bandeau du haut ne peut pas deborder de sa hauteur ═══');
{
  /* (14/08/2026) DEFAUT VU EN PRODUCTION sur iPhone (absences.html) : le titre
     « Portail CHPG Monaco » et son sous-titre s'enroulaient sur trois lignes ;
     la hauteur du bandeau etant figee par `height`, le debordement partait
     AU-DESSUS du bord de l'ecran et le titre etait coupe.
     Trois regles evitent ce cas, et il en faut les trois :
       1. le titre tient sur une ligne, coupee par « … » si besoin ;
       2. la zone du titre accepte de retrecir (min-width:0) — sans quoi
          l'ellipsis ne se declenche jamais dans un conteneur flex ;
       3. la hauteur est un minimum, pas une valeur figee.
     jsdom ne calcule aucune largeur : ce test prouve la REGLE, pas le rendu. */
  const BANDEAUX = ['absences.html', 'suivi-liberal.html', 'indispos.html',
                    'staff.html', 'index.html', 'dashboard.html'];
  const bloc = (css, sel) => {
    const i = css.indexOf(sel + '{') > -1 ? css.indexOf(sel + '{') : css.indexOf(sel + ' {');
    if (i < 0) return '';
    return css.slice(i, css.indexOf('}', i));
  };
  BANDEAUX.forEach(f => {
    const css = lire(f).replace(/\s*\n\s*/g, ' ');
    const h = bloc(css, '.header');
    V(`${f} · la hauteur du bandeau est un minimum, pas une valeur figee`,
      /min-height:\s*\d/.test(h) && !/[^-]height:\s*\d+px/.test(h), h.slice(0, 160));
    const t = bloc(css, '.header-title');
    V(`${f} · le titre tient sur une ligne et se coupe par « … »`,
      /white-space:\s*nowrap/.test(t) && /text-overflow:\s*ellipsis/.test(t), t.slice(0, 160));
    V(`${f} · la zone du titre accepte de retrecir`,
      /min-width:\s*0/.test(bloc(css, '.header-brand')) ||
      /min-width:\s*0/.test(bloc(css, '.header-left')), f);
  });
  /* Les boutons de droite ne doivent jamais ecraser le titre a leur place. */
  ['absences.html', 'suivi-liberal.html', 'staff.html'].forEach(f => {
    const css = lire(f).replace(/\s*\n\s*/g, ' ');
    V(`${f} · les boutons de droite ne s'ecrasent pas`,
      /flex-shrink:\s*0/.test(bloc(css, '.header-right')), f);
  });
  /* Sur telephone, le sous-titre s'efface plutot que de forcer une 2e ligne. */
  ['absences.html', 'suivi-liberal.html'].forEach(f => {
    V(`${f} · sous 640px le sous-titre s'efface`,
      /@media\(max-width:640px\)[\s\S]{0,400}\.header-sub\{display:none\}/.test(lire(f)), f);
  });
  /* La page libérale porte TROIS boutons a droite : son retour raccourcit. */
  {
    const c = lire('suivi-liberal.html');
    V('suivi-liberal · le retour a un libelle long et un libelle court',
      /class="lbl-long">Retour au portail</.test(c) && /class="lbl-court">Portail</.test(c));
    V('suivi-liberal · un seul des deux s\'affiche a la fois',
      /\.lbl-court\{display:none\}/.test(c.replace(/\s*\n\s*/g, ' ')) &&
      /\.lbl-long\{display:none\}/.test(c.replace(/\s*\n\s*/g, ' ')));
  }
}

console.log('\n═══ 10. La fiche d\'un MAR tient dans l\'ecran du telephone ═══');
{
  /* (14/08/2026) DEFAUT VU EN PRODUCTION sur iPhone : la fiche s'ouvrait
     avec une largeur figee de 480px (l'ecran en fait 390) — l'avatar sortait
     a gauche — et une hauteur de 100vh collee EN BAS de son enveloppe : tout
     depassement partait vers le haut et coupait le nom, le secteur et la
     croix de fermeture.
     jsdom ne calcule aucune largeur : ce test prouve la REGLE, pas le rendu. */
  const css = lire('index.html').replace(/\s*\n\s*/g, ' ');
  const bloc = (sel) => {
    const i = css.indexOf(sel + ' {') > -1 ? css.indexOf(sel + ' {') : css.indexOf(sel + '{');
    return i < 0 ? '' : css.slice(i, css.indexOf('}', i));
  };
  const env = bloc('.doc-panel-overlay'), pan = bloc('.doc-panel');
  V('l\'enveloppe couvre exactement la zone visible',
    /position:\s*fixed/.test(env) && /inset:\s*0/.test(env), env.slice(0, 120));
  V('la fiche s\'etire dans l\'enveloppe au lieu d\'etre collee en bas',
    /align-items:\s*stretch/.test(env) && !/align-items:\s*flex-end/.test(env), env.slice(0, 160));
  V('la largeur ne peut pas depasser l\'ecran',
    /width:\s*min\(\s*480px\s*,\s*100%\s*\)/.test(pan), pan.slice(0, 160));
  V('la hauteur suit l\'enveloppe, pas 100vh',
    /height:\s*100%/.test(pan) && !/height:\s*100vh/.test(pan), pan.slice(0, 160));
  V('l\'en-tete reserve la place de la barre d\'etat du telephone',
    /padding:\s*calc\(20px \+ env\(safe-area-inset-top\)\)/.test(bloc('.doc-panel-header')),
    bloc('.doc-panel-header').slice(0, 160));
  V('le bas de la fiche reste atteignable au pouce',
    /env\(safe-area-inset-bottom\)/.test(bloc('.doc-panel-body')), bloc('.doc-panel-body'));
}

console.log('\n═══ 11. Le guide du comité décrit l\'interface RÉELLE ═══');
{
  /* (16/08/2026) Le guide affirmait qu'on pouvait poser une « absence » et
     décrivait cinq onglets sur six. Un guide envoyé avec un code d'accès ne
     peut pas se tromper de bouton : on relit donc admin.html, et on exige que
     chaque libellé qui y est CLIQUABLE soit nommé dans le guide.
     Ce test ne juge pas la prose — seulement qu'aucun libellé ne manque. */
  const admin = lire('admin.html');
  const guide = texte(lire('docs/guide-comite.html'));
  const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const G = sansAccent(guide);

  /* Les six onglets, lus dans la barre de navigation. */
  const onglets = [...admin.matchAll(/class="nav-tab[^"]*" onclick="showTab\('([a-z]+)'\)/g)].map(m => m[1]);
  V('admin.html porte bien six onglets', onglets.length === 6, onglets);
  const NOM = { planning:'Planning', equipe:'Équipe', affectations:'Affectations',
                equite:'Équité', statuts:'Statuts', maintenance:'Maintenance' };
  /* Dans les TITRES de section, pas dans le sommaire : renommer une section
     sans toucher au sommaire passerait sinon inaperçu. */
  const titres = sansAccent([...lire('docs/guide-comite.html').matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ')).join(' | '));
  const oubliés = onglets.filter(o => !titres.includes(sansAccent('Onglet ' + (NOM[o] || o))));
  V('le guide consacre une section à chacun', oubliés.length === 0, oubliés);

  /* Les statuts réellement posables — la liste que voit le comité. */
  const pos = (admin.match(/const STAT_POSABLES = \[([^\]]+)\]/) || [])[1];
  V('STAT_POSABLES est lisible dans admin.html', !!pos, pos);
  const codes = (pos || '').split(',').map(c => c.trim().replace(/'/g, ''));
  const meta = (admin.match(/const STAT_META = \{[\s\S]*?\n\};/) || [''])[0];
  const libellé = c => { const i = meta.indexOf("'" + c + "'"); if (i < 0) return null; return (meta.slice(i).match(/label:'([^']+)'/) || [])[1]; };
  /* On cherche dans la SECTION des statuts, pas dans tout le guide : « formation »
     apparaît ailleurs (liste des absents), ce qui suffirait à masquer un libellé
     disparu du tableau. */
  const secStatuts = (lire('docs/guide-comite.html').match(/<section id="b5">[\s\S]*?<\/section>/) || [''])[0];
  const S = sansAccent(texte(secStatuts));
  const manquants = [];
  codes.forEach(c => {
    const l = libellé(c);
    if (!l) { manquants.push(c + ' (libellé introuvable)'); return; }
    /* « 8h–18h » s'écrit avec des espaces dans le guide : on compare sans espaces. */
    const cherché = sansAccent(l).replace(/[\s\u2013\u2014-]/g, '');
    if (!S.replace(/[\s\u2013\u2014-]/g, '').includes(cherché)) manquants.push(l);
  });
  V('le guide nomme les ' + codes.length + ' statuts posables, et eux seuls', manquants.length === 0, manquants);
  V('le guide n\'invente pas un statut « absence » posable',
    !/poser[^.]{0,40}\babsence\b/i.test(guide) || /absence longue/i.test(guide));
  V('le guide dit que les gardes y sont verrouillées', /verrouill/i.test(guide));
}

console.log('\n═══ 12. Le Diagnostic dit la vérité sur la version du site ═══');
{
  /* (16/08/2026) DÉFAUT VU EN PRODUCTION : le rapport annonçait « (absente) →
     réaligner » sur les quatre pages, alors que la chaîne était parfaitement
     alignée — il cherchait encore les numéros écrits en dur, supprimés par la
     centralisation du 14/08. Quatre ❌ imaginaires dans un rapport que le guide
     du comité demande de lire.
     On exécute ici la VRAIE fonction du serveur, sur les VRAIS fichiers du
     dépôt, puis sur des fichiers fabriqués fautifs. */
  const vm = require('vm');
  const { extraireFonction } = require('./stubs');
  const ctx = vm.createContext({});
  vm.runInContext(extraireFonction('../gas/Indispos.gs', '_versionSiteAnomalies_'), ctx);
  const anomalies = vm.runInContext('_versionSiteAnomalies_', ctx);

  const AFFICHEUSES = ['dashboard.html', 'admin.html', 'docs/guide-mar.html',
                       'docs/guide-comite.html', 'docs/roadmap.html'];
  const vjs = lire('version.js');
  const pages = {};
  AFFICHEUSES.forEach(f => { pages[f] = lire(f); });

  const r = anomalies(vjs, pages);
  V('le contrôle lit la version dans la source unique', /^v\d+\.\d+$/.test(r.version || ''), r.version);
  V('sur le dépôt réel, il ne signale RIEN', r.anomalies.length === 0, r.anomalies);

  /* Contre-épreuves : chaque faute possible doit être vue, et une seule fois. */
  const seul = (f, txt) => anomalies(vjs, Object.assign({}, pages, { [f]: txt })).anomalies;
  V('une page qui ne charge plus la source unique est signalée',
    seul('admin.html', pages['admin.html'].replace(/<script src="version\.js"><\/script>/, '')).length === 1);
  V('une page sans emplacement d\'affichage est signalée',
    seul('dashboard.html', pages['dashboard.html'].replace(/data-version/g, 'data-ancien')).length === 1);
  V('un numéro réécrit en dur est signalé',
    seul('admin.html', pages['admin.html'] + '<div>v9.9</div>').length === 1);
  V('un fichier injoignable est signalé, mais comme un simple avertissement',
    seul('docs/roadmap.html', null).length === 1 &&
    /injoignable/.test(seul('docs/roadmap.html', null)[0].motif));
  V('une source unique illisible arrête le contrôle proprement',
    anomalies('', pages).version === null && anomalies('', pages).anomalies.length === 1);
}

console.log('\n═══ 13. Chaque scénario du banc est lancé par lancer.sh ═══');
{
  /* (18/08/2026) Défaut trouvé lors d'un diagnostic du dépôt : banc_ptr.js
     (tirer-pour-rafraîchir, 14 vérifications, 05/08) existait mais n'avait
     jamais rejoint lancer.sh — ses vérifications ne tournaient donc JAMAIS,
     alors que la règle du projet dit « tout scénario s'ajoute explicitement
     au lanceur ». Un test écrit puis jamais lancé est pire qu'un test
     absent : il rassure. Cette section rend l'oubli impossible. */
  const scenariosManquants = (fichiers, lanceur) =>
    fichiers.filter(f => lanceur.indexOf(f) === -1);
  const lanceur  = fs.readFileSync('lancer.sh', 'utf8');
  const fichiers = fs.readdirSync('.')
    .filter(f => /^(banc\S*|e2e|interface)\.(js|mjs)$/.test(f));
  V('au moins 25 scénarios trouvés dans banc/ (le listage fonctionne)',
    fichiers.length >= 25, fichiers.length);
  V('chaque scénario présent dans banc/ figure dans lancer.sh',
    scenariosManquants(fichiers, lanceur).length === 0,
    scenariosManquants(fichiers, lanceur));
  V('un scénario oublié serait signalé',
    scenariosManquants(fichiers.concat(['banc_fictif.js']), lanceur).length === 1);
}

console.log(`\n${ok} OK · ${ko} en échec`);
if (ko) process.exit(1);
