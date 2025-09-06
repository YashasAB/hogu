
import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold mb-4">
          Log in to Hogu Dating
        </h1>
        <p className="text-gray-600">
          Welcome back! Enter your credentials to continue.
        </p>
      </div>

      <form className="space-y-6">
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
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-200"
        >
          Log in
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/dating/signup" className="text-black hover:underline">
            Sign up
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
