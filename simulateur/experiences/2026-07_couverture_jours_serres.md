# Couverture des jours serrés — travail en cours (22/07/2026)

**Objectif d'Arthur : il ne doit JAMAIS y avoir de jour sans binôme.**
Sans réduire le nombre de MAR en vacances, sans autoriser deux gardes d'affilée
(illégal), sans dégrader l'équité, et en une seule livraison — pas de push
successifs sur l'algo de gardes, c'est ainsi qu'on introduit des erreurs.

⚠️ **Rien n'est en production.** `gas/generateur_gardes.gs` est INCHANGÉ.
Le générateur modifié est ici en `.gs.txt` pour qu'il ne parte jamais par erreur.

---

## Le problème

Le placement chronologique est glouton : chaque jour il choisit le meilleur binôme
selon l'équité, et épuise ainsi le vivier du lendemain. Sur les périodes très
tendues — essentiellement **la semaine de Noël** — il ne reste plus personne.

La feuille réelle 2026 le confirme : le **27/12/2026, 17 MAR sur 20 étaient
indisponibles**, soit 3 personnes restantes. Le comité s'en est sorti en faisant
**alterner deux binômes** : FX + NS les 24 et 26, WS + CA les 25 et 27. C'est
exactement ce que l'algorithme ne sait pas faire seul.

Contrainte mathématique à connaître : pour couvrir N jours consécutifs avec des
binômes de 2 sans gardes consécutives, il faut **au moins 4 personnes disponibles**.
Avec 3, on ne couvre qu'un jour sur deux.

---

## Les trois mécanismes (dans `generateur_couverture_v1.gs.txt`)

Tous **strictement additifs** : ils ne s'exécutent que là où le code actuel échoue.

### 1. Passe « jours critiques » (nouvelle section 7ter)
Placée **après** la rotation de Noël (7bis), **avant** les souhaits (8a).
- repère les jours dont le vivier est ≤ `SEUIL_CRIT` (=4)
- les regroupe en séries consécutives (mesuré : 1 à 3 jours, ~1,4 par an)
- résout chaque série par **recherche exhaustive** (backtracking)
- ordre de préférence : **les MAR les moins souvent disponibles dans l'année
  d'abord** — c'est ce réglage qui a rendu l'équité meilleure que la référence
- périmètre : jours SIMPLES uniquement (ni vendredi, ni dimanche, ni férié couplé),
  pour ne pas interférer avec les unités VD et les couplages fériés
- dernier recours : tolère le combo **jeudi↔samedi** (G-RG-G, 2 gardes en 3 jours
  glissants — explicitement autorisé par Arthur). Utilisé **1 seule fois en 20 ans**.

### 2. Anticipation d'un jour (dans le placement chronologique)
Avant de retenir le meilleur binôme, vérifier qu'il resterait ≥ 2 personnes
disponibles **demain**. Sinon, descendre dans le classement d'équité.
Strictement conditionnel : en temps normal, RIEN ne change.
C'est ce qui manquait au 24/12/2038, où le placement du 23 consommait les deux
seules personnes capables de tenir le 24.

### 3. Repli VD sur la rotation de Noël (7bis)
La rotation exigeait qu'un binôme tienne l'**unité complète** (vendredi↔dimanche,
ou couplage férié) et abandonnait sinon — laissant la date de Noël non pourvue.
Elle place désormais la date **seule** en repli, exactement comme la
« VD exception » déjà présente dans le placement chronologique.

### Modification annexe
`blocked(id, date, _relaxJS)` : 3ᵉ paramètre optionnel qui tolère le combo
jeudi↔samedi. **Aucun autre appelant ne le passe** → comportement par défaut
strictement inchangé.

---

## Résultats mesurés (20 ans, modèle calé sur la feuille réelle 2026)

| Tirage | Écart max | Jours sans binôme |
|---|---|---|
| référence actuelle | 2,30 | **3** |
| 0 | 2,50 | **0** |
| 1 | 1,80 | **1** |
| 2 | 1,90 | **0** |

Équité **meilleure que la référence** sur 2 tirages sur 3.

Tests déjà passés : batterie des 10 scénarios **invariants ✅ partout** ·
déterminisme confirmé (3 exécutions identiques) · **12 années sur 20 rigoureusement
identiques** à la version actuelle avant le premier déclenchement · coût en temps
**+0,5 %** (3 265 → 3 281 ms).

---

## CE QUI RESTE À FAIRE

### Le dernier cas : 25/12/2039, un DIMANCHE
`NOEL/AN 2039-12-25 : <2 dispo` puis `Manque MAR`. Vivier structurel : 4 personnes
(LEY, LEVASSEUR, COPELOVICI, REMPL_MENADE).

Même famille que le 24/12/2038 déjà corrigé, **mais sur l'autre moitié de l'unité
VD** : le repli du mécanisme 3 traite le vendredi, pas le dimanche. Vérifier
d'abord qu'une solution existe (force brute sur la fenêtre ±3 jours), puis étendre
le repli au dimanche.

### Puis, avant toute livraison
1. batterie `simulateur/scenarios.js` — invariants ✅ sur les 10
2. déterminisme : 3 exécutions identiques
3. **équivalence** avant/après sur 20 ans : compter les années identiques
4. performance : comparer les temps de génération
5. 4 à 6 tirages d'absences différents (varier le sel dans `demographie.js`)
6. patch AVANT/APRÈS présenté à Arthur, **attendre le OK**
7. push `gas/generateur_gardes.gs` + recopie Apps Script + nouveau déploiement

---

## Pièges rencontrés (ne pas les refaire)

- **Portée** : `shiftD` est déclaré en `const` DANS le bloc de la section 7bis —
  invisible depuis la passe 7ter. `node --check` ne le voit pas, seule l'exécution
  le révèle. Utiliser un helper local.
- **Colonnes MEDECINS** : le générateur lit `pct[id]=medData[r][5]` et
  `quot[id]=medData[r][4]`. Dans le classeur, la **2ᵉ colonne chiffrée est le
  pourcentage de GARDES**, la 1ʳᵉ la quotité de travail. Ne pas les inverser.
- **Le rythme 2/2 est géré NATIVEMENT** par `estSemaineOff()` (l. 35), ancré sur le
  lundi 01/06/2026, lu depuis la colonne `rythme_2sur2`. Chercher `r2s2` ne donne
  rien → j'en avais conclu à tort que le moteur l'ignorait, et j'ai posé des jours
  `TP` par-dessus : deux blocages de phases différentes, et en 2044 la personne
  était indisponible 365 jours sur 365 **sans aucun avertissement**.
- **L'espacement à 5 jours n'est PAS une règle dure** : c'est une pénalité de score
  (`spacingPenalty`). Le code dit lui-même « la couverture prime tout ».
  Les seuls blocages durs liés aux gardes : lendemain de garde (`rgSet`),
  récupération (`rSet`), garde le lendemain (`gSet`), combo jeudi-samedi.
- **Deux gardes d'affilée : INTERDIT, c'est illégal.** Ne jamais le proposer.
- **Plafonner les vacances de Noël : REFUSÉ** — ce serait une régression pour les MAR.
