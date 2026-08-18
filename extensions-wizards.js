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

