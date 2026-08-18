import React from 'react';
import { useStore } from '../store/useStore';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onEdit: (char: Character) => void;
  onRemove: (id: number) => void;
  onDuplicate: (id: number) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onRemove,
  onDuplicate,
}) => {
  const { 
    applyDamage, applyHeal, applyTempHP, 
    removeStatus, addQuickRoll, removeQuickRoll,
    setPopupTargetId, setLastTargetId, activeRoll
  } = useStore();

  const isDead = character.hpCur <= 0;
  const hpPercent = (character.hpCur / character.hpMax) * 100;
  const hpBarClass = hpPercent > 50 ? '' : hpPercent > 25 ? 'medium' : 'low';
  const hasTempHp = character.tempHp > 0;

  const handleHpClick = () => {
    if (!activeRoll) return;
    setPopupTargetId(character.id);
    setLastTargetId(character.id);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`char-card ${isDead ? 'dead' : ''}`}>
      <div className="card-top">
        <div 
          className="card-avatar" 
          style={{ background: character.color }}
        >
          {getInitials(character.name)}
        </div>
        <div className="card-info">
          <div className="card-name">{character.name}</div>
          <div className="card-subtitle">
            {character.cls} • Ур. {character.level}
          </div>
        </div>
        <div className="card-initiative">
          Иниц. {character.init}
        </div>
      </div>

      <div className="hp-section">
        <div 
          className={`hp-bar-container ${activeRoll ? 'has-active-roll' : ''}`}
          onClick={handleHpClick}
        >
          <div className={`hp-bar-base ${hpBarClass}`} style={{ width: `${hpPercent}%` }} />
          {hasTempHp && (
            <div 
              className="hp-bar-temp"
              style={{ 
                left: `${hpPercent}%`,
                width: `${Math.min((character.tempHp / character.hpMax) * 100, 100 - hpPercent)}%`
              }}
            />
          )}
          <div className="hp-text">
            <span>{character.hpCur}</span>
            <span>/</span>
            <span>{character.hpMax}</span>
            {hasTempHp && (
              <span className="temp-indicator">+{character.tempHp}</span>
            )}
          </div>
        </div>
        <div className="hp-controls">
          <button className="hp-btn heal" onClick={() => applyHeal(character.id, 1)}>+1</button>
          <button className="hp-btn dmg" onClick={() => applyDamage(character.id, 1)}>-1</button>
          <button className="hp-btn temp" onClick={() => applyTempHP(character.id, 5)}>Врем.</button>
        </div>
      </div>

      <div className="statuses-row">
        {character.statuses.map((status) => (
          <div
            key={status.uid}
            className="status-badge"
            style={{ background: status.color }}
            onClick={() => removeStatus(character.id, status.uid)}
            title={status.name}
          >
            <span className="status-icon">{status.icon}</span>
            <span>{status.name}</span>
            {status.type === 'timed' && status.duration !== undefined && (
              <span className="status-dur">{status.duration}</span>
            )}
          </div>
        ))}
        <button className="add-status-btn">+ Статус</button>
      </div>

      <div className="quick-rolls-row">
        {character.quickRolls.map((roll) => (
          <button
            key={roll.id}
            className="quick-roll-btn"
          >
            {roll.name}
            <span 
              className="qr-del"
              onClick={(e) => { e.stopPropagation(); removeQuickRoll(character.id, roll.id); }}
            >
              ✕
            </span>
          </button>
        ))}
        <button 
          className="add-roll-btn"
          onClick={() => addQuickRoll(character.id, { name: 'Бросок', formula: '1d20' })}
        >
          + Бросок
        </button>
      </div>

      <div className="card-actions">
        <button className="card-btn" onClick={() => onEdit(character)}>
          ✏️ Ред.
        </button>
        <button className="card-btn" onClick={() => onDuplicate(character.id)}>
          📋 Копия
        </button>
        <button className="card-btn danger" onClick={() => onRemove(character.id)}>
          🗑️ Удалить
        </button>
      </div>
    </div>
  );
};
