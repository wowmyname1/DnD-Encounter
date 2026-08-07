import type { StatusDefinition } from '@/types'

export const STATUS_CATALOG: StatusDefinition[] = [
  {
    id: 'burning_custom', name: 'Горит (продвинутый)', icon: '🔥', color: '#e67e22',
    description: 'Начало хода: 1d6 урона огнём. Можно снять действием.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'action', parentId: 1, action: 'damage', formula: '1d6', damageType: 'fire' },
        { id: 3, type: 'trigger', parentId: null, event: 'manual' },
        { id: 4, type: 'action', parentId: 3, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
  {
    id: 'regen_custom', name: 'Регенерация', icon: '💚', color: '#2ecc71',
    description: 'Начало хода: восстановление 5 HP. Снимается при полном HP.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'action', parentId: 1, action: 'heal', formula: '5' },
        { id: 3, type: 'condition', parentId: 2, check: 'hpPercent', op: '>=', value: 100 },
        { id: 4, type: 'action', parentId: 3, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
  {
    id: 'low_hp_panic', name: 'Паника (низкие HP)', icon: '😱', color: '#9b59b6',
    description: 'Автоматически накладывает Испуг при HP < 25%. Снимается при HP > 50%.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'condition', parentId: 1, check: 'hpPercent', op: '<=', value: 25 },
        { id: 3, type: 'condition', parentId: 2, check: 'hasStatus', statusId: 'self', op: 'not' },
        { id: 4, type: 'action', parentId: 3, action: 'applyStatus', statusId: 'frightened', duration: 3 },
        { id: 5, type: 'condition', parentId: 1, check: 'hpPercent', op: '>=', value: 50 },
        { id: 6, type: 'action', parentId: 5, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
]
