import { useStore } from './store/useStore';
import { Header } from './components/Header';
import { Panel } from './components/Panel';
import { DicePanel } from './components/DicePanel';

function App() {
  const {
    characters,
    turnOrder,
    currentTurnIndex,
    round,
    combatActive,
    toggleCombat,
    nextTurn,
    prevTurn,
  } = useStore();

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-[#e0e0e0] font-['Inter']">
      <Header
        round={round}
        currentTurnIndex={currentTurnIndex}
        turnOrder={turnOrder}
        characters={characters}
        combatActive={combatActive}
        onToggleCombat={toggleCombat}
        onNextTurn={nextTurn}
        onPrevTurn={prevTurn}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - PCs */}
        <Panel title="🛡️ Персонажи" type="pc" />
        
        {/* Map Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Map toolbar */}
          <div className="p-1.5 px-3 bg-black/20 border-b border-white/10 flex gap-2 items-center flex-shrink-0">
            <button className="px-3 py-1 bg-white/6 border border-white/10 text-[#8892a4] rounded text-xs hover:bg-white/12 hover:text-white transition-all">
              🗺️ Карта
            </button>
            <button className="px-3 py-1 bg-white/6 border border-white/10 text-[#8892a4] rounded text-xs hover:bg-white/12 hover:text-white transition-all">
              ⚓ Токены
            </button>
          </div>
          
          {/* Map container */}
          <div className="flex-1 relative overflow-hidden bg-[#12122a]" 
               style={{
                 backgroundImage: `
                   linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                   linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                 `,
                 backgroundSize: '50px 50px',
               }}
          >
            {/* Placeholder for map tokens */}
            <div className="absolute inset-0 flex items-center justify-center text-[#8892a4]/30 text-lg">
              🗺️ Игровое поле
            </div>
          </div>
          
          {/* Dice Panel */}
          <DicePanel />
        </div>
        
        {/* Right Panel - NPCs */}
        <Panel title="⚔️ Враги" type="npc" />
      </div>
    </div>
  );
}

export default App;
