
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dob: '',
    gender: '',
    interestedIn: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.interestedIn.length === 0) {
      setError('Please select who you\'re interested in meeting');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          tz: 'Asia/Kolkata' // Default to India timezone
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('dating_access_token', data.accessToken);
        localStorage.setItem('dating_refresh_token', data.refreshToken);
        router.push('/dating/app/profile');
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInterestedInChange = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(gender)
        ? prev.interestedIn.filter(g => g !== gender)
        : [...prev.interestedIn, gender]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Hogu Dating</h1>
          <p className="text-gray-600">Create your account to start meeting amazing people</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              id="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I identify as
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Select gender</option>
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="NON_BINARY">Non-binary</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I'm interested in meeting (select all that apply)
            </label>
            <div className="space-y-2">
              {['MALE', 'FEMALE', 'NON_BINARY'].map(gender => (
                <label key={gender} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.interestedIn.includes(gender)}
                    onChange={() => handleInterestedInChange(gender)}
                    className="mr-2 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm">{gender.replace('_', ' ').toLowerCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/dating/login" className="text-red-500 hover:text-red-600 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
