
import React from 'react';
import { Link } from 'react-router-dom';

export default function Signup() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-4">
          Join Hogu Dating
        </h1>
        <p className="text-gray-600">
          Create your account to start meeting great people in Bengaluru.
        </p>
      </div>

      <form className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Create a password"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
            Age
          </label>
          <input
            type="number"
            id="age"
            min="18"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Your age"
          />
        </div>

        <div>
          <label htmlFor="neighborhood" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Neighborhood
          </label>
          <select
            id="neighborhood"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Select a neighborhood</option>
            <option value="indiranagar">Indiranagar</option>
            <option value="koramangala">Koramangala</option>
            <option value="hsr">HSR Layout</option>
            <option value="whitefield">Whitefield</option>
            <option value="central">Central Bengaluru</option>
            <option value="kalyan-nagar">Kalyan Nagar</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200"
        >
          Create Account
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/dating/login" className="text-black hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link to="/dating" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Dating
        </Link>
      </div>
    </main>
  );
}
