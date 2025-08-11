import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Signup(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    })
    const data = await r.json()
    if(!r.ok) return setError(data.error || 'Signup failed')
    localStorage.setItem('hogu_token', data.token)
    nav('/')
  }

  return (
    <div className="max-w-sm mx-auto card">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      <form className="space-y-3" onSubmit={submit}>
        <input className="input" placeholder="Full name" value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn btn-primary w-full">Create account</button>
      </form>
    </div>
  )
}
