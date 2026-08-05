/* ═══ BANC D'ESSAI — services Google et Cloudflare simulés ═══
   But : exécuter les VRAIES fonctions des fichiers .gs, en isolant chacune
   par extraction de son source (accolades appariées), dans un bac à sable où
   SpreadsheetApp, PropertiesService, LockService, ScriptApp et UrlFetchApp
   sont remplacés par des doublures fidèles aux comportements qui comptent :
   - une feuille = tableau de lignes ; deleteRow décale bien les suivantes ;
   - LockService distingue script/document (le défaut trouvé ce matin) ;
   - ScriptApp compte les déclencheurs créés/supprimés ;
   - UrlFetchApp parle au Worker (port synchrone, comparé au vrai fichier). */
const fs = require('fs');

// ── Feuille de calcul ────────────────────────────────────────────────
class Sheet {
  constructor(nom, lignes) { this.nom = nom; this.lignes = lignes.map(l => l.slice()); }
  getName() { return this.nom; }
  getLastRow() { return this.lignes.length; }
  getDataRange() { const s = this; return { getValues: () => s.lignes.map(l => l.slice()) }; }
  getRange(r, c, nr, nc) {
    const s = this;
    return {
      setValue(v) { while (s.lignes.length < r) s.lignes.push([]); s.lignes[r-1][c-1] = v; },
      setValues(vals) { vals.forEach((ligne, i) => { while (s.lignes.length < r+i) s.lignes.push([]); ligne.forEach((v,j) => s.lignes[r-1+i][c-1+j] = v); }); },
      setFontWeight() { return this; },
      getValues() { const out = []; for (let i=0;i<(nr||1);i++) out.push((s.lignes[r-1+i]||[]).slice(c-1, c-1+(nc||1))); return out; },
    };
  }
  deleteRow(n) { this.lignes.splice(n-1, 1); }
  appendRow(l) { this.lignes.push(l.slice()); }
  setColumnWidth() {}
  getLastColumn() { return Math.max(...this.lignes.map(l => l.length), 0); }
}
class Classeur {
  constructor() { this.feuilles = {}; }
  ajouter(nom, lignes) { this.feuilles[nom] = new Sheet(nom, lignes); return this.feuilles[nom]; }
  getSheetByName(n) { return this.feuilles[n] || null; }
  insertSheet(n) { return this.ajouter(n, []); }
  getSheets() { return Object.values(this.feuilles); }
}

// ── Verrous : script ≠ document (le défaut du 05/08) ─────────────────
const VERROUS = { script: false, document: false, user: false };
const journalVerrous = [];
function fabriqueVerrou(type) {
  return {
    waitLock(ms) {
      journalVerrous.push({ type, action: 'waitLock', deja: VERROUS[type] });
      if (VERROUS[type]) throw new Error(`verrou ${type} indisponible (attente ${ms} ms épuisée)`);
      VERROUS[type] = true; return true;
    },
    tryLock(ms) {
      journalVerrous.push({ type, action: 'tryLock', deja: VERROUS[type] });
      if (VERROUS[type]) return false;
      VERROUS[type] = true; return true;
    },
    releaseLock() { VERROUS[type] = false; },
  };
}

// ── Extraction d'une fonction réelle depuis un .gs ───────────────────
function extraireFonction(fichier, nom) {
  const src = fs.readFileSync(fichier, 'utf8');
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) throw new Error(`${nom} introuvable dans ${fichier}`);
  let prof = 0, debutCorps = src.indexOf('{', i), j = debutCorps;
  for (; j < src.length; j++) {
    if (src[j] === '{') prof++;
    else if (src[j] === '}') { prof--; if (prof === 0) break; }
  }
  return src.slice(i, j + 1);
}

module.exports = { Sheet, Classeur, fabriqueVerrou, VERROUS, journalVerrous, extraireFonction };
