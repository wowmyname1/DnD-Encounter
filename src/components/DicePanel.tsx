import { useDiceStore } from '@/stores/diceStore'

const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100]

export function DicePanel() {
  const { activeRoll, history, modifier, rollDie, setMode, toggleDie, clearRoll, clearSelection, getSelectedSum, setModifier } = useDiceStore()
  
  return (
    <div className="bg-gradient-to-t from-bg-dark to-bg-panel border-t border-white/10 p-3 flex flex-col gap-2 flex-shrink-0">
      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Dice buttons */}
        <div className="flex gap-2">
          {DICE_SIDES.map(sides => (
            <button
              key={sides}
              onClick={() => rollDie(sides)}
              className="dice-btn w-12 h-12 rounded-lg border-2 border-white/10 bg-gradient-to-br from-white/6 to-white/2 text-text cursor-pointer flex flex-col items-center justify-center transition hover:border-gold hover:from-gold/15 hover:to-gold/5 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 font-sans relative"
            >
              <span className="text-base">d{sides}</span>
              <span className="text-xs text-text-dim mt-0.5">Кубик</span>
            </button>
          ))}
        </div>
        
        {/* Active roll display */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-12 gap-2">
          {!activeRoll ? (
            <>
              <div className="text-3xl font-extrabold text-gold text-shadow cursor-pointer px-3 py-1 rounded-lg">
                —
              </div>
              <div className="text-xs text-text-dim">Бросьте кубик</div>
            </>
          ) : (
            <>
              <div 
                className={`text-4xl font-extrabold cursor-pointer px-3 py-1 rounded-lg border-2 border-gold shadow-[0_0_15px_rgba(212,168,67,0.3)] ${
                  activeRoll.dice.length === 1 && activeRoll.dice[0].sides === 20 && activeRoll.dice[0].value === 20 ? 'text-green shadow-[0_0_30px_rgba(78,204,163,0.6)]' : ''
                } ${
                  activeRoll.dice.length === 1 && activeRoll.dice[0].sides === 20 && activeRoll.dice[0].value === 1 ? 'text-red shadow-[0_0_30px_rgba(233,69,96,0.6)]' : ''
                }`}
                onClick={clearRoll}
                title={activeRoll.expression}
              >
                {getSelectedSum()}
              </div>
              <div className="text-xs text-text-dim">{activeRoll.expression}</div>
            </>
          )}
        </div>
        
        {/* Modifier input */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-text-dim">Мод:</label>
          <input
            type="number"
            value={modifier}
            onChange={e => setModifier(parseInt(e.target.value) || 0)}
            className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-text text-sm outline-none focus:border-gold font-mono"
          />
        </div>
      </div>
      
      {/* Mode bar */}
      {activeRoll && (
        <div className="flex gap-1 items-center opacity-100 pointer-events-auto">
          <span className="text-xs text-text-dim mr-2">Режим:</span>
          <button
            onClick={() => setMode('single')}
            className={`mode-btn px-3 py-1 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-white/12 hover:text-white transition font-sans flex items-center gap-1 ${
              activeRoll.mode === 'single' ? 'bg-gold/20 border-gold text-gold' : ''
            }`}
          >
            🎯 Одиночный
          </button>
          <button
            onClick={() => setMode('aoe')}
            className={`mode-btn px-3 py-1 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-white/12 hover:text-white transition font-sans flex items-center gap-1 ${
              activeRoll.mode === 'aoe' ? 'bg-gold/20 border-gold text-gold' : ''
            }`}
          >
            💥 АоЕ
          </button>
          <button
            onClick={() => setMode('spread')}
            className={`mode-btn px-3 py-1 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-white/12 hover:text-white transition font-sans flex items-center gap-1 ${
              activeRoll.mode === 'spread' ? 'bg-gold/20 border-gold text-gold' : ''
            }`}
          >
            🔀 Распределить
          </button>
          
          <div className="ml-auto flex gap-1">
            <button
              onClick={clearSelection}
              className="px-3 py-1 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-white/12 hover:text-white transition font-sans"
            >
              Сбросить выбор
            </button>
          </div>
        </div>
      )}
      
      {/* Dice tray */}
      {activeRoll && activeRoll.dice.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center max-w-md min-h-7">
          {activeRoll.dice.map((die, i) => (
            <div
              key={die.id}
              className={`dice-tray-die w-7 h-7 bg-white/6 border-2 border-white/15 rounded flex items-center justify-center text-sm font-bold text-text-dim cursor-pointer transition hover:border-gold hover:bg-gold/10 ${
                die.selected && !die.spent ? 'selected border-gold bg-gold/20 text-gold shadow-[0_0_8px_rgba(212,168,67,0.3)]' : ''
              } ${die.spent ? 'spent opacity-20 pointer-events-none line-through' : ''} ${
                die.dropped && !die.selected ? 'dropped opacity-30 border-dashed' : ''
              }`}
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => toggleDie(die.id)}
              title={`d${die.sides}: ${die.value}${die.sign === '-' ? ' (вычитается)' : ''}`}
            >
              {die.value}
            </div>
          ))}
        </div>
      )}
      
      {/* History */}
      {history.length > 0 && (
        <div className="flex gap-2 items-center">
          <span className="text-xs text-text-dim">История:</span>
          <div className="flex gap-1 flex-wrap">
            {history.slice(0, 5).map((h, i) => (
              <span key={i} className="dice-history-item text-xs text-text-dim bg-white/4 px-2 py-0.5 rounded">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
