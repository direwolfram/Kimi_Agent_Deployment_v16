import { ArrowDown, ArrowUp } from 'lucide-react'
import { useLibrary, allFolders } from '../../store/LibraryContext'

export function TitleBar() {
  const { state, filteredImages, setImportSortDirection } = useLibrary()
  const folder = allFolders.find((f) => f.id === state.activeFolder)
  const isAscending = state.importSortDirection === 'asc'

  return (
    <header className="h-14 flex items-center justify-between border-b border-[#e5e5ea] bg-[#f5f5f7] px-4">
      <div className="w-[132px]" />
      <div className="text-sm font-semibold text-[#1c1c1e] min-w-0 truncate">
        {folder?.name} <span className="text-[#8e8e93] font-normal ml-1">{filteredImages.length} items</span>
      </div>
      {state.viewMode === 'grid' ? (
        <div className="flex items-center gap-1 rounded-[8px] bg-black/[0.04] p-0.5">
          <button
            type="button"
            title="Sort by import date descending"
            aria-label="Sort by import date descending"
            aria-pressed={!isAscending}
            onClick={() => setImportSortDirection('desc')}
            className="size-8 inline-flex items-center justify-center rounded-[6px] transition-colors"
            style={{
              backgroundColor: !isAscending ? '#ffffff' : 'transparent',
              color: !isAscending ? '#1c1c1e' : '#8e8e93',
              boxShadow: !isAscending ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            title="Sort by import date ascending"
            aria-label="Sort by import date ascending"
            aria-pressed={isAscending}
            onClick={() => setImportSortDirection('asc')}
            className="size-8 inline-flex items-center justify-center rounded-[6px] transition-colors"
            style={{
              backgroundColor: isAscending ? '#ffffff' : 'transparent',
              color: isAscending ? '#1c1c1e' : '#8e8e93',
              boxShadow: isAscending ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <ArrowUp size={15} />
          </button>
        </div>
      ) : (
        <div className="w-[132px]" />
      )}
    </header>
  )
}
