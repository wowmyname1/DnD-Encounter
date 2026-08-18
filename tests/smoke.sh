set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app-state.js
test -f app-dice.js
test -f app-combat.js
test -f app-core.js
test -f extensions-data.js
test -f extensions-wizards.js
test -f extensions-editor.js
test -f extensions-triggers.js
test -f extensions-hooks.js
test -f extensions-spells.js
test -f extensions-init.js

test -s app-state.js
test -s app-dice.js
test -s app-combat.js
test -s app-core.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app-state.js"></script>' index.html
grep -Fq '<script src="app-dice.js"></script>' index.html
grep -Fq '<script src="app-combat.js"></script>' index.html
grep -Fq '<script src="app-core.js"></script>' index.html
grep -Fq '<script src="extensions-data.js"></script>' index.html
grep -Fq '<script src="extensions-wizards.js"></script>' index.html
grep -Fq '<script src="extensions-editor.js"></script>' index.html
grep -Fq '<script src="extensions-triggers.js"></script>' index.html
grep -Fq '<script src="extensions-hooks.js"></script>' index.html
grep -Fq '<script src="extensions-spells.js"></script>' index.html
grep -Fq '<script src="extensions-init.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js

grep -Fq 'const COLORS' app-state.js
grep -Fq 'let characters' app-state.js
grep -Fq 'STATUS_DEFS' app-state.js

grep -Fq 'function parseDiceExpression' app-dice.js
grep -Fq 'function rollExpression' app-dice.js

grep -Fq 'function startCombat' app-combat.js
grep -Fq 'function nextTurn' app-combat.js
grep -Fq 'AppEvents.emit("turn:end"' app-combat.js
grep -Fq 'AppEvents.emit("turn:start"' app-combat.js

grep -Fq 'function applyDamage' app-core.js
grep -Fq 'damage:taken' app-core.js
grep -Fq 'function showToast' app-core.js
grep -Fq 'function saveCharacter' app-core.js
grep -Fq 'escapeHtml(c.name)' app-core.js

grep -Fq 'SPELL_CATALOG' extensions-data.js
grep -Fq 'statusWizard' extensions-wizards.js
grep -Fq 'renderNodes' extensions-editor.js

grep -Fq 'executeStatusTriggers' extensions-triggers.js
grep -Fq 'window.__inTrigger' extensions-triggers.js

grep -Fq '_origOnCardClick' extensions-hooks.js
grep -Fq 'castSpellFromCatalog' extensions-spells.js

grep -Fq 'initExtensions' extensions-init.js
grep -Fq 'AppEvents.on("turn:start"' extensions-init.js

echo smoke OK
