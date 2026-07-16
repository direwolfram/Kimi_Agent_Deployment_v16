import { useLibrary, allFolders } from '../../store/LibraryContext'

export function TitleBar() {
  const { state, filteredImages } = useLibrary()
  const folder = allFolders.find((f) => f.id === state.activeFolder)

  return (
    <header className="h-14 flex items-center justify-center border-b border-[#e5e5ea] bg-[#f5f5f7]">
      <div className="text-sm font-semibold text-[#1c1c1e]">
        {folder?.name} <span className="text-[#8e8e93] font-normal ml-1">{filteredImages.length} items</span>
      </div>
    </header>
  )
}
