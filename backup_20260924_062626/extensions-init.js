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
