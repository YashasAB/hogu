import { useState } from 'react'
import { useParams } from 'react-router-dom'

export default function AdminProfile(){
  const { restaurantId } = useParams()
  const [name, setName] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [instagram, setInstagram] = useState('')
  const [hero, setHero] = useState('')

  const save = async () => {
    const r = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, neighborhood, instagram_url: instagram, hero_image_url: hero })
    })
    const d = await r.json()
    alert(r.ok ? 'Saved' : (d.error || 'Error'))
  }

  return (
    <div className="max-w-xl space-y-3">
      <h1 className="text-2xl font-semibold">Restaurant Profile</h1>
      <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="input" placeholder="Neighborhood" value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} />
      <input className="input" placeholder="Instagram URL" value={instagram} onChange={e=>setInstagram(e.target.value)} />
      <input className="input" placeholder="Hero image URL" value={hero} onChange={e=>setHero(e.target.value)} />
      <button className="btn btn-primary" onClick={save}>Save</button>
      <p className="text-muted text-sm">Demo-only page (no auth). In prod, gate via RBAC.</p>
    </div>
  )
}
