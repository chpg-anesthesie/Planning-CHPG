const DATA = {

  anesthesistes: [
    "Dr Stéphanie ALBOUY",
    "Dr Guy ARMANDO",
    "Dr Laure BONNET",
    "Dr Mohammed BOUREGBA",
    "Dr Jean CATINEAU",
    "Dr Alexandre FERRIERO",
    "Dr Arthur FROHLICH",
    "Dr Sébastien GHIGLIONE",
    "Dr Jean-Philippe GUERIN",
    "Dr Lucile LEVASSEUR",
    "Dr Léa LEY-GHIGLIONE",
    "Dr Ruyade MENADE",
    "Dr Nicolas OPPRECHT",
    "Dr Nicolas PARTOUCHE",
    "Pr Bertrand PRUNET",
    "Dr Gildas ROUSSEAU",
    "Dr Nicolo SALA",
    "Dr Mathilde SEVERAC",
    "Dr Clément SUPLY",
    "Dr Wajdi SULTAN",
    "Dr Daisy TRAN",
    "Dr Rémy WIDEHEM",
    "Dr Félix ZAMARON"
  ],

  monitorage: ["Scope","SpO2","VVP","KTA","KTC","BIS","TOF"],

  induction: ["Sufentanil","Rémifentanil","Kétamine","Etomidate","Propofol"],

  entretien: ["Sevoflurane","Propofol AIVOC"],
  
  sedationGestes: [
  "Cataracte"
],
  
ectGestes: [
  "Electroconvulsivothérapie"
],

ectMedications: [
  "Propofol",
  "Célocurine",
  "Kétamine"
],
  
  sedationMedications: [
  "Midazolam",
  "Propofol",
  "Sufentanil",
  "Kétamine"
],
  
  laterality: ["Droite","Gauche","Bilatéral"],

  lateralizedGestes: [
  "PTH",
  "PTG",
  "Hallux valgus",
  "Clou gamma",
  "Varices",
  "Canal carpien",
  "Ostéosynthèse poignet",
  "Ostéosynthèse cheville",
  "Hernie inguinale",
  "Colectomie",
  "Annexectomie",
  "Kystectomie ovarienne",
  "Cataracte",
  "Prothèse d'épaule",
  "Arthroscopie de genou",
  "Arthroscopie d'épaule",
  "Mastectomie partielle",
  "Mastectomie totale",
  "Surrénalectomie",
  "Néphrectomie",
  "Montée de JJ",
  "URS + Laser",
  "UPR",
  "Ostéosynthèse plateau tibial",
  "Arthroscopie cheville",
  "Ethmoïdectomie",
  "Blépharoplastie",
  ],
  
approachOptions: {
  "Colectomie": ["Cœlioscopie", "Laparotomie"],
  "Néphrectomie": ["Totale", "Partielle"],
  "Appendicectomie": ["Cœlioscopie", "Laparotomie"],
  "Cholécystectomie": ["Cœlioscopie", "Laparotomie"],
  "Annexectomie": ["Cœlioscopie", "Laparotomie"],
  "Hystérectomie": ["Cœlioscopie", "Laparotomie"],
  "Kystectomie ovarienne": ["Cœlioscopie", "Laparotomie"],
  "Prostatectomie totale": ["Robot-assistée", "Laparotomie"],
  "Lobectomie pulmonaire": ["Thoracoscopie", "Thoracotomie"],
  "Segmentectomie": ["Thoracoscopie", "Thoracotomie"],
  "Sigmoïdectomie": ["Cœlioscopie", "Laparotomie"],
  "Résection grêlique": ["Cœlioscopie", "Laparotomie"],
  "Cure d’éventration": ["Cœlioscopie", "Laparotomie"],
  "Cure de hernie hiatale": ["Cœlioscopie", "Laparotomie"],
  "Sleeve gastrectomie": ["Cœlioscopie", "Laparotomie"],
  "Bypass gastrique": ["Cœlioscopie", "Laparotomie"],
  "Splénectomie": ["Cœlioscopie", "Laparotomie"],
  "Surrénalectomie": ["Cœlioscopie", "Laparotomie"],
  "Rétablissement de continuité": ["Cœlioscopie", "Laparotomie"],
},
  textGestes: [
    "Lobectomie pulmonaire",
    "Segmentectomie",
    "Recalibrage",
    "Vertébroplastie",
    "Segmentectomie hépatique",
    "Embolisation"
  ],
  
  robotGestes: [
  "Colectomie",
  "Sigmoïdectomie",
  "Résection grêlique",
  "Cure d’éventration",
  "Sleeve gastrectomie",
  "Bypass gastrique",
  "Surrénalectomie",
  "Hystérectomie",
  "Annexectomie",
  "Lobectomie pulmonaire",
  "Segmentectomie"
],

  specialites: {
    "Orthopédie": {
      chirurgiens: [
        "Dr Cédric PELEGRI",
        "Dr Adrien GUILLOT",
        "Dr Hugo DARMANTE",
        "Dr Tristan LASCAR",
        "Dr Mathieu GHREA"
      ],
      interventions: [
        "PTH","PTG","Ostéosynthèse cheville","Ostéosynthèse poignet",
        "Recalibrage","Canal carpien","Hallux valgus","Clou gamma",
        "Prothèse d'épaule","Arthroscopie de genou","Arthroscopie d'épaule","Ostéosynthèse plateau tibial",
        "Arthroscopie cheville",
        "Autre..."
      ]
    },

    "Viscéral": {
      chirurgiens: [
        "Pr Fabrizio PANARO",
        "Dr Adolfo GAVELLI",
        "Dr Marie-Christine MISSANA",
        "Dr Hubert PERRIN",
        "Dr Anna MARMORALE",
        "Dr Anne DUBOIS-VERDIER",
        "Dr Nicoletta AMBROSIANI",
        "Dr Tayeb BENKIRAN",
      ],
      interventions: [
        "Duodénopancréatectomie céphalique",
        "Œsophagectomie Lewis-Santy",
        "Appendicectomie",
        "Hernie inguinale",
        "Hernie ombilicale",
        "Hémorroïdectomie",
        "Colectomie",
        "Coelioscopie exploratrice",
        "Cholécystectomie",
        "Promontofixation",
        "Mastectomie partielle",
        "Mastectomie totale",
        "Injection Bulkamide",
        "Annexectomie",
        "Hystérectomie",
        "CHIP",
        "Kystectomie ovarienne",
        "Segmentectomie hépatique",
"Amputation abdomino-périnéale",
"Sigmoïdectomie",
"Résection grêlique",
"Rétablissement de continuité",
"Cure d’éventration",
"Cure de hernie hiatale",
"Sleeve gastrectomie",
"Bypass gastrique",
"Splénectomie",
"Surrénalectomie",
"Thyroïdectomie totale",
"Parathyroïdectomie",
        "Autre..."
      ]
    },

    "Thoracique": {
      chirurgiens: [
        "Dr Tayeb BENKIRAN",
        "Pr Jean-Philippe BERTHET"
      ],
      interventions: [
        "Lobectomie pulmonaire",
        "Segmentectomie",
        "Talcage pleural",
        "Médiastinoscopie",
        "Autre..."
      ]
    },

    "Endoscopie digestive": {
      chirurgiens: [
        "Dr Alexandre CHARACHON",
        "Dr Luc DIEZ",
        "Dr Juliette LAVAYSSIERE",
        "Dr Daniela AGREFILO",
        "Dr Jean-François DEMARQUAY"
      ],
      interventions: [
        "Gastroscopie","Coloscopie","Echo-endoscopie haute","RSF","ERCP",
        "Pose de prothèse biliaire","Dissection sous-muqueuse","Mucosectomie",
        "POEM","Autre..."
      ]
    },

    "Cardiologie interventionnelle": {
      chirurgiens: ["Dr Gabriel LATCU","Dr Denis GATY"],
      interventions: ["Ablation de FA","Ablation de flutter","Autre..."]
    },

    "Radiologie interventionnelle": {
      chirurgiens: [
        "Pr Giuseppe GUZZARDI",
        "Dr Federico TORRE",
        "Dr Mathieu LIBERATORE"
      ],
      interventions: ["Vertébroplastie","Embolisation","Autre..."]
    },

    "Gynécologie / Obstétrique": {
      chirurgiens: [
        "Pr Bruno CARBONNE","Dr Jacques RAIGA","Dr Bernard BENOIT",
        "Dr Guillaume DOUCEDE","Dr Reda DJAFER","Dr Julia AUMIPHIN",
        "Dr Adrien GAUDINEAU","Dr Wafaa EL AHMADI-LAACHOURI",
        "Pr Guillaume BENOIST"
      ],
      interventions: [
        "Césarienne","Hystérectomie","Annexectomie",
        "Conisation","Nymphoplastie de réduction",
        "Curetage","Cerclage","Autre..."
      ]
    },

    "Urologie": {
      chirurgiens: [
        "Dr Xavier CARPENTIER","Dr Raffaele CURSIO",
        "Dr Maher KECHAOU","Dr Patrick-Julien TREACY"
      ],
      interventions: [
        "Prostatectomie totale","Biopsies de prostate",
        "REP HOLEP","REV","URS + Laser","Montée de JJ",
        "Néphrectomie","Posthectomie","UPR",
        "Cystectomie totale",
        "Autre..."
      ]
    },

    "ORL": {
      chirurgiens: [
        "Dr Diane LAZARD","Dr Riadh BERGUIGA",
        "Dr Sandrine CANIVET","Dr Albert VAN HOVE"
      ],
      interventions: [
        "Septoplastie","Rhinoplastie","Thyroïdectomie totale",
        "Thyroïdectomie partielle","Parathyroïdectomie",
        "Extraction DDS","Carcinome cutané","Cholestéatome",
        "Adénoidectomie","DTT","Turbinoplastie","Ethmoïdectomie",
        "Adénoamygdalectomie","Autre..."
      ]
    },

    "Vasculaire": {
      chirurgiens: ["Dr Gianvittorio TOMMASI"],
      interventions: ["Varices","Autre..."]
    },
    
"Psychiatrie": {
   chirurgiens: [
    "Dr Corentin ANELLI",
    "Dr Mariasole ARTIOLI NGUYEN",
    "Dr Eva BERARD",
    "Dr Nathalie BEAU",
    "Dr Eva-Maria BEETZ LOBONO",
    "Dr Anamaria BOGDAN",
    "Dr Iréna CUSSAC",
    "Dr Michela GIUGIARIO GORLA",
    "Dr Khaled KAMMOUN",
    "Dr Paula MARTINEZ NUNEZ-CACHO",
    "Dr Ségolène MOULIERAC",
    "Dr Céline PLASSERAUD",
    "Dr Alessandro SCURICINI",
    "Dr Etienne SEIGNEUR",
    "Dr Sofia STOIAN",
    "Dr David SZEKELY"
  ],
    interventions: ["Electroconvulsivothérapie"]
  },
  
    "Ophtalmologie": {
      chirurgiens: [
        "Dr Frédéric BETIS","Dr Florence GASTAUD-NEGRE",
        "Dr Emilie MATAMOROS","Dr Alissa BARRADE-CARZOLI",
        "Dr Philippe BERROS","Dr Liliane LASSERRE",
        "Dr Valérie ELMALEH","Dr Cécilia LEAL",
        "Dr Thierry FERRETE"
      ],
      interventions: ["Cataracte","Blépharoplastie","Autre..."]
    }
  }
};

const GESTE_GENRE = {
  feminin: [
    "PTH",
    "PTG",
    "Ostéosynthèse cheville",
    "Ostéosynthèse poignet",
    "Hernie inguinale",
    "Colectomie",
    "Annexectomie",
    "Kystectomie ovarienne",
    "Cataracte",
    "Néphrectomie",
    "Prothèse d'épaule",
    "Arthroscopie de genou",
    "Arthroscopie d'épaule",
    "Mastectomie partielle",
    "Mastectomie totale",
    "Arthroscopie cheville",
    "Ostéosynthèse plateau tibial",
    "Blépharoplastie",
    "Surrénalectomie",
    "Thyroïdectomie totale",
    "Thyroïdectomie partielle",
    "Parathyroïdectomie"
  ],
  pluriel: [
    "Varices"
  ]
};
