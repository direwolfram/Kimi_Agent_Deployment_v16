import { LibraryProvider } from './store/LibraryContext'
import { Sidebar } from './components/layout/Sidebar'
import { TitleBar } from './components/layout/TitleBar'
import { BottomToolbar } from './components/layout/BottomToolbar'
import { GridView, InfinityView } from './components/views/GridView'
import { CanvasView } from './components/views/CanvasView'
import { ZoomOverlay } from './components/effects/ZoomOverlay'
import { useLibrary } from './store/LibraryContext'

function MainContent() {
  const { state } = useLibrary()

  switch (state.viewMode) {
    case 'grid':
      return <GridView />
    case 'infinity':
      return <InfinityView />
    case 'canvas':
    default:
      return <CanvasView />
  }
}

function App() {
  return (
    <LibraryProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TitleBar />
          <MainContent />
        </div>
      </div>
      <BottomToolbar />
      <ZoomOverlay />
    </LibraryProvider>
  )
}

export default App
