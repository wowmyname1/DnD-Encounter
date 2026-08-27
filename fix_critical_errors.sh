#!/bin/bash

echo "🚀 Запуск скрипта исправления критических ошибок DnD-Encounter..."

# Создаем временный Python-скрипт для безопасного рефакторинга
cat << 'EOF' > fix_dnd.py
import re
import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Добавляем недостающие функции в app-char.js
char_js_path = 'app-char.js'
if os.path.exists(char_js_path):
    content = read_file(char_js_path)
    missing_funcs = """

function expToLevel(exp) {
  const thresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (exp >= thresholds[i]) return i + 1;
  }
  return 1;
}

function calculateHpFromCon(hitDie, conScore, level) {
  const conMod = Math.floor((conScore - 10) / 2);
  let hp = hitDie + conMod;
  for (let i = 2; i <= level; i++) {
    hp += Math.floor(hitDie / 2) + 1 + conMod;
  }
  return Math.max(1, hp);
}

function presetHpMax(p) {
  if (p.useHpFormula) {
    const conMod = Math.floor((p.abilities.con - 10) / 2);
    let hp = p.hpBase + (conMod * (p.hpConFactor || 1));
    for (let i = 2; i <= p.level; i++) {
      hp += p.hpPerLevel + (conMod * (p.hpConFactor || 1));
    }
    return Math.max(1, hp);
  }
  return p.hpMax || 1;
}

function onCardNameClick(event, id) {
  event.stopPropagation();
  openCharDetails(id);
}
"""
    if "function expToLevel" not in content:
        content += missing_funcs
        write_file(char_js_path, content)
        print("✅ app-char.js: Добавлены недостающие функции")

# 2. Исправляем дубликаты функций (оставляем только последнее определение)
def remove_duplicate_functions(filepath):
    if not os.path.exists(filepath): return
    content = read_file(filepath)
    lines = content.split('\n')
    
    all_occurrences = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        match = re.match(r'^function\s+([a-zA-Z0-9_]+)\s*\(', line)
        if match:
            func_name = match.group(1)
            start_idx = i
            brace_count = 0
            started = False
            end_idx = i
            for j in range(i, len(lines)):
                brace_count += lines[j].count('{') - lines[j].count('}')
                if '{' in lines[j]: started = True
                if started and brace_count == 0:
                    end_idx = j
                    break
            
            if func_name not in all_occurrences:
                all_occurrences[func_name] = []
            all_occurrences[func_name].append((start_idx, end_idx))
            i = end_idx + 1
        else:
            i += 1
            
    lines_to_remove = set()
    for func_name, occurrences in all_occurrences.items():
        if len(occurrences) > 1:
            for start, end in occurrences[:-1]:
                for k in range(start, end + 1):
                    lines_to_remove.add(k)
                    
    if lines_to_remove:
        new_lines = [line for idx, line in enumerate(lines) if idx not in lines_to_remove]
        write_file(filepath, '\n'.join(new_lines))
        print(f"✅ {filepath}: Удалены дубликаты функций")

remove_duplicate_functions('app-core.js')
remove_duplicate_functions('app-dice.js')

# 3. Исправляем мертвый код в app-core.js (onCardClick)
core_js_path = 'app-core.js'
if os.path.exists(core_js_path):
    content = read_file(core_js_path)
    old_code = """  const die = selectedDice[0];
  applySpreadToCharacter(charId); return;
  die.spent = true;
  die.selected = false;
  const remaining = activeRoll.dice.filter(d => !d.spent);
  if (remaining.length === 0) clearActiveRoll();
  else {
    updateActiveRollUI();
    renderAll();
    const remainingCount = activeRoll.dice.filter(d => d.selected && !d.spent).length;
    showToast(`Осталось кубиков: ${remainingCount}`);
  }"""
    new_code = "  applySpreadToCharacter(charId);"
    if old_code in content:
        content = content.replace(old_code, new_code)
        write_file(core_js_path, content)
        print("✅ app-core.js: Исправлен мертвый код в onCardClick")

# 4. Исправляем баг с классом мертвого токена в app-ui.js
ui_js_path = 'app-ui.js'
if os.path.exists(ui_js_path):
    content = read_file(ui_js_path)
    old_code = """    if (c.hpCur <= 0) token.classList.add("dead-token");
    token.className = 'map-token';"""
    new_code = """    token.className = 'map-token';
    if (c.hpCur <= 0) token.classList.add("dead-token");"""
    if old_code in content:
        content = content.replace(old_code, new_code)
        write_file(ui_js_path, content)
        print("✅ app-ui.js: Исправлен баг с dead-token классом")

# 5. Исправляем бесконечный урон (clearSelection -> consumeSelectedDice)
hp_js_path = 'app-hp.js'
if os.path.exists(hp_js_path):
    content = read_file(hp_js_path)
    content = re.sub(r'(closeHpPopup\(\);\s*)clearSelection\(\);', r'\1consumeSelectedDice();', content)
    write_file(hp_js_path, content)
    print("✅ app-hp.js: clearSelection заменен на consumeSelectedDice")

setup_js_path = 'app-setup.js'
if os.path.exists(setup_js_path):
    content = read_file(setup_js_path)
    if 'clearSelection();' in content:
        content = content.replace('clearSelection();', 'consumeSelectedDice();')
        write_file(setup_js_path, content)
        print("✅ app-setup.js: clearSelection заменен на consumeSelectedDice в хоткеях")

# 6. Исправляем логику инициативы в app-combat.js
combat_js_path = 'app-combat.js'
if os.path.exists(combat_js_path):
    content = read_file(combat_js_path)
    
    # startCombat
    old_init = """  alive.forEach(c => { if (c.init === 0) c.init = Math.floor(Math.random() * 20) + 1; });
  turnOrder = [...alive].sort((a, b) => b.init - a.init);"""
    new_init = """  alive.forEach(c => { c.initiativeScore = (Math.floor(Math.random() * 20) + 1) + c.init; });
  turnOrder = [...alive].sort((a, b) => b.initiativeScore - a.initiativeScore);"""
    
    if old_init in content:
        content = content.replace(old_init, new_init)
        print("✅ app-combat.js: Исправлена логика броска инициативы")
        
    # resetCombat
    old_reset = "  characters.forEach(c => c.init = 0);"
    new_reset = "  characters.forEach(c => { delete c.initiativeScore; });"
    if old_reset in content:
        content = content.replace(old_reset, new_reset)
        print("✅ app-combat.js: Исправлен сброс инициативы")
        
    write_file(combat_js_path, content)

print("\n🎉 Все критические ошибки исправлены!")
EOF

# Запускаем Python скрипт
python3 fix_dnd.py

# Удаляем временный скрипт
rm fix_dnd.py

echo "🔥 Готово! Проверьте изменения с помощью 'git diff' и закоммитьте их."