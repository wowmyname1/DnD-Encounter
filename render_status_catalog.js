function renderStatusCatalog() {
  const grid = document.getElementById('statusCatalogGrid');
  const search = (document.getElementById('statusSearch').value || '').toLowerCase();
  let allStatuses = [...STATUS_CATALOG, ...customStatuses];
  if (search) allStatuses = allStatuses.filter(s => s.name.toLowerCase().includes(search));
  grid.innerHTML = allStatuses.map(s => {
    const isCustom = customStatuses.some(cs => cs.id === s.id);
    return `
    <div class="catalog-item" onclick="editStatusFromCatalog('${s.id}')">
      <div class="catalog-item-header"><div class="catalog-item-name">${s.icon} ${escapeHtml(s.name)}</div></div>
      <div class="catalog-item-desc">${s.description || 'Без описания'}</div>
      <div class="catalog-item-actions">
        <button onclick="event.stopPropagation(); editStatusFromCatalog('${s.id}')">✏️ Редакт.</button>
        <button onclick="event.stopPropagation(); applyStatusFromCatalog('${s.id}')">➕ Применить</button>
        ${isCustom ? `<button onclick="event.stopPropagation(); deleteCustomStatus('${s.id}')" style="background:rgba(233,69,96,0.3); border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️</button>` : ''}
      </div>
    </div>`;
  }).join('') || '<p style="color:var(--text-dim); text-align:center; padding:20px;">Нет статусов в каталоге</p>';
}
