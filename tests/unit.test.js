// ===== Модульные тесты D&D Encounter Builder =====
// Запуск: node tests/unit.test.js   (без внешних зависимостей)
//
// Мини-фреймворк: describe/it + assert. Файлы приложения загружаются
// в vm-контекст с mock DOM (tests/harness.js).

const assert = require('assert');
const { createSandbox } = require('./harness');

let passed = 0, failed = 0;
const failures = [];
let currentSuite = '';

function describe(name, fn) {
  const prev = currentSuite;
  currentSuite = name;
  fn();
  currentSuite = prev;
}

function it(name, fn) {
  const label = `${currentSuite} › ${name}`;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failed++;
    failures.push({ label, error: e });
    console.log(`  ✗ ${label}`);
    console.log(`      ${String(e.message).split('\n')[0]}`);
  }
}

// Детерминированный Math.random: sandbox.Math === глобальный Math,
// поэтому временно подменяем его на последовательность фиксированных значений.
function withSeededRandom(values, fn) {
  const orig = Math.random;
  let i = 0;
  Math.random = () => values[i++ % values.length];
  try { return fn(); } finally { Math.random = orig; }
}

// ---------- Настройки стенда ----------
const APP_FILES = ['utils.js', 'app-state.js', 'app-dice.js', 'app-hp.js', 'app-combat.js'];

// env.app.get/set — доступ к let/const приложения (characters, activeRoll...)
// env.exports / env.app.get(name) — функции приложения.
function F(env, name) {
  const fn = env.app.get(name);
  assert.strictEqual(typeof fn, 'function', `функция ${name} не найдена в контексте`);
  return fn;
}

// Создаём приложение с заглушками UI-слоя (renderAll/saveGameState и т.п.),
// которые объявлены в файлах, не входящих в тестовый набор.
function freshApp(stubs = {}) {
  const env = createSandbox(APP_FILES);
  const defaults = {
    renderAll: () => {},
    renderTokens: () => {},
    showToast: () => {},
    showFloatingText: () => {},
    saveGameState: () => {},
    updateTurnInfo: () => {},
    toggleHpInlineInput: () => {},
    tickStatuses: () => [],
    resetCombat: () => {
      env.app.set('combatActive', false);
      env.app.set('turnOrder', []);
      env.app.set('currentTurnIndex', -1);
      env.app.set('round', 1);
    },
  };
  for (const [name, impl] of Object.entries({ ...defaults, ...stubs })) {
    if (!env.app.has(name)) env.app.set(name, impl); // не перезаписываем реальные функции
  }
  env.addChar = (over = {}) => {
    const c = Object.assign({
      id: env.app.get('nextId')++, name: 'Чар', hpMax: 20, hpCur: 20, tempHp: 0, ac: 12, init: 0,
      isPC: true, statuses: [], x: 0, y: 0, color: '#e94560',
    }, over);
    env.app.get('characters').push(c);
    return c;
  };
  return env;
}

// Активирует бросок с фиксированными значениями кубиков.
function roll(env, expr, seeds) {
  const parsed = withSeededRandom(seeds, () => F(env, 'parseDiceExpression')(expr));
  F(env, 'setActiveRoll')(parsed);
  return parsed;
}

// =====================================================================
// 1. utils.js — escapeHtml / escapeAttr
// =====================================================================
describe('utils.js: escapeHtml', () => {
  const env = createSandbox(['utils.js']);
  const esc = env.app.get('escapeHtml');

  it('экранирует угловые скобки', () => {
    assert.strictEqual(esc('<script>alert("x")</script>'),
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
  it('экранирует амперсанд и апостроф', () => {
    assert.strictEqual(esc('a & b\'c'), 'a &amp; b&#039;c');
  });
  it('null/undefined → пустая строка', () => {
    assert.strictEqual(esc(null), '');
    assert.strictEqual(esc(undefined), '');
  });
  it('числа приводятся к строке', () => {
    assert.strictEqual(esc(42), '42');
  });
  it('обычный текст не меняется', () => {
    assert.strictEqual(esc('Громобой 20'), 'Громобой 20');
  });
});

describe('utils.js: escapeAttr', () => {
  const env = createSandbox(['utils.js']);
  const esc = env.app.get('escapeAttr');

  it('экранирует кавычки и переводы строк', () => {
    // \n внутри атрибута заменяется на литеральные два символа: обратный слэш + n
    assert.strictEqual(esc('line1\nline2 "q"'), 'line1\\nline2 &quot;q&quot;');
  });
  it('null → пустая строка', () => {
    assert.strictEqual(esc(null), '');
  });
});

// =====================================================================
// 2. utils.js — AppEvents (шина событий)
// =====================================================================
describe('utils.js: AppEvents', () => {
  const env = createSandbox(['utils.js']);
  const E = env.win.AppEvents;

  it('emit передаёт данные подписчику', () => {
    let got = null;
    E.on('test:e', (d) => { got = d; });
    E.emit('test:e', { a: 1 });
    assert.deepStrictEqual(got, { a: 1 });
    E.off('test:e');
  });
  it('несколько подписчиков вызываются по порядку', () => {
    const order = [];
    E.on('test:multi', () => order.push(1));
    E.on('test:multi', () => order.push(2));
    E.emit('test:multi');
    assert.deepStrictEqual(order, [1, 2]);
    E.off('test:multi');
  });
  it('off(event, cb) удаляет только указанного подписчика', () => {
    const calls = [];
    const cb1 = () => calls.push(1);
    const cb2 = () => calls.push(2);
    E.on('test:off', cb1);
    E.on('test:off', cb2);
    E.off('test:off', cb1);
    E.emit('test:off');
    assert.deepStrictEqual(calls, [2]);
    E.off('test:off');
  });
  it('ошибка в одном обработчике не блокирует остальные', () => {
    let secondCalled = false;
    E.on('test:err', () => { throw new Error('boom'); });
    E.on('test:err', () => { secondCalled = true; });
    E.emit('test:err');
    assert.ok(secondCalled, 'второй обработчик должен быть вызван');
    E.off('test:err');
  });
  it('emit несуществующего события безопасен', () => {
    assert.doesNotThrow(() => E.emit('no:such:event', 1));
  });
});

// =====================================================================
// 3. app-dice.js — validateExpression
// =====================================================================
describe('app-dice.js: validateExpression', () => {
  const env = createSandbox(APP_FILES);
  const v = (e) => env.app.get('validateExpression')(e);

  it('валидные выражения проходят', () => {
    for (const expr of ['1d20', '2d6+3', 'd8', '3d8 kh1', '4d6kl1+2', '10', '+5', '2d10-1d4']) {
      const r = v(expr);
      assert.strictEqual(r.valid, true, `ожидался valid для "${expr}", got ${JSON.stringify(r)}`);
      assert.strictEqual(r.error, null);
    }
  });
  it('пустое выражение невалидно', () => {
    assert.strictEqual(v('').valid, false);
    assert.strictEqual(v('   ').valid, false);
    assert.strictEqual(v(null).valid, false);
  });
  it('недопустимые символы отклоняются', () => {
    const r = v('1d20*2');
    assert.strictEqual(r.valid, false);
    assert.strictEqual(r.error, 'Недопустимые символы');
  });
  it('выражение не может начинаться с кубика без количества (d20 отдельно — валиден как токен, но не как старт)', () => {
    // 'd20' парсер принимает (число кубиков по умолчанию 1), а вот 'к20' — нет
    assert.strictEqual(v('d20').valid, true);
    const r = v('- ');
    assert.strictEqual(r.valid, false);
  });
  it('слишком много кубиков (>100) отклоняется', () => {
    const r = v('101d6');
    assert.strictEqual(r.valid, false);
    assert.match(r.error, /Количество/);
  });
  it('недопустимое число граней отклоняется', () => {
    assert.strictEqual(v('1d1').valid, false);   // sides < 2
    assert.strictEqual(v('1d1001').valid, false); // sides > 1000
  });
  it('keep больше количества кубиков отклоняется', () => {
    const r = v('2d6kh3');
    assert.strictEqual(r.valid, false);
    assert.match(r.error, /Нельзя оставить/);
  });
  it('мусорный токен отклоняется', () => {
    assert.strictEqual(v('1d20+abc').valid, false);
  });
});

// =====================================================================
// 4. app-dice.js — parseDiceExpression
// =====================================================================
describe('app-dice.js: parseDiceExpression', () => {
  const env = createSandbox(APP_FILES);
  const parse = (e) => env.app.get('parseDiceExpression')(e);

  it('фиксированные значения: 2d6+3 при выпадении 4 и 5 даёт 12', () => {
    const r = withSeededRandom([4, 5], () => parse('2d6+3'));
    assert.strictEqual(r.total, 12);
    assert.strictEqual(r.modifier, 3);
    assert.strictEqual(r.allDice.length, 2);
    assert.deepStrictEqual(r.allDice.map(d => d.value), [4, 5]);
    assert.ok(r.allDice.every(d => d.selected && !d.spent));
  });

  it('d8 без числа кубиков = один кубик', () => {
    const r = withSeededRandom([7], () => parse('d8'));
    assert.strictEqual(r.total, 7);
    assert.strictEqual(r.allDice[0].sides, 8);
  });

  it('kh сохраняет N старших кубиков и помечает остальные dropped', () => {
    // значения: 3, 6, 1 → keep highest 2 → выбраны 6 и 1... нет: 6 и 3
    const r = withSeededRandom([3, 6, 1], () => parse('3d6kh2'));
    const sel = r.allDice.filter(d => d.selected).map(d => d.value).sort((a, b) => b - a);
    assert.deepStrictEqual(sel, [6, 3]);
    assert.strictEqual(r.total, 9);
    const dropped = r.allDice.filter(d => d.dropped);
    assert.strictEqual(dropped.length, 1);
    assert.strictEqual(dropped[0].value, 1);
  });

  it('kl сохраняет N младших кубиков', () => {
    const r = withSeededRandom([3, 6, 1], () => parse('3d6kl1'));
    const sel = r.allDice.filter(d => d.selected);
    assert.strictEqual(sel.length, 1);
    assert.strictEqual(sel[0].value, 1);
    assert.strictEqual(r.total, 1);
  });

  it('отрицательный модификатор вычитается', () => {
    const r = withSeededRandom([4], () => parse('1d6-2'));
    assert.strictEqual(r.total, 2);
    assert.strictEqual(r.modifier, -2);
  });

  it('регистр и пробелы нормализуются', () => {
    const r = withSeededRandom([2, 5], () => parse('2D6 + 1'));
    assert.strictEqual(r.expression, '2d6+1');
    assert.strictEqual(r.total, 8);
  });

  it('все значения кубиков в допустимом диапазоне [1..sides]', () => {
    const r = parse('10d20+5');
    assert.strictEqual(r.allDice.length, 10);
    r.allDice.forEach(d => {
      assert.ok(d.value >= 1 && d.value <= d.sides, `значение ${d.value} вне диапазона d${d.sides}`);
    });
    assert.ok(r.total >= 10 + 5 && r.total <= 200 + 5);
  });

  it('отрицательные группы кубиков: 2d6-1d4', () => {
    const r = withSeededRandom([6, 6, 4], () => parse('2d6-1d4'));
    assert.strictEqual(r.total, 12 - 4);
    const neg = r.allDice.filter(d => d.sign === '-');
    assert.strictEqual(neg.length, 1);
    assert.strictEqual(neg[0].value, 4);
  });
});

// =====================================================================
// 5. app-hp.js — applyDamage / applyHeal / applyTempHp / changeHp
// =====================================================================
describe('app-hp.js: applyDamage', () => {
  it('урон уменьшает HP и не уходит ниже нуля', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 10 });
    F(env, 'applyDamage')(c.id, 15);
    assert.strictEqual(c.hpCur, 0);
    F(env, 'applyDamage')(c.id, 5);
    assert.strictEqual(c.hpCur, 0);
  });

  it('tempHP поглощает урон первым', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 20, tempHp: 5 });
    F(env, 'applyDamage')(c.id, 8);
    assert.strictEqual(c.tempHp, 0);
    assert.strictEqual(c.hpCur, 17);
  });

  it('нулевой/отрицательный урон игнорируется', () => {
    const env = freshApp();
    const c = env.addChar( { hpCur: 10 });
    F(env, 'applyDamage')(c.id, 0);
    F(env, 'applyDamage')(c.id, -5);
    assert.strictEqual(c.hpCur, 10);
  });

  it('для несуществующего персонажа не бросает исключение', () => {
    const env = freshApp();
    assert.doesNotThrow(() => F(env, 'applyDamage')(999, 5));
  });

  it('эмитит событие damage:taken', () => {
    const env = freshApp();
    const c = env.addChar();
    let payload = null;
    env.win.AppEvents.on('damage:taken', (d) => { payload = d; });
    F(env, 'applyDamage')(c.id, 3);
    assert.deepStrictEqual(payload, { id: c.id, amount: 3 });
  });

  it('не эмитит damage:taken внутри триггера (__inTrigger)', () => {
    const env = freshApp();
    const c = env.addChar();
    let called = false;
    env.win.AppEvents.on('damage:taken', () => { called = true; });
    env.win.__inTrigger = true;
    F(env, 'applyDamage')(c.id, 3);
    assert.strictEqual(called, false);
  });
});

describe('app-hp.js: applyHeal', () => {
  it('лечение повышает HP, но не выше максимума', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 10 });
    F(env, 'applyHeal')(c.id, 5);
    assert.strictEqual(c.hpCur, 15);
    F(env, 'applyHeal')(c.id, 100);
    assert.strictEqual(c.hpCur, 20);
  });

  it('tempHP не расходуется и не растёт при лечении', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 10, tempHp: 5 });
    F(env, 'applyHeal')(c.id, 3);
    assert.strictEqual(c.hpCur, 13);
    assert.strictEqual(c.tempHp, 5);
  });

  it('нулевое лечение игнорируется', () => {
    const env = freshApp();
    const c = env.addChar( { hpCur: 10 });
    F(env, 'applyHeal')(c.id, 0);
    assert.strictEqual(c.hpCur, 10);
  });
});

describe('app-hp.js: applyTempHp и changeHp', () => {
  it('applyTempHp суммируется с существующими временными HP', () => {
    const env = freshApp();
    const c = env.addChar( { tempHp: 3 });
    F(env, 'applyTempHp')(c.id, 4);
    assert.strictEqual(c.tempHp, 7);
  });

  it('changeHp(+) лечит, changeHp(-) наносит урон', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 10 });
    F(env, 'changeHp')(c.id, 5);
    assert.strictEqual(c.hpCur, 15);
    F(env, 'changeHp')(c.id, -8);
    assert.strictEqual(c.hpCur, 7);
  });
});

// =====================================================================
// 6. app-dice.js — getSelectedSum / toggleDie / consumeSelectedDice
// =====================================================================
describe('app-dice.js: активный бросок и сумма выбранных кубиков', () => {
  it('setActiveRoll фиксирует начальное число выбранных кубиков', () => {
    const env = freshApp();
    const parsed = withSeededRandom([2, 4, 6], () => F(env, 'parseDiceExpression')('3d6'));
    F(env, 'setActiveRoll')(parsed);
    assert.ok(env.app.get('activeRoll'), 'activeRoll должен быть установлен');
    assert.strictEqual(env.app.get('activeRoll').maxSelected, 3);
    assert.strictEqual(F(env, 'getSelectedSum')(), 12);
  });

  it('toggleDie переключает выбор и меняет сумму', () => {
    const env = freshApp();
    const parsed = withSeededRandom([2, 4], () => F(env, 'parseDiceExpression')('2d6'));
    F(env, 'setActiveRoll')(parsed);
    env.app.get('activeRoll').animating = false; // пропускаем анимацию
    F(env, 'toggleDie')(0);                 // снимаем кубик со значением 2
    assert.strictEqual(F(env, 'getSelectedSum')(), 4);
    F(env, 'toggleDie')(0);                 // возвращаем
    assert.strictEqual(F(env, 'getSelectedSum')(), 6);
  });

  it('потраченный кубик можно вернуть в игру через toggleDie', () => {
    const env = freshApp();
    const parsed = withSeededRandom([5], () => F(env, 'parseDiceExpression')('1d6'));
    F(env, 'setActiveRoll')(parsed);
    env.app.get('activeRoll').animating = false;
    const die = env.app.get('activeRoll').dice[0];
    die.spent = true;
    F(env, 'toggleDie')(die.id);
    assert.strictEqual(die.spent, false);
    assert.strictEqual(die.selected, true);
  });

  it('consumeSelectedDice снимает выбор, но не трогает spent', () => {
    const env = freshApp();
    const parsed = withSeededRandom([1, 2], () => F(env, 'parseDiceExpression')('2d6'));
    F(env, 'setActiveRoll')(parsed);
    F(env, 'consumeSelectedDice')();
    assert.ok(env.app.get('activeRoll').dice.every(d => !d.selected));
    assert.strictEqual(F(env, 'getSelectedSum')(), env.app.get('activeRoll').modifier);
  });

  it('getSelectedSum без активного броска возвращает 0', () => {
    const env = freshApp();
    assert.strictEqual(F(env, 'getSelectedSum')(), 0);
  });

  it('setApplyType/setRollMode работают только с активным броском', () => {
    const env = freshApp();
    F(env, 'setApplyType')('heal'); // не должен упасть без activeRoll
    F(env, 'setRollMode')('aoe');
    const parsed = withSeededRandom([3], () => F(env, 'parseDiceExpression')('1d6'));
    F(env, 'setActiveRoll')(parsed);
    F(env, 'setApplyType')('temp');
    F(env, 'setRollMode')('spread');
    assert.strictEqual(env.app.get('activeRoll').applyType, 'temp');
    assert.strictEqual(env.app.get('activeRoll').mode, 'spread');
    assert.strictEqual(env.app.get('activeRoll').aoeTargets.size, 0);
  });
});

// =====================================================================
// 7. app-hp.js — режимы применения броска (single/spread/AoE)
// =====================================================================
describe('app-hp.js: применение активного броска к персонажу', () => {
  function rollWith(env, expr, seeds) {
    const parsed = withSeededRandom(seeds, () => F(env, 'parseDiceExpression')(expr));
    F(env, 'setActiveRoll')(parsed);
    env.app.get('activeRoll').animating = false;
    return parsed;
  }

  it('single-режим: урон = сумма выбранных + модификатор, затем сброс выбора', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 20 });
    rollWith(env, '2d6+1', [3, 4]);
    F(env, 'applyActiveRollToCharacter')(c.id);
    assert.strictEqual(c.hpCur, 20 - 8);
    assert.ok(env.app.get('activeRoll').dice.every(d => !d.selected));
  });

  it('single-режим с applyType=heal лечит', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 20, hpCur: 5 });
    rollWith(env, '1d8', [6]);
    F(env, 'setApplyType')('heal');
    F(env, 'applyActiveRollToCharacter')(c.id);
    assert.strictEqual(c.hpCur, 11);
  });

  it('spread-режим: тратит по одному кубику на клик, после последнего — clearActiveRoll', () => {
    const env = freshApp();
    const c = env.addChar( { hpMax: 50, hpCur: 50 });
    rollWith(env, '3d6', [2, 3, 4]);
    F(env, 'setRollMode')('spread');
    F(env, 'applySpreadToCharacter')(c.id);
    assert.strictEqual(c.hpCur, 48);
    assert.strictEqual(env.app.get('activeRoll').dice.filter(d => d.spent).length, 1);
    F(env, 'applySpreadToCharacter')(c.id);
    assert.strictEqual(c.hpCur, 45);
    F(env, 'applySpreadToCharacter')(c.id);
    assert.strictEqual(c.hpCur, 41);
    assert.strictEqual(env.app.get('activeRoll'), null, 'после исчерпания кубиков броск должен сняться');
  });

  it('AoE-режим: повторный клик по цели снимает её с целей', () => {
    const env = freshApp();
    const c = env.addChar();
    rollWith(env, '4d6', [1, 2, 3, 4]);
    F(env, 'setRollMode')('aoe');
    F(env, 'onTokenClick')(c.id);
    assert.ok(env.app.get('activeRoll').aoeTargets.has(c.id));
    F(env, 'onTokenClick')(c.id);
    assert.strictEqual(env.app.get('activeRoll').aoeTargets.size, 0);
  });

  it('onTokenClick без активного броска безопасен', () => {
    const env = freshApp();
    const c = env.addChar();
    assert.doesNotThrow(() => F(env, 'onTokenClick')(c.id));
  });
});

// =====================================================================
// 8. app-combat.js — старт боя, порядок инициативы, ходы
// =====================================================================
describe('app-combat.js: startCombat / nextTurn', () => {
  it('бой начинается только если есть живые персонажи', () => {
    const env = freshApp();
    F(env, 'startCombat')();
    assert.strictEqual(env.app.get('combatActive'), false);

    env.addChar( { hpCur: 0 });
    F(env, 'startCombat')();
    assert.strictEqual(env.app.get('combatActive'), false, 'мертвые персонажи не запускают бой');
  });

  it('порядок хода сортирован по инициативе убыв.', () => {
    const env = freshApp();
    withSeededRandom([10, 10, 10], () => {
      env.addChar( { init: 5 });   // 15
      env.addChar( { init: 1 });   // 11
      env.addChar( { init: 9 });   // 19
      F(env, 'startCombat')();
    });
    assert.deepStrictEqual(env.app.get('turnOrder').map(c => c.init), [9, 5, 1]);
    assert.strictEqual(env.app.get('currentTurnIndex'), 0);
    assert.strictEqual(env.app.get('round'), 1);
  });

  it('nextTurn продвигает ход; переход через конец раунда увеличивает round', () => {
    const env = freshApp();
    withSeededRandom([10, 10], () => {
      env.addChar( { init: 2 });
      env.addChar( { init: 1 });
      F(env, 'startCombat')();
    });
    const startedRounds = [];
    env.win.AppEvents.on('turn:start', () => startedRounds.push(env.app.get('round')));
    F(env, 'nextTurn')(); // индекс 1
    assert.strictEqual(env.app.get('currentTurnIndex'), 1);
    assert.strictEqual(env.app.get('round'), 1);
    F(env, 'nextTurn')(); // новый раунд
    assert.strictEqual(env.app.get('round'), 2);
    assert.strictEqual(env.app.get('currentTurnIndex'), 0);
  });

  it('эмитятся события turn:end и turn:start', () => {
    const env = freshApp();
    const events = [];
    env.win.AppEvents.on('turn:end', (id) => events.push(['end', id]));
    env.win.AppEvents.on('turn:start', (id) => events.push(['start', id]));
    withSeededRandom([10, 10], () => {
      const a = env.addChar( { init: 0 });
      const b = env.addChar( { init: 0 });
      F(env, 'startCombat')();
      F(env, 'nextTurn')();
    });
    assert.deepStrictEqual(events, [['end', a.id], ['start', b.id]]);
  });

  it('павшие в бою персонажи удаляются из порядка хода', () => {
    const env = freshApp();
    let a, b;
    withSeededRandom([10, 10], () => {
      a = env.addChar( { init: 5 });
      b = env.addChar( { init: 1 });
      F(env, 'startCombat')();
    });
    a.hpCur = 0; // через ссылку на объект в characters
    // проходим полный круг: a -> b -> конец раунда
    F(env, 'nextTurn')();
    F(env, 'nextTurn')();
    assert.strictEqual(env.app.get('turnOrder').length, 1);
    assert.strictEqual(env.app.get('turnOrder')[0].id, b.id);
  });

  it('resetCombat очищает состояние', () => {
    const env = freshApp();
    withSeededRandom([10], () => { addChar(s); F(env, 'startCombat')(); });
    F(env, 'resetCombat')();
    assert.strictEqual(env.app.get('combatActive'), false);
    assert.strictEqual(env.app.get('turnOrder').length, 0);
    assert.strictEqual(env.app.get('currentTurnIndex'), -1);
    assert.strictEqual(env.app.get('round'), 1);
    assert.ok(env.app.get('characters').every(c => c.initiativeScore === undefined));
  });
});

// =====================================================================
// 9. app-state.js — константы состояния
// =====================================================================
describe('app-state.js: базовые данные', () => {
  const env = createSandbox(['app-state.js']);
  const COLORS = env.snapshot().COLORS;
  const STATUS_DEFS = env.snapshot().STATUS_DEFS;

  it('COLORS содержит 12 цветов формата #rrggbb', () => {
    assert.strictEqual(COLORS.length, 12);
    COLORS.forEach(c => assert.match(c, /^#[0-9a-f]{6}$/i));
  });

  it('STATUS_DEFS.permanent содержит классические статусы D&D 5e', () => {
    const ids = STATUS_DEFS.permanent.map(s => s.id);
    ['blinded', 'charmed', 'frightened', 'poisoned', 'prone', 'stunned', 'unconscious']
      .forEach(id => assert.ok(ids.includes(id), `нет статуса ${id}`));
  });

  it('все определения статусов имеют id, name, icon и color', () => {
    [...STATUS_DEFS.permanent, ...STATUS_DEFS.timed].forEach(st => {
      assert.ok(st.id && st.name && st.icon && /^#/.test(st.color), `неполное определение: ${JSON.stringify(st)}`);
    });
  });

  it('id статусов уникальны в рамках каждой категории', () => {
    for (const cat of ['permanent', 'timed']) {
      const ids = STATUS_DEFS[cat].map(s => s.id);
      assert.strictEqual(new Set(ids).size, ids.length, `дубликаты id в ${cat}`);
    }
  });
});

// =====================================================================
// Итоги
// =====================================================================
console.log(`\nИтого: ${passed} пройдено, ${failed} провалено.`);
if (failures.length) {
  console.log('\n--- Детали провалов ---');
  failures.forEach(f => {
    console.log(`\n[FAIL] ${f.label}\n${f.error.stack || f.error.message}`);
  });
  process.exit(1);
}
process.exit(0);
