(function () {
  const presets = [
    {
      id: 'bless',
      name: 'Благословение',
      label: 'Благословение',
      icon: '✨',
      description: 'Цель получает бонус к атакам и спасброскам.',
      durationType: 'timed',
      duration: 10,
      category: 'buff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'bane',
      name: 'Проклятие',
      label: 'Проклятие',
      icon: '🕯️',
      description: 'Цель получает штраф к атакам и спасброскам.',
      durationType: 'timed',
      duration: 10,
      category: 'debuff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'shield-of-faith',
      name: 'Щит веры',
      label: 'Щит веры',
      icon: '🛡️',
      description: 'Цель получает бонус к защите.',
      durationType: 'timed',
      duration: 10,
      category: 'buff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'haste',
      name: 'Ускорение',
      label: 'Ускорение',
      icon: '⚡',
      description: 'Цель действует быстрее.',
      durationType: 'timed',
      duration: 10,
      category: 'buff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'slow',
      name: 'Замедление',
      label: 'Замедление',
      icon: '🐌',
      description: 'Цель действует медленнее.',
      durationType: 'timed',
      duration: 10,
      category: 'debuff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'invisibility',
      name: 'Невидимость',
      label: 'Невидимость',
      icon: '👁️',
      description: 'Цель становится невидимой.',
      durationType: 'timed',
      duration: 10,
      category: 'buff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'poison',
      name: 'Яд',
      label: 'Яд',
      icon: '☠️',
      description: 'В конце хода цель получает урон ядом.',
      durationType: 'timed',
      duration: 3,
      category: 'damage',
      trigger: 'turnEnd',
      effect: 'damage',
      value: 2,
      nodes: []
    },
    {
      id: 'regeneration',
      name: 'Регенерация',
      label: 'Регенерация',
      icon: '💚',
      description: 'В начале хода цель восстанавливает HP.',
      durationType: 'timed',
      duration: 3,
      category: 'heal',
      trigger: 'turnStart',
      effect: 'heal',
      value: 1,
      nodes: []
    },
    {
      id: 'stunned',
      name: 'Оглушение',
      label: 'Оглушение',
      icon: '💫',
      description: 'Цель оглушена.',
      durationType: 'timed',
      duration: 1,
      category: 'control',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'frightened',
      name: 'Испуг',
      label: 'Испуг',
      icon: '😱',
      description: 'Цель испугана.',
      durationType: 'timed',
      duration: 3,
      category: 'control',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'charmed',
      name: 'Очарование',
      label: 'Очарование',
      icon: '💞',
      description: 'Цель очарована.',
      durationType: 'timed',
      duration: 10,
      category: 'control',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'restrained',
      name: 'Опутан',
      label: 'Опутан',
      icon: '🕸️',
      description: 'Цель опутана и ограничена в движении.',
      durationType: 'timed',
      duration: 3,
      category: 'control',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'prone',
      name: 'Сбит с ног',
      label: 'Сбит с ног',
      icon: '🤸',
      description: 'Цель сбита с ног.',
      durationType: 'permanent',
      duration: 0,
      category: 'condition',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'bleeding',
      name: 'Кровотечение',
      label: 'Кровотечение',
      icon: '🩸',
      description: 'В конце хода цель теряет HP.',
      durationType: 'timed',
      duration: 3,
      category: 'damage',
      trigger: 'turnEnd',
      effect: 'damage',
      value: 1,
      nodes: []
    },
    {
      id: 'burning',
      name: 'Горение',
      label: 'Горение',
      icon: '🔥',
      description: 'В конце хода цель получает урон огнём.',
      durationType: 'timed',
      duration: 3,
      category: 'damage',
      trigger: 'turnEnd',
      effect: 'damage',
      value: 2,
      nodes: []
    },
    {
      id: 'concentration',
      name: 'Концентрация',
      label: 'Концентрация',
      icon: '🧠',
      description: 'Цель поддерживает концентрацию на эффекте.',
      durationType: 'permanent',
      duration: 0,
      category: 'special',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'hunters-mark',
      name: 'Метка охотника',
      label: 'Метка охотника',
      icon: '🎯',
      description: 'Цель отмечена для дополнительных атак.',
      durationType: 'timed',
      duration: 10,
      category: 'mark',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    },
    {
      id: 'hex',
      name: 'Сглаз',
      label: 'Сглаз',
      icon: '🧿',
      description: 'Цель проклята и получает дополнительный урон.',
      durationType: 'timed',
      duration: 10,
      category: 'debuff',
      trigger: '',
      effect: '',
      value: 0,
      nodes: []
    }
  ];

  function cleanArray(arr) {
    if (arr && Array.isArray(arr)) arr.length = 0;
  }

  if (typeof STATUS_DEFS !== 'undefined') {
    cleanArray(STATUS_DEFS.permanent);
    cleanArray(STATUS_DEFS.timed);

    presets.forEach(function (p) {
      const entry = {
        id: p.id,
        name: p.name,
        label: p.label,
        icon: p.icon,
        description: p.description,
        type: p.durationType,
        trigger: p.trigger,
        effect: p.effect,
        value: p.value,
        nodes: p.nodes
      };

      if (p.durationType === 'permanent') {
        STATUS_DEFS.permanent.push(entry);
      } else {
        entry.duration = p.duration || 1;
        STATUS_DEFS.timed.push(entry);
      }
    });
  }

  if (typeof STATUS_CATALOG !== 'undefined' && Array.isArray(STATUS_CATALOG)) {
    STATUS_CATALOG.length = 0;

    presets.forEach(function (p) {
      STATUS_CATALOG.push(Object.assign({}, p));
    });
  }

  window.STATUS_PRESETS = presets;
})();
