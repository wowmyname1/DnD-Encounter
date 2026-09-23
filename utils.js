// ===== УТИЛИТЫ =====

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

// ===== СИСТЕМА СОБЫТИЙ =====
window.AppEvents = (function() {
  const events = {};
  
  function on(event, callback) {
    if (!events[event]) events[event] = [];
    events[event].push(callback);
  }
  
  function emit(event, data) {
    if (!events[event]) return;
    events[event].forEach(cb => {
      try { cb(data); } catch(e) { console.error('Event error:', event, e); }
    });
  }
  
  function off(event, callback) {
    if (!events[event]) return;
    if (callback) {
      events[event] = events[event].filter(cb => cb !== callback);
    } else {
      events[event] = [];
    }
  }
  
  return { on, emit, off };
})();
