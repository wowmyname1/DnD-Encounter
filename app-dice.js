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


function setActiveRoll(parseResult) {
  const initialSelected = parseResult.allDice.filter(function (d) { return d.selected; }).length;
  activeRoll = {
    expression: parseResult.expression,
    dice: parseResult.allDice,
    modifier: parseResult.modifier,
    mode: 'single',
    applyType: 'damage',
    aoeTargets: new Set(),
    animating: true,
    maxSelected: initialSelected > 0 ? initialSelected : parseResult.allDice.length
  };
  updateActiveRollUI();
  renderAll();
  setTimeout(function () {
    if (activeRoll) {
      activeRoll.animating = false;
      updateActiveRollUI();
    }
  }, 600);
}

function setApplyType(type) {
  if (!activeRoll) return;
  activeRoll.applyType = type;
  updateActiveRollUI();
  renderAll();
}

function toggleDie(dieId) {
  if (!activeRoll || activeRoll.animating) return;
  const die = activeRoll.dice.find(function (d) { return d.id === dieId; });
  if (!die || die.spent) return;
  if (!die.selected) {
    const selectedCount = activeRoll.dice.filter(function (d) { return d.selected && !d.spent; }).length;
    if (activeRoll.maxSelected && selectedCount >= activeRoll.maxSelected) return;
  }
  die.selected = !die.selected;
  updateActiveRollUI();
  renderAll();
}

function setRollMode(mode) {
  if (!activeRoll) return;
  activeRoll.mode = mode;
  activeRoll.aoeTargets.clear();
  updateActiveRollUI();
  renderAll();
}

function updateActiveRollUI() {
  const resultEl = document.getElementById('diceResult');
  const modeBar = document.getElementById('rollModeBar');
  const tray = document.getElementById('diceTray');

  if (!activeRoll) {
    resultEl.textContent = '—';
    resultEl.className = 'active-roll-total';
    modeBar.classList.remove('show');
    tray.innerHTML = '';
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

  tray.innerHTML = activeRoll.dice.map(function (d, i) {
    let cls = 'dice-tray-die';
    if (d.selected && !d.spent) cls += ' selected';
    if (d.spent) cls += ' spent';
    const delay = activeRoll.animating ? (i * 0.08) + 's' : '0s';
    const title = 'd' + d.sides + ': ' + d.value + (d.sign === '-' ? ' (вычитается)' : '');
    return '<div class="' + cls + '" style="animation-delay:' + delay + '" onclick="toggleDie(' + d.id + ')" title="' + title + '">' + d.value + '</div>';
  }).join('');

  modeBar.classList.add('show');

  document.querySelectorAll('.mode-btn[data-mode]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.mode === activeRoll.mode);
  });

  document.querySelectorAll('.mode-btn[data-apply]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.apply === activeRoll.applyType);
  });
}
