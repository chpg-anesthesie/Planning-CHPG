/* ═══════════════════════════════════════════════════════════════════════════
   ⚠️  TRAVAIL EN COURS — NE PAS RECOPIER DANS APPS SCRIPT  ⚠️
   ═══════════════════════════════════════════════════════════════════════════
   Copie EXPÉRIMENTALE de gas/generateur_gardes.gs, avec les trois mécanismes de
   garantie de couverture (passe 7ter « jours critiques », anticipation d'un jour,
   repli VD de la rotation de Noël). Extension .gs.txt VOLONTAIRE : ce fichier ne
   doit jamais être confondu avec la production.

   État au 22/07/2026 : 0 à 1 jour sans binôme sur 20 ans (contre 3), équité
   meilleure que la référence sur 2 tirages sur 3. Un cas reste ouvert :
   le 25/12/2039 (dimanche).

   Protocole de validation et pièges : voir 2026-07_couverture_jours_serres.md
   dans le même dossier. La production reste gas/generateur_gardes.gs, INCHANGÉ.
   ═══════════════════════════════════════════════════════════════════════════ */

// ⚠️ RÈGLE (détecteur de dérive dépôt↔Apps Script) : incrémenter cette version
// à CHAQUE push de ce fichier. Le diagnostic (admin → Maintenance) compare la
// version déployée ici avec celle du dépôt et signale toute recopie oubliée.
const GAS_VERSION_GENERATEUR = '2026-07-23.1';

const ARCHIVE_SS_ID = '1-QIYD2U7u41L_pV4wQGN6kDBDzFRHDdXRsHNrcSlvcE';
// Dette inter-annuelle : STATS_GARDES_2026 sont des stats MANUELLES (échanges/dons)
// → inexploitables. La dette ne lit qu'à partir de cette année (2027 = 1re année
// générée proprement par l'algo). 2027 part donc en dette NEUTRE ; 1re vraie dette = 2028.
const PREMIERE_ANNEE_STATS_FIABLES = 2027;

// ══════════════════════════════════════════════════════════════════════
// GÉNÉRATEUR DE GARDES — ALGORITHME DE RÉFÉRENCE
// ══════════════════════════════════════════════════════════════════════
// Règles (par priorité) :
//   1. Quotité (PCT_GARDES) : cible totale proportionnelle au temps de travail
//   2. PRUNET SOUHAIT : placé en premier, S'AJOUTE au quota
//   3. VD : même binôme vendredi+dimanche, équité maximale
//   4. Samedi : équité maximale (proportionnelle à la quotité)
//   5. Jeudi : équité maximale (proportionnelle à la quotité)
//   6. G vs G2 : équité
//   7. Lun/Mar/Mer : peu important
//   Priorité conflit : VD > Samedi > Jeudi > Total
//   Inter-annuel : dette (réel N-1 − cible N-1) reportée comme ajustement initial
// ══════════════════════════════════════════════════════════════════════

// (C2-D1) NO_GARDE / ONLY_18 / NO_WEEKEND sortis vers l'onglet MEDECINS.
// → lus localement dans generateGardes via getMedecinFlags() (const FLAGS).
const RATIO_18      = 1.3;
const DETTE_AMORTI  = 0.6;  // amortissement de la dette : evite la sur-correction/oscillation annuelle (10 ans : 0 annee non-conforme)
const FREEBUDGET_MARGE = 1;  // marge : reserve ~1 jour pour absorber les pertes de placement VD (multi-mardis robuste)
const MIN_PRESENT   = {1:16, 2:15, 3:16, 4:15, 5:15};
// (C2-D3) Rythme 2/2 lu depuis MEDECINS (colonne rythme_2sur2, via getMedecinFlags).
// Ancre semaine 23/2026 conservée en dur (la dérive année-53-sem. = Fix A, séparé).
function estSemaineOff(id, dateStr){
  if(!getMedecinFlags().rythme2sur2.has(id)) return false;
  // Compte les vraies semaines écoulées depuis le lundi de la semaine ISO 23/2026
  // (01/06/2026), robuste aux années à 53 semaines. 2 sem. ON puis 2 sem. OFF.
  const ancre = Date.UTC(2026, 5, 1);
  const dt = new Date(dateStr + 'T12:00:00');
  const m = new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()));
  m.setUTCDate(m.getUTCDate() - ((m.getUTCDay() + 6) % 7)); // lundi de la semaine du jour
  const nb = Math.round((m - ancre) / (7 * 86400000));      // semaines réelles écoulées
  return (((nb % 4) + 4) % 4) >= 2;
}

function toDateStr(d){
  if(!d) return '';
  if(typeof d==='string'&&d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
  const dt=new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}
function addOneDay(ds){const dt=new Date(ds+'T12:00:00');dt.setDate(dt.getDate()+1);return toDateStr(dt);}
// (C3) getJoursFeries() : définition unique dans code.gs (globale, identique).
function isReducedPeriod(m){return m===7||m===8||m===12;}
// OPTIM : PERIODES_VAC lu UNE SEULE FOIS par exécution (cache module).
// Avant, getDataRange().getValues() était rappelé à CHAQUE appel
// d'isVacancesScolaires — soit des milliers de fois dans la boucle des R.
let _vacCache=null;
function _loadVacances(){
  if(_vacCache!==null) return _vacCache;
  _vacCache=[];
  try{
    const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PERIODES_VAC');
    if(s){
      const data=s.getDataRange().getValues();
      for(let r=1;r<data.length;r++){
        const dr=data[r][1],fr=data[r][2];if(!dr||!fr) continue;
        _vacCache.push({
          debut:dr instanceof Date?toDateStr(dr):String(dr).trim(),
          fin:fr instanceof Date?toDateStr(fr):String(fr).trim()
        });
      }
    }
  }catch(e){}
  return _vacCache;
}
function isVacancesScolaires(dateStr,year){
  const periodes=_loadVacances();
  const y=String(year);
  for(let i=0;i<periodes.length;i++){
    const debut=periodes[i].debut,fin=periodes[i].fin;
    if(!debut.startsWith(y)&&!fin.startsWith(y)) continue;
    if(dateStr>=debut&&dateStr<=fin) return true;
  }
  return false;
}

function generateGardes(year){
  if(!year) throw new Error('Précisez l\'année');
  const ss=SpreadsheetApp.getActiveSpreadsheet();

  // ── 🔒 GARDE-FOU ANTI-RÉGÉNÉRATION ────────────────────────────────────
  // Une fois GARDES_{year} créé, la génération est VERROUILLÉE. Le code plus bas
  // fait deleteSheet+recreate de GARDES_{year} ET STATS_GARDES_{year} : sans ce
  // garde-fou, relancer W2 écraserait la preuve d'équité de l'algo et le planning.
  // Pour régénérer volontairement (rare) : supprimer d'abord manuellement l'onglet.
  if(ss.getSheetByName(`GARDES_${year}`)){
    throw new Error(`🔒 GARDES_${year} existe déjà — génération verrouillée pour protéger l'équité. Pour régénérer (rare), supprimez d'abord manuellement l'onglet GARDES_${year}.`);
  }

  // (C2-D1) Flags effectif lus depuis MEDECINS (remplacent les Set en dur).
  const FLAGS = getMedecinFlags();
  const NO_GARDE   = FLAGS.noGarde;
  const ONLY_18    = FLAGS.only18;
  const NO_WEEKEND = FLAGS.noWeekend;

  // ── 1. Indispos ──────────────────────────────────────────────────────
  const indSheet=ss.getSheetByName(`INDISPOS_${year}`);
  if(!indSheet) throw new Error(`INDISPOS_${year} introuvable`);
  const indData=indSheet.getDataRange().getValues();
  const indispos={},souhaits={};
  const indDates = reconstruireDatesHeaders(indData, year); // (C3b) helper unifié
  for(let r=3;r<indData.length;r++){
    const id=String(indData[r][0]).trim();if(!id) continue;
    indispos[id]={};
    indDates.forEach((ds,i)=>{if(!ds) return;const v=String(indData[r][i+1]||'').trim();
      if(v)indispos[id][ds]=v;
      if(v==='SOUHAIT'){if(!souhaits[ds])souhaits[ds]=[];souhaits[ds].push(id);}
    });
  }

  // (Fix A3) une garde posée sur un jour que le MAR a lui-même souhaité est
  // « assumée » : elle ne compte pas dans SES pénalités d'espacement.
  const isSouhaitDe=(id,date)=>!!(souhaits[date]&&souhaits[date].indexOf(id)>=0);

  // ── 2. Médecins ──────────────────────────────────────────────────────
  const medData=ss.getSheetByName('MEDECINS').getDataRange().getValues();
  const allDoctors=[],gardeDoctors=[],pct={},quot={};
  for(let r=1;r<medData.length;r++){
    const id=String(medData[r][0]).trim();
    if(!id||id==='DRUGE') continue;
    allDoctors.push(id);pct[id]=Number(medData[r][5])||100;quot[id]=Number(medData[r][4])||100;
    if(!NO_GARDE.has(id)) gardeDoctors.push(id);
    if(!indispos[id]) indispos[id]={};
  }
  // (C2-D2) Exclure les MAR entièrement hors de l'année planning via date_debut/date_fin.
  // Remplace le splice('TRAN') en dur. Pour 2027 : TRAN (fin 2026-09-01) entièrement
  // avant le début 2027 → exclue (= ancien splice) ; ARMAND (début 2026-11-01) actif en
  // 2027 → conservé. Générique : tout futur départ/arrivée passe par MEDECINS.
  const _planStart = toDateStr(getPremierJourPlanning(year));
  const _planEnd   = toDateStr(new Date(getPremierJourPlanning(year + 1).getTime() - 86400000));
  const _horsAnnee = id => {
    const dd = FLAGS.dateDebut[id], df = FLAGS.dateFin[id];
    if (df && df < _planStart) return true; // activité terminée avant le début de l'année
    if (dd && dd > _planEnd)   return true; // activité démarrant après la fin de l'année
    return false;
  };
  [gardeDoctors, allDoctors].forEach(arr => {
    for (let i = arr.length - 1; i >= 0; i--) { if (_horsAnnee(arr[i])) arr.splice(i, 1); }
  });

  // ── 3. Calendrier ────────────────────────────────────────────────────
  const j1=new Date(year,0,1),d1=j1.getDay(),o1=d1===1?7:d1===0?1:8-d1;
  const start=new Date(year,0,1+o1,12,0,0);
  const j1n=new Date(year+1,0,1),d1n=j1n.getDay(),on=d1n===1?7:d1n===0?1:8-d1n;
  const end=new Date(new Date(year+1,0,1+on,12,0,0).getTime()-86400000);
  const jf=getJoursFeries(year),jfn=getJoursFeries(year+1);
  const allDays=[];
  for(const dt=new Date(start);dt<=end;dt.setDate(dt.getDate()+1)){
    const ds=toDateStr(dt),dow=dt.getDay();
    const isFerie=jf.has(ds)||jfn.has(ds);
    const lend=addOneDay(ds), ferieLend=jf.has(lend)||jfn.has(lend);
    // VJF de semaine : J non férié, J+1 férié, J = lun..jeu (le JF tombe donc mar..ven)
    const isVjf=!isFerie&&ferieLend&&dow>=1&&dow<=4;
    const mon=new Date(dt); mon.setDate(mon.getDate()-((dow+6)%7)); // lundi ISO (clé semaine, pré-calculée)
    allDays.push({date:ds,dow,month:dt.getMonth()+1,wk:toDateStr(mon),
      isFerie,isSat:dow===6,isSun:dow===0,
      isWeekday:dow>=1&&dow<=5,isReduced:isReducedPeriod(dt.getMonth()+1),isVjf});
  }
  // OPTIM : Map date→day pour lookup O(1) (remplace allDays.find)
  const dayByDate={};
  allDays.forEach(d=>{dayByDate[d.date]=d;});

  // Transition N-1
  const ts=ss.getSheetByName('CONFIG_TRANSITION');
  if(ts){
    const td=ts.getDataRange().getValues();
    for(let r=1;r<td.length;r++){
      if(Number(td[r][0])!==year) continue;
      const pj=toDateStr(new Date(year,0,1+o1));
      [String(td[r][1]).trim(),String(td[r][2]).trim()].forEach(id=>{
        if(id){if(!indispos[id])indispos[id]={};indispos[id][pj]='RG_TRANSITION';}});
      break;
    }
  }

  // ── 4. Dette inter-annuelle PAR AXE (samedi / jeudi / VD) ─────────────
  // On reporte l'écart (réel − cible) de l'an dernier sur CHAQUE axe à enjeu,
  // plutôt que sur le total : qui a fait trop de samedis en N en fera moins en N+1,
  // idem jeudis et VD. Lu seulement si la cible N-1 de l'axe est connue
  // (colonnes CIBLE SAM/JEU/VD de STATS_GARDES_{N-1}) ; sinon départ neutre.
  const dette={};
  gardeDoctors.forEach(id=>{dette[id]={sam:0,jeu:0,vd:0,vjf:0,jf:0,total:0};});
  let prevStats=null;
  if(year-1 >= PREMIERE_ANNEE_STATS_FIABLES){
    prevStats=ss.getSheetByName(`STATS_GARDES_${year-1}`);
    if(!prevStats){
      // Repli : l'onglet N-1 a pu être déplacé vers le classeur d'archives (W3)
      try { prevStats=SpreadsheetApp.openById(ARCHIVE_SS_ID).getSheetByName(`STATS_GARDES_${year-1}`); }
      catch(e){ /* archives inaccessibles → dette neutre, l'algo continue */ }
    }
  }
  if(prevStats){
    const ps=prevStats.getDataRange().getValues();
    const hdr=ps[0].map(h=>String(h).trim());
    const iSam=hdr.indexOf('SAM'), iJeu=hdr.indexOf('JEU'), iVd=hdr.indexOf('VD'), iVjf=hdr.indexOf('VEILLE JF'), iJf=hdr.indexOf('JF'), iTot=hdr.indexOf('TOTAL G');
    // (RH-3) Colonnes CIBLE de N-1 : déjà pro-ratées par la présence structurelle
    // (arrivée/départ, congés longs, TP, no_weekend) au moment de la génération N-1.
    const iCbT=hdr.indexOf('CIBLE'), iCbS=hdr.indexOf('CIBLE SAM'), iCbJ=hdr.indexOf('CIBLE JEU'),
          iCbV=hdr.indexOf('CIBLE VD'), iCbVj=hdr.indexOf('CIBLE VJF'), iCbJf=hdr.indexOf('CIBLE JF');
    // (dette) on lit les NOMBRES RÉELS affectés en N-1, puis on recompose la part
    // juste en redistribuant ces réels au prorata des CIBLES N-1 stockées (RH-3) —
    // et non plus de la seule quotité, qui créait une fausse dette « négative »
    // pour un MAR légitimement absent une partie de N-1 (maternité, arrivée tardive).
    const reel={}, cibN1={}; let totSam=0,totJeu=0,totVd=0,totVjf=0,totJf=0,totTot=0;
    const _num=v=>Number(String(v).replace(/^'/,''))||0; // CIBLE totale stockée en texte
    for(let r=1;r<ps.length;r++){
      const id=String(ps[r][0]).trim();
      if(!id||!dette[id]) continue;
      const rs=iSam>=0?Number(ps[r][iSam])||0:0, rj=iJeu>=0?Number(ps[r][iJeu])||0:0,
            rv=iVd>=0?Number(ps[r][iVd])||0:0,  rvj=iVjf>=0?Number(ps[r][iVjf])||0:0,
            rjf=iJf>=0?Number(ps[r][iJf])||0:0,  rt=iTot>=0?Number(ps[r][iTot])||0:0;
      reel[id]={sam:rs,jeu:rj,vd:rv,vjf:rvj,jf:rjf,total:rt};
      totSam+=rs; totJeu+=rj; totVd+=rv; totVjf+=rvj; totJf+=rjf; totTot+=rt;
      const cbS=iCbS>=0?_num(ps[r][iCbS]):0;
      cibN1[id]={
        total: iCbT>=0?_num(ps[r][iCbT]):0,
        sam: cbS,
        jeu: iCbJ>=0?_num(ps[r][iCbJ]):0,
        vd:  iCbV>=0?_num(ps[r][iCbV]):0,
        vjf: iCbVj>=0?_num(ps[r][iCbVj]):0,
        jf:  iCbJf>=0?_num(ps[r][iCbJf]):cbS, // pas de CIBLE JF en N-1 → repli CIBLE SAM (même pool WE)
      };
    }
    const sumP=gardeDoctors.reduce((s,id)=>s+pct[id]/100,0);
    const _horsWE=id=>NO_WEEKEND.has(id)||FLAGS.souhaitPlafond.has(id); // (Fix A2) plafonné hors axes WE
    const sumPWE=gardeDoctors.reduce((s,id)=>_horsWE(id)?s:s+pct[id]/100,0);
    // (RH-3) fair(axe) = totalRéel(axe) × cibleN1(id,axe) / Σ cibleN1(axe).
    // Propriétés : Σdette = 0 par axe ; cibles ∝ quotité quand tout le monde est
    // à temps plein toute l'année → identique à l'ancienne formule dans ce cas.
    // Repli intégral sur l'ancienne formule (quotité) si les cibles N-1 manquent.
    const sumCb={}; ['sam','jeu','vd','vjf','jf','total'].forEach(k=>{
      sumCb[k]=gardeDoctors.reduce((s,id)=>s+(cibN1[id]?cibN1[id][k]:0),0);
    });
    const fairOf=(id,k,totReel)=>{
      if(sumCb[k]>0) return totReel*(cibN1[id]?cibN1[id][k]:0)/sumCb[k];
      const p=pct[id]/100; // repli : ancienne part au prorata de la quotité
      if(k==='jeu'||k==='vjf'||k==='total') return sumP?totReel*p/sumP:0;
      return (_horsWE(id)||!sumPWE)?0:totReel*p/sumPWE;
    };
    gardeDoctors.forEach(id=>{
      if(!reel[id]) return; // MAR absent de N-1 → dette neutre
      dette[id].sam=reel[id].sam-fairOf(id,'sam',totSam);
      dette[id].jeu=reel[id].jeu-fairOf(id,'jeu',totJeu);
      dette[id].vd =reel[id].vd -fairOf(id,'vd',totVd);
      dette[id].vjf=reel[id].vjf-fairOf(id,'vjf',totVjf);
      dette[id].jf =reel[id].jf -fairOf(id,'jf',totJf);
      dette[id].total=reel[id].total-fairOf(id,'total',totTot);
    });
    // (équité annuelle = dogme) plafond ±2 par axe : la dette nudge, ne bouleverse pas l'année
    gardeDoctors.forEach(id=>['sam','jeu','vd','vjf','jf','total'].forEach(k=>{dette[id][k]=DETTE_AMORTI*Math.max(-2,Math.min(2,dette[id][k]));}));
  }

  // ── 5. Cibles PRO-RATÉES par disponibilité STRUCTURELLE ──────────────
  // Réduit la cible : hors [date_debut,date_fin] OU statut 'CL' (congé long).
  // NE réduit PAS : INDISPO/VAC/FORM (indispo volontaire → le MAR assume sa
  // concentration). Poids axe = pct × (jours d'axe structurellement dispo /
  // total jours d'axe) ; la part libérée est redistribuée aux autres.
  const nDays=allDays.length;
  const nSam=allDays.filter(d=>d.dow===6).length;
  const nJeu=allDays.filter(d=>d.dow===4&&!d.isFerie).length;
  const nVen=allDays.filter(d=>d.dow===5).length;
  const nVjf=allDays.filter(d=>d.isVjf).length;
  const nFerie=allDays.filter(d=>d.isFerie&&(d.dow===2||d.dow===3)).length;       // fériés NON couplés (mar/mer)
  const nCoupleSam=allDays.filter(d=>d.isFerie&&(d.dow===1||d.dow===4)).length;   // jeudi/lundi fériés couplés → comptés samedi
  function structAvail(id,d){
    const dd=FLAGS.dateDebut[id], df=FLAGS.dateFin[id];
    if(dd && d.date<dd) return false;
    if(df && d.date>=df) return false;
    if(indispos[id]?.[d.date]==='CL') return false;
    return true;
  }
  const AX={
    total: allDays,
    sam:   allDays.filter(d=>d.dow===6),
    jeu:   allDays.filter(d=>d.dow===4&&!d.isFerie),
    vd:    allDays.filter(d=>d.dow===5),
    vjf:   allDays.filter(d=>d.isVjf),
    ferie: allDays.filter(d=>d.isFerie&&(d.dow===2||d.dow===3)),
    jf:    allDays.filter(d=>d.isFerie),
  };
  const nFerieAll=allDays.filter(d=>d.isFerie).length;
  const SLOTS={total:nDays*2, sam:nSam*2, jeu:nJeu*2, vd:nVen*2, vjf:nVjf*2, ferie:nFerie*2, jf:nFerieAll*2};
  function axisEligible(axis,id){
    if((axis==='sam'||axis==='vd'||axis==='ferie'||axis==='jf')&&(NO_WEEKEND.has(id)||FLAGS.souhaitPlafond.has(id))) return false; // (Fix A2) plafonné : aucun axe WE/férié
    if(axis==='jeu'&&FLAGS.souhaitPlafond.has(id)) return false; // (Fix A2) plafonné hors axe jeudi : sa cible fantôme gonflait les jeudis des autres ; ses compensations vont sur lun/mar/mer
    if(axis==='vjf'&&FLAGS.souhaitPlafond.has(id)) return false; // PRUNET hors VJF
    return true;
  }
  const cible={};
  gardeDoctors.forEach(id=>{cible[id]={};});
  Object.keys(AX).forEach(axis=>{
    const tot=AX[axis].length||1, w={};
    gardeDoctors.forEach(id=>{
      if(!axisEligible(axis,id)){w[id]=0;return;}
      // (D1) jours fixes TP : indisponibilité STRUCTURELLE des axes-jour concernés
      // (ex. JEU off → cible jeudi 0, comme NO_WEEKEND annule sam/VD). L'axe total
      // n'est PAS réduit : la quotité (pct) couvre déjà le volume — sinon double peine.
      const _tpA=FLAGS.tpJoursFixes[id];
      const avail=AX[axis].filter(d=>structAvail(id,d)&&(axis==='total'||!_tpA||!_tpA.has(d.dow))).length;
      w[id]=(pct[id]/100)*(avail/tot);
    });
    const sw=gardeDoctors.reduce((s,id)=>s+w[id],0)||1;
    gardeDoctors.forEach(id=>{cible[id][axis]=SLOTS[axis]*w[id]/sw;});
  });
// ── 5bis. Souhaits plafonnés à la cible (PRUNET uniquement) ──────────
  // La cible totale devient le MAX entre la cible proportionnelle et le
  // nombre de souhaits :
  //   • souhaits ≤ cible → il termine à la cible prévue (souhaits inclus) ;
  //   • souhaits > cible → il obtient exactement ses souhaits, sans extra.
  // (Pour les autres MAR, les souhaits sont déjà "dans" le quota.)
  const SOUHAIT_PLAFOND = FLAGS.souhaitPlafond; // (C2-D1) externalisé → MEDECINS
  SOUHAIT_PLAFOND.forEach(id=>{
    if(!cible[id]) return;
    const n=Object.values(souhaits).filter(ids=>ids.includes(id)).length;
    cible[id].total = Math.max(cible[id].total, n);
  });
  // Budget de jours LIBRES (lun/mar/mer) = total − axes-clés. Les souhaits des
  // non-PRUNET sont plafonnés à ce budget : leurs parts sam/jeu/VD/VJF/férié
  // restent dues à l'équipe (équité) et ne peuvent être noyées sous des mardis.
  const freeBudget={};
  gardeDoctors.forEach(id=>{
    const c=cible[id];
    // un week-end VD coûte 2 jours (vendredi + dimanche) au total → compté ×2,
    // sinon le budget de souhaits est surévalué et les mardis affament l'axe VD.
    freeBudget[id]=c.total-(c.sam+c.jeu+2*c.vd+c.vjf+c.ferie)-FREEBUDGET_MARGE;
  });
  // ── 5ter. Lissage annuel : espérance de gardes par MOIS, proportionnelle aux
  // jours STRUCTURELLEMENT disponibles ce mois (respecte 2/2, CL, dates, absences
  // fixes). Un MAR 2/2 (ex. COPELOVICI/LC) a une espérance nulle ses semaines off.
  const ABSENT_STRUCT=new Set(['INDISPO','VAC','FORM','TP','CL','CTP']);
  const monthExp={};
  gardeDoctors.forEach(id=>{
    const ma={}; for(let m=1;m<=12;m++) ma[m]=0;
    const dd=FLAGS.dateDebut[id], df=FLAGS.dateFin[id];
    allDays.forEach(d=>{
      if(dd && d.date<dd) return;
      if(df && d.date>=df) return;
      if(ABSENT_STRUCT.has(indispos[id]?.[d.date])) return;
      if(estSemaineOff(id,d.date)) return;
      ma[d.month]++;
    });
    const tot=Object.values(ma).reduce((s,x)=>s+x,0)||1;
    const me={}; for(let m=1;m<=12;m++) me[m]=cible[id].total*ma[m]/tot;
    monthExp[id]=me;
  });
  // ── 6. État ──────────────────────────────────────────────────────────
  const gSet={},g2Set={},rgSet={},rSet={};
  const cnt={};
  gardeDoctors.forEach(id=>{
    gSet[id]=new Set();g2Set[id]=new Set();rgSet[id]=new Set();rSet[id]=new Set();
    cnt[id]={total:0,g:0,g2:0,sam:0,jeu:0,ven:0,vd:0,vjf:0,ferie:0,jf:0,lun:0,mar:0,mer:0,dim:0,recupR:0};
  });
  allDoctors.forEach(id=>{if(!rSet[id])rSet[id]=new Set();if(!rgSet[id])rgSet[id]=new Set();});
  const recupDue={}; gardeDoctors.forEach(id=>{recupDue[id]=[];}); // (R fix) #R ≡ #samedis (couplages inclus)
  const weekCnt={}; gardeDoctors.forEach(id=>{weekCnt[id]={};}); // gardes par semaine ISO (espacement O(1))
  const weekCntS={}; gardeDoctors.forEach(id=>{weekCntS[id]={};}); // (Fix A3) dont gardes-souhaits
  const monthCnt={}; gardeDoctors.forEach(id=>{monthCnt[id]={};}); // gardes par mois (lissage annuel)

  // _relaxJS : tolère le combo jeudi↔samedi (2 gardes en 3 jours glissants, G-RG-G).
  // Utilisé UNIQUEMENT en dernier recours par la passe des jours critiques, quand un
  // jour resterait sinon non pourvu. Aucun autre appelant ne passe ce paramètre :
  // le comportement par défaut est strictement inchangé.
  function blocked(id,date,_relaxJS){
    const _dd=FLAGS.dateDebut[id], _df=FLAGS.dateFin[id]; // (F3) arrivée/départ en cours d'année
    if(_dd&&date<_dd) return true;
    if(_df&&date>=_df) return true;
    const s=indispos[id]?.[date];
    if(s==='INDISPO'||s==='VAC'||s==='FORM'||s==='TP'||s==='CL'||s==='CTP') return true;
    if(estSemaineOff(id,date)) return true;   // ← AJOUT : semaine "off" du rythme 2/2
    const _tpF=FLAGS.tpJoursFixes[id];         // (D1) jours fixes non travaillés (MEDECINS col Q)
    if(_tpF&&_tpF.has(new Date(date+'T12:00:00').getDay())) return true;
    if(rgSet[id].has(date)||rSet[id]?.has(date)) return true;
    const _lend=addOneDay(date);
    if(gSet[id]?.has(_lend)||g2Set[id]?.has(_lend)) return true; // jamais 2 gardes d'affilée, même si la garde du lendemain est déjà posée (souhait/VD hors ordre chrono)
    // Combo jeudi-samedi interdit (hors jeudi férié couplé)
    const _di=dayByDate[date];
    if(_di&&!_relaxJS){
      if(_di.dow===6){const thu=toDateStr(new Date(new Date(date+'T12:00:00').getTime()-2*86400000)),tdi=dayByDate[thu];
        if(tdi&&!tdi.isFerie&&(gSet[id]?.has(thu)||g2Set[id]?.has(thu))) return true;}
      if(_di.dow===4&&!_di.isFerie){const sat=toDateStr(new Date(new Date(date+'T12:00:00').getTime()+2*86400000));
        if(gSet[id]?.has(sat)||g2Set[id]?.has(sat)) return true;}
    }
    if(s==='RG_TRANSITION') return true;
    const dow=new Date(date+'T12:00:00').getDay();
    if(NO_WEEKEND.has(id)&&(dow===0||dow===6)) return true;
    const di=dayByDate[date];
    if(NO_WEEKEND.has(id)&&di?.isFerie) return true;
    if(SOUHAIT_PLAFOND.has(id)&&di?.isVjf) return true; // PRUNET : complément cible hors VJF
    // (Fix A2) souhait_plafond : JAMAIS de week-end ni de férié — le complément des
    // mardis perdus (VJF, Noël/An) ne peut tomber qu'en semaine (lun→jeu non férié).
    // Le vendredi est bloqué aussi : sa garde engage le dimanche (unité VD).
    if(SOUHAIT_PLAFOND.has(id)&&(dow===0||dow===5||dow===6||di?.isFerie)) return true;
    // Plafond souhaits : un MAR plafonné ne dépasse jamais sa cible totale
    if(SOUHAIT_PLAFOND.has(id) && cnt[id] && cnt[id].total >= cible[id].total) return true;
    return false;
  }

  // ── 7. Fonctions de score ─────────────────────────────────────────────
  // ratio(axe) = (réel + dette) / cible → on choisit le ratio le plus bas
  function ratio(id,axis){
    const c=cnt[id][axis]+(dette[id]?.[axis]||0);
    const cb=cible[id][axis];
    return cb>0?c/cb:999;
  }
  function ratioTotal(id){
    const c=cnt[id].total+(dette[id]?.total||0);
    return cible[id].total>0?c/cible[id].total:999;
  }
  // Lissage : pénalise une garde proche (hors adjacence J±1 déjà bloquée).
  // J±2 = le "1j/2" avec le RG (et jeudi→samedi) → forte ; J±3/J±4 → légère.
  // clé de semaine = lundi ISO, PRÉ-CALCULÉE dans dayByDate[date].wk (zéro parsing Date)
  const weekKey = ds => dayByDate[ds]?.wk;
  const weekLoad = (id,date) => {                       // O(1) via compteur incrémental
    let n=(weekCnt[id][dayByDate[date].wk]||0)-(weekCntS[id][dayByDate[date].wk]||0); // (Fix A3) hors souhaits
    if((gSet[id]?.has(date)||g2Set[id]?.has(date))&&!isSouhaitDe(id,date)) n--;  // exclure la date elle-même si déjà posée
    return n;
  };
  function spacingPenalty(id, date){
    // (VDM) dimanche→mardi non souhaité = DERNIER RECOURS : pénalité écrasante,
    // le candidat ne passe que si la couverture du jour l'exige (la couverture prime tout).
    let vdm=0;
    { const _dw=new Date(date+'T12:00:00').getDay();
      if(_dw===2&&!isSouhaitDe(id,date)){
        const dim=toDateStr(new Date(new Date(date+'T12:00:00').getTime()-2*86400000));
        if(gSet[id]?.has(dim)||g2Set[id]?.has(dim)) vdm=5000;
      } else if(_dw===0){
        const mar=toDateStr(new Date(new Date(date+'T12:00:00').getTime()+2*86400000));
        if((gSet[id]?.has(mar)||g2Set[id]?.has(mar))&&!isSouhaitDe(id,mar)) vdm=5000;
      } }
    const has = n => {
      const x = new Date(date + 'T12:00:00'); x.setDate(x.getDate() + n);
      const ds = toDateStr(x);
      if(!((gSet[id] && gSet[id].has(ds)) || (g2Set[id] && g2Set[id].has(ds)))) return 0;
      return isSouhaitDe(id,ds) ? 2 : 1; // (Fix A3) voisin souhaité = pénalité réduite, pas nulle
    };
    let p=0;
    const lv=(a,b)=>Math.max(has(a),has(b)); // 1=garde normale, 2=garde-souhait
    let v=lv(-2,2); if(v===1)p+=100; else if(v===2)p+=10;
    v=lv(-3,3);     if(v===1)p+=10;  else if(v===2)p+=2;
    v=lv(-4,4);     if(v===1)p+=1;
    p+=vdm; // (VDM)
    const wl=weekLoad(id,date);      // >2 gardes/semaine à éviter (souple)
    if(wl>=2) p+=80;                 // ce serait la 3e (ou +)
    if(wl>=3) p+=200;
    return p;
  }
  const monthOver=(id,date)=>{ const m=Number(date.slice(5,7)); return Math.max(0,(monthCnt[id][m]||0)-(monthExp[id][m]||0)); };
  // Score de SÉLECTION (sans distinction G/G2) :
  //   [espacement, ratio axe du jour, lissage mensuel, ratio total, total brut]
  function scoreSelect(id,dow,isVjf,date){
    const space=spacingPenalty(id,date); // lissage : prime sur l'équité (tue jeudi→samedi + 1j/2)
    const prim=dow===6?[ratio(id,'sam')]:dow===4?[ratio(id,'jeu')]:[];
    if(isVjf) prim.push(ratio(id,'vjf'));
    if(dayByDate[date]?.isFerie) prim.push(ratio(id,'ferie'));
    return [space].concat(prim).concat([Math.round(monthOver(id,date)*100)/100,ratioTotal(id),cnt[id].total]);
  }
  function scoreVD(id,fri,sun){
    let wpen=(weekLoad(id,fri)>=1||weekLoad(id,sun)>=1)?80:0; // VD = ven+dim : éviter une 3e garde la même semaine
    // (VDM) mardi non souhaité déjà en garde à J+2 du dimanche → dernier recours
    { const mar=toDateStr(new Date(new Date(sun+'T12:00:00').getTime()+2*86400000));
      if((gSet[id]?.has(mar)||g2Set[id]?.has(mar))&&!isSouhaitDe(id,mar)) wpen+=5000; }
    return [wpen,ratio(id,'vd'),ratioTotal(id),cnt[id].g+cnt[id].g2];
  }
  function cmp(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]-b[i];}return 0;}
  // Attribution des rôles G/G2 entre 2 MARs : celui qui a le moins de G prend G
  function assignRoles(A,B){
    if((cnt[A].g-cnt[A].g2)<=(cnt[B].g-cnt[B].g2)) return [A,B];
    return [B,A];
  }

  function assign(date,g,g2,dow){
    gardes[date]={g,g2};
    assignDow[date]=dow;
    [[g,false],[g2,true]].forEach(([id,isg2])=>{
      if(!id) return;
      if(isg2){g2Set[id].add(date);cnt[id].g2++;}else{gSet[id].add(date);cnt[id].g++;}
      rgSet[id].add(addOneDay(date));
      cnt[id].total++;
      const KEYS=['dim','lun','mar','mer','jeu','ven','sam'];
      // (Fix v2) SEUL le jeudi férié couplé = JF seul (pas de WE de 3 j → pas un "jeudi").
      // Le lundi férié reste un LUNDI (+JF) ; le samedi (même férié) reste un SAMEDI + récup R.
      const _diA=dayByDate[date], _coupledF=_diA&&_diA.isFerie&&_diA.dow===4;
      if(!_coupledF){
        cnt[id][KEYS[dow]]++;
        if(dow===6){cnt[id].recupR++;recupDue[id].push(date);}
      }
      if(dayByDate[date]?.isVjf)cnt[id].vjf++;
      const _rdow=dayByDate[date]?.dow;
      if(dayByDate[date]?.isFerie&&(_rdow===2||_rdow===3))cnt[id].ferie++;
      if(dayByDate[date]?.isFerie)cnt[id].jf++; // total fériés (couplages inclus)
      const _wk=dayByDate[date]?.wk;
      if(_wk!==undefined){weekCnt[id][_wk]=(weekCnt[id][_wk]||0)+1;
        if(isSouhaitDe(id,date)) weekCntS[id][_wk]=(weekCntS[id][_wk]||0)+1;} // (Fix A3)
      const _m=Number(date.slice(5,7)); monthCnt[id][_m]=(monthCnt[id][_m]||0)+1;
    });
  }

  // ── 8. Placement ─────────────────────────────────────────────────────
  const gardes={};
  const assignDow={}; // (optim) axe-jour de chaque date (couplages fériés : 6)
  const warnings=[];

  // ── 7bis. NOËL / JOUR DE L'AN — rotation pluriannuelle ───────────────
  // 4 dates (24/12, 25/12, 31/12, 01/01) = 8 MAR/an. Priorité = jamais fait
  // puis le plus ancien. ≤ 1 jour/MAR/an. PRUNET exempté. Les couplages (VD
  // ven/dim, jeudi/lundi férié ↔ samedi) sont respectés : le binôme de
  // rotation possède toute l'unité liée. Historique = onglet NOEL_AN_HISTORIQUE.
  const noelDatesAssigned=new Set();
  const noelAssignees={};
  {
    // Rotation Noël/An : dernière année où chacun a fait Noël/An.
    // Source unique getNoelHistory(year) = HISTORIQUE (années archivées) ∪ onglets
    // GARDES_{Y} présents (années générées non encore archivées, Y < year). Corrige
    // le décalage d'un an : sans ça, générer N ré-attribuerait Noël à la personne
    // qui fait déjà Noël N-1.
    const noelHistory = getNoelHistory(year);

    const shiftD=(d,n)=>toDateStr(new Date(new Date(d+'T12:00:00').getTime()+n*86400000));
    let noelDates=[];
    [year,year+1].forEach(y=>[`${y}-12-24`,`${y}-12-25`,`${y}-12-31`,`${y+1}-01-01`].forEach(dn=>{
      if(dayByDate[dn]&&(dn.startsWith(String(year))||dn===`${year+1}-01-01`)) noelDates.push(dn);
    }));
    noelDates=[...new Set(noelDates)].filter(d=>dayByDate[d]).sort();

    const noelUnit=(date)=>{
      const di=dayByDate[date],dow=di.dow,u=[date];
      if(dow===5) u.push(shiftD(date,2));                       // VD vendredi → dimanche
      else if(dow===0) u.push(shiftD(date,-2));                 // VD dimanche → vendredi
      else if(di.isFerie&&dow===4) u.push(shiftD(date,2));      // jeudi férié → samedi (JS)
      else if(di.isFerie&&dow===1) u.push(shiftD(date,-2));     // lundi férié → samedi (SL)
      else if(dow===6){                                         // samedi couplé à un férié ?
        const thu=shiftD(date,-2),mon=shiftD(date,2);
        if(dayByDate[thu]?.isFerie&&dayByDate[thu].dow===4) u.push(thu);
        if(dayByDate[mon]?.isFerie&&dayByDate[mon].dow===1) u.push(mon);
      }
      return [...new Set(u)].filter(d=>dayByDate[d]).sort();
    };
    const canHoldUnit=(m,unit)=>unit.every(d=>!blocked(m,d));
    const assignUnit=(unit,A,B)=>{
      const [g,gg]=assignRoles(A,B);
      const hasFri=unit.some(d=>dayByDate[d].dow===5);
      unit.forEach(d=>{
        const dw=dayByDate[d].dow;
        const adow=dw; // vrai jour ; le jeudi férié couplé est exclu via _coupledF dans assign()
        assign(d,g,gg,adow); noelDatesAssigned.add(d);
      });
      if(hasFri){cnt[g].vd++;cnt[gg].vd++;}
    };
    // ── (COUVERTURE) Choix sensible au voisinage ──────────────────────
    // Poser un binôme sur une date de Noël bloque ses 2 membres la veille, le
    // lendemain et via le combo jeudi↔samedi. Sur la semaine de Noël, le vivier
    // des jours voisins est minuscule : consommer la mauvaise personne le 24 rend
    // le 25 ou le 26 insolubles (constaté : 25/12/2037, 25/12/2039). On prend
    // donc, DANS L'ORDRE DE LA ROTATION, la première paire qui laisse ≥ 2
    // disponibles sur chaque jour voisin non encore pourvu. Si aucune paire ne
    // convient, on garde le choix historique (comportement antérieur inchangé).
    const bloqueraitSur=(dd,unit)=>unit.some(ud=>{
      if(dd===ud) return true;
      if(dd===shiftD(ud,1)||dd===shiftD(ud,-1)) return true;             // veille / lendemain
      const dU=dayByDate[ud],dD=dayByDate[dd];
      if(dU&&dD){
        if(dU.dow===4&&!dU.isFerie&&dD.dow===6&&dd===shiftD(ud,2)) return true;  // jeu→sam
        if(dU.dow===6&&dD.dow===4&&!dD.isFerie&&dd===shiftD(ud,-2)) return true; // sam→jeu
      }
      return false;
    });
    const preserveVoisins=(pair,unit)=>{
      const d0=shiftD(unit[0],-2),d1=shiftD(unit[unit.length-1],2);
      for(let dd=d0;dd<=d1;dd=shiftD(dd,1)){
        if(!dayByDate[dd]||gardes[dd]||unit.indexOf(dd)>=0) continue;
        const gene=bloqueraitSur(dd,unit);
        const pool=gardeDoctors.filter(id=>!blocked(id,dd)&&!(gene&&pair.indexOf(id)>=0));
        if(pool.length<2) return false;
      }
      return true;
    };
    const choisirPaire=(liste,unit)=>{
      for(let i=0;i<liste.length;i++)
        for(let j=i+1;j<liste.length;j++)
          if(preserveVoisins([liste[i],liste[j]],unit)) return [liste[i],liste[j]];
      return [liste[0],liste[1]];   // aucune paire ne préserve tout : choix antérieur
    };
    const overdueKey=(m)=>{const ly=noelHistory[m]; return ly==null?[0,0,m]:[1,ly,m];};
    const cmpKey=(a,b)=>a[0]-b[0]||a[1]-b[1]||(a[2]<b[2]?-1:a[2]>b[2]?1:0);

    const noelDone=new Set();
    noelDates.forEach(date=>{
      if(gardes[date]) return;
      const unit=noelUnit(date);
      let cands=gardeDoctors.filter(m=>!SOUHAIT_PLAFOND.has(m)&&!noelDone.has(m)&&canHoldUnit(m,unit));
      if(cands.length<2) cands=gardeDoctors.filter(m=>!SOUHAIT_PLAFOND.has(m)&&canHoldUnit(m,unit));
      cands.sort((a,b)=>cmpKey(overdueKey(a),overdueKey(b)));
      if(cands.length<2){
        // Repli : aucun binôme ne peut tenir l'UNITÉ complète (VD vendredi↔dimanche ou
        // couplage férié). Plutôt que de laisser la date de Noël NON POURVUE — et de
        // laisser le placement chronologique consommer entre-temps les dernières
        // personnes disponibles — on place la date SEULE, exactement comme la
        // « VD exception » du placement chronologique. Le jour couplé sera pourvu
        // normalement par la suite.
        const seule=gardeDoctors.filter(m=>!SOUHAIT_PLAFOND.has(m)&&!blocked(m,date));
        seule.sort((a,b)=>cmpKey(overdueKey(a),overdueKey(b)));
        if(seule.length>=2){
          const [sA,sB]=choisirPaire(seule,[date]);
          const [gA,gB]=assignRoles(sA,sB);
          assign(date,gA,gB,dayByDate[date].dow);      // pas de cnt.vd : l'unité est rompue
          noelDatesAssigned.add(date); noelAssignees[date]=[sA,sB];
          noelDone.add(sA); noelDone.add(sB);
          warnings.push(`NOEL/AN ${date} : unité non tenable, date placée seule (repli)`);
          return;
        }
        warnings.push(`NOEL/AN ${date} : <2 dispo`);return;}
      const [A,B]=choisirPaire(cands,unit);
      assignUnit(unit,A,B); noelAssignees[date]=[A,B];
      noelDone.add(A);noelDone.add(B);
    });
    if(Object.keys(noelAssignees).length)
      Logger.log('Noël/An: '+Object.entries(noelAssignees).map(([d,ab])=>`${d}:${ab.join('+')}`).join(' | '));
  }

  // ── 7ter. JOURS CRITIQUES — pourvus AVANT tout le reste ───────────────
  // Un jour non pourvu est le SEUL défaut vraiment grave : il laisse le service sans
  // binôme. Les jours où très peu de MAR sont disponibles (semaine de Noël, ponts)
  // sont donc résolus EN PREMIER, par recherche exhaustive sur la série, avant que le
  // placement chronologique n'ait consommé les rares personnes disponibles.
  //
  // Pourquoi c'est nécessaire : sur une série de jours serrés, le placement glouton
  // choisit chaque jour le meilleur binôme selon l'équité, et épuise ainsi le vivier
  // du lendemain. Un humain, lui, fait alterner deux binômes sur la période — c'est
  // exactement ce que cette passe reproduit.
  //
  // Périmètre volontairement étroit : uniquement les jours SIMPLES (ni vendredi, ni
  // dimanche, ni férié couplé), pour ne pas interférer avec les unités VD et les
  // couplages fériés, qui ont leur propre logique éprouvée. Mesuré : ~1 jour par an.
  {
    const SEUIL_CRIT = 4;                       // vivier au-delà duquel il n'y a pas de risque
    // Nombre de jours de l'année où chaque MAR est structurellement disponible.
    const dispoAn = {}; gardeDoctors.forEach(id => dispoAn[id] = 0);
    allDays.forEach(d => gardeDoctors.forEach(id => { if (!blocked(id, d.date)) dispoAn[id]++; }));
    // Périmètre : ni vendredi, ni dimanche (unité VD), ni férié couplé — ET NI SAMEDI.
    // Un samedi placé ici bloque le vendredi et le dimanche encadrants (veille et
    // lendemain de garde) : il casse l'unité week-end de la personne retenue, qui ne
    // rattrape jamais son axe VD. Cause mesurée du décrochage de 2041 (−5,3).
    const simple = d => d.dow!==5 && d.dow!==0 && !(d.isFerie && (d.dow===1||d.dow===4));
    const poolOf = ds => gardeDoctors.filter(id => !blocked(id, ds));
    // 1) repérer les jours critiques encore libres (Noël/An est déjà posé)
    const crit = allDays.filter(d => !gardes[d.date] && simple(d) && poolOf(d.date).length <= SEUIL_CRIT);
    if (crit.length) {
      // 2) regrouper en séries de jours consécutifs
      const series = []; let cur = [];
      crit.forEach(d => {
        // helper local : shiftD est déclaré en const DANS le bloc 7bis, donc hors de portée ici
        const _j1 = ds => toDateStr(new Date(new Date(ds+'T12:00:00').getTime()+86400000));
        if (cur.length && _j1(cur[cur.length-1].date) === d.date) cur.push(d);
        else { if (cur.length) series.push(cur); cur = [d]; }
      });
      if (cur.length) series.push(cur);
      // 3) résoudre chaque série exhaustivement : 2 MAR par jour, jamais 2 jours de suite
      series.forEach(serie => {
        // Ordre de préférence : les MAR les MOINS souvent disponibles dans l'année
        // d'abord. Ils ont peu d'occasions de faire leur part ; les utiliser sur les
        // jours tendus préserve la marge de manœuvre des autres — et donc l'équité
        // globale, que les compteurs (encore vides à ce stade) ne peuvent pas guider.
        // Ordre de parcours : ÉQUITÉ d'abord (classement standard du moteur), la
        // disponibilité annuelle ne servant plus que de départage. L'ordre inverse —
        // retenu dans la première version — écrasait l'équité : il consommait sur les
        // jours tendus des MAR qui devaient faire des week-ends, sans rattrapage
        // possible (écart week-end mesuré : 5,3 gardes contre 3,5 pour le moteur
        // d'origine, sur 140 années simulées).
        const faire = relax => serie.map(d => {
          const p = gardeDoctors.filter(id => !blocked(id, d.date, relax));
          p.sort((a,b)=> cmp(scoreSelect(a,d.dow,d.isVjf,d.date), scoreSelect(b,d.dow,d.isVjf,d.date)) || (dispoAn[a]-dispoAn[b]));
          return p;
        });
        // Coût d'équité d'une affectation : plus le MAR est EN RETARD sur l'axe du jour
        // et au total, plus le coût est bas — donc plus il est légitime de la lui donner.
        const coutJour = (id,d) => ratio(id, (d.dow===4 && !d.isFerie) ? 'jeu' : (d.isVjf ? 'vjf' : 'total')) + ratioTotal(id);
        let pools = faire(false), relache = false;
        // On ne s'arrête PAS à la première solution : on énumère (sous borne dure) et on
        // retient la MOINS COÛTEUSE en équité. Les séries mesurées font 1 à 3 jours avec
        // des viviers de 3 ou 4 personnes : l'énumération est immédiate.
        const sol = [];
        let best = null, bestCout = Infinity, essais = 0;
        const MAX_ESSAIS = 20000;   // borne de sécurité : jamais d'explosion combinatoire
        const rec = (i, prev, cout) => {
          if (essais > MAX_ESSAIS) return;
          if (i === serie.length) { essais++; if (cout < bestCout) { bestCout = cout; best = sol.map(x => x.slice()); } return; }
          const p = pools[i];
          for (let a=0; a<p.length; a++) {
            if (prev.indexOf(p[a]) >= 0) continue;
            for (let b=a+1; b<p.length; b++) {
              if (prev.indexOf(p[b]) >= 0) continue;
              sol[i] = [p[a], p[b]];
              rec(i+1, sol[i], cout + coutJour(p[a],serie[i]) + coutJour(p[b],serie[i]));
              if (essais > MAX_ESSAIS) return;
            }
          }
          sol[i] = null;
        };
        rec(0, [], 0);
        let trouve = !!best;
        if (trouve) { for (let i=0;i<serie.length;i++) sol[i] = best[i]; }
        if (!trouve) {
          // Dernier recours : on tolère le combo jeudi↔samedi (G-RG-G), jamais deux
          // gardes d'affilée. Un jour non pourvu est bien plus grave qu'une garde
          // rapprochée, et c'est exactement l'arbitrage que fait le comité à la main.
          pools = faire(true); relache = true;
          best = null; bestCout = Infinity; essais = 0;
          rec(0, [], 0);
          trouve = !!best;
          if (trouve) { for (let i=0;i<serie.length;i++) sol[i] = best[i]; }
        }
        if (trouve) {
          serie.forEach((d,i) => {
            const [A,B] = sol[i];
            const [g,g2] = assignRoles(A,B);
            assign(d.date, g, g2, d.dow);
          });
          // Le comité doit SAVOIR quand la couverture a coûté cher en équité : c'est le
          // signal qu'il faut agir en amont, sur la pose des vacances de cette période.
          const _coutMoy = bestCout / (serie.length * 2);
          warnings.push(`Couverture : ${serie[0].date}${serie.length>1?'→'+serie[serie.length-1].date:''} pourvu en priorité${relache?' (jeudi↔samedi toléré)':''}${_coutMoy>2.2?' — ⚠ choix contraint, équité dégradée : à anticiper sur la pose des vacances':''}`);
        } else {
          warnings.push(`Couverture : série ${serie[0].date} sans solution même en priorité`);
        }
      });
    }
  }

  // ── 8a. SOUHAITS — deux régimes ──────────────────────────────────────
  // Régime 1 : souhait_plafond (PRUNET) = priorité absolue, peut dépasser sa cible.
  // Régime 2 : autres MAR = préférence de placement DANS leur cible, équitable
  //            (le moins-servi mène) ; la 2e place préfère un co-souhaiteur.
  const souhParJour={}; // date (dans l'année) -> souhaiteurs gardeDoctors
  Object.entries(souhaits).forEach(([date,ids])=>{
    if(!dayByDate[date]) return;
    souhParJour[date]=ids.filter(m=>gardeDoctors.indexOf(m)>=0);
  });
  const souhaitHonored={}; allDoctors.forEach(id=>{souhaitHonored[id]=0;});

  function placeSouhait(id,date){
    const dow=new Date(date+'T12:00:00').getDay();
    const vjf=dayByDate[date]?.isVjf;
    let co=(souhParJour[date]||[]).filter(m=>m!==id&&!blocked(m,date)
              &&(SOUHAIT_PLAFOND.has(m)||cnt[m].total<freeBudget[m]));
    let partner;
    if(co.length){
      co.sort((a,b)=>(souhaitHonored[a]-souhaitHonored[b])
                     ||cmp(scoreSelect(a,dow,vjf,date),scoreSelect(b,dow,vjf,date)));
      partner=co[0]; souhaitHonored[partner]++;
    } else {
      const others=gardeDoctors.filter(m=>m!==id&&!blocked(m,date));
      if(!others.length){warnings.push(`SOUHAIT ${id} ${date} sans binôme`);return false;}
      others.sort((a,b)=>cmp(scoreSelect(a,dow,vjf,date),scoreSelect(b,dow,vjf,date)));
      partner=others[0];
    }
    const [g,g2]=assignRoles(id,partner);
    assign(date,g,g2,dow);
    return true;
  }

  // Régime 1 — PRUNET (souhait_plafond) : priorité absolue
  gardeDoctors.filter(id=>SOUHAIT_PLAFOND.has(id)).forEach(id=>{
    Object.keys(souhParJour).filter(date=>souhParJour[date].indexOf(id)>=0).sort().forEach(date=>{
      if(gardes[date]||blocked(id,date)) return;
      if(placeSouhait(id,date)) souhaitHonored[id]++;
    });
  });

  // Régime 2 — autres MAR : équitable, DANS la cible
  Object.keys(souhParJour).sort().forEach(date=>{
    if(gardes[date]) return;
    // Défense en profondeur : un souhait n'est honoré que sur jour LIBRE (lun/mar/mer).
    // Un souhait sur jeudi/samedi/VD (axe d'équité) est ignoré → le MAR reçoit sa part
    // normale par l'équité, l'axe ne peut pas être monopolisé même si le garde-fou est contourné.
    const _dw=new Date(date+'T12:00:00').getDay(); if(_dw<1||_dw>3) return;
    const cands=souhParJour[date].filter(m=>!SOUHAIT_PLAFOND.has(m)&&!blocked(m,date)
                  &&cnt[m].total<freeBudget[m]);
    if(!cands.length) return; // sera rempli par la passe chronologique
    cands.sort((a,b)=>souhaitHonored[a]-souhaitHonored[b]); // le moins servi mène
    const lead=cands[0];
    if(placeSouhait(lead,date)) souhaitHonored[lead]++;
  });

  // 8b. Placement chronologique
  allDays.forEach(day=>{
    const date=day.date,dow=day.dow;
    if(gardes[date]) return; // déjà assigné (souhait ou dimanche VD)
    // (Couplages fériés) jeudi férié → binôme du samedi suivant ; lundi férié → binôme du samedi précédent.
    // Le férié couplé est compté dans l'axe samedi (assign avec dow=6) ; jfCnt le compte aussi comme férié.
    if(day.isFerie && (dow===4||dow===1)){
      const satDate=toDateStr(new Date(new Date(date+'T12:00:00').getTime()+(dow===4?2:-2)*86400000));
      if(gardes[satDate]){
        // samedi déjà placé → hériter du même binôme et des mêmes rôles
        const {g,g2}=gardes[satDate];
        if(g&&g2&&!blocked(g,date)&&!blocked(g2,date)){assign(date,g,g2,dow);return;} // vrai jour : lundi férié → LUNDI
        warnings.push(`Couplage férié : binôme samedi indispo ${date} (repli)`);
      } else if(dow===4){
        // jeudi férié, samedi pas encore placé → placer le binôme sur jeudi ET samedi
        const availC=gardeDoctors.filter(id=>!blocked(id,date)&&!blocked(id,satDate));
        if(availC.length>=2){
          const scoreSat=id=>[ratio(id,'sam'),ratioTotal(id),cnt[id].g+cnt[id].g2];
          availC.sort((a,b)=>cmp(scoreSat(a),scoreSat(b)));
          const A=availC[0];
          const rest=availC.filter(id=>id!==A); rest.sort((a,b)=>cmp(scoreSat(a),scoreSat(b)));
          const B=rest[0];
          const [g,g2]=assignRoles(A,B);
          assign(date,g,g2,dow);   // jeudi férié (dow=4) : exclu du comptage jour via _coupledF, JF seul
          assign(satDate,g,g2,6);  // samedi suivant, même binôme/rôles : SAMEDI + récup R
          return;
        }
        warnings.push(`Couplage jeudi férié impossible ${date} (repli)`);
      } else {
        warnings.push(`Lundi férié sans samedi placé ${date} (repli)`);
      }
      // repli : laisse continuer vers le placement normal ci-dessous
    }

    const avail=gardeDoctors.filter(id=>!blocked(id,date));
    if(avail.length<2){warnings.push(`Manque MAR ${date}`);gardes[date]={g:null,g2:null};return;}

    if(dow===5){
      // VENDREDI : VD (binôme vendredi+dimanche)
      const dimDate=toDateStr(new Date(new Date(date+'T12:00:00').getTime()+2*86400000));
      const dimExists=!!dayByDate[dimDate];
      // (COUVERTURE) Si le dimanche est DÉJÀ pourvu (repli de la rotation de Noël :
      // 25/12 tombant un dimanche, posé seul), ne pas reformer d'unité VD :
      // assign(dimDate) écraserait l'attribution de Noël et corromprait les
      // compteurs. Le vendredi est alors placé seul (« VD exception »).
      const availVD=(dimExists&&!gardes[dimDate])?avail.filter(id=>!blocked(id,dimDate)):[];
      if(availVD.length>=2){
        availVD.sort((a,b)=>cmp(scoreVD(a,date,dimDate),scoreVD(b,date,dimDate)));
        let A=availVD[0],B=availVD[1];
        // ── (COUVERTURE) Anticipation du SAMEDI intercalé ────────────────
        // Le binôme VD est bloqué vendredi, samedi (veille/lendemain) ET dimanche.
        // S'il ne restait plus 2 personnes disponibles le samedi, on descend dans
        // le classement scoreVD jusqu'à une paire qui préserve la couverture.
        // Strictement conditionnel : vivier large → RIEN ne change.
        const _samC=addOneDay(date);
        if(dayByDate[_samC]&&!gardes[_samC]){
          const _poolS=gardeDoctors.filter(id=>!blocked(id,_samC));
          if(_poolS.filter(id=>id!==A&&id!==B).length<2){
            let _ok=false;
            for(let i=0;i<availVD.length&&!_ok;i++)
              for(let j=i+1;j<availVD.length&&!_ok;j++)
                if(_poolS.filter(id=>id!==availVD[i]&&id!==availVD[j]).length>=2){
                  A=availVD[i];B=availVD[j];_ok=true;
                  warnings.push(`Couverture : binôme VD ${date} ajusté pour préserver le ${_samC}`);
                }
          }
        }
        cnt[A].vd++;cnt[B].vd++;
        // Rôles : celui qui a le moins de G prend G, et garde ce rôle vendredi ET dimanche
        const [gV,g2V]=assignRoles(A,B);
        assign(date,gV,g2V,5);
        assign(dimDate,gV,g2V,0); // même rôle sur tout le week-end (règle VD)
        return;
      } else {
        warnings.push(`VD exception ${date}`);
      }
    }

    // Génération normale : sélectionner 2 MARs par équité, puis attribuer rôles
    avail.sort((a,b)=>cmp(scoreSelect(a,dow,day.isVjf,day.date),scoreSelect(b,dow,day.isVjf,day.date)));
    let A=avail[0],B=avail[1];
    // ── (COUVERTURE) Anticipation d'UN jour ────────────────────────────
    // Ne pas vider le vivier du LENDEMAIN : les deux retenus y seront bloqués (jamais
    // deux gardes d'affilée). S'il ne resterait plus 2 personnes demain, on descend
    // dans le classement d'équité jusqu'à une paire qui préserve la couverture.
    // Strictement conditionnel : en temps normal le vivier est large et RIEN ne change.
    // Jours à préserver : le lendemain, plus le SAMEDI (+2) si on place un jeudi
    // non férié — le combo jeudi↔samedi bloque aussi le binôme du jeudi ce jour-là.
    // Vérification CONJOINTE : la paire retenue doit préserver TOUS ces jours à la
    // fois (ajuster pour l'un ne doit pas sacrifier l'autre).
    const _lendC=addOneDay(date);
    const _protC=[_lendC];
    if(dow===4&&!day.isFerie) _protC.push(addOneDay(_lendC));
    {
      const _pools={};
      _protC.forEach(_dP=>{ if(dayByDate[_dP]&&!gardes[_dP]) _pools[_dP]=gardeDoctors.filter(id=>!blocked(id,_dP)); });
      const _pres=(x,y)=>Object.keys(_pools).every(_dP=>_pools[_dP].filter(id=>id!==x&&id!==y).length>=2);
      if(Object.keys(_pools).length&&!_pres(A,B)){
        let _ok=false;
        for(let i=0;i<avail.length&&!_ok;i++)
          for(let j=i+1;j<avail.length&&!_ok;j++)
            if(_pres(avail[i],avail[j])){
              A=avail[i];B=avail[j];_ok=true;
              warnings.push(`Couverture : binôme ${date} ajusté pour préserver ${Object.keys(_pools).join(' et ')}`);
            }
      }
    }
    const [g,g2]=assignRoles(A,B);
    assign(date,g,g2,dow);
  });

  // ── 8c. OPTIMISEUR GLOBAL (recherche locale par transferts de créneaux) ─
  // Minimise Σ poids·(réel−cible)² sur les axes d'équité en transférant un
  // créneau (unité VD/couplage incluse) d'un MAR sur-cible vers un sous-cible.
  // Respecte espacements, NO_WEEKEND, plafond PRUNET, souhaits verrouillés et
  // l'intégrité VD / couplages fériés. ~0,1 s ; chacun finit à ≤1,3 de sa cible.
  {
    const W={vd:7,sam:6,jeu:5,vjf:5,jf:4,total:2}, WGG2=1;
    const EQ=['vd','sam','jf','jeu','vjf','total'];
    const KEYS=['dim','lun','mar','mer','jeu','ven','sam'];
    const ABS=new Set(['INDISPO','VAC','FORM','TP','CL','CTP']);
    const shift=(ds,n)=>toDateStr(new Date(new Date(ds+'T12:00:00').getTime()+n*86400000));
    // 1) Groupes de jours liés (VD ven/dim, couplages fériés) — union-find.
    const parent={};
    const find=x=>{if(parent[x]===undefined)parent[x]=x;let r=x;while(parent[r]!==r)r=parent[r];while(parent[x]!==r){const nx=parent[x];parent[x]=r;x=nx;}return r;};
    const union=(a,b)=>{parent[find(a)]=find(b);};
    const placedD=Object.keys(gardes).filter(d=>gardes[d].g);
    placedD.forEach(d=>{if(parent[d]===undefined)parent[d]=d;});
    placedD.forEach(d=>{
      const di=dayByDate[d],dow=di.dow;let p=null;
      if(dow===5)p=shift(d,2);
      else if(di.isFerie&&dow===4)p=shift(d,2);
      else if(di.isFerie&&dow===1)p=shift(d,-2);
      if(p&&gardes[p]&&gardes[p].g===gardes[d].g&&gardes[p].g2===gardes[d].g2)union(d,p);
    });
    const groups={};
    placedD.forEach(d=>{const r=find(d);(groups[r]||(groups[r]=[])).push(d);});
    // 2) Contribution (tous champs cnt) d'un groupe, indépendante du titulaire.
    const contribOf=days_=>{
      const c={total:0,sam:0,jeu:0,vd:0,vjf:0,ferie:0,jf:0,lun:0,mar:0,mer:0,ven:0,dim:0,recupR:0};
      days_.forEach(dd=>{const ad=assignDow[dd],di=dayByDate[dd];
        const coupledF=di.isFerie&&di.dow===4; // SEUL le jeudi férié couplé exclu du comptage jour
        c.total++; if(!coupledF){c[KEYS[ad]]++; if(ad===6)c.recupR++;}
        if(di.isVjf)c.vjf++; if(di.isFerie&&(di.dow===2||di.dow===3))c.ferie++; if(di.isFerie)c.jf++;});
      if(days_.some(dd=>assignDow[dd]===5))c.vd=1;
      return c;
    };
    // 3) Slots = (groupe, rôle 0=G/1=G2) ; verrou si titulaire = PRUNET ou souhait honoré.
    const slots=[];
    Object.values(groups).forEach(days_=>{
      const contrib=contribOf(days_);
      [0,1].forEach(role=>{
        const holder=role===0?gardes[days_[0]].g:gardes[days_[0]].g2;
        const locked=SOUHAIT_PLAFOND.has(holder)||days_.some(dd=>(souhParJour[dd]||[]).indexOf(holder)>=0)||days_.some(dd=>noelDatesAssigned.has(dd));
        slots.push({days:days_,role,contrib,locked});
      });
    });
    // 4) Faisabilité : B peut-il tenir ce rôle sur tous les jours du groupe ?
    const canHold=(B,days_)=>{
      for(let k=0;k<days_.length;k++){const dd=days_[k];
        const di=dayByDate[dd],dow=di.dow,s=indispos[B]?.[dd];
        if(ABS.has(s))return false;
        if(estSemaineOff(B,dd))return false;
        const _tpB=FLAGS.tpJoursFixes[B]; if(_tpB&&_tpB.has(dow))return false; // (D1)
        const ddg=FLAGS.dateDebut[B],dfg=FLAGS.dateFin[B];
        if(ddg&&dd<ddg)return false; if(dfg&&dd>=dfg)return false;
        if(NO_WEEKEND.has(B)&&(dow===0||dow===6||di.isFerie))return false;
        if(SOUHAIT_PLAFOND.has(B)&&di.isVjf)return false;
        if(SOUHAIT_PLAFOND.has(B)&&(dow===0||dow===5||dow===6||di.isFerie))return false; // (Fix A2)
        const gg=gardes[dd]; if(B===gg.g||B===gg.g2)return false;
        const adj=[shift(dd,-1),shift(dd,1)];
        for(let a=0;a<2;a++){if(days_.indexOf(adj[a])>=0)continue;
          const ag=gardes[adj[a]]; if(ag&&(B===ag.g||B===ag.g2))return false;}
        // combo jeudi-samedi interdit (hors jeudi férié)
        if(dow===6){const thu=shift(dd,-2),tdi=dayByDate[thu];
          if(days_.indexOf(thu)<0&&tdi&&!tdi.isFerie&&(gSet[B].has(thu)||g2Set[B].has(thu)))return false;}
        if(dow===4&&!di.isFerie){const sat=shift(dd,2);
          if(days_.indexOf(sat)<0&&(gSet[B].has(sat)||g2Set[B].has(sat)))return false;}
        // (VDM) un transfert ne crée JAMAIS de dimanche→mardi non souhaité
        if(dow===2&&!isSouhaitDe(B,dd)){const dim=shift(dd,-2);
          if(days_.indexOf(dim)<0&&(gSet[B].has(dim)||g2Set[B].has(dim)))return false;}
        if(dow===0){const mar=shift(dd,2);
          if(days_.indexOf(mar)<0&&(gSet[B].has(mar)||g2Set[B].has(mar))&&!isSouhaitDe(B,mar))return false;}
      }
      return true;
    };
    // 5) Coût marginal d'un transfert A→B (même rôle).
    const delta=(A,B,c,role)=>{
      let d=0;
      EQ.forEach(ax=>{const ca=c[ax];if(!ca)return;
        // cible effective = cible − dette (qui a trop fait en N-1 vise plus bas)
        const cbA=cible[A][ax]-(dette[A]?.[ax]||0),cbB=cible[B][ax]-(dette[B]?.[ax]||0),a0=cnt[A][ax],b0=cnt[B][ax];
        d+=W[ax]*((Math.pow(a0-ca-cbA,2)-Math.pow(a0-cbA,2))+(Math.pow(b0+ca-cbB,2)-Math.pow(b0-cbB,2)));});
      const n=c.total,aG=cnt[A].g,aG2=cnt[A].g2,bG=cnt[B].g,bG2=cnt[B].g2;
      let na,nb;
      if(role===0){na=(aG-n)-aG2;nb=(bG+n)-bG2;}else{na=aG-(aG2-n);nb=bG-(bG2+n);}
      d+=WGG2*((na*na-(aG-aG2)*(aG-aG2))+(nb*nb-(bG-bG2)*(bG-bG2)));
      return d;
    };
    // 6) Appliquer le transfert (tous champs cnt + rôle).
    const applyTr=(slot,B)=>{
      const role=slot.role,days_=slot.days,c=slot.contrib;
      const A=role===0?gardes[days_[0]].g:gardes[days_[0]].g2;
      days_.forEach(dd=>{
        if(role===0){gardes[dd].g=B;gSet[A].delete(dd);gSet[B].add(dd);}
        else{gardes[dd].g2=B;g2Set[A].delete(dd);g2Set[B].add(dd);}
        const _wk=dayByDate[dd].wk;
        weekCnt[A][_wk]=(weekCnt[A][_wk]||0)-1; weekCnt[B][_wk]=(weekCnt[B][_wk]||0)+1;
        if(isSouhaitDe(A,dd)) weekCntS[A][_wk]=(weekCntS[A][_wk]||0)-1; // (Fix A3)
        if(isSouhaitDe(B,dd)) weekCntS[B][_wk]=(weekCntS[B][_wk]||0)+1;
        const _m=Number(dd.slice(5,7));
        monthCnt[A][_m]=(monthCnt[A][_m]||0)-1; monthCnt[B][_m]=(monthCnt[B][_m]||0)+1;});
      Object.keys(c).forEach(ax=>{cnt[A][ax]-=c[ax];cnt[B][ax]+=c[ax];});
      const n=c.total;
      if(role===0){cnt[A].g-=n;cnt[B].g+=n;}else{cnt[A].g2-=n;cnt[B].g2+=n;}
    };
    // Règle 1 : vrai si `id` a déjà une garde de week-end (ven/sam/dim) sur le
    // week-end adjacent (±5 à ±9 j), hors jours du groupe courant.
    const hasAdjWeekend=(id,days_)=>{
      for(let gi=0;gi<days_.length;gi++){
        const base=new Date(days_[gi]+'T12:00:00');
        for(let n=-9;n<=9;n++){ if(n>=-4&&n<=4)continue;
          const x=new Date(base);x.setDate(base.getDate()+n);const xs=toDateStr(x);
          const dx=dayByDate[xs]; if(!dx)continue;
          if(dx.dow!==5&&dx.dow!==6&&dx.dow!==0)continue;
          if(days_.indexOf(xs)>=0)continue;
          if((gSet[id]&&gSet[id].has(xs))||(g2Set[id]&&g2Set[id].has(xs)))return true;
        }
      }
      return false;
    };
    // Lissage anti-chaînes : pénalise les gardes serrées (J±2/±3/±4) du même MAR.
    const _spacingPen=(id,days_)=>{
      let p=0;
      for(let gi=0;gi<days_.length;gi++){
        const b=new Date(days_[gi]+'T12:00:00');
        for(const n of [-4,-3,-2,2,3,4]){
          const x=new Date(b);x.setDate(b.getDate()+n);const xs=toDateStr(x);
          if(days_.indexOf(xs)>=0)continue;
          if((gSet[id]&&gSet[id].has(xs))||(g2Set[id]&&g2Set[id].has(xs))){
            const sw=isSouhaitDe(id,xs); // (Fix A3) voisin souhaité : pénalité réduite —
            // assez faible pour qu'un déficit d'équité VD la surpasse, assez forte
            // pour préférer, à équité égale, un MAR sans mardi souhaité adjacent.
            p+=Math.abs(n)===2?(sw?5:250):(Math.abs(n)===3?(sw?2:40):(sw?0:6));
          }
        }
      }
      return p;
    };
    // Anti 2 week-ends de garde consécutifs : garde ven/sam/dim sur le week-end adjacent.
    const _hasAdjWE=(id,days_)=>{
      for(let gi=0;gi<days_.length;gi++){
        const b=new Date(days_[gi]+'T12:00:00');
        for(let n=-9;n<=9;n++){ if(n>=-4&&n<=4)continue;
          const x=new Date(b);x.setDate(b.getDate()+n);const xs=toDateStr(x);
          const dx=dayByDate[xs]; if(!dx)continue;
          if(dx.dow!==5&&dx.dow!==6&&dx.dow!==0)continue;
          if(days_.indexOf(xs)>=0)continue;
          if((gSet[id]&&gSet[id].has(xs))||(g2Set[id]&&g2Set[id].has(xs)))return true;
        }
      }
      return false;
    };
    // 7) Recherche locale (best-improvement par slot, passes successives).
    const t0=Date.now();let moves=0;
    for(let pass=0;pass<60;pass++){
      let changed=false;
      for(let si=0;si<slots.length;si++){const slot=slots[si];
        if(slot.locked)continue;
        const days_=slot.days,role=slot.role;
        const A=role===0?gardes[days_[0]].g:gardes[days_[0]].g2;
        const _isWE=days_.some(dd=>{const w=dayByDate[dd].dow;return w===5||w===6||w===0;});
        let bestB=null,bestD=-1e-9;
        for(let bi=0;bi<gardeDoctors.length;bi++){const B=gardeDoctors[bi];
          if(B===A)continue;
          if(SOUHAIT_PLAFOND.has(B)&&cnt[B].total+slot.contrib.total>cible[B].total)continue;
          if(!canHold(B,days_))continue;
          let dd_=delta(A,B,slot.contrib,role);
          let wkPen=0; days_.forEach(dd=>{ if(((weekCnt[B][dayByDate[dd].wk]||0)-(weekCntS[B][dayByDate[dd].wk]||0))>=2) wkPen+=30; }); // (Fix A3)
          dd_+=wkPen;
          const WM=2; days_.forEach(dd=>{ const m=dayByDate[dd].month;
            const cb=monthCnt[B][m]||0, ca=monthCnt[A][m]||0, eb=monthExp[B][m]||0, ea=monthExp[A][m]||0;
            dd_+=WM*((Math.pow(cb+1-eb,2)-Math.pow(cb-eb,2))+(Math.pow(ca-1-ea,2)-Math.pow(ca-ea,2))); });
          // Règle 1 : éviter 2 week-ends de garde consécutifs (forte pénalité, souple)
          if(days_.some(dd=>{const w=dayByDate[dd].dow;return w===5||w===6||w===0;})){
            if(hasAdjWeekend(B,days_))dd_+=500;   // B enchaînerait 2 week-ends
            if(hasAdjWeekend(A,days_))dd_-=500;   // ce transfert soulage A d'un enchaînement
          }
          if(_isWE){ if(_hasAdjWE(B,days_))dd_+=500; if(_hasAdjWE(A,days_))dd_-=500; }
          dd_+=_spacingPen(B,days_)-_spacingPen(A,days_);
          if(dd_<bestD){bestD=dd_;bestB=B;}}
        if(bestB){applyTr(slot,bestB);moves++;changed=true;}
      }
      if(!changed||Date.now()-t0>20000)break;
    }
    Logger.log('Optimiseur: '+moves+' transferts');
    // 8) Recomposer rgSet / recupDue depuis l'état optimisé (pour R + 18h + STATS).
    allDoctors.forEach(id=>{rgSet[id]=new Set();});
    gardeDoctors.forEach(id=>{recupDue[id]=[];});
    Object.keys(gardes).forEach(dd=>{const gg=gardes[dd];if(!gg.g)return;
      [gg.g,gg.g2].forEach(id=>{if(!id)return;rgSet[id].add(addOneDay(dd));
        if(dayByDate[dd].dow===6)recupDue[id].push(dd);});}); // R = vrais samedis (jeudi/lundi férié couplé n'ouvre pas de R)
  }

  // ── 9. Placer les R ──────────────────────────────────────────────────
  const rAssigned={};
  allDoctors.forEach(id=>{
    if(!recupDue[id]) return;
    recupDue[id].forEach(samDate=>{
      const samDt=new Date(samDate+'T12:00:00');let placed=false;
      for(let w=2;w<=16&&!placed;w++){
        for(let off=0;off<5&&!placed;off++){
          const cDt=new Date(samDt);cDt.setDate(samDt.getDate()+w*7+off);
          const cDate=toDateStr(cDt);const cDow=cDt.getDay();
          if(cDow===0||cDow===6||dayByDate[cDate]?.isFerie||!cDate.startsWith(String(year))) continue;
          if(rAssigned[cDate]||blocked(id,cDate)||gSet[id]?.has(cDate)||g2Set[id]?.has(cDate)||rSet[id].has(cDate)) continue;
          if(isVacancesScolaires(cDate,year)) continue;
          if([-3,-2,-1,1,2,3].some(k=>{const x=new Date(cDt);x.setDate(cDt.getDate()+k);return rSet[id].has(toDateStr(x));})) continue;
          // Règle 2 : lisser les R — pas un autre R du même MAR à moins de 3 jours
          { let _tooClose=false; for(let _k=-2;_k<=2;_k++){ if(_k===0)continue;
              const _x=new Date(cDt);_x.setDate(cDt.getDate()+_k);
              if(rSet[id].has(toDateStr(_x))){_tooClose=true;break;} }
            if(_tooClose) continue; }
          const di=dayByDate[cDate];
          if(di&&!di.isReduced){
            const present=allDoctors.filter(m=>!blocked(m,cDate)&&!gSet[m]?.has(cDate)&&!g2Set[m]?.has(cDate)).length;
            if(present-1<(MIN_PRESENT[cDow]||15)) continue;
          }
          rSet[id].add(cDate);rAssigned[cDate]=true;placed=true;
        }
      }
      if(!placed){
        for(const _gap of [3,0]){            // 1re passe espacée (>=3j), 2e passe libre (garantit la pose)
          if(placed)break;
          for(const d of allDays){
            if(!d.isWeekday||d.isFerie||rAssigned[d.date]||isVacancesScolaires(d.date,year)) continue;
            if(blocked(id,d.date)||gSet[id]?.has(d.date)||g2Set[id]?.has(d.date)||rSet[id].has(d.date)) continue;
            if(_gap&&[-3,-2,-1,1,2,3].some(k=>{const x=new Date(d.date+'T12:00:00');x.setDate(x.getDate()+k);return rSet[id].has(toDateStr(x));})) continue;
            rSet[id].add(d.date);rAssigned[d.date]=true;placed=true;break;
          }
        }
      }
    });
  });

  // ── 10. 18h ───────────────────────────────────────────────────────────
  const weekdays=allDays.filter(d=>d.isWeekday&&!d.isFerie);
  // (18h proportionnel) Poids = quotité (col MEDECINS) × RATIO_18 pour les "seulement 18h"
  const w18=id=>((quot[id]||100)/100)*(ONLY_18.has(id)?RATIO_18:1);
  const sumW18=allDoctors.reduce((s,id)=>s+w18(id),0);
  const baseT=sumW18?weekdays.length/sumW18:0;
  const h18T={},h18cnt={},h18A={};
  allDoctors.forEach(id=>{h18T[id]=Math.round(baseT*w18(id));h18cnt[id]=0;});
  // Disponibilité 18h : exclut absences totales, gardes/récups, semaines "off"
  // (rythme 2/2) et BONNET les jeudi/vendredi (60%).
  const ABSENT_18 = new Set(['VAC','FORM','CL','TP','CTP','CP','A','RG_TRANSITION']);
  function dispo18(id,date){
    if(ABSENT_18.has(indispos[id]?.[date])) return false;
    if(estSemaineOff(id,date)) return false;
    if(gSet[id]?.has(date)||g2Set[id]?.has(date)||rgSet[id]?.has(date)||rSet[id]?.has(date)) return false;
    const _tp=FLAGS.tpJoursFixes[id]; // (C2-D3) jours fixes non travaillés → MEDECINS
    if(_tp && _tp.has(new Date(date+'T12:00:00').getDay())) return false;
    return true;
  }
  const h18wk={}; // semaines ISO où chaque MAR a déjà fait un 18h (≤ 1 par semaine)
  const did18wk=(id,date)=> h18wk[id]?h18wk[id].has(dayByDate[date].wk):false;
  const set18=(id,date)=>{ h18A[date]=id; h18cnt[id]++; (h18wk[id]||(h18wk[id]=new Set())).add(dayByDate[date].wk); };
  weekdays.forEach(day=>{
    const veille=toDateStr(new Date(new Date(day.date+'T12:00:00').getTime()-86400000)); // pas 2 x 18h d'affilée
    // (18h veille de garde samedi) le vendredi, le 18h revient au MAR de garde (G) du samedi
    if(day.dow===5){
      const satDate=toDateStr(new Date(new Date(day.date+'T12:00:00').getTime()+86400000));
      const satG=gardes[satDate]?.g;
      if(satG&&dispo18(satG,day.date)&&h18A[veille]!==satG&&!did18wk(satG,day.date)){set18(satG,day.date);return;}
    }
    // Replis successifs : on lève d'abord INDISPO, puis la veille, et seulement
    // en tout dernier recours la règle "≤ 1 par semaine".
    let pool=allDoctors.filter(id=>dispo18(id,day.date)&&h18A[veille]!==id&&!did18wk(id,day.date)&&indispos[id]?.[day.date]!=='INDISPO');
    if(!pool.length) pool=allDoctors.filter(id=>dispo18(id,day.date)&&h18A[veille]!==id&&!did18wk(id,day.date));
    if(!pool.length) pool=allDoctors.filter(id=>dispo18(id,day.date)&&!did18wk(id,day.date)); // garde "1/semaine"
    if(!pool.length) pool=allDoctors.filter(id=>dispo18(id,day.date)); // dernier recours absolu
    if(!pool.length){warnings.push(`Aucun 18h ${day.date}`);return;}
    pool.sort((a,b)=>(h18cnt[a]/(h18T[a]||1))-(h18cnt[b]/(h18T[b]||1)));
    set18(pool[0],day.date);
  });

  // ── 11. Compteurs JF/Noël (la VJF de semaine est comptée dans cnt.vjf) ──
  const jfCnt={},noelAnCnt={};
  allDoctors.forEach(id=>{jfCnt[id]=0;noelAnCnt[id]=0;});
  const NOEL=new Set();
  [year,year+1].forEach(y=>[`${y}-12-24`,`${y}-12-25`,`${y}-12-31`,`${y+1}-01-01`].forEach(d=>NOEL.add(d)));
  allDays.forEach(day=>{
    const gg=gardes[day.date]||{};
    [gg.g,gg.g2].forEach(id=>{
      if(!id) return;
      if(day.isFerie)jfCnt[id]=(jfCnt[id]||0)+1;
      if(NOEL.has(day.date))noelAnCnt[id]=(noelAnCnt[id]||0)+1;
    });
  });

  // ── 12. Écrire GARDES_YYYY ────────────────────────────────────────────
  let gs=ss.getSheetByName(`GARDES_${year}`);if(gs)ss.deleteSheet(gs);
  gs=ss.insertSheet(`GARDES_${year}`);gs.setFrozenRows(3);
  const ROUGE='#C0392B',GRIS='#CFD8DC',BLANC='#FFFFFF';
  const JOURS=['D','L','M','M','J','V','S'];
  const nCols=allDays.length+1;
  const row1=['MEDECIN'];allDays.forEach(()=>row1.push(''));
  gs.getRange(1,1,1,nCols).setValues([row1]);
  gs.getRange(1,1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');
  // (UX) En-têtes de mois par tranches hebdomadaires : le mois reste visible à
  // toute position de scroll (helper partagé ecrireEntetesMois, code.gs).
  // Corrige aussi l'ancien bug mStart=1 : la fusion « Janvier » avalait A1 (MEDECIN).
  ecrireEntetesMois(gs, allDays);
  const row2=['JOUR'];allDays.forEach(d=>row2.push(JOURS[d.dow]));
  gs.getRange(2,1,1,nCols).setValues([row2]);gs.getRange(2,1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');
  const row3=['N°'];allDays.forEach(d=>row3.push(d.date.slice(-2)));
  gs.getRange(3,1,1,nCols).setValues([row3]);gs.getRange(3,1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');
  const dRows=allDoctors.map(id=>{
    const row=[id];
    allDays.forEach(day=>{
      let v='';
      if(gSet[id]?.has(day.date))v='G';
      else if(g2Set[id]?.has(day.date))v='G2';
      else if(rgSet[id]?.has(day.date)||indispos[id]?.[day.date]==='RG_TRANSITION')v='RG';
      else if(rSet[id]?.has(day.date))v='R';
      else if(h18A[day.date]===id)v='18';
      else{const s=indispos[id]?.[day.date];if(s==='VAC')v='V';else if(s==='INDISPO')v='I';else if(s==='FORM')v='F';else if(s==='CL')v='CL';else if(s==='TP'||s==='CTP')v='TP';}
      row.push(v);
    });
    return row;
  });
  gs.getRange(4,1,dRows.length,nCols).setValues(dRows);
  // OPTIM : construire la matrice de fonds et l'appliquer en UN appel (setBackgrounds)
  const nRows=3+dRows.length;
  // Grisage WE/fériés : lignes 2..nRows uniquement — la ligne 1 (bandeau des mois)
  // garde ses teintes alternées posées par ecrireEntetesMois.
  const bgMatrix=[];
  for(let r=1;r<nRows;r++){
    const rowBg=[];
    allDays.forEach(day=>{rowBg.push((day.dow===0||day.dow===6||day.isFerie)?GRIS:BLANC);});
    bgMatrix.push(rowBg);
  }
  gs.getRange(2,2,nRows-1,allDays.length).setBackgrounds(bgMatrix);
  // Bordures de fin de mois : un seul passage, regroupé
  allDays.forEach((day,i)=>{
    if(!allDays[i+1]||allDays[i+1].month!==day.month){
      gs.getRange(1,i+2,nRows,1).setBorder(null,null,null,true,null,null,'#000000',SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    }
  });
  // OPTIM : largeurs en une fois via setColumnWidths
  gs.setColumnWidth(1,120);
  gs.setColumnWidths(2,nCols-1,35);
  gs.getRange(1,2,nRows,nCols-1).setHorizontalAlignment('center');

  // ── 13. STATS ─────────────────────────────────────────────────────────
  let st=ss.getSheetByName(`STATS_GARDES_${year}`);if(st)ss.deleteSheet(st);
  st=ss.insertSheet(`STATS_GARDES_${year}`);
  st.getRange(1,1,1,23).setValues([['MEDECIN','CIBLE','TOTAL G','G (REA)','G2 (MAT)','LUN','MAR','MER','JEU','VEN','SAM','DIM','RECUP R','18H','JF','VEILLE JF','NOEL/AN','CIBLE SAM','CIBLE JEU','CIBLE VD','VD','CIBLE VJF','CIBLE JF']]).setFontWeight('bold');
  const sRows=allDoctors.map(id=>{
    const cbT=cible[id]?cible[id].total:0;
    const cbS=cible[id]?cible[id].sam:0, cbJ=cible[id]?cible[id].jeu:0, cbV=cible[id]?cible[id].vd:0, cbVjf=cible[id]?cible[id].vjf:0;
    const cbJf=cible[id]?cible[id].jf:0; // (RH-3) exploité par la dette de N+1
    const c=cnt[id]||{total:0,g:0,g2:0,lun:0,mar:0,mer:0,jeu:0,ven:0,sam:0,dim:0,recupR:0,vd:0,vjf:0};
    return[id,"'"+cbT.toFixed(1),c.total,c.g,c.g2,c.lun,c.mar,c.mer,c.jeu,c.ven,c.sam,c.dim,c.recupR,
      h18cnt[id]||0,jfCnt[id]||0,c.vjf||0,noelAnCnt[id]||0,
      +cbS.toFixed(1),+cbJ.toFixed(1),+cbV.toFixed(1),c.vd||0,+cbVjf.toFixed(1),+cbJf.toFixed(1)];
  });
  st.getRange(2,1,sRows.length,23).setValues(sRows);
  st.getRange(2,2,sRows.length,1).setNumberFormat('@STRING@');
  st.setColumnWidth(1,140);

  warnings.forEach(w=>Logger.log(w));
  const gd=gardeDoctors.filter(id=>cnt[id]);
  const noWE=gd.filter(id=>!NO_WEEKEND.has(id));
  const stat=(arr,k)=>{const v=arr.map(id=>cnt[id][k]);return`${Math.min(...v)}–${Math.max(...v)}`;};
  try{
    SpreadsheetApp.getUi().alert(
      `✅ Planning ${year}\n\n`+
      `Total   : ${stat(gd,'total')}\n`+
      `Samedi  : ${stat(noWE,'sam')}\n`+
      `Jeudi   : ${stat(gd,'jeu')}\n`+
      `VD      : ${stat(noWE,'vd')}\n`+
      `VeilleJF: ${stat(gd,'vjf')}\n`+
      `G/G2    : ${stat(gd,'g')} / ${stat(gd,'g2')}\n`+
      `Exceptions VD : ${warnings.filter(w=>w.includes('VD')).length}`
    );
  }catch(e){Logger.log('✅ généré');}
}

function testGenerate2027(){generateGardes(2027);}
function renameMonthlySheets(){
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(s=>{
    const n=s.getName();if(n.startsWith('Copie de '))s.setName(n.replace('Copie de ',''));});
}
// Déplace GARDES/INDISPOS/STATS/AFFECTATIONS de l'année N vers le classeur d'archives.
// Sûr : copie → vérifie → supprime. À tester en isolé AVANT de câbler en W3.
function archiveMoveTabs_(year) {
  const master = SpreadsheetApp.getActiveSpreadsheet();
  const arch   = SpreadsheetApp.openById(ARCHIVE_SS_ID);
  const noms = ['GARDES_'+year, 'INDISPOS_'+year, 'STATS_GARDES_'+year, 'AFFECTATIONS_'+year];
  const rapport = [];
  noms.forEach(nom => {
    const src = master.getSheetByName(nom);
    if (!src) { rapport.push('⏭️ '+nom+' : absent du maître'); return; }
    if (arch.getSheetByName(nom)) { rapport.push('✓ '+nom+' : déjà archivé (maître non touché)'); return; }
    const copie = src.copyTo(arch);
    copie.setName(nom);
    const coherent = copie.getLastRow() === src.getLastRow()
                  && copie.getLastColumn() === src.getLastColumn();
    if (!coherent) { arch.deleteSheet(copie); rapport.push('⚠️ '+nom+' : copie incohérente → suppression ANNULÉE'); return; }
    master.deleteSheet(src);
    rapport.push('📦 '+nom+' : archivé puis retiré du maître');
  });
  Logger.log(rapport.join('\n'));
  return rapport;
}
// Lanceur de test (visible dans le menu Exécuter). Change l'année si besoin.
function testArchiveMove() {
  const rapport = archiveMoveTabs_(1999);
  Logger.log(rapport.join('\n'));
  try { SpreadsheetApp.getUi().alert('Archivage test\n\n' + rapport.join('\n')); } catch(e) {}
}
