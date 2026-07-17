import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLibrary } from '../../store/LibraryContext'

export function ZoomOverlay() {
  const { state, closeZoom } = useLibrary()
  const { zoomImage, zoomOrigin } = state
  const ext = (zoomImage?.ext || zoomImage?.src.split(/[?#]/)[0].split('.').pop() || '').toLowerCase()
  const isVideo = ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'ogv'].includes(ext) || zoomImage?.mime?.startsWith('video/')
  const urlType = (zoomImage?.type || zoomImage?.mime || zoomImage?.ext || '').toLowerCase()
  const isUrl = urlType === 'url' || urlType === 'link' || urlType === 'website' || urlType === 'text/uri-list'
  const mediaSrc = zoomImage?.mediaSrc || zoomImage?.src || ''
  const webSrc = [
    zoomImage?.url,
    zoomImage?.website,
    zoomImage?.link,
    zoomImage?.sourceURL,
    zoomImage?.annotation,
    zoomImage?.mediaSrc,
    zoomImage?.fileURL,
    zoomImage?.src,
  ].map((value) => (value || '').match(/https?:\/\/[^\s"'<>]+/i)?.[0] || '').find(Boolean) || ''

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
      ) : isUrl ? (
        <div className="w-[90vw] h-[90vh] overflow-hidden rounded-lg shadow-2xl bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="h-9 flex items-center px-3 text-xs text-[#3a3a3c] border-b border-[#e5e5ea] bg-[#f5f5f7]">
            <span className="truncate">{webSrc || 'No valid URL found for this item'}</span>
          </div>
          {webSrc ? (
            <iframe
              title={zoomImage.name || webSrc}
              src={webSrc}
              className="w-full h-[calc(100%-36px)] bg-white"
              referrerPolicy="no-referrer-when-downgrade"
              allow="clipboard-read; clipboard-write; fullscreen; geolocation; microphone; camera"
            />
          ) : (
            <div className="h-[calc(100%-36px)] flex items-center justify-center text-sm text-[#8e8e93]">
              The URL item did not include an http or https address.
            </div>
          )}
        </div>
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
