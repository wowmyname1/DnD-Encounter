(function () {
  window.__inTrigger = false;

  window.escapeHtml = function (value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  window.escapeAttr = window.escapeHtml;

  window.AppEvents = {
    listeners: {},
    on: function (event, fn) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(fn);
    },
    off: function (event, fn) {
      if (!this.listeners[event]) {
        return;
      }
      this.listeners[event] = this.listeners[event].filter(function (item) {
        return item !== fn;
      });
    },
    emit: function (event, payload) {
      if (!this.listeners[event]) {
        return;
      }
      this.listeners[event].forEach(function (fn) {
        fn(payload);
      });
    }
  };
})();
