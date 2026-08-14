import { cn } from '../utils/cn';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  isActiveTurn: boolean;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onTempHP: (amount: number) => void;
  onAddStatus: () => void;
  onRemoveStatus: (uid: number) => void;
  onAddQuickRoll: () => void;
  onQuickRoll: (formula: string) => void;
  onDelete: () => void;
}

const HP_PERCENT_COLORS = {
  high: '#4ecca3',
  medium: '#f5a623',
  low: '#e94560',
};

export function CharacterCard({
  character,
  isActiveTurn,
  onDamage,
  onHeal,
  onTempHP,
  onAddStatus,
  onRemoveStatus,
  onAddQuickRoll,
  onQuickRoll,
  onDelete,
}: CharacterCardProps) {
  const hpPercent = (character.hpCur / character.hpMax) * 100;
  const hpBarColor = hpPercent > 50 ? HP_PERCENT_COLORS.high : hpPercent > 25 ? HP_PERCENT_COLORS.medium : HP_PERCENT_COLORS.low;
  const hpBarWidth = `${(character.hpCur / character.hpMax) * 100}%`;

  return (
    <div
      className={cn(
        'bg-[#0f3460] rounded-lg p-3 border transition-all relative',
        'border-white/[0.08] hover:border-white/[0.15]',
        isActiveTurn && 'border-[#f5a623] shadow-[0_0_15px_rgba(245,166,35,0.2)]',
        character.isDead && 'opacity-40',
      )}
    >
      {/* Top section */}
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 uppercase"
          style={{ backgroundColor: character.avatarColor }}
        >
          {character.name.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{character.name}</div>
          <div className="text-xs text-[#8892a4]">
            {character.type === 'pc' ? `Ур. ${character.level}` : 'NPC'} • AC {character.ac}
          </div>
        </div>
        
        <div className="bg-white/[0.08] rounded px-2 py-0.5 text-xs font-bold text-[#f5a623] flex-shrink-0">
          +{character.initiative}
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-1.5">
        <div
          className={cn(
            'bg-black/40 rounded-md h-[22px] relative overflow-hidden cursor-pointer border border-white/[0.05] transition-all',
            'hover:border-[#d4a843] hover:shadow-[0_0_0_2px_rgba(212,168,67,0.15)]',
          )}
        >
          {/* Base HP bar */}
          <div
            className="absolute top-0 left-0 h-full rounded-[4px] transition-all"
            style={{ 
              width: hpBarWidth, 
              backgroundColor: hpBarColor,
            }}
          />
          
          {/* Temp HP overlay */}
          {character.hpTemp > 0 && (
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-[#48dbfb]/70 to-[#48dbfb]/90 rounded-[4px] border-l-2 border-white/50 shadow-[0_0_8px_rgba(72,219,251,0.4)]"
              style={{
                left: hpBarWidth,
                width: `${(character.hpTemp / character.hpMax) * 100}%`,
              }}
            />
          )}
          
          {/* HP text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-shadow-[0_1px_3px_rgba(0,0,0,0.9)] z-2 pointer-events-none flex gap-1.5 items-center">
            <span>{character.hpCur} / {character.hpMax}</span>
            {character.hpTemp > 0 && (
              <span className="text-[#48dbfb] text-[10px] bg-black/50 px-1 rounded">
                +{character.hpTemp}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HP Controls */}
      <div className="flex gap-1 items-center mb-1.5">
        <button
          onClick={() => onHeal(1)}
          className="px-1.5 py-0.5 bg-white/[0.04] border border-white/10 text-[#8892a4] rounded text-[10px] font-bold transition-all hover:bg-[#4ecca3]/20 hover:text-[#4ecca3] hover:border-[#4ecca3]"
        >
          +1
        </button>
        <button
          onClick={() => onDamage(1)}
          className="px-1.5 py-0.5 bg-white/[0.04] border border-white/10 text-[#8892a4] rounded text-[10px] font-bold transition-all hover:bg-[#e94560]/20 hover:text-[#e94560] hover:border-[#e94560]"
        >
          -1
        </button>
        <button
          onClick={() => onTempHP(5)}
          className="px-1.5 py-0.5 bg-white/[0.04] border border-white/10 text-[#8892a4] rounded text-[10px] font-bold transition-all hover:bg-[#48dbfb]/20 hover:text-[#48dbfb] hover:border-[#48dbfb]"
        >
          ВХ +5
        </button>
      </div>

      {/* Statuses */}
      {character.statuses.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5 min-h-1">
          {character.statuses.map((status) => (
            <span
              key={status.uid}
              onClick={() => onRemoveStatus(status.uid)}
              className={cn(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold text-white cursor-pointer transition-all border border-black/20',
                'hover:brightness-120 hover:scale-105',
                status.type === 'permanent' && 'border-dashed',
              )}
              style={{ backgroundColor: status.color }}
            >
              <span className="text-[11px]">{status.icon}</span>
              {status.type === 'timed' && status.duration !== undefined && (
                <span className="bg-black/40 px-1 rounded text-[9px] ml-0.5">
                  {status.duration}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
      
      <button
        onClick={onAddStatus}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-white/[0.05] border border-dashed border-white/[0.15] text-[#8892a4] cursor-pointer transition-all hover:text-[#d4a843] hover:border-[#d4a843] mb-1.5"
      >
        + Статус
      </button>

      {/* Quick Rolls */}
      {character.quickRolls.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {character.quickRolls.map((roll) => (
            <button
              key={roll.id}
              onClick={() => onQuickRoll(roll.formula)}
              className="px-2 py-0.5 bg-white/[0.06] border border-white/10 rounded text-[10px] text-[#8892a4] cursor-pointer transition-all hover:bg-[#d4a843]/15 hover:border-[#d4a843] hover:text-[#d4a843] inline-flex items-center gap-1"
            >
              {roll.label}
            </button>
          ))}
        </div>
      )}
      
      <button
        onClick={onAddQuickRoll}
        className="px-2 py-0.5 bg-transparent border border-dashed border-white/[0.15] rounded text-[10px] text-[#8892a4] cursor-pointer transition-all hover:text-[#d4a843] hover:border-[#d4a843] mb-1.5"
      >
        + Бросок
      </button>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={onDelete}
          className="flex-1 py-1 border border-white/10 bg-white/[0.04] text-[#8892a4] rounded text-[10px] cursor-pointer transition-all hover:bg-white/10 hover:text-white"
        >
          Копия
        </button>
        <button
          onClick={onDelete}
          className="flex-1 py-1 border border-white/10 bg-white/[0.04] text-[#8892a4] rounded text-[10px] cursor-pointer transition-all hover:bg-[#e94560]/20 hover:text-[#e94560] hover:border-[#e94560]"
        >
          Удалить
        </button>
      </div>
    </div>
  );
}
