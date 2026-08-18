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

