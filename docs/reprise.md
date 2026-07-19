# Reprise du système Planning-CHPG

*Document de **continuité** — à lire en premier si Arthur n'est plus joignable.*
*Mis à jour : 19 juillet 2026.*

> Ce document traite des **accès, de la propriété et des sauvegardes**.
> Pour le fonctionnement technique (architecture, wizards, déploiement,
> dépannage), voir **`docs/guide-technique.html`**, beaucoup plus détaillé.

---

## 1. Ce que c'est

Portail web du service d'anesthésie du CHPG (~23 MARs) : gardes à l'année
(algorithme d'équité), planning quotidien, consultations, portail personnel,
veille bibliographique. **Aucune donnée patient.**

Le système a été conçu et maintenu par **Arthur, seul**, sans bagage de
développement, en dialoguant avec une IA (Claude). C'est reproductible :
voir §5.

---

## 2. Qui possède quoi — le point critique

| Ressource | Où | Titulaire aujourd'hui |
|---|---|---|
| **Données** (classeur Google Sheets) | Google Drive | Compte Google d'Arthur |
| **Code serveur** (Apps Script + Web App déployée) | script.google.com, attaché au classeur | Compte Google d'Arthur |
| JSON publiés | Dossier Drive « Planning-CHPG-JSON » | Compte Google d'Arthur |
| Archives annuelles | Classeur Google séparé | Compte Google d'Arthur |
| **Code source** (100 % du système) | github.com/chpg-anesthesie/Planning-CHPG | Organisation GitHub `chpg-anesthesie` |
| Pages web | GitHub Pages, branche `main` | idem |
| Code admin de l'interface | Onglet `CONFIG` du classeur, ligne `ADMIN_CODE` | — |

**Le risque principal** : tout ce qui est Google dépend d'**un seul compte**.
Si ce compte devient inaccessible, le système continue de tourner, mais plus
personne ne peut le modifier ni le réparer.

**Mesures de continuité à prendre (10 minutes, à faire tant que c'est possible) :**

1. Ajouter un **second owner** à l'organisation GitHub `chpg-anesthesie`.
2. Partager le classeur Sheets **et** le projet Apps Script avec un second
   compte de confiance (droits d'édition).
3. S'assurer qu'au moins une autre personne du comité connaît le **code admin**
   et sait où le retrouver (onglet `CONFIG`).

> ⚠️ Transférer complètement la propriété du projet Apps Script implique de
> **redéployer la Web App**, ce qui **change son URL** — toutes les pages
> devraient alors être mises à jour. À planifier, jamais dans l'urgence.

---

## 3. Sauvegarde des données

Le **code** est sauvegardé automatiquement par GitHub (tout l'historique).
Les **données**, elles, ne le sont par personne : c'est manuel.

**Rythme : tous les 3 mois** — 1er octobre, janvier, avril, juillet.
Calé volontairement juste avant les temps forts (init d'octobre, clôture de
janvier), quand une perte coûterait le plus cher. Un rappel récurrent est
posé dans l'agenda d'Arthur.

**Quoi sauvegarder :**

1. **Le classeur principal Google Sheets** — l'essentiel.
   `Fichier → Créer une copie` → nommer `SAUVEGARDE Planning-CHPG AAAA-MM`.
   Il contient : `MEDECINS`, `GARDES_*`, `INDISPOS_*`, `AFFECTATIONS_*`,
   `STATS_GARDES_*`, `HISTORIQUE`, `NOEL_AN_HISTORIQUE`, `PERIODES_VAC`,
   `GROUPES_VAC`, `CONFIG`, `PLANNING_OVERRIDES`, `ABSENCES_LONGUES`.
2. **Le classeur d'archives** (années clôturées) — même méthode.
3. *Facultatif* : le dossier Drive « Planning-CHPG-JSON ». Ces fichiers se
   régénèrent avec le bouton **Publier** → non critiques.

**À ne pas sauvegarder** : le code (`.gs`, `.html`) — déjà sur GitHub.

Ranger les copies dans un dossier Drive dédié « Sauvegardes Planning-CHPG ».

> **Limite assumée** : ces copies vivent dans le Drive personnel d'Arthur.
> Elles protègent de l'erreur de manipulation, **pas** de la perte du compte.
> Pour une vraie protection, il faudrait qu'un collègue fasse **sa propre**
> copie depuis **son** compte (un fichier simplement partagé reste possédé par
> le compte d'origine), ou utiliser un Drive partagé de l'établissement.

---

## 4. Les 3 règles d'or

1. **Le dépôt GitHub fait foi.** Tout le code y est, y compris l'Apps Script.
   Ne jamais modifier un `.gs` directement dans l'éditeur Apps Script sans le
   reporter dans le dépôt : la modification serait écrasée à la prochaine
   recopie.
2. **Une modification GAS ne prend effet qu'après recopie + nouvelle version
   de déploiement.** Sans nouvelle version, l'ancien code continue de tourner.
3. **Ne jamais régénérer une année déjà générée** (onglet `GARDES_AAAA`
   existant) : le planning et sa preuve d'équité seraient détruits. Un
   garde-fou le bloque — ne pas le contourner.

---

## 5. Reprendre la main — le premier jour

1. Obtenir l'accès au compte Google titulaire ; vérifier l'ouverture du
   classeur **et** de l'éditeur Apps Script.
2. Se faire ajouter à l'organisation GitHub `chpg-anesthesie`.
3. Ouvrir `admin.html` avec le code admin → onglet **Maintenance** →
   🔍 **Diagnostic système**. Il audite le classeur, GitHub, les JSON du Drive
   et la concordance des versions de code. Tout doit être vert.
4. Lire `docs/guide-technique.html` (la référence), puis
   `docs/guide-comite.html` (usage comité) et `docs/guide-mar.html` (usage MAR).

**Faire évoluer le système sans être développeur** — la méthode qui a
fonctionné : créer un projet sur claude.ai, y joindre
`CONTEXTE-Planning-CHPG.md` et `ROADMAP-Planning-CHPG.md`, fournir un token
GitHub en début de session (à révoquer ensuite), et exiger systématiquement :
vérification de l'état réel du dépôt avant toute modification, patch expliqué
AVANT/APRÈS, et **validation explicite avant chaque mise en ligne**.

---

## 6. Calendrier annuel

| Quand | Quoi |
|---|---|
| **Octobre** | Wizard 1 — initialisation de l'année suivante (staff vacances) |
| **Novembre** | Wizard 2 — génération des gardes |
| **Janvier** | Wizard 3 — clôture et archivage de l'année écoulée |
| **Lundi 6h** | Scan automatique de la veille biblio (aucune action requise) |
| **1er oct / jan / avr / juil** | Sauvegarde des données (§3) |

---

## 7. À ne surtout pas faire

- Supprimer ou renommer un onglet du classeur (tout le code s'y réfère).
- Modifier du code GAS en production sans le committer dans le dépôt.
- Régénérer une année de gardes déjà générée.
- Communiquer le code admin en dehors du comité.
- Laisser traîner un token GitHub dans un fichier ou un message.
