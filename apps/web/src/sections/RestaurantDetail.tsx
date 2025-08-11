
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

type Restaurant = {
  id: string
  name: string
  slug: string
  emoji: string
  position: { lat: number; lng: number }
  image: string
  neighborhood: string
  category: string
  hot?: boolean
  instagramUrl?: string | null
  heroImageUrl?: string | null
  website?: string | null
  cuisineTags?: string[]
}

type TimeSlot = {
  id: string
  time: string
  available: boolean
}

// Local restaurant data (matching ExploreRestaurants)
const restaurants: Restaurant[] = [
  {
    id: "1",
    name: "ZLB 23 (at The Leela Palace)",
    slug: "zlb",
    emoji: "🍸",
    position: { lat: 12.960695, lng: 77.648663 },
    image: "/api/placeholder/400/300",
    neighborhood: "UB City",
    category: "cocktails",
    hot: true,
    instagramUrl: "https://instagram.com/zlb23",
    website: "https://theleela.com",
    cuisineTags: ["Cocktails", "Fine Dining", "Rooftop"]
  },
  {
    id: "2",
    name: "Soka",
    slug: "soka",
    emoji: "🍸",
    position: { lat: 12.965215, lng: 77.638143 },
    image: "/api/placeholder/400/300",
    neighborhood: "Koramangala",
    category: "cocktails",
    hot: false,
    instagramUrl: "https://instagram.com/soka",
    cuisineTags: ["Cocktails", "Asian Fusion"]
  },
  {
    id: "3",
    name: "Bar Spirit Forward",
    slug: "spirit-forward",
    emoji: "🥃",
    position: { lat: 12.975125, lng: 77.60287 },
    image: "/api/placeholder/400/300",
    neighborhood: "UB City",
    category: "cocktails",
    hot: true,
    instagramUrl: "https://instagram.com/spiritforward",
    cuisineTags: ["Cocktails", "Whiskey", "Bar"]
  },
  {
    id: "4",
    name: "Naru Noodle Bar",
    slug: "naru",
    emoji: "🍱",
    position: { lat: 12.958431, lng: 77.592895 },
    image: "/api/placeholder/400/300",
    neighborhood: "UB City",
    category: "dinner",
    hot: false,
    instagramUrl: "https://instagram.com/naru",
    cuisineTags: ["Japanese", "Noodles", "Asian"]
  },
  {
    id: "8",
    name: "Pizza 4P's (Indiranagar)",
    slug: "pizza-4ps",
    emoji: "🍕",
    position: { lat: 12.969968, lng: 77.636089 },
    image: "/api/placeholder/400/300",
    neighborhood: "Indiranagar",
    category: "pizza",
    hot: false,
    instagramUrl: "https://instagram.com/pizza4ps",
    cuisineTags: ["Pizza", "Italian", "Cheese"]
  },
  {
    id: "9",
    name: "Dali & Gala",
    slug: "dali-and-gala",
    emoji: "🍸",
    position: { lat: 12.975125, lng: 77.60287 },
    image: "/api/placeholder/400/300",
    neighborhood: "UB City",
    category: "cocktails",
    hot: false,
    instagramUrl: "https://instagram.com/daligala",
    cuisineTags: ["Cocktails", "Art", "Modern"]
  },
]

// Generate demo time slots
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const times = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM']
  
  times.forEach((time, index) => {
    slots.push({
      id: `slot-${index}`,
      time,
      available: Math.random() > 0.3 // 70% chance of being available
    })
  })
  
  return slots
}

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [partySize, setPartySize] = useState(2)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    
    setLoading(true)
    // Find restaurant from local data
    const foundRestaurant = restaurants.find(r => r.slug === slug)
    if (foundRestaurant) {
      setRestaurant(foundRestaurant)
    }
    setLoading(false)
  }, [slug])

  useEffect(() => {
    // Generate new time slots when date or party size changes
    setTimeSlots(generateTimeSlots())
    setSelectedSlot(null)
  }, [date, partySize])

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId)
  }

  const handleReserveNow = () => {
    if (!selectedSlot) {
      alert('Please select a time slot')
      return
    }

    // For demo purposes, just show an alert
    const slot = timeSlots.find(s => s.id === selectedSlot)
    alert(`Reservation request for ${restaurant?.name} on ${date} at ${slot?.time} for ${partySize} ${partySize === 1 ? 'person' : 'people'}`)
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
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-2">Restaurant not found</h1>
          <p className="text-muted">The restaurant you're looking for doesn't exist.</p>
          <Link to="/explore-tonight" className="btn btn-primary mt-4">
            ← Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-2">
        <Link to="/explore-tonight" className="btn btn-secondary">
          ← Back to Map
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="aspect-[3/2] bg-gray-200 rounded-2xl overflow-hidden">
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl p-6 text-white">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{restaurant.emoji}</span>
                {restaurant.hot && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                    🔥 HOT
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mb-1">{restaurant.name}</h1>
              <p className="text-lg opacity-90">{restaurant.neighborhood}</p>
            </div>
            <div className="flex gap-2">
              {restaurant.instagramUrl && (
                <a
                  href={restaurant.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-lg font-medium text-sm"
                >
                  Instagram
                </a>
              )}
              {restaurant.website && (
                <a
                  href={restaurant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white bg-opacity-20 text-white hover:bg-opacity-30 rounded-lg font-medium text-sm"
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
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
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

        {/* Available Time Slots */}
        <div>
          <h3 className="text-lg font-medium mb-3">Available Times</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => slot.available && handleSlotSelect(slot.id)}
                disabled={!slot.available}
                className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                  selectedSlot === slot.id
                    ? 'bg-brand text-white border-brand'
                    : slot.available
                    ? 'bg-white text-gray-900 border-gray-200 hover:border-brand hover:bg-brand/5'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>

        {/* Reserve Button */}
        <button
          onClick={handleReserveNow}
          disabled={!selectedSlot}
          className={`btn w-full py-4 text-lg ${
            selectedSlot ? 'btn-primary' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedSlot ? 'Reserve Now' : 'Select a Time Slot'}
        </button>
      </div>

      {/* Restaurant Info */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">About</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Location</span>
            <span className="text-muted">{restaurant.neighborhood}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Cuisine</span>
            <span className="text-muted">
              {restaurant.cuisineTags?.join(', ') || restaurant.category}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="font-medium">Category</span>
            <span className="text-muted capitalize">{restaurant.category}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
