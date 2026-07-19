# Tests de déploiement — session du 19/07/2026

Correctifs livrés : **RH-1**, **RH-2**, **RH-3**, **RH-C**.

## Avant de tester

1. Recopier dans l'éditeur Apps Script, depuis le dépôt :
   - `gas/Indispos.gs` → version **2026-07-19.3** (contient RH-1 + RH-2 + RH-C)
   - `gas/generateur_gardes.gs` → version **2026-07-19.1** (RH-3)
2. Déployer → Gérer les déploiements → Modifier → **Nouvelle version**.
3. `Ctrl+Maj+R` sur `admin.html`.

---

## 0 · Sanité (2 min)

- [ ] admin.html → Maintenance → 🔍 **Diagnostic** : versions GAS concordantes, tout vert
- [ ] Dashboard (compte MAR) : le bandeau « Mes gardes » s'affiche normalement

---

## 1 · RH-C — Verrou d'écriture

*Invisible quand tout va bien : on vérifie surtout qu'il ne casse rien.*

- [ ] Poser puis retirer une indispo (page Indisponibilités) → OK, sans lenteur notable
- [ ] Poser un statut `V` sur un jour vide (onglet Statuts) puis l'effacer → OK
- [ ] Publier le planning → OK

> Message possible si deux écritures se percutent :
> « Une autre opération d'écriture est en cours — réessayez dans quelques
> secondes. » C'est le comportement voulu (avant, les données pouvaient se
> corrompre silencieusement).

---

## 2 · RH-1 — Lignes annuelles d'un MAR créées automatiquement

**Test rapide (idempotence)**
- [ ] Éditer un MAR existant, enregistrer **sans rien changer**
      → toast « ✅ MAR mis à jour »
      → **pas** de toast « Lignes ajoutées » (normal : tout existe déjà)

**Test complet (optionnel)**
- [ ] Créer un MAR bidon `TEST_RH1`
      → toast « 📋 Lignes ajoutées : INDISPOS_…, GARDES_…, AFFECTATIONS_… »
- [ ] Vérifier dans le classeur : sa ligne apparaît en bas des 3 onglets
- [ ] Lui poser une **garde exceptionnelle** sur un jour vide
      → doit passer, sans erreur « Médecin introuvable »
- [ ] Nettoyage : retirer la garde de test, désactiver `TEST_RH1`

---

## 3 · RH-2 — Annuler / raccourcir une absence longue

- [ ] Équipe → 🏖️ **Absence longue** : la liste « Absences enregistrées » s'affiche
- [ ] Poser une absence **TEST** de 4–5 jours sur des jours **sans garde**
- [ ] Vérifier les `CL` posés (onglet Statuts ou le classeur)
- [ ] **Raccourcir** de 2 jours → les `CL` de la fin disparaissent,
      la ligne du registre est mise à jour
- [ ] **Annuler** → tous les `CL` restants disparaissent,
      la ligne quitte le registre
- [ ] Contre-test sécurité : les jours autour (statuts, gardes voisines)
      n'ont **pas** bougé

---

## 4 · RH-3 — Dette d'équité (vérification passive)

- [ ] Ouvrir `STATS_GARDES_2027` : les colonnes `CIBLE SAM`, `CIBLE JEU`,
      `CIBLE VD`, `CIBLE VJF` sont présentes
      *(`CIBLE JF` n'apparaîtra qu'à la prochaine génération — normal)*

> Rien d'autre à tester : la nouvelle formule ne s'exécutera qu'à la
> génération de 2028.

---

## En cas de problème

Noter **l'action exacte** et **le message d'erreur**, puis les transmettre.
Retour arrière possible commit par commit, sans toucher aux données.

---

## Rappel — ce que corrigent ces 4 patchs

| Code | Problème corrigé |
|---|---|
| **RH-1** | Un MAR créé/réactivé en cours d'année n'avait pas de ligne dans les tableaux annuels → indispos impossibles, dons/échanges en erreur, affectations ignorées (parfois **silencieusement**). |
| **RH-2** | Aucun moyen d'annuler ou raccourcir une absence longue ; le registre la rejouait sur les années futures même après annulation. |
| **RH-3** | Le rattrapage d'équité comparait à une part « plein temps » → un MAR légitimement absent (maternité, arrivée tardive) se voyait attribuer des gardes **en plus** à son retour. |
| **RH-C** | Deux écritures simultanées pouvaient s'écraser (ligne d'indispos), dupliquer une garde donnée, ou supprimer la mauvaise absence. |
