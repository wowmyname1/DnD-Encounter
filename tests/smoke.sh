set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app-core.js
test -f extensions-data.js
test -f extensions-wizards.js
test -f extensions-editor.js
test -f extensions-triggers.js
test -f extensions-hooks.js
test -f extensions-spells.js
test -f extensions-init.js

test -s extensions-wizards.js
test -s extensions-editor.js
test -s extensions-triggers.js
test -s extensions-hooks.js
test -s extensions-spells.js
test -s extensions-init.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app-core.js"></script>' index.html
grep -Fq '<script src="extensions-data.js"></script>' index.html
grep -Fq '<script src="extensions-wizards.js"></script>' index.html
grep -Fq '<script src="extensions-editor.js"></script>' index.html
grep -Fq '<script src="extensions-triggers.js"></script>' index.html
grep -Fq '<script src="extensions-hooks.js"></script>' index.html
grep -Fq '<script src="extensions-spells.js"></script>' index.html
grep -Fq '<script src="extensions-init.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js
grep -Fq 'AppEvents.emit("turn:end"' app-core.js
grep -Fq 'escapeHtml(c.name)' app-core.js

grep -Fq 'SPELL_CATALOG' extensions-data.js
grep -Fq 'statusWizard' extensions-wizards.js
grep -Fq 'renderNodes' extensions-editor.js
grep -Fq 'executeStatusTriggers' extensions-triggers.js
grep -Fq '_origOnCardClick' extensions-hooks.js
grep -Fq 'castSpellFromCatalog' extensions-spells.js
grep -Fq 'initExtensions' extensions-init.js

echo smoke OK
