
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PhotoCarousel from '../components/media/PhotoCarousel'
import InstagramLink from '../components/InstagramLink'
import AvailabilityGrid from '../components/AvailabilityGrid'

type Restaurant = {
  id: string
  name: string
  slug: string
  neighborhood?: string | null
  instagramUrl?: string | null
  heroImageUrl?: string | null
  website?: string | null
  cuisineTags?: string[]
}

type Photo = {
  id: string
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [partySize, setPartySize] = useState(2)

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const [restaurantResponse, photosResponse] = await Promise.all([
          fetch(`/api/restaurants/${slug}`),
          fetch(`/api/restaurants/${slug}/photos`)
        ])

        if (restaurantResponse.ok) {
          const restaurantData = await restaurantResponse.json()
          setRestaurant(restaurantData)
          
          if (photosResponse.ok) {
            const photosData = await photosResponse.json()
            setPhotos(photosData)
          }
        }
      } catch (error) {
        console.error('Failed to fetch restaurant:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurant()
  }, [slug])

  const handleSlotSelect = async (slotId: string) => {
    const token = localStorage.getItem('hogu_token')
    if (!token) {
      navigate('/login')
      return
    }

    try {
      const response = await fetch('/api/reservations/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant!.id,
          slotId,
          partySize,
          userId: 'demo-user' // In real app, decode from JWT
        })
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Hold failed')
        return
      }

      navigate(`/r/${restaurant!.slug}/hold/${data.reservationId}`)
    } catch (error) {
      console.error('Failed to hold reservation:', error)
      alert('Failed to hold reservation')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="aspect-[3/2] bg-gray-200 rounded-2xl animate-pulse" />
        <div className="space-y-3">
          <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Restaurant not found</h1>
        <p className="text-muted">The restaurant you're looking for doesn't exist.</p>
      </div>
    )
  }

  // Combine hero image with photos for carousel
  const allPhotos = [
    ...(restaurant.heroImageUrl ? [{
      id: 'hero',
      url: restaurant.heroImageUrl,
      alt: `${restaurant.name} hero image`
    }] : []),
    ...photos
  ]

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative">
        {allPhotos.length > 0 ? (
          <PhotoCarousel photos={allPhotos} />
        ) : (
          <div className="aspect-[3/2] bg-gray-200 rounded-2xl flex items-center justify-center">
            <span className="text-muted">No photos available</span>
          </div>
        )}
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 hero-overlay rounded-b-2xl p-6 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">{restaurant.name}</h1>
              <p className="text-lg opacity-90">{restaurant.neighborhood || 'Bengaluru'}</p>
            </div>
            <div className="flex gap-2">
              <InstagramLink url={restaurant.instagramUrl} />
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pill bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cuisine Tags */}
      {restaurant.cuisineTags && restaurant.cuisineTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {restaurant.cuisineTags.map((tag) => (
            <span key={tag} className="pill bg-gray-100 text-gray-700">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Booking Section */}
      <div className="card space-y-6">
        <h2 className="text-xl font-semibold">Make a Reservation</h2>
        
        {/* Date and Party Size Selectors */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Party Size</label>
            <select
              className="input"
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'person' : 'people'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability Grid */}
        <AvailabilityGrid
          restaurantId={restaurant.id}
          date={date}
          partySize={partySize}
          onSlotSelect={handleSlotSelect}
        />
      </div>

      {/* Restaurant Info */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">About</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Location</span>
            <span className="text-muted">{restaurant.neighborhood || 'Bengaluru'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Cuisine</span>
            <span className="text-muted">
              {restaurant.cuisineTags?.join(', ') || 'Multiple'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
