
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

type Restaurant = {
  id: string
  name: string
  slug: string
  neighborhood?: string | null
  heroImageUrl?: string | null
  cuisineTags?: string[]
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('q', searchQuery)
        if (cityFilter) params.append('city', cityFilter)
        if (cuisineFilter) params.append('cuisine', cuisineFilter)
        
        const response = await fetch(`/api/restaurants?${params}`)
        if (response.ok) {
          const data = await response.json()
          setRestaurants(data)
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [searchQuery, cityFilter, cuisineFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand">Discover Bengaluru</h1>
        <p className="text-muted">Find and book the city's best restaurants</p>
      </div>

      {/* Search and Filters */}
      <div className="card space-y-4">
        <input
          type="text"
          placeholder="Search restaurants..."
          className="input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex gap-3">
          <select
            className="input flex-1"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Areas</option>
            <option value="Koramangala">Koramangala</option>
            <option value="Indiranagar">Indiranagar</option>
            <option value="Whitefield">Whitefield</option>
            <option value="HSR Layout">HSR Layout</option>
          </select>
          <select
            className="input flex-1"
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          >
            <option value="">All Cuisines</option>
            <option value="Indian">Indian</option>
            <option value="Chinese">Chinese</option>
            <option value="Continental">Continental</option>
            <option value="Italian">Italian</option>
          </select>
        </div>
      </div>

      {/* Restaurant Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[3/2] bg-gray-200 rounded-xl mb-4" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              to={`/r/${restaurant.slug}`}
              className="card hover:shadow-lg transition-shadow group"
            >
              {restaurant.heroImageUrl ? (
                <div className="aspect-[3/2] bg-gray-200 rounded-xl mb-4 overflow-hidden">
                  <img
                    src={restaurant.heroImageUrl}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-[3/2] bg-gray-200 rounded-xl mb-4 flex items-center justify-center">
                  <span className="text-muted">No image</span>
                </div>
              )}
              <h3 className="font-semibold text-lg mb-1">{restaurant.name}</h3>
              <p className="text-muted">{restaurant.neighborhood || 'Bengaluru'}</p>
              {restaurant.cuisineTags && restaurant.cuisineTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {restaurant.cuisineTags.slice(0, 3).map((tag) => (
                    <span key={tag} className="pill bg-gray-100 text-gray-700 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {!loading && restaurants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted">No restaurants found matching your criteria</p>
        </div>
      )}
    </div>
  )
}
