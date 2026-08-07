import type { SpellDefinition } from '@/types'

export const SPELL_CATALOG: SpellDefinition[] = [
  {
    id: 'fireball', name: 'Огненный шар', level: 3, school: 'Воплощение',
    icon: '🔥', castingTime: '1 действие', range: '150 футов', duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    description: 'Яркий луч вспыхивает из вас к точке в пределах дистанции и взрывается огненным шаром.',
    logic: {
      targetMode: 'aoe',
      save: { ability: 'DEX', dcFormula: '8 + prof + mod' },
      onFail: { type: 'damage', formula: '8d6', damageType: 'fire' },
      onSuccess: { type: 'damage', formula: '4d6', damageType: 'fire' },
    },
  },
  {
    id: 'magic_missile', name: 'Волшебная стрела', level: 1, school: 'Воплощение',
    icon: '✨', castingTime: '1 действие', range: '120 футов', duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    description: 'Вы создаёте три светящихся дротика из магической силы.',
    logic: {
      targetMode: 'spread', save: null,
      onFail: { type: 'damage', formula: '1d4+1', damageType: 'force' },
      onSuccess: null,
    },
  },
  {
    id: 'hold_person', name: 'Удержание личности', level: 2, school: 'Очарование',
    icon: '⛓️', castingTime: '1 действие', range: '60 футов',
    duration: 'Концентрация, до 1 минуты',
    classes: ['Волшебник', 'Чародей', 'Бард', 'Жрец', 'Друид'],
    description: 'Цель должна преуспеть в спасброске Мудрости, иначе станет парализованной.',
    logic: {
      targetMode: 'single',
      save: { ability: 'WIS', dcFormula: '8 + prof + mod' },
      onFail: { type: 'applyStatus', statusId: 'paralyzed', duration: 10 },
      onSuccess: null,
    },
  },
  {
    id: 'cure_wounds', name: 'Лечение ран', level: 1, school: 'Воплощение',
    icon: '💚', castingTime: '1 действие', range: 'Касание', duration: 'Мгновенная',
    classes: ['Жрец', 'Бард', 'Друид', 'Паладин', 'Следопыт'],
    description: 'Существо восстанавливает хиты равные 1d8 + модификатор.',
    logic: {
      targetMode: 'single', save: null,
      onFail: { type: 'heal', formula: '1d8+3' },
      onSuccess: null,
    },
  },
  {
    id: 'lightning_bolt', name: 'Молния', level: 3, school: 'Проявление',
    icon: '⚡', castingTime: '1 действие', range: '100 футов (линия 100×5)',
    duration: 'Мгновенная', classes: ['Волшебник', 'Чародей'],
    description: 'Разряд молнии длиной 100 футов и шириной 5 футов бьёт из вас.',
    logic: {
      targetMode: 'aoe',
      save: { ability: 'DEX', dcFormula: '8 + prof + mod' },
      onFail: { type: 'damage', formula: '8d6', damageType: 'lightning' },
      onSuccess: { type: 'damage', formula: '4d6', damageType: 'lightning' },
    },
  },
  {
    id: 'shield_spell', name: 'Щит', level: 1, school: 'Ограждение',
    icon: '🛡️', castingTime: '1 реакция', range: 'На себя', duration: '1 раунд',
    classes: ['Волшебник', 'Чародей'],
    description: 'Невидимый барьер магической силы появляется и защищает вас.',
    logic: {
      targetMode: 'single', save: null,
      onFail: { type: 'applyStatus', statusId: 'shield_of_faith', duration: 1 },
      onSuccess: null,
    },
  },
]
