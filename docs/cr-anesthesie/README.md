# CR d'anesthésie — CHPG Monaco

Générateur de comptes-rendus d'anesthésie du service, intégré au portail **Planning-CHPG**.

Outil **100 % frontend statique** (aucun backend, aucun stockage) : la saisie se fait par
« chips » cliquables, le CR se génère en direct dans le volet de droite, et le bouton
**Copier le CR** met le texte prêt à coller dans le DPI dans le presse-papier.

**Aucune donnée patient** n'est manipulée ni enregistrée : seuls figurent la date, les
intervenants et la technique d'anesthésie.

## Fichiers
- `index.html` — structure de l'interface (3 volets : intervention · déroulé · CR généré).
- `style.css` — mise en forme.
- `data.js` — données de référence (praticiens, spécialités, interventions, médicaments).
- `rules.js` — règles métier (ALR par geste, antibioprophylaxie, presets).
- `ui.js` — rendu des chips et des sous-champs.
- `report.js` — génération du texte du CR + version DPI (sans titres de section).
- `app.js` — état, écouteurs, logique d'affichage.

## Accès
Depuis le Dashboard du portail, tuile **« CR d'anesthésie »**.
