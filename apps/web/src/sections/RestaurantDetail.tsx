
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

type Restaurant = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  position: { lat: number; lng: number };
  neighborhood: string;
  category: string;
  hot?: boolean;
  instagramUrl?: string | null;
  heroImageUrl?: string | null;
  website?: string | null;
  cuisineTags?: string[];
};

type TimeSlot = {
  id: string;
  time: string;
  available: boolean;
};

type AvailabilityData = {
  date: string;
  partySizes: number[];
};

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-amber-500 shadow-sm border border-white/10">
    {children}
  </span>
);

const Chip: React.FC<{ active?: boolean; children: React.ReactNode }> = ({
  active,
  children,
}) => (
  <span
    className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
      active
        ? "text-white bg-gradient-to-r from-rose-700 to-amber-600 border-transparent shadow"
        : "text-slate-200 bg-slate-800 border-slate-600 hover:border-rose-500/40"
    }`}
  >
    {children}
  </span>
);

const Row: React.FC<{
  label: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ label, last, children }) => (
  <div
    className={`flex items-center justify-between py-3 ${last ? "" : "border-b border-white/10"}`}
  >
    <span className="text-slate-300">{label}</span>
    <span className="text-slate-400">{children}</span>
  </div>
);

export default function RestaurantDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  // State for booking form
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const bookingRef = useRef<HTMLDivElement | null>(null);

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/restaurants/${slug}`);
        console.log("Restaurant API response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Restaurant data received from API:", data);
          console.log("Hero image URL in restaurant data:", data.heroImageUrl);
          setRestaurant(data);
        } else {
          console.error("Restaurant not found in API");
          setRestaurant(null);
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  // Fetch availability data for the next 30 days
  useEffect(() => {
    const fetchAvailabilityData = async () => {
      if (!restaurant) return;
      
      setAvailabilityLoading(true);
      try {
        const today = new Date();
        const availabilityPromises = [];
        
        // Check next 30 days
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          const dateStr = checkDate.toISOString().split("T")[0];
          
          // Check for each possible party size (2, 4, 6, 8)
          const partySizePromises = [2, 4, 6, 8].map(async (size) => {
            try {
              const response = await fetch(
                `/api/restaurants/${restaurant.slug}/availability?date=${dateStr}&partySize=${size}`
              );
              if (response.ok) {
                const slots = await response.json();
                const hasAvailable = slots.some((slot: TimeSlot) => slot.available);
                return hasAvailable ? size : null;
              }
              return null;
            } catch (error) {
              console.error(`Error checking availability for ${dateStr}, party size ${size}:`, error);
              return null;
            }
          });
          
          const availablePartySizes = (await Promise.all(partySizePromises)).filter(size => size !== null);
          
          if (availablePartySizes.length > 0) {
            availabilityPromises.push({
              date: dateStr,
              partySizes: availablePartySizes
            });
          }
        }
        
        const availability = await Promise.all(availabilityPromises);
        setAvailabilityData(availability.filter(item => item.partySizes.length > 0));
      } catch (error) {
        console.error("Error fetching availability data:", error);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    fetchAvailabilityData();
  }, [restaurant]);

  // Set default date and party size based on availability
  useEffect(() => {
    if (availabilityData.length > 0 && !date) {
      // Set the closest available date
      const closestDate = availabilityData[0].date;
      setDate(closestDate);
      
      // Set the smallest available party size for that date
      const smallestPartySize = Math.min(...availabilityData[0].partySizes);
      setPartySize(smallestPartySize);
    }
  }, [availabilityData, date]);

  // Available dates and party sizes
  const availableDates = useMemo(() => {
    return availabilityData.map(item => item.date);
  }, [availabilityData]);

  const availablePartySizes = useMemo(() => {
    const currentDateData = availabilityData.find(item => item.date === date);
    return currentDateData ? currentDateData.partySizes : [];
  }, [availabilityData, date]);

  // Fetch time slots when date or party size changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!restaurant || !date || !partySize) return;

      try {
        const response = await fetch(
          `/api/restaurants/${restaurant.slug}/availability?date=${date}&partySize=${partySize}`,
        );
        if (response.ok) {
          const data = await response.json();
          setTimeSlots(data);
        } else {
          setTimeSlots([]);
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        setTimeSlots([]);
      }
      setSelectedSlot(null);
    };

    fetchAvailability();
  }, [restaurant, date, partySize]);

  const handleReserveNow = async () => {
    if (!selectedSlot) {
      alert("Please select a time slot");
      return;
    }

    const token = localStorage.getItem("hogu_token");
    if (!token) {
      navigate("/login");
      return;
    }

    const slot = timeSlots.find((s) => s.id === selectedSlot);
    if (!slot) return;

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          restaurantSlug: restaurant?.slug,
          date: date,
          time: slot.time,
          partySize: partySize,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create reservation");
        return;
      }

      alert(
        `Reservation created! Status: ${data.status}\n${restaurant?.name} on ${date} at ${slot?.time} for ${partySize} ${partySize === 1 ? "person" : "people"}`,
      );

      // Reset selection and navigate to home
      setSelectedSlot(null);
      navigate("/");
    } catch (error) {
      console.error("Reservation error:", error);
      alert("Failed to create reservation. Please try again.");
    }
  };

  const handleMobileCTA = () => {
    const token = localStorage.getItem("hogu_token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (selectedSlot) {
      handleReserveNow();
    } else {
      bookingRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (loading || availabilityLoading) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Loading...</h1>
          <p className="text-slate-400">Finding available dates and times...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Restaurant not found</h1>
          <p className="text-slate-400">
            The restaurant you're looking for doesn't exist.
          </p>
          <Link to="/explore-tonight" className="btn btn-primary">
            ← Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="min-h-dvh bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">No availability</h1>
          <p className="text-slate-400">
            Unfortunately, {restaurant.name} has no available time slots in the next 30 days.
          </p>
          <Link to="/explore-tonight" className="btn btn-primary">
            ← Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh bg-slate-950 text-slate-100 pb-28 md:pb-0"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur border-b border-white/10 bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_6px_rgba(244,63,94,.18)]" />
          <div className="text-sm opacity-80">Explore · Bengaluru</div>
          <div className="ml-auto">
            <Link
              to="/explore-tonight"
              className="px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-sm font-medium hover:bg-slate-800/80"
            >
              ← Back to Map
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-10">
        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-xl">
          <img
            src={restaurant.heroImageUrl || `/api/restaurant/${restaurant.id}/hero-image`}
            alt={restaurant.name}
            className="w-full h-[38vh] sm:h-[42vh] md:h-[56vh] object-cover"
            style={{
              display: "block",
              width: "100%",
              height: "38vh",
              objectFit: "cover",
              backgroundColor: "#f3f4f6",
            }}
            loading="eager"
            onError={(e) => {
              console.error("=== HERO IMAGE LOAD ERROR ===");
              console.error("Failed to load image URL:", e.currentTarget.src);
              console.error("heroImageUrl from data:", restaurant.heroImageUrl);
              console.error("==============================");
              
              // Try dynamic endpoint if direct URL failed and we haven't already tried it
              if (!e.currentTarget.src.includes('/hero-image') && !e.currentTarget.src.includes('placeholder')) {
                console.log("Trying dynamic hero image endpoint...");
                e.currentTarget.src = `/api/restaurant/${restaurant.id}/hero-image`;
              } else if (e.currentTarget.src !== "/api/placeholder/400/300") {
                // Fallback to placeholder if all attempts fail
                e.currentTarget.src = "/api/placeholder/400/300";
              }
            }}
            onLoad={(e) => {
              console.log("=== HERO IMAGE LOADED SUCCESSFULLY ===");
              console.log("Loaded image URL:", restaurant.heroImageUrl);
              console.log("Image dimensions:", {
                width: e.currentTarget.width,
                height: e.currentTarget.height,
                naturalWidth: e.currentTarget.naturalWidth,
                naturalHeight: e.currentTarget.naturalHeight,
              });
              console.log("Image computed styles:", {
                display: window.getComputedStyle(e.currentTarget).display,
                visibility: window.getComputedStyle(e.currentTarget).visibility,
                opacity: window.getComputedStyle(e.currentTarget).opacity,
                position: window.getComputedStyle(e.currentTarget).position,
                zIndex: window.getComputedStyle(e.currentTarget).zIndex,
              });
              console.log("======================================");
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
            <div className="flex items-end justify-between gap-3 md:gap-4">
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <span className="text-2xl drop-shadow">
                    {restaurant.emoji}
                  </span>
                  {restaurant.hot && <Badge>🔥 HOT</Badge>}
                  <Chip active>{restaurant.neighborhood}</Chip>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                  {restaurant.name}
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  {restaurant.cuisineTags?.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div ref={bookingRef} className="mt-8 lg:mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Make a Reservation</h2>

              {/* Date Selection */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold">Date</label>
                <select
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    // Reset party size to smallest available for new date
                    const newDateData = availabilityData.find(item => item.date === e.target.value);
                    if (newDateData) {
                      const smallestPartySize = Math.min(...newDateData.partySizes);
                      setPartySize(smallestPartySize);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {availableDates.map((availableDate) => {
                    const dateObj = new Date(availableDate + 'T00:00:00');
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(today.getDate() + 1);
                    
                    let displayText = dateObj.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    });
                    
                    if (availableDate === today.toISOString().split('T')[0]) {
                      displayText += ' (Today)';
                    } else if (availableDate === tomorrow.toISOString().split('T')[0]) {
                      displayText += ' (Tomorrow)';
                    }
                    
                    return (
                      <option key={availableDate} value={availableDate}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Party Size Selection */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold">Party Size</label>
                <select
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-slate-100 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  {availablePartySizes.map((size) => (
                    <option key={size} value={size}>
                      {size} {size === 1 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slots */}
              {timeSlots.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-lg font-semibold">Available Times</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {timeSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`px-4 py-3 rounded-xl text-center font-medium transition ${
                            selectedSlot === slot.id
                              ? "bg-gradient-to-r from-rose-700 to-amber-600 text-white shadow-lg"
                              : "bg-slate-800 border border-slate-600 text-slate-200 hover:border-rose-500/40"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                  </div>
                  {timeSlots.filter((slot) => slot.available).length === 0 && (
                    <p className="text-slate-400 text-center py-4">
                      No available times for this date and party size.
                    </p>
                  )}
                </div>
              )}

              {/* Reserve Button */}
              {selectedSlot && (
                <button
                  onClick={handleReserveNow}
                  className="w-full py-4 px-6 bg-gradient-to-r from-rose-700 to-amber-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  Reserve Now
                </button>
              )}
            </div>

            {/* Restaurant Details */}
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4">Details</h3>
                <div className="space-y-0">
                  <Row label="Category">{restaurant.category}</Row>
                  <Row label="Neighborhood">{restaurant.neighborhood}</Row>
                  {restaurant.website && (
                    <Row label="Website">
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:text-rose-300 underline"
                      >
                        Visit
                      </a>
                    </Row>
                  )}
                  {restaurant.instagramUrl && (
                    <Row label="Instagram" last>
                      <a
                        href={restaurant.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-400 hover:text-rose-300 underline"
                      >
                        Follow
                      </a>
                    </Row>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur border-t border-white/10 md:hidden">
        <button
          onClick={handleMobileCTA}
          className="w-full py-4 px-6 bg-gradient-to-r from-rose-700 to-amber-600 text-white font-bold text-lg rounded-xl shadow-lg"
        >
          {selectedSlot ? "Reserve Now" : "Select Time"}
        </button>
      </div>
    </div>
  );
}
