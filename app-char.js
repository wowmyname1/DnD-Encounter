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


function openModal(type) {
  document.getElementById('charType').value = type;
  document.getElementById('modalTitle').textContent = type === 'pc' ? 'Добавить персонажа' : 'Добавить NPC';
  document.getElementById('charName').value = '';
  document.getElementById('charClass').value = '';
  document.getElementById('charLevel').value = 1;
  document.getElementById('charAc').value = 10;
  document.getElementById('charInit').value = 0;
  document.getElementById('charHp').value = 1;
  document.getElementById('charColor').value = getColor();
  selectedColor = document.getElementById('charColor').value;

  document.getElementById('charStr').value = 10;
  document.getElementById('charDex').value = 10;
  document.getElementById('charCon').value = 10;
  document.getElementById('charInt').value = 10;
  document.getElementById('charWis').value = 10;
  document.getElementById('charCha').value = 10;

  document.getElementById('charUseHpFormula').checked = false;
  document.getElementById('charHpBase').value = 0;
  document.getElementById('charHpPerLevel').value = 0;
  document.getElementById('charHpConFactor').value = 1;

  document.getElementById('charDescription').value = '';
  document.getElementById('charSpellAbility').value = 'int';
  document.getElementById('charSpellSaveDC').value = 0;
  document.getElementById('charCantripBonus').value = 0;

  renderColorPicker();
  renderStatusGrid('permanent');
  renderStatusGrid('timed');
  document.getElementById('charModal').classList.add('show');
}

function saveCharacter() {
  const type = document.getElementById('charType').value;
  const name = document.getElementById('charName').value.trim();
  const cls = document.getElementById('charClass').value;
  const level = parseInt(document.getElementById('charLevel').value) || 1;
  const ac = parseInt(document.getElementById('charAc').value) || 10;
  const init = parseInt(document.getElementById('charInit').value) || 0;
  const hpInput = parseInt(document.getElementById('charHp').value) || 1;
  const description = document.getElementById('charDescription').value.trim();
  const spellAbility = document.getElementById('charSpellAbility').value;
  const spellSaveDC = parseInt(document.getElementById('charSpellSaveDC').value) || 0;
  const cantripBonus = parseInt(document.getElementById('charCantripBonus').value) || 0;
  const color = selectedColor || getColor();

  const abilities = {
    str: parseInt(document.getElementById('charStr').value) || 10,
    dex: parseInt(document.getElementById('charDex').value) || 10,
    con: parseInt(document.getElementById('charCon').value) || 10,
    int: parseInt(document.getElementById('charInt').value) || 10,
    wis: parseInt(document.getElementById('charWis').value) || 10,
    cha: parseInt(document.getElementById('charCha').value) || 10
  };

  const useHpFormula = document.getElementById('charUseHpFormula').checked;
  const hpBase = parseFloat(document.getElementById('charHpBase').value) || 0;
  const hpPerLevel = parseFloat(document.getElementById('charHpPerLevel').value) || 0;
  const hpConFactor = parseFloat(document.getElementById('charHpConFactor').value) || 0;

  let hpMax = hpInput;

  if (useHpFormula) {
    const conMod = Math.floor((abilities.con - 10) / 2);
    const levelCount = Math.max(0, level - 1);
    hpMax = hpBase + conMod * hpConFactor + levelCount * (hpPerLevel + conMod * hpConFactor);
    hpMax = Math.round(hpMax);
    if (hpMax < 1) hpMax = 1;
  }

  if (!name) {
    alert('Введите имя персонажа');
    return;
  }

  characters.push({
    id: nextId++,
    type: type,
    name: name,
    cls: cls,
    level: level,
    ac: ac,
    init: init,
    hpMax: hpMax,
    hpCur: hpMax,
    color: color,
    maxRolls: 0,
    description: description,
    spellAbility: spellAbility,
    spellSaveDC: spellSaveDC,
    cantripBonus: cantripBonus,
    abilities: abilities,
    useHpFormula: useHpFormula,
    hpBase: hpBase,
    hpPerLevel: hpPerLevel,
    hpConFactor: hpConFactor,
    statuses: [],
    x: Math.random() * 300,
    y: Math.random() * 300
  });

  closeModal();
  renderAll();
}
