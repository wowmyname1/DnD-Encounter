
function triggerManualStatus(charId, statusUid) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  
  const status = c.statuses.find(s => s.uid === statusUid);
  if (!status || !status.logic?.nodes) return;
  
  const manualTriggers = status.logic.nodes.filter(n => n.type === 'trigger' && n.event === 'manual');
  manualTriggers.forEach(trigger => {
    executeNode(charId, status, trigger.id, {});
  });
  
  renderAll();
}
