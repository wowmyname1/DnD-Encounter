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
  consumeSelectedDice();
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


function onHpBarClick(event, charId) {
  event.stopPropagation();

  if (!activeRoll) {
    const card = event.currentTarget.closest('.char-card');
    const btn = card.querySelector('.hp-edit-btn');
    toggleHpInlineInput(btn);
    return;
  }

  lastTargetId = charId;

  if (activeRoll.mode === 'single') {
    applyActiveRollToCharacter(charId);
  }

  if (activeRoll.mode === 'spread') {
    applySpreadToCharacter(charId);
  }

  if (activeRoll.mode === 'aoe') {
    if (activeRoll.aoeTargets.has(charId)) {
      activeRoll.aoeTargets.delete(charId);
    } else {
      activeRoll.aoeTargets.add(charId);
    }
    renderAll();
  }
}

function applyActiveRollToCharacter(charId) {
  if (!activeRoll) return;
  const val = getSelectedSum();
  if (val === 0) return;

  const type = activeRoll.applyType ? activeRoll.applyType : 'damage';

  if (type === 'damage') applyDamage(charId, val);
  if (type === 'heal') applyHeal(charId, val);
  if (type === 'temp') applyTempHp(charId, val);

  consumeSelectedDice();
}

function applySpreadToCharacter(charId) {
  if (!activeRoll) return;

  const selectedDice = activeRoll.dice.filter(function (d) { return d.selected && !d.spent; });
  if (selectedDice.length === 0) {
    showToast('Выберите кубик для разброса');
    return;
  }

  const die = selectedDice[0];
  const type = activeRoll.applyType ? activeRoll.applyType : 'damage';

  if (type === 'damage') applyDamage(charId, die.value);
  if (type === 'heal') applyHeal(charId, die.value);
  if (type === 'temp') applyTempHp(charId, die.value);

  die.spent = true;
  die.selected = false;

  const remaining = activeRoll.dice.filter(function (d) { return !d.spent; });
  if (remaining.length === 0) {
    clearActiveRoll();
    return;
  }

  updateActiveRollUI();
  renderAll();
  showToast('Осталось кубиков: ' + remaining.length);
}

function consumeSelectedDice() {
  if (!activeRoll) return;

  activeRoll.dice.forEach(function (d) {
    if (d.selected && !d.spent) {
      d.spent = true;
      d.selected = false;
    }
  });

  const remaining = activeRoll.dice.filter(function (d) { return !d.spent; });
  if (remaining.length === 0) {
    clearActiveRoll();
    return;
  }

  updateActiveRollUI();
  renderAll();
}

function onTokenClick(charId) {
  if (!activeRoll) return;

  lastTargetId = charId;

  if (activeRoll.mode === 'single') {
    applyActiveRollToCharacter(charId);
  }

  if (activeRoll.mode === 'spread') {
    applySpreadToCharacter(charId);
  }

  if (activeRoll.mode === 'aoe') {
    if (activeRoll.aoeTargets.has(charId)) {
      activeRoll.aoeTargets.delete(charId);
    } else {
      activeRoll.aoeTargets.add(charId);
    }
    renderAll();
  }
}

function applySpreadToCharacter(charId) {
  if (!activeRoll) return;

  const dice = activeRoll.dice.filter(function (d) { return !d.spent; });

  if (dice.length === 0) {
    showToast('Кубики закончились');
    clearActiveRoll();
    return;
  }

  const die = dice[0];
  const type = activeRoll.applyType ? activeRoll.applyType : 'damage';

  if (type === 'damage') applyDamage(charId, die.value);
  if (type === 'heal') applyHeal(charId, die.value);
  if (type === 'temp') applyTempHp(charId, die.value);

  die.spent = true;
  die.selected = false;

  const remaining = activeRoll.dice.filter(function (d) { return !d.spent; });

  if (remaining.length === 0) {
    clearActiveRoll();
    return;
  }

  updateActiveRollUI();
  renderAll();
}

function consumeSelectedDice() {
  if (!activeRoll) return;

  activeRoll.dice.forEach(function (d) {
    if (d.selected) d.selected = false;
  });

  updateActiveRollUI();
  renderAll();
}

function applySpreadToCharacter(charId) {
  if (!activeRoll) return;

  const selectedDice = activeRoll.dice.filter(function (d) { return d.selected; });

  if (selectedDice.length === 0) {
    showToast('Выберите кубик для разброса');
    return;
  }

  const die = selectedDice[0];
  const type = activeRoll.applyType ? activeRoll.applyType : 'damage';

  if (type === 'damage') applyDamage(charId, die.value);
  if (type === 'heal') applyHeal(charId, die.value);
  if (type === 'temp') applyTempHp(charId, die.value);

  die.selected = false;

  updateActiveRollUI();
  renderAll();
}
