import { useCharacterStore } from '@/stores/characterStore'
import { useCombatStore } from '@/stores/combatStore'
import type { Character } from '@/types'

interface Props {
  character: Character
}

export function CharacterCard({ character }: Props) {
  const { removeCharacter, setPosition, applyDamage, applyHeal, applyTempHp, setHp, addStatus, removeStatusById, tickStatuses, addQuickRoll, removeQuickRoll, triggerEvent } = useCharacterStore()
  const { currentTurnId } = useCombatStore()
  
  const isDead = character.hp.current === 0
  const isActiveTurn = currentTurnId === character.id
  const hpPercent = (character.hp.current / character.hp.max) * 100
  const hpClass = hpPercent > 50 ? '' : hpPercent > 25 ? 'medium' : 'low'
  
  const handleDragEnd = (e: React.DragEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPosition(character.id, rect.left, rect.top)
  }
  
  const getInitials = (name: string) => 
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  
  return (
    <div
      className={`char-card rounded-lg p-3 border transition-all ${
        isDead ? 'opacity-40' : ''
      } ${isActiveTurn ? 'border-accent2 shadow-[0_0_15px_rgba(245,166,35,0.2)]' : 'border-white/10 hover:border-white/20'
      }`}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Top section */}
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 uppercase"
          style={{ backgroundColor: character.color }}
        >
          {getInitials(character.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{character.name}</div>
          <div className="text-xs text-text-dim">{character.cls}, ур. {character.level}</div>
        </div>
        <div className="bg-white/8 rounded px-2 py-0.5 text-xs font-bold text-accent2 flex-shrink-0">
          Init: {character.initiative}
        </div>
      </div>
      
      {/* HP Bar */}
      <div className="mb-2">
        <div 
          className={`hp-bar-container bg-black/4 rounded-md h-6 relative overflow-hidden cursor-pointer border border-white/5 transition-all hover:border-gold hover:shadow-[0_0_0_2px_rgba(212,168,67,0.15)] ${
            hpPercent <= 50 ? 'animate-pulse' : ''
          }`}
        >
          {/* Base HP bar */}
          <div 
            className={`hp-bar-base absolute top-0 left-0 h-full rounded transition-all duration-300 ${hpClass}`}
            style={{ width: `${hpPercent}%`, backgroundColor: hpPercent > 50 ? 'var(--green)' : hpPercent > 25 ? 'var(--accent2)' : 'var(--red)' }}
          />
          
          {/* Temp HP overlay */}
          {character.hp.temp > 0 && (
            <div 
              className="absolute top-0 h-full bg-gradient-to-r from-cyan/70 to-cyan/90 rounded border-l-2 border-white/50 shadow-[0_0_8px_rgba(72,219,251,0.4)] transition-all duration-300"
              style={{ 
                left: `${hpPercent}%`,
                width: `${(character.hp.temp / character.hp.max) * 100}%`
              }}
            />
          )}
          
          {/* HP Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-shadow z-2 pointer-events-none flex gap-2 items-center">
            <span>{character.hp.current}/{character.hp.max}</span>
            {character.hp.temp > 0 && (
              <span className="text-cyan text-xs bg-black/50 px-1 rounded">+{character.hp.temp}</span>
            )}
          </div>
        </div>
        
        {/* HP Controls */}
        <div className="flex gap-1 mt-1">
          <button 
            onClick={() => applyDamage(character.id, 1)}
            className="hp-btn px-2 py-0.5 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-red/20 hover:text-red hover:border-red transition font-semibold"
          >
            -1
          </button>
          <button 
            onClick={() => applyHeal(character.id, 1)}
            className="hp-btn heal px-2 py-0.5 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-green/20 hover:text-green hover:border-green transition font-semibold"
          >
            +1
          </button>
          <button 
            onClick={() => applyTempHp(character.id, 5)}
            className="hp-btn temp px-2 py-0.5 bg-white/4 border border-white/10 text-text-dim rounded text-xs cursor-pointer hover:bg-cyan/20 hover:text-cyan hover:border-cyan transition font-semibold"
          >
            🛡️
          </button>
        </div>
      </div>
      
      {/* Statuses */}
      {character.statuses.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 min-h-1">
          {character.statuses.map(status => (
            <span
              key={status.uid}
              className="status-badge inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white cursor-pointer hover:brightness-120 hover:scale-105 transition border border-black/20"
              style={{ backgroundColor: status.color }}
              onClick={() => removeStatusById(character.id, status.id)}
              title={status.name}
            >
              <span className="text-xs">{status.icon}</span>
              {status.duration !== null && (
                <span className="bg-black/40 px-1 rounded text-xs ml-0.5">{status.duration}</span>
              )}
            </span>
          ))}
        </div>
      )}
      
      {/* Quick Rolls */}
      {character.quickRolls.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {character.quickRolls.map(roll => (
            <button
              key={roll.id}
              className="quick-roll-btn px-2 py-1 bg-white/6 border border-white/10 rounded text-xs text-text-dim cursor-pointer hover:bg-gold/15 hover:border-gold hover:text-gold transition font-sans inline-flex items-center gap-1"
              onClick={() => console.log('Quick roll:', roll.formula)}
            >
              {roll.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-1">
        <button 
          onClick={() => removeCharacter(character.id)}
          className="card-btn flex-1 py-1 border border-white/10 bg-white/4 text-text-dim rounded text-xs cursor-pointer hover:bg-white/10 hover:text-white transition font-sans"
        >
          Удалить
        </button>
        <button 
          onClick={() => triggerEvent(character.id, 'turnStart')}
          className="card-btn flex-1 py-1 border border-white/10 bg-white/4 text-text-dim rounded text-xs cursor-pointer hover:bg-white/10 hover:text-white transition font-sans"
        >
          Ход
        </button>
      </div>
    </div>
  )
}
