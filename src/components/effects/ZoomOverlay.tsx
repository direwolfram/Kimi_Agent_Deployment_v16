import { useEffect, useRef, useState } from 'react'
import { ExternalLink, Pause, Play, X } from 'lucide-react'
import { useLibrary } from '../../store/LibraryContext'

function formatVideoTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function firstUrl(...values: Array<string | undefined>) {
  return values
    .map((value) => (value || '').match(/https?:\/\/[^\s"'<>]+/i)?.[0] || '')
    .find(Boolean) || ''
}

export function ZoomOverlay() {
  const { state, closeZoom } = useLibrary()
  const { zoomImage, zoomOrigin } = state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [videoTime, setVideoTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 })
  const ext = (zoomImage?.ext || zoomImage?.src.split(/[?#]/)[0].split('.').pop() || '').toLowerCase()
  const isVideo = ['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'ogv'].includes(ext) || zoomImage?.mime?.startsWith('video/')
  const urlType = (zoomImage?.type || zoomImage?.mime || zoomImage?.ext || '').toLowerCase()
  const isUrl = urlType === 'url' || urlType === 'link' || urlType === 'website' || urlType === 'text/uri-list'
  const mediaSrc = zoomImage?.mediaSrc || zoomImage?.src || ''
  const webSrc = firstUrl(
    zoomImage?.url,
    zoomImage?.website,
    zoomImage?.link,
    zoomImage?.sourceURL,
    zoomImage?.annotation,
    zoomImage?.mediaSrc,
    zoomImage?.fileURL,
    zoomImage?.src
  )

  useEffect(() => {
    if (!zoomImage) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeZoom()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoomImage, closeZoom])

  useEffect(() => {
    setVideoPlaying(false)
    setVideoTime(0)
    setVideoDuration(0)
    setVideoSize({ width: 0, height: 0 })
  }, [zoomImage?.id])

  if (!zoomImage || !zoomOrigin) return null

  const toggleVideoPlayback = (event?: React.MouseEvent) => {
    event?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

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
      {!isUrl && webSrc && (
        <a
          href={webSrc}
          target="_blank"
          rel="noreferrer"
          className="absolute top-4 left-4 max-w-[min(520px,calc(100vw-96px))] inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-medium text-[#1c1c1e] shadow-lg hover:bg-white"
          onClick={(e) => e.stopPropagation()}
          title={webSrc}
        >
          <ExternalLink size={14} className="shrink-0" />
          <span className="truncate">{webSrc}</span>
        </a>
      )}
      {isVideo ? (
        <div className="relative overflow-hidden rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <video
            ref={videoRef}
            src={mediaSrc}
            poster={zoomImage.src !== mediaSrc ? zoomImage.src : undefined}
            className="object-contain"
            style={{
              height: 'calc(100vh - 88px)',
              maxWidth: 'calc(100vw - 48px)',
              aspectRatio: videoSize.width && videoSize.height ? `${videoSize.width} / ${videoSize.height}` : undefined,
              width: videoSize.width && videoSize.height ? 'auto' : undefined,
            }}
            playsInline
            preload="metadata"
            autoPlay
            onClick={toggleVideoPlayback}
            onPlay={() => setVideoPlaying(true)}
            onPause={() => setVideoPlaying(false)}
            onTimeUpdate={(e) => setVideoTime(e.currentTarget.currentTime || 0)}
            onLoadedMetadata={(e) => {
              setVideoDuration(e.currentTarget.duration || 0)
              setVideoSize({
                width: e.currentTarget.videoWidth || 0,
                height: e.currentTarget.videoHeight || 0,
              })
            }}
          />
        </div>
      ) : isUrl ? (
        <div className="w-[90vw] h-[90vh] overflow-hidden rounded-lg shadow-2xl bg-white" onClick={(e) => e.stopPropagation()}>
          <div className="h-9 flex items-center px-3 text-xs text-[#3a3a3c] border-b border-[#e5e5ea] bg-[#f5f5f7]">
            {webSrc ? (
              <a
                href={webSrc}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-w-0 items-center gap-1.5 hover:text-[#007aff]"
                title={webSrc}
              >
                <ExternalLink size={13} className="shrink-0" />
                <span className="truncate">{webSrc}</span>
              </a>
            ) : (
              <span className="truncate">No valid URL found for this item</span>
            )}
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
      {isVideo && (
        <div
          className="absolute left-0 right-0 bottom-0 z-[101] flex items-center gap-3 px-4 py-2.5 bg-white/95 border-t border-black/10 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="size-8 shrink-0 rounded-full flex items-center justify-center text-[#1c1c1e] hover:bg-black/[0.04]"
            onClick={toggleVideoPlayback}
            aria-label={videoPlaying ? 'Pause video' : 'Play video'}
          >
            {videoPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <span className="w-10 text-xs tabular-nums text-[#3a3a3c]">{formatVideoTime(videoTime)}</span>
          <input
            type="range"
            min={0}
            max={videoDuration || 0}
            step={0.01}
            value={Math.min(videoTime, videoDuration || videoTime || 0)}
            onChange={(e) => {
              const nextTime = Number(e.currentTarget.value)
              if (videoRef.current && Number.isFinite(nextTime)) {
                videoRef.current.currentTime = nextTime
                setVideoTime(nextTime)
              }
            }}
            className="min-w-0 flex-1 accent-[#1c1c1e]"
            aria-label="Video timeline"
          />
          <span className="w-10 text-right text-xs tabular-nums text-[#8e8e93]">{formatVideoTime(videoDuration)}</span>
        </div>
      )}
    </div>
  )
}
