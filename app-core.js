function onCardClick(event, charId) {
  if (window.activeSpell) {
    if (window.activeSpell.selecting) {
      const spell = window.activeSpell.spell;
      if (spell.logic.targetMode === "single") {
        window.lastSpellTarget = charId;
        window.activeSpell.selecting = false;
        const c = characters.find(function (ch) { return ch.id === charId; });
        if (c) {
          showToast("Цель: " + c.name + ". Нажмите Применить заклинание.");
        }
        renderAll();
        return;
      }
      if (window.activeSpell.targets.has(charId)) {
        window.activeSpell.targets.delete(charId);
      } else {
        window.activeSpell.targets.add(charId);
      }
      showToast("Целей выбрано: " + window.activeSpell.targets.size);
      renderAll();
      return;
    }
  }
  if (!activeRoll) return;
  if (activeRoll.mode !== 'spread') return;
  const selectedDice = activeRoll.dice.filter(d => d.selected && !d.spent);
  if (selectedDice.length === 0) { showToast('Выберите кубик для разброса'); return; }
  const die = selectedDice[0];
  applySpreadToCharacter(charId); return;
  die.spent = true;
  die.selected = false;
  const remaining = activeRoll.dice.filter(d => !d.spent);
  if (remaining.length === 0) clearActiveRoll();
  else {
    updateActiveRollUI();
    renderAll();
    const remainingCount = activeRoll.dice.filter(d => d.selected && !d.spent).length;
    showToast(`Осталось кубиков: ${remainingCount}`);
  }
}

function applyAoE() {
  if (!activeRoll || activeRoll.aoeTargets.size === 0) return;
  const val = getSelectedSum();
  activeRoll.aoeTargets.forEach(charId => applyDamage(charId, val));
  clearSelection();
  activeRoll.aoeTargets.clear();
  renderAll();
}

function showFloatingText(cardEl, text, color) {
  const rect = cardEl.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'floating-text';
  float.textContent = text;
  float.style.color = color;
  float.style.left = (rect.left + rect.width / 2) + 'px';
  float.style.top = (rect.top + 20) + 'px';
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1500);
}

function toggleHpInlineInput(btn) {
  const input = btn.parentElement.querySelector('.hp-inline-input');
  if (input.classList.contains('show')) { input.classList.remove('show'); return; }
  document.querySelectorAll('.hp-inline-input.show').forEach(i => i.classList.remove('show'));
  input.classList.add('show');
  input.value = '';
  input.focus();
}

function handleHpInlineInput(e, charId) {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (!val) { e.target.classList.remove('show'); return; }
    applyHpInput(charId, val);
    e.target.value = '';
    e.target.classList.remove('show');
  } else if (e.key === 'Escape') { e.target.value = ''; e.target.classList.remove('show'); }
}

function applyHpInput(charId, str) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  str = str.trim().toLowerCase();
  if (/^t\d+$/.test(str)) { applyTempHp(charId, parseInt(str.slice(1))); return; }
  if (/^\+\d+$/.test(str)) { applyHeal(charId, parseInt(str.slice(1))); return; }
  if (/^-\d+$/.test(str)) { applyDamage(charId, parseInt(str.slice(1))); return; }
  if (/^\d+$/.test(str)) {
    const old = c.hpCur;
    c.hpCur = Math.min(c.hpMax, parseInt(str));
    renderAll();
    const cardEl = document.querySelector(`.char-card[data-char-id="${charId}"]`);
    if (cardEl) {
      const diff = c.hpCur - old;
      if (diff !== 0) showFloatingText(cardEl, (diff > 0 ? '+' : '') + diff, diff > 0 ? '#4ecca3' : '#e94560');
    }
    return;
  }
  showToast('❌ Формат: +5, -3, t10 или 25');
}

function init() {
  renderColorPicker();
  addCharacter('pc', 'Аэрон', 'Паладин', 5, 44, 44, 18, 0, '#3a86ff');
  addCharacter('pc', 'Лиара', 'Волшебница', 5, 28, 28, 12, 0, '#8338ec');
  addCharacter('pc', 'Торин', 'Воин', 5, 52, 52, 16, 0, '#e94560');
  addCharacter('npc', 'Гоблин-вожак', 'Гоблин', 3, 21, 21, 15, 0, '#4ecca3');
  addCharacter('npc', 'Гоблин A', 'Гоблин', 1, 7, 7, 13, 0, '#f5a623');
  addCharacter('npc', 'Гоблин B', 'Гоблин', 1, 7, 7, 13, 0, '#f5a623');
  characters[0].quickRolls = [{ id: 1, name: 'Атака', formula: '1d20+5' }, { id: 2, name: 'Урон', formula: '2d6+3' }];
  characters[1].quickRolls = [{ id: 1, name: 'Огненный снаряд', formula: '2d6+1d4' }];
  characters[2].quickRolls = [{ id: 1, name: 'Атака', formula: '1d20+7' }, { id: 2, name: 'Урон', formula: '2d6+4' }];
  characters[3].quickRolls = [{ id: 1, name: 'Атака', formula: '1d20+4' }, { id: 2, name: 'Урон', formula: '1d6+2' }];
  renderAll();
  placeTokens();
  setupDiceInput();
  setupGlobalListeners();
}

function addCharacter(type, name, cls, level, hpMax, hpCur, ac, init, color) {
  const map = document.getElementById('mapContainer');
  characters.push({ id: nextId++, type, name, cls, level, hpMax, hpCur, ac, init, color, statuses: [], quickRolls: [], tempHp: 0, x: 100 + Math.random() * (map.clientWidth - 200), y: 100 + Math.random() * (map.clientHeight - 200) });
}

function placeTokens() {
  const map = document.getElementById('mapContainer');
  const alive = characters.filter(c => c.hpCur > 0);
  const cx = map.clientWidth / 2, cy = map.clientHeight / 2;
  const cols = Math.ceil(Math.sqrt(alive.length));
  alive.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    c.x = cx - (cols * 30) + col * 60;
    c.y = cy - (Math.ceil(alive.length / cols) * 30) + row * 60;
  });
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


function applyAoE() {
  if (!activeRoll) return;
  if (activeRoll.aoeTargets.size === 0) return;

  const val = getSelectedSum();
  const type = activeRoll.applyType ? activeRoll.applyType : 'damage';

  activeRoll.aoeTargets.forEach(function (charId) {
    if (type === 'damage') applyDamage(charId, val);
    if (type === 'heal') applyHeal(charId, val);
    if (type === 'temp') applyTempHp(charId, val);
  });

  activeRoll.aoeTargets.clear();
  consumeSelectedDice();
}
