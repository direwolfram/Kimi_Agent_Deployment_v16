import React from 'react'
import { LayoutGrid, GripHorizontal } from 'lucide-react'
import { useLibrary, ViewMode } from '../../store/LibraryContext'

const modes: { id: ViewMode; label: string; icon: React.ElementType }[] = [
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'canvas', label: 'Canvas', icon: GripHorizontal },
]

export function BottomToolbar() {
  const { state, setViewMode } = useLibrary()

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
    </div>
  )
}
