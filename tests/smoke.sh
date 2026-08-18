set -euxo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app.js"></script>' index.html
grep -Fq 'window.AppEvents' utils.js

echo smoke OK
