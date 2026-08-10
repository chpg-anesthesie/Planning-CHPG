/* ═══════════════════════════════════════════════════════════════════════
   MIROIR CHPG — Worker Cloudflare
   Version : miroir 2026-08-05.7

   RÔLE. Servir en ~150 ms les données de lecture du portail (planning,
   affectations, secteurs, années, config admin, indispos), déposées ici
   par le Google Apps Script à chaque écriture. Le Worker ne calcule
   rien : il authentifie, filtre, et sert.

   DEUX GUICHETS :
     POST /push  — réservé au GAS, sur présentation du jeton PUSH_TOKEN
                   (secret Cloudflare, jamais dans ce fichier ni dans le
                   dépôt). Dépose ou supprime des clés dans le KV.
     POST /read  — réservé aux codes d'accès valides. Authentifie par
                   EMPREINTE SHA-256 (les codes en clair ne sont jamais
                   stockés chez Cloudflare), applique les règles de rôle,
                   renvoie identité + données demandées.

   RÈGLES DE RÔLE (reprises de _routeRequete_ dans Indispos.gs) :
     - secrétariat : AUCUNE lecture miroir (le planning contient les
       codes d'absence bruts ; règle du GAS conservée à l'identique).
     - MAR   : annees, secteurs, planning_{Y}, affectations_{Y},
               indispos_{Y} FILTRÉES à ses propres lignes.
     - admin : tout, indispos complètes.

   SÉCURITÉ :
     - Aucun code d'accès en clair : acces.json ne contient que des
       empreintes SHA-256, calculées et déposées par le GAS.
     - Aucun secret dans ce fichier : PUSH_TOKEN vit dans les secrets
       du Worker (Settings → Variables and Secrets).
     - Aucune donnée financière ici : le relevé libéral, les marges et
       PARAMETRES ne transitent JAMAIS par le miroir (liste rouge).
     - Cache-Control: no-store — rien n'est mis en cache par les
       navigateurs ou proxys intermédiaires.

   CONTRAT DES CLÉS KV (le GAS est seul écrivain, il fait foi) :
     acces               {"users":[{"h":"<sha256>","id","role","name",
                          "initials","prenom","liberal","rpps"}],
                          "indisposYear":N,"indisposOuverte":bool,"t":ms}
     annees              {"active":2026,"annees":[{"annee","archivee"}]}
     secteurs            (sortie de getSecteurs, telle quelle)
     config_admin        {"medecins":[...],"overrides":...,"seuils":...,
                          "csTemplate":...,"anneeStatsFiables":N,
                          "anneeSuivante":bool}          — admin seul
     planning_{Y}        (contenu de planning_{Y}.json du Drive)
     affectations_{Y}    (contenu de affectations_{Y}.json du Drive)
     indispos_{Y}        {"parMar":{"ID":[...] }}        — filtré par rôle
   Chaque valeur est une chaîne JSON. Clé absente = donnée pas encore
   poussée : le client se replie sur le circuit GAS.
   ═══════════════════════════════════════════════════════════════════ */

const VERSION = 'miroir 2026-08-10.1';

// Clés admissibles — tout le reste est refusé à l'écriture comme à la
// lecture. Garde-fou contre une faute de frappe côté GAS qui créerait
// une clé orpheline invisible.
const CLE_VALIDE = /^(acces|annees|secteurs|config_admin|topos|staffs|veille|protocoles|annuaire|vacances_admin|planning_\d{4}|affectations_\d{4}|indispos_\d{4}|gardes_\d{4}|joursferies_\d{4}|stats_\d{4}|mail_nonlus|liberal_\d{4}|veille_marques|doc_[A-Za-z0-9_-]{10,80})$/;
/* (2026-08-10.1) `doc_<idDrive>` : un topo ou un protocole PDF, pousse par la
   tache dediee de miroir.gs. La valeur a la MEME forme que la reponse de
   `getTopo`/`getProtocole` cote Apps Script — {success,name,mimeType,dataB64} —
   pour que la bascule cote page ne change QUE la source, jamais le traitement.
   Le controle « le fichier est-il bien dans le dossier Topos » n'a plus lieu
   d'etre ici : seuls les documents reellement pousses existent comme cle, donc
   un identifiant forge ne renvoie rien. */

// En-têtes communs. Origin * : la protection est le code d'accès, pas
// l'origine (les pages GitHub Pages n'ont pas d'origine secrète).
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Préambule CORS (le navigateur le demande parfois avant un POST).
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        ...CORS,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }});
    }

    // GET — signe de vie UNIQUEMENT sur la racine. Tout autre chemin en
    // GET est refusé : /push et /read ne parlent qu'en POST, et un refus
    // explicite vaut mieux qu'un « ok » ambigu dans un navigateur.
    if (request.method === 'GET') {
      if (url.pathname === '/') {
        return new Response(JSON.stringify({ ok: true, service: VERSION }),
                            { status: 200, headers: CORS });
      }
      return reponse({ success: false, error: 'Méthode non autorisée — POST uniquement' }, 405);
    }

    if (request.method !== 'POST') {
      return reponse({ success: false, error: 'Méthode non autorisée' }, 405);
    }

    let corps;
    try { corps = await request.json(); }
    catch (e) { return reponse({ success: false, error: 'JSON invalide' }, 400); }

    if (url.pathname === '/push') return push(corps, env);
    if (url.pathname === '/read') return lire(corps, env);
    // ── Journal d'intentions (05/08/2026) ──
    if (url.pathname === '/ecrire') return jEcrire(corps, env);
    if (url.pathname === '/tirer') return jTirer(corps, env);
    if (url.pathname === '/purger') return jPurger(corps, env);
    if (url.pathname === '/journal-etat') return jEtat(corps, env);
    return reponse({ success: false, error: 'Chemin inconnu' }, 404);
  }
};

/* ── /push — dépôt par le GAS ─────────────────────────────────────────
   corps : { token, items: { cle: chaineJSON | null } }
   null = suppression de la clé. 20 clés maximum par appel. */
async function push(corps, env) {
  if (!env.PUSH_TOKEN || corps.token !== env.PUSH_TOKEN) {
    return reponse({ success: false, error: 'Jeton invalide' }, 403);
  }
  const items = corps.items && typeof corps.items === 'object' ? corps.items : null;
  if (!items) return reponse({ success: false, error: 'items manquant' }, 400);
  const cles = Object.keys(items);
  if (!cles.length) return reponse({ success: false, error: 'items vide' }, 400);
  if (cles.length > 20) return reponse({ success: false, error: '20 clés maximum' }, 400);

  const ecrits = [], supprimes = [], refuses = [];
  for (const cle of cles) {
    if (!CLE_VALIDE.test(cle)) { refuses.push(cle); continue; }
    const val = items[cle];
    if (val === null) { await env.KV.delete(cle); supprimes.push(cle); continue; }
    if (typeof val !== 'string') { refuses.push(cle); continue; }
    // Contrôle : la valeur doit être du JSON analysable. Une valeur
    // corrompue déposée ici servirait une page cassée à 23 MARs.
    try { JSON.parse(val); } catch (e) { refuses.push(cle); continue; }
    await env.KV.put(cle, val);
    ecrits.push(cle);
  }
  return reponse({ success: true, ecrits, supprimes, refuses, version: VERSION });
}

/* ── /read — lecture par les pages ────────────────────────────────────
   corps : { code, keys: [cle, …] }
   Réponse : { success, identite, data:{cle:objet}, manquants:[],
               refuses:[] }
   manquants = clé jamais poussée (le client se replie sur le GAS pour
   CETTE donnée) ; refuses = rôle insuffisant (le client ne doit PAS
   réessayer). Les deux cas sont distingués exprès : un repli sur refus
   masquerait un défaut de droits derrière un détour par le GAS. */
async function lire(corps, env) {
  const code = String(corps.code == null ? '' : corps.code).trim().toUpperCase();
  if (!code) return reponse({ success: false, error: 'Code absent de la requête' });

  const accesBrut = await env.KV.get('acces');
  if (!accesBrut) {
    // Miroir jamais alimenté : message distinct d'un code invalide,
    // pour que le diagnostic reste possible depuis la console.
    return reponse({ success: false, error: 'Miroir vide — utiliser le circuit GAS' });
  }
  let acces;
  try { acces = JSON.parse(accesBrut); }
  catch (e) { return reponse({ success: false, error: 'acces illisible — utiliser le circuit GAS' }); }

  const empreinte = await sha256hex(code);
  const user = (acces.users || []).find(u => u && u.h === empreinte);
  if (!user) return reponse({ success: false, error: 'Code invalide' });

  // Règle GAS conservée : le rôle secrétariat ne lit RIEN au miroir.
  if (user.role === 'secretariat') {
    return reponse({ success: false, error: 'Accès non autorisé pour ce rôle' });
  }

  const demandes = Array.isArray(corps.keys) ? corps.keys.slice(0, 12) : [];
  const data = {}, manquants = [], refuses = [];

  // Lectures KV en parallèle (interne au Worker : pas de file d'attente,
  // contrairement à Apps Script).
  const taches = demandes.map(async (cle) => {
    cle = String(cle || '');
    if (!CLE_VALIDE.test(cle) || cle === 'acces') { refuses.push(cle); return; }
    if (!autorise(user, cle)) { refuses.push(cle); return; }
    const brut = await env.KV.get(cle);
    if (brut == null) { manquants.push(cle); return; }
    let valeur;
    try { valeur = JSON.parse(brut); } catch (e) { manquants.push(cle); return; }
    if (/^indispos_\d{4}$/.test(cle) && user.role !== 'admin') {
      valeur = filtreIndispos(valeur, user.id);
    }
    if (cle === 'veille_marques') {
      // (08/08) Ce qu'un collègue lit est PERSONNEL : filtré pour TOUS les
      // rôles, admin compris — contrairement aux indispos.
      valeur = filtreIndispos(valeur, user.id);
    }
    data[cle] = valeur;
  });
  await Promise.all(taches);

  // Identité renvoyée SANS l'empreinte : le client n'en a pas l'usage,
  // et une empreinte qui circule est une empreinte qu'on peut comparer.
  const identite = {
    id: user.id, role: user.role, name: user.name,
    initials: user.initials, prenom: user.prenom || '',
    liberal: !!user.liberal, rpps: user.rpps || '',
    indisposYear: acces.indisposYear, indisposOuverte: !!acces.indisposOuverte,
  };
  return reponse({ success: true, identite, data, manquants, refuses, version: VERSION });
}

/* Droits de lecture par clé et par rôle. Toute clé inconnue est refusée
   par CLE_VALIDE en amont : ici, on ne traite que le connu. */
/* ═══ JOURNAL D'INTENTIONS (05/08/2026) ══════════════════════════════
   Le comité DÉPOSE ses gestes ici (~150 ms, durable) au lieu de parler à
   Google ; le GAS les tire chaque minute et les applique dans l'ordre.
   /ecrire : comité (code admin, même empreinte que /read).
   /tirer, /purger : GAS (jeton PUSH_TOKEN).
   /journal-etat : comité OU GAS.
   Ordre = horodatage de CE Worker (source unique) dans la clé j_{ts}_{aléa}.
   Registre d'audit jfait_* conservé 90 jours. */

async function jAuthAdmin(corps, env) {
  const code = String(corps && corps.code == null ? '' : corps.code).trim().toUpperCase();
  if (!code) return null;
  const accesBrut = await env.KV.get('acces');
  if (!accesBrut) return null;
  let acces;
  try { acces = JSON.parse(accesBrut); } catch (e) { return null; }
  const empreinte = await sha256hex(code);
  const user = (acces.users || []).find(u => u && u.h === empreinte);
  return (user && user.role === 'admin') ? user : null;
}

async function jEcrire(corps, env) {
  const user = await jAuthAdmin(corps, env);
  if (!user) return reponse({ success: false, error: 'Code invalide' }, 403);
  const it = corps.intention || {};
  if (['placements', 'statut', 'publier'].indexOf(it.type) === -1) {
    return reponse({ success: false, error: 'type inconnu : ' + it.type }, 400);
  }
  if (JSON.stringify(it).length > 100000) {
    return reponse({ success: false, error: 'fiche trop volumineuse' }, 400);
  }
  const ts = Date.now();
  const cle = 'j_' + String(ts).padStart(14, '0') + '_' + Math.random().toString(36).slice(2, 6);
  it.par = user.id || 'admin';
  it.depose = new Date(ts).toISOString();
  await env.KV.put(cle, JSON.stringify(it));
  return reponse({ success: true, cle: cle, depose: it.depose });
}

async function jTirer(corps, env) {
  if (!env.PUSH_TOKEN || corps.token !== env.PUSH_TOKEN) {
    return reponse({ success: false, error: 'Jeton invalide' }, 403);
  }
  const liste = await env.KV.list({ prefix: 'j_', limit: 200 });
  const fiches = await Promise.all(liste.keys.map(async (k) => {
    const v = await env.KV.get(k.name);
    if (!v) return null;
    try { return { cle: k.name, valeur: JSON.parse(v) }; } catch (e) { return null; }
  }));
  return reponse({ success: true, fiches: fiches.filter(Boolean) });
}

async function jPurger(corps, env) {
  if (!env.PUSH_TOKEN || corps.token !== env.PUSH_TOKEN) {
    return reponse({ success: false, error: 'Jeton invalide' }, 403);
  }
  const resultats = Array.isArray(corps.resultats) ? corps.resultats : [];
  let purgees = 0;
  for (const r of resultats) {
    if (!r || typeof r.cle !== 'string' || r.cle.indexOf('j_') !== 0) continue;
    const v = await env.KV.get(r.cle);
    if (v == null) continue;
    let fiche;
    try { fiche = JSON.parse(v); } catch (e) { fiche = { brut: v }; }
    fiche.applique = new Date().toISOString();
    fiche.ok = !!r.ok;
    fiche.detail = String(r.detail || '');
    await env.KV.put('jfait_' + r.cle.slice(2), JSON.stringify(fiche), { expirationTtl: 7776000 });
    await env.KV.delete(r.cle);
    purgees++;
  }
  return reponse({ success: true, purgees: purgees });
}

async function jEtat(corps, env) {
  let ok = !!(env.PUSH_TOKEN && corps.token === env.PUSH_TOKEN);
  if (!ok) ok = !!(await jAuthAdmin(corps, env));
  if (!ok) return reponse({ success: false, error: 'refus' }, 403);
  const attente = await env.KV.list({ prefix: 'j_', limit: 100 });
  const clesAttente = attente.keys.map(k => k.name).sort();
  const fiches = (await Promise.all(clesAttente.map(async (n) => {
    const v = await env.KV.get(n);
    if (!v) return null;
    try { const f = JSON.parse(v); f.cle = n; return f; } catch (e) { return null; }
  }))).filter(Boolean);
  const faits = await env.KV.list({ prefix: 'jfait_', limit: 1000 });
  const nomsFaits = faits.keys.map(k => k.name).sort().slice(-8);
  const dernieres = (await Promise.all(nomsFaits.map(async (n) => {
    const v = await env.KV.get(n);
    if (!v) return null;
    try { return JSON.parse(v); } catch (e) { return null; }
  }))).filter(Boolean);
  return reponse({ success: true, enAttente: clesAttente.length, fiches: fiches, dernieresAppliquees: dernieres });
}

function autorise(user, cle) {
  if (cle === 'annees' || cle === 'secteurs') return true;              // MAR + admin
  if (cle === 'topos' || cle === 'staffs' || cle === 'veille' ||
      cle === 'protocoles' || cle === 'annuaire') return true;          // tuiles dashboard : MAR + admin
  if (/^doc_/.test(cle)) return true;                                  // (10/08) PDF topo/protocole : MEME niveau que les listes ci-dessus, ni plus ni moins
  if (cle === 'vacances_admin' || /^(gardes|joursferies|stats)_\d{4}$/.test(cle))
    return user.role === 'admin';                                       // lot B : outils comite (roles GAS repliques)
  if (/^(planning|affectations)_\d{4}$/.test(cle)) return true;        // MAR + admin
  if (/^indispos_\d{4}$/.test(cle)) return true;                       // filtré plus loin
  if (cle === 'veille_marques') return true;                           // (08/08) MAR + admin — filtré plus loin, POUR TOUS
  if (cle === 'config_admin') return user.role === 'admin';            // admin seul
  if (cle === 'mail_nonlus') return user.role === 'admin';             // (05/08) compteur de non-lus : un NOMBRE, jamais de contenu
  if (/^liberal_\d{4}$/.test(cle)) return user.role === 'admin';       // (05/08) volet du panneau : qui opere, ou — jamais de montant
  return false;
}

/* Un MAR ne reçoit que SES indispos. Structure poussée par le GAS :
   {"parMar":{"ID":[...]}} — le GAS est seul écrivain, ce format fait foi. */
function filtreIndispos(valeur, id) {
  const parMar = (valeur && valeur.parMar) || {};
  const mien = {};
  if (id && parMar[id] !== undefined) mien[id] = parMar[id];
  return { parMar: mien };
}

async function sha256hex(texte) {
  const donnees = new TextEncoder().encode(texte);
  const hash = await crypto.subtle.digest('SHA-256', donnees);
  return [...new Uint8Array(hash)].map(o => o.toString(16).padStart(2, '0')).join('');
}

function reponse(objet, statut) {
  return new Response(JSON.stringify(objet), { status: statut || 200, headers: CORS });
}
