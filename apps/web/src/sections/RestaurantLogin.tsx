
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RestaurantLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/restaurant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || 'Login failed')
        return
      }

      localStorage.setItem('hogu_restaurant_token', data.token)
      // Redirect to restaurant dashboard
      navigate(`/admin/${data.restaurantId}`)
    } catch (error) {
      console.error('Restaurant login error:', error)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-brand rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Portal</h1>
          <p className="text-gray-600">Access your Hogu restaurant dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Username
              </label>
              <input
                type="text"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="restaurant-slug"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
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
              className="btn btn-primary w-full py-3 text-lg font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="text-center pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Need help accessing your account?{' '}
              <a href="mailto:support@hogu.com" className="text-brand hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">Available Restaurant Accounts</h3>
          <p className="text-sm text-gray-600 mb-3">
            Use any of these restaurant usernames with password "restaurant123":
          </p>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-48 overflow-y-auto">
            <div className="text-xs text-gray-500 mb-2">Username (use as email) | Password</div>
            <div className="space-y-1 text-sm font-mono">
              <div className="text-gray-700">zlb-23-at-the-leela-palace | restaurant123</div>
              <div className="text-gray-700">soka | restaurant123</div>
              <div className="text-gray-700">bar-spirit-forward | restaurant123</div>
              <div className="text-gray-700">naru-noodle-bar | restaurant123</div>
              <div className="text-gray-700">pizza-4ps-indiranagar | restaurant123</div>
              <div className="text-gray-700">dali-and-gala | restaurant123</div>
              <div className="text-gray-700">the-permit-room | restaurant123</div>
              <div className="text-gray-700">toit-brewpub | restaurant123</div>
              <div className="text-gray-700">byg-brewski-brewing-company | restaurant123</div>
              <div className="text-gray-700">truffles | restaurant123</div>
              <div className="text-gray-700">glen-s-bakehouse | restaurant123</div>
              <div className="text-gray-700">koshy-s | restaurant123</div>
              <div className="text-gray-700">vidyarthi-bhavan | restaurant123</div>
            </div>
          </div>
        </div>

        {/* Back to Customer Site */}
        <div className="text-center">
          <a 
            href="/"
            className="text-brand hover:underline font-medium inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Customer Site
          </a>
        </div>
      </div>
    </div>
  )
}
