import { useCharacterStore } from '@/stores/characterStore'
import { useCombatStore } from '@/stores/combatStore'
import { SidePanel } from '@/components/SidePanel'
import { MapArea } from '@/components/MapArea'
import { DicePanel } from '@/components/DicePanel'

function App() {
  const { characters, addCharacter } = useCharacterStore()
  const { active, round } = useCombatStore()
  
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-dark text-text">
      {/* Header */}
      <header className="flex min-h-12 items-center justify-between border-b border-white/10 bg-gradient-to-r from-bg-card to-bg-dark px-5 py-2">
        <h1 className="text-xl font-medieval font-bold text-gold text-shadow">⚔️ D&D Encounter</h1>
        <div className="flex items-center gap-4 text-sm">
          <button className="catalog-header-btn rounded-md border border-gold bg-gold/10 px-3 py-1 text-gold hover:bg-gold/20 transition">
            🔮 Заклинания
          </button>
          <button className="catalog-header-btn rounded-md border border-gold bg-gold/10 px-3 py-1 text-gold hover:bg-gold/20 transition">
            ✨ Статусы
          </button>
          <span className="text-accent2 font-semibold">
            {active ? `Раунд ${round}` : 'Ход: —'}
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left panel - PCs */}
        <SidePanel type="pc" title="🧙‍♂️ Персонажи" />
        
        {/* Center - Map */}
        <MapArea />
        
        {/* Right panel - NPCs */}
        <SidePanel type="npc" title="👹 NPC" />
      </main>
      
      {/* Bottom - Dice panel */}
      <DicePanel />
    </div>
  )
}

export default App
