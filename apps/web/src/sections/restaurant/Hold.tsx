
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Reservation = {
  id: string
  status: string
  partySize: number
  holdExpiresAt?: string
  restaurant: {
    name: string
    slug: string
  }
  slot: {
    date: string
    time: string
  }
}

export default function Hold() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const navigate = useNavigate()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) return
      try {
        const response = await fetch(`/api/reservations/${reservationId}`)
        if (response.ok) {
          const data = await response.json()
          setReservation(data)
        }
      } catch (error) {
        console.error('Failed to fetch reservation:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReservation()
  }, [reservationId])

  useEffect(() => {
    if (!reservation?.holdExpiresAt) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expires = new Date(reservation.holdExpiresAt!).getTime()
      const diff = expires - now

      if (diff <= 0) {
        setTimeLeft(0)
        navigate(`/r/${reservation.restaurant.slug}`)
      } else {
        setTimeLeft(Math.ceil(diff / 1000))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [reservation, navigate])

  const handleConfirm = async () => {
    if (!reservationId) return
    setConfirming(true)

    try {
      const response = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Confirmation failed')
        return
      }

      // Success - show confirmation page
      alert('Reservation confirmed! Check your email for details.')
      navigate('/me')
    } catch (error) {
      console.error('Failed to confirm reservation:', error)
      alert('Failed to confirm reservation')
    } finally {
      setConfirming(false)
    }
  }

  const handleCancel = async () => {
    if (!reservationId || !confirm('Are you sure you want to cancel this hold?')) return

    try {
      const response = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        navigate(`/r/${reservation?.restaurant.slug}`)
      }
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold mb-2">Reservation not found</h1>
        <p className="text-muted">This reservation may have expired or been cancelled.</p>
      </div>
    )
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      <div className="card text-center">
        <div className="text-accent text-4xl font-bold mb-2">
          {formatCountdown(timeLeft)}
        </div>
        <p className="text-muted">Time remaining to confirm your reservation</p>
      </div>

      {/* Reservation Details */}
      <div className="card space-y-4">
        <h1 className="text-2xl font-semibold">Hold Confirmation</h1>
        
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium">Restaurant</span>
            <span>{reservation.restaurant.name}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium">Date</span>
            <span>{formatDate(reservation.slot.date)}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium">Time</span>
            <span>{formatTime(reservation.slot.time)}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-100">
            <span className="font-medium">Party Size</span>
            <span>{reservation.partySize} {reservation.partySize === 1 ? 'person' : 'people'}</span>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Payment Information</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">
            No deposit required for this reservation. You'll pay at the restaurant.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleConfirm}
          disabled={confirming || timeLeft <= 0}
          className="btn btn-primary w-full py-4 text-lg"
        >
          {confirming ? 'Confirming...' : 'Confirm Reservation'}
        </button>
        
        <button
          onClick={handleCancel}
          className="btn btn-secondary w-full py-3"
        >
          Cancel Hold
        </button>
      </div>

      {/* Terms */}
      <div className="card">
        <h3 className="font-medium mb-2">Reservation Terms</h3>
        <ul className="text-sm text-muted space-y-1">
          <li>• Please arrive within 15 minutes of your reservation time</li>
          <li>• Cancellations must be made at least 2 hours in advance</li>
          <li>• No-show fees may apply for missed reservations</li>
          <li>• Contact the restaurant directly for special requests</li>
        </ul>
      </div>
    </div>
  )
}
