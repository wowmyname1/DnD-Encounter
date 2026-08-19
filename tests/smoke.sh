set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app-state.js
test -f app-dice.js
test -f app-hp.js
test -f app-combat.js
test -f app-ui.js
test -f app-char.js
test -f app-core.js
test -f app-setup.js
test -f extensions-data.js
test -f extensions-wizards.js
test -f extensions-editor.js
test -f extensions-triggers.js
test -f extensions-spells.js
test -f extensions-init.js

grep -Fq 'id="charStr"' index.html
grep -Fq 'id="charUseHpFormula"' index.html
grep -Fq 'id="charHpConFactor"' index.html

echo "smoke OK"
