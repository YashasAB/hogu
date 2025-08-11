
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type Restaurant = {
  id: string
  name: string
  slug: string
  neighborhood?: string | null
  heroImageUrl?: string | null
  cuisineTags?: string[]
}

export default function Home() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('hogu_token')
    setIsLoggedIn(!!token)

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

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-brand to-purple-700 text-white rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        <div className="relative p-8 md:p-12 text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome to Hogu
            </h1>
            <p className="text-xl md:text-2xl font-light opacity-90 max-w-3xl mx-auto">
              Bengaluru's Fair Reservation Platform
            </p>
            <p className="text-lg opacity-80 max-w-2xl mx-auto">
              Plan your week. Find tonight's spots. Skip the bots and fake accounts. 
              Experience dining the way it should be.
            </p>
          </div>

          {!isLoggedIn && (
            <div className="pt-4">
              <button
                onClick={handleLogin}
                className="btn bg-white text-brand hover:bg-gray-50 text-lg px-8 py-4 font-semibold shadow-xl"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Value Propositions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card text-center space-y-4 p-6 border-2 border-green-100 bg-green-50">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-800">Guaranteed Reservations</h3>
          <p className="text-green-700">
            Plan your entire week with confidence. Our fair allocation system ensures real people get real tables.
          </p>
        </div>

        <div className="card text-center space-y-4 p-6 border-2 border-blue-100 bg-blue-50">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-blue-800">Bot-Free Environment</h3>
          <p className="text-blue-700">
            No more fighting bots or fake accounts. Our verified user system protects inventory for real diners.
          </p>
        </div>

        <div className="card text-center space-y-4 p-6 border-2 border-purple-100 bg-purple-50">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-purple-800">Last-Minute Magic</h3>
          <p className="text-purple-700">
            Find amazing spots for tonight with our real-time inventory drops and fair waitlist system.
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="card space-y-6 p-8 bg-gray-50">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How Hogu Works</h2>
          <p className="text-muted">Fair access to Bengaluru's best restaurants</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
              1
            </div>
            <h4 className="font-semibold">Browse & Search</h4>
            <p className="text-sm text-muted">Discover restaurants across Bengaluru's neighborhoods</p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
              2
            </div>
            <h4 className="font-semibold">Book or Join Drops</h4>
            <p className="text-sm text-muted">Reserve available slots or join exclusive drops for popular spots</p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
              3
            </div>
            <h4 className="font-semibold">Secure Your Table</h4>
            <p className="text-sm text-muted">Get confirmation and hold protection for your reservation</p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-lg">
              4
            </div>
            <h4 className="font-semibold">Dine & Enjoy</h4>
            <p className="text-sm text-muted">Show up and enjoy your guaranteed table</p>
          </div>
        </div>
      </div>

      {/* Search and Filters - Only show if logged in */}
      {isLoggedIn && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-brand">Discover Bengaluru</h2>
            <p className="text-muted">Find and book the city's best restaurants</p>
          </div>

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
                <option value="Brigade Road">Brigade Road</option>
                <option value="Church Street">Church Street</option>
              </select>
              <select
                className="input flex-1"
                value={cuisineFilter}
                onChange={(e) => setCuisineFilter(e.target.value)}
              >
                <option value="">All Cuisines</option>
                <option value="Indian">Indian</option>
                <option value="South Indian">South Indian</option>
                <option value="North Indian">North Indian</option>
                <option value="Chinese">Chinese</option>
                <option value="Continental">Continental</option>
                <option value="Italian">Italian</option>
                <option value="Japanese">Japanese</option>
                <option value="Thai">Thai</option>
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
        </>
      )}

      {/* Call to Action for Non-Logged In Users */}
      {!isLoggedIn && (
        <div className="card text-center space-y-6 p-8 bg-gradient-to-r from-brand to-purple-600 text-white">
          <h2 className="text-2xl font-bold">Ready to Transform Your Dining Experience?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Join thousands of Bengaluru diners who've discovered the stress-free way to secure reservations at the city's best restaurants.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleLogin}
              className="btn bg-white text-brand hover:bg-gray-50 text-lg px-8 py-3 font-semibold"
            >
              Sign In
            </button>
            <Link
              to="/signup"
              className="btn border-2 border-white text-white hover:bg-white hover:text-brand text-lg px-8 py-3 font-semibold transition-colors"
            >
              Create Account
            </Link>
          </div>
          <div className="text-center mt-4">
            <Link
              to="/restaurant/login"
              className="text-white text-sm hover:underline opacity-90"
            >
              Restaurant Owner? Sign in here →
            </Link>
          </div>
        </div>
      )}

      {/* Features for Logged In Users */}
      {isLoggedIn && (
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/drops" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold group-hover:text-brand transition-colors">Restaurant Drops</h3>
                <p className="text-muted text-sm">Exclusive access to coveted reservations</p>
              </div>
            </div>
          </Link>

          <Link to="/me" className="card p-6 hover:shadow-lg transition-shadow group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold group-hover:text-brand transition-colors">My Reservations</h3>
                <p className="text-muted text-sm">View and manage your bookings</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
