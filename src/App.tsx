import { useCharacterStore } from '@/stores/characterStore'
import { useCombatStore } from '@/stores/combatStore'

function App() {
  const { characters, addCharacter } = useCharacterStore()
  const { active, round } = useCombatStore()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-dark text-text">
      {/* Header */}
      <header className="flex min-h-12 items-center justify-between border-b border-white/10 bg-gradient-to-r from-bg-card to-bg-dark px-5 py-2">
        <h1 className="text-xl font-bold text-gold">⚔️ D&D Encounter</h1>
        <div className="flex items-center gap-4 text-sm">
          <button className="catalog-header-btn rounded-md border border-gold bg-gold/10 px-3 py-1 text-gold hover:bg-gold/20">
            🔮 Заклинания
          </button>
          <button className="catalog-header-btn rounded-md border border-gold bg-gold/10 px-3 py-1 text-gold hover:bg-gold/20">
            ✨ Статусы
          </button>
          <span className="text-accent2 font-semibold">
            {active ? `Раунд ${round}` : 'Ход: —'}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <p className="text-text-dim text-lg">
            🎲 Проект инициализирован. Персонажей: {characters.length}
          </p>
          <button
            onClick={() =>
              addCharacter('pc', {
                name: 'Тестовый герой',
                cls: 'Воин',
                level: 1,
                hp: { current: 20, max: 20, temp: 0 },
              })
            }
            className="rounded-lg bg-gold px-4 py-2 font-semibold text-bg-dark hover:bg-gold/80 transition"
          >
            + Добавить тестового персонажа
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
