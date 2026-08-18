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

test -s app-state.js
test -s app-dice.js
test -s app-hp.js
test -s app-combat.js
test -s app-ui.js
test -s app-char.js
test -s app-core.js
test -s app-setup.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app-state.js"></script>' index.html
grep -Fq '<script src="app-dice.js"></script>' index.html
grep -Fq '<script src="app-hp.js"></script>' index.html
grep -Fq '<script src="app-combat.js"></script>' index.html
grep -Fq '<script src="app-ui.js"></script>' index.html
grep -Fq '<script src="app-char.js"></script>' index.html
grep -Fq '<script src="app-core.js"></script>' index.html
grep -Fq '<script src="app-setup.js"></script>' index.html
grep -Fq '<script src="extensions-data.js"></script>' index.html
grep -Fq '<script src="extensions-wizards.js"></script>' index.html
grep -Fq '<script src="extensions-editor.js"></script>' index.html
grep -Fq '<script src="extensions-triggers.js"></script>' index.html
grep -Fq '<script src="extensions-spells.js"></script>' index.html
grep -Fq '<script src="extensions-init.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js

grep -Fq 'const COLORS' app-state.js
grep -Fq 'let characters' app-state.js
grep -Fq 'STATUS_DEFS' app-state.js

grep -Fq 'function parseDiceExpression' app-dice.js
grep -Fq 'function rollExpression' app-dice.js

grep -Fq 'function applyDamage' app-hp.js
grep -Fq 'damage:taken' app-hp.js
grep -Fq 'function applyHeal' app-hp.js
grep -Fq 'function showHpPopup' app-hp.js

grep -Fq 'function startCombat' app-combat.js
grep -Fq 'function nextTurn' app-combat.js
grep -Fq 'AppEvents.emit("turn:end"' app-combat.js
grep -Fq 'AppEvents.emit("turn:start"' app-combat.js

grep -Fq 'function renderAll' app-ui.js
grep -Fq 'function renderPanel' app-ui.js
grep -Fq 'function renderTokens' app-ui.js
grep -Fq 'function makeDraggable' app-ui.js
grep -Fq 'escapeHtml(c.name)' app-ui.js
grep -Fq 'window.applySpellTargetClasses' app-ui.js

grep -Fq 'function removeCharacter' app-char.js
grep -Fq 'function openStatusModal' app-char.js
grep -Fq 'function saveStatus' app-char.js
grep -Fq 'function tickStatuses' app-char.js
grep -Fq 'function openQuickRollModal' app-char.js
grep -Fq 'function saveQuickRoll' app-char.js
grep -Fq 'function renderColorPicker' app-char.js
grep -Fq 'function openModal' app-char.js
grep -Fq 'function closeModal' app-char.js
grep -Fq 'function saveCharacter' app-char.js
grep -Fq 'let statusUid' app-char.js

grep -Fq 'function onCardClick' app-core.js
grep -Fq 'window.activeSpell' app-core.js
grep -Fq 'function showFloatingText' app-core.js
grep -Fq 'function addCharacter' app-core.js
grep -Fq 'function placeTokens' app-core.js
grep -Fq 'function init()' app-core.js

grep -Fq 'const EXAMPLES' app-setup.js
grep -Fq 'function setupDiceInput' app-setup.js
grep -Fq 'function setupGlobalListeners' app-setup.js
grep -Fq 'init();' app-setup.js

grep -Fq 'SPELL_CATALOG' extensions-data.js
grep -Fq 'statusWizard' extensions-wizards.js
grep -Fq 'renderNodes' extensions-editor.js

grep -Fq 'executeStatusTriggers' extensions-triggers.js
grep -Fq 'window.__inTrigger' extensions-triggers.js

grep -Fq 'castSpellFromCatalog' extensions-spells.js
grep -Fq 'window.applySpellTargetClasses' extensions-spells.js

grep -Fq 'initExtensions' extensions-init.js
grep -Fq 'AppEvents.on("turn:start"' extensions-init.js

echo smoke OK
