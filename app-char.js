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

function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function formatMod(mod) {
  if (mod >= 0) return '+' + mod;
  return '' + mod;
}

function openCharDetails(charId) {
  const c = characters.find(function (ch) { return ch.id === charId; });
  if (!c) return;

  const a = c.abilities ? c.abilities : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  let hpFormulaText = 'Формула HP не включена';
  if (c.useHpFormula) {
    hpFormulaText = 'База: ' + c.hpBase + ' | За уровень: ' + c.hpPerLevel + ' | Коэф. CON: ' + c.hpConFactor + ' | Мод. CON: ' + formatMod(abilityMod(a.con));
  }

  const description = c.description ? escapeHtml(c.description) : 'Описания нет.';

  document.getElementById('charDetailsTitle').textContent = c.name;

  document.getElementById('charDetailsBody').innerHTML =
    '<div class="details-grid">' +
    '<div class="detail-box"><div class="detail-label">STR</div><div class="detail-value">' + a.str + ' (' + formatMod(abilityMod(a.str)) + ')</div></div>' +
    '<div class="detail-box"><div class="detail-label">DEX</div><div class="detail-value">' + a.dex + ' (' + formatMod(abilityMod(a.dex)) + ')</div></div>' +
    '<div class="detail-box"><div class="detail-label">CON</div><div class="detail-value">' + a.con + ' (' + formatMod(abilityMod(a.con)) + ')</div></div>' +
    '<div class="detail-box"><div class="detail-label">INT</div><div class="detail-value">' + a.int + ' (' + formatMod(abilityMod(a.int)) + ')</div></div>' +
    '<div class="detail-box"><div class="detail-label">WIS</div><div class="detail-value">' + a.wis + ' (' + formatMod(abilityMod(a.wis)) + ')</div></div>' +
    '<div class="detail-box"><div class="detail-label">CHA</div><div class="detail-value">' + a.cha + ' (' + formatMod(abilityMod(a.cha)) + ')</div></div>' +
    '</div>' +
    '<div class="detail-box"><div class="detail-label">HP</div><div class="detail-text">' + c.hpCur + ' / ' + c.hpMax + '</div></div>' +
    '<div class="detail-box"><div class="detail-label">AC / Инициатива</div><div class="detail-text">' + c.ac + ' / ' + c.init + '</div></div>' +
    '<div class="detail-box"><div class="detail-label">Формула HP</div><div class="detail-text">' + escapeHtml(hpFormulaText) + '</div></div>' +
    '<div class="detail-box"><div class="detail-label">Описание</div><div class="detail-text">' + description + '</div></div>';

  document.getElementById('charDetailsModal').classList.add('show');
}

function closeCharDetails() {
  document.getElementById('charDetailsModal').classList.remove('show');
}

function charFormSet(id, value) {
  const node = document.getElementById(id);
  if (node) node.value = value;
}

function charFormCheck(id, value) {
  const node = document.getElementById(id);
  if (node) node.checked = value;
}

function charFormString(id) {
  const node = document.getElementById(id);
  return node ? node.value : '';
}

function charFormInt(id, fallback) {
  const node = document.getElementById(id);
  if (!node) return fallback;
  const val = parseInt(node.value);
  return isNaN(val) ? fallback : val;
}

function charFormFloat(id, fallback) {
  const node = document.getElementById(id);
  if (!node) return fallback;
  const val = parseFloat(node.value);
  return isNaN(val) ? fallback : val;
}

function openModal(type) {
  charFormSet('charType', type);
  charFormSet('charEditId', '');

  const title = document.getElementById('modalTitle');
  if (title) title.textContent = type === 'pc' ? 'Добавить персонажа' : 'Добавить NPC';

  charFormSet('charName', '');
  charFormSet('charClass', '');
  charFormSet('charLevel', 1);
  charFormSet('charAc', 10);
  charFormSet('charInit', 0);
  charFormSet('charHp', 1);

  charFormSet('charStr', 10);
  charFormSet('charDex', 10);
  charFormSet('charCon', 10);
  charFormSet('charInt', 10);
  charFormSet('charWis', 10);
  charFormSet('charCha', 10);

  charFormCheck('charUseHpFormula', false);
  charFormSet('charHpBase', 0);
  charFormSet('charHpPerLevel', 0);
  charFormSet('charHpConFactor', 1);

  charFormSet('charDescription', '');
  charFormSet('charSpellAbility', 'int');
  charFormSet('charSpellSaveDC', 0);
  charFormSet('charCantripBonus', 0);

  const colorNode = document.getElementById('charColor');
  if (colorNode) {
    const fallbackColor = '#e94560';
    colorNode.value = typeof getColor === 'function' ? getColor() : fallbackColor;
    selectedColor = colorNode.value;
  }

  if (typeof renderColorPicker === 'function') renderColorPicker();

  const modal = document.getElementById('charModal');
  if (modal) modal.classList.add('show');
}

function saveCharacter() {
  const type = charFormString('charType') || 'pc';
  const name = charFormString('charName').trim();

  if (!name) {
    alert('Введите имя персонажа');
    return;
  }

  const cls = charFormString('charClass');
  const level = charFormInt('charLevel', 1);
  const ac = charFormInt('charAc', 10);
  const init = charFormInt('charInit', 0);
  const hpInput = charFormInt('charHp', 1);
  const description = charFormString('charDescription').trim();
  const spellAbility = charFormString('charSpellAbility');
  const spellSaveDC = charFormInt('charSpellSaveDC', 0);
  const cantripBonus = charFormInt('charCantripBonus', 0);

  let color = selectedColor;
  if (!color) color = typeof getColor === 'function' ? getColor() : '#e94560';

  const abilities = {
    str: charFormInt('charStr', 10),
    dex: charFormInt('charDex', 10),
    con: charFormInt('charCon', 10),
    int: charFormInt('charInt', 10),
    wis: charFormInt('charWis', 10),
    cha: charFormInt('charCha', 10)
  };

  const useNode = document.getElementById('charUseHpFormula');
  const useHpFormula = useNode ? useNode.checked : false;
  const hpBase = charFormFloat('charHpBase', 0);
  const hpPerLevel = charFormFloat('charHpPerLevel', 0);
  const hpConFactor = charFormFloat('charHpConFactor', 0);

  let hpMax = hpInput;

  if (useHpFormula) {
    const conMod = Math.floor((abilities.con - 10) / 2);
    const levelCount = Math.max(0, level - 1);
    hpMax = hpBase + conMod * hpConFactor + levelCount * (hpPerLevel + conMod * hpConFactor);
    hpMax = Math.round(hpMax);
    if (hpMax < 1) hpMax = 1;
  }

  const editId = charFormInt('charEditId', 0);
  const existing = editId > 0 ? characters.find(function (ch) { return ch.id === editId; }) : null;

  if (existing) {
    existing.type = type;
    existing.name = name;
    existing.cls = cls;
    existing.level = level;
    existing.ac = ac;
    existing.init = init;
    existing.color = color;
    existing.description = description;
    existing.spellAbility = spellAbility;
    existing.spellSaveDC = spellSaveDC;
    existing.cantripBonus = cantripBonus;
    existing.abilities = abilities;
    existing.useHpFormula = useHpFormula;
    existing.hpBase = hpBase;
    existing.hpPerLevel = hpPerLevel;
    existing.hpConFactor = hpConFactor;

    const oldMax = existing.hpMax;
    existing.hpMax = hpMax;

    if (oldMax !== hpMax) {
      existing.hpCur = Math.min(existing.hpCur, hpMax);
      if (existing.hpCur < 0) existing.hpCur = 0;
    }
  } else {
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
  }

  if (typeof closeModal === 'function') closeModal();
  if (typeof renderAll === 'function') renderAll();
}

function openCharacterEditor(charId) {
  const c = characters.find(function (ch) { return ch.id === charId; });
  if (!c) return;

  if (typeof closeCharDetails === 'function') closeCharDetails();

  charFormSet('charType', c.type || 'pc');
  charFormSet('charEditId', String(c.id));

  const title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Редактировать: ' + c.name;

  charFormSet('charName', c.name || '');
  charFormSet('charClass', c.cls || '');
  charFormSet('charLevel', c.level || 1);
  charFormSet('charAc', c.ac || 10);
  charFormSet('charInit', c.init || 0);
  charFormSet('charHp', c.hpMax || 1);

  const a = c.abilities ? c.abilities : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  charFormSet('charStr', a.str);
  charFormSet('charDex', a.dex);
  charFormSet('charCon', a.con);
  charFormSet('charInt', a.int);
  charFormSet('charWis', a.wis);
  charFormSet('charCha', a.cha);

  charFormCheck('charUseHpFormula', c.useHpFormula ? true : false);
  charFormSet('charHpBase', typeof c.hpBase === 'number' ? c.hpBase : 0);
  charFormSet('charHpPerLevel', typeof c.hpPerLevel === 'number' ? c.hpPerLevel : 0);
  charFormSet('charHpConFactor', typeof c.hpConFactor === 'number' ? c.hpConFactor : 1);

  charFormSet('charDescription', c.description || '');
  charFormSet('charSpellAbility', typeof c.spellAbility === 'string' ? c.spellAbility : '');
  charFormSet('charSpellSaveDC', c.spellSaveDC || 0);
  charFormSet('charCantripBonus', c.cantripBonus || 0);

  const colorNode = document.getElementById('charColor');
  if (colorNode) {
    colorNode.value = c.color || '#e94560';
    selectedColor = colorNode.value;
  }

  if (typeof renderColorPicker === 'function') renderColorPicker();

  const modal = document.getElementById('charModal');
  if (modal) modal.classList.add('show');
}

function openPresetCatalog() {
  const body = document.getElementById('presetCatalogBody');
  if (body) body.innerHTML = '<div class="preset-item"><div class="preset-info"><div class="preset-name">Каталог готовится</div><div class="preset-meta">Пресеты появятся на следующем шаге</div></div></div>';
  const modal = document.getElementById('presetCatalogModal');
  if (modal) modal.classList.add('show');
}

function closePresetCatalog() {
  const modal = document.getElementById('presetCatalogModal');
  if (modal) modal.classList.remove('show');
}
