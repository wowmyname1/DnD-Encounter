// ===== СОХРАНЕНИЕ И ЗАГРУЗКА СОСТОЯНИЯ =====

const STORAGE_KEY = 'dndEncounterState';

function saveGameState() {
  try {
    const state = {
      characters: characters,
      combatActive: combatActive,
      turnOrder: turnOrder,
      currentTurnIndex: currentTurnIndex,
      round: round,
      nextId: nextId,
      statusUid: statusUid,
      quickRollUid: quickRollUid,
      customStatuses: typeof customStatuses !== 'undefined' ? customStatuses : [],
      customSpells: typeof customSpells !== 'undefined' ? customSpells : []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Не удалось сохранить состояние:', e);
  }
}

function loadGameState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    
    const state = JSON.parse(saved);
    
    if (state.characters) window.characters = state.characters;
    if (typeof state.combatActive !== 'undefined') window.combatActive = state.combatActive;
    if (state.turnOrder) window.turnOrder = state.turnOrder;
    if (typeof state.currentTurnIndex !== 'undefined') window.currentTurnIndex = state.currentTurnIndex;
    if (typeof state.round !== 'undefined') window.round = state.round;
    if (state.nextId) window.nextId = state.nextId;
    if (state.statusUid) window.statusUid = state.statusUid;
    if (state.quickRollUid) window.quickRollUid = state.quickRollUid;
    if (state.customStatuses) window.customStatuses = state.customStatuses;
    if (state.customSpells) window.customSpells = state.customSpells;
    
    return true;
  } catch (e) {
    console.warn('Не удалось загрузить состояние:', e);
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
}

function clearGameState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Не удалось очистить состояние:', e);
  }
}
