#!/bin/bash
# Lance tout le banc d'essai. Sort en erreur à la première vérification ratée.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install jsdom --silent
for f in banc.js banc_worker.mjs banc_miroir.js banc_resilience.js banc_page.js banc_chaos.js banc_pages_mar.js banc_ios.js banc_google.js banc_gestes.js banc_synchro.js banc_acces.mjs banc_catastrophe.js banc_equipe.js banc_annuel.js banc_indispos.js banc_calendrier.js e2e.js interface.js; do
  echo "──────── $f ────────"
  node "$f"
done
echo "════════ BANC COMPLET AU VERT ════════"
