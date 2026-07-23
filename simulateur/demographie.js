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
  ['BOUREGBA',    0, 60, 1975, {noGarde:1}],   // 60 % : jeudi+vendredi, ne prend pas de garde
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
// Plafond d'indisponibilités « INDISPO » par MAR et par an (hors VAC / FORM / CL).
const PLAFOND_INDISPO=30;
// Fériés de l'année : fixes + MOBILES CALCULÉS (Pâques par l'algorithme de Meeus).
// ⚠️ Ne pas approximer les mobiles par une plage de dates : le lundi de Pâques va du
// 23 mars au 26 avril et celui de Pentecôte du 11 mai au 14 juin. Une plage trop
// étroite laisse poser des souhaits sur un lundi férié, ce qui préempte le couplage
// samedi→lundi et produit de faux « COUPLAGE SL BRISÉ » (constaté le 22/07/2026).
function paques(y){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),
    g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,
    l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),
    mo=Math.floor((h+l-7*m+114)/31),jo=((h+l-7*m+114)%31)+1;
  return new Date(Date.UTC(y,mo-1,jo));
}
function feriesDe(y){
  // Réplique EXACTE de getJoursFeries() (code.gs) : mêmes dates, MÊME report au
  // lundi quand le férié tombe un dimanche (loi monégasque n°798) — sauf la Sainte
  // Dévote. Sans ce report, un lundi comme le 16/08 (Assomption décalée) n'était pas
  // reconnu comme férié par le modèle alors qu'il l'est pour le générateur.
  const P=paques(y);
  const mmdd=d=>String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
  const add=n=>{const d=new Date(P); d.setUTCDate(d.getUTCDate()+n); return mmdd(d);};
  const rep=(mo,da)=>{const d=new Date(Date.UTC(y,mo-1,da));
    if(d.getUTCDay()===0) d.setUTCDate(d.getUTCDate()+1); return mmdd(d);};
  return new Set([rep(1,1),'01-27',rep(5,1),rep(8,15),rep(11,1),rep(11,19),rep(12,8),rep(12,25),
                  add(1),add(39),add(50),add(60)]);
}


// Plafond de MAR simultanément en congé d'été (le comité arbitre les vacances avant
// de générer). Sans ce plafond, le pic estival laisse des jours sans binôme.
const MAX_VAC_ETE=7;

function planifierEte(year,roster){
  const sams=[]; const d=new Date(Date.UTC(year,5,15));
  while(d.getUTCFullYear()===year && (d.getUTCMonth()<8 || d.getUTCDate()<=7)){
    if(d.getUTCDay()===6) sams.push(new Date(d));
    d.setUTCDate(d.getUTCDate()+1);
  }
  const occup=new Array(sams.length).fill(0), plan={};
  const gard=roster.filter(([id,p,q,f])=>!f.noGarde&&p>0).map(r=>r[0]);
  const autres=roster.map(r=>r[0]).filter(id=>gard.indexOf(id)<0);
  const quot={}; roster.forEach(([rid,p,qu])=>quot[rid]=qu);
  [...gard,...autres].forEach((id,i)=>{
    const qq=quot[id]||100;
    // Congés d'été au prorata du temps de travail.
    const dur=(qq>=80?2:1)+((qq>=100&&i%3===0)?1:0);
    let best=-1,bestC=1e9;
    for(let st=0;st+dur<=sams.length;st++){
      let mx=0; for(let k=0;k<dur;k++) mx=Math.max(mx,occup[st+k]);
      if(mx>=MAX_VAC_ETE) continue;
      const c=occup.slice(st,st+dur).reduce((a,b)=>a+b,0)*10
              +Math.abs(st-((i*3)%Math.max(1,sams.length-dur+1)));
      if(c<bestC){bestC=c;best=st;}
    }
    if(best<0) return;
    for(let k=0;k<dur;k++) occup[best+k]++;
    plan[id]={mois:sams[best].getUTCMonth()+1, jour:sams[best].getUTCDate(), sem:dur};
  });
  return plan;
}

function buildAbsences(year,roster){
  const im={}; const FER=feriesDe(year); const planningEte=planifierEte(year,roster);
  roster.forEach(([id,pct,q,f],idx)=>{
    // Graine décorrélée : year*1000+idx*7 produisait des tirages groupés (tous les
    // congés longs après 2037). On mélange fortement année et index.
    const R=rnd(Math.imul(year,0x9E3779B1)^Math.imul(idx+1,0x85EBCA6B)), m={};
    // ── CONGÉ LONG : 8 à 12 semaines (maternité, maladie). SEUL code qui baisse la cible.
    // Fréquence RÉELLE constatée dans le service : environ un congé long tous les
    // 2 à 3 ans pour l'ensemble de l'équipe — pas un par an. Avec ~20 gardeurs, cela
    // fait une probabilité de l'ordre de 1/50 par MAR et par an (≈ 0,4 CL/an).
    if(!f.noGarde && R()<1/50){
      const debut=1+Math.floor(R()*8);                 // démarre entre janvier et août
      bloc(m,year,debut,1+Math.floor(R()*20),56+Math.floor(R()*28),'CL');
    }
    // ── ÉTÉ : 2 ou 3 semaines d'affilée, ÉTALÉES sur juillet-août.
    // Les départs sont décalés en rotation (tour de rôle) et non tirés au hasard :
    // c'est ce que fait le comité en validant les vacances AVANT la génération, pour
    // garantir la couverture. Sans ce décalage, jusqu'à 2 MARs sur 3 sont absents le
    // même jour de juillet et le planning finit avec des jours non pourvus.
    // Congés posés du SAMEDI AU SAMEDI (usage réel du service). Conséquence : qui est
    // disponible un samedi l'est jusqu'au samedi suivant — donc aussi le lundi. Le
    // couplage samedi→lundi férié n'est donc presque jamais cassé par un congé.
    // Le nombre de MAR simultanément absents est plafonné par planifierEte().
    const dep=planningEte[id];
    if(dep) bloc(m,year,dep.mois,dep.jour,7*dep.sem,'VAC');
    // ── FIN D'ANNÉE et VACANCES SCOLAIRES : elles aussi posées du SAMEDI AU SAMEDI.
    // ⚠️ Ne pas les laisser démarrer un jour quelconque : une semaine commençant un
    // dimanche rendait indisponible le lundi férié suivant quelqu'un qui était de garde
    // le samedi — situation matériellement impossible (il aurait posé tout le week-end).
    const auSamedi=(mo,jo,nb)=>{
      const d=new Date(Date.UTC(year,mo-1,jo));
      while(d.getUTCDay()!==6) d.setUTCDate(d.getUTCDate()+1);
      bloc(m,year,d.getUTCMonth()+1,d.getUTCDate(),nb,'VAC');
    };
    if(idx%2===0) auSamedi(12,18+Math.floor(R()*5),7);
    else           auSamedi(1,2+Math.floor(R()*5),7);
    // DEUX semaines de vacances scolaires : avec l'été et la semaine de fin d'année,
    // on atteint ~40 jours de congés par an pour un temps plein — l'usage réel du service.
    // ⚠️ Les congés d'un temps partiel sont PROPORTIONNELS à son temps de travail :
    // quelqu'un déjà absent la moitié de l'année ne pose pas 5 semaines de congés EN PLUS
    // sur ses semaines travaillées. Sans cette proportionnalité, un 50 % se retrouvait
    // indisponible 213 j/an et n'atteignait plus sa cible (11 gardes pour 19,8) —
    // artefact du modèle, pas une limite de l'algorithme (vérifié le 22/07/2026).
    const VS=[[2,9],[4,6],[10,21]];
    // Un rythme 2 semaines / 2 semaines EST déjà du temps de repos : cette personne ne
    // pose pas en plus des semaines de congés sur ses semaines travaillées — elle les
    // prend pendant ses semaines off. Sinon on cumule deux fois le même repos et elle
    // n'atteint plus sa cible (85 % au lieu de 100 %), ce qui est un artefact.
    // Un 2/2 pose la MOITIÉ des congés d'un temps plein, sur ses semaines de présence.
    const nScol=f.r2s2?1:((q>=100)?2:(q>=80?1:0));
    // 3 périodes × 2 semaines possibles = 6 créneaux, attribués EN ROTATION par MAR.
    // ⚠️ Sans cet étalement, tout le monde posait la même semaine : 15 gardeurs sur 20
    // absents le même jour de février, et 7 à 17 jours sans binôme sur 20 ans —
    // artefact du modèle, pas une limite de l'algorithme (constaté le 22/07/2026).
    const creneau=k=>{ const c=(idx*2+k)%6, per=VS[c%3], sem=Math.floor(c/3);
      auSamedi(per[0], per[1]+sem*7, 7); };
    if(nScol>=1) creneau(0);
    if(nScol>=2) creneau(3);
    // ── FORMATION / CONGRÈS : 1 ou 2 blocs de 2 à 4 jours
    // Pas de congrès un jour férié : on décale le bloc s'il tombe dessus.
    const nf=1+(R()<0.5?1:0);
    for(let k=0;k<nf;k++){
      const mo=2+Math.floor(R()*10), jo=3+Math.floor(R()*24), nb=2+Math.floor(R()*3);
      const d0=new Date(Date.UTC(year,mo-1,jo));
      let ferie=false;
      for(let j=0;j<nb;j++){ const x=new Date(d0); x.setUTCDate(x.getUTCDate()+j);
        if(FER.has(iso(year,x.getUTCMonth()+1,x.getUTCDate()).slice(5))) ferie=true; }
      if(!ferie) bloc(m,year,mo,jo,nb,'FORM');
    }
    // ── INDISPO PONCTUELLES. PLAFOND ÉTUDIÉ : 30 jours/an/MAR (statut INDISPO seul,
    // hors VAC et FORM). On simule le PIRE CAS sous la règle : tout le monde consomme
    // son quota entier, ce que personne ne fait en pratique (usage réel ~5 jours).
    // ⚠️ RÈGLE DE BON SENS (corrigée le 22/07/2026) : personne ne pose un lundi férié
    // SEUL pour s'offrir un week-end de trois jours — il poserait aussi le samedi et le
    // dimanche, sinon il risque la garde du samedi et son week-end tombe. Conséquence :
    // celui qui est de garde un samedi n'a PAS posé ce week-end, il est donc disponible
    // le lundi férié qui suit. Le couplage samedi→lundi ne peut donc quasiment jamais
    // être cassé par une indispo. Sans cette règle, le modèle produisait ~12 ruptures
    // de couplage sur 20 ans, toutes matériellement impossibles.
    const ni=Math.round(PLAFOND_INDISPO*(q||100)/100);   // indispos au prorata du temps de travail
    for(let k=0;k<ni;k++){
      const mo=1+Math.floor(R()*12), jo=1+Math.floor(R()*27);
      const d=iso(year,mo,jo); if(m[d]) continue;
      const dt=new Date(d+'T12:00:00'), dow=dt.getUTCDay(), fe=FER.has(d.slice(5));
      m[d]='INDISPO';
      if(fe && dow===1){                       // lundi férié → + samedi et dimanche avant
        for(const n of [-2,-1]){ const x=new Date(dt); x.setUTCDate(x.getUTCDate()+n);
          const ds=iso(year,x.getUTCMonth()+1,x.getUTCDate()); if(!m[ds]) m[ds]='INDISPO'; }
      } else if(fe && dow===5){                // vendredi férié → + samedi et dimanche après
        for(const n of [1,2]){ const x=new Date(dt); x.setUTCDate(x.getUTCDate()+n);
          const ds=iso(year,x.getUTCMonth()+1,x.getUTCDate()); if(!m[ds]) m[ds]='INDISPO'; }
      }
    }
    // ── SOUHAITS — usage RÉEL décrit par le service :
    //   • PRUNET (souhait_plafond, régime 1) : TOUS LES MARDIS, hors fériés et hors
    //     ses propres congés. C'est son rythme personnel, priorité absolue.
    //   • quelques MAR : des mardis choisis (régime 2, dans leur cible).
    //   • lundis / mercredis : rares.
    // ⚠️ Jamais sur un jour férié : personne ne demande une garde qui lui coûterait
    // un week-end de trois jours (et sur un lundi férié cela préempterait le
    // couplage samedi→lundi).
    const poseS=(ds)=>{ if(!m[ds] && !FER.has(ds.slice(5))) m[ds]='SOUHAIT'; };
    if(f.souhaitPlafond){                       // PRUNET : tous les mardis
      const d=new Date(Date.UTC(year,0,1));
      while(d.getUTCFullYear()===year){
        if(d.getUTCDay()===2) poseS(iso(year,d.getUTCMonth()+1,d.getUTCDate()));
        d.setUTCDate(d.getUTCDate()+1);
      }
    } else if(!f.noGarde && idx%5===1){          // ~4 MAR : des mardis choisis
      const d=new Date(Date.UTC(year,0,1));
      while(d.getUTCFullYear()===year){
        if(d.getUTCDay()===2 && R()<0.35) poseS(iso(year,d.getUTCMonth()+1,d.getUTCDate()));
        d.setUTCDate(d.getUTCDate()+1);
      }
    } else if(!f.noGarde && idx%11===4){         // ~2 MAR : quelques lundis/mercredis
      const jour=R()<0.5?1:3;
      const d=new Date(Date.UTC(year,0,1));
      while(d.getUTCFullYear()===year){
        if(d.getUTCDay()===jour && R()<0.15) poseS(iso(year,d.getUTCMonth()+1,d.getUTCDate()));
        d.setUTCDate(d.getUTCDate()+1);
      }
    }
    // ── TEMPS PARTIELS : jours non travaillés, POSÉS SUR indispos.html pour l'année
    // entière — l'algorithme les connaît donc et n'y place pas de garde.
    // Code 'TP' : bloque la disponibilité SANS réduire la cible ; c'est la quotité
    // (pct) qui porte la réduction du volume de gardes, sinon double peine.
    // ⚠️ Le drapeau r2s2 (rythme 2 semaines / 2 semaines) est écrit dans MEDECINS mais
    // n'est lu par AUCUN fichier .gs : le moteur ignore ce rythme, d'où la nécessité
    // de poser les semaines off comme indisponibilités.
    // ⚠️ Un jour de temps partiel ne se pose JAMAIS sur un férié : le jour est déjà
    // chômé, on le prendrait un autre jour de la semaine. Sans cette règle, le jour off
    // d'un 80 % ou d'un 90 % tombait parfois sur un lundi férié et cassait le couplage
    // samedi→lundi (2 cas sur 80 en 20 ans) — artefact du modèle.
    const poseTP=(ds)=>{ if(!m[ds] && !FER.has(ds.slice(5))) { m[ds]='TP'; return true; } return false; };
    if(q===90){                                   // 2 jours off par mois
      for(let mo=1;mo<=12;mo++) for(let k=0;k<2;k++){
        let pose=false;
        for(let t=0;t<10&&!pose;t++) pose=poseTP(iso(year,mo,1+Math.floor(R()*27))); }
    } else if(q===80){                            // 1 jour off par semaine, jour fixe
      const d=new Date(Date.UTC(year,0,1+Math.floor(R()*5)));
      while(d.getUTCFullYear()===year){
        const ds=iso(year,d.getUTCMonth()+1,d.getUTCDate());
        if(!poseTP(ds)){                          // férié : reporté dans la même semaine
          for(let n=1;n<=3;n++){ const x=new Date(d); x.setUTCDate(x.getUTCDate()+n);
            if(x.getUTCFullYear()===year && poseTP(iso(year,x.getUTCMonth()+1,x.getUTCDate()))) break; } }
        d.setUTCDate(d.getUTCDate()+7); }
    } else if(q===60){                            // jeudi + vendredi
      const d=new Date(Date.UTC(year,0,1));
      while(d.getUTCFullYear()===year){
        if(d.getUTCDay()===4||d.getUTCDay()===5){
          const ds=iso(year,d.getUTCMonth()+1,d.getUTCDate()); if(!m[ds]) m[ds]='TP'; }
        d.setUTCDate(d.getUTCDate()+1); }
    }
    // ⚠️ AUCUN jour à poser pour le rythme 2/2 : le générateur le gère NATIVEMENT via
    // estSemaineOff() (generateur_gardes.gs l.35), ancré sur le lundi 01/06/2026 et lu
    // depuis la colonne rythme_2sur2 de MEDECINS. Y ajouter des jours 'TP' revient à
    // superposer DEUX blocages de phases différentes : selon l'année, l'union couvrait
    // toute l'année et la personne obtenait 0 garde pour une cible de 19,9.
    // Diagnostic du 22/07/2026 : en 2044 elle était disponible 0 jour sur 254 côté
    // algorithme alors que le modèle lui laissait 159 jours libres.
    im[id]=m;    im[id]=m;
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
