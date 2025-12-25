import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Reservation = {
  id: string
  status: string
  partySize: number
  restaurant: {
    name: string
    slug: string
  }
  slot: {
    date: string
    time: string
  }
}

export default function Profile() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('hogu_token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          setReservations(data)
        }
      } catch (error) {
        console.error('Failed to fetch reservations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('hogu_token')
    navigate('/')
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'pill bg-orange-100 text-orange-800'
      case 'CONFIRMED':
        return 'pill bg-green-100 text-green-800'
      case 'HELD':
        return 'pill bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'pill bg-red-100 text-red-800'
      case 'SEATED':
        return 'pill bg-blue-100 text-blue-800'
      case 'NO_SHOW':
        return 'pill bg-gray-100 text-gray-800'
      default:
        return 'pill bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
        >
          Sign Out
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/drops')}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <h3 className="font-medium mb-1">Drops</h3>
          <p className="text-muted text-sm">Join reservation drops</p>
        </button>
        <button
          onClick={() => navigate('/waitlist')}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <h3 className="font-medium mb-1">Waitlist</h3>
          <p className="text-muted text-sm">Manage your waitlist</p>
        </button>
        <button
          onClick={() => navigate('/')}
          className="card text-left hover:shadow-lg transition-shadow"
        >
          <h3 className="font-medium mb-1">Discover</h3>
          <p className="text-muted text-sm">Find new restaurants</p>
        </button>
      </div>

      {/* Reservations */}
      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">My Reservations</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted mb-4">No reservations yet</p>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
            >
              Make Your First Reservation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{reservation.restaurant.name}</h3>
                  <span className={getStatusColor(reservation.status)}>
                    {reservation.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted">
                  <span>{formatDate(reservation.slot.date)}</span>
                  <span>{formatTime(reservation.slot.time)}</span>
                  <span>{reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}</span>
                </div>
                {reservation.status === 'HELD' && (
                  <div className="mt-3">
                    <button
                      onClick={() => navigate(`/r/${reservation.restaurant.slug}/hold/${reservation.id}`)}
                      className="btn btn-primary btn-sm"
                    >
                      Complete Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}