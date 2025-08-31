
import Link from 'next/link';

export default function DatingLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find Your Perfect Match with <span className="text-red-500">Hogu Dating</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Quality connections in Bengaluru. Curated matches, meaningful conversations, 
            and carefully planned first dates at the city's best venues.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/dating/signup"
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/dating/login"
              className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-semibold text-lg mb-2">Curated Matches</h3>
              <p className="text-gray-600">Quality over quantity. Every match is personally reviewed for compatibility.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🍽️</div>
              <h3 className="font-semibold text-lg mb-2">Perfect Venues</h3>
              <p className="text-gray-600">We handle the planning. From cozy cafes to fine dining experiences.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">💝</div>
              <h3 className="font-semibold text-lg mb-2">Meaningful Connections</h3>
              <p className="text-gray-600">Beyond swipes. Build real relationships with like-minded people.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-6 text-left">
              <div>
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center text-red-600 font-bold mb-3">1</div>
                <h4 className="font-semibold mb-2">Complete Your Profile</h4>
                <p className="text-sm text-gray-600">Tell us about yourself, your interests, and what you're looking for.</p>
              </div>
              <div>
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center text-red-600 font-bold mb-3">2</div>
                <h4 className="font-semibold mb-2">Get Matched</h4>
                <p className="text-sm text-gray-600">Our team finds compatible people based on your preferences.</p>
              </div>
              <div>
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center text-red-600 font-bold mb-3">3</div>
                <h4 className="font-semibold mb-2">Schedule Your Date</h4>
                <p className="text-sm text-gray-600">Share your availability and we'll coordinate the perfect meetup.</p>
              </div>
              <div>
                <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center text-red-600 font-bold mb-3">4</div>
                <h4 className="font-semibold mb-2">Enjoy Your Date</h4>
                <p className="text-sm text-gray-600">Meet at a beautiful venue we've selected just for you two.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
