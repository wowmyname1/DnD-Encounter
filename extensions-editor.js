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

