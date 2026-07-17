import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLibrary } from '../../store/LibraryContext'

export function ZoomOverlay() {
  const { state, closeZoom } = useLibrary()
  const { zoomImage, zoomOrigin } = state
  const ext = (zoomImage?.ext || zoomImage?.src.split(/[?#]/)[0].split('.').pop() || '').toLowerCase()
  const isVideo = ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'ogv'].includes(ext) || zoomImage?.mime?.startsWith('video/')
  const mediaSrc = zoomImage?.mediaSrc || zoomImage?.src || ''

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
      {isVideo ? (
        <video
          src={mediaSrc}
          poster={zoomImage.src !== mediaSrc ? zoomImage.src : undefined}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl bg-black"
          controls
          playsInline
          preload="metadata"
          autoPlay
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={mediaSrc}
          alt={zoomImage.name}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          decoding="sync"
          fetchPriority="high"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
