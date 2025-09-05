
import React from 'react';

export default function DatingHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-600 via-red-500 to-orange-500 px-6 py-20">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Perfect Date Night
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Discover romantic restaurants and create unforgettable dining experiences with someone special
          </p>
          <button className="bg-white text-pink-600 px-8 py-3 rounded-full font-semibold text-lg hover:bg-pink-50 transition-colors">
            Start Your Date Night Journey
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perfect for Date Nights
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">💕</div>
              <h3 className="text-xl font-semibold mb-3">Romantic Atmosphere</h3>
              <p className="text-slate-400">
                Curated restaurants with intimate lighting, cozy seating, and romantic ambiance
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">🍷</div>
              <h3 className="text-xl font-semibold mb-3">Special Menus</h3>
              <p className="text-slate-400">
                Discover tasting menus, wine pairings, and special date night offerings
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
              <p className="text-slate-400">
                Book tables for two with special requests for anniversaries and celebrations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Plan Your Date Night?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Browse romantic restaurants and make reservations for unforgettable evenings
          </p>
          <div className="space-x-4">
            <button className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
              Browse Restaurants
            </button>
            <button className="border border-pink-600 text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-600 hover:text-white transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
