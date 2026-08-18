function applyDamage(id, amount) {
  const c = characters.find(ch => ch.id === id);
  if (!c || amount <= 0) return;
  let remaining = amount;
  let absorbed = 0;
  if (c.tempHp > 0) {
    absorbed = Math.min(c.tempHp, remaining);
    c.tempHp -= absorbed;
    remaining -= absorbed;
  }
  c.hpCur = Math.max(0, c.hpCur - remaining);
  renderAll();
  const cardEl = document.querySelector(`.char-card[data-char-id="${id}"]`);
  if (cardEl) {
    let txt = `-${amount}`;
    if (absorbed > 0) txt += ` (🛡️${absorbed})`;
    showFloatingText(cardEl, txt, '#e94560');
  }
  if (window.AppEvents) { if (!window.__inTrigger) window.AppEvents.emit("damage:taken", { id: id, amount: amount }); }
}

function applyHeal(id, amount) {
  const c = characters.find(ch => ch.id === id);
  if (!c || amount <= 0) return;
  const before = c.hpCur;
  c.hpCur = Math.min(c.hpMax, c.hpCur + amount);
  const actual = c.hpCur - before;
  renderAll();
  const cardEl = document.querySelector(`.char-card[data-char-id="${id}"]`);
  if (cardEl) showFloatingText(cardEl, `+${actual}`, '#4ecca3');
}

function applyTempHp(id, amount) {
  const c = characters.find(ch => ch.id === id);
  if (!c || amount <= 0) return;
  c.tempHp = (c.tempHp || 0) + amount;
  renderAll();
  const cardEl = document.querySelector(`.char-card[data-char-id="${id}"]`);
  if (cardEl) showFloatingText(cardEl, `🛡️+${amount}`, '#48dbfb');
}

function changeHp(id, delta) {
  const c = characters.find(ch => ch.id === id);
  if (!c) return;
  if (delta > 0) applyHeal(id, delta);
  else if (delta < 0) applyDamage(id, -delta);
}

function showHpPopup(barEl, charId) {
  if (!activeRoll) return;
  popupTargetId = charId;
  lastTargetId = charId;
  const c = characters.find(ch => ch.id === charId);
  const popup = document.getElementById('hpPopup');
  document.getElementById('hpPopupCharName').textContent = c.name;
  document.getElementById('hpPopupRollVal').textContent = getSelectedSum();
  const rect = barEl.getBoundingClientRect();
  popup.style.left = (rect.left + rect.width / 2 - 90) + 'px';
  popup.style.top = (rect.bottom + 6) + 'px';
  popup.classList.add('show');
}

function closeHpPopup() { document.getElementById('hpPopup').classList.remove('show'); popupTargetId = null; }

function applyPopupAction(type) {
  if (!activeRoll || !popupTargetId) return;
  const val = getSelectedSum();
  if (type === 'damage') applyDamage(popupTargetId, val);
  else if (type === 'heal') applyHeal(popupTargetId, val);
  else if (type === 'temp') applyTempHp(popupTargetId, val);
  closeHpPopup();
  clearSelection();
}

function onHpBarClick(event, charId) {
  if (activeRoll && activeRoll.mode === 'spread') return;
  event.stopPropagation();
  if (!activeRoll) {
    const card = event.currentTarget.closest('.char-card');
    const btn = card.querySelector('.hp-edit-btn');
    toggleHpInlineInput(btn);
    return;
  }
  lastTargetId = charId;
  if (activeRoll.mode === 'single') showHpPopup(event.currentTarget, charId);
  else if (activeRoll.mode === 'aoe') {
    if (activeRoll.aoeTargets.has(charId)) activeRoll.aoeTargets.delete(charId);
    else activeRoll.aoeTargets.add(charId);
    renderAll();
  }
}

function onCardClick(event, charId) {
  if (!activeRoll) return;
  if (activeRoll.mode !== 'spread') return;
  const selectedDice = activeRoll.dice.filter(d => d.selected && !d.spent);
  if (selectedDice.length === 0) { showToast('Выберите кубик для разброса'); return; }
  const die = selectedDice[0];
  applyDamage(charId, die.value);
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

function renderAll() {
  renderPanel('pc');
  renderPanel('npc');
  renderTokens();
  renderInitOrder();
  document.getElementById('pcCount').textContent = characters.filter(c => c.type === 'pc').length;
  document.getElementById('npcCount').textContent = characters.filter(c => c.type === 'npc').length;
}

function renderPanel(type) {
  const list = document.getElementById(type === 'pc' ? 'pcList' : 'npcList');
  const chars = characters.filter(c => c.type === type);
  list.innerHTML = '';
  chars.forEach(c => {
    const pct = Math.max(0, (c.hpCur / c.hpMax) * 100);
    const hpClass = pct > 50 ? '' : pct > 25 ? 'medium' : 'low';
    const isActive = combatActive && turnOrder[currentTurnIndex]?.id === c.id;
    const isDead = c.hpCur <= 0;
    const isAoeTarget = activeRoll && activeRoll.mode === 'aoe' && activeRoll.aoeTargets.has(c.id);
    const initials = c.name.substring(0, 2);
    const card = document.createElement('div');
    card.className = `char-card${isActive ? ' active-turn' : ''}${isDead ? ' dead' : ''}${isAoeTarget ? ' aoe-target' : ''}`;
    card.dataset.charId = c.id;
    card.onclick = (e) => {
      if (!e.target.closest('.hp-bar-container') && !e.target.closest('.card-actions') && !e.target.closest('.hp-controls') && !e.target.closest('.statuses-row') && !e.target.closest('.quick-rolls-row')) {
        onCardClick(e, c.id);
      }
    };
    const statusesHtml = c.statuses.map(s => {
      const durText = s.type === 'timed' ? `<span class="status-dur">${s.duration}</span>` : '';
      const permClass = s.type === 'permanent' ? 'permanent' : '';
      return `<span class="status-badge ${permClass}" style="background:${s.color}" title="${escapeAttr(s.name)}${s.type === 'timed' ? ' (' + s.duration + ' раундов)' : ''}" onclick="removeStatus(${c.id}, ${s.uid})"><span class="status-icon">${s.icon}</span>${durText}</span>`;
    }).join('');
    const quickRollsHtml = c.quickRolls.map(qr => `
      <button class="quick-roll-btn" onclick="rollQuickFormula('${qr.formula}')">
        ${escapeHtml(qr.name)}: ${escapeHtml(qr.formula)}
        <span class="qr-del" onclick="event.stopPropagation(); deleteQuickRoll(${c.id}, ${qr.id})">✕</span>
      </button>`).join('');
    const tempPct = c.hpMax > 0 ? Math.min(100, ((c.tempHp || 0) / c.hpMax) * 100) : 0;
    const tempLeft = pct;
    const tempText = c.tempHp > 0 ? `<span class="temp-indicator">🛡️${c.tempHp}</span>` : '';
    const hasActive = activeRoll !== null;
    const selectedSum = hasActive ? getSelectedSum() : 0;
    let previewHtml = '';
    if (hasActive && selectedSum > 0) {
      if (activeRoll.mode === 'single') previewHtml = `<span class="hp-preview damage">-${selectedSum}</span>`;
      else if (activeRoll.mode === 'aoe') previewHtml = `<span class="hp-preview damage">💥-${selectedSum}</span>`;
      else if (activeRoll.mode === 'spread') previewHtml = `<span class="hp-preview damage">🎯</span>`;
    }
    card.innerHTML = `
      <div class="card-top">
        <div class="card-avatar" style="background:${c.color}">${initials}</div>
        <div class="card-info">
          <div class="card-name">${escapeHtml(c.name)}</div>
          <div class="card-subtitle">${escapeHtml(c.cls)} · Ур.${c.level} · AC ${c.ac}</div>
        </div>
        <div class="card-initiative">${c.init > 0 ? c.init : '—'}</div>
      </div>
      <div class="hp-section">
        <div class="hp-bar-container ${hasActive ? 'has-active-roll' : ''}" data-char-id="${c.id}" onclick="onHpBarClick(event, ${c.id})">
          <div class="hp-bar-base ${hpClass}" style="width:${pct}%"></div>
          ${c.tempHp > 0 ? `<div class="hp-bar-temp" style="left:${tempLeft}%; width:${tempPct}%"></div>` : ''}
          <div class="hp-text"><span>${c.hpCur}/${c.hpMax}</span>${tempText}</div>
          ${previewHtml}
        </div>
        <div class="hp-controls">
          <button class="hp-btn dmg" onclick="changeHp(${c.id}, -1)">-1</button>
          <button class="hp-btn dmg" onclick="changeHp(${c.id}, -5)">-5</button>
          <button class="hp-btn heal" onclick="changeHp(${c.id}, 1)">+1</button>
          <button class="hp-btn heal" onclick="changeHp(${c.id}, 5)">+5</button>
          <button class="hp-btn temp" onclick="promptTempHp(${c.id})">🛡️ Темп</button>
          <button class="hp-edit-btn" onclick="toggleHpInlineInput(this)">✏️</button>
          <input type="text" class="hp-inline-input" placeholder="+5, -3, t10, 25" onkeydown="handleHpInlineInput(event, ${c.id})" onblur="this.classList.remove('show')">
        </div>
      </div>
      <div class="statuses-row">${statusesHtml}<button class="add-status-btn" onclick="openStatusModal(${c.id})">+ статус</button></div>
      <div class="quick-rolls-row">${quickRollsHtml}<button class="add-roll-btn" onclick="openQuickRollModal(${c.id})">+ бросок</button></div>
      <div class="card-actions">
        <button class="card-btn" onclick="openModal('${type}', ${c.id})">✏️ Ред.</button>
        <button class="card-btn danger" onclick="removeCharacter(${c.id})">🗑️</button>
      </div>`;
    list.appendChild(card);
  });
  if (activeRoll && activeRoll.mode === 'aoe' && activeRoll.aoeTargets.size > 0) {
    let btn = document.getElementById('aoeApplyBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'aoeApplyBtn';
      btn.className = 'aoe-apply-btn';
      btn.onclick = applyAoE;
      document.body.appendChild(btn);
    }
    btn.textContent = `💥 Применить ${getSelectedSum()} урона к ${activeRoll.aoeTargets.size} целям`;
  } else {
    const existingBtn = document.getElementById('aoeApplyBtn');
    if (existingBtn) existingBtn.remove();
  }
}

function promptTempHp(charId) {
  const val = prompt('Временные HP:', '5');
  if (val === null) return;
  const num = parseInt(val);
  if (isNaN(num) || num <= 0) { showToast('❌ Введите число'); return; }
  applyTempHp(charId, num);
}

function renderTokens() {
  const map = document.getElementById('mapContainer');
  map.querySelectorAll('.map-token').forEach(t => t.remove());
  characters.forEach(c => {
    if (c.hpCur <= 0) return;
    const token = document.createElement('div');
    token.className = 'map-token';
    const isActive = combatActive && turnOrder[currentTurnIndex]?.id === c.id;
    if (isActive) token.classList.add('active-token');
    token.style.background = c.color;
    token.style.left = c.x + 'px';
    token.style.top = c.y + 'px';
    token.dataset.id = c.id;
    const statusDots = c.statuses.slice(0, 6).map(s => `<span class="token-status-dot" style="background:${s.color}" title="${escapeAttr(s.name)}"></span>`).join('');
    const tempText = c.tempHp > 0 ? ` 🛡️${c.tempHp}` : '';
    token.innerHTML = `${escapeHtml(c.name.substring(0,2))}<span class="token-hp">${c.hpCur}${tempText}</span><div class="token-statuses">${statusDots}</div>`;
    makeDraggable(token, c);
    map.appendChild(token);
  });
}

function renderInitOrder() {
  const el = document.getElementById('initOrder');
  const list = document.getElementById('initList');
  if (!combatActive || turnOrder.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  list.innerHTML = '';
  turnOrder.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = `init-item${i === currentTurnIndex ? ' current' : ''}`;
    item.innerHTML = `<span class="init-dot" style="background:${c.color}"></span><span class="init-val">${c.init}</span><span>${escapeHtml(c.name)}</span>`;
    list.appendChild(item);
  });
}

function makeDraggable(token, char) {
  let startX, startY, origX, origY;
  token.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    origX = char.x; origY = char.y;
    const map = document.getElementById('mapContainer');
    const onMove = ev => {
      char.x = Math.max(0, Math.min(map.clientWidth - 50, origX + (ev.clientX - startX)));
      char.y = Math.max(0, Math.min(map.clientHeight - 50, origY + (ev.clientY - startY)));
      token.style.left = char.x + 'px';
      token.style.top = char.y + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

function removeCharacter(id) {
  characters = characters.filter(c => c.id !== id);
  if (combatActive) {
    turnOrder = turnOrder.filter(c => c.id !== id);
    if (currentTurnIndex >= turnOrder.length) currentTurnIndex = 0;
  }
  renderAll();
}

let statusUid = 1;
function openStatusModal(charId) {
  document.getElementById('statusCharId').value = charId;
  selectedStatusDef = null;
  currentStatusTab = 'permanent';
  document.querySelectorAll('.status-type-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  document.getElementById('durationGroup').style.display = 'none';
  document.getElementById('customStatusName').value = '';
  document.getElementById('customStatusIcon').value = '';
  document.getElementById('customStatusDuration').value = 3;
  renderStatusGrid('permanent');
  document.getElementById('statusModal').classList.add('show');
}

function switchStatusTab(tab, btn) {
  currentStatusTab = tab;
  document.querySelectorAll('.status-type-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('durationGroup').style.display = tab === 'timed' ? '' : 'none';
  selectedStatusDef = null;
  renderStatusGrid(tab);
}

function renderStatusGrid(tab) {
  const grid = document.getElementById('statusGrid');
  grid.innerHTML = '';
  STATUS_DEFS[tab].forEach(s => {
    const opt = document.createElement('div');
    opt.className = 'status-option';
    opt.innerHTML = `<span class="so-icon">${s.icon}</span><span class="so-name">${escapeHtml(s.name)}</span>`;
    opt.onclick = () => {
      selectedStatusDef = s;
      grid.querySelectorAll('.status-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    };
    grid.appendChild(opt);
  });
}

function saveStatus() {
  const charId = parseInt(document.getElementById('statusCharId').value);
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  let status;
  if (selectedStatusDef) {
    status = { uid: statusUid++, id: selectedStatusDef.id, name: selectedStatusDef.name, icon: selectedStatusDef.icon, color: selectedStatusDef.color, type: currentStatusTab, duration: currentStatusTab === 'timed' ? parseInt(document.getElementById('customStatusDuration').value) || 1 : null };
  } else {
    const name = document.getElementById('customStatusName').value.trim();
    if (!name) { showToast('Укажите название'); return; }
    const icon = document.getElementById('customStatusIcon').value.trim() || '✨';
    status = { uid: statusUid++, id: 'custom_' + Date.now(), name, icon, color: COLORS[Math.floor(Math.random() * COLORS.length)], type: currentStatusTab, duration: currentStatusTab === 'timed' ? parseInt(document.getElementById('customStatusDuration').value) || 1 : null };
  }
  c.statuses.push(status);
  closeModal('statusModal');
  showToast(`${status.icon} ${status.name} → ${c.name}`);
  renderAll();
}

function removeStatus(charId, uid) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const s = c.statuses.find(st => st.uid === uid);
  c.statuses = c.statuses.filter(st => st.uid !== uid);
  if (s) showToast(`Снят: ${s.icon} ${s.name}`);
  renderAll();
}

function tickStatuses(charId) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return [];
  const expired = [];
  c.statuses = c.statuses.filter(s => {
    if (s.type === 'timed') {
      s.duration--;
      if (s.duration <= 0) { expired.push(s); return false; }
    }
    return true;
  });
  return expired;
}

let quickRollUid = 100;
function openQuickRollModal(charId) {
  document.getElementById('qrCharId').value = charId;
  document.getElementById('qrName').value = '';
  document.getElementById('qrFormula').value = '';
  document.getElementById('quickRollModal').classList.add('show');
  document.getElementById('qrName').focus();
}

function saveQuickRoll() {
  const charId = parseInt(document.getElementById('qrCharId').value);
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const name = document.getElementById('qrName').value.trim();
  const formula = document.getElementById('qrFormula').value.trim();
  if (!name || !formula) { showToast('Заполните поля'); return; }
  const v = validateExpression(formula);
  if (!v.valid) { showToast(`❌ ${v.error}`); return; }
  c.quickRolls.push({ id: quickRollUid++, name, formula });
  closeModal('quickRollModal');
  showToast(`🎲 Добавлен: ${name}`);
  renderAll();
}

function deleteQuickRoll(charId, rollId) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  c.quickRolls = c.quickRolls.filter(qr => qr.id !== rollId);
  renderAll();
}

function renderColorPicker() {
  const picker = document.getElementById('colorPicker');
  picker.innerHTML = '';
  COLORS.forEach(color => {
    const sw = document.createElement('div');
    sw.className = `color-swatch${color === selectedColor ? ' selected' : ''}`;
    sw.style.background = color;
    sw.onclick = () => {
      selectedColor = color;
      picker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
    };
    picker.appendChild(sw);
  });
}

function openModal(type, editId = null) {
  document.getElementById('charModal').classList.add('show');
  document.getElementById('editType').value = type;
  document.getElementById('editId').value = editId !== null ? editId : '';
  if (editId !== null) {
    const c = characters.find(ch => ch.id === editId);
    document.getElementById('modalTitle').textContent = 'Редактировать';
    document.getElementById('fName').value = c.name;
    document.getElementById('fClass').value = c.cls;
    document.getElementById('fLevel').value = c.level;
    document.getElementById('fHpMax').value = c.hpMax;
    document.getElementById('fHpCur').value = c.hpCur;
    document.getElementById('fAc').value = c.ac;
    document.getElementById('fInit').value = c.init;
    selectedColor = c.color;
  } else {
    document.getElementById('modalTitle').textContent = type === 'pc' ? 'Добавить игрока' : 'Добавить NPC';
    document.getElementById('fName').value = '';
    document.getElementById('fClass').value = '';
    document.getElementById('fLevel').value = 1;
    document.getElementById('fHpMax').value = 30;
    document.getElementById('fHpCur').value = 30;
    document.getElementById('fAc').value = 10;
    document.getElementById('fInit').value = 0;
    selectedColor = COLORS[Math.floor(Math.random() * COLORS.length)];
  }
  renderColorPicker();
  document.getElementById('fName').focus();
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

function saveCharacter() {
  const type = document.getElementById('editType').value;
  const editId = document.getElementById('editId').value;
  const data = {
    name: document.getElementById('fName').value || 'Безымянный',
    cls: document.getElementById('fClass').value || '—',
    level: parseInt(document.getElementById('fLevel').value) || 1,
    hpMax: parseInt(document.getElementById('fHpMax').value) || 1,
    hpCur: parseInt(document.getElementById('fHpCur').value) || 1,
    ac: parseInt(document.getElementById('fAc').value) || 10,
    init: parseInt(document.getElementById('fInit').value) || 0,
    color: selectedColor
  };
  if (editId !== '') {
    const c = characters.find(ch => ch.id === parseInt(editId));
    Object.assign(c, data);
  } else {
    const map = document.getElementById('mapContainer');
    characters.push({ id: nextId++, type, ...data, statuses: [], quickRolls: [], tempHp: 0, x: 100 + Math.random() * (map.clientWidth - 200), y: 100 + Math.random() * (map.clientHeight - 200) });
  }
  closeModal('charModal');
  renderAll();
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

const EXAMPLES = ['1d20+5', '2d6+3', '4d6kh3', '2d20kl1+2', '1d8+1d6', '8d6kh5'];

function setupDiceInput() {
  const input = document.getElementById('diceExpression');
  const errorEl = document.getElementById('diceError');
  const examplesEl = document.getElementById('diceExamples');
  const rollBtn = document.getElementById('diceRollBtn');
  const helpBtn = document.getElementById('diceHelpBtn');
  const helpPopover = document.getElementById('diceHelpPopover');
  examplesEl.innerHTML = EXAMPLES.map(ex => `<span class="example-chip" data-expr="${ex}">${ex}</span>`).join('');
  input.addEventListener('input', () => {
    const val = input.value;
    if (!val.trim()) { input.classList.remove('valid', 'invalid'); errorEl.textContent = ''; rollBtn.disabled = false; return; }
    const v = validateExpression(val);
    if (v.valid) { input.classList.add('valid'); input.classList.remove('invalid'); errorEl.textContent = ''; rollBtn.disabled = false; }
    else { input.classList.add('invalid'); input.classList.remove('valid'); errorEl.textContent = v.error || ''; rollBtn.disabled = true; }
  });
  input.addEventListener('focus', () => examplesEl.classList.add('show'));
  input.addEventListener('blur', () => setTimeout(() => examplesEl.classList.remove('show'), 200));
  examplesEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.example-chip');
    if (!chip) return;
    input.value = chip.dataset.expr;
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
  helpBtn.addEventListener('click', (e) => { e.stopPropagation(); helpPopover.classList.toggle('show'); });
  helpPopover.addEventListener('click', (e) => {
    const item = e.target.closest('.help-item');
    if (!item) return;
    input.value = item.dataset.expr;
    input.dispatchEvent(new Event('input'));
    helpPopover.classList.remove('show');
    input.focus();
  });
  document.addEventListener('click', (e) => {
    if (!helpPopover.contains(e.target) && e.target !== helpBtn) helpPopover.classList.remove('show');
  });
}

function setupGlobalListeners() {
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('hpPopup');
    if (popup.classList.contains('show') && !popup.contains(e.target) && !e.target.closest('.hp-bar-container')) closeHpPopup();
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') {
      closeModal('charModal'); closeModal('statusModal'); closeModal('quickRollModal');
      document.getElementById('diceHelpPopover').classList.remove('show');
      closeHpPopup();
      if (activeRoll) clearActiveRoll();
    }
    if (activeRoll) {
      if (e.key === '1') setRollMode('single');
      else if (e.key === '2') setRollMode('aoe');
      else if (e.key === '3') setRollMode('spread');
      else if (e.key === 'Enter' && activeRoll.mode === 'aoe') applyAoE();
      if (activeRoll.mode === 'single' && lastTargetId) {
        const key = e.key.toLowerCase();
        if (key === 'd') { applyDamage(lastTargetId, getSelectedSum()); clearSelection(); }
        else if (key === 'h') { applyHeal(lastTargetId, getSelectedSum()); clearSelection(); }
        else if (key === 't') { applyTempHp(lastTargetId, getSelectedSum()); clearSelection(); }
      }
    }
  });
  ['charModal', 'statusModal', 'quickRollModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal(id);
    });
  });
  document.getElementById('diceExpression').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') rollExpression();
  });
}

init();

