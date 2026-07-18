/**
 * Générateur du « Guide d'aide au codage — CHPG Anesthésie-Réanimation »
 * Version du guide produit : v1.1 (18 juillet 2026)
 *
 * Source de vérité du contenu : docs/module-liberal/antiseche_CCAM_anesthesie_CHPG.md (v14)
 * À régénérer à chaque évolution de l'antisèche, puis repousser le .docx.
 *
 * Usage :
 *   node guide_docx_generator.js      -> écrit Guide_aide_au_codage_CHPG.docx
 * Dépendance : npm i docx
 *
 * Rappel : les valeurs chiffrées proviennent de l'antisèche validée au centime.
 * Ne jamais y introduire de tarif deviné ; le §8 du guide reste « non validé CSM ».
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageNumber, Footer, PageBreak, VerticalAlign
} = require('docx');
const fs = require('fs');

const NAVY = '17375E';
const TEAL = '0E6E6A';
const GOLD = 'B58A2A';
const GREY = '5A5A5A';
const RED  = '9E1B1B';
const LIGHT = 'F4F7FA';

const F = 'Calibri';

// ---------- helpers ----------
const runs = rs => rs.map(r => new TextRun({
  text: r.t, bold: r.b, italics: r.i, color: r.c, size: r.s ?? 20, font: F
}));

const PR = (rs, o = {}) => new Paragraph({
  spacing: { after: o.after ?? 150, before: o.before, line: o.line ?? 288 },
  alignment: o.align, indent: o.indent, shading: o.shading, border: o.border,
  keepNext: o.keepNext,
  children: runs(rs)
});
const P = (t, o = {}) => PR([{ t, b: o.bold, i: o.italics, c: o.color, s: o.size }], o);

const H1 = (num, text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  alignment: AlignmentType.CENTER,
  spacing: { before: 430, after: 210 },
  keepNext: true,
  border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: TEAL, space: 7 } },
  children: [
    new TextRun({ text: num + '.  ', bold: true, color: TEAL, size: 29, font: F }),
    new TextRun({ text, bold: true, color: NAVY, size: 27, font: F })
  ]
});

const H2 = t => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 120 }, keepNext: true,
  children: [new TextRun({ text: t, bold: true, color: TEAL, size: 22, font: F })]
});

const BUL = (rs) => new Paragraph({
  numbering: { reference: 'puces', level: 0 },
  spacing: { after: 105, line: 288 },
  children: runs(rs)
});

const CHK = rs => new Paragraph({
  spacing: { after: 120, line: 288 }, indent: { left: 170 },
  children: [new TextRun({ text: '\u2610  ', size: 23, font: F, color: TEAL })].concat(runs(rs))
});

const SP = (h = 190) => new Paragraph({ spacing: { after: h }, children: [] });

const BOX = (rs, fill, bar) => PR(rs, {
  shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
  border: {
    top:    { style: BorderStyle.SINGLE, size: 4,  color: bar, space: 6 },
    bottom: { style: BorderStyle.SINGLE, size: 4,  color: bar, space: 6 },
    left:   { style: BorderStyle.SINGLE, size: 22, color: bar, space: 9 },
    right:  { style: BorderStyle.SINGLE, size: 4,  color: bar, space: 6 }
  },
  after: 240
});
const WARN = rs => BOX(rs, 'FDF3F3', RED);
const NOTE = rs => BOX(rs, 'EFF5F5', TEAL);
const TIP  = rs => BOX(rs, 'FBF7EC', GOLD);

// formule centrée encadrée
const FORMULA = (rs) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 170 },
  shading: { type: ShadingType.CLEAR, fill: NAVY, color: 'auto' },
  border: {
    top: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 8 },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 8 },
    left: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 8 },
    right: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 8 }
  },
  children: rs.map(r => new TextRun({ text: r.t, bold: r.b ?? true, color: r.c ?? 'FFFFFF', size: r.s ?? 22, font: F }))
});

function mkTable(headers, rows, widths, o = {}) {
  const cell = (content, co = {}) => new TableCell({
    width: { size: co.w, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: co.shade ? { type: ShadingType.CLEAR, fill: co.shade, color: 'auto' } : undefined,
    margins: { top: 110, bottom: 110, left: 150, right: 150 },
    children: [new Paragraph({
      spacing: { after: 0, line: 276 },
      alignment: co.align,
      children: (Array.isArray(content) ? content : [{ t: content, b: co.b, c: co.c }])
        .map(r => new TextRun({ text: r.t, bold: r.b ?? co.b, italics: r.i, color: r.c ?? co.c, size: 18.5*2/2? r.s ?? 19 : 19, font: F }))
    })]
  });
  const head = new TableRow({ tableHeader: true,
    children: headers.map((h, i) => cell(h, { w: widths[i], b: true, c: 'FFFFFF', shade: NAVY }))
  });
  const body = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => cell(c, {
      w: widths[i],
      shade: (o.hl && o.hl.includes(ri)) ? 'FFF3D6' : (ri % 2 ? LIGHT : undefined),
      b: i === 0 && !o.noFirstBold
    }))
  }));
  return new Table({
    columnWidths: widths,
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D7DDE4' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E4E8EE' }
    },
    rows: [head, ...body]
  });
}

// ---------- contenu ----------
const ch = [];

// ===== page de garde compacte =====
ch.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 60 },
  children: [new TextRun({ text: 'CHPG \u00B7 SERVICE D\u2019ANESTH\u00C9SIE-R\u00C9ANIMATION', bold: true, color: TEAL, size: 19, font: F })]
}));
ch.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 50 },
  children: [new TextRun({ text: 'Guide d\u2019aide au codage', bold: true, color: NAVY, size: 52, font: F })]
}));
ch.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: TEAL, space: 10 } },
  children: [new TextRun({ text: 'CCAM \u00B7 NGAP \u00B7 R\u00E9animation — cadre mon\u00E9gasque (CSM)', color: GREY, size: 23, font: F })]
}));
ch.push(PR([
  { t: 'v1.1 — 18 juillet 2026', b: true, s: 18, c: GREY },
  { t: '   \u00B7   fusionne l\u2019antis\u00E8che v14, la fiche m\u00E9mo et le m\u00E9mo 1 page — valid\u00E9 au centime sur feuilles r\u00E9elles', s: 18, c: GREY }
], { after: 230, align: AlignmentType.CENTER }));

ch.push(WARN([
  { t: 'Coter juste, et coter tout.  ', b: true, c: RED },
  { t: 'Ce guide vise l\u2019exhaustivit\u00E9 de ce qui est d\u00FB — jamais la surcotation. Une ligne oubli\u00E9e est d\u00E9finitivement perdue ; \u00E0 Monaco elle est perdue ' },
  { t: '\u00D7 1,95', b: true },
  { t: '.' }
]));
ch.push(NOTE([
  { t: 'Statut.  ', b: true },
  { t: 'Les \u00A71 \u00E0 \u00A77 sont valid\u00E9s sur relev\u00E9s r\u00E9els. Le \u00A78 (points CSM) est ' },
  { t: 'non valid\u00E9', b: true },
  { t: ' — ne pas appliquer en l\u2019\u00E9tat. Le m\u00E9mo de poche 1 page (memo_cotation_CCAM_NGAP.docx) reste le condens\u00E9 de ce guide.' }
]));

// ===== 1. La formule =====
ch.push(H1('1', 'La formule Monaco — ce que vaut une ligne CCAM'));
ch.push(P('Chaque ligne d\u2019anesth\u00E9sie (activit\u00E9 4) se valorise ainsi :', { after: 60 }));
ch.push(FORMULA([
  { t: 'BR  =  coeff. carte  \u00D7  ( tarif act. 4  \u00D7  (1 + %mod)  \u00D7  taux assoc. )  +  \u20ACmod' }
]));
ch.push(PR([
  { t: 'BR du parcours = somme des lignes.  ', b: true },
  { t: 'Le d\u00E9passement d\u2019honoraires (DH) s\u2019ajoute par-dessus la BR — il est trait\u00E9 au \u00A75.' }
]));
ch.push(mkTable(
  ['Bloc de la formule', 'Valeurs', '\u00C0 retenir'],
  [
    ['Coeff. carte', 'Mon\u00E9gasque (verte \u00B7 rose \u00B7 bulle) : \u00D7 1,95   \u00B7   Fran\u00E7ais : \u00D7 1,00', 'se lit sur la carte du patient, avant de coter'],
    ['%mod  (\u00D7 le tarif)', '7 pr\u00E9sence : + 6 %  \u00B7  8 it\u00E9ratif : + 20 %  \u00B7  R : + 50 %  \u00B7  L : + 20 %', 'cumulables (max 4 modificateurs)'],
    ['\u20ACmod  (\u00E0 plat)', 'A (< 4 ans / > 80 ans) : + 23 \u20AC FR \u00B7 + 44,85 \u20AC mon\u00E9g.  \u00B7  urgences O/U/S/F', 'le A suit la carte'],
    ['Taux assoc.', 'principal 100 %  \u00B7  associ\u00E9 50 %  \u00B7  compl\u00E9ment (AHQJ021\u2026) 100 % en sus', 'le 3\u1D49 acte : 0 %']
  ],
  [1750, 4610, 3000]
));
ch.push(SP());
ch.push(TIP([
  { t: 'Exemple valid\u00E9 — PTH, carte verte, > 80 ans, modificateur 7.  ', b: true },
  { t: 'NEKA014 : 253,90 \u00D7 1,95 = 495,11 \u2192 \u00D7 1,06 = 524,81 + 44,85 (A mon\u00E9g.) = ' },
  { t: '569,66 \u20AC', b: true },
  { t: '  \u00B7  + associ\u00E9 NEFA004 \u00E0 50 % = 167,65 \u20AC  \u2192  parcours ' },
  { t: '737,31 \u20AC de BR', b: true },
  { t: '. Chaque modificateur oubli\u00E9 ici serait perdu \u00D7 1,95.' }
]));

// ===== 2. Les trois réflexes =====
ch.push(H1('2', 'Les trois r\u00E9flexes'));
ch.push(H2('R\u00E9flexe n\u00B0 1 — la ligne \u00AB activit\u00E9 4 \u00BB'));
ch.push(PR([
  { t: 'Toute intervention sous AG/ALR porte une ligne ' },
  { t: 'code activit\u00E9 4', b: true },
  { t: ' (code acte du chirurgien \u00B7 activit\u00E9 4 \u00B7 phase 0). Si elle ne remonte pas, ' },
  { t: 'l\u2019anesth\u00E9sie est perdue', b: true, c: RED },
  { t: '. Viser 100 % des interventions \u00E9ligibles. CEC \u2192 activit\u00E9 5.' }
]));
ch.push(H2('R\u00E9flexe n\u00B0 2 — jamais d\u2019anesth\u00E9sie sans code'));
ch.push(PR([
  { t: 'Acte sans anesth\u00E9sie native (FOGD, PAC\u2026) \u2192 anesth\u00E9sie compl\u00E9mentaire indiqu\u00E9e en regard, ou \u00E0 d\u00E9faut ' },
  { t: 'ZZLP025', b: true },
  { t: ' (AG/ALR compl\u00E9mentaire niveau 1).' }
]));
ch.push(H2('R\u00E9flexe n\u00B0 3 — v\u00E9rifier l\u2019ex\u00E9cutant'));
ch.push(PR([
  { t: 'Le nom de l\u2019ex\u00E9cutant de la ligne d\u2019anesth\u00E9sie ne doit pas \u00EAtre celui du chirurgien.', b: true },
  { t: '  Erreur administrative banale \u2192 perte totale de la ligne.' }
]));

// ===== 3. Au bloc =====
ch.push(H1('3', 'Au bloc — gestes en sus et modificateurs'));
ch.push(H2('Gestes cotables en plus de la ligne d\u2019anesth\u00E9sie (art. 7)'));
ch.push(mkTable(
  ['Code', 'Situation', 'Tarif base'],
  [
    ['AHQJ021', '\u00C9choguidage d\u2019ALR p\u00E9riph\u00E9rique de membre ou de paroi abdominale (TAP bloc) — 100 %, jamais d\u00E9cot\u00E9', '29,12 \u20AC'],
    ['YYYY041', 'R\u00E9cup\u00E9ration perop\u00E9ratoire de sang (cell-saver) \u00B7 \u2265 15 % de la vol\u00E9mie, retransfus\u00E9 < 6 h', 'base CCAM'],
    ['ZZLP025', 'AG/ALR compl\u00E9mentaire niveau 1 (si pas d\u2019activit\u00E9 4 native)', 'base CCAM']
  ],
  [1450, 5910, 2000]
));
ch.push(SP());
ch.push(H2('Modificateurs — chacun est de l\u2019argent perdu s\u2019il manque'));
ch.push(mkTable(
  ['Code', 'Situation', 'Effet'],
  [
    ['7', 'Pr\u00E9sence permanente de l\u2019anesth\u00E9siste — \u00E0 attester sur la fiche d\u2019anesth\u00E9sie', '+ 6 %'],
    ['A', 'AG ou ALR chez un patient < 4 ans ou > 80 ans', '+ 23 \u20AC FR \u00B7 + 44,85 \u20AC mon\u00E9g.'],
    ['8', 'Anesth\u00E9sie d\u2019intervention it\u00E9rative (\u0153il d\u00E9j\u00E0 op\u00E9r\u00E9, voies biliaires, urinaires)', '+ 20 %'],
    ['R', 'Chirurgie plastique face / cou / mains \u00B7 plaies ou br\u00FBlures face-mains (chir., vaut aussi pour l\u2019anesth\u00E9sie)', '+ 50 %'],
    ['L', 'Fracture ou luxation ouverte (idem)', '+ 20 %'],
    ['4 / 5', 'Analg\u00E9sie postop\u00E9ratoire loco-r\u00E9gionale sans / avec cath\u00E9ter', 'valeur \u00E0 confirmer CSM']
  ],
  [1050, 6310, 2000],
  { hl: [5] }
));
ch.push(SP());
ch.push(H2('Urgence — un seul des quatre'));
ch.push(mkTable(
  ['Code', 'Plage', 'Valeur anesth\u00E9siste'],
  [
    ['O', 'Urgence vitale ou fonctionnelle d\u2019organe, 8 h \u2013 20 h', '80 \u20AC'],
    ['U', 'Urgence 20 h \u2013 minuit', '50 \u20AC'],
    ['S', 'Urgence 0 h \u2013 8 h', '80 \u20AC'],
    ['F', 'Urgence un dimanche ou jour f\u00E9ri\u00E9', '40 \u20AC']
  ],
  [1050, 6310, 2000]
));
ch.push(SP(80));
ch.push(P('Le modificateur 3 (secteur 1 / OPTAM) est fran\u00E7ais : sans objet \u00E0 Monaco.', { italics: true, color: GREY }));

// ===== 4. NGAP =====
ch.push(H1('4', 'Consultations — l\u2019axe NGAP'));
ch.push(FORMULA([{ t: 'BR  =  lettre-cl\u00E9  \u00D7  coefficient        (pas de \u00D7 1,95 \u00B7 pas de modificateur \u00B7 la carte ne change pas la BR)', s: 20 }]));
ch.push(mkTable(
  ['Lettre-cl\u00E9', 'Valeur', 'Exemple'],
  [
    ['C', '34,40 \u20AC', 'C 2 \u2192 68,80 \u20AC'],
    ['CS', '46,00 \u20AC', 'CS 1 \u2192 46,00 \u20AC'],
    ['APC', '60,00 \u20AC', 'APC 1 \u2192 60,00 \u20AC \u00B7 avis ponctuel de consultant (coeff. 1 suppos\u00E9, \u00E0 confirmer)']
  ],
  [1500, 1600, 6260]
));
ch.push(SP());
ch.push(NOTE([
  { t: 'Pas de consultation (APC ou CS) le jour m\u00EAme d\u2019un acte anesth\u00E9sique — sauf urgence', b: true },
  { t: ' (art. 20 A). Les axes CCAM et NGAP sont deux mondes s\u00E9par\u00E9s : formules, modificateurs et quotas ne se croisent jamais.' }
]));

// ===== 5. DH =====
ch.push(H1('5', 'Le d\u00E9passement d\u2019honoraires — par carte'));
ch.push(P('Le DH s\u2019ajoute par-dessus la BR (Factur\u00E9 = BR + DH). Il vaut pour les deux axes.', { after: 70 }));
ch.push(mkTable(
  ['Statut patient', 'DH', 'Exemple (CS 1)'],
  [
    ['Carte verte \u00B7 SPME', '0 — net = BR', '46,00 \u20AC'],
    ['Carte rose', '+ 20 % de la BR', '46,00 + 9,20 = 55,20 \u20AC'],
    ['Carte bulle \u00B7 fran\u00E7ais \u00B7 NAS', 'libre', 'souvent fix\u00E9 pour un net rond (46 + 64 = 110 \u20AC)'],
    ['AME', '0 — tarif conventionnel strict (Ord. souv. 5.743)', '46,00 \u20AC']
  ],
  [2650, 3310, 3400]
));
ch.push(SP());
ch.push(TIP([
  { t: 'Pour le module lib\u00E9ral :  ', b: true },
  { t: 'le ratio des 30 % se calcule sur la ' },
  { t: 'BR seule', b: true },
  { t: ', s\u00E9par\u00E9ment par axe (CCAM \u2260 NGAP). Le ' },
  { t: 'DH est hors quota', b: true },
  { t: ' — revenu libre, jamais revers\u00E9. Mieux coder le public monte le T public et ' },
  { t: 'dilue', b: true },
  { t: ' le ratio : plus de marge lib\u00E9rale.' }
]));
ch.push(P('HNP (\u00AB honoraires non per\u00E7us \u00BB) = modalit\u00E9 de perception via la Caisse (tiers payant), pas un statut de carte : aucun effet sur le calcul BR/DH.', { italics: true, color: GREY }));

// ===== 6. Réa =====
ch.push(H1('6', 'R\u00E9animation et USC'));
ch.push(mkTable(
  ['Code', 'Libell\u00E9', 'Tarif / 24 h'],
  [
    ['YYYY015', 'Forfait de r\u00E9animation niveau A', '96,00 \u20AC'],
    ['YYYY020', 'Forfait niveau B — d\u00E8s qu\u2019une suppl\u00E9ance est pr\u00E9sente (ventilation, amines \u00E0 haut d\u00E9bit, EER, transfusion massive\u2026)', '160,00 \u20AC'],
    ['GEQE012', 'Fibroscopie bronchique diagnostique (intub\u00E9 / trach\u00E9o) — en sus', '96,00 \u20AC'],
    ['GEQE009', 'Fibroscopie bronchique avec LBA diagnostique — en sus', '110,40 \u20AC']
  ],
  [1450, 5910, 2000]
));
ch.push(SP());
ch.push(BUL([{ t: 'Un forfait par patient et par 24 h', b: true }, { t: ' — jours d\u2019admission, week-ends et transferts compris. Une journ\u00E9e oubli\u00E9e = forfait perdu, et du public en moins au d\u00E9nominateur lib\u00E9ral.' }]));
ch.push(BUL([{ t: 'Facturable en sus', b: true }, { t: ' : \u00E9puration extrar\u00E9nale (JVJF\u2026), \u00E9change plasmatique, fibroscopie diagnostique.' }]));
ch.push(BUL([{ t: 'Inclus — ne pas facturer \u00E0 part', b: true }, { t: ' : \u00E9cho c\u0153ur (DZQM006), VVC (EPLF002), KT art\u00E9riel, Swan-Ganz, drain pleural, gazom\u00E9trie, intubation (GELD004). Rejet garanti.' }]));
ch.push(SP(60));
ch.push(TIP([
  { t: 'Arbitrage chiffr\u00E9 :  ', b: true },
  { t: 'coder les gestes \u00E0 la place du forfait est perdant — VVC 61,72 \u20AC + drain \u2248 30 \u20AC \u00E0 50 % + intubation \u00E0 0 % \u2248 90\u2013100 \u20AC, contre ' },
  { t: '160 \u20AC', b: true },
  { t: ' pour le forfait B. Ces gestes servent \u00E0 justifier le B, pas \u00E0 \u00EAtre cot\u00E9s.' }
]));

// ===== 7. Ce qui ne se code pas + check-list =====
ch.push(H1('7', 'Ce qui ne se code pas \u00B7 check-list de fin d\u2019intervention'));
ch.push(BUL([
  { t: 'POCUS p\u00E9ri-anesth\u00E9sique', b: true },
  { t: ' (\u00E9cho gastrique d\u2019induction, rep\u00E9rage veineux) : inclus dans l\u2019acte d\u2019anesth\u00E9sie, aucun code d\u00E9di\u00E9. Ne pas coter HZQM001 (\u00E9cho abdominale compl\u00E8te, 56,70 \u20AC) pour un balayage cibl\u00E9 — surcotation.' }
]));
ch.push(BUL([{ t: 'Gestes inclus dans le forfait de r\u00E9a', b: true }, { t: ' (\u00A76) : facturation s\u00E9par\u00E9e rejet\u00E9e.' }]));
ch.push(SP(70));
ch.push(H2('Check-list — 30 secondes en fin d\u2019intervention'));
ch.push(CHK([{ t: 'Activit\u00E9 4', b: true }, { t: ' pr\u00E9sente (ou ZZLP025) \u00B7 CEC \u2192 activit\u00E9 5.' }]));
ch.push(CHK([{ t: 'Ex\u00E9cutant', b: true }, { t: ' \u2260 nom du chirurgien.' }]));
ch.push(CHK([{ t: 'Carte du patient identifi\u00E9e', b: true }, { t: ' (\u00D7 1,95 mon\u00E9gasque / \u00D7 1,00 fran\u00E7ais \u00B7 pilote aussi le A et le DH).' }]));
ch.push(CHK([{ t: 'Association', b: true }, { t: ' : le plus cher \u00E0 100 %, le second \u00E0 50 % — dans le bon ordre.' }]));
ch.push(CHK([{ t: '\u00C9choguidage d\u2019ALR', b: true }, { t: ' \u2192 AHQJ021 (29,12 \u20AC) \u00B7 cell-saver \u2192 YYYY041.' }]));
ch.push(CHK([{ t: 'Modificateur 7', b: true }, { t: ' (+ 6 %) attest\u00E9 \u00B7 8 it\u00E9ratif (+ 20 %) \u00B7 R (+ 50 %) / L (+ 20 %).' }]));
ch.push(CHK([{ t: '< 4 ans ou > 80 ans', b: true }, { t: ' \u2192 A (+ 23 \u20AC / + 44,85 \u20AC).' }]));
ch.push(CHK([{ t: 'Analg\u00E9sie postop LR', b: true }, { t: ' \u2192 modificateur 4 ou 5 (valeur \u00E0 confirmer CSM).' }]));
ch.push(CHK([{ t: 'Garde', b: true }, { t: ' : un seul modificateur d\u2019urgence — O 80 \u00B7 U 50 \u00B7 S 80 \u00B7 F 40 \u20AC.' }]));
ch.push(CHK([{ t: 'R\u00E9a', b: true }, { t: ' : forfait B d\u00E8s suppl\u00E9ance, chaque jour \u00B7 EER et fibro diagnostique en sus.' }]));
ch.push(CHK([{ t: 'Rejets de facturation', b: true }, { t: ' r\u00E9cup\u00E9r\u00E9s et retrait\u00E9s.' }]));

// ===== 8. CSM =====
ch.push(H1('8', 'En attente d\u2019arbitrage CSM — ne pas appliquer'));
ch.push(WARN([
  { t: 'Source : document de travail d\u2019un MAR en clinique priv\u00E9e en France (cadre CPAM).  ', b: true },
  { t: 'Le cadre mon\u00E9gasque est diff\u00E9rent. \u00C0 confirmer aupr\u00E8s de la CSM avant toute mise en pratique.' }
]));
ch.push(mkTable(
  ['Question', 'Notre r\u00E8gle actuelle', 'Piste externe (France)'],
  [
    ['Chirurgie de la main', '2 actes max (100 / 50 %)', '3 actes : 100 / 75 / 50 % — un 3\u1D49 acte r\u00E9cup\u00E9r\u00E9 \u00E0 chaque main si confirm\u00E9'],
    ['APC ou CS ?', 'APC = avis ponctuel de consultant', 'APC si ASA \u2265 3 \u00B7 CS + MCS si ASA 1-2'],
    ['MCS', 'absente de notre grille', 'majoration de coordination — valeur inconnue \u00E0 Monaco'],
    ['USC', 'non document\u00E9', 'YYYY015 + DEQP007 \u00B7 VVC et transfusion exclues le m\u00EAme jour'],
    ['TAP bilat\u00E9ral', 'AHQJ021 \u00D7 1', '\u00D7 2 si deux codes chirurgicaux (\u00E0 v\u00E9rifier)'],
    ['Redevance h\u00F4pital', '\u2014', 'taux et assiette du reversement \u00E0 pr\u00E9ciser (administration)']
  ],
  [1950, 3100, 4310]
));
ch.push(SP());

// ===== Sources =====
ch.push(H1('9', 'Sources'));
ch.push(BUL([{ t: 'Arr\u00EAt\u00E9 Minist\u00E9riel n\u00B0 2005-276 (CCAM Monaco, MAJ 2018) — caisses-sociales.mc \u00B7 codage art. 3, anesth\u00E9sie art. 7, associations art. 6/11/12/20, modificateurs art. 19 + Annexe I.' }]));
ch.push(BUL([{ t: 'Base CCAM v80 (01/01/2025, ameli / ATIH) — tarifs unitaires activit\u00E9s 1 et 4.' }]));
ch.push(BUL([{ t: 'Convention CCSS-CAMTI / Ordre des M\u00E9decins de Monaco — coefficients par carte.' }]));
ch.push(BUL([{ t: 'Relev\u00E9s de facturation internes — axes CCAM et NGAP valid\u00E9s au centime (8 feuilles r\u00E9elles).' }]));
ch.push(SP(70));
ch.push(P('La CCAM est r\u00E9vis\u00E9e 1 \u00E0 2 fois par an : valeurs \u00E0 reconfirmer p\u00E9riodiquement. R\u00E9f\u00E9rence d\u00E9taill\u00E9e : antis\u00E8che v14 (d\u00E9p\u00F4t Planning-CHPG).', { italics: true, color: GREY }));

// ---------- doc ----------
const doc = new Document({
  creator: 'Service d\u2019Anesth\u00E9sie-R\u00E9animation, CHPG',
  title: 'Guide d\u2019aide au codage — Anesth\u00E9sie-R\u00E9animation CHPG',
  numbering: { config: [{
    reference: 'puces',
    levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2013', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 340, hanging: 190 } } } }]
  }]},
  styles: { default: { document: { run: { font: F, size: 20 } } } },
  sections: [{
    properties: { page: { margin: { top: 1180, right: 1180, bottom: 1180, left: 1180 } } },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D0D6DD', space: 4 } },
      children: [new TextRun({
        children: ['Guide d\u2019aide au codage \u00B7 CHPG Anesth\u00E9sie-R\u00E9animation \u00B7 v1.1 \u00B7 p. ', PageNumber.CURRENT],
        size: 15, color: GREY, font: F })]
    })]})},
    children: ch
  }]
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync('/home/claude/Guide_aide_au_codage_CHPG.docx', b);
  console.log('OK', b.length, 'octets');
});
