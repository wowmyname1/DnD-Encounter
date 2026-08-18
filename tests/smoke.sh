set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app-core.js
test -f extensions-data.js
test -f extensions-logic.js

test -s extensions-data.js
test -s extensions-logic.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app-core.js"></script>' index.html
grep -Fq '<script src="extensions-data.js"></script>' index.html
grep -Fq '<script src="extensions-logic.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js
grep -Fq 'AppEvents.emit("turn:end"' app-core.js
grep -Fq 'escapeHtml(c.name)' app-core.js

grep -Fq 'SPELL_CATALOG' extensions-data.js
grep -Fq 'executeStatusTriggers' extensions-logic.js
grep -Fq 'initExtensions' extensions-logic.js

echo smoke OK
