# Sauvegarde hors-compte — copie d'archive

Ce dossier **n'est pas du code de production**. C'est la copie d'archive d'un
petit projet Apps Script **indépendant**, qui vit dans le compte Google
**personnel** d'Arthur — pas dans le compte du planning, pas dans le projet
rattaché au classeur.

Il ne doit **jamais** être collé dans le projet Planning-CHPG.

## À quoi il sert

Chaque dimanche vers 5 h, il copie le classeur maître dans un dossier Drive
`Sauvegardes Planning-CHPG` du compte personnel, et ne garde que les 8 copies
les plus récentes.

L'intérêt est le compte, pas la copie : comme c'est le compte personnel qui
crée le fichier, la copie lui appartient. Un incident sur le compte du
planning (suppression, perte d'accès, fermeture) ne peut donc pas l'atteindre.

C'est la seule sauvegarde du projet qui survit à la perte du compte principal.
Les deux autres (`backupHebdo` dans `gas/code.gs`, `sauvegardeHebdo` dans
`sauvegarde.gs`) vivent, elles, dans le compte du planning.

## Pourquoi cette copie existe

Le code d'origine n'était enregistré nulle part. S'il disparaissait, la
sauvegarde s'arrêtait sans le moindre signal — personne ne s'en apercevrait
avant d'en avoir besoin.

## Réinstaller après une perte

1. Nouveau projet Apps Script, dans le compte **personnel**.
2. Coller `Code.gs`, et `appsscript.json` (à afficher via Paramètres du projet).
3. Renseigner `ID_CLASSEUR` : c'est la longue suite de caractères dans l'URL du
   classeur maître, entre `/d/` et `/edit`. Volontairement absente d'ici, ce
   dépôt étant public.
4. Exécuter `installerDeclencheur()` **une seule fois**, et accepter les
   autorisations.
5. Vérifier le dimanche suivant qu'une copie datée est bien apparue.

## Vérifier qu'il tourne toujours

Ouvrir le dossier `Sauvegardes Planning-CHPG` du compte personnel : le fichier
le plus récent doit dater du dernier dimanche. Sinon, le déclencheur est tombé
et il faut relancer `installerDeclencheur()`.
