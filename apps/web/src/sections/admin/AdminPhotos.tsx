import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

type Photo = { id: string; url: string; alt?: string | null; sortOrder: number }

export default function AdminPhotos(){
  const { restaurantId } = useParams()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [directUrl, setDirectUrl] = useState('')

  const load = async () => {
    const r = await fetch(`/api/restaurants/${restaurantId}/photos`)
    setPhotos(await r.json())
  }
  useEffect(() => { load() }, [restaurantId])

  const addViaUrl = async () => {
    if(!directUrl) return
    const r = await fetch(`/api/restaurants/${restaurantId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: directUrl, alt, sort_order: sortOrder })
    })
    if(r.ok){ setDirectUrl(''); setAlt(''); setSortOrder(0); load() }
  }

  const uploadToS3 = async () => {
    if(!file) return
    const pres = await fetch(`/api/restaurants/${restaurantId}/photos/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg' })
    })
    const p = await pres.json()
    if(!pres.ok){ alert(p.error || 'Presign failed'); return; }
    const form = new FormData()
    Object.entries(p.fields).forEach(([k,v]) => form.append(k, v as string))
    form.append('Content-Type', file.type || 'image/jpeg')
    form.append('file', file)
    const upload = await fetch(p.url, { method: 'POST', body: form })
    if(upload.ok){
      await fetch(`/api/restaurants/${restaurantId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: p.publicUrl, alt, sort_order: sortOrder })
      })
      setFile(null); setAlt(''); setSortOrder(0); load()
    } else {
      alert('S3 upload failed')
    }
  }

  const saveAlt = async (id: string, newAlt: string, newOrder: number) => {
    await fetch(`/api/restaurants/${restaurantId}/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: newAlt, sort_order: newOrder })
    })
    load()
  }

  const del = async (id: string) => {
    await fetch(`/api/restaurants/${restaurantId}/photos/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Photos</h1>
      <div className="card space-y-2">
        <h2 className="font-medium">Add via URL (dev)</h2>
        <input className="input" placeholder="Image URL" value={directUrl} onChange={e=>setDirectUrl(e.target.value)} />
        <div className="flex gap-2">
          <input className="input" placeholder="Alt text" value={alt} onChange={e=>setAlt(e.target.value)} />
          <input className="input w-24" type="number" value={sortOrder} onChange={e=>setSortOrder(parseInt(e.target.value||'0'))} />
          <button className="btn btn-primary" onClick={addViaUrl}>Add</button>
        </div>
      </div>

      <div className="card space-y-2">
        <h2 className="font-medium">Upload to S3 (prod)</h2>
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <div className="flex gap-2">
          <input className="input" placeholder="Alt text" value={alt} onChange={e=>setAlt(e.target.value)} />
          <input className="input w-24" type="number" value={sortOrder} onChange={e=>setSortOrder(parseInt(e.target.value||'0'))} />
          <button className="btn btn-primary" onClick={uploadToS3}>Upload</button>
        </div>
        <p className="text-muted text-sm">Configure S3 in <code>apps/api/.env</code> for presign to work.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {photos.map(p => (
          <div key={p.id} className="card space-y-2">
            <img src={p.url} className="w-full h-40 object-cover rounded-2xl" />
            <input className="input" defaultValue={p.alt || ''} onBlur={e=>saveAlt(p.id, e.target.value, p.sortOrder)} />
            <div className="flex items-center gap-2">
              <input className="input w-24" type="number" defaultValue={p.sortOrder} onBlur={e=>saveAlt(p.id, p.alt || '', parseInt(e.target.value||'0'))} />
              <button className="btn" onClick={()=>del(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
