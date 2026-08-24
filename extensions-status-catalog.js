(function () {
  const expandedStatuses = [
    {
      id: 'bless',
      name: 'Благословение',
      icon: '✨',
      color: '#ffd700',
      description: 'В начале хода цель получает бонус +1 к следующей атаке.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'heal', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'bane',
      name: 'Проклятие',
      icon: '🕯️',
      color: '#8b0000',
      description: 'В начале хода цель получает штраф.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'poison',
      name: 'Яд',
      icon: '☠️',
      color: '#228b22',
      description: 'В конце хода цель получает 1d4 урона ядом.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnEnd' },
          { id: 2, type: 'action', action: 'damage', formula: '1d4', parentId: 1 }
        ]
      }
    },
    {
      id: 'burning',
      name: 'Горение',
      icon: '🔥',
      color: '#e67e22',
      description: 'В начале хода цель получает 1d6 урона огнём.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '1d6', parentId: 1 }
        ]
      }
    },
    {
      id: 'regeneration',
      name: 'Регенерация',
      icon: '💚',
      color: '#2ecc71',
      description: 'В начале хода цель восстанавливает 5 HP.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'heal', formula: '5', parentId: 1 }
        ]
      }
    },
    {
      id: 'bleeding',
      name: 'Кровотечение',
      icon: '🩸',
      color: '#c0392b',
      description: 'В конце хода цель теряет 1d4 HP.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnEnd' },
          { id: 2, type: 'action', action: 'damage', formula: '1d4', parentId: 1 }
        ]
      }
    },
    {
      id: 'stunned',
      name: 'Оглушение',
      icon: '💫',
      color: '#9b59b6',
      description: 'Цель оглушена и не может действовать.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'frightened',
      name: 'Испуг',
      icon: '😱',
      color: '#34495e',
      description: 'Цель испугана.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'charmed',
      name: 'Очарование',
      icon: '💞',
      color: '#e91e63',
      description: 'Цель очарована.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'restrained',
      name: 'Опутан',
      icon: '🕸️',
      color: '#795548',
      description: 'Цель опутана.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'paralyzed',
      name: 'Паралич',
      icon: '⛓️',
      color: '#607d8b',
      description: 'Цель парализована.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'prone',
      name: 'Сбит с ног',
      icon: '🤸',
      color: '#9e9e9e',
      description: 'Цель сбита с ног.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'manual', label: 'Встать (действие)' },
          { id: 2, type: 'action', action: 'removeStatus', statusId: 'self', parentId: 1 }
        ]
      }
    },
    {
      id: 'invisible',
      name: 'Невидимость',
      icon: '👁️',
      color: '#00bcd4',
      description: 'Цель невидима.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'haste',
      name: 'Ускорение',
      icon: '⚡',
      color: '#ffeb3b',
      description: 'Цель ускорена.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    },
    {
      id: 'slow',
      name: 'Замедление',
      icon: '🐌',
      color: '#ff9800',
      description: 'Цель замедлена.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'turnStart' },
          { id: 2, type: 'action', action: 'damage', formula: '0', parentId: 1 }
        ]
      }
    }
  ];

  if (typeof STATUS_CATALOG !== 'undefined' && Array.isArray(STATUS_CATALOG)) {
    STATUS_CATALOG.length = 0;
    expandedStatuses.forEach(function (s) {
      STATUS_CATALOG.push(Object.assign({}, s));
    });
  }
})();
