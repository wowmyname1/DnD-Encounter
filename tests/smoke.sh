set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app-core.js
test -f app-extensions.js

test -s app-core.js
test -s app-extensions.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app-core.js"></script>' index.html
grep -Fq '<script src="app-extensions.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js
grep -Fq 'AppEvents.emit("turn:end"' app-core.js
grep -Fq 'escapeHtml(c.name)' app-core.js
grep -Fq 'executeStatusTriggers' app-extensions.js

echo smoke OK
