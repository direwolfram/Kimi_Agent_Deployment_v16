import { useMemo, useState, useRef } from 'react'
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
import { GripVertical } from 'lucide-react'
import { useLibrary, LibraryImage } from '../../store/LibraryContext'

interface Cluster {
  id: string
  name: string
  items: LibraryImage[]
  cols: number
  startIndex: number
}

function SortableClusterCard({
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
        draggable={false}
      />
      <div className="absolute top-1 left-1 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical size={14} className="text-[#8e8e93]" />
      </div>
    </div>
  )
}

function ClusterGroup({
  cluster,
  onZoom,
}: {
  cluster: Cluster
  onZoom: (image: LibraryImage) => void
}) {
  return (
    <div className="bg-white/60 rounded-xl p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-white/50">
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
}

export function CanvasView() {
  const { filteredImages, reorderImages, zoomToImage, state } = useLibrary()
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragStarted = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const clusters = useMemo(() => {
    const groups: Cluster[] = []
    const clusterSize = 6

    for (let i = 0; i < filteredImages.length; i += clusterSize) {
      const chunk = filteredImages.slice(i, i + clusterSize)
      const cols = chunk.length <= 3 ? 2 : 3
      groups.push({
        id: `cluster-${i}`,
        name: chunk.length === 1 ? chunk[0].name : 'Cluster',
        items: chunk,
        cols,
        startIndex: i,
      })
    }

    return groups
  }, [filteredImages])

  const flatItems = useMemo(() => clusters.flatMap((cluster) => cluster.items), [clusters])
  const activeImage = useMemo(
    () => flatItems.find((image) => image.id === activeId),
    [activeId, flatItems]
  )

  const findCluster = (id: string) => {
    return clusters.find((cluster) => (
      cluster.id === id || cluster.items.some((image) => image.id === id)
    ))
  }

  const handleDragStart = (event: DragStartEvent) => {
    dragStarted.current = true
    setActiveId(String(event.active.id))
  }

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
    nextOrder.splice(cluster.startIndex, reorderedClusterIds.length, ...reorderedClusterIds)

    reorderImages(state.activeFolder, nextOrder)
  }

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null)
    releaseDragLock()
  }

  const handleZoom = (image: LibraryImage) => {
    if (dragStarted.current) return
    zoomToImage(image, { x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-y-auto overflow-x-hidden bg-[#f5f5f7] p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-wrap gap-6 content-start max-w-[1200px] mx-auto">
          {clusters.map((cluster) => (
            <ClusterGroup
              key={cluster.id}
              cluster={cluster}
              onZoom={handleZoom}
            />
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
    </div>
  )
}
