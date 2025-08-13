
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Define types for better type safety
type Slot = { slot_id: string; time: string; party_size: number };
type SlotSummary = {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    neighborhood?: string | null;
    hero_image_url?: string | null;
    emoji?: string | null;
  };
  slots: Slot[];
};
type TonightRes = { now: SlotSummary[]; later: SlotSummary[] };

interface TonightNearYouProps {
  city: string;
}

export default function TonightNearYou({ city }: TonightNearYouProps) {
  const navigate = useNavigate();
  const [tonightRestaurants, setTonightRestaurants] = useState<SlotSummary[]>([]);
  const [tonightLoading, setTonightLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableRestaurants = async () => {
      setTonightLoading(true);
      try {
        console.log('Fetching tonight restaurants from /api/discover/tonight');
        const response = await fetch('/api/discover/tonight?party_size=2');
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Tonight API response:', data);
          
          // The /api/discover/tonight returns { now: [], later: [] }
          // Combine both now and later arrays
          const allRestaurants = [...(data.now || []), ...(data.later || [])];
          console.log('Combined restaurants:', allRestaurants);
          
          setTonightRestaurants(allRestaurants);
        } else {
          console.error("Failed to fetch available restaurants, status:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setTonightRestaurants([]);
        }
      } catch (error) {
        console.error("Error fetching available restaurants:", error);
        setTonightRestaurants([]);
      } finally {
        setTonightLoading(false);
      }
    };

    fetchAvailableRestaurants();
  }, [city]);

  return (
    <section id="tonight" className="space-y-3">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Tonight Near You
      </h2>
      <div className="text-muted text-sm">
        Grab something within the next 4 hours — perfect for spontaneous plans.
      </div>

      {tonightLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tonightRestaurants.length > 0 ? (
        <div className="space-y-3">
          {tonightRestaurants.map((restaurant) => (
            <div
              key={restaurant.restaurant.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => navigate(`/r/${restaurant.restaurant.slug}`)}
            >
              <div className="w-full h-32 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-3 p-4 flex flex-col justify-between border border-white/10 hover:border-brand/30 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{restaurant.restaurant.emoji || '🍽️'}</span>
                  <div className="text-lg font-bold text-white truncate">
                    {restaurant.restaurant.name}
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  {restaurant.restaurant.neighborhood || 'Bengaluru'}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {restaurant.slots.slice(0, 3).map((slot, index) => (
                    <span
                      key={slot.slot_id || index}
                      className="px-2 py-1 bg-white/10 rounded text-xs text-white"
                    >
                      {slot.time}
                    </span>
                  ))}
                  {restaurant.slots.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                      +{restaurant.slots.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🕐</span>
          </div>
          <p className="text-gray-500">No availability tonight</p>
          <p className="text-gray-400 text-sm">
            Check back later or explore week planning above
          </p>
        </div>
      )}
    </section>
  );
}
