import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

type Restaurant = {
  id: string
  name: string
  slug: string
  emoji: string
  position: { lat: number; lng: number }
  image: string
  neighborhood: string
}

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'ZLB',
    slug: 'zlb',
    emoji: '🍸',
    position: { lat: 12.9716, lng: 77.5946 }, // Indiranagar
    image: '/api/placeholder/200/150',
    neighborhood: 'Indiranagar'
  },
  {
    id: '2',
    name: 'Soka',
    slug: 'soka',
    emoji: '🍸',
    position: { lat: 12.9352, lng: 77.6245 }, // Koramangala
    image: '/api/placeholder/200/150',
    neighborhood: 'Koramangala'
  },
  {
    id: '3',
    name: 'Spirit Forward',
    slug: 'spirit-forward',
    emoji: '🥃',
    position: { lat: 12.9698, lng: 77.5991 }, // UB City
    image: '/api/placeholder/200/150',
    neighborhood: 'UB City'
  },
  {
    id: '4',
    name: 'Naru',
    slug: 'naru',
    emoji: '🍱',
    position: { lat: 12.9372, lng: 77.6263 }, // Koramangala
    image: '/api/placeholder/200/150',
    neighborhood: 'Koramangala'
  }
]

// Create custom icon with emoji
const createEmojiIcon = (emoji: string) => {
  return L.divIcon({
    html: `<div style="background: white; border: 2px solid #e11d48; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">${emoji}</div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export default function ExploreRestaurants() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  
  // Fix for default markers in React-Leaflet
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }, [])

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
              Click on restaurant markers to see details and make reservations.
            </p>
          </div>
        </div>

        {/* Map Container */}
        <div className="mx-4 sm:mx-8">
          <div
            className="relative bg-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200"
            style={{ height: '600px' }}
          >
            <MapContainer
              center={[12.9716, 77.5946]} // Bengaluru center
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="rounded-2xl"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {restaurants.map((restaurant) => (
                <Marker
                  key={restaurant.id}
                  position={[restaurant.position.lat, restaurant.position.lng]}
                  icon={createEmojiIcon(restaurant.emoji)}
                  eventHandlers={{
                    click: () => handleRestaurantClick(restaurant)
                  }}
                >
                  <Popup>
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{restaurant.name}</h3>
                      <p className="text-gray-600">{restaurant.neighborhood}</p>
                      <Link
                        to={`/r/${restaurant.slug}`}
                        className="inline-block mt-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand/90"
                      >
                        Reserve Now
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Restaurant Popup Modal */}
            {selectedRestaurant && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
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