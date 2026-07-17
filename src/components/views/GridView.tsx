import React from 'react'
import { useLibrary, LibraryImage, ImportSortDirection } from '../../store/LibraryContext'

const GRID_GAP = 16
const GRID_ROW_HEIGHT = 200
const GRID_PADDING = 24
const GRID_OVERSCAN = 800

function getImportedTime(image: LibraryImage) {
  const time = image.importedAt ? new Date(image.importedAt).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

function sortByDateImported(images: LibraryImage[], direction: ImportSortDirection) {
  const directionMultiplier = direction === 'asc' ? 1 : -1

  return images
    .map((image, index) => ({ image, index }))
    .sort((a, b) => {
      const dateDelta = (getImportedTime(a.image) - getImportedTime(b.image)) * directionMultiplier
      return dateDelta || a.index - b.index
    })
    .map(({ image }) => image)
}

function ImageCard({ image, onClick }: { image: LibraryImage; onClick?: (image: LibraryImage, e: React.MouseEvent) => void }) {
  return (
    <div
      className="cluster-card w-full h-full bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={(e) => onClick?.(image, e)}
    >
      <img
        src={image.src}
        alt={image.name}
        className="w-full h-full object-cover"
        loading="lazy"
        draggable={false}
      />
    </div>
  )
}

export function GridView() {
  const { filteredImages, zoomToImage, state } = useLibrary()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = React.useState({ scrollTop: 0, height: 0, width: 0 })
  const gridImages = React.useMemo(
    () => sortByDateImported(filteredImages, state.importSortDirection),
    [filteredImages, state.importSortDirection]
  )
  const columns = React.useMemo(() => {
    if (viewport.width >= 1280) return 5
    if (viewport.width >= 1024) return 4
    if (viewport.width >= 768) return 3
    return 2
  }, [viewport.width])
  const contentWidth = Math.max(0, viewport.width - GRID_PADDING * 2)
  const cardWidth = columns > 0 ? (contentWidth - GRID_GAP * (columns - 1)) / columns : 0
  const rowStride = GRID_ROW_HEIGHT + GRID_GAP
  const totalRows = Math.ceil(gridImages.length / columns)
  const totalHeight = Math.max(0, totalRows * GRID_ROW_HEIGHT + Math.max(0, totalRows - 1) * GRID_GAP)
  const visibleImages = React.useMemo(() => {
    const startRow = Math.max(0, Math.floor((viewport.scrollTop - GRID_OVERSCAN) / rowStride))
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((viewport.scrollTop + viewport.height + GRID_OVERSCAN) / rowStride)
    )
    const startIndex = startRow * columns
    const endIndex = Math.min(gridImages.length, (endRow + 1) * columns)

    return gridImages.slice(startIndex, endIndex).map((image, offset) => {
      const index = startIndex + offset
      const row = Math.floor(index / columns)
      const col = index % columns

      return {
        image,
        x: col * (cardWidth + GRID_GAP),
        y: row * rowStride,
      }
    })
  }, [cardWidth, columns, gridImages, rowStride, totalRows, viewport])

  React.useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    let frame = 0
    const measure = () => {
      frame = 0
      setViewport({
        scrollTop: element.scrollTop,
        height: element.clientHeight,
        width: element.clientWidth,
      })
    }
    const scheduleMeasure = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    element.addEventListener('scroll', scheduleMeasure, { passive: true })
    window.addEventListener('resize', scheduleMeasure)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      element.removeEventListener('scroll', scheduleMeasure)
      window.removeEventListener('resize', scheduleMeasure)
    }
  }, [])

  const handleClick = (image: LibraryImage, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    zoomToImage(image, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  return (
    <div ref={scrollRef} className="p-6 overflow-y-auto h-[calc(100vh-56px)]" style={{ contain: 'strict' }}>
      <div className="relative" style={{ height: totalHeight }}>
        {visibleImages.map(({ image, x, y }) => (
          <div
            key={image.id}
            className="absolute"
            style={{
              width: cardWidth,
              height: GRID_ROW_HEIGHT,
              transform: `translate3d(${x}px, ${y}px, 0)`,
              contain: 'layout paint style',
            }}
          >
            <ImageCard image={image} onClick={handleClick} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InfinityView() {
  const { filteredImages, zoomToImage } = useLibrary()

  const handleClick = (image: LibraryImage, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    zoomToImage(image, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-x-auto overflow-y-hidden whitespace-nowrap p-6">
      {filteredImages.map((image) => (
        <div
          key={image.id}
          className="inline-block w-[300px] h-[400px] mr-4 bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer cluster-card"
          onClick={(e) => handleClick(image, e)}
        >
          <img
            src={image.src}
            alt={image.name}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
