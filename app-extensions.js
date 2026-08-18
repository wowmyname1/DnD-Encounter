
// --- Каталоги ---
const SPELL_CATALOG = [
  { id: 'fireball', name: 'Огненный шар', level: 3, school: 'Воплощение', castingTime: '1 действие', range: '150 футов', duration: 'Мгновенная', classes: ['Волшебник', 'Чародей'], icon: '🔥', description: 'Яркий луч вспыхивает из вас к точке в пределах дистанции и взрывается огненным шаром.', logic: { targetMode: 'aoe', save: { ability: 'DEX', dcFormula: '8 + prof + mod' }, onFail: { type: 'damage', formula: '8d6', damageType: 'fire' }, onSuccess: { type: 'damage', formula: '4d6', damageType: 'fire' } } },
  { id: 'magic_missile', name: 'Волшебная стрела', level: 1, school: 'Воплощение', castingTime: '1 действие', range: '120 футов', duration: 'Мгновенная', classes: ['Волшебник', 'Чародей'], icon: '✨', description: 'Вы создаёте три светящихся дротика из магической силы.', logic: { targetMode: 'spread', save: null, onFail: { type: 'damage', formula: '1d4+1', damageType: 'force', count: 3 }, onSuccess: null } },
  { id: 'hold_person', name: 'Удержание личности', level: 2, school: 'Очарование', castingTime: '1 действие', range: '60 футов', duration: 'Концентрация, до 1 минуты', classes: ['Волшебник', 'Чародей', 'Бард', 'Жрец', 'Друид'], icon: '⛓️', description: 'Цель должна преуспеть в спасброске Мудрости, иначе станет парализованной.', logic: { targetMode: 'single', save: { ability: 'WIS', dcFormula: '8 + prof + mod' }, onFail: { type: 'applyStatus', statusId: 'paralyzed', duration: 10 }, onSuccess: null } },
  { id: 'cure_wounds', name: 'Лечение ран', level: 1, school: 'Воплощение', castingTime: '1 действие', range: 'Касание', duration: 'Мгновенная', classes: ['Жрец', 'Бард', 'Друид', 'Паладин', 'Следопыт'], icon: '💚', description: 'Существо восстанавливает хиты равные 1d8 + модификатор заклинательной характеристики.', logic: { targetMode: 'single', save: null, onFail: { type: 'heal', formula: '1d8+3' }, onSuccess: null } },
  { id: 'lightning_bolt', name: 'Молния', level: 3, school: 'Проявление', castingTime: '1 действие', range: '100 футов (линия 100×5)', duration: 'Мгновенная', classes: ['Волшебник', 'Чародей'], icon: '⚡', description: 'Разряд молнии длиной 100 футов и шириной 5 футов бьёт из вас.', logic: { targetMode: 'aoe', save: { ability: 'DEX', dcFormula: '8 + prof + mod' }, onFail: { type: 'damage', formula: '8d6', damageType: 'lightning' }, onSuccess: { type: 'damage', formula: '4d6', damageType: 'lightning' } } },
  { id: 'shield_spell', name: 'Щит', level: 1, school: 'Ограждение', castingTime: '1 реакция', range: 'На себя', duration: '1 раунд', classes: ['Волшебник', 'Чародей'], icon: '🛡️', description: 'Невидимый барьер магической силы появляется и защищает вас.', logic: { targetMode: 'single', selfOnly: true, save: null, onFail: { type: 'applyStatus', statusId: 'shield_of_faith', duration: 1, acBonus: 5 }, onSuccess: null } }
];

const STATUS_CATALOG = [
  { id: 'burning_custom', name: 'Горит (продвинутый)', icon: '🔥', color: '#e67e22', description: 'Начало хода: 1d6 урона огнём. Можно снять действием.', logic: { nodes: [ { id: 1, type: 'trigger', event: 'turnStart' }, { id: 2, type: 'action', action: 'damage', formula: '1d6', damageType: 'fire', parentId: 1 }, { id: 3, type: 'trigger', event: 'manual', label: 'Потушить (действие)' }, { id: 4, type: 'action', action: 'removeStatus', statusId: 'self', parentId: 3 } ] } },
  { id: 'regen_custom', name: 'Регенерация', icon: '💚', color: '#2ecc71', description: 'Начало хода: восстановление 5 HP. Снимается, если HP = HP max.', logic: { nodes: [ { id: 1, type: 'trigger', event: 'turnStart' }, { id: 2, type: 'action', action: 'heal', formula: '5', parentId: 1 }, { id: 3, type: 'condition', check: 'hpPercent', op: '>=', value: 100, parentId: 2 }, { id: 4, type: 'action', action: 'removeStatus', statusId: 'self', parentId: 3 } ] } },
  { id: 'low_hp_panic', name: 'Паника (низкие HP)', icon: '😱', color: '#9b59b6', description: 'Автоматически накладывается, если HP < 25%. Снимается при HP > 50%.', logic: { nodes: [ { id: 1, type: 'trigger', event: 'turnStart' }, { id: 2, type: 'condition', check: 'hpPercent', op: '<=', value: 25, parentId: 1 }, { id: 3, type: 'condition', check: 'hasStatus', statusId: 'self', op: 'not', parentId: 2 }, { id: 4, type: 'action', action: 'applyStatus', statusId: 'frightened', duration: 3, parentId: 3 }, { id: 5, type: 'condition', check: 'hpPercent', op: '>=', value: 50, parentId: 1 }, { id: 6, type: 'action', action: 'removeStatus', statusId: 'self', parentId: 5 } ] } }
];

let customStatuses = [];
let customSpells = [];

// --- Визарды ---
let statusWizard = { id: null, name: '', icon: '✨', color: '#e94560', description: '', nodes: [] };
let spellWizard = { id: null, name: '', level: 0, school: 'Воплощение', icon: '🔮', classes: [], castingTime: '1 действие', range: '60 футов', duration: 'Мгновенная', description: '', logic: { targetMode: 'single', save: null, onFail: null, onSuccess: null } };

function openStatusCatalog() { document.getElementById('statusCatalogModal').classList.add('show'); renderStatusCatalog(); }
function openSpellCatalog() { document.getElementById('spellCatalogModal').classList.add('show'); renderSpellCatalog(); }

function renderStatusCatalog() {
  const grid = document.getElementById('statusCatalogGrid');
  const search = (document.getElementById('statusSearch').value || '').toLowerCase();
  let allStatuses = [...STATUS_CATALOG, ...customStatuses];
  if (search) allStatuses = allStatuses.filter(s => s.name.toLowerCase().includes(search));
  grid.innerHTML = allStatuses.map(s => `
    <div class="catalog-item" onclick="editStatusFromCatalog('${s.id}')">
      <div class="catalog-item-header"><div class="catalog-item-name">${s.icon} ${escapeHtml(s.name)}</div></div>
      <div class="catalog-item-desc">${s.description || 'Без описания'}</div>
      <div class="catalog-item-actions">
        <button onclick="event.stopPropagation(); editStatusFromCatalog('${s.id}')">✏️ Редакт.</button>
        <button onclick="event.stopPropagation(); applyStatusFromCatalog('${s.id}')">➕ Применить</button>
      </div>
    </div>`).join('') || '<p style="color:var(--text-dim); text-align:center; padding:20px;">Нет статусов в каталоге</p>';
}

function renderSpellCatalog() {
  const grid = document.getElementById('spellCatalogGrid');
  const search = (document.getElementById('spellSearch').value || '').toLowerCase();
  const levelFilter = document.getElementById('spellLevelFilter').value;
  let spells = [...SPELL_CATALOG, ...customSpells];
  if (search) spells = spells.filter(s => s.name.toLowerCase().includes(search));
  if (levelFilter !== '') spells = spells.filter(s => s.level === parseInt(levelFilter));
  grid.innerHTML = spells.map(s => `
    <div class="catalog-item" onclick="editSpellFromCatalog('${s.id}')">
      <div class="catalog-item-header">
        <div class="catalog-item-name">${s.icon} ${escapeHtml(s.name)}</div>
        <div class="catalog-item-level">Ур. ${s.level || 'Заговор'}</div>
      </div>
      <div class="catalog-item-meta">
        <span>📚 ${s.school}</span><span>⏱️ ${s.castingTime}</span><span>🎯 ${s.range}</span><span>⏳ ${s.duration}</span>
      </div>
      <div class="catalog-item-desc">${s.description || ''}</div>
      <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">${s.classes ? '👥 ' + s.classes.join(', ') : ''}</div>
      <div class="catalog-item-actions">
        <button onclick="event.stopPropagation(); editSpellFromCatalog('${s.id}')">✏️ Редакт.</button>
        <button class="cast-btn" onclick="event.stopPropagation(); castSpellFromCatalog('${s.id}')">🎯 Сотворить</button>
      </div>
    </div>`).join('') || '<p style="color:var(--text-dim); text-align:center; padding:20px;">Заклинания не найдены</p>';
}

function newStatusWizard() {
  statusWizard = { id: null, name: '', icon: '✨', color: '#e94560', description: '', nodes: [] };
  document.getElementById('statusCatalogModal').classList.remove('show');
  document.getElementById('statusWizardModal').classList.add('show');
  renderStatusWizard();
  switchWizardTab('basic');
}

function newSpellWizard() {
  spellWizard = { id: null, name: '', level: 0, school: 'Воплощение', icon: '🔮', classes: [], castingTime: '1 действие', range: '60 футов', duration: 'Мгновенная', description: '', logic: { targetMode: 'single', save: null, onFail: null, onSuccess: null } };
  document.getElementById('spellCatalogModal').classList.remove('show');
  document.getElementById('spellWizardModal').classList.add('show');
  renderSpellWizard();
  switchWizardTab('basic');
}

function switchWizardTab(tab) {
  document.querySelectorAll('.wizard-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.wizard-pane').forEach(p => p.classList.toggle('active', p.id === `wizard-${tab}`));
}

function renderStatusWizard() {
  document.getElementById('wizStatusName').value = statusWizard.name;
  document.getElementById('wizStatusIcon').value = statusWizard.icon;
  document.getElementById('wizStatusColor').value = statusWizard.color;
  document.getElementById('wizStatusDesc').value = statusWizard.description;
  renderNodes('statusNodesContainer', statusWizard.nodes, 'status');
}

function renderSpellWizard() {
  document.getElementById('wizSpellName').value = spellWizard.name;
  document.getElementById('wizSpellLevel').value = spellWizard.level;
  document.getElementById('wizSpellSchool').value = spellWizard.school;
  document.getElementById('wizSpellIcon').value = spellWizard.icon;
  document.getElementById('wizSpellTime').value = spellWizard.castingTime;
  document.getElementById('wizSpellRange').value = spellWizard.range;
  document.getElementById('wizSpellDuration').value = spellWizard.duration;
  document.getElementById('wizSpellDesc').value = spellWizard.description;
  document.querySelectorAll('.target-mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === spellWizard.logic.targetMode));
  renderSpellLogic();
}

function renderSpellLogic() {
  const container = document.getElementById('spellLogicContainer');
  const { save, onFail, onSuccess } = spellWizard.logic;
  container.innerHTML = `
    <div style="margin-bottom:16px; padding:12px; background:rgba(0,0,0,0.2); border-radius:8px;">
      <label style="font-size:0.8rem; color:var(--gold); font-weight:600; display:block; margin-bottom:8px;">🎲 Спасбросок (необязательно)</label>
      <div style="display:flex; gap:8px; align-items:center;">
        <select id="spellSaveAbility" onchange="updateSpellLogic()" style="flex:1; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px;">
          <option value="">Без спасброска</option>
          <option value="STR" ${save?.ability === 'STR' ? 'selected' : ''}>Сила</option>
          <option value="DEX" ${save?.ability === 'DEX' ? 'selected' : ''}>Ловкость</option>
          <option value="CON" ${save?.ability === 'CON' ? 'selected' : ''}>Телосложение</option>
          <option value="INT" ${save?.ability === 'INT' ? 'selected' : ''}>Интеллект</option>
          <option value="WIS" ${save?.ability === 'WIS' ? 'selected' : ''}>Мудрость</option>
          <option value="CHA" ${save?.ability === 'CHA' ? 'selected' : ''}>Харизма</option>
        </select>
        <input id="spellSaveDC" value="${save?.dcFormula || ''}" placeholder="DC формула (8+prof+mod)" onchange="updateSpellLogic()" style="flex:1; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; font-family:JetBrains Mono,monospace;">
      </div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div style="padding:12px; background:rgba(233,69,96,0.1); border:1px solid rgba(233,69,96,0.3); border-radius:8px;">
        <label style="font-size:0.8rem; color:var(--red); font-weight:600; display:block; margin-bottom:8px;">❌ При провале</label>
        <select onchange="updateSpellEffect('onFail', this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; margin-bottom:6px;">
          <option value="">Ничего</option>
          <option value="damage" ${onFail?.type === 'damage' ? 'selected' : ''}>Урон</option>
          <option value="heal" ${onFail?.type === 'heal' ? 'selected' : ''}>Лечение</option>
          <option value="applyStatus" ${onFail?.type === 'applyStatus' ? 'selected' : ''}>Наложить статус</option>
          <option value="removeStatus" ${onFail?.type === 'removeStatus' ? 'selected' : ''}>Снять статус</option>
        </select>
        ${renderEffectEditor('onFail', onFail)}
      </div>
      <div style="padding:12px; background:rgba(78,204,163,0.1); border:1px solid rgba(78,204,163,0.3); border-radius:8px;">
        <label style="font-size:0.8rem; color:var(--green); font-weight:600; display:block; margin-bottom:8px;">✅ При успехе</label>
        <select onchange="updateSpellEffect('onSuccess', this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; margin-bottom:6px;">
          <option value="">Ничего</option>
          <option value="damage" ${onSuccess?.type === 'damage' ? 'selected' : ''}>Урон (половина)</option>
          <option value="heal" ${onSuccess?.type === 'heal' ? 'selected' : ''}>Лечение</option>
          <option value="applyStatus" ${onSuccess?.type === 'applyStatus' ? 'selected' : ''}>Наложить статус</option>
        </select>
        ${renderEffectEditor('onSuccess', onSuccess)}
      </div>
    </div>`;
}

function renderEffectEditor(key, effect) {
  if (!effect) return '';
  if (effect.type === 'damage') {
    return `<input value="${effect.formula || ''}" placeholder="Напр.: 8d6" onchange="updateEffectField('${key}','formula',this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; margin-bottom:4px; font-family:JetBrains Mono,monospace;">
    <input value="${effect.damageType || 'force'}" placeholder="Тип урона" onchange="updateEffectField('${key}','damageType',this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px;">`;
  }
  if (effect.type === 'heal') {
    return `<input value="${effect.formula || ''}" placeholder="Напр.: 1d8+3" onchange="updateEffectField('${key}','formula',this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; font-family:JetBrains Mono,monospace;">`;
  }
  if (effect.type === 'applyStatus') {
    const allStatuses = [...STATUS_CATALOG, ...customStatuses, ...STATUS_DEFS.permanent, ...STATUS_DEFS.timed];
    const opts = allStatuses.map(s => `<option value="${s.id}" ${effect.statusId === s.id ? 'selected' : ''}>${s.icon || '✨'} ${s.name}</option>`).join('');
    return `<select onchange="updateEffectField('${key}','statusId',this.value)" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px; margin-bottom:4px;">${opts}</select>
    <input type="number" value="${effect.duration || 1}" placeholder="Длительность" onchange="updateEffectField('${key}','duration',parseInt(this.value))" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:var(--text); border-radius:4px;">`;
  }
  return '';
}

function updateSpellLogic() {
  const ability = document.getElementById('spellSaveAbility').value;
  const dcFormula = document.getElementById('spellSaveDC').value;
  spellWizard.logic.save = ability ? { ability, dcFormula } : null;
}

function updateSpellEffect(key, type) {
  if (!type) spellWizard.logic[key] = null;
  else spellWizard.logic[key] = { type };
  renderSpellLogic();
}

function updateEffectField(key, field, value) {
  if (spellWizard.logic[key]) spellWizard.logic[key][field] = value;
}

function setSpellTargetMode(mode) {
  spellWizard.logic.targetMode = mode;
  document.querySelectorAll('.target-mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
}

// --- Узловая система для статусов ---
function renderNodes(containerId, nodes, prefix) {
  const container = document.getElementById(containerId);
  const triggers = nodes.filter(n => n.type === 'trigger');
  const buildNodeTree = (nodeId, depth) => {
    const n = nodes.find(x => x.id === nodeId);
    if (!n) return '';
    const children = nodes.filter(c => c.parentId === n.id);
    return `
      <div class="node-item ${n.type}" style="margin-left:${depth * 20}px;">
        <div class="node-header">
          <div class="node-type">${nodeTypeLabel(n.type)}</div>
          <div class="node-title">${nodeTitle(n)}</div>
          <div class="node-desc">${describeNode(n)}</div>
          ${renderNodeConfig(n, prefix)}
        </div>
        <div class="node-actions-btns">
          ${n.type !== 'trigger' ? `<button onclick="addChildNode('${prefix}', ${n.id})">➕</button>` : ''}
          <button class="delete" onclick="deleteNode('${prefix}', ${n.id})">🗑️</button>
        </div>
      </div>
      ${children.map(c => buildNodeTree(c.id, depth + 1)).join('')}`;
  };
  container.innerHTML = triggers.map(t => `
    <div class="node-item trigger">
      <div class="node-header">
        <div class="node-type">⚡ Триггер</div>
        <div class="node-title">${triggerName(t.event)}</div>
        <div class="node-config">
          <select onchange="updateNodeField('${prefix}', ${t.id}, 'event', this.value)">
            <option value="turnStart" ${t.event === 'turnStart' ? 'selected' : ''}>Начало хода</option>
            <option value="turnEnd" ${t.event === 'turnEnd' ? 'selected' : ''}>Конец хода</option>
            <option value="takeDamage" ${t.event === 'takeDamage' ? 'selected' : ''}>Получение урона</option>
            <option value="dealDamage" ${t.event === 'dealDamage' ? 'selected' : ''}>Нанесение урона</option>
            <option value="manual" ${t.event === 'manual' ? 'selected' : ''}>Вручную (кнопка)</option>
          </select>
        </div>
      </div>
      <div class="node-actions-btns">
        <button onclick="addChildNode('${prefix}', ${t.id})">➕</button>
        <button class="delete" onclick="deleteNode('${prefix}', ${t.id})">🗑️</button>
      </div>
    </div>
    ${nodes.filter(c => c.parentId === t.id).map(c => buildNodeTree(c.id, 1)).join('')}`).join('') || '<p style="color:var(--text-dim); text-align:center; padding:20px;">Добавьте триггер для начала</p>';
}

function nodeTypeLabel(type) { return { trigger: '⚡ Триггер', condition: '❓ Условие', action: '⚙️ Действие', custom: '🧩 Custom' }[type]; }
function triggerName(event) { return { turnStart: 'Начало хода', turnEnd: 'Конец хода', takeDamage: 'Получение урона', dealDamage: 'Нанесение урона', manual: 'Вручную' }[event] || event; }

function nodeTitle(n) {
  if (n.type === 'condition') return { hpPercent: 'HP %', hasStatus: 'Есть статус', diceRoll: 'Бросок кубика' }[n.check] || n.check;
  if (n.type === 'action') return { damage: 'Нанести урон', heal: 'Лечение', applyStatus: 'Наложить статус', removeStatus: 'Снять статус', roll: 'Бросить кубик' }[n.action] || n.action;
  return n.label || '';
}

function describeNode(n) {
  if (n.type === 'condition') {
    if (n.check === 'hpPercent') return `HP ${n.op} ${n.value}%`;
    if (n.check === 'hasStatus') return `${n.op === 'not' ? 'Нет' : 'Есть'} статус: ${n.statusId || '?'}`;
    if (n.check === 'diceRoll') return `d20 ${n.op} ${n.value}`;
  }
  if (n.type === 'action') {
    if (n.action === 'damage') return `${n.formula || '?'} ${n.damageType || ''}`;
    if (n.action === 'heal') return n.formula || '?';
    if (n.action === 'applyStatus') return `${n.statusId || '?'} на ${n.duration || 1} раундов`;
    if (n.action === 'removeStatus') return n.statusId || '?';
    if (n.action === 'roll') return n.formula || '?';
  }
  return '';
}

function renderNodeConfig(n, prefix) {
  if (n.type === 'condition') {
    if (n.check === 'hpPercent') {
      return `<div class="node-config"><div class="row">
        <select onchange="updateNodeField('${prefix}',${n.id},'op',this.value)">
          <option value="<" ${n.op === '<' ? 'selected' : ''}><</option>
          <option value="<=" ${n.op === '<=' ? 'selected' : ''}><=</option>
          <option value=">" ${n.op === '>' ? 'selected' : ''}>></option>
          <option value=">=" ${n.op === '>=' ? 'selected' : ''}>>=</option>
          <option value="==" ${n.op === '==' ? 'selected' : ''}>=</option>
        </select>
        <input type="number" value="${n.value || 50}" onchange="updateNodeField('${prefix}',${n.id},'value',parseInt(this.value))">
      </div></div>`;
    }
    if (n.check === 'diceRoll') {
      return `<div class="node-config"><div class="row">
        <select onchange="updateNodeField('${prefix}',${n.id},'op',this.value)">
          <option value="<" ${n.op === '<' ? 'selected' : ''}><</option>
          <option value="<=" ${n.op === '<=' ? 'selected' : ''}><=</option>
          <option value=">" ${n.op === '>' ? 'selected' : ''}>></option>
          <option value=">=" ${n.op === '>=' ? 'selected' : ''}>>=</option>
        </select>
        <input type="number" value="${n.value || 10}" onchange="updateNodeField('${prefix}',${n.id},'value',parseInt(this.value))">
      </div></div>`;
    }
  }
  if (n.type === 'action') {
    if (n.action === 'damage' || n.action === 'heal' || n.action === 'roll') {
      return `<div class="node-config"><input value="${n.formula || ''}" placeholder="1d6+2" onchange="updateNodeField('${prefix}',${n.id},'formula',this.value)"></div>`;
    }
    if (n.action === 'applyStatus') {
      const allStatuses = [...STATUS_CATALOG, ...customStatuses, ...STATUS_DEFS.permanent, ...STATUS_DEFS.timed];
      const opts = allStatuses.map(s => `<option value="${s.id}" ${n.statusId === s.id ? 'selected' : ''}>${s.icon || '✨'} ${s.name}</option>`).join('');
      return `<div class="node-config"><div class="row">
        <select onchange="updateNodeField('${prefix}',${n.id},'statusId',this.value)">${opts}</select>
        <input type="number" value="${n.duration || 1}" onchange="updateNodeField('${prefix}',${n.id},'duration',parseInt(this.value))">
      </div></div>`;
    }
  }
  return '';
}

function addNode(prefix, type) {
  const wiz = prefix === 'status' ? statusWizard : spellWizard;
  const nodes = wiz.nodes;
  const id = nodes.length ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
  const defaults = { trigger: { event: 'turnStart' }, condition: { check: 'hpPercent', op: '<', value: 50 }, action: { action: 'damage', formula: '1d6' } };
  nodes.push({ id, type, parentId: null, ...defaults[type] });
  if (prefix === 'status') renderStatusWizard();
}

function addChildNode(prefix, parentId) {
  const wiz = prefix === 'status' ? statusWizard : spellWizard;
  const nodes = wiz.nodes;
  const parent = nodes.find(n => n.id === parentId);
  if (!parent) return;
  const choices = [];
  if (parent.type === 'trigger') choices.push('condition', 'action');
  if (parent.type === 'condition') choices.push('action', 'condition');
  if (parent.type === 'action') choices.push('condition');
  const type = choices.length === 1 ? choices[0] : prompt(`Тип узла (${choices.join('/')})`);
  if (!choices.includes(type)) { showToast('Неверный тип'); return; }
  const id = nodes.length ? Math.max(...nodes.map(n => n.id)) + 1 : 1;
  const defaults = { condition: { check: 'hpPercent', op: '<', value: 50 }, action: { action: 'damage', formula: '1d6' } };
  nodes.push({ id, type, parentId, ...defaults[type] });
  if (prefix === 'status') renderStatusWizard();
}

function deleteNode(prefix, id) {
  const wiz = prefix === 'status' ? statusWizard : spellWizard;
  const deleteRecursive = (nodeId) => {
    const children = wiz.nodes.filter(n => n.parentId === nodeId);
    children.forEach(c => deleteRecursive(c.id));
    wiz.nodes = wiz.nodes.filter(n => n.id !== nodeId);
  };
  deleteRecursive(id);
  if (prefix === 'status') renderStatusWizard();
}

function updateNodeField(prefix, id, field, value) {
  const wiz = prefix === 'status' ? statusWizard : spellWizard;
  const node = wiz.nodes.find(n => n.id === id);
  if (node) node[field] = value;
}

function saveWizardStatus() {
  statusWizard.name = document.getElementById('wizStatusName').value.trim();
  statusWizard.icon = document.getElementById('wizStatusIcon').value || '✨';
  statusWizard.color = document.getElementById('wizStatusColor').value;
  statusWizard.description = document.getElementById('wizStatusDesc').value;
  if (!statusWizard.name) { showToast('Укажите название'); return; }
  const newStatus = { ...statusWizard, id: statusWizard.id || 'custom_' + Date.now() };
  const existing = customStatuses.findIndex(s => s.id === newStatus.id);
  if (existing >= 0) customStatuses[existing] = newStatus;
  else customStatuses.push(newStatus);
  const def = { id: newStatus.id, name: newStatus.name, icon: newStatus.icon, color: newStatus.color };
  if (!STATUS_DEFS.permanent.find(s => s.id === newStatus.id)) STATUS_DEFS.permanent.push(def);
  saveCustomData();
  closeModal('statusWizardModal');
  showToast(`✨ Статус "${newStatus.name}" сохранён`);
  renderStatusCatalog();
}

function saveWizardSpell() {
  spellWizard.name = document.getElementById('wizSpellName').value.trim();
  spellWizard.level = parseInt(document.getElementById('wizSpellLevel').value) || 0;
  spellWizard.school = document.getElementById('wizSpellSchool').value;
  spellWizard.icon = document.getElementById('wizSpellIcon').value || '🔮';
  spellWizard.castingTime = document.getElementById('wizSpellTime').value;
  spellWizard.range = document.getElementById('wizSpellRange').value;
  spellWizard.duration = document.getElementById('wizSpellDuration').value;
  spellWizard.description = document.getElementById('wizSpellDesc').value;
  if (!spellWizard.name) { showToast('Укажите название'); return; }
  const newSpell = { ...spellWizard, id: spellWizard.id || 'spell_' + Date.now() };
  const existing = customSpells.findIndex(s => s.id === newSpell.id);
  if (existing >= 0) customSpells[existing] = newSpell;
  else customSpells.push(newSpell);
  saveCustomData();
  closeModal('spellWizardModal');
  showToast(`🔮 Заклинание "${newSpell.name}" сохранено`);
  renderSpellCatalog();
}

function saveCustomData() {
  localStorage.setItem('dndCustomStatuses', JSON.stringify(customStatuses));
  localStorage.setItem('dndCustomSpells', JSON.stringify(customSpells));
}

function loadCustomData() {
  try {
    customStatuses = JSON.parse(localStorage.getItem('dndCustomStatuses') || '[]');
    customSpells = JSON.parse(localStorage.getItem('dndCustomSpells') || '[]');
  } catch(e) { customStatuses = []; customSpells = []; }
}

function editStatusFromCatalog(id) {
  const status = [...STATUS_CATALOG, ...customStatuses].find(s => s.id === id);
  if (!status) return;
  statusWizard = { id: status.id, name: status.name, icon: status.icon, color: status.color, description: status.description || '', nodes: status.logic?.nodes ? JSON.parse(JSON.stringify(status.logic.nodes)) : [] };
  document.getElementById('statusCatalogModal').classList.remove('show');
  document.getElementById('statusWizardModal').classList.add('show');
  renderStatusWizard();
  switchWizardTab('basic');
}

function editSpellFromCatalog(id) {
  const spell = [...SPELL_CATALOG, ...customSpells].find(s => s.id === id);
  if (!spell) return;
  spellWizard = JSON.parse(JSON.stringify(spell));
  document.getElementById('spellCatalogModal').classList.remove('show');
  document.getElementById('spellWizardModal').classList.add('show');
  renderSpellWizard();
  switchWizardTab('basic');
}

function applyStatusFromCatalog(id) {
  const status = [...STATUS_CATALOG, ...customStatuses].find(s => s.id === id);
  const charId = prompt('ID персонажа для применения (число):');
  if (!charId) return;
  const cid = parseInt(charId);
  const c = characters.find(ch => ch.id === cid);
  if (!c) { showToast('Персонаж не найден'); return; }
  const newStatus = { uid: statusUid++, id: status.id, name: status.name, icon: status.icon, color: status.color, type: 'timed', duration: 5, logic: status.logic };
  c.statuses.push(newStatus);
  showToast(`${status.icon} ${status.name} наложен на ${c.name}`);
  renderAll();
  closeModal('statusCatalogModal');
}

// --- Система триггеров для статусов ---
window.__inTrigger = false;

function executeStatusTriggers(charId, event, context = {}) {
  if (window.__inTrigger) return;
  window.__inTrigger = true;
  try {
    const c = characters.find(ch => ch.id === charId);
    if (!c) return;
    const statusesCopy = [...c.statuses];
    statusesCopy.forEach(status => {
      if (!status.logic?.nodes) return;
      const triggers = status.logic.nodes.filter(n => n.type === 'trigger' && n.event === event);
      triggers.forEach(trigger => executeNode(charId, status, trigger.id, context));
    });
  } finally { window.__inTrigger = false; }
}

function executeNode(charId, status, nodeId, context, depth = 0) {
  if (depth > 20) return;
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const node = status.logic.nodes.find(n => n.id === nodeId);
  if (!node) return;
  let shouldContinue = true;
  if (node.type === 'condition') shouldContinue = evaluateCondition(c, node, context);
  else if (node.type === 'action') executeAction(charId, status, node, context);
  if (shouldContinue) {
    const children = status.logic.nodes.filter(n => n.parentId === nodeId);
    children.forEach(child => executeNode(charId, status, child.id, context, depth + 1));
  }
}

function evaluateCondition(c, node, context) {
  if (node.check === 'hpPercent') {
    const pct = (c.hpCur / c.hpMax) * 100;
    switch(node.op) {
      case '<': return pct < node.value;
      case '<=': return pct <= node.value;
      case '>': return pct > node.value;
      case '>=': return pct >= node.value;
      case '==': return Math.abs(pct - node.value) < 0.1;
    }
  }
  if (node.check === 'hasStatus') {
    const has = c.statuses.some(s => s.id === node.statusId);
    return node.op === 'not' ? !has : has;
  }
  if (node.check === 'diceRoll') {
    const roll = Math.floor(Math.random() * 20) + 1;
    context.lastRoll = roll;
    switch(node.op) {
      case '<': return roll < node.value;
      case '<=': return roll <= node.value;
      case '>': return roll > node.value;
      case '>=': return roll >= node.value;
    }
  }
  return true;
}

function executeAction(charId, status, node, context) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const cardEl = document.querySelector(`.char-card[data-char-id="${charId}"]`);
  if (node.action === 'damage') {
    const result = parseDiceExpression(node.formula || '1d6');
    applyDamage(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `-${result.total} 🔥`, '#e94560');
  } else if (node.action === 'heal') {
    const result = parseDiceExpression(node.formula || '1d8');
    applyHeal(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `+${result.total}`, '#4ecca3');
  } else if (node.action === 'applyStatus') {
    const def = [...STATUS_CATALOG, ...customStatuses, ...STATUS_DEFS.permanent, ...STATUS_DEFS.timed].find(s => s.id === node.statusId);
    if (def) {
      c.statuses.push({ uid: statusUid++, id: def.id, name: def.name, icon: def.icon, color: def.color, type: 'timed', duration: node.duration || 3, logic: def.logic });
      renderAll();
    }
  } else if (node.action === 'removeStatus') {
    if (node.statusId === 'self') c.statuses = c.statuses.filter(s => s.uid !== status.uid);
    else c.statuses = c.statuses.filter(s => s.id !== node.statusId);
    renderAll();
  } else if (node.action === 'roll') {
    const result = parseDiceExpression(node.formula || '1d20');
    context.lastRoll = result.total;
    showToast(`🎲 Бросок: ${result.total}`);
  }
}

// --- Перехват оригинальных функций для интеграции ---
const _origOnCardClick = onCardClick;
onCardClick = function(event, charId) {
  if (window.activeSpell?.selecting) {
    const spell = window.activeSpell.spell;
    if (spell.logic.targetMode === 'single') {
      window.lastSpellTarget = charId;
      window.activeSpell.selecting = false;
      const c = characters.find(ch => ch.id === charId);
      showToast(`Цель: ${c.name}. Нажмите "Применить заклинание".`);
      renderAll();
      return;
    } else if (spell.logic.targetMode === 'aoe' || spell.logic.targetMode === 'spread') {
      if (window.activeSpell.targets.has(charId)) window.activeSpell.targets.delete(charId);
      else window.activeSpell.targets.add(charId);
      showToast(`Целей выбрано: ${window.activeSpell.targets.size}`);
      renderAll();
      return;
    }
  }
  _origOnCardClick(event, charId);
};

const _origRenderPanel = renderPanel;
renderPanel = function(type) {
  _origRenderPanel(type);
  if (window.activeSpell?.selecting) {
    const list = document.getElementById(type === 'pc' ? 'pcList' : 'npcList');
    characters.filter(c => c.type === type).forEach(c => {
      const card = list.querySelector(`.char-card[data-char-id="${c.id}"]`);
      if (!card) return;
      const isTarget = window.activeSpell.targets.has(c.id) || window.lastSpellTarget === c.id;
      if (isTarget) card.classList.add('spell-target');
    });
  }
};

// --- Применение заклинаний ---
function castSpellFromCatalog(id) {
  const spell = [...SPELL_CATALOG, ...customSpells].find(s => s.id === id);
  if (!spell) return;
  startSpellCast(spell);
  closeModal('spellCatalogModal');
}

function startSpellCast(spell) {
  window.activeSpell = { spell, targets: new Set(), selecting: true };
  window.lastSpellTarget = null;
  showToast(`🔮 Творим: ${spell.name}. Выберите ${spell.logic.targetMode === 'single' ? 'цель' : 'цели'}.`);
  showCastButton();
  renderAll();
}

function showCastButton() {
  let btn = document.getElementById('spellCastBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'spellCastBtn';
    btn.className = 'aoe-apply-btn';
    btn.style.background = 'var(--purple)';
    btn.style.boxShadow = '0 4px 20px rgba(131,56,236,0.4)';
    document.body.appendChild(btn);
  }
  btn.textContent = `🔮 Применить заклинание`;
  btn.onclick = executeSpellOnTargets;
  let cancelBtn = document.getElementById('spellCancelBtn');
  if (!cancelBtn) {
    cancelBtn = document.createElement('button');
    cancelBtn.id = 'spellCancelBtn';
    cancelBtn.className = 'aoe-apply-btn';
    cancelBtn.style.background = 'rgba(255,255,255,0.1)';
    cancelBtn.style.bottom = '80px';
    cancelBtn.style.boxShadow = 'none';
    document.body.appendChild(cancelBtn);
  }
  cancelBtn.textContent = `✕ Отмена`;
  cancelBtn.onclick = cancelSpellCast;
}

function cancelSpellCast() {
  window.activeSpell = null;
  window.lastSpellTarget = null;
  const btn = document.getElementById('spellCastBtn');
  if (btn) btn.remove();
  const cancelBtn = document.getElementById('spellCancelBtn');
  if (cancelBtn) cancelBtn.remove();
  renderAll();
}

function executeSpellOnTargets() {
  if (!window.activeSpell) return;
  const { spell } = window.activeSpell;
  const caster = combatActive && turnOrder[currentTurnIndex] ? turnOrder[currentTurnIndex] : null;
  const dc = calculateSpellDC(spell, caster);
  let targets = [];
  if (spell.logic.targetMode === 'aoe') {
    if (!window.activeSpell.targets.size) { showToast('Выберите цели для AoE'); return; }
    targets = Array.from(window.activeSpell.targets);
  } else if (spell.logic.targetMode === 'single') {
    if (!window.lastSpellTarget) { showToast('Выберите цель'); return; }
    targets = [window.lastSpellTarget];
  } else if (spell.logic.targetMode === 'spread') {
    targets = Array.from(window.activeSpell.targets);
    if (!targets.length) { showToast('Выберите цели'); return; }
  }
  const log = showSpellCastLog(spell, targets, dc);
  targets.forEach(charId => {
    const c = characters.find(ch => ch.id === charId);
    if (!c) return;
    let success = null;
    if (spell.logic.save) {
      const saveRoll = Math.floor(Math.random() * 20) + 1;
      const total = saveRoll;
      success = total >= dc;
      log.addTargetResult(c.name, success, `d20=${saveRoll} (DC ${dc})`);
    } else {
      log.addTargetResult(c.name, true, 'Без спасброска');
    }
    const effectKey = success === true ? 'onSuccess' : success === false ? 'onFail' : 'onFail';
    const effect = spell.logic[effectKey];
    if (effect) applySpellEffect(charId, effect, success === true);
  });
  setTimeout(() => {
    window.activeSpell = null;
    window.lastSpellTarget = null;
    const btn = document.getElementById('spellCastBtn');
    if (btn) btn.remove();
    const cancelBtn = document.getElementById('spellCancelBtn');
    if (cancelBtn) cancelBtn.remove();
    renderAll();
  }, 3000);
}

function calculateSpellDC(spell, caster) {
  if (!spell.logic.save) return 10;
  if (caster) {
    const prof = Math.ceil((caster.level || 1) / 4) + 1;
    return 8 + prof + 3;
  }
  return 13;
}

function applySpellEffect(charId, effect, halfDamage = false) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const cardEl = document.querySelector(`.char-card[data-char-id="${charId}"]`);
  if (effect.type === 'damage') {
    let formula = effect.formula;
    if (halfDamage && formula.includes('d')) {
      formula = formula.replace(/(\d+)d/, (m, n) => Math.ceil(parseInt(n)/2) + 'd');
    }
    const result = parseDiceExpression(formula);
    applyDamage(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `-${result.total}`, '#e94560');
  } else if (effect.type === 'heal') {
    const result = parseDiceExpression(effect.formula);
    applyHeal(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `+${result.total}`, '#4ecca3');
  } else if (effect.type === 'applyStatus') {
    const def = [...STATUS_CATALOG, ...customStatuses, ...STATUS_DEFS.permanent, ...STATUS_DEFS.timed].find(s => s.id === effect.statusId);
    if (def) {
      c.statuses.push({ uid: statusUid++, id: def.id, name: def.name, icon: def.icon, color: def.color, type: 'timed', duration: effect.duration || 3, logic: def.logic });
    }
  }
}

function showSpellCastLog(spell, targets, dc) {
  const existing = document.querySelector('.spell-cast-log');
  if (existing) existing.remove();
  const log = document.createElement('div');
  log.className = 'spell-cast-log';
  log.innerHTML = `<div class="spell-cast-title"><span>${spell.icon} ${spell.name}</span><span style="font-size:0.8rem; color:var(--text-dim);">DC ${dc}</span></div><div class="target-results"></div>`;
  document.body.appendChild(log);
  setTimeout(() => log.remove(), 4000);
  return {
    addTargetResult(name, success, details) {
      const results = log.querySelector('.target-results');
      const div = document.createElement('div');
      div.className = `target-result ${success ? 'success' : 'fail'}`;
      div.innerHTML = `<span>${escapeHtml(name)}</span><span>${success ? '✅' : '❌'} ${details}</span>`;
      results.appendChild(div);
    }
  };
}

// --- Инициализация расширений ---
function initExtensions() {
  loadCustomData();
    if (window.AppEvents) {
    window.AppEvents.on("turn:end", function (id) { executeStatusTriggers(id, "turnEnd"); });
    window.AppEvents.on("turn:start", function (id) { executeStatusTriggers(id, "turnStart"); });
    window.AppEvents.on("damage:taken", function (payload) { executeStatusTriggers(payload.id, "takeDamage", { damage: payload.amount }); });
  }
const headerInfo = document.getElementById('headerInfo');
  if (headerInfo && !document.getElementById('btnSpellCatalog')) {
    const btnStatus = document.createElement('button');
    btnStatus.className = 'catalog-header-btn';
    btnStatus.textContent = '✨ Статусы';
    btnStatus.onclick = openStatusCatalog;
    headerInfo.insertBefore(btnStatus, headerInfo.firstChild);
    const btnSpell = document.createElement('button');
    btnSpell.id = 'btnSpellCatalog';
    btnSpell.className = 'catalog-header-btn';
    btnSpell.textContent = '🔮 Заклинания';
    btnSpell.onclick = openSpellCatalog;
    headerInfo.insertBefore(btnSpell, headerInfo.firstChild);
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Escape') {
      closeModal('statusCatalogModal');
      closeModal('spellCatalogModal');
      closeModal('statusWizardModal');
      closeModal('spellWizardModal');
    }
  });
  ['statusCatalogModal', 'spellCatalogModal', 'statusWizardModal', 'spellWizardModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal(id);
    });
  });
}

initExtensions();
