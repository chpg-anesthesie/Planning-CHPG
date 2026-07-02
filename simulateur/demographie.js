// ═══ SIMULATION DÉMOGRAPHIQUE 2027→2046 — le VRAI algo, année par année ═══
const H=require('./harness.js'), A=require('./analyse.js');

const NAISSANCE={SULTAN:1961,MENADE:1967,GUERIN:1969,CATINEAU:1974,ARMANDO:1975,ROUSSEAU:1976,
  ALBOUY:1977,PRUNET:1977,GHIGLIONE:1978,LEY:1981,OPPRECHT:1982,ZAMARON:1986,SEVERAC:1986,
  SALA:1986,LEVASSEUR:1987,SUPLY:1990,WIDEHEM:1991,FROHLICH:1992,PARTOUCHE:1992,ARMAND:1993};
const PCT={LEY:90,SEVERAC:80}; // défaut 100
const FLAGS0={PRUNET:{noWeekend:1,souhaitPlafond:1}};

function buildRoster(year,{ageExempt=60,ageRetraite=67}){
  const roster=[]; const repl=[];
  // remplaçants générés par les départs passés (sauf SULTAN/WS)
  Object.entries(NAISSANCE).forEach(([id,born])=>{
    const retYear=born+ageRetraite;
    if(year>=retYear){ if(id!=='SULTAN') repl.push({id:'REMPL_'+id, born:retYear-35}); return; }
    const age=year-born;
    const f={...(FLAGS0[id]||{})};
    if(age>=ageExempt) f.noGarde=1;
    roster.push([id, PCT[id]||100, PCT[id]||100, f]);
  });
  repl.forEach(r=>{
    const age=year-r.born;
    const f={}; if(age>=ageExempt) f.noGarde=1; // un remplaçant peut vieillir aussi (35+25=60 → hors fenêtre 2046, ok)
    roster.push([r.id,100,100,f]);
  });
  return roster;
}

// Absences réalistes déterministes : ~7 semaines/MAR, étalées
function buildAbsences(year,roster){
  const im={};
  roster.forEach(([id],idx)=>{
    im[id]={};
    for(let k=0;k<7;k++){
      const startWeek=(idx*7+k*8)%50; // étalement déterministe
      const d0=new Date(year,0,5+startWeek*7,12);
      for(let j=0;j<7;j++){
        const dt=new Date(d0); dt.setDate(d0.getDate()+j);
        if(dt.getFullYear()!==year) continue;
        const ds=`${year}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
        im[id][ds]='VAC';
      }
    }
  });
  return im;
}

function yearMetrics(res,year,roster){
  const s=H.readStats(res.ss,year).byId;
  const P=A.parsePlanning(res.ss,year);
  const gardeurs=Object.keys(s).filter(id=>+s[id]['TOTAL G']>0);
  const tot=gardeurs.map(id=>+s[id]['TOTAL G']);
  const sam=gardeurs.map(id=>+s[id]['SAM']);
  const vd=gardeurs.map(id=>+s[id]['VD']);
  const manque=res.logs.filter(l=>l.includes('Manque MAR')).length;
  // gardes serrées : J±2 hors VD/couplages fériés
  const feries=new Set([...res.ctx.getJoursFeries(year),...res.ctx.getJoursFeries(year+1)]);
  let serres=0, tripleSem=0;
  Object.entries(P.byDoc).forEach(([id,days])=>{
    const gd=Object.keys(days).filter(d=>days[d]==='G'||days[d]==='G2').sort();
    const wk={};
    gd.forEach(d=>{
      const d2=A.addD(d,2);
      if(gd.includes(d2)){
        const legit=(A.DOW(d)===5&&A.DOW(d2)===0)||(A.DOW(d)===4&&feries.has(d))||(A.DOW(d)===6&&feries.has(d2));
        if(!legit) serres++;
      }
      const m=new Date(d+'T12:00:00'); m.setDate(m.getDate()-((m.getDay()+6)%7));
      const k=m.toISOString().slice(0,10); wk[k]=(wk[k]||0)+1;
    });
    Object.values(wk).forEach(n=>{if(n>=3)tripleSem++;});
  });
  return {n:gardeurs.length, moy:(tot.reduce((a,b)=>a+b,0)/gardeurs.length),
    max:Math.max(...tot), maxSam:Math.max(...sam), maxVd:Math.max(...vd),
    manque, serres, tripleSem};
}

function runPolicy(name,{ageExempt,ageRetraite}){
  console.log(`\n════ POLITIQUE : ${name} (exemption ${ageExempt} ans, retraite ${ageRetraite} ans) ════`);
  console.log('année  gardeurs  moy   max  maxSam maxVD  joursSans2MAR  serrées(J±2)  sem≥3G');
  let prev=null;
  const out=[];
  for(let y=2027;y<=2046;y++){
    const roster=buildRoster(y,{ageExempt,ageRetraite});
    const im=buildAbsences(y,roster);
    const extra=[];
    const res=H.runScenario({year:y, roster, indisposMap:im, statsPrev:prev});
    if(res.error){ console.log(`${y}  💥 ${res.error}`); prev=null; continue; }
    prev=res.ss.getSheetByName(`STATS_GARDES_${y}`)._rows.map(r=>r.slice());
    const m=yearMetrics(res,y,roster);
    out.push({y,...m});
    console.log(`${y}   ${String(m.n).padStart(4)}   ${m.moy.toFixed(1).padStart(5)} ${String(m.max).padStart(4)}  ${String(m.maxSam).padStart(4)}  ${String(m.maxVd).padStart(4)}       ${String(m.manque).padStart(4)}          ${String(m.serres).padStart(4)}       ${String(m.tripleSem).padStart(4)}`);
  }
  return out;
}

const A1=runPolicy('STATU QUO', {ageExempt:60, ageRetraite:67});
const B1=runPolicy('RETRAITE 65', {ageExempt:60, ageRetraite:65});
// synthèse comparative sur la fenêtre du mur
console.log('\n════ FENÊTRE DU MUR (2038-2044) — statu quo vs retraite 65 ════');
console.log('année | max/an SQ→R65 | maxSam SQ→R65 | joursSans2 SQ→R65 | serrées SQ→R65');
for(const y of [2038,2039,2040,2041,2042,2043,2044]){
  const a=A1.find(x=>x.y===y), b=B1.find(x=>x.y===y);
  if(a&&b) console.log(`${y}  |   ${a.max} → ${b.max}   |   ${a.maxSam} → ${b.maxSam}    |     ${a.manque} → ${b.manque}      |  ${a.serres} → ${b.serres}`);
}
