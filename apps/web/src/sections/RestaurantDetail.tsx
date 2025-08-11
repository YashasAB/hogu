import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Restaurant = { id: string; name: string; slug: string; neighborhood?: string | null; instagramUrl?: string | null; heroImageUrl?: string | null }
type Slot = { slotId: string; time: string; status: 'AVAILABLE' | 'CUTOFF' | 'FULL' }

type Photo = { id: string; url: string; alt?: string | null }

export default function RestaurantDetail(){
  const { slug } = useParams()
  const nav = useNavigate()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [party, setParty] = useState(2)
  const [slots, setSlots] = useState<Slot[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])

  useEffect(() => {
    fetch(`/api/restaurants/${slug}`).then(r => r.json()).then(setRestaurant)
  }, [slug])

  useEffect(() => {
    if(!restaurant) return
    fetch(`/api/restaurants/${restaurant.id}/availability?date=${date}&partySize=${party}`)
      .then(r=>r.json()).then(setSlots)
    fetch(`/api/restaurants/${restaurant.id}/photos`).then(r=>r.json()).then(setPhotos)
  }, [restaurant, date, party])

  const grouped = useMemo(() => {
    // naive grouping by hour
    const g: Record<string, Slot[]> = {}
    for(const s of slots){
      const h = s.time.slice(0,2)+":00"
      g[h] = g[h] || []
      g[h].push(s)
    }
    return g
  }, [slots])

  const hold = async (slotId: string) => {
    const token = localStorage.getItem('hogu_token')
    if(!token) return nav('/login')
    // NOTE: In real app, decode token -> userId; here we ask API to accept userId in body (demo only)
    const r = await fetch('/api/reservations/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId: restaurant!.id, slotId, partySize: party, userId: 'demo-user' })
    })
    const data = await r.json()
    if(!r.ok){ alert(data.error || 'Hold failed'); return; }
    nav(`/r/${restaurant!.slug}/hold/${data.reservationId}`)
  }

  if(!restaurant) return <div>Loading…</div>
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
        <div className="text-muted">{restaurant.neighborhood || 'Bengaluru'}</div>
      </div>

      <div className="flex gap-3">
        <input type="date" className="input max-w-xs" value={date} onChange={e=>setDate(e.target.value)} />
        <select className="input max-w-[120px]" value={party} onChange={e=>setParty(parseInt(e.target.value))}>
          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} {n===1?'person':'people'}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([hour, items]) => (
          <div key={hour}>
            <div className="text-sm text-muted mb-2">{hour}</div>
            <div className="flex flex-wrap gap-2">
              {items.map(s => (
                <button
                  key={s.slotId}
                  className={"slot " + (s.status==='AVAILABLE' ? 'border-ink' : 'opacity-40 cursor-not-allowed')}
                  onClick={() => s.status==='AVAILABLE' && hold(s.slotId)}
                  disabled={s.status!=='AVAILABLE'}
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
