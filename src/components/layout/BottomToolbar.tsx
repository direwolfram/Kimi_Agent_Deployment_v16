import React from 'react'
import { Circle, GripHorizontal, Grid2X2, LayoutGrid, NotepadText, Square, Waves } from 'lucide-react'
import { useLibrary, ViewMode, CanvasBackground } from '../../store/LibraryContext'

const modes: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'canvas', label: 'Canvas', icon: GripHorizontal },
]

const backgrounds: { id: CanvasBackground; label: string; icon: React.ElementType }[] = [
  { id: 'plain', label: 'Plain background', icon: Square },
  { id: 'dots', label: 'Dot background', icon: Circle },
  { id: 'squares', label: 'Square grid background', icon: Grid2X2 },
  { id: 'blueprint', label: 'Blueprint background', icon: Waves },
  { id: 'paper', label: 'Paper background', icon: NotepadText },
]

export function BottomToolbar() {
  const { state, setViewMode, setCanvasBackground } = useLibrary()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 bg-white/90 backdrop-blur-md rounded-xl border border-[#e5e5ea] shadow-lg z-50">
      {modes.map((mode) => {
        const active = state.viewMode === mode.id
        const Icon = mode.icon
        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: active ? '#007aff' : 'transparent',
              color: active ? '#fff' : '#1c1c1e',
            }}
          >
            <Icon size={16} />
            <span>{mode.label}</span>
          </button>
        )
      })}
      <div className="mx-1 h-6 w-px bg-[#e5e5ea]" />
      {backgrounds.map((background) => {
        const active = state.canvasBackground === background.id
        const Icon = background.icon

        return (
          <button
            key={background.id}
            type="button"
            title={background.label}
            aria-label={background.label}
            aria-pressed={active}
            onClick={() => setCanvasBackground(background.id)}
            className="size-9 inline-flex items-center justify-center rounded-lg transition-all"
            style={{
              backgroundColor: active ? '#1c1c1e' : 'transparent',
              color: active ? '#fff' : '#6e6e73',
            }}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}
