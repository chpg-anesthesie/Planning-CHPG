const ARCHIVE_SS_ID = '1-QIYD2U7u41L_pV4wQGN6kDBDzFRHDdXRsHNrcSlvcE';

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
const MIN_PRESENT   = {1:16, 2:15, 3:16, 4:15, 5:15};
// (C2-D3) Rythme 2/2 lu depuis MEDECINS (colonne rythme_2sur2, via getMedecinFlags).
// Ancre semaine 23/2026 conservée en dur (la dérive année-53-sem. = Fix A, séparé).
function estSemaineOff(id, dateStr){
  if(!getMedecinFlags().rythme2sur2.has(id)) return false;
  const w = getISOWeek(dateStr);
  const yr = Number(dateStr.slice(0,4));
  return ((((yr - 2026)*52 + (w - 23)) % 4) + 4) % 4 >= 2;
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

  // ── 2. Médecins ──────────────────────────────────────────────────────
  const medData=ss.getSheetByName('MEDECINS').getDataRange().getValues();
  const allDoctors=[],gardeDoctors=[],pct={};
  for(let r=1;r<medData.length;r++){
    const id=String(medData[r][0]).trim();
    if(!id||id==='DRUGE') continue;
    allDoctors.push(id);pct[id]=Number(medData[r][5])||100;
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
    allDays.push({date:ds,dow,month:dt.getMonth()+1,
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
  gardeDoctors.forEach(id=>{dette[id]={sam:0,jeu:0,vd:0,vjf:0,total:0};});
  let prevStats=ss.getSheetByName(`STATS_GARDES_${year-1}`);
  if(!prevStats){
    // Repli : l'onglet N-1 a pu être déplacé vers le classeur d'archives (W3)
    try { prevStats=SpreadsheetApp.openById(ARCHIVE_SS_ID).getSheetByName(`STATS_GARDES_${year-1}`); }
    catch(e){ /* archives inaccessibles → dette neutre, l'algo continue */ }
  }
  if(prevStats){
    const ps=prevStats.getDataRange().getValues();
    const hdr=ps[0].map(h=>String(h).trim());
    const iCSam=hdr.indexOf('CIBLE SAM'), iCJeu=hdr.indexOf('CIBLE JEU'), iCVd=hdr.indexOf('CIBLE VD'), iCVjf=hdr.indexOf('CIBLE VJF');
    const iSam=hdr.indexOf('SAM'), iJeu=hdr.indexOf('JEU'), iVd=hdr.indexOf('VD'), iVjf=hdr.indexOf('VEILLE JF');
    const num=v=>{const x=parseFloat(String(v).replace(/[^\d.]/g,'')); return isNaN(x)?null:x;};
    for(let r=1;r<ps.length;r++){
      const id=String(ps[r][0]).trim();
      if(!id||!dette[id]) continue;
      if(iCSam>=0&&iSam>=0){const c=num(ps[r][iCSam]); if(c!==null) dette[id].sam=(Number(ps[r][iSam])||0)-c;}
      if(iCJeu>=0&&iJeu>=0){const c=num(ps[r][iCJeu]); if(c!==null) dette[id].jeu=(Number(ps[r][iJeu])||0)-c;}
      if(iCVd>=0 &&iVd>=0 ){const c=num(ps[r][iCVd]);  if(c!==null) dette[id].vd =(Number(ps[r][iVd]) ||0)-c;}
      if(iCVjf>=0&&iVjf>=0){const c=num(ps[r][iCVjf]); if(c!==null) dette[id].vjf=(Number(ps[r][iVjf])||0)-c;}
    }
  }

  // ── 5. Cibles proportionnelles à la quotité ──────────────────────────
  const sumPct=gardeDoctors.reduce((s,id)=>s+pct[id]/100,0);
  const sumPctWE=gardeDoctors.reduce((s,id)=>NO_WEEKEND.has(id)?s:s+pct[id]/100,0);
  const nDays=allDays.length;
  const nSam=allDays.filter(d=>d.dow===6).length;
  const nJeu=allDays.filter(d=>d.dow===4).length;
  const nVen=allDays.filter(d=>d.dow===5).length;
  const nVjf=allDays.filter(d=>d.isVjf).length;
  const cible={};
  gardeDoctors.forEach(id=>{
    const p=pct[id]/100;
    cible[id]={
      total:(nDays*2)*p/sumPct,
      sam:NO_WEEKEND.has(id)?0:(nSam*2)*p/sumPctWE,
      jeu:(nJeu*2)*p/sumPct,
      vd:NO_WEEKEND.has(id)?0:(nVen*2)*p/sumPctWE,
      vjf:(nVjf*2)*p/sumPct,   // veilles de semaine : jours ouvrés → tous éligibles (PRUNET inclus)
    };
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
  // ── 6. État ──────────────────────────────────────────────────────────
  const gSet={},g2Set={},rgSet={},rSet={};
  const cnt={};
  gardeDoctors.forEach(id=>{
    gSet[id]=new Set();g2Set[id]=new Set();rgSet[id]=new Set();rSet[id]=new Set();
    cnt[id]={total:0,g:0,g2:0,sam:0,jeu:0,ven:0,vd:0,vjf:0,lun:0,mar:0,mer:0,dim:0,recupR:0};
  });
  allDoctors.forEach(id=>{if(!rSet[id])rSet[id]=new Set();if(!rgSet[id])rgSet[id]=new Set();});

  function blocked(id,date){
    const s=indispos[id]?.[date];
    if(s==='INDISPO'||s==='VAC'||s==='FORM'||s==='TP'||s==='CL'||s==='CTP') return true;
    if(estSemaineOff(id,date)) return true;   // ← AJOUT : semaine "off" du rythme 2/2
    if(rgSet[id].has(date)||rSet[id]?.has(date)) return true;
    const _lend=addOneDay(date);
    if(gSet[id]?.has(_lend)||g2Set[id]?.has(_lend)) return true; // jamais 2 gardes d'affilée, même si la garde du lendemain est déjà posée (souhait/VD hors ordre chrono)
    if(s==='RG_TRANSITION') return true;
    const dow=new Date(date+'T12:00:00').getDay();
    if(NO_WEEKEND.has(id)&&(dow===0||dow===6)) return true;
    const di=dayByDate[date];
    if(NO_WEEKEND.has(id)&&di?.isFerie) return true;
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
  function spacingPenalty(id, date){
    const has = n => {
      const x = new Date(date + 'T12:00:00'); x.setDate(x.getDate() + n);
      const ds = toDateStr(x);
      return (gSet[id] && gSet[id].has(ds)) || (g2Set[id] && g2Set[id].has(ds));
    };
    if (has(-2) || has(2)) return 100;
    if (has(-3) || has(3)) return 10;
    if (has(-4) || has(4)) return 1;
    return 0;
  }
  // Score de SÉLECTION (sans distinction G/G2) :
  //   [ratio axe prioritaire du jour, ratio total, total brut]
  function scoreSelect(id,dow,isVjf,date){
    const space=spacingPenalty(id,date); // lissage : prime sur l'équité (tue jeudi→samedi + 1j/2)
    const prim=dow===6?[ratio(id,'sam')]:dow===4?[ratio(id,'jeu')]:[];
    if(isVjf) prim.push(ratio(id,'vjf'));
    return [space].concat(prim).concat([ratioTotal(id),cnt[id].total]);
  }
  function scoreVD(id){return [ratio(id,'vd'),ratioTotal(id),cnt[id].g+cnt[id].g2];}
  function cmp(a,b){for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]-b[i];}return 0;}
  // Attribution des rôles G/G2 entre 2 MARs : celui qui a le moins de G prend G
  function assignRoles(A,B){
    if((cnt[A].g-cnt[A].g2)<=(cnt[B].g-cnt[B].g2)) return [A,B];
    return [B,A];
  }

  function assign(date,g,g2,dow){
    gardes[date]={g,g2};
    [[g,false],[g2,true]].forEach(([id,isg2])=>{
      if(!id) return;
      if(isg2){g2Set[id].add(date);cnt[id].g2++;}else{gSet[id].add(date);cnt[id].g++;}
      rgSet[id].add(addOneDay(date));
      cnt[id].total++;
      const KEYS=['dim','lun','mar','mer','jeu','ven','sam'];
      cnt[id][KEYS[dow]]++;
      if(dow===6)cnt[id].recupR++;
      if(dayByDate[date]?.isVjf)cnt[id].vjf++;
    });
  }

  // ── 8. Placement ─────────────────────────────────────────────────────
  const gardes={};
  const warnings=[];

  // 8a. PRUNET SOUHAIT en premier (s'ajoute au quota)
  Object.entries(souhaits).forEach(([date,ids])=>{
    ids.forEach(id=>{
      if(gardes[date]) return; // jour déjà pris
      if(NO_GARDE.has(id)) return; // sécurité : NO_GARDE ne peut pas être de garde
      if(blocked(id,date)) return; // ← souhaiteur RG/indispo/plafonné ce jour → souhait non honoré (jamais 2 gardes d'affilée)
      const dow=new Date(date+'T12:00:00').getDay();
      if(NO_WEEKEND.has(id)&&(dow===0||dow===6)) return; // sécurité WE
      const others=gardeDoctors.filter(m=>m!==id&&!blocked(m,date));
      if(others.length<1){warnings.push(`SOUHAIT ${id} ${date} sans binôme`);return;}
      const _vjf=dayByDate[date]?.isVjf;
      others.sort((a,b)=>cmp(scoreSelect(a,dow,_vjf,date),scoreSelect(b,dow,_vjf,date)));
      const partner=others[0];
      // Attribuer les rôles G/G2 entre le souhaiteur et son binôme
      const [g,g2]=assignRoles(id,partner);
      assign(date,g,g2,dow);
    });
  });

  // 8b. Placement chronologique
  allDays.forEach(day=>{
    const date=day.date,dow=day.dow;
    if(gardes[date]) return; // déjà assigné (souhait ou dimanche VD)

    const avail=gardeDoctors.filter(id=>!blocked(id,date));
    if(avail.length<2){warnings.push(`Manque MAR ${date}`);gardes[date]={g:null,g2:null};return;}

    if(dow===5){
      // VENDREDI : VD (binôme vendredi+dimanche)
      const dimDate=toDateStr(new Date(new Date(date+'T12:00:00').getTime()+2*86400000));
      const dimExists=!!dayByDate[dimDate];
      const availVD=dimExists?avail.filter(id=>!blocked(id,dimDate)):[];
      if(availVD.length>=2){
        availVD.sort((a,b)=>cmp(scoreVD(a),scoreVD(b)));
        const A=availVD[0];
        const rest=availVD.filter(id=>id!==A);
        rest.sort((a,b)=>cmp(scoreVD(a),scoreVD(b)));
        const B=rest[0];
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
    const A=avail[0],B=avail[1];
    const [g,g2]=assignRoles(A,B);
    assign(date,g,g2,dow);
  });

  // ── 9. Placer les R ──────────────────────────────────────────────────
  const rAssigned={};
  allDoctors.forEach(id=>{
    if(!gSet[id]) return;
    allDays.filter(d=>d.isSat&&(gSet[id]?.has(d.date)||g2Set[id]?.has(d.date))).forEach(sam=>{
      const samDt=new Date(sam.date+'T12:00:00');let placed=false;
      for(let w=2;w<=16&&!placed;w++){
        for(let off=0;off<5&&!placed;off++){
          const cDt=new Date(samDt);cDt.setDate(samDt.getDate()+w*7+off);
          const cDate=toDateStr(cDt);const cDow=cDt.getDay();
          if(cDow===0||cDow===6||!cDate.startsWith(String(year))) continue;
          if(rAssigned[cDate]||blocked(id,cDate)||gSet[id]?.has(cDate)||g2Set[id]?.has(cDate)||rSet[id].has(cDate)) continue;
          if(isVacancesScolaires(cDate,year)) continue;
          const di=dayByDate[cDate];
          if(di&&!di.isReduced){
            const present=allDoctors.filter(m=>!blocked(m,cDate)&&!gSet[m]?.has(cDate)&&!g2Set[m]?.has(cDate)).length;
            if(present-1<(MIN_PRESENT[cDow]||15)) continue;
          }
          rSet[id].add(cDate);rAssigned[cDate]=true;placed=true;
        }
      }
      if(!placed){
        for(const d of allDays){
          if(!d.isWeekday||rAssigned[d.date]||isVacancesScolaires(d.date,year)) continue;
          if(blocked(id,d.date)||gSet[id]?.has(d.date)||g2Set[id]?.has(d.date)||rSet[id].has(d.date)) continue;
          rSet[id].add(d.date);rAssigned[d.date]=true;break;
        }
      }
    });
  });

  // ── 10. 18h ───────────────────────────────────────────────────────────
  const weekdays=allDays.filter(d=>d.isWeekday&&!d.isFerie);
  const nN=allDoctors.filter(id=>!ONLY_18.has(id)).length;
  const nML=[...ONLY_18].filter(id=>allDoctors.includes(id)).length;
  const baseT=weekdays.length/(nN+nML*RATIO_18);
  const h18T={},h18cnt={},h18A={};
  allDoctors.forEach(id=>{h18T[id]=ONLY_18.has(id)?Math.round(baseT*RATIO_18):Math.round(baseT);h18cnt[id]=0;});
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
  weekdays.forEach(day=>{
    // Primaire : on évite les INDISPO. Repli : on les admet si personne d'autre.
    let pool=allDoctors.filter(id=>dispo18(id,day.date)&&indispos[id]?.[day.date]!=='INDISPO');
    if(!pool.length) pool=allDoctors.filter(id=>dispo18(id,day.date));
    if(!pool.length){warnings.push(`Aucun 18h ${day.date}`);return;}
    pool.sort((a,b)=>(h18cnt[a]/(h18T[a]||1))-(h18cnt[b]/(h18T[b]||1)));
    h18A[day.date]=pool[0];h18cnt[pool[0]]++;
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
  const MOIS_FR=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const nCols=allDays.length+1;
  const row1=['MEDECIN'];allDays.forEach(()=>row1.push(''));
  gs.getRange(1,1,1,nCols).setValues([row1]);
  gs.getRange(1,1).setFontWeight('bold').setBackground(ROUGE).setFontColor('#FFFFFF');
  let mStart=1,prevMonth=allDays[0].month;
  allDays.forEach((day,i)=>{
    const col=i+2;
    if(day.month!==prevMonth||i===allDays.length-1){
      const mEnd=day.month!==prevMonth?col-1:col;
      if(mEnd>mStart)gs.getRange(1,mStart,1,mEnd-mStart+1).merge();
      gs.getRange(1,mStart).setValue(MOIS_FR[prevMonth-1]).setBackground(ROUGE).setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
      mStart=col;prevMonth=day.month;
    }
  });
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
  const bgMatrix=[];
  for(let r=0;r<nRows;r++){
    const rowBg=[];
    allDays.forEach(day=>{rowBg.push((day.dow===0||day.dow===6||day.isFerie)?GRIS:BLANC);});
    bgMatrix.push(rowBg);
  }
  gs.getRange(1,2,nRows,allDays.length).setBackgrounds(bgMatrix);
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
  st.getRange(1,1,1,22).setValues([['MEDECIN','CIBLE','TOTAL G','G (REA)','G2 (MAT)','LUN','MAR','MER','JEU','VEN','SAM','DIM','RECUP R','18H','JF','VEILLE JF','NOEL/AN','CIBLE SAM','CIBLE JEU','CIBLE VD','VD','CIBLE VJF']]).setFontWeight('bold');
  const sRows=allDoctors.map(id=>{
    const cbT=cible[id]?cible[id].total:0;
    const cbS=cible[id]?cible[id].sam:0, cbJ=cible[id]?cible[id].jeu:0, cbV=cible[id]?cible[id].vd:0, cbVjf=cible[id]?cible[id].vjf:0;
    const c=cnt[id]||{total:0,g:0,g2:0,lun:0,mar:0,mer:0,jeu:0,ven:0,sam:0,dim:0,recupR:0,vd:0,vjf:0};
    return[id,"'"+cbT.toFixed(1),c.total,c.g,c.g2,c.lun,c.mar,c.mer,c.jeu,c.ven,c.sam,c.dim,c.recupR,
      h18cnt[id]||0,jfCnt[id]||0,c.vjf||0,noelAnCnt[id]||0,
      +cbS.toFixed(1),+cbJ.toFixed(1),+cbV.toFixed(1),c.vd||0,+cbVjf.toFixed(1)];
  });
  st.getRange(2,1,sRows.length,22).setValues(sRows);
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
