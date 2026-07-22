// ═══ SIMULATION DÉMOGRAPHIQUE 2027→2046 — le VRAI algo, année par année ═══
//
// ⚠️ RÉÉCRIT LE 22/07/2026. La version précédente avait son PROPRE effectif de
// 20 personnes, divergent de harness.defaultRoster() : elle ignorait les deux
// collègues sans garde, le poste à 50 % et les non-titulaires, et surestimait
// donc la charge d'environ 10 % (57 gardes/an au creux au lieu de 52).
// Cette version part de l'effectif RÉEL, avec les années de naissance.
//
// Transition modélisée : FERRIERO (100 %) et COPELOVICI (50 %) cohabitent
// jusqu'en mars 2027 ; ensuite un seul poste subsiste, à 50 %. Le générateur
// proratise seul la cible de celui qui part (6 gardes pour 2 mois) et
// redistribue le reste — comportement vérifié.
const H=require('./harness.js'), A=require('./analyse.js');

// [id, pct_gardes, quotite, naissance, flags de base]
const EQUIPE=[
  ['SULTAN',    100,100, 1961, {}],
  ['BONNET',      0,100, 1964, {noGarde:1}],
  ['MENADE',    100,100, 1967, {}],
  ['GUERIN',    100,100, 1969, {}],
  ['CATINEAU',  100,100, 1974, {}],
  ['BOUREGBA',    0,100, 1975, {noGarde:1}],
  ['ARMANDO',   100,100, 1975, {}],
  ['ROUSSEAU',  100,100, 1976, {}],
  ['ALBOUY',    100,100, 1977, {}],
  ['PRUNET',    100,100, 1977, {noWeekend:1,souhaitPlafond:1}],
  ['GHIGLIONE', 100,100, 1978, {}],
  ['LEY',        90, 90, 1981, {}],
  ['OPPRECHT',  100,100, 1982, {}],
  ['ZAMARON',   100,100, 1986, {}],
  ['SEVERAC',    80, 80, 1986, {}],
  ['SALA',      100,100, 1986, {}],
  ['LEVASSEUR', 100,100, 1987, {}],
  ['COPELOVICI', 50, 50, 1990, {r2s2:1}],   // LC — le poste conservé, 50 %
  ['SUPLY',     100,100, 1990, {}],
  ['FERRIERO',  100,100, 1991, {}],          // AF — s'arrête fin février 2027
  ['WIDEHEM',   100,100, 1991, {}],
  ['FROHLICH',  100,100, 1992, {}],
  ['PARTOUCHE', 100,100, 1992, {}],
  ['ARMAND',    100,100, 1993, {}],          // recrutement titulaire, arrivé 11/2026
];
const FIN_FERRIERO='2027-02-28';   // 1 ETP qui disparaît → réabsorbé au prorata mars→déc

function buildRoster(year,{ageExempt=60,ageRetraite=67}={}){
  const out=[], repl=[];
  EQUIPE.forEach(([id,pct,q,born,f0])=>{
    // FERRIERO : présent en 2027 jusqu'à fin février, absent ensuite
    if(id==='FERRIERO'){
      if(year<2027) out.push([id,pct,q,{...f0}]);
      else if(year===2027) out.push([id,pct,q,{...f0, dateFin:FIN_FERRIERO}]);
      return;                                  // à partir de 2028 : parti
    }
    const retYear=born+ageRetraite;
    if(year>=retYear){ if(id!=='SULTAN') repl.push({id:'REMPL_'+id, born:retYear-35}); return; }
    const age=year-born;
    const f={...f0};
    if(age>=ageExempt) f.noGarde=1;
    out.push([id,pct,q,f]);
  });
  repl.forEach(r=>{
    const age=year-r.born, f={};
    if(age>=ageExempt) f.noGarde=1;
    out.push([r.id,100,100,f]);
  });
  return out;
}

// ═══ ABSENCES RÉALISTES ═══════════════════════════════════════════════
// Format IMPÉRATIF : objet { 'yyyy-mm-dd': CODE }. Un tableau serait silencieusement
// ignoré par indisposRows() (qui lit indisposMap[id][date]) et la simulation tournerait
// SANS AUCUNE ABSENCE — piège vérifié le 22/07/2026.
// Codes lus par le générateur : VAC / INDISPO / FORM (n'abaissent PAS la cible),
// CL (congé long : SEUL code qui abaisse la cible), SOUHAIT (jour demandé).
// Tirage DÉTERMINISTE (pas de Math.random) : deux exécutions donnent le même résultat.
function rnd(seed){
  // mélange initial (splitmix32) : sans lui, des graines voisines donnent des suites
  // corrélées — piège constaté le 22/07/2026 (tous les MARs en congé long la même année).
  let x=(seed>>>0)+0x9E3779B9;
  const step=()=>{ x=(x+0x9E3779B9)>>>0; let z=x;
    z=Math.imul(z^(z>>>16),0x21f0aaad); z=Math.imul(z^(z>>>15),0x735a2d97);
    return ((z^(z>>>15))>>>0)/4294967296; };
  for(let i=0;i<8;i++) step();
  return step;
}
function iso(y,m,d){ return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function bloc(im,y,mois,jour,nb,code){
  const d=new Date(Date.UTC(y,mois-1,jour));
  for(let k=0;k<nb;k++){
    if(d.getUTCFullYear()===y) im[iso(y,d.getUTCMonth()+1,d.getUTCDate())]=code;
    d.setUTCDate(d.getUTCDate()+1);
  }
}
function buildAbsences(year,roster){
  const im={};
  roster.forEach(([id,pct,q,f],idx)=>{
    const R=rnd(year*1000+idx*7+1), m={};
    // ── CONGÉ LONG : ~1 MAR sur 12 par an, 8 à 12 semaines. Seul code qui baisse la cible.
    if(!f.noGarde && R()<1/12){
      const debut=1+Math.floor(R()*8);                 // démarre entre janvier et août
      bloc(m,year,debut,1+Math.floor(R()*20),56+Math.floor(R()*28),'CL');
    }
    // ── ÉTÉ : 2 ou 3 semaines d'affilée, ÉTALÉES sur juillet-août.
    // Les départs sont décalés en rotation (tour de rôle) et non tirés au hasard :
    // c'est ce que fait le comité en validant les vacances AVANT la génération, pour
    // garantir la couverture. Sans ce décalage, jusqu'à 2 MARs sur 3 sont absents le
    // même jour de juillet et le planning finit avec des jours non pourvus.
    const semEte=2+(R()<0.45?1:0);
    const fenetre=62-7*semEte;                        // 1er juillet → 31 août
    const depart=1+((idx*17+Math.floor(R()*5))%fenetre);
    const d0=new Date(Date.UTC(year,6,1)); d0.setUTCDate(d0.getUTCDate()+depart-1);
    bloc(m,year,d0.getUTCMonth()+1,d0.getUTCDate(),7*semEte,'VAC');
    // ── FIN D'ANNÉE : une semaine, Noël OU Nouvel An en alternance
    if(idx%2===0) bloc(m,year,12,20+Math.floor(R()*5),7,'VAC');
    else           bloc(m,year,1,2+Math.floor(R()*5),7,'VAC');
    // ── VACANCES SCOLAIRES : une semaine en février, avril ou Toussaint
    const vs=[[2,9],[4,6],[10,21]][Math.floor(R()*3)];
    bloc(m,year,vs[0],vs[1]+Math.floor(R()*6),7,'VAC');
    // ── FORMATION / CONGRÈS : 1 ou 2 blocs de 2 à 4 jours
    const nf=1+(R()<0.5?1:0);
    for(let k=0;k<nf;k++) bloc(m,year,2+Math.floor(R()*10),3+Math.floor(R()*24),2+Math.floor(R()*3),'FORM');
    // ── INDISPO PONCTUELLES : 4 à 8 jours isolés
    const ni=4+Math.floor(R()*5);
    for(let k=0;k<ni;k++){
      const mo=1+Math.floor(R()*12), jo=1+Math.floor(R()*27);
      const d=iso(year,mo,jo); if(!m[d]) m[d]='INDISPO';
    }
    // ── SOUHAITS de jours fixes : 3 MARs, un jour de semaine récurrent (lun/mar/mer)
    if(idx%8===3 && !f.noGarde && !f.souhaitPlafond){
      const jourVoulu=1+Math.floor(R()*3);             // 1=lundi 2=mardi 3=mercredi
      const d=new Date(Date.UTC(year,0,1));
      while(d.getUTCFullYear()===year){
        if(d.getUTCDay()===jourVoulu){
          const ds=iso(year,d.getUTCMonth()+1,d.getUTCDate());
          if(!m[ds]) m[ds]='SOUHAIT';
        }
        d.setUTCDate(d.getUTCDate()+1);
      }
    }
    im[id]=m;
  });
  return im;
}

// ── Métriques d'une année ──────────────────────────────────────────────
function yearMetrics(res,y,roster){
  const st=H.readStats(res.ss,y);
  const pleins=roster.filter(([id,p,q,f])=>p===100&&q===100&&!f.noGarde&&!f.dateFin&&!f.dateDebut).map(r=>r[0]);
  const cibles=pleins.map(id=>parseFloat(String(st.byId[id]['CIBLE']).replace("'",''))).filter(v=>v>0);
  return {
    n: roster.filter(([id,p,q,f])=>!f.noGarde&&p>0).length,
    charge: cibles.length?Math.max(...cibles):0,
  };
}

function runPolicy(nom,opts){
  console.log(`\n════ POLITIQUE : ${nom} (exemption ${opts.ageExempt} ans, retraite ${opts.ageRetraite} ans) ════`);
  console.log('année  gardeurs  charge temps plein');
  let prev=null; const out=[];
  for(let y=2027;y<=2046;y++){
    const roster=buildRoster(y,opts), im=buildAbsences(y,roster);
    const res=H.runScenario({year:y, roster, indisposMap:im, statsPrev:prev});
    if(res.error){ console.log(`${y}  💥 ${res.error}`); prev=null; continue; }
    prev=res.ss.getSheetByName(`STATS_GARDES_${y}`)._rows.map(r=>r.slice());
    const m=yearMetrics(res,y,roster);
    out.push({y,...m});
    console.log(`${y}     ${String(m.n).padStart(2)}        ${m.charge.toFixed(1).padStart(5)}`);
  }
  const pic=out.reduce((a,b)=>b.charge>a.charge?b:a);
  console.log(`  → pic : ${pic.charge.toFixed(1)} gardes/an en ${pic.y} avec ${pic.n} gardeurs`);
  console.log(`  → départ 2027 : ${out[0].charge.toFixed(1)} gardes/an avec ${out[0].n} gardeurs`);
  return out;
}

if(require.main===module){
  runPolicy('STATU QUO', {ageExempt:60, ageRetraite:67});
  runPolicy('RETRAITE 65', {ageExempt:60, ageRetraite:65});
}
module.exports={EQUIPE,buildRoster,buildAbsences,runPolicy};
