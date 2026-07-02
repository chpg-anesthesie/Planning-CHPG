# Simulateur — banc d'essai du générateur de gardes

Exécute le **vrai** `generateur_gardes.gs` dans Node avec un Google Sheets simulé.
Toute modification du générateur DOIT repasser cette batterie avant push :

    node simulateur/scenarios.js      # batterie de scénarios (invariants + équité)
    node simulateur/avant_apres.js    # comparaison version dépôt vs copie patchée (repo-patched/)
    node simulateur/chain.js          # convergence de la dette sur 4 ans, couplages, 18h

Règle : AUCUNE métrique ne doit se dégrader (errs, écarts par axe, G−G2, warnings).
Invariants vérifiés : binôme complet/jour, jamais 2 gardes consécutives, RG, intégrité
VD, couplages fériés, indispos, NO_WEEKEND/NO_GARDE, jours fixes TP, combo jeu→sam, R≡SAM.
