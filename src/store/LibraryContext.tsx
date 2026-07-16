import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react'

export type FolderId = 'all' | 'ui-screens' | 'app-icons' | 'typography' | '3d-assets' | 'patterns'

export interface Folder {
  id: FolderId
  name: string
  count: number
  iconColor: string
}

export interface LibraryImage {
  id: string
  src: string
  folder: FolderId
  name: string
}

export type ViewMode = 'grid' | 'canvas' | 'infinity'

export interface LibraryState {
  activeFolder: FolderId
  viewMode: ViewMode
  zoomImage: LibraryImage | null
  zoomOrigin: { x: number; y: number } | null
}

type Action =
  | { type: 'SET_ACTIVE_FOLDER'; payload: FolderId }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ZOOM_IMAGE'; payload: { image: LibraryImage | null; origin: { x: number; y: number } | null } }
  | { type: 'CLOSE_ZOOM' }
  | { type: 'REORDER_IMAGES'; payload: { folder: FolderId; ids: string[] } }

const initialState: LibraryState = {
  activeFolder: 'all',
  viewMode: 'canvas',
  zoomImage: null,
  zoomOrigin: null,
}

function libraryReducer(state: LibraryState, action: Action): LibraryState {
  switch (action.type) {
    case 'SET_ACTIVE_FOLDER':
      return { ...state, activeFolder: action.payload }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'ZOOM_IMAGE':
      return { ...state, zoomImage: action.payload.image, zoomOrigin: action.payload.origin }
    case 'CLOSE_ZOOM':
      return { ...state, zoomImage: null, zoomOrigin: null }
    case 'REORDER_IMAGES':
      return state
    default:
      return state
  }
}

export const allFolders: Folder[] = [
  { id: 'all', name: 'All', count: 20, iconColor: '#007aff' },
  { id: 'ui-screens', name: 'UI Screens', count: 9, iconColor: '#af52de' },
  { id: 'app-icons', name: 'App Icons', count: 1, iconColor: '#ff9500' },
  { id: 'typography', name: 'Typography', count: 3, iconColor: '#ff3b30' },
  { id: '3d-assets', name: '3D Assets', count: 4, iconColor: '#34c759' },
  { id: 'patterns', name: 'Patterns', count: 3, iconColor: '#5856d6' },
]

export const allImages: LibraryImage[] = [
  { id: 'ui-01', src: './images/ui-dashboard-01.jpg', folder: 'ui-screens', name: 'Dashboard 01' },
  { id: 'ui-02', src: './images/ui-dashboard-02.jpg', folder: 'ui-screens', name: 'Dashboard 02' },
  { id: 'ui-03', src: './images/ui-dashboard-03.jpg', folder: 'ui-screens', name: 'Dashboard 03' },
  { id: 'ui-04', src: './images/ui-dashboard-04.jpg', folder: 'ui-screens', name: 'Dashboard 04' },
  { id: 'ui-05', src: './images/ui-dashboard-05.jpg', folder: 'ui-screens', name: 'Dashboard 05' },
  { id: 'ui-06', src: './images/ui-dashboard-06.jpg', folder: 'ui-screens', name: 'Dashboard 06' },
  { id: 'ui-07', src: './images/ui-dashboard-07.jpg', folder: 'ui-screens', name: 'Dashboard 07' },
  { id: 'ui-08', src: './images/ui-dashboard-08.jpg', folder: 'ui-screens', name: 'Dashboard 08' },
  { id: 'ui-09', src: './images/ui-dashboard-09.jpg', folder: 'ui-screens', name: 'Dashboard 09' },
  { id: 'icon-01', src: './images/icon-set-01.jpg', folder: 'app-icons', name: 'Icon Set' },
  { id: 'typo-01', src: './images/typography-01.jpg', folder: 'typography', name: 'Typography 01' },
  { id: 'typo-02', src: './images/typography-02.jpg', folder: 'typography', name: 'Typography 02' },
  { id: 'typo-03', src: './images/typography-03.jpg', folder: 'typography', name: 'Typography 03' },
  { id: '3d-01', src: './images/3d-render-01.jpg', folder: '3d-assets', name: '3D Render 01' },
  { id: '3d-02', src: './images/3d-render-02.jpg', folder: '3d-assets', name: '3D Render 02' },
  { id: '3d-03', src: './images/3d-render-03.jpg', folder: '3d-assets', name: '3D Render 03' },
  { id: '3d-04', src: './images/3d-render-04.jpg', folder: '3d-assets', name: '3D Render 04' },
  { id: 'pattern-01', src: './images/abstract-pattern-01.jpg', folder: 'patterns', name: 'Pattern 01' },
  { id: 'pattern-02', src: './images/abstract-pattern-02.jpg', folder: 'patterns', name: 'Pattern 02' },
  { id: 'pattern-03', src: './images/abstract-pattern-03.jpg', folder: 'patterns', name: 'Pattern 03' },
]

interface LibraryContextValue {
  state: LibraryState
  dispatch: React.Dispatch<Action>
  filteredImages: LibraryImage[]
  setActiveFolder: (id: FolderId) => void
  setViewMode: (mode: ViewMode) => void
  zoomToImage: (image: LibraryImage, origin: { x: number; y: number }) => void
  closeZoom: () => void
  reorderImages: (folder: FolderId, ids: string[]) => void
  imageOrder: Record<string, string[]>
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(libraryReducer, initialState)
  const [imageOrder, setImageOrder] = React.useState<Record<string, string[]>>(() => {
    const order: Record<string, string[]> = {}
    allFolders.forEach((folder) => {
      order[folder.id] = allImages.filter((img) => folder.id === 'all' || img.folder === folder.id).map((img) => img.id)
    })
    return order
  })

  const filteredImages = useMemo(() => {
    const ids = imageOrder[state.activeFolder] || []
    const idSet = new Set(ids)
    const images = state.activeFolder === 'all'
      ? allImages.slice()
      : allImages.filter((img) => img.folder === state.activeFolder)
    const ordered = images.sort((a, b) => {
      const ia = idSet.has(a.id) ? ids.indexOf(a.id) : Infinity
      const ib = idSet.has(b.id) ? ids.indexOf(b.id) : Infinity
      return ia - ib
    })
    return ordered
  }, [state.activeFolder, imageOrder])

  const setActiveFolder = useCallback((id: FolderId) => {
    dispatch({ type: 'SET_ACTIVE_FOLDER', payload: id })
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }, [])

  const zoomToImage = useCallback((image: LibraryImage, origin: { x: number; y: number }) => {
    dispatch({ type: 'ZOOM_IMAGE', payload: { image, origin } })
  }, [])

  const closeZoom = useCallback(() => {
    dispatch({ type: 'CLOSE_ZOOM' })
  }, [])

  const reorderImages = useCallback((folder: FolderId, ids: string[]) => {
    setImageOrder((prev) => ({ ...prev, [folder]: ids }))
  }, [])

  return (
    <LibraryContext.Provider
      value={{
        state,
        dispatch,
        filteredImages,
        setActiveFolder,
        setViewMode,
        zoomToImage,
        closeZoom,
        reorderImages,
        imageOrder,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within a LibraryProvider')
  return ctx
}
