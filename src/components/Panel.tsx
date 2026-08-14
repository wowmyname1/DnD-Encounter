import { useState } from 'react';
import { useStore, COLORS } from '../store/useStore';
import { CharacterCard } from './CharacterCard';
import { Plus } from 'lucide-react';
import type { Character } from '../types';

interface PanelProps {
  title: string;
  type: 'pc' | 'npc';
}

export function Panel({ title, type }: PanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChar, setNewChar] = useState<Partial<Character>>({
    name: '',
    hpMax: 100,
    hpCur: 100,
    hpTemp: 0,
    ac: 10,
    initiative: 0,
    level: 1,
  });

  const {
    characters,
    turnOrder,
    currentTurnIndex,
    combatActive,
    addCharacter,
    removeCharacter,
    applyDamage,
    applyHeal,
    applyTempHP,
    removeStatus,
    addQuickRoll,
  } = useStore();

  const panelChars = characters.filter((c) => c.type === type);
  const currentCharId = combatActive && turnOrder[currentTurnIndex];

  const handleAdd = () => {
    if (!newChar.name) return;
    
    addCharacter({
      name: newChar.name || 'Без имени',
      type,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      initiative: newChar.initiative || 0,
      hpMax: newChar.hpMax || 100,
      hpCur: newChar.hpCur || newChar.hpMax || 100,
      hpTemp: 0,
      ac: newChar.ac || 10,
      level: newChar.level || 1,
      statuses: [],
      quickRolls: [],
      isDead: false,
    });
    
    setNewChar({
      name: '',
      hpMax: 100,
      hpCur: 100,
      hpTemp: 0,
      ac: 10,
      initiative: 0,
      level: 1,
    });
    setShowAddForm(false);
  };

  return (
    <div className="w-[310px] min-w-[310px] bg-[#16213e] flex flex-col overflow-hidden">
      <div className="p-3 font-[MedievalSharp] text-lg text-[#d4a843] border-b border-white/10 flex justify-between items-center flex-shrink-0">
        <span>{title}</span>
        <span className="bg-white/10 px-2.5 py-0.5 rounded-full font-sans text-xs text-[#8892a4]">
          {panelChars.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 scrollbar-thin scrollbar:w-1 scrollbar:bg-transparent scrollbar-thumb:bg-white/15 scrollbar-thumb:rounded">
        {panelChars.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            isActiveTurn={combatActive && char.id === currentCharId}
            onDamage={(amount) => applyDamage(char.id, amount)}
            onHeal={(amount) => applyHeal(char.id, amount)}
            onTempHP={(amount) => applyTempHP(char.id, amount)}
            onAddStatus={() => {}}
            onRemoveStatus={(uid) => removeStatus(char.id, uid)}
            onAddQuickRoll={() => {
              const label = prompt('Название броска:');
              if (!label) return;
              const formula = prompt('Формула (например, 1d20 + 5):');
              if (!formula) return;
              addQuickRoll(char.id, { label, formula });
            }}
            onQuickRoll={(formula) => {
              console.log('Quick roll:', formula);
            }}
            onDelete={() => removeCharacter(char.id)}
          />
        ))}
        
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full calc(100% - 16px) p-2.5 border-2 border-dashed border-white/12 bg-transparent text-[#8892a4] rounded-lg cursor-pointer transition-all hover:border-[#d4a843] hover:text-[#d4a843] hover:bg-[#d4a843]/5 font-sans text-sm flex-shrink-0 mx-2"
          >
            <Plus size={16} className="inline mr-1" />
            Добавить {type === 'pc' ? 'персонажа' : 'NPC'}
          </button>
        ) : (
          <div className="bg-[#0f3460] rounded-lg p-3 border border-white/10 mx-2">
            <input
              type="text"
              placeholder="Имя"
              value={newChar.name}
              onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
              className="w-full mb-2 px-2 py-1.5 bg-black/30 border border-white/10 text-white text-sm rounded outline-none focus:border-[#d4a843]"
              autoFocus
            />
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-[#8892a4] block mb-0.5">HP Макс</label>
                <input
                  type="number"
                  value={newChar.hpMax}
                  onChange={(e) => setNewChar({ ...newChar, hpMax: parseInt(e.target.value) || 0, hpCur: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-black/30 border border-white/10 text-white text-sm rounded outline-none focus:border-[#d4a843]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8892a4] block mb-0.5">AC</label>
                <input
                  type="number"
                  value={newChar.ac}
                  onChange={(e) => setNewChar({ ...newChar, ac: parseInt(e.target.value) || 10 })}
                  className="w-full px-2 py-1 bg-black/30 border border-white/10 text-white text-sm rounded outline-none focus:border-[#d4a843]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8892a4] block mb-0.5">Инициатива</label>
                <input
                  type="number"
                  value={newChar.initiative}
                  onChange={(e) => setNewChar({ ...newChar, initiative: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 bg-black/30 border border-white/10 text-white text-sm rounded outline-none focus:border-[#d4a843]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8892a4] block mb-0.5">Уровень</label>
                <input
                  type="number"
                  value={newChar.level}
                  onChange={(e) => setNewChar({ ...newChar, level: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 bg-black/30 border border-white/10 text-white text-sm rounded outline-none focus:border-[#d4a843]"
                />
              </div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={handleAdd}
                className="flex-1 px-3 py-1.5 bg-[#4ecca3]/20 text-[#4ecca3] border border-[#4ecca3]/30 rounded text-sm font-medium transition-all hover:bg-[#4ecca3]/30"
              >
                Создать
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-1.5 bg-white/5 text-[#8892a4] border border-white/10 rounded text-sm transition-all hover:bg-white/10"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
