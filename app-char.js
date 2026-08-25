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


function closeModal(id) { document.getElementById(id).classList.remove('show'); }





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

const CHARACTER_PRESETS = [
  {
    name: 'Воин',
    type: 'pc',
    cls: 'Воин',
    level: 1,
    ac: 16,
    init: 1,
    color: '#e94560',
    abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 12, cha: 10 },
    useHpFormula: true,
    hpBase: 10,
    hpPerLevel: 6,
    hpConFactor: 1,
    description: 'Крепкий боец ближнего боя.',
    spellAbility: '',
    spellSaveDC: 0,
    cantripBonus: 0
  },
  {
    name: 'Волшебник',
    type: 'pc',
    cls: 'Волшебник',
    level: 1,
    ac: 12,
    init: 2,
    color: '#48dbfb',
    abilities: { str: 8, dex: 14, con: 12, int: 15, wis: 10, cha: 13 },
    useHpFormula: true,
    hpBase: 6,
    hpPerLevel: 4,
    hpConFactor: 1,
    description: 'Владеет тайной магией.',
    spellAbility: 'int',
    spellSaveDC: 13,
    cantripBonus: 5
  },
  {
    name: 'Жрец',
    type: 'pc',
    cls: 'Жрец',
    level: 1,
    ac: 14,
    init: 0,
    color: '#ffd32a',
    abilities: { str: 14, dex: 10, con: 12, int: 10, wis: 15, cha: 13 },
    useHpFormula: true,
    hpBase: 8,
    hpPerLevel: 5,
    hpConFactor: 1,
    description: 'Поддержка и лечение.',
    spellAbility: 'wis',
    spellSaveDC: 13,
    cantripBonus: 5
  },
  {
    name: 'Плут',
    type: 'pc',
    cls: 'Плут',
    level: 1,
    ac: 14,
    init: 3,
    color: '#2ecc71',
    abilities: { str: 10, dex: 16, con: 12, int: 12, wis: 11, cha: 14 },
    useHpFormula: true,
    hpBase: 8,
    hpPerLevel: 5,
    hpConFactor: 1,
    description: 'Скрытный и ловкий.',
    spellAbility: '',
    spellSaveDC: 0,
    cantripBonus: 0
  },
  {
    name: 'Гоблин',
    type: 'npc',
    cls: 'Гоблин',
    level: 1,
    ac: 15,
    init: 2,
    color: '#a3b18a',
    abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    useHpFormula: false,
    hpMax: 7,
    description: 'Быстрый и злобный.',
    spellAbility: '',
    spellSaveDC: 0,
    cantripBonus: 0
  },
  {
    name: 'Орк',
    type: 'npc',
    cls: 'Орк',
    level: 1,
    ac: 13,
    init: 0,
    color: '#b08968',
    abilities: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
    useHpFormula: false,
    hpMax: 15,
    description: 'Свирепый воин.',
    spellAbility: '',
    spellSaveDC: 0,
    cantripBonus: 0
  }
];

function presetHpMax(p) {
  if (!p.useHpFormula) return p.hpMax || 1;

  const con = p.abilities && p.abilities.con ? p.abilities.con : 10;
  const conMod = Math.floor((con - 10) / 2);
  const levelCount = Math.max(0, (p.level || 1) - 1);
  const factor = typeof p.hpConFactor === 'number' ? p.hpConFactor : 1;

  let hp = (p.hpBase || 0) + conMod * factor + levelCount * ((p.hpPerLevel || 0) + conMod * factor);
  hp = Math.round(hp);

  return hp > 0 ? hp : 1;
}

function renderPresetCatalog() {
  const body = document.getElementById('presetCatalogBody');
  if (!body) return;

  let html = '';

  CHARACTER_PRESETS.forEach(function (p, i) {
    const hp = presetHpMax(p);
    const typeLabel = p.type === 'pc' ? 'PC' : 'NPC';

    html +=
      '<div class="preset-item" onclick="addCharacterFromPreset(' + i + ')">' +
      '<div class="preset-info">' +
      '<div class="preset-name">' + escapeHtml(p.name) + '</div>' +
      '<div class="preset-meta">' + typeLabel + ' · ' + escapeHtml(p.cls || '') + ' · Ур. ' + (p.level || 1) + ' · HP ' + hp + '</div>' +
      '</div>' +
      '<div class="preset-add">+</div>' +
      '</div>';
  });

  body.innerHTML = html;
}

function addCharacterFromPreset(index) {
  const p = CHARACTER_PRESETS[index];
  if (!p) return;

  const abilities = p.abilities ? p.abilities : { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const hpMax = presetHpMax(p);

  characters.push({
    id: nextId++,
    type: p.type || 'pc',
    name: p.name || 'Пресет',
    cls: p.cls || '',
    level: p.level || 1,
    ac: p.ac || 10,
    init: p.init || 0,
    hpMax: hpMax,
    hpCur: hpMax,
    color: p.color || '#e94560',
    maxRolls: 0,
    description: p.description || '',
    spellAbility: p.spellAbility || '',
    spellSaveDC: p.spellSaveDC || 0,
    cantripBonus: p.cantripBonus || 0,
    abilities: abilities,
    useHpFormula: p.useHpFormula ? true : false,
    hpBase: typeof p.hpBase === 'number' ? p.hpBase : 0,
    hpPerLevel: typeof p.hpPerLevel === 'number' ? p.hpPerLevel : 0,
    hpConFactor: typeof p.hpConFactor === 'number' ? p.hpConFactor : 1,
    statuses: [],
    x: Math.random() * 300,
    y: Math.random() * 300
  });

  if (typeof closePresetCatalog === 'function') closePresetCatalog();
  if (typeof renderAll === 'function') renderAll();
}

function openPresetCatalog() {
  renderPresetCatalog();
  const modal = document.getElementById('presetCatalogModal');
  if (modal) modal.classList.add('show');
}

function openCharacterModal(mode, charId) {
  if (typeof closeCharDetails === 'function') closeCharDetails();
  if (typeof closePresetCatalog === 'function') closePresetCatalog();

  const editMode = mode === 'edit';
  let c = null;
  let type = 'pc';

  if (editMode) {
    c = characters.find(function (ch) { return ch.id === charId; });
    if (!c) return;
    type = c.type || 'pc';
  } else if (mode === 'create-npc') {
    type = 'npc';
  }

  charFormSet('charType', type);
  charFormSet('charEditId', editMode ? String(c.id) : '');

  const title = document.getElementById('modalTitle');
  if (title) {
    if (editMode) title.textContent = 'Редактировать: ' + c.name;
    else if (type === 'npc') title.textContent = 'Создать NPC';
    else title.textContent = 'Создать персонажа';
  }

  const saveBtn = document.querySelector('#charModal .btn-primary');
  if (saveBtn) saveBtn.textContent = editMode ? 'Сохранить' : 'Добавить';

  if (editMode) {
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
  } else {
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
      colorNode.value = typeof getColor === 'function' ? getColor() : '#e94560';
      selectedColor = colorNode.value;
    }
  }

  if (typeof renderColorPicker === 'function') renderColorPicker();

  const modal = document.getElementById('charModal');
  if (modal) modal.classList.add('show');
}


function openCharacterEditor(charId) {
  openCharacterModal('edit', charId);
}

function openCharMenu(event, charId) {
  event.stopPropagation();

  const menu = document.getElementById('charActionMenu');
  if (!menu) return;

  const c = characters.find(function (ch) { return ch.id === charId; });
  if (!c) return;

  menu.innerHTML =
    '<button onclick="openCharacterModal(\'edit\', ' + charId + '); closeCharMenu();">Редактировать</button>' +
    '<button onclick="openCharDetails(' + charId + '); closeCharMenu();">Детали</button>' +
    '<button onclick="openStatusHub(' + charId + '); closeCharMenu();">Статусы</button>' +
    '<button onclick="openQuickRollModal(' + charId + '); closeCharMenu();">Быстрый бросок</button>' +
    '<button onclick="changeHp(' + charId + ', 1); closeCharMenu();">+1 HP</button>' +
    '<button onclick="changeHp(' + charId + ', -1); closeCharMenu();">-1 HP</button>' +
    '<button onclick="promptTempHp(' + charId + '); closeCharMenu();">Временные HP</button>' +
    '<button onclick="removeCharacter(' + charId + '); closeCharMenu();">Удалить</button>';

  const rect = event.currentTarget.getBoundingClientRect();

  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.classList.add('show');

  const menuRect = menu.getBoundingClientRect();

  if (menuRect.bottom > window.innerHeight) {
    menu.style.top = Math.max(4, rect.top - menuRect.height - 4) + 'px';
  }

  if (menuRect.right > window.innerWidth) {
    menu.style.left = Math.max(4, window.innerWidth - menuRect.width - 4) + 'px';
  }
}

function closeCharMenu() {
  const menu = document.getElementById('charActionMenu');
  if (menu) menu.classList.remove('show');
}

document.addEventListener('click', function () {
  closeCharMenu();
});

function onCardNameClick(event, charId) {
  if (window.activeRoll) return;
  if (window.activeSpell && window.activeSpell.selecting) return;
  event.stopPropagation();
  openCharDetails(charId);
}

function detailsChangeHp(charId, delta) {
  changeHp(charId, delta);
  openCharDetails(charId);
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

  const actions =
    '<div class="details-actions">' +
    '<button onclick="closeCharDetails(); openCharacterModal(\'edit\', ' + c.id + ');">Редактировать</button>' +
    '<button onclick="closeCharDetails(); openStatusModal(' + c.id + ');">Статусы</button>' +
    '<button onclick="closeCharDetails(); openQuickRollModal(' + c.id + ');">Быстрый бросок</button>' +
    '<button onclick="detailsChangeHp(' + c.id + ', 1);">+1 HP</button>' +
    '<button onclick="detailsChangeHp(' + c.id + ', -1);">-1 HP</button>' +
    '<button onclick="closeCharDetails(); promptTempHp(' + c.id + ');">Временные HP</button>' +
    '<button onclick="closeCharDetails(); removeCharacter(' + c.id + ');">Удалить</button>' +
    '</div>';

  const info =
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

  document.getElementById('charDetailsTitle').textContent = c.name;
  document.getElementById('charDetailsBody').innerHTML = actions + info;
  document.getElementById('charDetailsModal').classList.add('show');
}

let statusHubTarget = 0;

function openStatusHub(charId) {
  statusHubTarget = charId || 0;
  const modal = document.getElementById('statusHubModal');
  if (modal) modal.classList.add('show');
}

function closeStatusHub() {
  const modal = document.getElementById('statusHubModal');
  if (modal) modal.classList.remove('show');
}

function statusHubOpenCatalog() {
  const charId = statusHubTarget;
  closeStatusHub();
  if (typeof openStatusModal === 'function') openStatusModal(charId);
}

function statusHubOpenConstructor() {
  closeStatusHub();

  if (typeof openStatusWizard === 'function') {
    openStatusWizard();
    return;
  }

  if (typeof statusWizard === 'function') {
    statusWizard();
    return;
  }

  if (typeof openStatusEditor === 'function') {
    openStatusEditor();
    return;
  }

  if (typeof openStatusConstructor === 'function') {
    openStatusConstructor();
    return;
  }

  alert('Конструктор статусов не найден');
}

function getAbilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function calculateHpFromCon(hitDie, con, level) {
  const conMod = getAbilityMod(con);
  const maxAtFirst = hitDie + conMod;
  const avgPerLevel = Math.floor(hitDie / 2) + 1 + conMod;
  const hp = maxAtFirst + Math.max(0, level - 1) * avgPerLevel;
  return Math.max(1, hp);
}

function expToLevel(exp) {
  const table = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  let level = 1;
  for (let i = 0; i < table.length; i++) {
    if (exp >= table[i]) level = i + 1;
  }
  return Math.min(20, level);
}

function openModal(type) {
  document.getElementById('charType').value = type;
  document.getElementById('charEditId').value = '';
  document.getElementById('modalTitle').textContent = type === 'pc' ? 'Добавить персонажа' : 'Добавить NPC';
  document.getElementById('charName').value = '';
  document.getElementById('charClass').value = '';
  document.getElementById('charLevel').value = 1;
  document.getElementById('charExp').value = 0;
  document.getElementById('charAc').value = 10;
  document.getElementById('charInit').value = 0;
  document.getElementById('charHp').value = 10;
  document.getElementById('charStr').value = 10;
  document.getElementById('charDex').value = 10;
  document.getElementById('charCon').value = 10;
  document.getElementById('charInt').value = 10;
  document.getElementById('charWis').value = 10;
  document.getElementById('charCha').value = 10;
  document.getElementById('charHitDie').value = '8';
  document.getElementById('charColor').value = getColor();
  selectedColor = document.getElementById('charColor').value;
  document.getElementById('charDescription').value = '';
  if (typeof renderColorPicker === 'function') renderColorPicker();
  document.getElementById('charModal').classList.add('show');
}

function openCharacterEditor(charId) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  document.getElementById('charType').value = c.type || 'pc';
  document.getElementById('charEditId').value = String(c.id);
  document.getElementById('modalTitle').textContent = 'Редактировать: ' + c.name;
  document.getElementById('charName').value = c.name || '';
  document.getElementById('charClass').value = c.cls || '';
  document.getElementById('charLevel').value = c.level || 1;
  document.getElementById('charExp').value = c.exp || 0;
  document.getElementById('charAc').value = c.ac || 10;
  document.getElementById('charInit').value = c.init || 0;
  document.getElementById('charHp').value = c.hpMax || 10;
  document.getElementById('charStr').value = c.abilities ? c.abilities.str : 10;
  document.getElementById('charDex').value = c.abilities ? c.abilities.dex : 10;
  document.getElementById('charCon').value = c.abilities ? c.abilities.con : 10;
  document.getElementById('charInt').value = c.abilities ? c.abilities.int : 10;
  document.getElementById('charWis').value = c.abilities ? c.abilities.wis : 10;
  document.getElementById('charCha').value = c.abilities ? c.abilities.cha : 10;
  document.getElementById('charHitDie').value = c.hitDie || '8';
  document.getElementById('charColor').value = c.color || '#e94560';
  selectedColor = c.color || '#e94560';
  document.getElementById('charDescription').value = c.description || '';
  if (typeof renderColorPicker === 'function') renderColorPicker();
  document.getElementById('charModal').classList.add('show');
}

function saveCharacter() {
  const type = document.getElementById('charType').value;
  const editId = document.getElementById('charEditId').value;
  const name = document.getElementById('charName').value.trim() || 'Безымянный';
  const cls = document.getElementById('charClass').value || '—';
  const exp = parseInt(document.getElementById("charExp").value) || 0;
  const level = expToLevel(exp);
  const ac = parseInt(document.getElementById('charAc').value) || 10;
  const init = parseInt(document.getElementById('charInit').value) || 0;
  const abilities = {
    str: parseInt(document.getElementById('charStr').value) || 10,
    dex: parseInt(document.getElementById('charDex').value) || 10,
    con: parseInt(document.getElementById('charCon').value) || 10,
    int: parseInt(document.getElementById('charInt').value) || 10,
    wis: parseInt(document.getElementById('charWis').value) || 10,
    cha: parseInt(document.getElementById('charCha').value) || 10
  };
  const hitDie = parseInt(document.getElementById('charHitDie').value) || 8;
  const color = selectedColor || getColor();
  const description = document.getElementById('charDescription').value.trim();
  const hpMax = calculateHpFromCon(hitDie, abilities.con, level);

  if (editId !== '') {
    const c = characters.find(ch => ch.id === parseInt(editId));
    if (c) {
      c.type = type;
      c.name = name;
      c.cls = cls;
      c.level = level;
      c.exp = exp;
      c.ac = ac;
      c.init = init;
      c.abilities = abilities;
      c.hitDie = hitDie;
      c.color = color;
      c.description = description;
      const oldMax = c.hpMax;
      c.hpMax = hpMax;
      if (oldMax !== hpMax) {
        c.hpCur = Math.min(c.hpCur, hpMax);
        if (c.hpCur < 0) c.hpCur = 0;
      }
    }
  } else {
    const map = document.getElementById('mapContainer');
    characters.push({
      id: nextId++,
      type,
      name,
      cls,
      level,
      exp,
      ac,
      init,
      abilities,
      hitDie,
      hpMax,
      hpCur: hpMax,
      color,
      description,
      statuses: [],
      quickRolls: [],
      tempHp: 0,
      x: 100 + Math.random() * (map.clientWidth - 200),
      y: 100 + Math.random() * (map.clientHeight - 200)
    });
  }
  closeModal('charModal');
  renderAll();
}
