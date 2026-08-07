export interface StatusDef {
  id: string
  name: string
  icon: string
  color: string
}

export const PERMANENT_STATUSES: StatusDef[] = [
  { id: 'blinded', name: 'Ослеплён', icon: '👁️', color: '#555' },
  { id: 'charmed', name: 'Очарован', icon: '💖', color: '#ff6b9d' },
  { id: 'deafened', name: 'Оглох', icon: '🔇', color: '#777' },
  { id: 'frightened', name: 'Испуган', icon: '😱', color: '#9b59b6' },
  { id: 'grappled', name: 'Схвачен', icon: '🤝', color: '#d35400' },
  { id: 'incapacitated', name: 'Недееспособен', icon: '💫', color: '#7f8c8d' },
  { id: 'invisible', name: 'Невидим', icon: '👻', color: '#bdc3c7' },
  { id: 'paralyzed', name: 'Парализован', icon: '⚡', color: '#f1c40f' },
  { id: 'petrified', name: 'Окаменел', icon: '🗿', color: '#95a5a6' },
  { id: 'poisoned', name: 'Отравлен', icon: '☠️', color: '#27ae60' },
  { id: 'prone', name: 'Сбит с ног', icon: '🤸', color: '#e67e22' },
  { id: 'restrained', name: 'Опутан', icon: '⛓️', color: '#c0392b' },
  { id: 'stunned', name: 'Оглушён', icon: '💥', color: '#e74c3c' },
  { id: 'unconscious', name: 'Без сознания', icon: '😴', color: '#2c3e50' },
  { id: 'exhaustion', name: 'Истощение', icon: '🥵', color: '#8e44ad' },
]

export const TIMED_STATUSES: StatusDef[] = [
  { id: 'rage', name: 'Ярость', icon: '🔥', color: '#e74c3c' },
  { id: 'blessed', name: 'Благословение', icon: '✨', color: '#f1c40f' },
  { id: 'hasted', name: 'Ускорен', icon: '⚡', color: '#3498db' },
  { id: 'slowed', name: 'Замедлен', icon: '🐌', color: '#95a5a6' },
  { id: 'concentrating', name: 'Концентрация', icon: '🎯', color: '#1abc9c' },
  { id: 'burning', name: 'Горит', icon: '🔥', color: '#e67e22' },
  { id: 'flying', name: 'Полёт', icon: '🕊️', color: '#3498db' },
  { id: 'invisibility', name: 'Невидимость', icon: '👻', color: '#bdc3c7' },
  { id: 'bardic_insp', name: 'Вдохновение', icon: '🎵', color: '#9b59b6' },
  { id: 'shield_of_faith', name: 'Щит веры', icon: '🛡️', color: '#f39c12' },
  { id: 'hex', name: 'Сглаз', icon: '🧿', color: '#8e44ad' },
  { id: 'hunter_mark', name: 'Метка охотника', icon: '🏹', color: '#27ae60' },
  { id: 'rage_bear', name: 'Ярость варвара', icon: '🐻', color: '#c0392b' },
  { id: 'regenerating', name: 'Регенерация', icon: '💚', color: '#2ecc71' },
]
