
let pendingStatusForChar = null;

function applyStatusFromCatalog(id) {
  const status = [...STATUS_CATALOG, ...customStatuses].find(s => s.id === id);
  if (!status) return;
  
  pendingStatusForChar = status;
  closeModal('statusCatalogModal');
  showToast(`${status.icon} ${status.name} - кликните на персонажа для применения`);
  
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', handleStatusApplicationClick);
  });
}

function handleStatusApplicationClick(e) {
  if (!pendingStatusForChar) return;
  
  const card = e.currentTarget;
  const charId = parseInt(card.dataset.charId);
  const c = characters.find(ch => ch.id === charId);
  
  if (!c) return;
  
  const status = pendingStatusForChar;
  const newStatus = { 
    uid: statusUid++, 
    id: status.id, 
    name: status.name, 
    icon: status.icon, 
    color: status.color, 
    type: 'timed', 
    duration: 5, 
    logic: status.logic 
  };
  
  c.statuses.push(newStatus);
  showToast(`${status.icon} ${status.name} наложен на ${c.name}`);
  
  document.querySelectorAll('.char-card').forEach(card => {
    card.removeEventListener('click', handleStatusApplicationClick);
  });
  
  pendingStatusForChar = null;
  renderAll();
}
