import { useCharacterStore } from '@/stores/characterStore'
import { useCombatStore } from '@/stores/combatStore'
import type { CharacterType } from '@/types'
import { CharacterCard } from './CharacterCard'
import { AddCharacterModal } from './AddCharacterModal'
import { useState } from 'react'

interface Props {
  type: CharacterType
  title: string
}

export function SidePanel({ type, title }: Props) {
  const { characters } = useCharacterStore()
  const { startCombat, endCombat, nextTurn, active, round } = useCombatStore()
  const [showModal, setShowModal] = useState(false)
  
  const filtered = characters.filter(c => c.type === type)
  const count = filtered.length
  
  return (
    <>
      <div className="w-80 min-w-80 bg-bg-panel border-r border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 font-medieval text-lg text-gold border-b border-white/10 flex justify-between items-center flex-shrink-0">
          <span>{title}</span>
          <span className="bg-white/10 px-3 py-0.5 rounded-full text-xs text-text-dim font-sans font-normal">
            {count}
          </span>
        </div>
        
        {/* Combat controls for NPCs */}
        {type === 'npc' && (
          <div className="px-4 py-2 border-b border-white/10 flex gap-2 flex-shrink-0">
            {!active ? (
              <button
                onClick={startCombat}
                disabled={filtered.length === 0}
                className="flex-1 bg-accent text-white font-semibold py-2 rounded-lg hover:bg-accent/80 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ⚔️ Начать бой
              </button>
            ) : (
              <>
                <button
                  onClick={nextTurn}
                  className="flex-1 bg-accent2 text-bg-dark font-semibold py-2 rounded-lg hover:bg-accent2/80 transition text-sm"
                >
                  ➡️ След. ход
                </button>
                <button
                  onClick={endCombat}
                  className="flex-1 bg-white/10 text-text font-semibold py-2 rounded-lg hover:bg-white/20 transition text-sm"
                >
                  🏁 Конец
                </button>
              </>
            )}
          </div>
        )}
        
        {/* Character list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {filtered.map(char => (
            <CharacterCard key={char.id} character={char} />
          ))}
          
          {/* Add button */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full calc(100% - 16px) py-3 border-2 border-dashed border-white/12 bg-transparent text-text-dim rounded-xl cursor-pointer text-sm transition hover:border-gold hover:text-gold hover:bg-gold/5 font-sans mx-2 mb-2"
          >
            {type === 'pc' ? '➕ Добавить персонажа' : '➕ Добавить NPC'}
          </button>
        </div>
      </div>
      
      {showModal && <AddCharacterModal type={type} onClose={() => setShowModal(false)} />}
    </>
  )
}
