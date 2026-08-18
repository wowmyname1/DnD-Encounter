// ===== ОРИГИНАЛЬНЫЙ КОД =====
const COLORS = ['#e94560','#3a86ff','#4ecca3','#f5a623','#8338ec','#ff6b6b','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0'];
let selectedColor = COLORS[0];
let characters = [];
let nextId = 1;
let combatActive = false;
let turnOrder = [];
let currentTurnIndex = -1;
let round = 1;
let diceHistory = [];
let selectedStatusDef = null;
let currentStatusTab = 'permanent';
let savedRolls = [];
let nextRollId = 1;
let activeRoll = null;
let popupTargetId = null;
let lastTargetId = null;

const STATUS_DEFS = {
  permanent: [
    { id: 'blinded', name: 'Ослеплён', icon: '👁️', color: '#555' },
    { id: 'charmed', name: 'Очарован', icon: '💖', color: '#ff6b9d' },
    { id: 'deafened', name: 'Оглох', icon: '🔇', color: '#777' },
    { id: 'frightened', name: 'Испуган', icon: '😱', color: '#9b59b6' },
    { id: 'grappled', name: 'Схвачен', icon: '🤝', color: '#d35400' },
    { id: 'incapacitated', name: 'Недееспособен', icon: '💫', color: '#7f8c8d' },
    { id: 'invisible', name: 'Невидим', icon: '👻', color: '#bdc3c7' },
    { id: 'paralyzed', name: 'Парализован', icon: '⚡', color: '#f1c40f' },
    { id: 'petrified', name: 'Окаменел', icon: '🗿', color: '#95a5a6' },
    { id: 'poisoned', name: 'Отравлен', icon: '☠️', color: '#27ae60' },
    { id: 'prone', name: 'Сбит с ног', icon: '🤸', color: '#e67e22' },
    { id: 'restrained', name: 'Опутан', icon: '⛓️', color: '#c0392b' },
    { id: 'stunned', name: 'Оглушён', icon: '💥', color: '#e74c3c' },
    { id: 'unconscious', name: 'Без сознания', icon: '😴', color: '#2c3e50' },
    { id: 'exhaustion', name: 'Истощение', icon: '🥵', color: '#8e44ad' },
  ],
  timed: [
    { id: 'rage', name: 'Ярость', icon: '🔥', color: '#e74c3c' },
    { id: 'blessed', name: 'Благословение', icon: '✨', color: '#f1c40f' },
    { id: 'hasted', name: 'Ускорен', icon: '⚡', color: '#3498db' },
    { id: 'slowed', name: 'Замедлен', icon: '🐌', color: '#95a5a6' },
    { id: 'concentrating', name: 'Концентрация', icon: '🎯', color: '#1abc9c' },
    { id: 'burning', name: 'Горит', icon: '🔥', color: '#e67e22' },
    { id: 'flying', name: 'Полёт', icon: '🕊️', color: '#3498db' },
    { id: 'invisibility', name: 'Невидимость', icon: '👻', color: '#bdc3c7' },
    { id: 'bardic_insp', name: 'Вдохновение', icon: '🎵', color: '#9b59b6' },
    { id: 'shield_of_faith', name: 'Щит веры', icon: '🛡️', color: '#f39c12' },
    { id: 'hex', name: 'Сглаз', icon: '🧿', color: '#8e44ad' },
    { id: 'hunter_mark', name: 'Метка охотника', icon: '🏹', color: '#27ae60' },
    { id: 'rage_bear', name: 'Ярость варвара', icon: '🐻', color: '#c0392b' },
    { id: 'regenerating', name: 'Регенерация', icon: '💚', color: '#2ecc71' },
  ]
};

function validateExpression(expr) {
  if (!expr || !expr.trim()) return { valid: false, error: null };
  expr = expr.trim().toLowerCase();
  if (/[^0-9dkhl+\-\s]/.test(expr)) return { valid: false, error: 'Недопустимые символы' };
  if (!/^[\d+\-]/.test(expr)) return { valid: false, error: 'Должно начинаться с числа или +/-' };
  const tokens = [];
  let current = '';
  let sign = '+';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if ((ch === '+' || ch === '-') && i > 0) {
      const prev3 = expr.substring(Math.max(0, i - 2), i);
      if (prev3.endsWith('kh') || prev3.endsWith('kl')) { current += ch; continue; }
      if (current) tokens.push({ raw: current, sign });
      current = '';
      sign = ch;
    } else current += ch;
  }
  if (current) tokens.push({ raw: current, sign });
  if (tokens.length === 0) return { valid: false, error: 'Пустое выражение' };
  for (const t of tokens) {
    const raw = t.raw.trim();
    if (!raw) return { valid: false, error: 'Пустой токен' };
    if (/^\d+$/.test(raw)) continue;
    const diceMatch = raw.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/);
    if (!diceMatch) return { valid: false, error: `Неверный формат: "${raw}"` };
    const num = diceMatch[1] ? parseInt(diceMatch[1]) : 1;
    const sides = parseInt(diceMatch[2]);
    const keepType = diceMatch[3];
    const keepCount = diceMatch[4] ? parseInt(diceMatch[4]) : num;
    if (num < 1 || num > 100) return { valid: false, error: `Количество: 1–100` };
    if (sides < 2 || sides > 1000) return { valid: false, error: `Грани: 2–1000` };
    if (keepType && keepCount > num) return { valid: false, error: `Нельзя оставить ${keepCount} из ${num}` };
  }
  return { valid: true, error: null };
}

function parseDiceExpression(expr) {
  expr = expr.replace(/\s+/g, '').toLowerCase();
  const tokens = [];
  let current = '';
  let sign = '+';
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if ((ch === '+' || ch === '-') && i > 0) {
      const prev3 = expr.substring(Math.max(0, i - 2), i);
      if (prev3.endsWith('kh') || prev3.endsWith('kl')) { current += ch; continue; }
      if (current) tokens.push({ expr: current, sign });
      current = '';
      sign = ch;
    } else current += ch;
  }
  if (current) tokens.push({ expr: current, sign });
  const results = [];
  let total = 0;
  let allDice = [];
  let modifier = 0;
  tokens.forEach(token => {
    const match = token.expr.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/);
    if (match) {
      const num = parseInt(match[1]) || 1;
      const sides = parseInt(match[2]);
      const keepType = match[3];
      const keepCount = match[4] !== undefined && match[4] !== '' ? parseInt(match[4]) : num;
      const rolls = [];
      for (let i = 0; i < num; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push({ value: val, sides });
      }
      let keptIndices = rolls.map((_, i) => i);
      if (keepType) {
        const indexed = rolls.map((r, i) => ({ ...r, i }));
        if (keepType === 'kh') indexed.sort((a, b) => b.value - a.value);
        else indexed.sort((a, b) => a.value - b.value);
        keptIndices = indexed.slice(0, keepCount).map(x => x.i);
      }
      const keptSet = new Set(keptIndices);
      rolls.forEach((r, i) => {
        allDice.push({ id: allDice.length, value: r.value, sides: r.sides, selected: keptSet.has(i), spent: false, dropped: keepType && !keptSet.has(i), sign: token.sign });
      });
      const sum = rolls.filter((_, i) => keptSet.has(i)).reduce((a, b) => a + b.value, 0);
      total += token.sign === '+' ? sum : -sum;
      results.push({ type: 'dice', rolls, kept: rolls.filter((_, i) => keptSet.has(i)), keepType, sides, sign: token.sign, sum });
    } else {
      const num = parseInt(token.expr);
      if (!isNaN(num)) {
        modifier += token.sign === '+' ? num : -num;
        total += token.sign === '+' ? num : -num;
        results.push({ type: 'modifier', value: num, sign: token.sign });
      }
    }
  });
  return { total, results, expression: expr, allDice, modifier };
}

function setActiveRoll(parseResult) {
  activeRoll = { expression: parseResult.expression, dice: parseResult.allDice, modifier: parseResult.modifier, mode: 'single', aoeTargets: new Set(), animating: true };
  updateActiveRollUI();
  renderAll();
  setTimeout(() => { if (activeRoll) { activeRoll.animating = false; updateActiveRollUI(); } }, 600);
}

function clearActiveRoll() { activeRoll = null; popupTargetId = null; closeHpPopup(); updateActiveRollUI(); renderAll(); }

function clearSelection() { if (!activeRoll) return; activeRoll.dice.forEach(d => d.selected = false); updateActiveRollUI(); renderAll(); }

function getSelectedSum() {
  if (!activeRoll) return 0;
  let posSum = 0, negSum = 0;
  activeRoll.dice.filter(d => d.selected && !d.spent).forEach(d => {
    if (d.sign === '+') posSum += d.value; else negSum += d.value;
  });
  return posSum - negSum + activeRoll.modifier;
}

function toggleDie(dieId) {
  if (!activeRoll || activeRoll.animating) return;
  const die = activeRoll.dice.find(d => d.id === dieId);
  if (!die || die.spent) return;
  die.selected = !die.selected;
  updateActiveRollUI();
  renderAll();
}

function setRollMode(mode) { if (!activeRoll) return; activeRoll.mode = mode; activeRoll.aoeTargets.clear(); updateActiveRollUI(); renderAll(); }

function updateActiveRollUI() {
  const resultEl = document.getElementById('diceResult');
  const modeBar = document.getElementById('rollModeBar');
  const tray = document.getElementById('diceTray');
  if (!activeRoll) {
    resultEl.textContent = '—'; resultEl.className = 'active-roll-total';
    modeBar.classList.remove('show'); tray.innerHTML = '';
    document.getElementById('diceResultLabel').textContent = 'Бросьте кубик';
    return;
  }
  const sum = getSelectedSum();
  resultEl.textContent = sum;
  resultEl.className = 'active-roll-total has-dice';
  if (activeRoll.dice.length === 1 && activeRoll.dice[0].sides === 20) {
    if (activeRoll.dice[0].value === 20) resultEl.classList.add('nat20');
    if (activeRoll.dice[0].value === 1) resultEl.classList.add('nat1');
  }
  document.getElementById('diceResultLabel').textContent = activeRoll.expression;
  tray.innerHTML = activeRoll.dice.map((d, i) => {
    let cls = 'dice-tray-die';
    if (d.selected && !d.spent) cls += ' selected';
    if (d.spent) cls += ' spent';
    if (d.dropped && !d.selected) cls += ' dropped';
    const delay = activeRoll.animating ? `${i * 0.08}s` : '0s';
    return `<div class="${cls}" style="animation-delay: ${delay}" onclick="toggleDie(${d.id})" title="d${d.sides}: ${d.value}${d.sign === '-' ? ' (вычитается)' : ''}">${d.value}</div>`;
  }).join('');
  modeBar.classList.add('show');
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === activeRoll.mode));
}

function rollDice(sides) {
  const btn = event.currentTarget;
  btn.classList.add('rolling');
  setTimeout(() => btn.classList.remove('rolling'), 400);
  const mod = parseInt(document.getElementById('diceMod').value) || 0;
  const expr = `1d${sides}${mod !== 0 ? (mod > 0 ? '+' + mod : mod) : ''}`;
  const result = parseDiceExpression(expr);
  diceHistory.unshift(`${result.total}`);
  if (diceHistory.length > 10) diceHistory.pop();
  renderDiceHistory();
  setActiveRoll(result);
}

function rollExpression() {
  const input = document.getElementById('diceExpression');
  const expr = input.value.trim();
  if (!expr) return;
  const validation = validateExpression(expr);
  if (!validation.valid) { showToast(`❌ ${validation.error}`); return; }
  const result = parseDiceExpression(expr);
  diceHistory.unshift(`${result.total}`);
  if (diceHistory.length > 10) diceHistory.pop();
  renderDiceHistory();
  setActiveRoll(result);
}

function rollQuickFormula(formula) {
  const validation = validateExpression(formula);
  if (!validation.valid) { showToast(`❌ Неверная формула`); return; }
  const result = parseDiceExpression(formula);
  diceHistory.unshift(`${result.total}`);
  if (diceHistory.length > 10) diceHistory.pop();
  renderDiceHistory();
  setActiveRoll(result);
}

function renderDiceHistory() { document.getElementById('diceHistory').innerHTML = diceHistory.map(h => `<span class="dice-history-item">${h}</span>`).join(''); }

function saveCurrentExpression() {
  const input = document.getElementById('diceExpression');
  const expr = input.value.trim();
  if (!expr) return;
  const validation = validateExpression(expr);
  if (!validation.valid) { showToast(`❌ ${validation.error}`); return; }
  savedRolls.push({ id: nextRollId++, formula: expr });
  renderSavedRolls();
  showToast(`💾 Сохранено: ${expr}`);
}

function deleteSavedRoll(id) { savedRolls = savedRolls.filter(r => r.id !== id); renderSavedRolls(); }

function renderSavedRolls() {
  document.getElementById('savedRolls').innerHTML = savedRolls.map(r => `
    <span class="saved-roll-chip" onclick="rollQuickFormula('${r.formula}')">
      ${r.formula}
      <span class="src-del" onclick="event.stopPropagation(); deleteSavedRoll(${r.id})">✕</span>
    </span>`).join('');
}

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
      return `<span class="status-badge ${permClass}" style="background:${s.color}" title="${s.name}${s.type === 'timed' ? ' (' + s.duration + ' раундов)' : ''}" onclick="removeStatus(${c.id}, ${s.uid})"><span class="status-icon">${s.icon}</span>${durText}</span>`;
    }).join('');
    const quickRollsHtml = c.quickRolls.map(qr => `
      <button class="quick-roll-btn" onclick="rollQuickFormula('${qr.formula}')">
        ${qr.name}: ${qr.formula}
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
          <div class="card-name">${c.name}</div>
          <div class="card-subtitle">${c.cls} · Ур.${c.level} · AC ${c.ac}</div>
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
    const statusDots = c.statuses.slice(0, 6).map(s => `<span class="token-status-dot" style="background:${s.color}" title="${s.name}"></span>`).join('');
    const tempText = c.tempHp > 0 ? ` 🛡️${c.tempHp}` : '';
    token.innerHTML = `${c.name.substring(0,2)}<span class="token-hp">${c.hpCur}${tempText}</span><div class="token-statuses">${statusDots}</div>`;
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
    item.innerHTML = `<span class="init-dot" style="background:${c.color}"></span><span class="init-val">${c.init}</span><span>${c.name}</span>`;
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
    opt.innerHTML = `<span class="so-icon">${s.icon}</span><span class="so-name">${s.name}</span>`;
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

// ===== РАСШИРЕНИЯ: КОНСТРУКТОРЫ И КАТАЛОГИ =====

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
      <div class="catalog-item-header"><div class="catalog-item-name">${s.icon} ${s.name}</div></div>
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
        <div class="catalog-item-name">${s.icon} ${s.name}</div>
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
let _inTrigger = false;

function executeStatusTriggers(charId, event, context = {}) {
  if (_inTrigger) return;
  _inTrigger = true;
  try {
    const c = characters.find(ch => ch.id === charId);
    if (!c) return;
    const statusesCopy = [...c.statuses];
    statusesCopy.forEach(status => {
      if (!status.logic?.nodes) return;
      const triggers = status.logic.nodes.filter(n => n.type === 'trigger' && n.event === event);
      triggers.forEach(trigger => executeNode(charId, status, trigger.id, context));
    });
  } finally { _inTrigger = false; }
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
const _origNextTurn = nextTurn;
nextTurn = function() {
  if (combatActive && turnOrder[currentTurnIndex]) {
    const currentChar = turnOrder[currentTurnIndex];
    executeStatusTriggers(currentChar.id, 'turnEnd');
  }
  _origNextTurn();
  if (combatActive && turnOrder[currentTurnIndex]) {
    const newChar = turnOrder[currentTurnIndex];
    executeStatusTriggers(newChar.id, 'turnStart');
  }
};

const _origApplyDamage = applyDamage;
applyDamage = function(id, amount) {
  _origApplyDamage(id, amount);
  if (!_inTrigger) executeStatusTriggers(id, 'takeDamage', { damage: amount });
};

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
      div.innerHTML = `<span>${name}</span><span>${success ? '✅' : '❌'} ${details}</span>`;
      results.appendChild(div);
    }
  };
}

// --- Инициализация расширений ---
function initExtensions() {
  loadCustomData();
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
