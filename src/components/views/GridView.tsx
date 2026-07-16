import React from 'react'
import { useLibrary, LibraryImage } from '../../store/LibraryContext'

function ImageCard({ image, onClick }: { image: LibraryImage; onClick?: (image: LibraryImage, e: React.MouseEvent) => void }) {
  return (
    <div
      className="cluster-card bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
  const { filteredImages, zoomToImage } = useLibrary()

  const handleClick = (image: LibraryImage, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    zoomToImage(image, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  return (
    <div className="p-6 overflow-y-auto h-[calc(100vh-56px)]">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-[200px]">
        {filteredImages.map((image) => (
          <ImageCard key={image.id} image={image} onClick={handleClick} />
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
