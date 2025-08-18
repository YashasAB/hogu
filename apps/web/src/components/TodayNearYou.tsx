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
type TodayRes = { now: SlotSummary[]; later: SlotSummary[] };

interface TodayNearYouProps {
  city: string;
}

export default function TodayNearYou({ city }: TodayNearYouProps) {
  const navigate = useNavigate();
  const [todayRestaurants, setTodayRestaurants] = useState<SlotSummary[]>(
    [],
  );
  const [todayLoading, setTodayLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableRestaurants = async () => {
      setTodayLoading(true);
      try {
        console.log("Fetching available restaurants from /api/discover/available-today");
        const response = await fetch("/api/discover/available-today");
        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Available restaurants API response:", data);
          setTodayRestaurants(data.restaurants || []);
        } else {
          console.error("Failed to fetch available restaurants, status:", response.status);
          setTodayRestaurants([]);
        }
      } catch (error) {
        console.error("Error fetching available restaurants:", error);
        setTodayRestaurants([]);
      } finally {
        setTodayLoading(false);
      }
    };

    fetchAvailableRestaurants();
  }, [city]);

  const handleRestaurantClick = (restaurantSlug: string) => {
    navigate(`/r/${restaurantSlug}`);
  };

  return (
    <section id="today" className="space-y-3">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Today Near You
      </h2>
      <div className="text-muted text-sm">
        Grab something within the next 24 hours — perfect for spontaneous plans.
      </div>

      {todayLoading ? (
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2" style={{ width: "max-content" }}>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-[calc(26.67%-8px)] min-w-[112px] flex-shrink-0 border border-gray-200 rounded-xl p-3 animate-pulse"
              >
                <div className="h-24 bg-gray-200 rounded-lg mb-2" />
                <div className="h-3 bg-gray-200 rounded mb-1" />
                <div className="h-2 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ) : todayRestaurants.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2" style={{ width: "max-content" }}>
            {todayRestaurants.map((restaurant) => (
              <div
                key={restaurant.restaurant.id}
                className="w-[calc(26.67%-8px)] min-w-[112px] flex-shrink-0 border border-gray-200 rounded-xl p-3 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => handleRestaurantClick(restaurant.restaurant.slug)}
              >
                <div className="w-full h-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg mb-2 p-3 flex flex-col justify-between border border-white/10 hover:border-brand/30 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {restaurant.restaurant.emoji || "🍽️"}
                    </span>
                    <div className="text-sm font-bold text-white truncate">
                      {restaurant.restaurant.name}
                    </div>
                  </div>
                  <div className="text-xs text-slate-300">
                    {restaurant.restaurant.neighborhood || "Bengaluru"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {restaurant.slots.slice(0, 2).map((slot, index) => (
                    <span
                      key={slot.slot_id || index}
                      className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700"
                    >
                      {slot.time}
                    </span>
                  ))}
                  {restaurant.slots.length > 2 && (
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-700">
                      +{restaurant.slots.length - 2}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🕐</span>
          </div>
          <p className="text-gray-500">No availability today</p>
          <p className="text-gray-400 text-sm">
            Check back later or explore week planning above
          </p>
        </div>
      )}
    </section>
  );
}