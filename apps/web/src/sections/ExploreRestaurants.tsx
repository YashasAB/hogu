
import { useState } from 'react'
import { Link } from 'react-router-dom'

type Restaurant = {
  id: string
  name: string
  slug: string
  emoji: string
  position: { x: number; y: number }
  image: string
  neighborhood: string
}

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'ZLB',
    slug: 'zlb',
    emoji: '🍸',
    position: { x: 45, y: 60 },
    image: '/api/placeholder/200/150',
    neighborhood: 'Indiranagar'
  },
  {
    id: '2',
    name: 'Soka',
    slug: 'soka',
    emoji: '🍜',
    position: { x: 55, y: 45 },
    image: '/api/placeholder/200/150',
    neighborhood: 'Koramangala'
  },
  {
    id: '3',
    name: 'Spirit Forward',
    slug: 'spirit-forward',
    emoji: '🥃',
    position: { x: 40, y: 40 },
    image: '/api/placeholder/200/150',
    neighborhood: 'UB City'
  },
  {
    id: '4',
    name: 'Naru',
    slug: 'naru',
    emoji: '🍱',
    position: { x: 50, y: 35 },
    image: '/api/placeholder/200/150',
    neighborhood: 'Koramangala'
  }
]

export default function ExploreRestaurants() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [mapTransform, setMapTransform] = useState({ scale: 1, x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const closePopup = () => {
    setSelectedRestaurant(null)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - mapTransform.x, y: e.clientY - mapTransform.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setMapTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.5, Math.min(3, mapTransform.scale * scaleFactor))
    setMapTransform(prev => ({ ...prev, scale: newScale }))
  }

  const Spark = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      className="inline-block align-[-2px]"
    >
      <path
        d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2z"
        fill="currentColor"
      />
    </svg>
  )

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8">
          <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
            <Spark /> <span>Explore Tonight in Bengaluru</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-2">
            Find Tables on the Map
          </h1>
          <p className="opacity-90 max-w-2xl">
            Discover available tables at the city's hottest spots. Tap on the markers to see what's available right now. Zoom and pan to explore different areas.
          </p>
          
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/" className="btn bg-white text-brand">
              ← Back to Home
            </Link>
            <a href="#map" className="btn btn-accent">
              View Map
            </a>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section id="map" className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
          <div className="relative z-10 px-5 py-6 sm:px-8">
            <h2 className="text-xl font-semibold mb-2">Interactive Bengaluru Map</h2>
            <p className="opacity-90 text-sm">
              Use mouse wheel to zoom, click and drag to move around. Click on restaurant markers to see details.
            </p>
          </div>
        </div>

        {/* Map Container with proper margins */}
        <div className="mx-4 sm:mx-8">
          <div 
            className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200 cursor-grab select-none"
            style={{ height: '600px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Simple Map Background */}
            <div 
              className="absolute inset-0 transition-transform duration-200"
              style={{
                transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`,
                transformOrigin: 'center center'
              }}
            >
              {/* Simple Bengaluru Map */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                {/* Main roads */}
                <div className="absolute top-1/4 left-0 w-full h-1 bg-gray-300 opacity-60"></div>
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 opacity-60"></div>
                <div className="absolute top-3/4 left-0 w-full h-1 bg-gray-300 opacity-60"></div>
                <div className="absolute left-1/4 top-0 w-1 h-full bg-gray-300 opacity-60"></div>
                <div className="absolute left-1/2 top-0 w-1 h-full bg-gray-300 opacity-60"></div>
                <div className="absolute left-3/4 top-0 w-1 h-full bg-gray-300 opacity-60"></div>
                
                {/* Outer ring road */}
                <div className="absolute top-1/6 left-1/6 w-2/3 h-2/3 border-2 border-gray-400 rounded-full opacity-50"></div>
              </div>

              {/* Restaurant Markers */}
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => handleRestaurantClick(restaurant)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 text-3xl hover:scale-125 transition-all duration-300 bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-white hover:border-brand z-10"
                  style={{
                    left: `${restaurant.position.x}%`,
                    top: `${restaurant.position.y}%`
                  }}
                  title={restaurant.name}
                >
                  {restaurant.emoji}
                </button>
              ))}
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
              <button
                onClick={() => setMapTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                className="btn btn-secondary w-10 h-10 p-0 text-lg"
                title="Zoom In"
              >
                +
              </button>
              <button
                onClick={() => setMapTransform(prev => ({ ...prev, scale: Math.max(0.5, prev.scale * 0.8) }))}
                className="btn btn-secondary w-10 h-10 p-0 text-lg"
                title="Zoom Out"
              >
                −
              </button>
              <button
                onClick={() => setMapTransform({ scale: 1, x: 0, y: 0 })}
                className="btn btn-secondary px-2 py-1 text-xs"
                title="Reset View"
              >
                Reset
              </button>
            </div>

            {/* Restaurant Popup */}
            {selectedRestaurant && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="card max-w-sm mx-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-brand">{selectedRestaurant.name}</h3>
                    <button
                      onClick={closePopup}
                      className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  
                  <img
                    src={selectedRestaurant.image}
                    alt={selectedRestaurant.name}
                    className="w-full h-40 object-cover rounded-xl mb-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  <p className="text-muted mb-4 font-medium">{selectedRestaurant.neighborhood}</p>
                  
                  <div className="flex gap-3">
                    <Link
                      to={`/r/${selectedRestaurant.slug}`}
                      className="btn btn-primary flex-1"
                      onClick={closePopup}
                    >
                      Reserve Now
                    </Link>
                    <button
                      onClick={closePopup}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Restaurant List - Mobile Fallback */}
      <section className="lg:hidden space-y-4">
        <div className="relative overflow-hidden rounded-2xl text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
          <div className="relative z-10 px-5 py-6 sm:px-8">
            <h2 className="text-xl font-semibold">Available Tonight</h2>
            <p className="opacity-90 text-sm">Browse restaurants on smaller screens</p>
          </div>
        </div>
        
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/r/${restaurant.slug}`}
              className="card hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center">
                  {restaurant.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-brand mb-1">{restaurant.name}</div>
                  <div className="text-muted">{restaurant.neighborhood}</div>
                </div>
                <div className="btn btn-primary">Reserve</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 px-6 py-6">
        <p className="font-semibold mb-2">Real-time availability. No bots. Fair access.</p>
        <p className="text-sm">
          Hogu verifies identities and uses queue fairness to keep things clean. Your booking is yours — not a scalper's.
        </p>
      </section>
    </div>
  )
}
