import { cn } from '../utils/cn';

interface HeaderProps {
  round: number;
  currentTurnIndex: number;
  turnOrder: number[];
  characters: any[];
  combatActive: boolean;
  onToggleCombat: () => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
}

export function Header({ 
  round, 
  currentTurnIndex, 
  turnOrder, 
  characters,
  combatActive,
  onToggleCombat,
  onNextTurn,
  onPrevTurn 
}: HeaderProps) {
  const currentCharId = combatActive && turnOrder[currentTurnIndex];
  const currentChar = characters.find(c => c.id === currentCharId);

  return (
    <header className="bg-gradient-to-r from-[#0f3460] to-[#1a1a2e] border-b border-white/10 px-5 py-2 flex items-center justify-between min-h-[48px] flex-shrink-0">
      <h1 className="font-[MedievalSharp] text-xl text-[#d4a843] drop-shadow-[0_0_20px_rgba(212,168,67,0.3)]">
        D&D Encounter Builder
      </h1>
      
      <div className="flex gap-3 items-center text-sm">
        {combatActive && (
          <>
            <span className="bg-[#e94560] text-white px-3.5 py-1 rounded-full font-bold text-xs">
              Раунд {round}
            </span>
            {currentChar && (
              <span className="text-[#f5a623] font-semibold">
                Ход: {currentChar.name}
              </span>
            )}
          </>
        )}
        
        <button
          onClick={onToggleCombat}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            combatActive 
              ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/30 hover:bg-[#e94560]/30'
              : 'bg-[#4ecca3]/20 text-[#4ecca3] border border-[#4ecca3]/30 hover:bg-[#4ecca3]/30'
          )}
        >
          {combatActive ? '⚔️ Бой' : '▶️ Начать бой'}
        </button>
        
        {combatActive && (
          <div className="flex gap-2">
            <button
              onClick={onPrevTurn}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all"
            >
              ← Назад
            </button>
            <button
              onClick={onNextTurn}
              className="px-3 py-1.5 bg-[#f5a623]/20 border border-[#f5a623]/30 text-[#f5a623] rounded-lg text-sm font-semibold hover:bg-[#f5a623]/30 transition-all"
            >
              Вперёд →
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
