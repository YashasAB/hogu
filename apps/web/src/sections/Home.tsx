import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

type Restaurant = { id: string; name: string; slug: string; neighborhood?: string | null }

export default function Home(){
  const [q, setQ] = useState('')
  const [data, setData] = useState<Restaurant[]>([])

  useEffect(() => {
    fetch(`/api/restaurants?q=${encodeURIComponent(q)}`)
      .then(r => r.json()).then(setData)
  }, [q])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input className="input" placeholder="Search Bengaluru (e.g., Naru, Soka)"
          value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(r => (
          <Link to={`/r/${r.slug}`} key={r.id} className="card hover:shadow-lg transition">
            <div className="text-lg font-semibold">{r.name}</div>
            <div className="text-muted text-sm">{r.neighborhood || 'Bengaluru'}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
