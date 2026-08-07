import { useCharacterStore } from '@/stores/characterStore'
import type { CharacterType } from '@/types'

const COLORS = ['#e94560','#3a86ff','#4ecca3','#f5a623','#8338ec','#ff6b6b','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0']

interface Props {
  type: CharacterType
  onClose: () => void
}

export function AddCharacterModal({ type, onClose }: Props) {
  const { addCharacter } = useCharacterStore()
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    addCharacter(type, {
      name: formData.get('name') as string || 'Безымянный',
      cls: formData.get('cls') as string || '—',
      level: parseInt(formData.get('level') as string) || 1,
      hp: { 
        current: parseInt(formData.get('hp') as string) || 30, 
        max: parseInt(formData.get('hp') as string) || 30, 
        temp: 0 
      },
      ac: parseInt(formData.get('ac') as string) || 10,
      initiative: parseInt(formData.get('initiative') as string) || 0,
      color: formData.get('color') as string || COLORS[0],
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-bg-card rounded-xl p-6 w-full max-w-md border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gold mb-4">
          {type === 'pc' ? '➕ Добавить персонажа' : '➕ Добавить NPC'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-dim mb-1">Имя</label>
            <input 
              name="name" 
              type="text" 
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
              placeholder="Гимли"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-dim mb-1">Класс</label>
              <input 
                name="cls" 
                type="text" 
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
                placeholder="Воин"
              />
            </div>
            <div>
              <label className="block text-sm text-text-dim mb-1">Уровень</label>
              <input 
                name="level" 
                type="number" 
                min="1" 
                max="20"
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
                defaultValue="1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-text-dim mb-1">HP</label>
              <input 
                name="hp" 
                type="number" 
                min="1"
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
                defaultValue="30"
              />
            </div>
            <div>
              <label className="block text-sm text-text-dim mb-1">AC</label>
              <input 
                name="ac" 
                type="number" 
                min="1"
                className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
                defaultValue="10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-text-dim mb-1">Инициатива</label>
            <input 
              name="initiative" 
              type="number" 
              min="-5"
              max="20"
              className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-text outline-none focus:border-gold"
              defaultValue="0"
            />
          </div>
          
          <div>
            <label className="block text-sm text-text-dim mb-1">Цвет</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <label key={color} className="cursor-pointer">
                  <input 
                    name="color" 
                    type="radio" 
                    value={color}
                    className="peer sr-only"
                    defaultChecked={color === COLORS[0]}
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white/20 peer-checked:border-gold peer-checked:scale-110 transition"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="submit"
              className="flex-1 bg-gold text-bg-dark font-semibold py-2 rounded-lg hover:bg-gold/80 transition"
            >
              Создать
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 text-text font-semibold py-2 rounded-lg hover:bg-white/20 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
