
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Login failed')
        return
      }

      localStorage.setItem('hogu_token', data.token)
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-brand">Welcome back</h1>
        <p className="text-muted">Sign in to your Hogu account</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <div className="text-center">
        <p className="text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>

      <div className="card bg-gray-50">
        <h3 className="font-medium mb-2">Demo Account</h3>
        <p className="text-sm text-muted mb-3">
          Use these credentials to test the application:
        </p>
        <div className="text-sm font-mono bg-white p-3 rounded-xl border">
          <div>Email: demo@hogu.com</div>
          <div>Password: demo123</div>
        </div>
      </div>
    </div>
  )
}
