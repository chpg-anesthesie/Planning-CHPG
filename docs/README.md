# Planning-CHPG — carte du dépôt

Système web de gestion pour le service d'anesthésie-réanimation du **CHPG (Monaco)** : planning des gardes (équité annuelle), planning quotidien, consultations, portail/Dashboard, veille bibliographique, et le module libéral (en conception). ~23 MARs.

**Le dépôt (branche `main`) est la seule source de vérité.** Tout — code, pages, documents de travail et de conception — vit ici et se lit/s'édite directement.

---

## Où vit quoi

### Racine — l'application (servie par GitHub Pages, ne pas déplacer)
| Fichier | Rôle |
|---|---|
| `admin.html` | Interface **comité** (PC) : planning, équipe, affectations, équité, statuts, maintenance |
| `index.html` | **Planning** / portail MAR |
| `dashboard.html` | **Portail** personnalisé du médecin (« Mes gardes », « Mes congés », veille…) |
| `indispos.html` | Saisie des **indisponibilités** (+ à venir : activité libérale) |
| `staff.html` | **Staff Vacances** : saisie des vacances (groupes A/B/C) |
| `sw.js`, `manifest.webmanifest`, `assets/` | PWA (service worker, icônes) |

### docs/ — documentation & documents de travail
| Fichier | Rôle |
|---|---|
| `CONTEXTE-Planning-CHPG.md` | Contexte, architecture, conventions — **à lire en premier** |
| `ROADMAP-Planning-CHPG.md` | Fait / à faire / écarté |
| `VEILLE_CFG-mode-emploi.md` | Pilotage de la veille biblio (onglet `VEILLE_CFG`) |
| `guide-comite.html` | Aide du comité (page `admin.html`) |
| `staff_gardes_demographie.html` | Simulation démographique de la charge de gardes (2026-2050) |
| `module-liberal/` | Le chantier **module libéral** (voir ci-dessous) |

#### docs/module-liberal/
| Fichier | Rôle |
|---|---|
| `module_liberal_conception.md` | Document de conception (règle des 30 % par axe, 3 couches, lots) |
| `antiseche_CCAM_anesthesie_CHPG.md` | Antisèche de cotation CCAM anesthésie & réanimation (Monaco) |
| `maquette_V1_pilotage_liberal.html` | Maquette de l'écran V1 (compteur de marge sur données réelles) |

### gas/ — backend Google Apps Script
`code.gs`, `generateur_gardes.gs`, `Indispos.gs`, `setup_annee.gs`, `portail.gs`.
**Le dépôt fait foi à 100 %** : toute modif d'un `.gs` doit exister ici, puis être recopiée dans l'éditeur Apps Script (sinon perdue à la prochaine recopie).

### simulateur/ — banc d'essai de l'algorithme de gardes
Scripts Node (scénarios, harness, analyses) + expériences.

---

## Architecture (rappel)
Google Sheets (données) → fichiers GAS (`/exec`) → sortie web. Les JSON publiés (`planning_{Y}.json`, `affectations_{Y}.json`) sont servis depuis un dossier Google Drive « Planning-CHPG-JSON », plus sur GitHub Pages.
