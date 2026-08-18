set -euo pipefail

test -f index.html
test -f styles.css
test -f utils.js
test -f app.js

grep -Fq '<link rel="stylesheet" href="styles.css">' index.html
grep -Fq '<script src="utils.js"></script>' index.html
grep -Fq '<script src="app.js"></script>' index.html

grep -Fq 'window.AppEvents' utils.js

grep -Fq 'AppEvents.emit("turn:end"' app.js
grep -Fq 'AppEvents.emit("turn:start"' app.js
grep -Fq 'damage:taken' app.js

if grep -Fq '_origNextTurn' app.js; then
  exit 1
fi

if grep -Fq '_origApplyDamage' app.js; then
  exit 1
fi

echo smoke OK
