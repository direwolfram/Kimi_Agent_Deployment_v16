import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragCancelEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Undo2 } from 'lucide-react'
import { useLibrary, LibraryImage } from '../../store/LibraryContext'

const CLUSTER_SIZE = 6
const CANVAS_MAX_WIDTH = 1200
const CANVAS_PADDING = 24
const CLUSTER_GAP = 24
const CLUSTER_PADDING = 12
const CLUSTER_CARD_SIZE = 120
const CLUSTER_CARD_GAP = 8
const CLUSTER_HEADER_HEIGHT = 24
const CANVAS_OVERSCAN = 900

interface Cluster {
  id: string
  name: string
  items: LibraryImage[]
  cols: number
  startIndex: number
  width: number
  height: number
}

interface PositionedCluster {
  cluster: Cluster
  x: number
  y: number
}

const SortableClusterCard = memo(function SortableClusterCard({
  image,
  onZoom,
}: {
  image: LibraryImage
  onZoom: (image: LibraryImage) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, data: { image } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`cluster-card sortable-item group relative w-full h-[120px] bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-md ${isDragging ? 'opacity-40 z-50' : ''}`}
      onClick={() => onZoom(image)}
    >
      <img
        src={image.src}
        alt={image.name}
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="absolute top-1 left-1 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical size={14} className="text-[#8e8e93]" />
      </div>
    </div>
  )
})

const ClusterGroup = memo(function ClusterGroup({
  cluster,
  onZoom,
}: {
  cluster: Cluster
  onZoom: (image: LibraryImage) => void
}) {
  return (
    <div
      className="bg-white/60 rounded-xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-white/50"
      style={{ width: cluster.width, height: cluster.height, contain: 'layout paint style' }}
    >
      <div className="text-xs font-semibold text-[#8e8e93] mb-2 px-1">{cluster.name}</div>
      <SortableContext items={cluster.items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${cluster.cols}, 1fr)`,
            gridAutoRows: '120px',
          }}
        >
          {cluster.items.map((image) => (
            <SortableClusterCard key={image.id} image={image} onZoom={onZoom} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
})

function getClusterSize(itemCount: number) {
  const cols = itemCount <= 3 ? 2 : 3
  const rows = Math.ceil(itemCount / cols)

  return {
    cols,
    width: cols * CLUSTER_CARD_SIZE + Math.max(0, cols - 1) * CLUSTER_CARD_GAP + CLUSTER_PADDING * 2,
    height:
      CLUSTER_HEADER_HEIGHT +
      rows * CLUSTER_CARD_SIZE +
      Math.max(0, rows - 1) * CLUSTER_CARD_GAP +
      CLUSTER_PADDING * 2,
  }
}

function layoutClusters(clusters: Cluster[], viewportWidth: number) {
  const contentWidth = Math.max(0, viewportWidth - CANVAS_PADDING * 2)
  const layoutWidth = Math.min(CANVAS_MAX_WIDTH, contentWidth || CANVAS_MAX_WIDTH)
  const positioned: PositionedCluster[] = []
  let x = 0
  let y = 0
  let rowHeight = 0

  clusters.forEach((cluster) => {
    if (x > 0 && x + cluster.width > layoutWidth) {
      x = 0
      y += rowHeight + CLUSTER_GAP
      rowHeight = 0
    }

    positioned.push({ cluster, x, y })
    x += cluster.width + CLUSTER_GAP
    rowHeight = Math.max(rowHeight, cluster.height)
  })

  return {
    positioned,
    width: layoutWidth,
    height: positioned.length ? y + rowHeight : 0,
  }
}

export function CanvasView() {
  const { filteredImages, reorderImages, zoomToImage, state } = useLibrary()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [historySize, setHistorySize] = useState(0)
  const [viewport, setViewport] = useState({ scrollTop: 0, height: 0, width: 0 })
  const dragStarted = useRef(false)
  const historyRef = useRef<string[][]>([])

  useEffect(() => {
    historyRef.current = []
    setHistorySize(0)
  }, [state.activeFolder])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const clusters = useMemo(() => {
    const groups: Cluster[] = []

    for (let i = 0; i < filteredImages.length; i += CLUSTER_SIZE) {
      const chunk = filteredImages.slice(i, i + CLUSTER_SIZE)
      const size = getClusterSize(chunk.length)
      groups.push({
        id: `cluster-${i}`,
        name: chunk.length === 1 ? chunk[0].name : 'Cluster',
        items: chunk,
        cols: size.cols,
        startIndex: i,
        width: size.width,
        height: size.height,
      })
    }

    return groups
  }, [filteredImages])

  const layout = useMemo(() => layoutClusters(clusters, viewport.width), [clusters, viewport.width])
  const visibleClusters = useMemo(() => {
    const minY = viewport.scrollTop - CANVAS_OVERSCAN
    const maxY = viewport.scrollTop + viewport.height + CANVAS_OVERSCAN

    return layout.positioned.filter(({ cluster, y }) => y + cluster.height >= minY && y <= maxY)
  }, [layout.positioned, viewport.height, viewport.scrollTop])
  const activeImage = useMemo(
    () => filteredImages.find((image) => image.id === activeId),
    [activeId, filteredImages]
  )

  useEffect(() => {
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

  const findCluster = (id: string) => {
    return clusters.find((cluster) => (
      cluster.id === id || cluster.items.some((image) => image.id === id)
    ))
  }

  const handleDragStart = (event: DragStartEvent) => {
    dragStarted.current = true
    setActiveId(String(event.active.id))
  }

  const pushHistory = useCallback((order: string[]) => {
    historyRef.current = [...historyRef.current.slice(-19), order]
    setHistorySize(historyRef.current.length)
  }, [])

  const undoLayout = useCallback(() => {
    const previousOrder = historyRef.current.pop()
    if (!previousOrder) return
    setHistorySize(historyRef.current.length)
    reorderImages(state.activeFolder, previousOrder)
  }, [reorderImages, state.activeFolder])

  const releaseDragLock = () => {
    setTimeout(() => {
      dragStarted.current = false
    }, 0)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    releaseDragLock()

    if (!over || active.id === over.id) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeCluster = findCluster(activeId)
    const overCluster = findCluster(overId)

    if (!activeCluster || !overCluster || activeCluster.id !== overCluster.id) {
      return
    }

    const cluster = activeCluster
    const clusterIds = cluster.items.map((image) => image.id)
    const oldIndex = clusterIds.indexOf(activeId)
    const overIndex = clusterIds.indexOf(overId)
    const newIndex = overIndex === -1 ? clusterIds.length - 1 : overIndex

    if (oldIndex === -1 || oldIndex === newIndex) {
      return
    }

    const reorderedClusterIds = arrayMove(clusterIds, oldIndex, newIndex)
    const nextOrder = filteredImages.map((image) => image.id)
    pushHistory([...nextOrder])
    nextOrder.splice(cluster.startIndex, reorderedClusterIds.length, ...reorderedClusterIds)

    reorderImages(state.activeFolder, nextOrder)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null)
    releaseDragLock()
  }

  const handleZoom = useCallback((image: LibraryImage) => {
    if (dragStarted.current) return
    zoomToImage(image, { x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }, [zoomToImage])

  return (
    <div
      ref={scrollRef}
      className="h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden bg-[#f5f5f7] p-6 relative"
      style={{ contain: 'strict' }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
          {visibleClusters.map(({ cluster, x, y }) => (
            <div
              key={cluster.id}
              className="absolute"
              style={{
                width: cluster.width,
                height: cluster.height,
                transform: `translate3d(${x}px, ${y}px, 0)`,
              }}
            >
              <ClusterGroup
                cluster={cluster}
                onZoom={handleZoom}
              />
            </div>
          ))}
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {activeImage ? (
            <div className="w-[120px] h-[120px] bg-white rounded-[6px] overflow-hidden shadow-2xl cursor-grabbing">
              <img
                src={activeImage.src}
                alt={activeImage.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <button
        type="button"
        onClick={undoLayout}
        disabled={historySize === 0}
        title="Undo"
        className="fixed bottom-5 right-5 z-50 p-2 rounded-[8px] transition-all hover:scale-110 disabled:hover:scale-100"
        style={{
          backgroundColor: 'rgba(255,255,255,0.85)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          color: historySize === 0 ? '#c7c7cc' : '#6e6e93',
          cursor: historySize === 0 ? 'default' : 'pointer',
          opacity: historySize === 0 ? 0.55 : 1,
        }}
      >
        <Undo2 size={14} />
      </button>
    </div>
  )
}
