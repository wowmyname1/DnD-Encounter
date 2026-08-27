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
        if (key === 'd') { applyDamage(lastTargetId, getSelectedSum()); consumeSelectedDice(); }
        else if (key === 'h') { applyHeal(lastTargetId, getSelectedSum()); consumeSelectedDice(); }
        else if (key === 't') { applyTempHp(lastTargetId, getSelectedSum()); consumeSelectedDice(); }
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

