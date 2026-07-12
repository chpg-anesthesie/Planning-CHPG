const $ = id => document.getElementById(id);

const report = $("report");
const anesthSelect = null;
const specialiteSelect = $("specialite");

const state = {
  monitorage: [],
  vvpCount: 1,
  induction: [],
  curare: [],
  antagonisation: false,
  va: "",
  ventilation: "",
  entretien: "",
  analgesie: [],
  antibio: "",
  alr: [],
  continuousALR: {},
  continuousALRText: {},
  neuraxial: [],
  reveil: [],
  transfusionActive: false,
  transfusion: [],
  drainsActive: false,
  drains: [],
  peropForced: false,
  peropHidden: false,
  urgence: false,
  endoscopyIntubation: false
};

// ── Listes de chips centralisées (source unique) ──
const CURARE_BASE = ["Aucun","Atracurium","Rocuronium"];
const VA_STD = ["Ventilation spontanée","Masque laryngé","Intubation oro-trachéale"];
const REVEIL_STD = ["Extubation", "Complication extubation", "Patient transféré intubé ventilé"];
const REVEIL_SIMPLE = ["Simples", "Autre"];
const TRANSFUSION_ITEMS = ["CGR", "PFC", "Plaquettes", "Fibrinogène", "Calcium", "Autre"];
const DRAINS_ITEMS = ["Drain thoracique", "Redon", "Lame", "Sonde vésicale", "SNG", "Autre"];
const ANALGESIE_STD = ["Paracétamol", "Kétoprofène", "Néfopam", "Tramadol", "Morphine"];
const ANALGESIE_SED = ["Paracétamol", "Autre"];
const MONITORAGE_SED = ["Scope", "SpO2", "VVP"];


function initDate(){
  const d = new Date();

  $("date").value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

function formatDateFR(v){
  if(!v) return "";

  const parts = v.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function updateAnesthesistes(){
  document.querySelectorAll(".anesthesiste").forEach(sel=>{
    const current = sel.value;
    fillSelect(sel, DATA.anesthesistes, "Choisir...");
    if(DATA.anesthesistes.includes(current)) sel.value = current;
  });
}

function addAnesth(removable=true){
  const row = document.createElement("div");
  row.className = "field row-inline";

  row.innerHTML = removable
    ? `<select class="anesthesiste"></select><button class="remove-btn" type="button">–</button>`
    : `<select class="anesthesiste"></select>`;

  if(removable){
    row.querySelector(".remove-btn").onclick = ()=>{
      row.remove();
      renderReport();
    };
  }

  $("anesthContainer").appendChild(row);
  updateAnesthesistes();
}

function updateChirurgiens(){
  const list = DATA.specialites[specialiteSelect.value]?.chirurgiens || [];

  document.querySelectorAll(".chirurgien").forEach(sel=>{
    const current = sel.value;
fillSelect(sel, list, "Choisir...");
    if(list.includes(current)) sel.value = current;
  });
}

function addChir(removable=true){
  const row = document.createElement("div");
row.className = "field";

  row.innerHTML = removable
  ? `<div class="row-inline"><select class="chirurgien"></select><button class="remove-btn" type="button">–</button></div>`
  : `<div class="row-inline"><select class="chirurgien"></select></div>`;
  
  if(removable){
    row.querySelector(".remove-btn").onclick = ()=>{
      row.remove();
      renderReport();
    };
  }

  $("chirContainer").appendChild(row);
  updateChirurgiens();
}

function addGeste(removable=true){
  const list = DATA.specialites[specialiteSelect.value]?.interventions || [];

  const wrapper = document.createElement("div");
  wrapper.className = "field";

  wrapper.innerHTML = `
  <div class="row-inline">
    <select class="geste-select"></select>
    ${removable ? `<button class="remove-btn" type="button">–</button>` : ``}
  </div>
  <div class="geste-extra" style="margin-top:6px"></div>
`;

  if(removable){
    wrapper.querySelector(".remove-btn").onclick = ()=>{
      wrapper.remove();
      state.peropForced = false;
      state.peropHidden = false;
renderALR();
renderAntibio();
renderPeropVisibility();
applyAnesthesiaMode();
renderReport();
    };
  }

  $("gesteContainer").appendChild(wrapper);

  const sel = wrapper.querySelector(".geste-select");
fillSelect(sel, list, "Choisir...");

  sel.addEventListener("change", ()=>{
    state.peropForced = false;
    state.peropHidden = false;
    renderGesteExtra(wrapper, sel.value);

    applySmartPreset(sel.value);

    renderALR();
    renderAntibio();
    renderPeropVisibility();
    renderReport();
  });
}

function renderGesteExtra(wrapper, geste){
  const extra = wrapper.querySelector(".geste-extra");
  extra.innerHTML = "";

    if(DATA.lateralizedGestes.includes(geste)){
    const s = document.createElement("select");
    s.className = "laterality-select";

    let options = DATA.laterality;

    if(geste === "Colectomie"){
      options = ["Droite", "Gauche", "Totale"];
    }

    fillSelect(s, options, "Latéralité...");
    extra.appendChild(s);
  }

  if(DATA.textGestes.includes(geste)){
    const i = document.createElement("input");
    i.className = "precision-input";
    i.placeholder = "Précision...";
    extra.appendChild(i);
  }
  
if(DATA.approachOptions && DATA.approachOptions[geste]){
  const approachRow = document.createElement("div");
  approachRow.className = "row-inline";
  approachRow.style.marginTop = "8px";

  const s = document.createElement("select");
  s.className = "approach-select";
  s.style.flex = "1";
  s.style.minWidth = "0";

  fillSelect(
    s,
    DATA.approachOptions[geste],
    geste === "Néphrectomie"
      ? "Type..."
      : "Voie d'abord..."
  );
  
  approachRow.appendChild(s);

  let robotChip = null;
  let robotZone = null;

  if(DATA.robotGestes && DATA.robotGestes.includes(geste)){
    robotZone = document.createElement("div");
    robotZone.className = "chip-zone robot-zone hidden";
    robotZone.style.marginTop = "0";
    robotZone.style.flexShrink = "0";

    robotZone.innerHTML = `
      <div class="chip sub-chip robot-chip">
        Robot-assistée
      </div>
    `;

    robotChip = robotZone.querySelector(".robot-chip");

    robotChip.onclick = ()=>{
      robotChip.classList.toggle("active");
      renderReport();
    };

    approachRow.appendChild(robotZone);
  }

  s.addEventListener("change", ()=>{
    if(!robotZone) return;

    const robotAllowed =
      s.value === "Cœlioscopie" ||
      s.value === "Thoracoscopie";

    robotZone.classList.toggle("hidden", !robotAllowed);

    if(!robotAllowed && robotChip){
      robotChip.classList.remove("active");
    }

    renderReport();
  });

  extra.appendChild(approachRow);
}
  
if(geste === "Autre..."){
    const i = document.createElement("input");
    i.className = "custom-geste";
    i.placeholder = "Préciser l'intervention";
    extra.appendChild(i);
  }
}

function buildGesteLabel(block){
  let geste = block.querySelector(".geste-select")?.value;

  if(!geste) return null;

  if(geste === "Autre..."){
    geste = block.querySelector(".custom-geste")?.value || "Autre";
  }

    const lat = block.querySelector(".laterality-select")?.value;

  if(lat){
const feminin = GESTE_GENRE.feminin;
const pluriel = GESTE_GENRE.pluriel;

    let map = {
  "Droite":"droit",
  "Gauche":"gauche",
  "Bilatéral":"bilatéral",
  "Totale":"total"
};

    if(feminin.includes(geste)){
     map = {
  "Droite":"droite",
  "Gauche":"gauche",
  "Bilatéral":"bilatérale",
  "Totale":"totale"
};
    }

    if(pluriel.includes(geste)){
      map = {
        "Droite":"droites",
        "Gauche":"gauches",
        "Bilatéral":"bilatérales"
      };
    }

    if(geste === "Varices"){
      geste = "Stripping de varices";
    }

    geste += " " + map[lat];
  }

 const approach = block.querySelector(".approach-select")?.value;

if(approach){

  if(geste.startsWith("Néphrectomie")){
    geste = geste.replace(
      "Néphrectomie",
      `Néphrectomie ${approach.toLowerCase()}`
    );
  }else{
    geste += " par " + approach.toLowerCase();
  }

  const robotActive =
    block.querySelector(".robot-chip")?.classList.contains("active");

  if(robotActive){
    geste += " robot-assistée";
  }
}

  const p = block.querySelector(".precision-input")?.value;
  if(p) geste += ` (${p})`;

  return geste;
}

function getSelectedGestesRaw(){
  return [...document.querySelectorAll(".geste-select")]
    .map(x=>x.value)
    .filter(Boolean);
}
function applySmartPreset(geste){
  const preset = SMART_PRESETS[geste];

  if(!preset) return;

  if(preset.monitorage){
    state.monitorage = [...preset.monitorage];
    createChips("monitorage", DATA.monitorage, "monitorage");
    renderMonitorageDetails();
  }

  if(preset.induction){
    state.induction = [...preset.induction];
  }

  if(preset.curare){
    state.curare = [...preset.curare];
  }

  if(preset.va){
    state.va = preset.va;
    createChips("vaOptions", VA_STD, "va", true);
    renderVADetails();
  }

  if(preset.entretien !== undefined){
    state.entretien = preset.entretien;
    createChips("entretienOptions", DATA.entretien, "entretien", true);
  }

  if(preset.analgesie){
    state.analgesie = [...preset.analgesie];
  }

  if(preset.reveil){
    state.reveil = [...preset.reveil];
  }

  if(preset.sequenceRapide){
    $("sequenceRapide").checked = true;
    $("sequenceRapideToggle")?.classList.add("active");
  }

  showPresetToast();
}

// Aperçu formaté du CR (lecture) — la copie reste le texte DPI brut.
const CR_SECTION_TITLES = new Set([
  "INTERVENTION","INSTALLATION","INDUCTION","SÉDATION","VOIES AÉRIENNES","ENTRETIEN",
  "ANALGÉSIE","ALR PÉRIPHÉRIQUE","ALR NEURAXIALE","PER-OPÉRATOIRE","ANTIBIOPROPHYLAXIE","SUITES IMMÉDIATES"
]);
function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));
}
function renderFormattedPreview(txt){
  const box = document.getElementById("reportFormatted");
  if(!box) return;
  let html = "";
  for(const raw of String(txt||"").split("\n")){
    const line = raw.trim();
    if(!line){ html += '<div class="cr-gap"></div>'; continue; }
    if(CR_SECTION_TITLES.has(line)) html += '<div class="cr-section">' + escapeHtml(line) + '</div>';
    else html += '<div class="cr-line">' + escapeHtml(line) + '</div>';
  }
  box.innerHTML = html;
}
function setReportView(mode){
  const f = $("reportFormatted"), r = $("report"), bf = $("viewFormatted"), br = $("viewRaw");
  if(!f || !r) return;
  const raw = (mode === "raw");
  f.classList.toggle("hidden", raw);
  r.classList.toggle("hidden", !raw);
  bf.classList.toggle("active", !raw);
  br.classList.toggle("active", raw);
}

// Petit retour visuel quand un préréglage est appliqué (jamais pendant init/restauration).
function showPresetToast(){
  if(__restoring || __initializing) return;
  let t = $("presetToast");
  if(!t){
    t = document.createElement("div");
    t.id = "presetToast";
    t.textContent = "Préréglage appliqué";
    t.style.cssText = "position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;opacity:0;transition:opacity .2s ease;z-index:9999;pointer-events:none;box-shadow:0 2px 10px rgba(0,0,0,.22)";
    document.body.appendChild(t);
  }
  t.style.opacity = "1";
  clearTimeout(t.__timer);
  t.__timer = setTimeout(()=>{ t.style.opacity = "0"; }, 1400);
}
function isSedationMode(){
  const gestes = getSelectedGestesRaw();

  if(!gestes.length) return false;

  return gestes.every(g =>
    DATA.sedationGestes && DATA.sedationGestes.includes(g)
  );
}

function isECTMode(){
  const gestes = getSelectedGestesRaw();

  if(!gestes.length) return false;

  return gestes.every(g =>
    DATA.ectGestes && DATA.ectGestes.includes(g)
  );
}
function isEndoscopyMode(){

  if(state.endoscopyIntubation){
    return false;
  }

  const gestes = getSelectedGestesRaw();

  if(!gestes.length) return false;

  return gestes.every(g =>
    ENDOSCOPY_GESTES.includes(g)
  );
}
function isEndoscopyGestureSelected(){

  const gestes = getSelectedGestesRaw();

  if(!gestes.length) return false;

  return gestes.every(g =>
    ENDOSCOPY_GESTES.includes(g)
  );
}

function isEndoscopyIntubatedMode(){

  return (
    isEndoscopyGestureSelected() &&
    state.endoscopyIntubation
  );
}
function applyAnesthesiaMode(){
const ect = isECTMode();

const endoscopyIntubated =
  !ect && isEndoscopyIntubatedMode();

const endoscopy =
  !ect &&
  !endoscopyIntubated &&
  isEndoscopyMode();

const sedation =
  !ect &&
  !endoscopy &&
  !endoscopyIntubated &&
  isSedationMode();
  
  if(ect){
  $("inductionTitle").textContent = "Anesthésie";
}else if(sedation){
  $("inductionTitle").textContent = "Sédation";
}else{
  $("inductionTitle").textContent = "Induction";
}

  $("curareCard").classList.toggle("hidden", sedation || ect);
  $("vaCard").classList.toggle("hidden", sedation || ect);
  $("entretienCard").classList.toggle("hidden", sedation || ect);
  $("antibioCard").classList.toggle("hidden", ect);
  $("analgesieCard").classList.toggle("hidden", ect);
  if(endoscopyIntubated){

  $("inductionTitle").textContent = "Induction";

  $("curareCard").classList.remove("hidden");
  $("vaCard").classList.remove("hidden");
  $("entretienCard").classList.remove("hidden");

  $("peropCard").classList.add("hidden");
  $("showPeropBtn").classList.add("hidden");

  $("analgesieCard").classList.add("hidden");
  $("alrCard").classList.add("hidden");
  $("neuraxialCard").classList.add("hidden");
  $("antibioCard").classList.add("hidden");

  $("destinationPostopBlock").classList.add("hidden");
  $("destinationPostop").value = "";

  state.va = "Intubation oro-trachéale";

  createChips(
    "vaOptions",
    ["Intubation oro-trachéale"],
    "va",
    true
  );

  renderVADetails();

}else if(endoscopy){
$("endoscopyIntubationChip")
  .classList.toggle(
    "hidden",
    !isEndoscopyGestureSelected()
  );

$("endoscopyIntubationChip")
  .classList.toggle(
    "active",
    state.endoscopyIntubation
  );
  
  $("inductionTitle").textContent = "Sédation";

  $("curareCard").classList.add("hidden");
  $("vaCard").classList.add("hidden");
  $("entretienCard").classList.add("hidden");

  $("peropCard").classList.add("hidden");
  $("showPeropBtn").classList.add("hidden");

  $("destinationPostopBlock").classList.add("hidden");
  $("destinationPostop").value = "";

  state.induction =
    state.induction.filter(x => ["Propofol"].includes(x));

  createChips(
    "induction",
    ["Propofol"],
    "induction"
  );

  state.reveil =
    state.reveil.filter(x =>
      REVEIL_SIMPLE.includes(x)
    );

  createChips(
    "reveilOptions",
    REVEIL_SIMPLE,
    "reveil"
  );

  renderSedationSuitesDetails();

}else if(ect){
  $("endoscopyIntubationChip")
  .classList.add("hidden");
    state.curare = [];
    state.antagonisation = false;
    state.va = "";
    state.ventilation = "";
    state.entretien = "";

    $("destinationPostopBlock").classList.add("hidden");
    $("destinationPostop").value = "";

    $("peropCard").classList.add("hidden");
    $("showPeropBtn").classList.add("hidden");

    createChips(
      "monitorage",
      MONITORAGE_SED,
      "monitorage"
    );

    state.monitorage = state.monitorage.filter(x =>
      MONITORAGE_SED.includes(x)
    );

    state.induction = state.induction.filter(x =>
      DATA.ectMedications.includes(x)
    );

    renderECTMedications();

    state.reveil = state.reveil.filter(x =>
    REVEIL_SIMPLE.includes(x)
    );

    createChips(
      "reveilOptions",
      REVEIL_SIMPLE,
      "reveil"
    );

    renderSedationSuitesDetails();
  
}else if(sedation){
  
    state.curare = [];
    state.antagonisation = false;
    state.va = "";
    state.ventilation = "";
    state.entretien = "";
    
    $("destinationPostopBlock").classList.add("hidden");
    $("destinationPostop").value = "";
    
    $("peropCard").classList.add("hidden");
    $("showPeropBtn").classList.add("hidden");
    
    createChips(
      "monitorage",
      MONITORAGE_SED,
      "monitorage"
    );

    state.monitorage = state.monitorage.filter(x =>
      MONITORAGE_SED.includes(x)
    );

    state.induction = state.induction.filter(x =>
      DATA.sedationMedications.includes(x)
    );

    createChips(
      "induction",
      DATA.sedationMedications,
      "induction"
    );
    
createChips(
  "analgesieOptions",
  ANALGESIE_SED,
  "analgesie"
);

state.analgesie = state.analgesie.filter(x =>
  ANALGESIE_SED.includes(x)
);

renderAnalgesieDetails();
    
    createChips(
  "antibioOptions",
  ["Aucune", "Autre"],
  "antibio",
  true
);

if(!["Aucune", "Autre"].includes(state.antibio)){
  state.antibio = "Aucune";
}

renderAntibioDetails();
    
    state.reveil = state.reveil.filter(x =>
  REVEIL_SIMPLE.includes(x)
);

createChips(
  "reveilOptions",
  REVEIL_SIMPLE,
  "reveil"
);

renderSedationSuitesDetails();
    
  }else{
    $("endoscopyIntubationChip")
  .classList.add("hidden");
  
    $("destinationPostopBlock").classList.remove("hidden");
    
renderPeropVisibility();
    
    createChips(
      "monitorage",
      DATA.monitorage,
      "monitorage"
    );

    createChips(
      "induction",
      DATA.induction,
      "induction"
    );
    
createChips(
  "analgesieOptions",
  ANALGESIE_STD,
  "analgesie"
);

renderAnalgesieDetails();
    
    renderAntibio();
    
    state.reveil = state.reveil.filter(x =>
  REVEIL_STD.includes(x)
);

createChips(
  "reveilOptions",
  REVEIL_STD,
  "reveil"
);

renderReveilDetails();
    
    updateCurare();
  }
const endoscopyGesture = isEndoscopyGestureSelected();

$("endoscopyIntubationChip").classList.toggle(
  "hidden",
  !endoscopyGesture
);

$("endoscopyIntubationChip").classList.toggle(
  "active",
  endoscopyGesture && state.endoscopyIntubation
);
  renderMonitorageDetails();
}

function updateCurare(){
  const sr = $("sequenceRapide").checked;

  const list = sr
    ? ["Aucun","Atracurium","Rocuronium","Célocurine"]
    : CURARE_BASE;

  state.curare = state.curare.filter(x=>list.includes(x));
createChips("curare", list, "curare");

const hasNonDepol =
  state.curare.includes("Atracurium") ||
  state.curare.includes("Rocuronium");

$("antagonisationBlock").classList.toggle("hidden", !hasNonDepol);

if(!hasNonDepol){
  state.antagonisation = false;
  $("antagonisationChip").classList.remove("active");
}
}

function handleSequenceRapideChange(){
  if($("sequenceRapide").checked){
    $("ventilationBlock").classList.add("hidden");
    state.ventilation = "";
    $("ventilationPrecision").value = "";
    $("ventilationPrecision").classList.add("hidden");
    $("ventilationOptions").innerHTML = "";
  }else if(state.va === "Intubation oro-trachéale"){
    $("ventilationBlock").classList.remove("hidden");

    createChips(
      "ventilationOptions",
      ["Facile", "Difficile", "Impossible", "Autre"],
      "ventilation",
      true
    );
  }

  updateCurare();
  renderReport();
}

function renderALR(){
  const gestes = getSelectedGestesRaw();

  const alrs = new Set();
  const neuraxials = new Set();

  gestes.forEach(g=>{
    (ALR_PERIPHERIQUE_MAP[g] || []).forEach(a=>alrs.add(a));
    (ALR_NEURAXIAL_MAP[g] || []).forEach(a=>neuraxials.add(a));
  });

  let alrList = [...alrs];

if(alrList.length > 0 && !alrList.includes("Autre")){
  alrList.push("Autre");
}

const neuraxialList = [...neuraxials];

  state.alr = state.alr.filter(x=>alrList.includes(x));
  state.neuraxial = state.neuraxial.filter(x=>neuraxialList.includes(x));

  if(alrList.length === 0){
    $("alrCard").classList.add("hidden");
    state.alr = [];
  }else{
    $("alrCard").classList.remove("hidden");
    createChips("alrOptions", alrList, "alr");
  }

  if(neuraxialList.length === 0){
    $("neuraxialCard").classList.add("hidden");
    state.neuraxial = [];
    $("periduraleDetails").classList.add("hidden");
    $("periduraleNiveau").value = "";
  }else{
    $("neuraxialCard").classList.remove("hidden");
    createChips("neuraxialOptions", neuraxialList, "neuraxial");
    renderNeuraxialDetails();
  }
}

function renderAntibio(){
  const gestes = getSelectedGestesRaw();
  const antibios = new Set();

  gestes.forEach(g=>{
    antibios.add(ANTIBIO_MAP[g] || "Aucune");
  });

  let list = [...antibios];

  if(list.length === 0){
    list = ["Aucune"];
  }

  if(!list.includes("Autre")){
    list.push("Autre");
  }

  if(!list.includes(state.antibio)){
    state.antibio = list[0];
  }

  createChips("antibioOptions", list, "antibio", true);
  renderAntibioDetails();
}

function shouldHidePeropByDefault(){
  const spec = specialiteSelect.value;
  const gestes = getSelectedGestesRaw();

  if(!gestes.length){
    return false;
  }

  if(SIMPLE_PEROP_SPECIALITES.includes(spec)){
    return true;
  }

  return gestes.every(g=>SIMPLE_PEROP_GESTES.includes(g));
}

function renderPeropVisibility(){
  if(isSedationMode() || isECTMode()){
    $("peropCard").classList.add("hidden");
    $("showPeropBtn").classList.add("hidden");
    return;
  }

  const hideByDefault = shouldHidePeropByDefault();

  if(state.peropHidden || (hideByDefault && !state.peropForced)){
    $("peropCard").classList.add("hidden");
    $("showPeropBtn").classList.remove("hidden");
  }else{
    $("peropCard").classList.remove("hidden");
    $("showPeropBtn").classList.add("hidden");
  }
}

async function copyReport(){
  const txt = buildDPIReport();

  try{
    await navigator.clipboard.writeText(txt);
  }catch{
    const old = report.value;
    report.value = txt;
    report.select();
    document.execCommand("copy");
    report.value = old;
  }

  $("copyBtn").textContent = "Copié ✓";
  $("copyBtn").classList.add("copied");

  setTimeout(()=>{
    $("copyBtn").textContent = "Copier le CR";
    $("copyBtn").classList.remove("copied");
  }, 1500);
}
function resetForm(){
  const hasWork = getSelectedGestesRaw().some(Boolean);
  if(hasWork && !confirm("Réinitialiser le compte-rendu ? Les données saisies seront perdues.")){
    return;
  }
  window.__crSkipUnloadWarn = true;
  clearDraft();
  location.reload();
}
function initState(){
  if(!DATA.monitorage.includes("PICC Line")) DATA.monitorage.push("PICC Line");
  if(!DATA.monitorage.includes("Mid Line")) DATA.monitorage.push("Mid Line");
}

function initUI(){
  initDate();

  $("anesthContainer").innerHTML = "";
  addAnesth(false);

  fillSelect(specialiteSelect, Object.keys(DATA.specialites), "Choisir...");

  $("chirContainer").innerHTML = "";
  $("gesteContainer").innerHTML = "";

  addChir(false);
  addGeste(false);

  createChips("monitorage", DATA.monitorage, "monitorage");
  createChips("induction", DATA.induction, "induction");
  createChips("curare", CURARE_BASE, "curare");

  createChips(
    "vaOptions",
    VA_STD,
    "va",
    true
  );

  createChips("entretienOptions", DATA.entretien, "entretien", true);

  createChips(
    "analgesieOptions",
    ANALGESIE_STD,
    "analgesie"
  );

  createChips(
    "reveilOptions",
    REVEIL_STD,
    "reveil"
  );

  createChips(
    "transfusionOptions",
    TRANSFUSION_ITEMS,
    "transfusion"
  );

  createChips(
    "drainsOptions",
    DRAINS_ITEMS,
    "drains"
  );

  renderAntibio();
  renderALR();
  renderPeropVisibility();
  renderReport();
}

function initListeners(){
  $("viewFormatted").onclick = ()=>setReportView("formatted");
  $("viewRaw").onclick = ()=>setReportView("raw");

  window.addEventListener("beforeunload", (e)=>{
    if(window.__crSkipUnloadWarn) return;
    const hasWork =
      getSelectedGestesRaw().some(Boolean) ||
      [...document.querySelectorAll(".chirurgien, .anesthesiste")].some(x=>x.value);
    if(hasWork){
      e.preventDefault();
      e.returnValue = "";
    }
  });

  $("addAnesthBtn").onclick = ()=>addAnesth(true);
  $("addChirBtn").onclick = ()=>addChir(true);
  $("addGesteBtn").onclick = ()=>addGeste(true);
  $("resetBtn").onclick = resetForm;
  $("copyBtn").onclick = copyReport;

  if($("urgenceChip")){
    $("urgenceChip").onclick = ()=>{
      state.urgence = !state.urgence;
      $("urgenceChip").classList.toggle("active", state.urgence);
      renderReport();
    };
  }

  $("antagonisationChip").onclick = ()=>{
    state.antagonisation = !state.antagonisation;
    $("antagonisationChip").classList.toggle("active", state.antagonisation);
    renderReport();
  };

  $("showPeropBtn").onclick = ()=>{
    state.peropForced = true;
    state.peropHidden = false;
    renderPeropVisibility();
    renderReport();
  };

  $("removePeropBtn").onclick = ()=>{
    state.peropHidden = true;
    state.peropForced = false;
    renderPeropVisibility();
    renderReport();
  };

  $("sequenceRapide").addEventListener("change", handleSequenceRapideChange);

  $("sequenceRapideToggle").onclick = ()=>{
    $("sequenceRapide").checked = !$("sequenceRapide").checked;
    $("sequenceRapideToggle").classList.toggle("active", $("sequenceRapide").checked);
    handleSequenceRapideChange();
  };

  $("noradToggle").onclick = ()=>{
    const active = $("noradToggle").classList.toggle("active");
    $("noradBlock").classList.toggle("hidden", !active);
    if(!active) $("noradText").value = "";
    renderReport();
  };

  $("endoscopyIntubationChip").onclick = ()=>{
    state.endoscopyIntubation = !state.endoscopyIntubation;

    if(!state.endoscopyIntubation){
      state.curare = [];
      state.va = "";
      state.ventilation = "";
      state.entretien = "";
      state.antagonisation = false;

      $("sequenceRapide").checked = false;
      $("sequenceRapideToggle")?.classList.remove("active");

      createChips("curare", CURARE_BASE, "curare");
      createChips(
        "vaOptions",
        VA_STD,
        "va",
        true
      );
    }

    $("endoscopyIntubationChip").classList.toggle("active", state.endoscopyIntubation);
    applyAnesthesiaMode();
    renderReport();
  };

  $("incidentToggle").onclick = ()=>{
    const active = $("incidentToggle").classList.toggle("active");
    $("incidentBlock").classList.toggle("hidden", !active);
    if(!active) $("incidentText").value = "";
    renderReport();
  };

  $("transfusionToggle").onclick = ()=>{
    state.transfusionActive = !state.transfusionActive;
    $("transfusionToggle").classList.toggle("active", state.transfusionActive);
    $("transfusionBlock").classList.toggle("hidden", !state.transfusionActive);

    if(!state.transfusionActive){
      state.transfusion = [];
      createChips(
        "transfusionOptions",
        TRANSFUSION_ITEMS,
        "transfusion"
      );
    }

    renderReport();
  };

  $("drainsToggle").onclick = ()=>{
    state.drainsActive = !state.drainsActive;
    $("drainsToggle").classList.toggle("active", state.drainsActive);
    $("drainsBlock").classList.toggle("hidden", !state.drainsActive);

    if(!state.drainsActive){
      state.drains = [];
      createChips(
        "drainsOptions",
        DRAINS_ITEMS,
        "drains"
      );
    }

    renderReport();
  };

  specialiteSelect.onchange = ()=>{
    state.peropForced = false;
    state.peropHidden = false;
    updateChirurgiens();

    $("chirLabel").textContent =
      ["Psychiatrie", "Endoscopie digestive"].includes(specialiteSelect.value)
        ? "Intervenant"
        : "Chirurgien";

    document.querySelectorAll(".field").forEach(block=>{
      const sel = block.querySelector(".geste-select");

      if(sel){
        fillSelect(
          sel,
          DATA.specialites[specialiteSelect.value]?.interventions || [],
          "Intervention..."
        );
        renderGesteExtra(block, sel.value);
      }
    });

    renderALR();
    renderAntibio();
    renderPeropVisibility();
    renderReport();
  };

  document.addEventListener("change", (e)=>{
    const shouldUpdateMode =
      e.target.classList.contains("geste-select") ||
      e.target.classList.contains("anesthesiste") ||
      e.target.id === "specialite";

    if(shouldUpdateMode){
      applyAnesthesiaMode();
    }

    renderReport();
  });

  document.addEventListener("input", renderReport);
}


// ── AUTOSAVE (brouillon local, anti-perte) ─────────────────────────────
const DRAFT_KEY = 'cr-anesthesie-draft';
const DRAFT_TTL_MS = 12 * 3600 * 1000; // 12 h
let __restoring = false;
let __initializing = true;
const DETAIL_IDS = [
  "scopeDerivations","ktaSite","ktcSite","mlSize","tubeSize","selectiveTubeSize",
  "ventilationPrecision","periduraleNiveau","localAgent","localVolume",
  "analgesieOtherText","alrOtherText","antibioOtherText","positionPatient",
  "diurese","saignement","remplissage","noradText","incidentText",
  "qteCGR","qtePFC","qtePlaquettes","qteFibrinogene","qteCalcium","transfusionOtherText",
  "drainThoraciqueText","redonText","lameText","svText","drainsOtherText",
  "sedationSuitesOtherText","complicationExtubationText","intubeVentileReason","destinationPostop"
];

function saveDraft(){
  if(__restoring || __initializing) return;
  try{
    const snap = {
      v:1, t:Date.now(),
      date:$("date").value,
      specialite:specialiteSelect.value,
      anesth:[...document.querySelectorAll(".anesthesiste")].map(x=>x.value),
      chir:[...document.querySelectorAll(".chirurgien")].map(x=>x.value),
      gestes:[...document.querySelectorAll("#gesteContainer > .field")].map(b=>({
        sel:b.querySelector(".geste-select")?.value||"",
        lat:b.querySelector(".laterality-select")?.value||"",
        approach:b.querySelector(".approach-select")?.value||"",
        robot:!!b.querySelector(".robot-chip.active"),
        precision:b.querySelector(".precision-input")?.value||"",
        custom:b.querySelector(".custom-geste")?.value||""
      })),
      state:JSON.parse(JSON.stringify(state)),
      seqRapide:$("sequenceRapide").checked,
      noradActive:$("noradToggle").classList.contains("active"),
      incidentActive:$("incidentToggle").classList.contains("active"),
      details:{}
    };
    DETAIL_IDS.forEach(id=>{ const el=$(id); if(el) snap.details[id]=el.value; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(snap));
  }catch(e){}
}

function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }

function reRenderChipsFromState(){
  const groups = {
    monitorage:["monitorage",false], induction:["induction",false], curare:["curare",false],
    vaOptions:["va",true], entretienOptions:["entretien",true], analgesieOptions:["analgesie",false],
    alrOptions:["alr",false], neuraxialOptions:["neuraxial",false], reveilOptions:["reveil",false],
    transfusionOptions:["transfusion",false], drainsOptions:["drains",false],
    antibioOptions:["antibio",true], ventilationOptions:["ventilation",true]
  };
  for(const cid in groups){
    const box=$(cid); if(!box) continue;
    const list=[...box.querySelectorAll(".chip")].map(c=>c.textContent.trim()).filter(Boolean);
    if(list.length) createChips(cid, list, groups[cid][0], groups[cid][1]);
  }
}

function restoreDraft(){
  let snap;
  try{ snap=JSON.parse(localStorage.getItem(DRAFT_KEY)); }catch(e){ return false; }
  if(!snap || snap.v!==1) return false;
  if(snap.t && (Date.now()-snap.t) > DRAFT_TTL_MS){ clearDraft(); return false; }
  const hasWork = (snap.gestes||[]).some(g=>g.sel) ||
                  (snap.anesth||[]).some(Boolean) || (snap.chir||[]).some(Boolean);
  if(!hasWork) return false;

  __restoring = true;
  try{
    $("date").value = snap.date || "";
    specialiteSelect.value = snap.specialite || "";
    specialiteSelect.dispatchEvent(new Event("change",{bubbles:true}));

    // Anesthésistes
    $("anesthContainer").innerHTML=""; addAnesth(false);
    for(let i=1;i<(snap.anesth||[]).length;i++) addAnesth(true);
    document.querySelectorAll(".anesthesiste").forEach((sel,i)=>{ if(snap.anesth[i]!==undefined) sel.value=snap.anesth[i]; });

    // Chirurgiens
    $("chirContainer").innerHTML=""; addChir(false);
    for(let i=1;i<(snap.chir||[]).length;i++) addChir(true);
    document.querySelectorAll(".chirurgien").forEach((sel,i)=>{ if(snap.chir[i]!==undefined) sel.value=snap.chir[i]; });

    // Gestes
    $("gesteContainer").innerHTML="";
    (snap.gestes||[]).forEach((g,i)=>addGeste(i>0));
    let blocks=[...document.querySelectorAll("#gesteContainer > .field")];
    (snap.gestes||[]).forEach((g,i)=>{
      const sel=blocks[i].querySelector(".geste-select");
      sel.value=g.sel;
      sel.dispatchEvent(new Event("change",{bubbles:true}));
    });
    blocks=[...document.querySelectorAll("#gesteContainer > .field")];
    (snap.gestes||[]).forEach((g,i)=>{
      const b=blocks[i];
      const lat=b.querySelector(".laterality-select"); if(lat && g.lat) lat.value=g.lat;
      const ap=b.querySelector(".approach-select");
      if(ap && g.approach){ ap.value=g.approach; ap.dispatchEvent(new Event("change",{bubbles:true})); }
      const robot=b.querySelector(".robot-chip"); if(robot && g.robot) robot.classList.add("active");
      const pr=b.querySelector(".precision-input"); if(pr && g.precision) pr.value=g.precision;
      const cu=b.querySelector(".custom-geste"); if(cu && g.custom) cu.value=g.custom;
    });

    // État complet (écrase presets/filtres de mode)
    Object.assign(state, snap.state||{});

    // Reconstruire les sous-champs (certains renderers RÉINITIALISENT une partie de
    // l'état : renderVADetails remet sequenceRapide=false et state.ventilation="").
    reRenderChipsFromState();
    renderMonitorageDetails(); renderVADetails(); renderVentilationDetails();
    renderNeuraxialDetails(); renderAntibioDetails(); renderALRDetails();
    renderAnalgesieDetails(); renderTransfusionDetails(); renderDrainsDetails();
    if(isSedationMode()||isECTMode()) renderSedationSuitesDetails(); else renderReveilDetails();
    renderPeropVisibility();

    // RE-restaurer l'état écrasé par les renderers, PUIS re-cocher les chips.
    Object.assign(state, snap.state||{});
    reRenderChipsFromState();

    // Interrupteurs hors state (posés APRÈS les renderers, en dernier)
    $("noradToggle").classList.toggle("active", !!snap.noradActive);
    $("noradBlock").classList.toggle("hidden", !snap.noradActive);
    $("incidentToggle").classList.toggle("active", !!snap.incidentActive);
    $("incidentBlock").classList.toggle("hidden", !snap.incidentActive);
    $("urgenceChip")?.classList.toggle("active", !!state.urgence);
    $("antagonisationChip")?.classList.toggle("active", !!state.antagonisation);
    $("antagonisationBlock")?.classList.toggle("hidden",
      !(state.curare && (state.curare.includes("Atracurium")||state.curare.includes("Rocuronium"))));
    $("transfusionToggle").classList.toggle("active", !!state.transfusionActive);
    $("transfusionBlock").classList.toggle("hidden", !state.transfusionActive);
    $("drainsToggle").classList.toggle("active", !!state.drainsActive);
    $("drainsBlock").classList.toggle("hidden", !state.drainsActive);

    // Séquence rapide EN DERNIER (renderVADetails l'a remise à false) + rafraîchir le curare
    $("sequenceRapide").checked = !!snap.seqRapide;
    $("sequenceRapideToggle")?.classList.toggle("active", !!snap.seqRapide);
    if(snap.seqRapide){ updateCurare(); }

    // Valeurs des sous-champs (après que les renderers les aient recréés)
    DETAIL_IDS.forEach(id=>{ const el=$(id); if(el && snap.details && snap.details[id]!==undefined) el.value=snap.details[id]; });

    renderReport();
  }catch(e){ __restoring=false; return false; }
  __restoring=false;
  return true;
}

function init(){
  initState();
  initUI();
  initListeners();
  restoreDraft();
  __initializing = false;
}

init();

