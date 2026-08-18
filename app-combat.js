function startCombat() {
  const alive = characters.filter(c => c.hpCur > 0);
  if (alive.length === 0) return;
  alive.forEach(c => { if (c.init === 0) c.init = Math.floor(Math.random() * 20) + 1; });
  turnOrder = [...alive].sort((a, b) => b.init - a.init);
  currentTurnIndex = 0;
  round = 1;
  combatActive = true;
  document.getElementById('btnCombat').style.display = 'none';
  document.getElementById('btnNextTurn').style.display = '';
  updateTurnInfo();
  renderAll();
  showToast(`⚔️ Бой начался!`);
}

function nextTurn() {
  if (!combatActive || turnOrder.length === 0) return;
  const currentChar = turnOrder[currentTurnIndex];
    if (window.AppEvents) window.AppEvents.emit("turn:end", currentChar.id);
const expired = tickStatuses(currentChar.id);
  expired.forEach(s => showToast(`⏰ Истёк: ${s.icon} ${s.name}`));
  currentTurnIndex++;
  if (currentTurnIndex >= turnOrder.length) {
    currentTurnIndex = 0;
    round++;
    turnOrder = turnOrder.filter(c => c.hpCur > 0);
    if (turnOrder.length === 0) { resetCombat(); return; }
  }
  updateTurnInfo();
  renderAll();
}

function updateTurnInfo() {
  document.getElementById('roundBadge').textContent = `Раунд ${round}`;
  if (combatActive && turnOrder[currentTurnIndex]) {
    document.getElementById('turnIndicator').textContent = `Ход: ${turnOrder[currentTurnIndex].name}`;
  }
}

function resetCombat() {
  combatActive = false;
  turnOrder = [];
  currentTurnIndex = -1;
  round = 1;
  characters.forEach(c => c.init = 0);
  document.getElementById('btnCombat').style.display = '';
  document.getElementById('btnNextTurn').style.display = 'none';
  document.getElementById('turnIndicator').textContent = 'Ход: —';
  document.getElementById('roundBadge').textContent = 'Раунд 1';
  renderAll();
}

function centerTokens() {
  const map = document.getElementById('mapContainer');
  const cx = map.clientWidth / 2, cy = map.clientHeight / 2;
  const alive = characters.filter(c => c.hpCur > 0);
  const cols = Math.ceil(Math.sqrt(alive.length));
  alive.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    c.x = cx - (cols * 30) + col * 60;
    c.y = cy - (Math.ceil(alive.length / cols) * 30) + row * 60;
  });
  renderTokens();
}

