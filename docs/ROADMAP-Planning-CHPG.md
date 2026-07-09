# Roadmap — Planning-CHPG

Système web : **planning des gardes** (équité annuelle) + **planning quotidien** + **consultations** + **portail**, pour ~23 MARs au CHPG (Monaco).
Dépôt : `chpg-anesthesie/Planning-CHPG`. *Mise à jour : 8 juillet 2026.*

---

## ✅ Fait

### Fondations & algorithme (mai–juin 2026)
- Architecture Google Sheets → 4 fichiers GAS → sortie web ; cycle annuel simulé et validé.
- Règles d'équité (VD > Samedi > Jeudi > Total), cibles proportionnelles à la quotité.
- Banc d'essai de l'algo ; correctifs équité/dette ; invariants confirmés ; génération ~10-15 s.
- Statuts spéciaux externalisés (colonnes MEDECINS), priorité vacances Monaco (groupes A/B/C, seuils).
- Consultations (comptage d'équité, refonte visuelle), rotation libérale endo (déficit-based, contrainte N+1).
- Nettoyage config-driven : getJoursFeries consolidé, MEDECINS_LIST supprimé, tokens unifiés, fériés grisés.
- Documents : guide admin, règles de génération (Word), simulation démographique (charge jusqu'en 2060).

### Session juillet 2026
- **Fix A** : rythme 2 sem./2 robuste aux années à 53 semaines.
- **Fenêtre de transparence dette** (frontend, dès 2028).
- **Historique Noël/An** : `getNoelHistory()` (HISTORIQUE ∪ GARDES présents) + archivage **au réel**.
- **Consolidation secteurs étape 1** : source unique `SECTEURS_CFG`.
- **Résilience** publication + archivage (échecs remontés à l'écran).
- **Migration des JSON vers le Drive** (dossier `Planning-CHPG-JSON`) — autre conversation.
- **Onglet Maintenance** : diagnostic réécrit (audite Sheet + GitHub + Drive, cohérence JSON↔GARDES) + renvoi des codes multi-sélection.
- **Sélecteur d'année** refait en pilule à badges.
- Wizard 1 & Wizard 3 **testés en réel**.
- **Documents de présentation (staff 04/09)** : algorithme, guide MAR (index.html), manuel du comité (admin.html).

---

## 🔜 À faire

### Axes de développement (un fil de conversation chacun)
- [ ] 🔬 **Module libéral (règle des 30 %)** — le plus gros morceau. MARs (PH titulaires ≥ 1 an), activité libérale intra-hospitalière ; si revenu libéral > 30 % au 31/12, excédent rendu. Contrainte : le MAR ayant fait la consult libérale doit être au bloc le jour de l'intervention. Deux objectifs : logistique + financier.
- [ ] 🖥️ **Dashboard / portail** — tuiles à venir (au-delà de Topos, Staffs, Protocoles, Annuaire, Veille).
- [ ] 📚 **Veille bibliographique** — enrichissements.

### Finitions & maintenance
- [ ] Picker **manuel** des consult libérales endo : filtrer/avertir sur la présence N+1 (aujourd'hui seule la rotation auto le fait).
- [ ] Corriger un libellé hérité dans l'assistant Départ (« onglet Modifications de comite.html », page inexistante).
- [ ] *(Sécurité, à l'appréciation d'Arthur)* rotation du token GitHub.

### Pour 2027 (déménagement)
- [ ] **Secteurs étape 2** : externaliser `SECTEURS_CFG` dans un onglet Google Sheet (redéfinir les secteurs sans toucher au code — BLOC CENTRAL).

---

## 🚫 Écarté (ne pas reproposer)
- `config.html` (couvert par les onglets d'admin.html).
- Optimisation perf du JSON (déjà minifié + gzip).
