
import { useState, useEffect } from 'react'

type Slot = {
  slotId: string
  time: string
  status: 'AVAILABLE' | 'CUTOFF' | 'FULL'
}

type AvailabilityGridProps = {
  restaurantId: string
  date: string
  partySize: number
  onSlotSelect: (slotId: string) => void
}

export default function AvailabilityGrid({ restaurantId, date, partySize, onSlotSelect }: AvailabilityGridProps) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/availability?date=${date}&partySize=${partySize}`)
        if (response.ok) {
          const data = await response.json()
          setSlots(data)
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
      } finally {
        setLoading(false)
      }
    }

    if (restaurantId && date && partySize) {
      fetchSlots()
    }
  }, [restaurantId, date, partySize])

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Available Times</h3>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="space-y-4">
        <h3 className="font-medium">Available Times</h3>
        <p className="text-muted">No availability for this date and party size.</p>
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

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Available Times</h3>
      <div className="grid grid-cols-3 gap-2">
        {slots.map((slot) => (
          <button
            key={slot.slotId}
            onClick={() => slot.status === 'AVAILABLE' ? onSlotSelect(slot.slotId) : undefined}
            className={`pill text-center py-3 transition-all ${
              slot.status === 'AVAILABLE' 
                ? 'pill-available' 
                : slot.status === 'FULL' 
                ? 'pill-full' 
                : 'pill-cutoff'
            }`}
            disabled={slot.status !== 'AVAILABLE'}
          >
            {formatTime(slot.time)}
          </button>
        ))}
      </div>
      {slots.some(s => s.status === 'CUTOFF') && (
        <p className="text-sm text-muted">
          Some times are past the booking cutoff window
        </p>
      )}
    </div>
  )
}
