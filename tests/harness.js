// ===== Тестовый стенд (минимальный mock браузера) =====
// Загружает файлы приложения в vm-контекст с window/document,
// позволяя тестировать логику модулей без настоящего браузера.
//
// Как это работает:
// 1. Все запрошенные файлы склеиваются в один eval-фрейм — как несколько
//    <script> на одной странице: функции видят let/const из других файлов.
// 2. В конце фрейма добавляется «мост» __APP__, который даёт тестам:
//      get(name) / set(name, value) / has(name) — доступ к let/const
//      переменным приложения (characters, activeRoll, round и т.д.),
//      а также all() — снимок всех bindings сразу.
// 3. Функции верхнего уровня экспортируются объектом exports — тесты
//    вызывают их напрямую (аналог window.foo в браузере).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// ---------- Mock DOM ----------
function makeEl(id) {
  const el = {
    id: id || '',
    tagName: 'DIV',
    value: '',
    textContent: '',
    innerHTML: '',
    title: '',
    href: '',
    style: {},
    dataset: {},
    children: [],
    _classes: new Set(),
    classList: null,
    parentElement: null,
    currentTarget: null,
    clientWidth: 800,
    clientHeight: 600,
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 50 }; },
    appendChild(child) { this.children.push(child); child.parentElement = this; return child; },
    removeChild(child) { this.children = this.children.filter(c => c !== child); return child; },
    addEventListener() {},
    removeEventListener() {},
    closest() { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    blur() {},
    click() {},
    scrollIntoView() {},
  };
  el.classList = {
    add: (...cs) => cs.forEach(c => el._classes.add(c)),
    remove: (...cs) => cs.forEach(c => el._classes.delete(c)),
    toggle: (c, force) => {
      const on = force === undefined ? !el._classes.has(c) : !!force;
      if (on) el._classes.add(c); else el._classes.delete(c);
      return on;
    },
    contains: (c) => el._classes.has(c),
  };
  return el;
}

function makeDocument(win) {
  const elementsById = {};
  const doc = {
    readyState: 'loading',
    getElementById(id) {
      if (!elementsById[id]) elementsById[id] = makeEl(id);
      return elementsById[id];
    },
    createElement(tag) { const el = makeEl(); el.tagName = String(tag).toUpperCase(); return el; },
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    addEventListener(type, cb) { (doc._listeners[type] = doc._listeners[type] || []).push(cb); },
    removeEventListener() {},
    _listeners: {},
    body: makeEl('body'),
    head: makeEl('head'),
    documentElement: (() => { const e = makeEl('html'); e.clientWidth = 800; e.clientHeight = 600; return e; })(),
  };
  doc.defaultView = win;
  return doc;
}

function makeLocalStorage() {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
}

// Собирает имена function-деклараций верхнего уровня исходника.
function collectFunctionNames(code) {
  const names = new Set();
  const re = /^function\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(code))) names.add(m[1]);
  return [...names];
}

// Собирает имена let/const/var верхнего уровня исходника.
function collectVarNames(code) {
  const names = new Set();
  const re = /^(?:let|const|var)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(code))) names.add(m[1]);
  return [...names];
}

// ---------- Создание контекста ----------
function createSandbox(files) {
  const sandbox = {};

  // setTimeout выполняется синхронно (упрощение для детерминизма тестов):
  // анимационные колбэки setActiveRoll отрабатывают сразу.
  const timers = [];
  const win = {
    setTimeout: (fn, ms) => { try { fn(); } catch (e) { console.error('sync timer error:', e); } return timers.length; },
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => { try { fn(0); } catch (e) {} return 0; },
    localStorage: makeLocalStorage(),
    location: { hash: '', search: '' },
    navigator: { userAgent: 'node-test' },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener: (type, cb) => { (win._listeners[type] = win._listeners[type] || []).push(cb); },
    removeEventListener: () => {},
    _listeners: {},
    alert: () => {},
    confirm: () => true,
    prompt: () => null,
    scrollTo: () => {},
    open: () => {},
    print: () => {},
  };
  win.self = win;
  win.top = win;
  win.window = win;
  win.document = makeDocument(win);

  Object.assign(sandbox, {
    window: win,
    document: win.document,
    localStorage: win.localStorage,
    navigator: win.navigator,
    location: win.location,
    self: win,
    setTimeout: win.setTimeout,
    clearTimeout: win.clearTimeout,
    setInterval: win.setInterval,
    clearInterval: win.clearInterval,
    requestAnimationFrame: win.requestAnimationFrame,
    matchMedia: win.matchMedia,
    alert: win.alert,
    confirm: win.confirm,
    prompt: win.prompt,
    console,
  });

  const context = vm.createContext(sandbox);

  const sources = files.map(rel => ({
    name: rel,
    code: fs.readFileSync(path.join(ROOT, rel), 'utf8'),
  }));

  const fnNames = new Set();
  const varNames = new Set();
  for (const f of sources) {
    collectFunctionNames(f.code).forEach(n => fnNames.add(n));
    collectVarNames(f.code).forEach(n => varNames.add(n));
  }

  const parts = sources.map(f => `/* ===== ${f.name} ===== */\n${f.code}\n`);

  // Экспорт функций: typeof guard, чтобы не упасть на unusual-объявлениях.
  const exportPairs = [...fnNames].map(n => `${JSON.stringify(n)}: typeof ${n} === "function" ? ${n} : undefined`).join(',\n    ');
  // Снимок let/const: try/catch на случай TDZ.
  const snapshotPairs = [...varNames].map(n =>
    `${JSON.stringify(n)}: (function(){ try { return ${n}; } catch(e) { return "<TDZ>"; } })()`).join(',\n    ');

  const body = `(function(__files) {\n` +
    parts.join('\n') +
    `\nreturn {\n  exports: {\n    ${exportPairs}\n  },\n` +
    `  bridge: {\n` +
    `    get: function(n){ return eval(n); },\n` +
    `    set: function(n,v){ return eval(n + "=v"); },\n` +
    `    has: function(n){ try { eval(n); return true; } catch(e) { return false; } }\n` +
    `  },\n` +
    `  snapshot: function(){ return {\n    ${snapshotPairs}\n  }; }\n` +
    `};\n})`;

  const result = vm.runInContext(body, context, { filename: 'app-bundle.js' })
    .call(undefined, sources.map(f => f.name));

  // Функции приложения доступны как свойства sandbox (глобал контекста),
  // поэтому код внутри фрейма видит их так же, как браузер через window.
  Object.assign(sandbox, result.exports);

  return {
    sandbox,
    context,
    win,
    document: win.document,
    app: result.bridge,          // get/set/has для let/const
    exports: result.exports,     // функции верхнего уровня
    snapshot: result.snapshot,   // все let/const значения одним объектом
  };
}

module.exports = { createSandbox, makeEl };
