# Guide opérationnel — Comité Planning CHPG Monaco

**À l'attention du comité de planification — DR CATINEAU et collègues**
**Dernière mise à jour : juin 2026**

---

## Accès

| Interface | URL | Code |
|---|---|---|
| Dashboard comité | https://chpg-anesthesie.github.io/Planning-CHPG/dashboard.html | Code admin |
| Administration | https://chpg-anesthesie.github.io/Planning-CHPG/admin.html | Code admin |
| Configuration | https://chpg-anesthesie.github.io/Planning-CHPG/config.html | Code admin |
| Planning public | https://chpg-anesthesie.github.io/Planning-CHPG/ | Public |
| Indispos MARs | https://chpg-anesthesie.github.io/Planning-CHPG/indispos.html | Code individuel |

> Le code admin est confidentiel. Ne pas le communiquer aux MARs.

---

## Le dashboard — point d'entrée

Le dashboard affiche l'**état du cycle en cours** et oriente vers l'action à faire.

La bannière en haut indique ce qu'il faut faire maintenant :

| Bannière | Signification | Action |
|---|---|---|
| 🗓️ **WIZARD 1** | INDISPOS_2027 pas encore créé | Cliquer → lance le wizard Étape 1 |
| ⏳ **EN ATTENTE** | Des MARs n'ont pas saisi | Relancer les MARs concernés |
| ⚡ **WIZARD 2** | Tout le monde a saisi | Cliquer → lance le wizard Étape 2 |
| 📦 **WIZARD 3** | Gardes générées, à clôturer | Cliquer → lance le wizard Étape 3 |
| ✅ **EN COURS** | Cycle complet | Rien à faire |

---

## Actions quotidiennes

Depuis **admin.html → onglet Accueil** :

### 🔄 Changer de secteur
Un MAR doit être sur un secteur différent un jour précis (sans toucher au GSheet).

1. Cliquer **Changer de secteur**
2. Choisir la date, le MAR, le secteur AM et PM
3. Cliquer **Appliquer** → le planning se met à jour automatiquement

### 🔁 Modifier une garde
Échange entre deux MARs, transfert ou garde exceptionnelle.

1. Cliquer **Modifier une garde**
2. Choisir le type : Échange / Don de garde / Garde exceptionnelle
3. Remplir les champs et valider → republication automatique

### 📊 Exporter le planning
Export Excel de la semaine affichée — à envoyer à l'équipe chaque lundi.

1. Naviguer à la semaine souhaitée (flèches ← →)
2. Cliquer **↓ Excel**

---

## Opérations annuelles — les 3 wizards

Les 3 wizards se font **dans l'ordre**, une fois par an.

### Étape 1 — Démarrer 2027 (octobre 2026)

**Quand :** dès octobre, avant que les MARs saisissent leurs indispos.

1. Aller sur `admin.html` → Accueil → cliquer **Démarrer 2027**
2. **Étape 1 — Équipe** : vérifier la liste des MARs actifs. Si modification nécessaire → ouvrir Config dans un autre onglet.
3. **Étape 2 — Vacances** : vérifier/modifier les périodes vacances Zone B pour 2027.
4. **Étape 3 — Groupes** : vérifier la rotation A/B/C.
5. **Étape 4 — Lancer** : cliquer le bouton. Le wizard crée `INDISPOS_2027`, `AFFECTATIONS_2027` et envoie les codes aux MARs par email.

> ✅ Après cette étape, les MARs reçoivent leur code et peuvent saisir leurs indispos.

### Étape 2 — Générer les gardes (septembre 2026)

**Quand :** une fois que **tous** les MARs ont saisi leurs indispos. Le wizard est bloquant si des indispos manquent.

1. Aller sur `admin.html` → Accueil → cliquer **Générer les gardes**
2. **Étape 1 — Indispos** : liste verte si tout le monde a saisi. Rouge = bloquant.
3. **Étape 2 — Vacances** : vérifier que les périodes sont bien configurées.
4. **Étape 3 — Lancer** : génération (30-60 secondes) puis publication automatique.

> ✅ Après cette étape, `planning_2027.json` est publié sur GitHub Pages.

### Étape 3 — Clôturer 2026 (décembre 2026)

**Quand :** en fin d'année, après la dernière garde de 2026.

1. Aller sur `admin.html` → Accueil → cliquer **Clôturer l'année**
2. **Étape 1 — Vérification** : contrôle que toutes les semaines ont bien des gardes.
3. **Étape 2 — Équité** : récap final gardes réelles vs cibles par MAR.
4. **Étape 3 — Archiver** : push `stats_2026.json` et `indispos_2026.json` sur GitHub.

> ✅ Après cette étape, l'année 2026 est archivée.

---

## Gestion de l'équipe

Depuis **config.html → onglet Équipe** :

### Modifier un MAR existant
- Cliquer ✏️ sur la ligne du MAR
- Modifier les champs (nom, quotité, email, DECT...)
- Enregistrer

### Activer / Désactiver un MAR
- Cliquer ⏸ pour désactiver, ▶ pour réactiver

### Arrivée d'un nouveau MAR

Depuis **config.html → Maintenance → Accueillir un MAR** :

1. **Étape 1 — Identité** : nom, initiales, quotité, email, code d'accès
2. **Étape 2 — Affectations** : secteur par mois
3. **Étape 3 — Groupe vacances** : A, B ou C
4. **Étape 4 — Lancer** : création automatique + envoi code par email

### Départ d'un MAR

Depuis **config.html → Maintenance → Départ d'un MAR** :

1. **Étape 1** : sélectionner le MAR
2. **Étape 2** : vérification des gardes restantes (à redistribuer manuellement si nécessaire)
3. **Étape 3** : confirmation
4. **Étape 4** : désactivation + republication

---

## Gestion des vacances

Depuis **admin.html → onglet Vacances** :

- Visualiser les demandes de vacances par MAR et par période
- Vérifier les conflits (seuil de présence)
- Les seuils sont configurables dans **config.html → Vacances**

---

## Diagnostic système

Depuis **admin.html → onglet Diagnostic** :

Cliquer **Lancer le diagnostic** pour vérifier :
- Présence de tous les onglets GSheet requis
- Cohérence CONFIG
- MARs sans email / sans code
- MARs sans affectation
- Doublons dans OVERRIDES
- État des gardes et stats

---

## Widget "État du cycle"

En bas à droite de l'onglet Accueil, le widget affiche en temps réel :

```
○ INDISPOS_2027 initialisé    → [bouton wizard]
○ Indispos 2027               X MAR(s) en attente
○ Gardes 2027 générées        À faire — Wizard Étape 2
○ Clôture 2026                À faire en fin d'année
```

Les boutons → ouvrent directement le bon wizard.

---

## Configuration avancée

Depuis **config.html** :

| Onglet | Contenu |
|---|---|
| **Équipe** | Liste MARs, activation, quotités, emails, DECT |
| **Vacances** | Périodes Zone B, seuils de présence, groupes A/B/C |
| **Paramètres** | Code admin, token GitHub, config générale |
| **Maintenance** | Diagnostic, publication manuelle, wizards Départ/Accueil, logs |

---

## En cas de problème

**Le planning ne se met pas à jour :**
Aller dans config.html → Maintenance → cliquer **Publier maintenant**

**Une modification n'apparaît pas :**
Les modifications via les panels (Changer secteur, Modifier garde) sont enregistrées dans l'onglet OVERRIDES du GSheet et republiées automatiquement. Si le problème persiste, republier manuellement.

**Erreur lors d'un wizard :**
Un bouton "Réessayer" apparaît. Si l'erreur persiste, contacter DR FROHLICH.

**Diagnostic à lancer en priorité :**
admin.html → Diagnostic → Lancer le diagnostic complet

---

## Contact technique

DR FROHLICH (AFR) — responsable technique du projet
