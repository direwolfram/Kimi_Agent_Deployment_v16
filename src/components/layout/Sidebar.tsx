import { LayoutGrid, Image, Type, Box, Shapes, Inbox, Trash2, Layers } from 'lucide-react'
import packageJson from '../../../package.json'
import { useLibrary, allFolders, FolderId, Folder } from '../../store/LibraryContext'

const folderIcons: Record<FolderId, React.ElementType | null> = {
  all: Layers,
  'ui-screens': LayoutGrid,
  'app-icons': Image,
  typography: Type,
  '3d-assets': Box,
  patterns: Shapes,
}

export function Sidebar() {
  const { state, setActiveFolder } = useLibrary()

  return (
    <aside className="w-[220px] h-screen bg-[#f5f5f7] border-r border-[#e5e5ea] flex flex-col px-3 py-4">
      <button className="w-full flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sm font-medium text-[#1c1c1e] bg-white border border-[#e5e5ea] shadow-sm hover:bg-[#fafafa] transition-colors">
        <Image size={16} />
        <span>Link Eagle Library</span>
      </button>

      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-[#e5e5ea] text-sm placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#007aff]/20"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8e93]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </span>
      </div>

      <nav className="flex-1">
        <ul className="space-y-[2px]">
          {allFolders.map((folder: Folder) => {
            const active = state.activeFolder === folder.id
            const Icon = folderIcons[folder.id]
            return (
              <li key={folder.id}>
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className="w-full flex items-center gap-2 px-3 py-[5px] rounded-[6px] text-left transition-all duration-100 group"
                  style={{
                    backgroundColor: active ? 'rgba(0, 122, 255, 0.08)' : 'transparent',
                  }}
                >
                  {Icon && (
                    <Icon
                      size={16}
                      className="flex-shrink-0"
                      style={{ color: active ? '#007aff' : '#8e8e93' }}
                    />
                  )}
                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: active ? '#007aff' : '#1c1c1e' }}
                  >
                    {folder.id === 'all' ? `${folder.name} v${packageJson.version}` : folder.name}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? '#007aff' : '#8e8e93' }}
                  >
                    {folder.count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-[2px]">
        <button className="w-full flex items-center gap-2 px-3 py-[5px] rounded-[6px] text-left transition-all duration-100 group hover:bg-[rgba(0,0,0,0.04)]">
          <Inbox size={16} className="flex-shrink-0 text-[#8e8e93]" />
          <span className="flex-1 text-sm font-medium text-[#1c1c1e]">Inbox</span>
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-[5px] rounded-[6px] text-left transition-all duration-100 group hover:bg-[rgba(0,0,0,0.04)]">
          <Trash2 size={16} className="flex-shrink-0 text-[#8e8e93]" />
          <span className="flex-1 text-sm font-medium text-[#1c1c1e]">Trash</span>
        </button>
      </div>
      <div className="mt-3 border-t border-[#e5e5ea] px-3 pt-3 text-[11px] font-semibold text-[#6e6e73]">
        Version {packageJson.version}
      </div>
    </aside>
  )
}
