import { useCharacterStore } from '@/stores/characterStore'
import { useDiceStore } from '@/stores/diceStore'

export function MapArea() {
  const { characters, setPosition } = useCharacterStore()
  const { activeRoll } = useDiceStore()
  
  const handleTokenDrag = (e: React.DragEvent, id: number) => {
    // Token drag logic will be implemented with dnd-kit
  }
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Map toolbar */}
      <div className="px-3 py-2 bg-black/20 border-b border-white/10 flex gap-2 items-center flex-shrink-0">
        <button className="px-3 py-1 bg-white/6 border border-white/10 text-text-dim rounded hover:bg-white/12 hover:text-white transition text-xs font-sans">
          🗺️ Карта
        </button>
        <button className="px-3 py-1 bg-white/6 border border-white/10 text-text-dim rounded hover:bg-white/12 hover:text-white transition text-xs font-sans">
          📏 Сетка
        </button>
      </div>
      
      {/* Map container */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          backgroundColor: '#12122a'
        }}
      >
        {/* Tokens */}
        {characters.map(char => (
          <div
            key={char.id}
            className="map-token absolute w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm text-white cursor-grab z-10 border-[3px] border-white/30 shadow-lg hover:shadow-xl hover:z-20 active:cursor-grabbing active:scale-110 transition-shadow"
            style={{
              left: char.x,
              top: char.y,
              backgroundColor: char.color,
              textShadow: '0 1px 3px rgba(0,0,0,0.7)'
            }}
            draggable
            onDragEnd={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect()
              const parentRect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
              setPosition(char.id, rect.left - parentRect.left, rect.top - parentRect.top)
            }}
          >
            {char.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            
            {/* HP badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-xs whitespace-nowrap font-semibold">
              {char.hp.current}/{char.hp.max}
            </div>
            
            {/* Status dots */}
            {char.statuses.length > 0 && (
              <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5 max-w-16 justify-end">
                {char.statuses.slice(0, 4).map(status => (
                  <div
                    key={status.uid}
                    className="w-3 h-3 rounded-full border border-black/40"
                    style={{ backgroundColor: status.color }}
                    title={status.name}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
