
import { useState, useRef, useEffect } from 'react'
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
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (mapRef.current) {
      initializeMap()
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current) return

    // Clear any existing content
    mapRef.current.innerHTML = ''

    // Create SVG map
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('viewBox', '0 0 800 600')
    svg.style.backgroundColor = '#f0f9ff'

    // Add Bengaluru map elements
    const mapElements = `
      <!-- Outer Ring Road -->
      <circle cx="400" cy="300" r="280" fill="none" stroke="#6b7280" stroke-width="8" opacity="0.6"/>
      
      <!-- Major Roads -->
      <line x1="0" y1="200" x2="800" y2="200" stroke="#6b7280" stroke-width="6" opacity="0.7"/>
      <line x1="0" y1="400" x2="800" y2="400" stroke="#6b7280" stroke-width="6" opacity="0.7"/>
      <line x1="200" y1="0" x2="200" y2="600" stroke="#6b7280" stroke-width="6" opacity="0.7"/>
      <line x1="600" y1="0" x2="600" y2="600" stroke="#6b7280" stroke-width="6" opacity="0.7"/>

      <!-- Neighborhoods -->
      <rect x="280" y="120" width="120" height="80" rx="12" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" opacity="0.8"/>
      <text x="340" y="155" text-anchor="middle" font-size="14" font-weight="bold" fill="#1e40af">Indiranagar</text>
      
      <rect x="480" y="220" width="130" height="90" rx="12" fill="#dcfce7" stroke="#22c55e" stroke-width="2" opacity="0.8"/>
      <text x="545" y="260" text-anchor="middle" font-size="14" font-weight="bold" fill="#166534">Koramangala</text>
      
      <rect x="180" y="400" width="120" height="80" rx="12" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" opacity="0.8"/>
      <text x="240" y="435" text-anchor="middle" font-size="14" font-weight="bold" fill="#92400e">HSR Layout</text>
      
      <rect x="80" y="180" width="100" height="70" rx="12" fill="#e9d5ff" stroke="#a855f7" stroke-width="2" opacity="0.8"/>
      <text x="130" y="210" text-anchor="middle" font-size="12" font-weight="bold" fill="#7c3aed">UB City</text>
    `
    svg.innerHTML = mapElements

    // Add restaurant markers
    restaurants.forEach((restaurant, index) => {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      marker.style.cursor = 'pointer'
      
      // Calculate position based on neighborhood
      let x = 400, y = 300 // default center
      if (restaurant.neighborhood === 'Indiranagar') { x = 340; y = 160 }
      else if (restaurant.neighborhood === 'Koramangala') { x = 545; y = 265 }
      else if (restaurant.neighborhood === 'HSR Layout') { x = 240; y = 440 }
      else if (restaurant.neighborhood === 'UB City') { x = 130; y = 215 }

      // Create marker background
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', x.toString())
      circle.setAttribute('cy', y.toString())
      circle.setAttribute('r', '25')
      circle.setAttribute('fill', 'white')
      circle.setAttribute('stroke', '#dc2626')
      circle.setAttribute('stroke-width', '3')
      circle.style.filter = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'

      // Create emoji text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', x.toString())
      text.setAttribute('y', (y + 6).toString())
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-size', '20')
      text.textContent = restaurant.emoji

      marker.appendChild(circle)
      marker.appendChild(text)

      // Add click handler
      marker.addEventListener('click', () => {
        setSelectedRestaurant(restaurant)
      })

      // Add hover effects
      marker.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '30')
        circle.setAttribute('stroke', '#dc2626')
        text.setAttribute('font-size', '24')
      })

      marker.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '25')
        circle.setAttribute('stroke', '#dc2626')
        text.setAttribute('font-size', '20')
      })

      svg.appendChild(marker)
    })

    mapRef.current.appendChild(svg)
  }

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const closePopup = () => {
    setSelectedRestaurant(null)
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
          <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
            <div
              ref={mapRef}
              className="w-full h-96 sm:h-[500px]"
              style={{
                minHeight: "400px",
                zIndex: 1,
                position: "relative",
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3 font-medium text-center">
            📍 Interactive map showing restaurants across Bengaluru. Click markers for details.
          </p>
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
