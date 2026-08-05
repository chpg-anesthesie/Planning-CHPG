#!/bin/bash
# Lance tout le banc d'essai. Sort en erreur à la première vérification ratée.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install jsdom --silent
for f in banc.js banc_worker.mjs banc_miroir.js banc_resilience.js banc_page.js e2e.js interface.js; do
  echo "──────── $f ────────"
  node "$f"
done
echo "════════ BANC COMPLET AU VERT ════════"
