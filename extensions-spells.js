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

