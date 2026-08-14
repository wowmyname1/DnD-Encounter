import { useState } from 'react';
import { cn } from '../utils/cn';
import { useStore, parseDiceExpression, validateExpression } from '../store/useStore';
import { Save, X } from 'lucide-react';

export function DicePanel() {
  const [expression, setExpression] = useState('');
  const [modifier, setModifier] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeRoll,
    savedRolls,
    diceHistory,
    setActiveRoll,
    clearActiveRoll,
    clearSelection,
    toggleDie,
    setRollMode,
    addToDiceHistory,
    saveRoll,
    deleteSavedRoll,
  } = useStore();

  const handleRoll = () => {
    const expr = expression.trim();
    const validation = validateExpression(expr);
    
    if (!validation.valid) {
      setError(validation.error || 'Неверное выражение');
      return;
    }

    setError(null);
    const result = parseDiceExpression(expr);
    setActiveRoll(result);
    addToDiceHistory(`${expr} = ${result.total}`);
  };

  const rollDice = (sides: number) => {
    const mod = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : '';
    const expr = `1d${sides}${mod}`;
    const result = parseDiceExpression(expr);
    setActiveRoll(result);
    addToDiceHistory(`${expr} = ${result.total}`);
  };

  const getSelectedSum = () => {
    if (!activeRoll) return 0;
    let sum = 0;
    activeRoll.parseResult.dice.forEach(d => {
      if (d.selected) {
        sum += d.value;
      }
    });
    return sum;
  };

  const isNat20 = activeRoll && activeRoll.parseResult.dice.length === 1 && 
    activeRoll.parseResult.dice[0].sides === 20 && 
    activeRoll.parseResult.dice[0].value === 20;

  const isNat1 = activeRoll && activeRoll.parseResult.dice.length === 1 && 
    activeRoll.parseResult.dice[0].sides === 20 && 
    activeRoll.parseResult.dice[0].value === 1;

  return (
    <div className="bg-gradient-to-t from-[#0d1b2a] to-[#16213e] border-t border-white/10 p-2.5 flex flex-col gap-2 flex-shrink-0">
      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Dice buttons */}
        <div className="flex gap-1.5 items-center">
          {[4, 6, 8, 10, 12, 20].map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice(sides)}
              className="w-12 h-12 rounded-lg border-2 border-white/10 bg-gradient-to-br from-white/6 to-white/2 text-white cursor-pointer transition-all hover:border-[#d4a843] hover:from-[#d4a843]/15 hover:to-[#d4a843]/5 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex flex-col items-center justify-center"
            >
              <span className="text-sm">d{sides}</span>
            </button>
          ))}
        </div>

        {/* Active roll display */}
        {activeRoll ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[48px] gap-1.5">
            <div
              className={cn(
                'text-3xl font-black transition-all px-3 py-1 rounded-lg cursor-pointer',
                activeRoll && 'border-2 border-[#d4a843]',
                isNat20 && 'text-[#4ecca3] shadow-[0_0_30px_rgba(78,204,163,0.6)]',
                isNat1 && 'text-[#e94560] shadow-[0_0_30px_rgba(233,69,96,0.6)]',
                !isNat20 && !isNat1 && 'text-[#d4a843] shadow-[0_0_20px_rgba(212,168,67,0.4)]',
              )}
              onClick={clearSelection}
            >
              {getSelectedSum()}
            </div>
            <span className="text-xs text-[#8892a4]">Нажмите для сброса выбора</span>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Modifier */}
        <div className="flex items-center gap-1 text-[#8892a4] text-sm">
          <span>Мод:</span>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
            className="w-10 bg-white/6 border border-white/10 text-white rounded px-1 py-0.5 text-center text-sm"
          />
        </div>
      </div>

      {/* Mode bar */}
      {activeRoll && (
        <div className="flex gap-1 items-center opacity-100 pointer-events-auto">
          {(['single', 'aoe', 'spread'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRollMode(mode)}
              className={cn(
                'px-2.5 py-1 bg-white/4 border border-white/10 text-[#8892a4] rounded text-xs cursor-pointer transition-all flex items-center gap-1',
                'hover:bg-white/8 hover:text-white',
                activeRoll.mode === mode && 'bg-[#d4a843]/15 border-[#d4a843] text-[#d4a843]',
              )}
            >
              {mode === 'single' && '🎯 Одна цель'}
              {mode === 'aoe' && '💥 AoE'}
              {mode === 'spread' && '✨ По площади'}
            </button>
          ))}
          
          <button
            onClick={clearActiveRoll}
            className="ml-auto px-2 py-1 bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] rounded text-xs cursor-pointer transition-all hover:bg-[#e94560]/20"
          >
            ✕ Очистить
          </button>
        </div>
      )}

      {/* Dice tray */}
      {activeRoll && (
        <div className="flex gap-1 flex-wrap justify-center max-w-[400px] min-h-7">
          {activeRoll.parseResult.dice.map((die, i) => (
            <div
              key={die.id}
              onClick={() => toggleDie(die.id)}
              className={cn(
                'w-7 h-7 bg-white/6 border-2 rounded-md flex items-center justify-center text-sm font-bold cursor-pointer transition-all',
                die.dropped && 'opacity-30 border-dashed',
                die.selected && 'border-[#d4a843] bg-[#d4a843]/20 text-[#d4a843] shadow-[0_0_8px_rgba(212,168,67,0.3)]',
                !die.selected && !die.dropped && 'border-white/15 text-[#8892a4] hover:border-[#d4a843] hover:bg-[#d4a843]/10',
              )}
              style={{
                animation: `dieDrop 0.4s ease backwards ${i * 0.08}s`,
              }}
            >
              {die.value}
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-center relative">
        <div className="flex-1 relative flex flex-col">
          <div className="relative">
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRoll()}
              placeholder="2d6 + 1d8 - 1"
              className={cn(
                'w-full px-3 py-2 pr-8 bg-white/6 border rounded-lg text-sm font-mono outline-none transition-all',
                error 
                  ? 'border-[#e94560] shadow-[0_0_0_2px_rgba(233,69,96,0.15)]' 
                  : 'border-white/10 focus:border-[#d4a843]',
              )}
            />
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/8 border border-white/10 text-[#8892a4] text-xs font-bold cursor-pointer transition-all hover:bg-[#d4a843] hover:text-[#1a1a2e] hover:border-[#d4a843]"
            >
              ?
            </button>
          </div>
          
          {error && (
            <div className="text-xs text-[#e94560] mt-1 min-h-[14px] pl-0.5">{error}</div>
          )}
          
          {/* Help popover */}
          {showHelp && (
            <div className="absolute bottom-full left-0 right-0 bg-[#16213e] border border-[#d4a843] rounded-lg p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-100 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="font-[MedievalSharp] text-[#d4a843] text-sm mb-2.5">Формат бросков</h4>
              <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                {[
                  { code: '1d20', desc: 'Один d20' },
                  { code: '2d6 + 3', desc: '2к6 + модификатор' },
                  { code: '4d6kh3', desc: '4к6 оставить лучшие 3' },
                  { code: '3d8kl2', desc: '3к8 оставить худшие 2' },
                ].map((item) => (
                  <div
                    key={item.code}
                    onClick={() => {
                      setExpression(item.code);
                      setShowHelp(false);
                    }}
                    className="p-1.5 bg-white/4 border border-white/10 rounded cursor-pointer transition-all hover:bg-[#d4a843]/10 hover:border-[#d4a843]"
                  >
                    <code className="font-mono text-[#d4a843] text-sm font-semibold block">{item.code}</code>
                    <span className="text-[#8892a4] text-xs">{item.desc}</span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-white/10 my-2" />
              <p className="text-xs text-[#8892a4] leading-relaxed">
                Используйте <code className="text-[#d4a843]">kh</code> (keep highest) или <code className="text-[#d4a843]">kl</code> (keep lowest) для отбора костей.
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleRoll}
          disabled={!expression.trim()}
          className="px-4 py-2 bg-[#d4a843] text-[#1a1a2e] border-none rounded-lg font-semibold text-sm cursor-pointer transition-all hover:bg-[#e0b84e] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Бросить
        </button>

        <button
          onClick={() => {
            const validation = validateExpression(expression.trim());
            if (validation.valid && expression.trim()) {
              saveRoll(`Бросок ${savedRolls.length + 1}`, expression.trim());
            }
          }}
          disabled={!expression.trim()}
          className="px-3 py-2 bg-white/6 border border-white/10 text-[#8892a4] rounded-lg cursor-pointer transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <Save size={16} />
        </button>
      </div>

      {/* Saved rolls */}
      {savedRolls.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-1">
          {savedRolls.map((roll) => (
            <button
              key={roll.id}
              onClick={() => {
                setExpression(roll.expression);
              }}
              className="px-2.5 py-1 bg-[#d4a843]/8 border border-[#d4a843]/25 rounded-full text-xs text-[#d4a843] cursor-pointer transition-all hover:bg-[#d4a843]/15 hover:border-[#d4a843] font-mono flex items-center gap-1"
            >
              {roll.label}
              <X
                size={12}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSavedRoll(roll.id);
                }}
                className="hover:text-white"
              />
            </button>
          ))}
        </div>
      )}

      {/* History */}
      {diceHistory.length > 0 && (
        <div className="flex gap-1 items-center max-w-[300px] overflow-x-auto scrollbar-hide">
          {diceHistory.slice(0, 5).map((entry, i) => (
            <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-xs text-[#8892a4] whitespace-nowrap flex-shrink-0">
              {entry}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
