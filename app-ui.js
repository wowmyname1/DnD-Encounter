function renderAll() {
  renderPanel('pc');
  renderPanel('npc');
  renderTokens();
  renderInitOrder();
  document.getElementById('pcCount').textContent = characters.filter(c => c.type === 'pc').length;
  document.getElementById('npcCount').textContent = characters.filter(c => c.type === 'npc').length;
}

function renderPanel(type) {
  const list = document.getElementById(type === 'pc' ? 'pcList' : 'npcList');
  const chars = characters.filter(c => c.type === type);
  list.innerHTML = '';
  chars.forEach(c => {
    const pct = Math.max(0, (c.hpCur / c.hpMax) * 100);
    const hpClass = pct > 50 ? '' : pct > 25 ? 'medium' : 'low';
    const isActive = combatActive && turnOrder[currentTurnIndex]?.id === c.id;
    const isDead = c.hpCur <= 0;
    const isAoeTarget = activeRoll && activeRoll.mode === 'aoe' && activeRoll.aoeTargets.has(c.id);
    const initials = c.name.substring(0, 2);
    const card = document.createElement('div');
    card.className = `char-card${isActive ? ' active-turn' : ''}${isDead ? ' dead' : ''}${isAoeTarget ? ' aoe-target' : ''}`;
    card.dataset.charId = c.id;
    card.onclick = (e) => {
      if (!e.target.closest('.hp-bar-container') && !e.target.closest('.card-actions') && !e.target.closest('.hp-controls') && !e.target.closest('.statuses-row') && !e.target.closest('.quick-rolls-row')) {
        onCardClick(e, c.id);
      }
    };
    const statusesHtml = c.statuses.map(s => {
      const durText = s.type === 'timed' ? `<span class="status-dur">${s.duration}</span>` : '';
      const permClass = s.type === 'permanent' ? 'permanent' : '';
      return `<span class="status-badge ${permClass}" style="background:${s.color}" title="${escapeAttr(s.name)}${s.type === 'timed' ? ' (' + s.duration + ' раундов)' : ''}" onclick="removeStatus(${c.id}, ${s.uid})"><span class="status-icon">${s.icon}</span>${durText}</span>`;
    }).join('');
    const quickRollsHtml = c.quickRolls.map(qr => `
      <button class="quick-roll-btn" onclick="rollQuickFormula('${qr.formula}')">
        ${escapeHtml(qr.name)}: ${escapeHtml(qr.formula)}
        <span class="qr-del" onclick="event.stopPropagation(); deleteQuickRoll(${c.id}, ${qr.id})">✕</span>
      </button>`).join('');
    const tempPct = c.hpMax > 0 ? Math.min(100, ((c.tempHp || 0) / c.hpMax) * 100) : 0;
    const tempLeft = pct;
    const tempText = c.tempHp > 0 ? `<span class="temp-indicator">🛡️${c.tempHp}</span>` : '';
    const hasActive = activeRoll !== null;
    const selectedSum = hasActive ? getSelectedSum() : 0;
    let previewHtml = '';
    if (hasActive && selectedSum > 0) {
      if (activeRoll.mode === 'single') previewHtml = `<span class="hp-preview damage">-${selectedSum}</span>`;
      else if (activeRoll.mode === 'aoe') previewHtml = `<span class="hp-preview damage">💥-${selectedSum}</span>`;
      else if (activeRoll.mode === 'spread') previewHtml = `<span class="hp-preview damage">🎯</span>`;
    }
    card.innerHTML = `
      <div class="card-top">
        <div class="card-avatar" style="background:${c.color}">${initials}</div>
        <div class="card-info">
          <div class="card-name">${escapeHtml(c.name)}</div>
          <div class="card-subtitle">${escapeHtml(c.cls)} · Ур.${c.level} · AC ${c.ac}</div>
        </div>
        <div class="card-initiative">${c.init > 0 ? c.init : '—'}</div>
      </div>
      <div class="hp-section">
        <div class="hp-bar-container ${hasActive ? 'has-active-roll' : ''}" data-char-id="${c.id}" onclick="onHpBarClick(event, ${c.id})">
          <div class="hp-bar-base ${hpClass}" style="width:${pct}%"></div>
          ${c.tempHp > 0 ? `<div class="hp-bar-temp" style="left:${tempLeft}%; width:${tempPct}%"></div>` : ''}
          <div class="hp-text"><span>${c.hpCur}/${c.hpMax}</span>${tempText}</div>
          ${previewHtml}
        </div>
        <div class="hp-controls">
          <button class="hp-btn dmg" onclick="changeHp(${c.id}, -1)">-1</button>
          <button class="hp-btn dmg" onclick="changeHp(${c.id}, -5)">-5</button>
          <button class="hp-btn heal" onclick="changeHp(${c.id}, 1)">+1</button>
          <button class="hp-btn heal" onclick="changeHp(${c.id}, 5)">+5</button>
          <button class="hp-btn temp" onclick="promptTempHp(${c.id})">🛡️ Темп</button>
          <button class="hp-edit-btn" onclick="toggleHpInlineInput(this)">✏️</button>
          <input type="text" class="hp-inline-input" placeholder="+5, -3, t10, 25" onkeydown="handleHpInlineInput(event, ${c.id})" onblur="this.classList.remove('show')">
        </div>
      </div>
      <div class="statuses-row">${statusesHtml}<button class="add-status-btn" onclick="openStatusModal(${c.id})">+ статус</button></div>
      <div class="quick-rolls-row">${quickRollsHtml}<button class="add-roll-btn" onclick="openQuickRollModal(${c.id})">+ бросок</button></div>
      <div class="card-actions">
        <button class="card-btn" onclick="openModal('${type}', ${c.id})">✏️ Ред.</button>
        <button class="card-btn danger" onclick="removeCharacter(${c.id})">🗑️</button>
      </div>`;
    list.appendChild(card);
  });
  if (activeRoll && activeRoll.mode === 'aoe' && activeRoll.aoeTargets.size > 0) {
    let btn = document.getElementById('aoeApplyBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'aoeApplyBtn';
      btn.className = 'aoe-apply-btn';
      btn.onclick = applyAoE;
      document.body.appendChild(btn);
    }
    btn.textContent = `💥 Применить ${getSelectedSum()} урона к ${activeRoll.aoeTargets.size} целям`;
  } else {
    const existingBtn = document.getElementById('aoeApplyBtn');
    if (existingBtn) existingBtn.remove();
  }
}

function promptTempHp(charId) {
  const val = prompt('Временные HP:', '5');
  if (val === null) return;
  const num = parseInt(val);
  if (isNaN(num) || num <= 0) { showToast('❌ Введите число'); return; }
  applyTempHp(charId, num);
}

function renderTokens() {
  const map = document.getElementById('mapContainer');
  map.querySelectorAll('.map-token').forEach(t => t.remove());
  characters.forEach(c => {
    if (c.hpCur <= 0) return;
    const token = document.createElement('div');
    token.className = 'map-token';
    const isActive = combatActive && turnOrder[currentTurnIndex]?.id === c.id;
    if (isActive) token.classList.add('active-token');
    token.style.background = c.color;
    token.style.left = c.x + 'px';
    token.style.top = c.y + 'px';
    token.dataset.id = c.id;
    const statusDots = c.statuses.slice(0, 6).map(s => `<span class="token-status-dot" style="background:${s.color}" title="${escapeAttr(s.name)}"></span>`).join('');
    const tempText = c.tempHp > 0 ? ` 🛡️${c.tempHp}` : '';
    token.innerHTML = `${escapeHtml(c.name.substring(0,2))}<span class="token-hp">${c.hpCur}${tempText}</span><div class="token-statuses">${statusDots}</div>`;
    makeDraggable(token, c);
    map.appendChild(token);
  });
}

function renderInitOrder() {
  const el = document.getElementById('initOrder');
  const list = document.getElementById('initList');
  if (!combatActive || turnOrder.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  list.innerHTML = '';
  turnOrder.forEach((c, i) => {
    const item = document.createElement('div');
    item.className = `init-item${i === currentTurnIndex ? ' current' : ''}`;
    item.innerHTML = `<span class="init-dot" style="background:${c.color}"></span><span class="init-val">${c.init}</span><span>${escapeHtml(c.name)}</span>`;
    list.appendChild(item);
  });
}

function makeDraggable(token, char) {
  let startX, startY, origX, origY;
  token.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX; startY = e.clientY;
    origX = char.x; origY = char.y;
    const map = document.getElementById('mapContainer');
    const onMove = ev => {
      char.x = Math.max(0, Math.min(map.clientWidth - 50, origX + (ev.clientX - startX)));
      char.y = Math.max(0, Math.min(map.clientHeight - 50, origY + (ev.clientY - startY)));
      token.style.left = char.x + 'px';
      token.style.top = char.y + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

