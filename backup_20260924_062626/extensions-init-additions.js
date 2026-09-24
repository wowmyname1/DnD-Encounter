
// Обработчик для manual триггеров
window.AppEvents.on("status:manual", function (payload) {
  executeStatusTriggers(payload.id, "manual");
});

// Уменьшаем длительности статусов при смене хода
window.AppEvents.on("turn:end", function (id) {
  const c = characters.find(ch => ch.id === id);
  if (!c) return;
  
  c.statuses.forEach(status => {
    if (status.type === 'timed' && status.duration > 0) {
      status.duration -= 1;
    }
  });
  
  const before = c.statuses.length;
  c.statuses = c.statuses.filter(s => s.type === 'permanent' || s.duration > 0);
  
  if (c.statuses.length < before) {
    renderAll();
  }
});
