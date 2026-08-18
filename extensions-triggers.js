window.__inTrigger = false;

function executeStatusTriggers(charId, event, context = {}) {
  if (window.__inTrigger) return;
  window.__inTrigger = true;
  try {
    const c = characters.find(ch => ch.id === charId);
    if (!c) return;
    const statusesCopy = [...c.statuses];
    statusesCopy.forEach(status => {
      if (!status.logic?.nodes) return;
      const triggers = status.logic.nodes.filter(n => n.type === 'trigger' && n.event === event);
      triggers.forEach(trigger => executeNode(charId, status, trigger.id, context));
    });
  } finally { window.__inTrigger = false; }
}

function executeNode(charId, status, nodeId, context, depth = 0) {
  if (depth > 20) return;
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const node = status.logic.nodes.find(n => n.id === nodeId);
  if (!node) return;
  let shouldContinue = true;
  if (node.type === 'condition') shouldContinue = evaluateCondition(c, node, context);
  else if (node.type === 'action') executeAction(charId, status, node, context);
  if (shouldContinue) {
    const children = status.logic.nodes.filter(n => n.parentId === nodeId);
    children.forEach(child => executeNode(charId, status, child.id, context, depth + 1));
  }
}

function evaluateCondition(c, node, context) {
  if (node.check === 'hpPercent') {
    const pct = (c.hpCur / c.hpMax) * 100;
    switch(node.op) {
      case '<': return pct < node.value;
      case '<=': return pct <= node.value;
      case '>': return pct > node.value;
      case '>=': return pct >= node.value;
      case '==': return Math.abs(pct - node.value) < 0.1;
    }
  }
  if (node.check === 'hasStatus') {
    const has = c.statuses.some(s => s.id === node.statusId);
    return node.op === 'not' ? !has : has;
  }
  if (node.check === 'diceRoll') {
    const roll = Math.floor(Math.random() * 20) + 1;
    context.lastRoll = roll;
    switch(node.op) {
      case '<': return roll < node.value;
      case '<=': return roll <= node.value;
      case '>': return roll > node.value;
      case '>=': return roll >= node.value;
    }
  }
  return true;
}

function executeAction(charId, status, node, context) {
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  const cardEl = document.querySelector(`.char-card[data-char-id="${charId}"]`);
  if (node.action === 'damage') {
    const result = parseDiceExpression(node.formula || '1d6');
    applyDamage(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `-${result.total} 🔥`, '#e94560');
  } else if (node.action === 'heal') {
    const result = parseDiceExpression(node.formula || '1d8');
    applyHeal(charId, result.total);
    if (cardEl) showFloatingText(cardEl, `+${result.total}`, '#4ecca3');
  } else if (node.action === 'applyStatus') {
    const def = [...STATUS_CATALOG, ...customStatuses, ...STATUS_DEFS.permanent, ...STATUS_DEFS.timed].find(s => s.id === node.statusId);
    if (def) {
      c.statuses.push({ uid: statusUid++, id: def.id, name: def.name, icon: def.icon, color: def.color, type: 'timed', duration: node.duration || 3, logic: def.logic });
      renderAll();
    }
  } else if (node.action === 'removeStatus') {
    if (node.statusId === 'self') c.statuses = c.statuses.filter(s => s.uid !== status.uid);
    else c.statuses = c.statuses.filter(s => s.id !== node.statusId);
    renderAll();
  } else if (node.action === 'roll') {
    const result = parseDiceExpression(node.formula || '1d20');
    context.lastRoll = result.total;
    showToast(`🎲 Бросок: ${result.total}`);
  }
}

