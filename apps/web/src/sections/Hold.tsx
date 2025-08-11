import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function Hold(){
  const { reservationId } = useParams()
  const nav = useNavigate()
  const [expires, setExpires] = useState<string | null>(null)

  useEffect(() => {
    // In a fuller build, fetch reservation details; for demo, show a static timer
    setExpires(new Date(Date.now() + 4*60*1000).toISOString())
  }, [reservationId])

  const confirm = async () => {
    const r = await fetch(`/api/reservations/${reservationId}/confirm`, { method: 'POST' })
    if(!r.ok){ const d = await r.json(); alert(d.error || 'Confirm failed'); return; }
    nav('/me')
  }

  return (
    <div className="max-w-md mx-auto card space-y-4">
      <h1 className="text-xl font-semibold">Hold your table</h1>
      <p className="text-muted text-sm">Complete your booking before the hold expires.</p>
      <button className="btn btn-accent w-full" onClick={confirm}>Confirm reservation</button>
    </div>
  )
}
