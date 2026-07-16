import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLibrary } from '../../store/LibraryContext'

export function ZoomOverlay() {
  const { state, closeZoom } = useLibrary()
  const { zoomImage, zoomOrigin } = state

  useEffect(() => {
    if (!zoomImage) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomImage, closeZoom])

  if (!zoomImage || !zoomOrigin) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      onClick={closeZoom}
    >
      <button
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full"
        onClick={closeZoom}
      >
        <X size={24} />
      </button>
      <img
        src={zoomImage.src}
        alt={zoomImage.name}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
