# Planning-CHPG — carte du dépôt

Système web de gestion pour le service d'anesthésie-réanimation du **CHPG (Monaco)** : planning des gardes (équité annuelle), planning quotidien, consultations, contrôle d'absence, portail/Dashboard, veille bibliographique, comptes rendus, et le **module libéral (en service)**. ~23 MARs.

**Le dépôt (branche `main`) est la seule source de vérité.** Tout — code, pages, documents de travail et de conception — vit ici et se lit/s'édite directement.

---

## Où vit quoi

### Racine — l'application (servie par GitHub Pages, ne pas déplacer)
| Fichier | Rôle |
|---|---|
| `dashboard.html` | **Portail** personnel du MAR — le seul carrefour : toutes les autres pages s'ouvrent depuis ses tuiles |
| `admin.html` | Interface **comité** (PC) : planning, équipe, affectations, équité, statuts, maintenance |
| `index.html` | **Planning** de l'équipe (vue MAR) |
| `indispos.html` | Saisie des **indisponibilités** et souhaits de garde |
| `absences.html` | **Consultations à venir** — contrôle d'absence (deux portes : tuile MAR et session secrétariat) |
| `staff.html` | **Staff Vacances** : pose des vacances et formations en réunion (groupes A/B/C) |
| `suivi-liberal.html` | **Suivi des 30 %** — position de chacun par axe, à partir du relevé mensuel |
| `crh.html` | Générateur de **comptes rendus de réanimation** (accès nominatif restreint) |
| `sw.js`, `manifest.webmanifest`, `assets/` | PWA (service worker, icônes) |

### docs/ — documentation & documents de travail
| Fichier | Rôle |
|---|---|
| `CONTEXTE-Planning-CHPG.md` | Contexte, architecture, conventions — **à lire en premier** |
| `ROADMAP-Planning-CHPG.md` | Fait / à faire / écarté — la mémoire du projet |
| `guide-technique.html` | **La référence interne** : architecture, wizards, déploiement, sécurité, dépannage |
| `guide-fichier-maitre.html` | Les 25 onglets du classeur, colonne par colonne |
| `guide-comite.html` | Aide du comité (page `admin.html`) |
| `guide-mar.html` | Guide du MAR : portail, planning, indispos, consultations |
| `guide-algo-gardes.html` | L'algorithme de gardes expliqué à l'équipe |
| `guide-liberal.html` | Mode d'emploi de l'**outil** du module libéral |
| `reprise.md` | **Continuité** : accès, propriété, sauvegardes — à lire si Arthur n'est plus joignable |
| `sauvegarde-compte-perso.md` | Installation de la sauvegarde hors-compte (dimanche 5 h) |
| `VEILLE_CFG-mode-emploi.md` | Pilotage de la veille biblio (onglet `VEILLE_CFG`) |
| `presentation-staff.html` | Deck de présentation du système au service |
| `Presentation-gardes-staff.html` | Deck consacré à l'algorithme de gardes |
| `staff_gardes_demographie.html` | Simulation démographique de la charge de gardes (2026-2050) |
| `maquette-export-excel-secteurs.xlsx` | Maquette de l'export Excel par grand secteur (NCHPG) |
| `module-liberal/` | Le **module libéral** (voir ci-dessous) |

#### docs/module-liberal/
| Fichier | Rôle |
|---|---|
| `maquette_estimateur_liberal.html` | ⚠️ **Outil de production** malgré son nom : cotation, devis, déclaration d'intervention. C'est la cible de la tuile Libéral du Dashboard. |
| `guide_liberal_MAR.html` | Guide **métier** : comment fonctionne l'activité libérale (cartes, dépassements, règle des 30 %) |
| `module_liberal_conception.md` | Document de conception (règle des 30 % par axe, lots) |
| `antiseche_CCAM_anesthesie_CHPG.md` | Antisèche de cotation CCAM anesthésie & réanimation (Monaco) |
| `ccam_actes.json` | Index CCAM (v84) : libellés officiels et tarifs d'anesthésie, activité 4 |
| `maquette_controle_absence.html`, `maquette_ecran_secretaire.html` | Maquettes de travail |
| `tests/` | Tests JS du module |

### gas/ — backend Google Apps Script
`code.gs`, `generateur_gardes.gs`, `Indispos.gs`, `setup_annee.gs`, `portail.gs`.
**Le dépôt fait foi à 100 %** : toute modif d'un `.gs` doit exister ici, puis être recopiée dans l'éditeur Apps Script **et redéployée** (sinon perdue à la prochaine recopie, ou sans effet).
⚠️ `portail.gs` porte le portail, **tout le module libéral**, la veille et la configuration des secteurs. `Indispos.gs` porte le routeur d'API, le contrôle d'absence et le verrou d'écriture.

### simulateur/ — banc d'essai de l'algorithme de gardes
Scripts Node (scénarios, harness, analyses) + expériences. Campagne de référence : **400 années simulées** (20 scénarios × 20 ans).

### cr-anesthesie/ — second générateur de comptes rendus (anesthésie)

---

## Architecture (rappel)
Google Sheets (données) → fichiers GAS (`/exec`) → sortie web. Les JSON publiés (`planning_{Y}.json`, `affectations_{Y}.json`) sont servis depuis un dossier Google Drive privé « Planning-CHPG-JSON », **jamais** depuis GitHub Pages : aucune donnée de planning ne touche le dépôt public.
