
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
    position: { x: 60, y: 55 },
    image: '/api/placeholder/200/150',
    neighborhood: 'HSR Layout'
  }
]

export default function ExploreRestaurants() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const closePopup = () => {
    setSelectedRestaurant(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand/80" />
        <div className="relative z-10 px-5 py-8 sm:px-8">
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-2">
            Explore Tonight in Bengaluru
          </h1>
          <p className="opacity-90">
            Discover available tables at the city's hottest spots. Tap on the markers to see what's available right now.
          </p>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl overflow-hidden" style={{ height: '500px' }}>
        {/* Map Background - Simple illustration */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-200 via-green-100 to-blue-200">
          {/* Simple road/area illustrations */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1 bg-gray-400 rounded opacity-60"></div>
          <div className="absolute top-1/2 left-1/6 w-2/3 h-1 bg-gray-400 rounded opacity-60"></div>
          <div className="absolute top-3/4 left-1/3 w-1/3 h-1 bg-gray-400 rounded opacity-60"></div>
          
          {/* Area labels */}
          <div className="absolute top-1/4 left-1/4 text-xs text-gray-600 font-medium">Indiranagar</div>
          <div className="absolute top-1/2 right-1/4 text-xs text-gray-600 font-medium">Koramangala</div>
          <div className="absolute bottom-1/4 left-1/3 text-xs text-gray-600 font-medium">HSR Layout</div>
          <div className="absolute top-1/3 left-1/6 text-xs text-gray-600 font-medium">UB City</div>
        </div>

        {/* Restaurant Markers */}
        {restaurants.map((restaurant) => (
          <button
            key={restaurant.id}
            onClick={() => handleRestaurantClick(restaurant)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl hover:scale-125 transition-transform duration-200 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-white"
            style={{
              left: `${restaurant.position.x}%`,
              top: `${restaurant.position.y}%`
            }}
            title={restaurant.name}
          >
            {restaurant.emoji}
          </button>
        ))}

        {/* Restaurant Popup */}
        {selectedRestaurant && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-brand">{selectedRestaurant.name}</h3>
                <button
                  onClick={closePopup}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <img
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                className="w-full h-32 object-cover rounded-xl mb-4"
              />
              
              <p className="text-muted mb-4">{selectedRestaurant.neighborhood}</p>
              
              <div className="flex gap-2">
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

      {/* Restaurant List - Fallback for smaller screens */}
      <div className="lg:hidden space-y-3">
        <h2 className="text-xl font-semibold">Available Tonight</h2>
        <div className="grid gap-4">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/r/${restaurant.slug}`}
              className="card hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-4">
                <div className="text-2xl">{restaurant.emoji}</div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-brand">{restaurant.name}</div>
                  <div className="text-muted">{restaurant.neighborhood}</div>
                </div>
                <div className="btn btn-primary">Reserve</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <Link to="/" className="btn btn-secondary">
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
