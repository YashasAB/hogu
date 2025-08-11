
import { useState } from 'react'

type Photo = {
  id: string
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

type PhotoCarouselProps = {
  photos: Photo[]
  className?: string
}

export default function PhotoCarousel({ photos, className = '' }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos.length) {
    return (
      <div className={`aspect-[3/2] bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <span className="text-muted">No photos available</span>
      </div>
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? photos.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === photos.length - 1 ? 0 : currentIndex + 1)
  }

  return (
    <div className={`relative aspect-[3/2] rounded-2xl overflow-hidden ${className}`}>
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].alt || `Photo ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white shadow-md'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-70'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Photo Counter */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  )
}
