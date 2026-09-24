(function () {
  const expandedStatuses = [
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
      id: 'prone',
      name: 'Сбит с ног',
      icon: '🤸',
      color: '#9e9e9e',
      description: 'Цель сбита с ног. Нажмите на статус чтобы встать.',
      logic: {
        nodes: [
          { id: 1, type: 'trigger', event: 'manual', label: 'Встать (действие)' },
          { id: 2, type: 'action', action: 'removeStatus', statusId: 'self', parentId: 1 }
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
