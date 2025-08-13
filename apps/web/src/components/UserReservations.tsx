
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface Reservation {
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

interface UserReservationsProps {
  user: {
    name: string
    username: string
    email: string
  } | null
  userReservations: Reservation[]
  loadingReservations: boolean
  onReservationsUpdate: () => void
}

export default function UserReservations({ 
  user, 
  userReservations, 
  loadingReservations, 
  onReservationsUpdate 
}: UserReservationsProps) {
  const navigate = useNavigate()
  const [cancellingReservation, setCancellingReservation] = useState<string | null>(null)

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    let hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12
    hour = hour ? hour : 12
    return `${hour}:${minutes} ${ampm}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'SEATED':
        return 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
      default:
        return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return
    }

    setCancellingReservation(reservationId)
    const token = localStorage.getItem('hogu_token')
    
    try {
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Refresh the reservations list
        onReservationsUpdate()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to cancel reservation')
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
      alert('Failed to cancel reservation')
    } finally {
      setCancellingReservation(null)
    }
  }

  if (!user || userReservations.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Reservations</h2>
        <Link 
          to="/me" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {loadingReservations ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {userReservations.slice(0, 3).map((reservation) => (
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
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span>{formatDate(reservation.slot.date)}</span>
                <span>{formatTime(reservation.slot.time)}</span>
                <span>{reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}</span>
              </div>

              {reservation.status === 'PENDING' && (
                <div className="mt-3">
                  <button
                    onClick={() => handleCancelReservation(reservation.id)}
                    disabled={cancellingReservation === reservation.id}
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {cancellingReservation === reservation.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              )}

              {reservation.status === 'HELD' && (
                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/r/${reservation.restaurant.slug}/hold/${reservation.id}`)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Complete Booking
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
